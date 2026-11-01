import { parseJson, type FullRequest } from './api';
import { validateCashlessRequest, ValidationIssue, ValidationResult } from './rules';
import { isDone } from './workflow';

export interface CaseValidation extends ValidationResult {
  /** Blockers that stop the case being finalised: rule blockers plus sections not yet submitted. */
  finalisable: boolean;
}

export function validateRequestRecord(r: FullRequest): CaseValidation {
  const base = validateCashlessRequest({
    patient: parseJson(r.patientData) ?? undefined,
    clinical: parseJson(r.clinicalData) ?? undefined,
    admissionExpense: parseJson(r.admissionData) ?? parseJson(r.expenseData) ?? undefined,
    chronic: parseJson(r.chronicData) ?? undefined,
    isEmergency: r.isEmergency,
  });

  const blockers: ValidationIssue[] = [...base.blockers];
  const sections: [ValidationIssue['section'], string][] = [
    ['A', r.sectionAStatus],
    ['B', r.sectionBStatus],
    ['C', r.sectionCStatus],
    ['D', r.sectionDStatus],
  ];
  for (const [section, status] of sections) {
    if (!isDone(status)) {
      blockers.push({ section, severity: 'BLOCKER', message: `Section ${section} has not been submitted (status: ${status.replace(/_/g, ' ').toLowerCase()}).` });
    }
  }
  return { ...base, blockers, isValid: blockers.length === 0, finalisable: blockers.length === 0 };
}
