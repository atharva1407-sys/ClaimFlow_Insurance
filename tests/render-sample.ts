// Writes a sample overlay PDF for visual checks: tsx tests/render-sample.ts <out.pdf>
import fs from 'node:fs';
import { generateCashlessPdfWithReport } from '../src/lib/pdf-generator';

const patient = { patientName: 'Rajesh Kumar', addressLine1: '123, MG Road, Mumbai', addressLine2: 'Maharashtra - 400001', gender: 'Male', ageYears: 45, ageMonths: 0, dob: '15061980', attendantName: 'Sita Kumar', attendantContactNo: '9876543210', patientContactNo: '9876543210', insuredCardId: 'BAJ-CC-99218452', occupation: 'Software Engineer', policyNumberCorporate: '0128472910 / TechCorp', employeeId: 'TC-EMP-00918', panNo: 'ABCDE1234F', proposerName: 'Rajesh Kumar', proposerCkyc: '20091827364501', hasOtherMediclaim: 'No', hasFamilyPhysician: 'Yes', familyPhysicianName: 'Dr. S. P. Sharma', familyPhysicianContactNo: '9811122233', insuredEmailId: 'rajesh.kumar@example.com' };
const clinical = { treatingDoctorName: 'Dr. Amit Verma', treatingDoctorContactNo: '9820011223', illnessNatureComplaints: 'Acute severe right lower quadrant pain, nausea, fever', relevantClinicalFindings: 'Tenderness at McBurney point, rebound guarding, leukocytosis', durationPresentAilmentDays: '3', dateOfFirstConsultation: '12052026', pastHistoryPresentAilment: 'No prior abdominal surgery', provisionalDiagnosis: 'Acute Appendicitis', icd10Code: 'K35.80', proposedLineOfTreatment: ['Surgical Management'], surgicalNameOfSurgery: 'Laparoscopic Appendectomy', icd10PcsCode: '0DTJ4ZZ', routeOfDrugAdministration: 'IV Ceftriaxone, IV Metronidazole, IV Paracetamol', accidentIsRta: 'No', accidentReportedToPolice: 'No', substanceAbuseAlcohol: 'No' };
const admissionExpense = { admissionDate: '130526', admissionTime: '1030', hospitalizationEventType: 'Planned', expectedDaysStay: '5', roomType: 'Single', expectedDaysIcu: '2', costRoomRentNursing: '50000', costInvestigationDiagnostics: '25000', costIcuCharges: '40000', costOtCharges: '75000', costProfessionalFees: '60000', costMedicinesConsumables: '100000', costOtherHospitalExpenses: '20000', costSumTotalExpected: '370000' };
const chronic = { diabetes: { present: true, sinceMmyy: '0620' }, hypertension: { present: true, sinceMmyy: '0122' },  };

generateCashlessPdfWithReport({
  provider: { hospitalName: 'City Care Super Specialty Hospital', city: 'Mumbai', state: 'Maharashtra', pinCode: '400001', hospitalId: 'HSP12345', rohiniId: 'ROH07665', landmark: 'Near Central Mall', contactNo: '022-2345678', faxNo: '022-2345679', tpaDeskNo: '022-2345670', emailId: 'insurance@citycare.com' },
  patient, clinical, admissionExpense, chronic,
  declarations: { page2DoctorName: 'Dr. Amit Verma', page2DoctorQualification: 'MBBS, MS', page2DoctorRegistrationNo: 'MMC20120541' },
} as any).then(({ bytes, issues }) => {
  fs.writeFileSync(process.argv[2], bytes);
  console.log('issues:', JSON.stringify(issues));
});
