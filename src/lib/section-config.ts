import fieldMapData from '../../field-map.json';
import { TREATMENT_LINES } from './schemas';

// Which inputs each section shows. Labels are the form's own printed labels, read from field-map.json,
// so the screens and the paper form use the same words and lettering.

export type FieldKind = 'text' | 'textarea' | 'tel' | 'email' | 'digits' | 'amount' | 'date8' | 'date6' | 'time' | 'yesno' | 'gender' | 'treatment' | 'choice';

export interface FieldDef {
  key: string;
  mapId: string;
  kind: FieldKind;
  wide?: boolean;
  /** Number of printed boxes for this value, shown next to the label. */
  cells?: number;
  options?: string[];
  showIf?: (values: Record<string, any>) => boolean;
}
export interface GroupDef {
  id: string;
  title: string;
  fields: FieldDef[];
}

const labels: Record<string, string> = {};
for (const f of fieldMapData as any[]) labels[f.id] = f.label;
export const labelOf = (mapId: string) => labels[mapId] ?? mapId;

const f = (key: string, mapId: string, kind: FieldKind, extra: Partial<FieldDef> = {}): FieldDef => ({ key, mapId, kind, ...extra });
const isYes = (k: string) => (v: Record<string, any>) => v[k] === 'Yes';

export const SECTION_A: GroupDef[] = [
  {
    id: 'provider',
    title: 'Details of the Provider',
    fields: [
      f('hospitalName', 'provider_hospital_name', 'text', { wide: true }),
      f('city', 'provider_city', 'text'),
      f('state', 'provider_state', 'text'),
      f('pinCode', 'provider_pin_code', 'digits', { cells: 14 }),
      f('hospitalId', 'provider_hospital_id', 'text', { cells: 14 }),
      f('landmark', 'provider_landmark', 'text'),
      f('rohiniId', 'provider_rohini_id', 'text', { cells: 14 }),
      f('contactNo', 'provider_contact_no', 'text'),
      f('faxNo', 'provider_fax_no', 'text'),
      f('tpaDeskNo', 'provider_tpa_desk_no', 'text'),
      f('emailId', 'provider_email_id', 'email'),
    ],
  },
];

export const SECTION_B: GroupDef[] = [
  {
    id: 'patient',
    title: 'Insured / Patient',
    fields: [
      f('patientName', 'patient_name', 'text', { wide: true }),
      f('addressLine1', 'patient_address_line1', 'text', { wide: true }),
      f('addressLine2', 'patient_address_line2', 'text', { wide: true }),
      f('gender', 'patient_gender', 'gender', {}),
      f('ageYears', 'patient_age_years', 'digits', { cells: 2 }),
      f('ageMonths', 'patient_age_months', 'digits', { cells: 2 }),
      f('dob', 'patient_dob', 'date8'),
      f('attendantName', 'patient_attendant_name', 'text'),
      f('attendantContactNo', 'patient_attendant_contact_no', 'tel', { cells: 10 }),
      f('patientContactNo', 'patient_contact_no', 'tel', { cells: 10 }),
      f('insuredCardId', 'insured_card_id', 'text', { cells: 16 }),
      f('occupation', 'patient_occupation', 'text'),
      f('policyNumberCorporate', 'policy_number_corporate', 'text'),
      f('employeeId', 'employee_id', 'text', { cells: 16 }),
      f('panNo', 'insured_pan_no', 'text', { cells: 10 }),
      f('proposerName', 'proposer_name', 'text', { wide: true }),
      f('proposerCkyc', 'proposer_ckyc', 'text', { wide: true }),
    ],
  },
  {
    id: 'insurance',
    title: 'Other insurance and family physician',
    fields: [
      f('hasOtherMediclaim', 'has_other_mediclaim', 'yesno', { wide: true }),
      f('otherInsuranceCompanyName', 'other_insurance_company_name', 'text', { wide: true, showIf: isYes('hasOtherMediclaim') }),
      f('otherInsuranceDetails', 'other_insurance_details', 'text', { wide: true, showIf: isYes('hasOtherMediclaim') }),
      f('hasFamilyPhysician', 'has_family_physician', 'yesno', { wide: true }),
      f('familyPhysicianName', 'family_physician_name', 'text', { showIf: isYes('hasFamilyPhysician') }),
      f('familyPhysicianContactNo', 'family_physician_contact_no', 'tel', { cells: 10, showIf: isYes('hasFamilyPhysician') }),
      f('insuredEmailId', 'insured_email_id', 'email', { wide: true }),
    ],
  },
];

export const SECTION_C: GroupDef[] = [
  {
    id: 'doctor',
    title: 'Treating doctor and ailment',
    fields: [
      f('treatingDoctorName', 'treating_doctor_name', 'text'),
      f('treatingDoctorContactNo', 'treating_doctor_contact_no', 'tel', { cells: 10 }),
      f('illnessNatureComplaints', 'illness_nature_complaints', 'text', { wide: true }),
      f('relevantClinicalFindings', 'relevant_clinical_findings', 'text', { wide: true }),
      f('durationPresentAilmentDays', 'duration_present_ailment_days', 'digits', { cells: 3 }),
      f('dateOfFirstConsultation', 'date_of_first_consultation', 'date8'),
      f('pastHistoryPresentAilment', 'past_history_present_ailment', 'text', { wide: true }),
    ],
  },
  {
    id: 'diagnosis',
    title: 'Diagnosis and proposed treatment',
    fields: [
      f('provisionalDiagnosis', 'provisional_diagnosis', 'text'),
      f('icd10Code', 'icd_10_code', 'text', { cells: 10 }),
      f('proposedLineOfTreatment', 'proposed_line_of_treatment', 'treatment', { wide: true }),
      f('investigationMedicalManagementDetails', 'investigation_medical_management_details', 'text', { wide: true }),
      f('routeOfDrugAdministration', 'route_of_drug_administration', 'text', { wide: true }),
      f('surgicalNameOfSurgery', 'surgical_name_of_surgery', 'text', { showIf: (v) => (v.proposedLineOfTreatment || []).includes('Surgical Management') }),
      f('icd10PcsCode', 'icd_10_pcs_code', 'text', { cells: 10, showIf: (v) => (v.proposedLineOfTreatment || []).includes('Surgical Management') }),
      f('otherTreatmentsDetails', 'other_treatments_details', 'text', { wide: true }),
    ],
  },
  {
    id: 'accident',
    title: 'Accident and substance abuse',
    fields: [
      f('howDidInjuryOccur', 'how_did_injury_occur', 'text', { wide: true }),
      f('accidentIsRta', 'accident_is_rta', 'yesno'),
      f('accidentDateOfInjury', 'accident_date_of_injury', 'date8'),
      f('accidentReportedToPolice', 'accident_reported_to_police', 'yesno'),
      f('accidentFirNo', 'accident_fir_no', 'text', { cells: 7, showIf: isYes('accidentReportedToPolice') }),
      f('substanceAbuseAlcohol', 'substance_abuse_alcohol', 'yesno'),
      f('substanceAbuseTestConducted', 'substance_abuse_test_conducted', 'yesno'),
    ],
  },
  {
    id: 'maternity',
    title: 'Maternity',
    fields: [
      f('maternityG', 'maternity_g', 'digits', { cells: 1 }),
      f('maternityP', 'maternity_p', 'digits', { cells: 1 }),
      f('maternityL', 'maternity_l', 'digits', { cells: 1 }),
      f('maternityA', 'maternity_a', 'digits', { cells: 1 }),
      f('maternityEdd', 'maternity_edd', 'date8'),
      f('maternityLmp', 'maternity_lmp', 'date8'),
    ],
  },
];

/** Page-2 doctor items (name, qualification, registration number). */
export const DOCTOR_BLOCK: FieldDef[] = [
  f('name', 'page2_doctor_name', 'text'),
  f('qualification', 'page2_doctor_qualification', 'text'),
  f('registrationNo', 'page2_doctor_registration_no', 'text', { cells: 11 }),
];

export const SECTION_D: GroupDef[] = [
  {
    id: 'admission',
    title: 'Patient admitted details',
    fields: [
      f('admissionDate', 'admission_date', 'date6'),
      f('admissionTime', 'admission_time', 'time'),
      f('hospitalizationEventType', 'hospitalization_event_type', 'choice', { options: ['Planned', 'Emergency'] }),
      f('expectedDaysStay', 'expected_days_stay', 'digits', { cells: 3 }),
      f('roomType', 'room_type', 'text', {}),
      f('expectedDaysIcu', 'expected_days_icu', 'digits', { cells: 3 }),
    ],
  },
  {
    id: 'costs',
    title: 'Estimated costs (whole rupees)',
    fields: [
      f('costRoomRentNursing', 'cost_room_rent_nursing', 'amount', { cells: 7 }),
      f('costInvestigationDiagnostics', 'cost_investigation_diagnostics', 'amount', { cells: 7 }),
      f('costIcuCharges', 'cost_icu_charges', 'amount', { cells: 7 }),
      f('costOtCharges', 'cost_ot_charges', 'amount', { cells: 7 }),
      f('costProfessionalFees', 'cost_professional_fees', 'amount', { cells: 7 }),
      f('costMedicinesConsumables', 'cost_medicines_consumables', 'amount', { cells: 7 }),
      f('costOtherHospitalExpenses', 'cost_other_hospital_expenses', 'amount', { cells: 7 }),
      f('costAllInclusivePackage', 'cost_all_inclusive_package', 'amount', { cells: 7 }),
      f('costSumTotalExpected', 'cost_sum_total_expected', 'amount', { cells: 7 }),
    ],
  },
];

export const CHRONIC_ITEMS: { key: string; mapId: string }[] = [
  { key: 'diabetes', mapId: 'chronic_diabetes_check' },
  { key: 'heartDisease', mapId: 'chronic_heart_disease_check' },
  { key: 'hypertension', mapId: 'chronic_hypertension_check' },
  { key: 'hyperlipidemia', mapId: 'chronic_hyperlipidemia_check' },
  { key: 'osteoarthritis', mapId: 'chronic_osteoarthritis_check' },
  { key: 'asthmaCopd', mapId: 'chronic_asthma_copd_check' },
  { key: 'cancer', mapId: 'chronic_cancer_check' },
  { key: 'alcoholDrug', mapId: 'chronic_alcohol_drug_check' },
  { key: 'hivStd', mapId: 'chronic_hiv_std_check' },
];
export const CHRONIC_OTHER_MAP_ID = 'chronic_other_ailment_details';
export { TREATMENT_LINES };
