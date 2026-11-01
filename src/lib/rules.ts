// Pre-submission rules for ClaimFlow Health.
//
// Only the consistency checks named in the project spec are implemented. The app never decides that an
// empty field is "required": the original form marks nothing as mandatory except the chronic illness
// history, and that history is simply the nine tick boxes, so leaving them untouched is a valid answer.

import { PatientSectionData, ClinicalSectionData, AdmissionExpenseData, ChronicHistoryData } from './types';
import { parseDdmmyyyy, toDdmmyy, toDdmmyyyy } from './dates';

export interface ValidationIssue {
  fieldId?: string;
  section: 'A' | 'B' | 'C' | 'D';
  severity: 'BLOCKER' | 'WARNING';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
}

const num = (v: unknown): number => {
  const n = Number(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const has = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== '';

export function validateCashlessRequest(data: {
  patient?: Partial<PatientSectionData>;
  clinical?: Partial<ClinicalSectionData>;
  admissionExpense?: Partial<AdmissionExpenseData>;
  chronic?: Partial<ChronicHistoryData>;
  isEmergency?: boolean;
}): ValidationResult {
  const blockers: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const { clinical, admissionExpense, isEmergency } = data;

  const block = (section: ValidationIssue['section'], fieldId: string, message: string) =>
    blockers.push({ section, fieldId, severity: 'BLOCKER', message });
  const warn = (section: ValidationIssue['section'], fieldId: string, message: string) =>
    warnings.push({ section, fieldId, severity: 'WARNING', message });

  if (clinical) {
    // Surgery selected but no surgery name or OT charges
    if (clinical.proposedLineOfTreatment?.includes('Surgical Management')) {
      if (!has(clinical.surgicalNameOfSurgery)) block('C', 'surgical_name_of_surgery', 'Surgical Management is selected but the name of the surgery is empty.');
      if (admissionExpense && num(admissionExpense.costOtCharges) <= 0) warn('D', 'cost_ot_charges', 'Surgical Management is selected in Section C but OT charges are empty or zero.');
    }

    // Accident case without RTA, police or FIR information
    const accident = has(clinical.howDidInjuryOccur) || has(clinical.accidentDateOfInjury) || clinical.accidentIsRta === 'Yes' || clinical.accidentReportedToPolice === 'Yes';
    if (accident) {
      if (!has(clinical.accidentIsRta)) warn('C', 'accident_is_rta', 'Accident details are present but "Is it RTA" is not answered.');
      if (!has(clinical.accidentReportedToPolice)) warn('C', 'accident_reported_to_police', 'Accident details are present but "Reported to Police" is not answered.');
    }
    if (clinical.accidentReportedToPolice === 'Yes' && !has(clinical.accidentFirNo)) warn('C', 'accident_fir_no', 'Reported to police is Yes but the FIR number is empty.');

    // Maternity fields incomplete: G, P, L, A, EDD and LMP together or not at all
    const mat = [clinical.maternityG, clinical.maternityP, clinical.maternityL, clinical.maternityA, clinical.maternityEdd, clinical.maternityLmp];
    if (mat.some(has) && !mat.every(has)) warn('C', 'maternity_g', 'Maternity details are incomplete: G, P, L, A, EDD and LMP are filled together or not at all.');
  }

  if (admissionExpense) {
    // Emergency versus planned
    if (isEmergency && admissionExpense.hospitalizationEventType !== 'Emergency') {
      block('D', 'hospitalization_event_type', 'This is an emergency-mode case, so the admission type must be Emergency.');
    } else if (!isEmergency && admissionExpense.hospitalizationEventType === 'Emergency') {
      warn('D', 'hospitalization_event_type', 'Admission type is Emergency but the case was not created in emergency mode.');
    }

    // Admission date earlier than first consultation (admission is DDMMYY, consultation DDMMYYYY)
    const adm = parseDdmmyyyy(toDdmmyyyy(toDdmmyy(admissionExpense.admissionDate)));
    const firstConsult = parseDdmmyyyy(clinical?.dateOfFirstConsultation);
    if (adm && firstConsult && adm < firstConsult) warn('D', 'admission_date', 'Date of admission is earlier than the date of first consultation.');
    const injury = parseDdmmyyyy(clinical?.accidentDateOfInjury);
    if (adm && injury && injury > adm) warn('C', 'accident_date_of_injury', 'Date of injury is later than the date of admission.');

    // ICU days and ICU charges must agree
    const icuDays = num(admissionExpense.expectedDaysIcu);
    const icuCost = num(admissionExpense.costIcuCharges);
    if (icuDays > 0 && icuCost <= 0) warn('D', 'cost_icu_charges', 'Expected ICU days are entered but ICU charges are empty or zero.');
    if (icuDays === 0 && icuCost > 0) warn('D', 'expected_days_icu', 'ICU charges are entered but expected ICU days are empty or zero.');

    // Total versus its components. The form does not say how the total is calculated, so a total
    // that matches the itemised charges, the package amount, or both added is accepted.
    const itemised =
      num(admissionExpense.costRoomRentNursing) + num(admissionExpense.costInvestigationDiagnostics) + icuCost +
      num(admissionExpense.costOtCharges) + num(admissionExpense.costProfessionalFees) +
      num(admissionExpense.costMedicinesConsumables) + num(admissionExpense.costOtherHospitalExpenses);
    const pkg = num(admissionExpense.costAllInclusivePackage);
    if (has(admissionExpense.costSumTotalExpected)) {
      const total = num(admissionExpense.costSumTotalExpected);
      const acceptable = [itemised, pkg, itemised + pkg].filter((v) => v > 0);
      if (acceptable.length && !acceptable.some((v) => Math.abs(v - total) <= 1)) {
        warn('D', 'cost_sum_total_expected', `Sum total (Rs. ${total}) does not match the itemised charges (Rs. ${itemised})${pkg > 0 ? ` or the package amount (Rs. ${pkg})` : ''}.`);
      }
    }
  }

  return { isValid: blockers.length === 0, blockers, warnings };
}
