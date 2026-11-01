import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { SessionUser, canAccessRequest, canEditSection, getPatientRequestId, getSession, isProd } from './auth';
import { EDITABLE_CASE_STATUSES, EDITABLE_SECTION_STATUSES, pendingEmergencyConfirmations, statusLabel } from './workflow';
import type { UserRole } from './types';

export const fail = (status: number, message: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error: message, ...extra }, { status });

export const requestInclude = {
  patient: true,
  hospital: true,
  doctor: { select: { id: true, name: true, specialization: true, qualification: true, registrationNo: true, phone: true } },
  createdBy: { select: { id: true, name: true, role: true } },
} satisfies Prisma.CashlessRequestInclude;

export type FullRequest = Prisma.CashlessRequestGetPayload<{ include: typeof requestInclude }>;

export type Actor = { kind: 'staff'; user: SessionUser } | { kind: 'patient' };

/** Administrator session, for user, hospital and audit management. Admins never get patient case data. */
export async function requireAdmin(req: NextRequest): Promise<{ user: SessionUser } | { res: NextResponse }> {
  const user = await getSession(req);
  if (!user) return { res: fail(401, 'Not signed in') };
  if (user.role !== 'ADMIN') return { res: fail(403, 'Administrators only') };
  return { user };
}

export const actorName = (a: Actor, r: FullRequest) => (a.kind === 'staff' ? a.user.name : r.patient.name);
export const actorRole = (a: Actor): string => (a.kind === 'staff' ? a.user.role : 'PATIENT');
export const roleOf = (a: Actor): UserRole => (a.kind === 'staff' ? a.user.role : 'PATIENT');

export function parseJson<T = any>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/** True when the call comes from a page under /patient (fetches and embedded PDFs both send the page as Referer). */
function fromPatientPortal(req: NextRequest): boolean {
  try {
    return new URL(req.headers.get('referer') ?? '').pathname.startsWith('/patient');
  } catch {
    return false;
  }
}

/**
 * Finds a request and checks the caller may see it. Inaccessible records answer 404, never 403,
 * so changing the ID in a URL reveals nothing about which IDs exist.
 */
export async function loadRequest(
  req: NextRequest,
  idParam: string,
  opts: { allowPatient?: boolean } = {}
): Promise<{ actor: Actor; request: FullRequest } | { res: NextResponse }> {
  const user = await getSession(req);
  const patientRid = opts.allowPatient ? getPatientRequestId(req) : null;
  if (!user && !patientRid) return { res: fail(401, 'Not signed in') };

  const request = await prisma.cashlessRequest.findFirst({
    where: { OR: [{ id: idParam }, { requestId: idParam }] },
    include: requestInclude,
  });
  const notFound = { res: fail(404, 'Request not found') };
  if (!request) return notFound;

  // A staff sign-in and a verified-patient session can share one browser. Calls made from a /patient page act as the
  // patient (the narrower role), anything else acts as staff when that applies, and a patient session for exactly
  // this request is still honoured as the fallback.
  const asPatient = !!patientRid && patientRid === request.id;
  if (asPatient && fromPatientPortal(req)) return { actor: { kind: 'patient' }, request };
  if (user && canAccessRequest(user, request)) return { actor: { kind: 'staff', user }, request };
  if (asPatient) return { actor: { kind: 'patient' }, request };
  return notFound;
}

export async function audit(
  requestDbId: string | null,
  actor: { id?: string | null; name?: string | null; role?: string | null },
  action: string,
  details?: string
) {
  await prisma.auditLog.create({
    data: { requestId: requestDbId, userId: actor.id ?? null, userName: actor.name ?? null, userRole: actor.role ?? null, action, details: details ?? null },
  });
}

export const auditActor = (a: Actor, r: FullRequest) =>
  a.kind === 'staff' ? { id: a.user.id, name: a.user.name, role: a.user.role } : { id: null, name: r.patient.name, role: 'PATIENT' };

type SectionKey = 'A' | 'B' | 'C' | 'D';

export function sectionStatusOf(r: FullRequest, s: SectionKey): string {
  return { A: r.sectionAStatus, B: r.sectionBStatus, C: r.sectionCStatus, D: r.sectionDStatus }[s];
}

/** Which sections this role may edit right now, given the case and section statuses. */
export function editableSections(r: FullRequest, role: UserRole): Record<SectionKey, boolean> {
  const caseOpen = EDITABLE_CASE_STATUSES.includes(r.status);
  const out = {} as Record<SectionKey, boolean>;
  for (const s of ['A', 'B', 'C', 'D'] as SectionKey[]) {
    const st = sectionStatusOf(r, s);
    const statusOk = r.isEmergency ? st !== 'REVIEWED' : EDITABLE_SECTION_STATUSES.includes(st);
    out[s] = caseOpen && statusOk && canEditSection({ role }, s, r.isEmergency);
  }
  return out;
}

/** Strips secrets, and for patients everything outside Section B. Dates stay as stored digit strings. */
export function buildView(r: FullRequest, actor: Actor) {
  const role = roleOf(actor);
  const common = {
    id: r.id,
    requestId: r.requestId,
    status: r.status,
    statusLabel: statusLabel(r),
    isEmergency: r.isEmergency,
    sectionBStatus: r.sectionBStatus,
    patientSectionNote: r.patientSectionNote,
    caseVersion: r.caseVersion,
    editable: editableSections(r, role),
    hospital: { name: r.hospital.name },
    patient: { name: r.patient.name, patientCode: r.patient.patientCode },
    patientData: parseJson(r.patientData),
    // What the desk already recorded for this patient, offered as starting values on Section B (the patient confirms or edits).
    prefill: { patientName: r.patient.name, patientContactNo: r.patient.phone || undefined, insuredEmailId: r.patient.email || undefined },
  };
  if (actor.kind === 'patient') return common;

  return {
    ...common,
    emergencyReason: r.emergencyReason,
    emergencyOperatorId: r.emergencyOperatorId,
    emergencyDoctorConfirmed: r.emergencyDoctorConfirmed,
    emergencyPatientConfirmed: r.emergencyPatientConfirmed,
    emergencySupervisorReviewed: r.emergencySupervisorReviewed,
    emergencyPending: pendingEmergencyConfirmations(r),
    sectionAStatus: r.sectionAStatus,
    sectionCStatus: r.sectionCStatus,
    sectionDStatus: r.sectionDStatus,
    doctorSectionNote: r.doctorSectionNote,
    tpaReferenceNo: r.tpaReferenceNo,
    tpaSubmissionDate: r.tpaSubmissionDate,
    tpaQueryNotes: r.tpaQueryNotes,
    tpaApprovalAmount: r.tpaApprovalAmount,
    tpaDenialReason: r.tpaDenialReason,
    currentVersion: r.currentVersion,
    latestPdfPath: undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    patientRecord: { id: r.patient.id, name: r.patient.name, patientCode: r.patient.patientCode, phone: r.patient.phone, email: r.patient.email, gender: r.patient.gender, ageYears: r.patient.ageYears },
    doctor: r.doctor,
    hospitalRecord: { id: r.hospital.id, name: r.hospital.name, city: r.hospital.city },
    createdBy: r.createdBy,
    providerData: parseJson(r.providerData),
    clinicalData: parseJson(r.clinicalData),
    admissionData: parseJson(r.admissionData) ?? parseJson(r.expenseData),
    chronicData: parseJson(r.chronicData),
    declarationsData: parseJson(r.declarationsData),
    sectionMeta: parseJson(r.sectionMeta) ?? {},
  };
}

/** Request list rows: no secrets, no clinical or financial payloads. */
export function listRow(r: Prisma.CashlessRequestGetPayload<{ include: { patient: true; doctor: { select: { id: true; name: true; specialization: true } }; hospital: { select: { id: true; name: true; city: true } } } }>) {
  return {
    id: r.id,
    requestId: r.requestId,
    status: r.status,
    statusLabel: statusLabel(r),
    isEmergency: r.isEmergency,
    sectionAStatus: r.sectionAStatus,
    sectionBStatus: r.sectionBStatus,
    sectionCStatus: r.sectionCStatus,
    sectionDStatus: r.sectionDStatus,
    emergencyPending: pendingEmergencyConfirmations(r),
    caseVersion: r.caseVersion,
    currentVersion: r.currentVersion,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    patient: { name: r.patient.name, patientCode: r.patient.patientCode, gender: r.patient.gender, ageYears: r.patient.ageYears },
    doctor: r.doctor,
    hospital: r.hospital,
  };
}

function isUniqueViolation(e: unknown) {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';
}

/** Runs `fn` with a freshly computed sequence number, retrying if a concurrent insert took it. */
export async function withUniqueRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      last = e;
    }
  }
  throw last;
}

export async function nextRequestId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CR-${year}-`;
  const rows = await prisma.cashlessRequest.findMany({ where: { requestId: { startsWith: prefix } }, select: { requestId: true } });
  const max = rows.reduce((m, r) => {
    const n = /^CR-\d{4}-(\d{5})$/.exec(r.requestId);
    return n ? Math.max(m, parseInt(n[1], 10)) : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(5, '0')}`;
}

export async function nextPatientCode(): Promise<string> {
  const rows = await prisma.patient.findMany({ select: { patientCode: true } });
  const max = rows.reduce((m, r) => {
    const n = /^PAT-(\d{6})$/.exec(r.patientCode);
    return n ? Math.max(m, parseInt(n[1], 10)) : m;
  }, 0);
  return `PAT-${String(max + 1).padStart(6, '0')}`;
}

/** Outside production the OTP is returned to the caller because no SMS gateway is connected. */
export const exposeDevOtp = !isProd;

export function mergeMeta(existing: string | null, section: SectionKey, entry: { enteredBy: string; enteredByRole: string; verified: boolean }) {
  const meta = parseJson<Record<string, unknown>>(existing) ?? {};
  meta[section] = { ...entry, enteredAt: new Date().toISOString() };
  return JSON.stringify(meta);
}
