// Case/section status rules. No Prisma import so the seed script can reuse this.

export const PRE_SUBMISSION = ['DRAFT', 'IN_PROGRESS', 'AWAITING_PATIENT', 'AWAITING_DOCTOR', 'READY_FOR_REVIEW'];

/** Statuses in which section data may still be edited. */
export const EDITABLE_CASE_STATUSES = [...PRE_SUBMISSION, 'TPA_QUERY', 'ENHANCEMENT_REQUESTED'];

/** Section statuses in which the owner may still edit (outside emergency mode). */
export const EDITABLE_SECTION_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'RETURNED_FOR_CORRECTION'];

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  READY_FOR_REVIEW: ['SUBMITTED_TO_TPA'],
  SUBMITTED_TO_TPA: ['TPA_QUERY', 'TPA_APPROVED', 'TPA_REJECTED'],
  TPA_QUERY: ['SUBMITTED_TO_TPA'],
  TPA_APPROVED: ['ENHANCEMENT_REQUESTED', 'DISCHARGED'],
  ENHANCEMENT_REQUESTED: ['SUBMITTED_TO_TPA', 'TPA_APPROVED', 'TPA_REJECTED'],
  TPA_REJECTED: ['CLOSED'],
  DISCHARGED: ['CLOSED'],
};

export interface SectionStatuses {
  sectionAStatus: string;
  sectionBStatus: string;
  sectionCStatus: string;
  sectionDStatus: string;
}

export const isDone = (s: string) => s === 'SUBMITTED' || s === 'REVIEWED';

export function allSectionsDone(r: SectionStatuses): boolean {
  return isDone(r.sectionAStatus) && isDone(r.sectionBStatus) && isDone(r.sectionCStatus) && isDone(r.sectionDStatus);
}

/**
 * Overall status as a function of the section statuses, so the two can never contradict each other.
 * Only pre-submission statuses are derived; once a case has gone to the TPA the status is changed explicitly.
 */
export function deriveStatus(r: SectionStatuses & { status: string }): string {
  if (!PRE_SUBMISSION.includes(r.status)) return r.status;
  if (allSectionsDone(r)) return 'READY_FOR_REVIEW';
  const hospitalDone = isDone(r.sectionAStatus) && isDone(r.sectionDStatus);
  const patientPending = !isDone(r.sectionBStatus);
  const doctorPending = !isDone(r.sectionCStatus);
  if (hospitalDone && patientPending && !doctorPending) return 'AWAITING_PATIENT';
  if (hospitalDone && doctorPending && !patientPending) return 'AWAITING_DOCTOR';
  if (hospitalDone && patientPending && doctorPending) return 'AWAITING_PATIENT';
  return 'IN_PROGRESS';
}

export interface EmergencyFlags {
  isEmergency: boolean;
  emergencyDoctorConfirmed: boolean;
  emergencyPatientConfirmed: boolean;
  emergencySupervisorReviewed: boolean;
}

export function pendingEmergencyConfirmations(r: EmergencyFlags): string[] {
  if (!r.isEmergency) return [];
  const out: string[] = [];
  if (!r.emergencyDoctorConfirmed) out.push('doctor');
  if (!r.emergencyPatientConfirmed) out.push('patient');
  if (!r.emergencySupervisorReviewed) out.push('supervisor');
  return out;
}

export function statusLabel(r: EmergencyFlags & { status: string }): string {
  const pending = pendingEmergencyConfirmations(r);
  if (r.isEmergency && pending.length && PRE_SUBMISSION.concat(['SUBMITTED_TO_TPA']).includes(r.status)) {
    return `Emergency: awaiting ${pending.join(' / ')}`;
  }
  return r.status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()).replace(/\btpa\b/g, 'TPA');
}
