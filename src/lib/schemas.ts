import { z } from 'zod';
import { toDdmmyy, toDdmmyyyy, toHhmm, toMobile10 } from './dates';

// Server-side shape of each form section. Unknown keys are dropped so a client can never store arbitrary JSON.
// Nothing here makes a field mandatory: the original form does not mark them (open question Q-MAND).
// Limits only protect the database; whether a value fits the printed boxes is checked at PDF time.

const text = (max = 200) => z.string().trim().max(max).optional();
const yesNo = z.union([z.enum(['Yes', 'No']), z.literal('')]).optional();
const oneDigit = z.string().trim().regex(/^\d?$/, 'Single digit expected').optional();

const digitsOnly = (maxLen: number, label: string) =>
  z.string().trim().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length <= maxLen, `${label}: at most ${maxLen} digits`).optional();

const mobile = z.string().trim().transform(toMobile10).refine((v) => v === '' || v.length === 10, 'Enter a 10-digit mobile number').optional();

const date8 = (label: string) =>
  z.string().trim().transform((v, ctx) => {
    if (v === '') return '';
    const d = toDdmmyyyy(v);
    if (!d) ctx.addIssue({ code: 'custom', message: `${label}: enter a full date` });
    return d;
  }).optional();

const intRange = (min: number, max: number, label: string) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int(`${label}: whole number expected`).min(min, `${label}: minimum ${min}`).max(max, `${label}: maximum ${max}`).optional()
  );

const amount = (label: string) =>
  z.string().trim().transform((v, ctx) => {
    if (v === '') return '';
    const cleaned = v.replace(/[,\s₹]|Rs\.?/gi, '');
    if (!/^\d+$/.test(cleaned)) {
      ctx.addIssue({ code: 'custom', message: `${label}: enter whole rupees` });
      return v;
    }
    return String(Number(cleaned)); // no padding: unfilled cells stay blank on the form
  }).optional();

export const providerSchema = z.object({
  hospitalName: text(200),
  city: text(80),
  state: text(80),
  pinCode: text(14),
  hospitalId: text(14),
  landmark: text(120),
  rohiniId: text(14),
  contactNo: text(30),
  faxNo: text(30),
  tpaDeskNo: text(30),
  emailId: text(120),
});

export const patientSchema = z.object({
  patientName: text(200),
  addressLine1: text(200),
  addressLine2: text(200),
  gender: z.union([z.enum(['Male', 'Female']), z.literal('')], { error: 'choose Male or Female' }).optional(),
  ageYears: intRange(0, 130, 'Age (years)'),
  ageMonths: intRange(0, 11, 'Age (months)'),
  dob: date8('Date of birth'),
  attendantName: text(200),
  attendantContactNo: mobile,
  patientContactNo: mobile,
  insuredCardId: text(40),
  occupation: text(100),
  policyNumberCorporate: text(120),
  employeeId: text(40),
  panNo: text(20),
  proposerName: text(200),
  proposerCkyc: text(60),
  hasOtherMediclaim: yesNo,
  otherInsuranceCompanyName: text(200),
  otherInsuranceDetails: text(200),
  hasFamilyPhysician: yesNo,
  familyPhysicianName: text(200),
  familyPhysicianContactNo: mobile,
  insuredEmailId: text(120),
});

export const TREATMENT_LINES = ['Medical Management', 'Surgical Management', 'Intensive care', 'Investigation', 'Non allopathic treatment'] as const;

export const clinicalSchema = z.object({
  treatingDoctorName: text(200),
  treatingDoctorContactNo: mobile,
  illnessNatureComplaints: text(300),
  relevantClinicalFindings: text(300),
  durationPresentAilmentDays: digitsOnly(3, 'Duration (days)'),
  dateOfFirstConsultation: date8('Date of first consultation'),
  pastHistoryPresentAilment: text(300),
  provisionalDiagnosis: text(200),
  icd10Code: text(12),
  proposedLineOfTreatment: z.array(z.enum(TREATMENT_LINES)).optional(),
  investigationMedicalManagementDetails: text(300),
  routeOfDrugAdministration: text(400),
  surgicalNameOfSurgery: text(200),
  icd10PcsCode: text(12),
  otherTreatmentsDetails: text(300),
  howDidInjuryOccur: text(300),
  accidentIsRta: yesNo,
  accidentDateOfInjury: date8('Date of injury'),
  accidentReportedToPolice: yesNo,
  accidentFirNo: text(20),
  substanceAbuseAlcohol: yesNo,
  substanceAbuseTestConducted: yesNo,
  maternityG: oneDigit,
  maternityP: oneDigit,
  maternityL: oneDigit,
  maternityA: oneDigit,
  maternityEdd: date8('Expected date of delivery'),
  maternityLmp: date8('Last menstrual period'),
});

const chronicItem = z
  .object({
    present: z.boolean().optional(),
    sinceMmyy: z.string().trim().transform((v) => v.replace(/\D/g, '')).refine((v) => v === '' || v.length === 4, 'Since: enter month and year (MMYY)').optional(),
  })
  .optional();

export const CHRONIC_KEYS = ['diabetes', 'heartDisease', 'hypertension', 'hyperlipidemia', 'osteoarthritis', 'asthmaCopd', 'cancer', 'alcoholDrug', 'hivStd'] as const;

export const chronicSchema = z.object({
  // Exactly what the form has: nine tick boxes with a "since" month/year, and "any other ailment".
  diabetes: chronicItem,
  heartDisease: chronicItem,
  hypertension: chronicItem,
  hyperlipidemia: chronicItem,
  osteoarthritis: chronicItem,
  asthmaCopd: chronicItem,
  cancer: chronicItem,
  alcoholDrug: chronicItem,
  hivStd: chronicItem,
  otherAilmentDetails: text(100),
});

/** Doctor-owned items printed on page 2. */
export const doctorBlockSchema = z.object({
  name: text(200),
  qualification: text(160),
  registrationNo: text(20),
});

export const admissionSchema = z.object({
  admissionDate: z.string().trim().transform((v, ctx) => {
    if (v === '') return '';
    const d = toDdmmyy(v);
    if (!d) ctx.addIssue({ code: 'custom', message: 'Date of admission: enter a full date' });
    return d;
  }).optional(),
  admissionTime: z.string().trim().transform((v, ctx) => {
    if (v === '') return '';
    const d = toHhmm(v);
    if (!d) ctx.addIssue({ code: 'custom', message: 'Time of admission: enter HH:MM' });
    return d;
  }).optional(),
  hospitalizationEventType: z.union([z.enum(['Emergency', 'Planned']), z.literal('')]).optional(),
  expectedDaysStay: digitsOnly(3, 'Expected days of stay'),
  roomType: text(60),
  expectedDaysIcu: digitsOnly(3, 'Expected days in ICU'),
  costRoomRentNursing: amount('Room rent + nursing'),
  costInvestigationDiagnostics: amount('Investigation + diagnostics'),
  costIcuCharges: amount('ICU charges'),
  costOtCharges: amount('OT charges'),
  costProfessionalFees: amount('Professional fees'),
  costMedicinesConsumables: amount('Medicines + consumables'),
  costOtherHospitalExpenses: amount('Other hospital expenses'),
  costAllInclusivePackage: amount('All-inclusive package'),
  costSumTotalExpected: amount('Sum total expected cost'),
});

export type ProviderInput = z.infer<typeof providerSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type ClinicalInput = z.infer<typeof clinicalSchema>;
export type ChronicInput = z.infer<typeof chronicSchema>;
export type AdmissionInput = z.infer<typeof admissionSchema>;

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join('; ');
}

/** Drops undefined keys so a partial save merges instead of wiping stored values. */
export function compact<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
