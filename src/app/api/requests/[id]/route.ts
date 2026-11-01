import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  Actor, FullRequest, actorName, audit, auditActor, buildView, editableSections, exposeDevOtp, fail, loadRequest, mergeMeta, parseJson, roleOf,
} from '@/lib/api';
import { canEditSection } from '@/lib/auth';
import { EDITABLE_CASE_STATUSES, STATUS_TRANSITIONS, allSectionsDone, deriveStatus } from '@/lib/workflow';
import {
  admissionSchema, chronicSchema, clinicalSchema, compact, doctorBlockSchema, formatIssues, patientSchema, providerSchema,
} from '@/lib/schemas';
import { validateRequestRecord } from '@/lib/validate-request';
import { friendlyIssues } from '@/lib/field-labels';
import { generateInviteToken, generateOtp, hashOtp, OTP_TTL_MS } from '@/lib/otp';

export const dynamic = 'force-dynamic';

type Section = 'A' | 'B' | 'C' | 'D';
const SECTIONS: Section[] = ['A', 'B', 'C', 'D'];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id, { allowPatient: true });
    if ('res' in found) return found.res;
    const { actor, request } = found;

    const view: any = buildView(request, actor);
    if (actor.kind === 'staff') {
      const [versions, auditLogs] = await Promise.all([
        prisma.documentVersion.findMany({ where: { requestId: request.id }, orderBy: { version: 'desc' }, select: { id: true, version: true, caseVersion: true, templateVersion: true, generatedAt: true, generatedBy: true, reason: true, isOutdated: true } }),
        prisma.auditLog.findMany({ where: { requestId: request.id }, orderBy: { timestamp: 'desc' }, take: 200 }),
      ]);
      // The stored file stays on the server; the PDF is fetched through the authenticated route.
      view.versions = versions.map((v) => ({
        id: v.id, version: v.version, caseVersion: v.caseVersion, templateVersion: v.templateVersion,
        generatedAt: v.generatedAt, generatedBy: v.generatedBy, reason: v.reason, isOutdated: v.isOutdated || v.caseVersion !== request.caseVersion,
      }));
      view.auditLogs = auditLogs;
    }
    if (actor.kind === 'patient') {
      const latest = await prisma.documentVersion.findFirst({ where: { requestId: request.id }, orderBy: { version: 'desc' }, select: { id: true, version: true, caseVersion: true, templateVersion: true, generatedAt: true, generatedBy: true, reason: true, isOutdated: true } });
      view.pdf = latest ? { version: latest.version, generatedAt: latest.generatedAt, outdated: latest.isOutdated || latest.caseVersion !== request.caseVersion } : null;
    }
    return NextResponse.json({ request: view });
  } catch (error) {
    console.error('Get request error:', error);
    return fail(500, 'Internal server error');
  }
}

function changedKeys(before: Record<string, any> | null, after: Record<string, any>): string[] {
  return Object.keys(after).filter((k) => JSON.stringify(before?.[k] ?? null) !== JSON.stringify(after[k] ?? null));
}

function parseSection(section: Section, data: any) {
  switch (section) {
    case 'A':
      return providerSchema.safeParse(data);
    case 'B':
      return patientSchema.safeParse(data);
    case 'D':
      return admissionSchema.safeParse(data);
    default:
      return null;
  }
}

/**
 * Permanently deletes one case for the hospital desk: the case record, every saved PDF version and its file,
 * all supporting documents and their files, and the case's audit entries. The patient record goes too unless the
 * patient has other cases. One entry stays in the audit log saying who deleted which Request ID, with no patient data.
 * The caller must send the Request ID back as `confirm`, so a stray click or a guessed URL cannot delete a case.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id);
    if ('res' in found) return found.res;
    const { actor, request } = found;
    if (actor.kind !== 'staff' || actor.user.role !== 'HOSPITAL_STAFF') return fail(403, 'Only hospital staff can delete a case');
    if (new URL(req.url).searchParams.get('confirm') !== request.requestId) return fail(400, 'Type the Request ID to confirm the deletion');

    const otherCases = await prisma.cashlessRequest.count({ where: { patientId: request.patientId, NOT: { id: request.id } } });

    await prisma.$transaction(async (tx) => {
      await tx.claimChecklistDocument.deleteMany({ where: { requestId: request.id } });
      await tx.documentVersion.deleteMany({ where: { requestId: request.id } });
      await tx.auditLog.deleteMany({ where: { requestId: request.id } });
      await tx.cashlessRequest.delete({ where: { id: request.id } });
      if (otherCases === 0) await tx.patient.delete({ where: { id: request.patientId } });
      await tx.auditLog.create({
        data: { requestId: null, userId: actor.user.id, userName: actor.user.name, userRole: actor.user.role, action: 'CASE_DELETED', details: `Request ${request.requestId} deleted` },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete case error:', error);
    return fail(500, 'Failed to delete the case');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id, { allowPatient: true });
    if ('res' in found) return found.res;
    const { actor, request } = found;

    const body = await req.json().catch(() => null);
    if (!body || typeof body.action !== 'string') return fail(400, 'Invalid request body');

    switch (body.action) {
      case 'SAVE_SECTION':
      case 'SUBMIT_SECTION':
        return await saveSection(actor, request, body);
      case 'RETURN_SECTION':
      case 'REVIEW_SECTION':
        return await reviewSection(actor, request, body);
      case 'ASSIGN_DOCTOR':
        return await assignDoctor(actor, request, body);
      case 'UPDATE_STATUS':
        return await updateStatus(actor, request, body);
      case 'EMERGENCY_CONFIRM':
        return await emergencyConfirm(actor, request, body);
      case 'REISSUE_INVITE':
      case 'REVOKE_INVITE':
        return await manageInvite(actor, request, body.action);
      default:
        return fail(400, 'Unknown action');
    }
  } catch (error) {
    console.error('Update request error:', error);
    return fail(500, 'Internal server error');
  }
}

/** Common tail of every data-changing write: new case version, older PDFs outdated, status re-derived. */
async function commit(request: FullRequest, data: Prisma.CashlessRequestUpdateInput, actor: Actor, action: string, details: string, dataChanged = true) {
  const next = {
    sectionAStatus: request.sectionAStatus, sectionBStatus: request.sectionBStatus,
    sectionCStatus: request.sectionCStatus, sectionDStatus: request.sectionDStatus, status: request.status,
    ...(data as Record<string, any>),
  };
  const derived = deriveStatus({ ...next, status: (data as any).status ?? request.status });
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.cashlessRequest.update({
      where: { id: request.id },
      data: { ...data, status: derived, ...(dataChanged ? { caseVersion: { increment: 1 } } : {}) },
      include: { patient: true, hospital: true, doctor: { select: { id: true, name: true, specialization: true, qualification: true, registrationNo: true, phone: true } }, createdBy: { select: { id: true, name: true, role: true } } },
    });
    if (dataChanged) await tx.documentVersion.updateMany({ where: { requestId: request.id, isOutdated: false }, data: { isOutdated: true } });
    const a = auditActor(actor, request);
    await tx.auditLog.create({ data: { requestId: request.id, userId: a.id, userName: a.name, userRole: a.role, action, details } });
    return u;
  });
  return NextResponse.json({ success: true, request: buildView(updated, actor) });
}

async function saveSection(actor: Actor, request: FullRequest, body: any) {
  const section = body.section as Section;
  if (!SECTIONS.includes(section)) return fail(400, 'Unknown section');
  const role = roleOf(actor);

  if (!canEditSection({ role }, section, request.isEmergency)) return fail(403, `Your role cannot edit Section ${section}`);
  if (!editableSections(request, role)[section]) {
    return fail(409, EDITABLE_CASE_STATUSES.includes(request.status) ? `Section ${section} is locked (already submitted). Ask the hospital desk to return it for correction.` : 'This case can no longer be edited');
  }

  const submit = body.action === 'SUBMIT_SECTION';
  const data = body.data ?? {};
  const update: Prisma.CashlessRequestUpdateInput = {};
  const changed: string[] = [];

  const merge = (existingJson: string | null, parsed: Record<string, unknown>) => {
    const existing = parseJson<Record<string, any>>(existingJson) ?? {};
    const next = { ...existing, ...compact(parsed) };
    changed.push(...changedKeys(existing, next));
    return JSON.stringify(next);
  };
  const reject = (error: any) => fail(400, friendlyIssues(error), { fields: error.issues.map((i: any) => i.path.join('.')) });

  if (section === 'C') {
    const clinical = clinicalSchema.safeParse(data.clinical ?? {});
    const chronic = chronicSchema.safeParse(data.chronic ?? {});
    const block = doctorBlockSchema.safeParse(data.doctorBlock ?? {});
    if (!clinical.success) return reject(clinical.error);
    if (!chronic.success) return reject(chronic.error);
    if (!block.success) return reject(block.error);
    update.clinicalData = merge(request.clinicalData, clinical.data);
    update.chronicData = merge(request.chronicData, chronic.data);
    const existingDec = parseJson<Record<string, any>>(request.declarationsData) ?? {};
    const nextDec = {
      ...existingDec,
      ...compact({ page2DoctorName: block.data.name, page2DoctorQualification: block.data.qualification, page2DoctorRegistrationNo: block.data.registrationNo }),
    };
    changed.push(...changedKeys(existingDec, nextDec));
    update.declarationsData = JSON.stringify(nextDec);
  } else {
    const parsed = parseSection(section, data)!;
    if (!parsed.success) return reject(parsed.error);
    const column = { A: 'providerData', B: 'patientData', D: 'admissionData' }[section as 'A' | 'B' | 'D'] as 'providerData' | 'patientData' | 'admissionData';
    const existingJson = column === 'admissionData' ? request.admissionData ?? request.expenseData : request[column];
    update[column] = merge(existingJson, parsed.data);
  }

  const statusKey = `section${section}Status` as 'sectionAStatus';
  const current = request[statusKey];
  if (submit) update[statusKey] = 'SUBMITTED';
  else if (current === 'NOT_STARTED') update[statusKey] = 'IN_PROGRESS';
  if (submit && section === 'B') update.patientSectionNote = null;
  if (submit && section === 'C') update.doctorSectionNote = null;

  // Who entered the section and whether it is verified. Clinical data typed by a non-doctor stays "unverified".
  const verified = section === 'C' ? role === 'DOCTOR' : role !== 'EMERGENCY_OPERATOR';
  update.sectionMeta = mergeMeta(request.sectionMeta, section, { enteredBy: actorName(actor, request), enteredByRole: role, verified });

  const unique = [...new Set(changed)];
  return commit(request, update, actor, `SECTION_${section}_${submit ? 'SUBMITTED' : 'SAVED'}`, unique.length ? `Fields changed: ${unique.join(', ')}` : 'No field values changed');
}

async function reviewSection(actor: Actor, request: FullRequest, body: any) {
  if (actor.kind !== 'staff' || actor.user.role !== 'HOSPITAL_STAFF') return fail(403, 'Only hospital staff can review or return sections');
  const section = body.section as Section;
  if (!SECTIONS.includes(section)) return fail(400, 'Unknown section');
  const statusKey = `section${section}Status` as 'sectionAStatus';
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';

  if (body.action === 'RETURN_SECTION') {
    if (!note) return fail(400, 'A note explaining the correction is required');
    if (!['SUBMITTED', 'REVIEWED'].includes(request[statusKey])) return fail(409, 'Only a submitted section can be returned');
    const update: Prisma.CashlessRequestUpdateInput = { [statusKey]: 'RETURNED_FOR_CORRECTION' };
    if (section === 'B') update.patientSectionNote = note;
    if (section === 'C') update.doctorSectionNote = note;
    return commit(request, update, actor, `SECTION_${section}_RETURNED`, `Returned Section ${section}: ${note}`, false);
  }
  if (request[statusKey] !== 'SUBMITTED') return fail(409, 'Only a submitted section can be marked reviewed');
  return commit(request, { [statusKey]: 'REVIEWED' }, actor, `SECTION_${section}_REVIEWED`, `Section ${section} reviewed`, false);
}

async function assignDoctor(actor: Actor, request: FullRequest, body: any) {
  if (actor.kind !== 'staff' || actor.user.role !== 'HOSPITAL_STAFF') return fail(403, 'Only hospital staff can assign a doctor');
  const doctor = await prisma.user.findFirst({ where: { id: String(body.doctorId || ''), role: 'DOCTOR', status: 'ACTIVE', hospitalId: request.hospitalId } });
  if (!doctor) return fail(400, 'Doctor not found in this hospital');
  return commit(request, { doctor: { connect: { id: doctor.id } } }, actor, 'DOCTOR_ASSIGNED', `Assigned ${doctor.name}`, false);
}

async function updateStatus(actor: Actor, request: FullRequest, body: any) {
  if (actor.kind !== 'staff' || actor.user.role !== 'HOSPITAL_STAFF') return fail(403, 'Only hospital staff can change the case status');
  const target = String(body.newStatus || '');
  const allowed = STATUS_TRANSITIONS[request.status] ?? [];
  if (!allowed.includes(target)) return fail(409, `A case in "${request.status}" cannot move to "${target}".`);

  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : '';
  const update: Prisma.CashlessRequestUpdateInput = { status: target };

  if (target === 'SUBMITTED_TO_TPA') {
    if (!allSectionsDone(request)) return fail(409, 'All four sections must be submitted before sending to the TPA');
    const check = validateRequestRecord(request);
    if (!check.finalisable) return fail(409, 'The case still has blocking issues', { blockers: check.blockers });
    const latest = await prisma.documentVersion.findFirst({ where: { requestId: request.id }, orderBy: { version: 'desc' }, select: { id: true, version: true, caseVersion: true, templateVersion: true, generatedAt: true, generatedBy: true, reason: true, isOutdated: true } });
    if (!latest || latest.isOutdated || latest.caseVersion !== request.caseVersion) return fail(409, 'Generate a current PDF version before sending to the TPA');
    if (request.status === 'TPA_QUERY' || request.status === 'ENHANCEMENT_REQUESTED') {
      const lastSent = await prisma.auditLog.findFirst({ where: { requestId: request.id, action: 'STATUS_CHANGED', details: { contains: '-> SUBMITTED_TO_TPA' } }, orderBy: { timestamp: 'desc' } });
      const prev = lastSent ? /PDF v(\d+)/.exec(lastSent.details ?? '') : null;
      if (prev && latest.version <= Number(prev[1])) return fail(409, 'A resubmission needs a new PDF version');
    }
    update.tpaSubmissionDate = new Date();
    if (typeof body.tpaReferenceNo === 'string' && body.tpaReferenceNo.trim()) update.tpaReferenceNo = body.tpaReferenceNo.trim().slice(0, 60);
    body.__version = latest.version;
  }
  if (target === 'TPA_QUERY') {
    if (!note) return fail(400, 'Enter the query text from the TPA');
    update.tpaQueryNotes = note;
  }
  if (target === 'TPA_REJECTED') {
    if (!note) return fail(400, 'Enter the rejection reason');
    update.tpaDenialReason = note;
  }
  if (target === 'TPA_APPROVED' && body.tpaApprovalAmount !== undefined && body.tpaApprovalAmount !== '') {
    const amt = Number(body.tpaApprovalAmount);
    if (!Number.isFinite(amt) || amt < 0) return fail(400, 'Approved amount must be a positive number');
    update.tpaApprovalAmount = amt;
  }

  const pending = request.isEmergency && target === 'SUBMITTED_TO_TPA' ? ' (emergency case: confirmations may still be pending)' : '';
  const version = body.__version ? ` (PDF v${body.__version})` : '';
  return commit(request, update, actor, 'STATUS_CHANGED', `${request.status} -> ${target}${version}${note ? `: ${note}` : ''}${pending}`, false);
}

async function emergencyConfirm(actor: Actor, request: FullRequest, body: any) {
  if (!request.isEmergency) return fail(409, 'Not an emergency case');
  const type = String(body.confirmType || '');
  const now = new Date();

  if (type === 'DOCTOR') {
    if (actor.kind !== 'staff' || actor.user.role !== 'DOCTOR') return fail(403, 'Only the assigned treating doctor can confirm Section C');
    if (request.emergencyDoctorConfirmed) return fail(409, 'Already confirmed');
    return commit(request, { emergencyDoctorConfirmed: true, emergencyDoctorConfirmedAt: now, sectionMeta: mergeMeta(request.sectionMeta, 'C', { enteredBy: actor.user.name, enteredByRole: 'DOCTOR', verified: true }) },
      actor, 'EMERGENCY_DOCTOR_CONFIRMED', 'Doctor verified Section C', false);
  }
  if (type === 'PATIENT') {
    if (actor.kind !== 'patient') return fail(403, 'Only the patient or representative (verified by OTP) can confirm Section B');
    if (request.emergencyPatientConfirmed) return fail(409, 'Already confirmed');
    return commit(request, { emergencyPatientConfirmed: true, emergencyPatientConfirmedAt: now, sectionMeta: mergeMeta(request.sectionMeta, 'B', { enteredBy: request.patient.name, enteredByRole: 'PATIENT', verified: true }) },
      actor, 'EMERGENCY_PATIENT_CONFIRMED', 'Patient/representative confirmed Section B', false);
  }
  if (type === 'SUPERVISOR') {
    // No supervisor role exists yet (open question): any other hospital-desk user may review, but never the operator who made the entry.
    if (actor.kind !== 'staff' || actor.user.role !== 'HOSPITAL_STAFF') return fail(403, 'Only hospital staff can review an emergency entry');
    if (actor.user.id === request.emergencyOperatorId) return fail(403, 'The operator who made the emergency entry cannot review it');
    if (request.emergencySupervisorReviewed) return fail(409, 'Already reviewed');
    return commit(request, { emergencySupervisorReviewed: true, emergencySupervisorReviewedAt: now },
      actor, 'EMERGENCY_SUPERVISOR_REVIEWED', 'Emergency entry reviewed', false);
  }
  return fail(400, 'Unknown confirmation type');
}

async function manageInvite(actor: Actor, request: FullRequest, action: string) {
  if (actor.kind !== 'staff' || !['HOSPITAL_STAFF', 'EMERGENCY_OPERATOR'].includes(actor.user.role)) return fail(403, 'Only hospital staff can manage the patient invitation');
  if (action === 'REVOKE_INVITE') {
    await prisma.cashlessRequest.update({ where: { id: request.id }, data: { patientOtp: null, patientOtpExpiresAt: null, patientAccessToken: null } });
    await audit(request.id, auditActor(actor, request), 'PATIENT_INVITE_REVOKED');
    return NextResponse.json({ success: true });
  }
  const otp = generateOtp();
  await prisma.cashlessRequest.update({
    where: { id: request.id },
    data: {
      patientAccessToken: generateInviteToken(),
      patientOtp: hashOtp(otp, request.requestId),
      patientOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      patientOtpAttempts: 0,
    },
  });
  await audit(request.id, auditActor(actor, request), 'PATIENT_INVITE_ISSUED');
  return NextResponse.json({ success: true, patientAccessUrl: `/patient/access?id=${request.requestId}`, ...(exposeDevOtp ? { devOtp: otp } : {}) });
}
