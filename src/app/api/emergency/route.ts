import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { audit, buildView, exposeDevOtp, fail, mergeMeta, nextPatientCode, nextRequestId, requestInclude, withUniqueRetry } from '@/lib/api';
import { generateCashlessPdfWithReport } from '@/lib/pdf-generator';
import { pdfOptionsWithAttachments } from '@/lib/attachments';
import { pdfKey, savePdf } from '@/lib/storage';
import { toMobile10 } from '@/lib/dates';
import { friendlyIssues } from '@/lib/field-labels';
import { generateInviteToken, generateOtp, hashOtp, OTP_TTL_MS } from '@/lib/otp';
import { admissionSchema, chronicSchema, clinicalSchema, compact, doctorBlockSchema, formatIssues, patientSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

// The minimum set of fields before generation is an open question for the hospital.
// Until it is answered only the patient name and the mandatory reason are required, and
// nothing else is defaulted: every other empty field stays blank on the PDF.
const MIN_REASON_LENGTH = 3;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'EMERGENCY_OPERATOR' || !session.hospitalId) {
      return fail(403, 'Only designated Emergency Operators can start emergency mode');
    }

    const body = await req.json().catch(() => null);
    if (!body) return fail(400, 'Invalid request body');

    const reason = typeof body.emergencyReason === 'string' ? body.emergencyReason.trim().slice(0, 500) : '';
    if (reason.length < MIN_REASON_LENGTH) return fail(400, 'A short reason is mandatory to start emergency mode');

    const patientIn = patientSchema.safeParse(body.patient ?? {});
    const clinicalIn = clinicalSchema.safeParse(body.clinical ?? {});
    const chronicIn = chronicSchema.safeParse(body.chronic ?? {});
    const doctorBlockIn = doctorBlockSchema.safeParse(body.doctorBlock ?? {});
    const admissionIn = admissionSchema.safeParse(body.admission ?? {});
    for (const r of [patientIn, clinicalIn, chronicIn, doctorBlockIn, admissionIn]) {
      if (!r.success) return fail(400, friendlyIssues(r.error), { fields: r.error.issues.map((i: any) => i.path.join('.')) });
    }
    const patientData = compact(patientIn.data!);
    const clinicalData = compact(clinicalIn.data!);
    const admissionData = { ...compact(admissionIn.data!), hospitalizationEventType: 'Emergency' as const };
    const chronicData = compact(chronicIn.data!);
    const doctorBlock = compact(doctorBlockIn.data!);

    if (!patientData.patientName) return fail(400, 'Patient name is required');

    const hospital = await prisma.hospital.findUnique({ where: { id: session.hospitalId } });
    if (!hospital) return fail(404, 'Hospital not found');

    // Treating doctor from the directory, scoped to this hospital.
    let doctorId: string | null = null;
    if (body.doctorId) {
      const d = await prisma.user.findFirst({ where: { id: String(body.doctorId), role: 'DOCTOR', status: 'ACTIVE', hospitalId: hospital.id } });
      if (!d) return fail(400, 'Selected doctor does not belong to this hospital');
      doctorId = d.id;
    }

    // If the operator is the treating doctor, their own profile fills the doctor items and Section C counts as doctor-verified.
    const operatorIsDoctor = body.operatorIsDoctor === true;
    if (operatorIsDoctor) {
      const me = await prisma.user.findUnique({ where: { id: session.id } });
      if (!me?.registrationNo) return fail(400, 'Your profile has no registration number, so you cannot be recorded as the treating doctor');
      clinicalData.treatingDoctorName ||= me.name;
      clinicalData.treatingDoctorContactNo ||= toMobile10(me.phone);
      doctorBlock.name ||= me.name;
      doctorBlock.qualification ||= me.qualification ?? undefined;
      doctorBlock.registrationNo ||= me.registrationNo;
    }

    let existingPatientId: string | null = null;
    if (body.existingPatientId) {
      const p = await prisma.patient.findFirst({ where: { id: String(body.existingPatientId), hospitalId: hospital.id } });
      if (!p) return fail(404, 'Patient not found');
      existingPatientId = p.id;
    }

    const operator = session.name;
    const meta = (verified: boolean, base: string | null) => mergeMeta(base, 'A', { enteredBy: operator, enteredByRole: 'EMERGENCY_OPERATOR', verified });
    let sectionMeta = meta(true, null); // A: copied from the hospital profile
    sectionMeta = mergeMeta(sectionMeta, 'B', { enteredBy: operator, enteredByRole: 'EMERGENCY_OPERATOR', verified: false });
    sectionMeta = mergeMeta(sectionMeta, 'C', { enteredBy: operator, enteredByRole: operatorIsDoctor ? 'DOCTOR' : 'EMERGENCY_OPERATOR', verified: operatorIsDoctor });
    sectionMeta = mergeMeta(sectionMeta, 'D', { enteredBy: operator, enteredByRole: 'EMERGENCY_OPERATOR', verified: false });

    const provider = {
      hospitalName: hospital.name, city: hospital.city, state: hospital.state, pinCode: hospital.pinCode,
      hospitalId: hospital.hospitalIdCode ?? undefined, rohiniId: hospital.rohiniId ?? undefined,
      landmark: hospital.landmark ?? undefined, contactNo: hospital.contactNo, faxNo: hospital.faxNo ?? undefined,
      tpaDeskNo: hospital.tpaDeskNo ?? undefined, emailId: hospital.emailId,
    };

    const otp = generateOtp();
    const created = await withUniqueRetry(async () => {
      const patientId =
        existingPatientId ??
        (
          await prisma.patient.create({
            data: {
              patientCode: await nextPatientCode(),
              name: String(patientData.patientName).slice(0, 200),
              phone: String(patientData.patientContactNo ?? ''), // may be unknown in an emergency; filled later
              email: patientData.insuredEmailId || null,
              hospitalId: hospital.id,
            },
          })
        ).id;
      const requestId = await nextRequestId();
      return prisma.cashlessRequest.create({
        data: {
          requestId,
          hospitalId: hospital.id,
          patientId,
          doctorId,
          createdById: session.id,
          status: 'READY_FOR_REVIEW',
          isEmergency: true,
          emergencyReason: reason,
          emergencyOperatorId: session.id,
          emergencyDoctorConfirmed: operatorIsDoctor,
          emergencyDoctorConfirmedAt: operatorIsDoctor ? new Date() : null,
          sectionAStatus: 'SUBMITTED',
          sectionBStatus: 'SUBMITTED',
          sectionCStatus: 'SUBMITTED',
          sectionDStatus: 'SUBMITTED',
          providerData: JSON.stringify(provider),
          patientData: JSON.stringify(patientData),
          clinicalData: JSON.stringify(clinicalData),
          admissionData: JSON.stringify(admissionData),
          chronicData: Object.keys(chronicData).length ? JSON.stringify(chronicData) : null,
          declarationsData: Object.keys(doctorBlock).length
            ? JSON.stringify({ page2DoctorName: doctorBlock.name, page2DoctorQualification: doctorBlock.qualification, page2DoctorRegistrationNo: doctorBlock.registrationNo })
            : null,
          sectionMeta,
          patientAccessToken: generateInviteToken(),
          patientOtp: hashOtp(otp, requestId),
          patientOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
        },
        include: requestInclude,
      });
    });

    await audit(created.id, { id: session.id, name: session.name, role: session.role }, 'EMERGENCY_MODE_INITIATED', `Emergency mode started by ${session.name}. Reason: ${reason}`);

    // Generate the original four-page PDF straight away. A value that does not fit is reported, never truncated.
    const { bytes, issues, templateVersion } = await generateCashlessPdfWithReport(await pdfOptionsWithAttachments(created));
    let version: number | null = null;
    if (issues.length === 0) {
      const key = pdfKey(created.requestId, 1);
      savePdf(key, bytes);
      await prisma.$transaction([
        prisma.documentVersion.create({
          data: { requestId: created.id, version: 1, caseVersion: created.caseVersion, templateVersion, filePath: key, generatedBy: session.name, reason: 'Emergency generation' },
        }),
        prisma.cashlessRequest.update({ where: { id: created.id }, data: { currentVersion: 1, latestPdfPath: key } }),
      ]);
      await audit(created.id, { id: session.id, name: session.name, role: session.role }, 'PDF_GENERATED', 'Version 1 (emergency)');
      version = 1;
    }

    return NextResponse.json({
      success: true,
      request: buildView(created, { kind: 'staff', user: session }),
      pdfVersion: version,
      pdfUrl: version ? `/api/requests/${created.requestId}/pdf?version=1` : null,
      issues,
      ...(exposeDevOtp ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error('Emergency request error:', error);
    return fail(500, 'Internal server error');
  }
}
