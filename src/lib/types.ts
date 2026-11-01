// Type definitions for ClaimFlow Health

export type UserRole = 'ADMIN' | 'HOSPITAL_STAFF' | 'DOCTOR' | 'EMERGENCY_OPERATOR' | 'PATIENT';

export type SectionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'RETURNED_FOR_CORRECTION' | 'REVIEWED';

export type CaseStatus = 
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'AWAITING_PATIENT'
  | 'AWAITING_DOCTOR'
  | 'READY_FOR_REVIEW'
  | 'SUBMITTED_TO_TPA'
  | 'TPA_QUERY'
  | 'TPA_APPROVED'
  | 'TPA_REJECTED'
  | 'ENHANCEMENT_REQUESTED'
  | 'DISCHARGED'
  | 'CLOSED';

// Section A: Hospital / Provider Data
export interface ProviderData {
  hospitalName: string;
  city: string;
  state: string;
  pinCode: string;
  hospitalId?: string;
  landmark?: string;
  rohiniId?: string;
  contactNo: string;
  faxNo?: string;
  tpaDeskNo?: string;
  emailId: string;
}

// Section B: Patient Data
export interface PatientSectionData {
  patientName: string;
  addressLine1: string;
  addressLine2?: string;
  gender: 'Male' | 'Female' | string;
  ageYears: number;
  ageMonths?: number;
  dob: string; // DDMMYYYY
  attendantName?: string;
  attendantContactNo?: string;
  patientContactNo: string;
  insuredCardId: string;
  occupation?: string;
  policyNumberCorporate: string;
  employeeId?: string;
  panNo?: string;
  proposerName: string;
  proposerCkyc?: string;
  hasOtherMediclaim: 'Yes' | 'No' | string;
  otherInsuranceCompanyName?: string;
  otherInsuranceDetails?: string;
  hasFamilyPhysician: 'Yes' | 'No' | string;
  familyPhysicianName?: string;
  familyPhysicianContactNo?: string;
  insuredEmailId: string;
}

// Section C: Doctor / Clinical Data
export interface ClinicalSectionData {
  treatingDoctorName: string;
  treatingDoctorContactNo: string;
  illnessNatureComplaints: string;
  relevantClinicalFindings: string;
  durationPresentAilmentDays: string;
  dateOfFirstConsultation: string; // DDMMYYYY
  pastHistoryPresentAilment?: string;
  provisionalDiagnosis: string;
  icd10Code: string;
  proposedLineOfTreatment: string[]; // Medical Management, Surgical Management, Intensive care, Investigation, Non allopathic treatment
  investigationMedicalManagementDetails?: string;
  routeOfDrugAdministration?: string;
  surgicalNameOfSurgery?: string;
  icd10PcsCode?: string;
  otherTreatmentsDetails?: string;
  howDidInjuryOccur?: string;
  accidentIsRta?: 'Yes' | 'No' | string;
  accidentDateOfInjury?: string;
  accidentReportedToPolice?: 'Yes' | 'No' | string;
  accidentFirNo?: string;
  substanceAbuseAlcohol?: 'Yes' | 'No' | string;
  substanceAbuseTestConducted?: 'Yes' | 'No' | string;
  maternityG?: string;
  maternityP?: string;
  maternityL?: string;
  maternityA?: string;
  maternityEdd?: string;
  maternityLmp?: string;
}

// Section D: Admission & Financial Estimates
export interface AdmissionExpenseData {
  admissionDate: string; // DDMMYY (6 chars)
  admissionTime: string; // HHMM
  hospitalizationEventType: 'Emergency' | 'Planned' | string;
  expectedDaysStay: string;
  roomType: string;
  expectedDaysIcu?: string;
  costRoomRentNursing: string;
  costInvestigationDiagnostics?: string;
  costIcuCharges?: string;
  costOtCharges?: string;
  costProfessionalFees: string;
  costMedicinesConsumables?: string;
  costOtherHospitalExpenses?: string;
  costAllInclusivePackage?: string;
  costSumTotalExpected: string;
}

// Section D Chronic Illness
export interface ChronicIllnessItem {
  present: boolean;
  sinceMmyy?: string;
}

export interface ChronicHistoryData {
  diabetes: ChronicIllnessItem;
  heartDisease: ChronicIllnessItem;
  hypertension: ChronicIllnessItem;
  hyperlipidemia: ChronicIllnessItem;
  osteoarthritis: ChronicIllnessItem;
  asthmaCopd: ChronicIllnessItem;
  cancer: ChronicIllnessItem;
  alcoholDrug: ChronicIllnessItem;
  hivStd: ChronicIllnessItem;
  otherAilmentDetails?: string;
}

// Declarations & Post-Signing Data
export interface DeclarationsData {
  page2DoctorName?: string;
  page2DoctorQualification?: string;
  page2DoctorRegistrationNo?: string;
}
