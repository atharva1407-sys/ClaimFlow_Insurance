import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { audit, exposeDevOtp, fail, listRow, nextPatientCode, nextRequestId, withUniqueRetry } from '@/lib/api';
import { generateInviteToken, generateOtp, hashOtp, OTP_TTL_MS } from '@/lib/otp';
import { toMobile10 } from '@/lib/dates';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return fail(401, 'Not signed in');
    if (!session.hospitalId || !['HOSPITAL_STAFF', 'EMERGENCY_OPERATOR', 'DOCTOR'].includes(session.role)) return fail(403, 'Forbidden');

    // Hospital isolation is applied here on the server; doctors see only the cases assigned to them.
    const where = session.role === 'DOCTOR' ? { hospitalId: session.hospitalId, doctorId: session.id } : { hospitalId: session.hospitalId };
    const requests = await prisma.cashlessRequest.findMany({
      where,
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialization: true } },
        hospital: { select: { id: true, name: true, city: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ requests: requests.map(listRow) });
  } catch (error) {
    console.error('Fetch requests error:', error);
    return fail(500, 'Internal server error');
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'HOSPITAL_STAFF' || !session.hospitalId) return fail(403, 'Only hospital staff can create cashless requests');

    const body = await req.json().catch(() => ({}));
    const { existingPatientId, patientDetails, doctorId, admissionType } = body;
    if (admissionType && !['Planned', 'Emergency'].includes(admissionType)) return fail(400, 'Admission type must be Planned or Emergency');

    // Emergency cases go through the emergency portal, which needs a reason and a designated operator.
    if (admissionType === 'Emergency') return fail(400, 'Emergency admissions must be started from the Emergency portal');

    const hospital = await prisma.hospital.findUnique({ where: { id: session.hospitalId } });
    if (!hospital) return fail(404, 'Hospital not found');

    if (doctorId) {
      const doctor = await prisma.user.findFirst({ where: { id: doctorId, role: 'DOCTOR', status: 'ACTIVE', hospitalId: hospital.id } });
      if (!doctor) return fail(400, 'Selected doctor does not belong to this hospital');
    }

    let patientId: string;
    if (existingPatientId) {
      const existing = await prisma.patient.findFirst({ where: { id: existingPatientId, hospitalId: hospital.id } });
      if (!existing) return fail(404, 'Patient not found');
      patientId = existing.id;
    } else {
      const name = typeof patientDetails?.name === 'string' ? patientDetails.name.trim() : '';
      const phone = toMobile10(patientDetails?.phone);
      if (!name || phone.length !== 10) return fail(400, 'Patient name and a 10-digit mobile number are required');
      const created = await withUniqueRetry(async () =>
        prisma.patient.create({
          data: {
            patientCode: await nextPatientCode(),
            name: name.slice(0, 200),
            phone,
            email: typeof patientDetails.email === 'string' && patientDetails.email.trim() ? patientDetails.email.trim().slice(0, 120) : null,
            hospitalId: hospital.id,
          },
        })
      );
      patientId = created.id;
    }

    const otp = generateOtp();
    const provider = {
      hospitalName: hospital.name, city: hospital.city, state: hospital.state, pinCode: hospital.pinCode,
      hospitalId: hospital.hospitalIdCode ?? undefined, rohiniId: hospital.rohiniId ?? undefined,
      landmark: hospital.landmark ?? undefined, contactNo: hospital.contactNo, faxNo: hospital.faxNo ?? undefined,
      tpaDeskNo: hospital.tpaDeskNo ?? undefined, emailId: hospital.emailId,
    };

    const created = await withUniqueRetry(async () => {
      const requestId = await nextRequestId();
      return prisma.cashlessRequest.create({
        data: {
          requestId,
          hospitalId: hospital.id,
          patientId,
          doctorId: doctorId || null,
          createdById: session.id,
          status: 'IN_PROGRESS',
          // Section A is prefilled from the hospital profile but still has to be confirmed by the desk.
          sectionAStatus: 'IN_PROGRESS',
          providerData: JSON.stringify(provider),
          admissionData: JSON.stringify({ hospitalizationEventType: admissionType || undefined }),
          patientAccessToken: generateInviteToken(),
          patientOtp: hashOtp(otp, requestId),
          patientOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
        },
        include: { patient: true },
      });
    });

    await audit(created.id, { id: session.id, name: session.name, role: session.role }, 'REQUEST_CREATED', `Request ${created.requestId} created for ${created.patient.patientCode}`);

    return NextResponse.json({
      success: true,
      request: { id: created.id, requestId: created.requestId, status: created.status },
      patientAccessUrl: `/patient/access?id=${created.requestId}`,
      // No SMS gateway is connected yet; outside production the OTP is shown so the flow can be tested.
      ...(exposeDevOtp ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error('Create request error:', error);
    return fail(500, 'Internal server error');
  }
}
