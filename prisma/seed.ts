// Synthetic demo data only. Every name, number and ID below is made up.
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { hashOtp } from '../src/lib/otp';
import { deriveStatus } from '../src/lib/workflow';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';
const DEMO_OTP = '123456'; // hashed before storing; works only for the seeded CR-2026-00122 invitation until used once

async function main() {
  console.log('Seeding ClaimFlow Health database...');

  await prisma.claimChecklistDocument.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.documentVersion.deleteMany({});
  await prisma.cashlessRequest.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.hospital.deleteMany({});

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Hospitals ------------------------------------------------------------------------------
  const hospital = await prisma.hospital.create({
    data: {
      name: 'City Care Super Specialty Hospital', city: 'Mumbai', state: 'Maharashtra', pinCode: '400001',
      hospitalIdCode: 'HSP12345', rohiniId: 'ROH07665', landmark: 'Near Central Mall',
      contactNo: '022-2345678', faxNo: '022-2345679', tpaDeskNo: '022-2345670', emailId: 'insurance@citycare.com',
    },
  });
  // Second hospital, used to check that data never crosses hospitals.
  const hospital2 = await prisma.hospital.create({
    data: {
      name: 'LifeLine Hospital', city: 'Delhi', state: 'Delhi', pinCode: '110001',
      hospitalIdCode: 'HSP99812', rohiniId: 'ROH11204', landmark: 'Opp Metro Pillar 42',
      contactNo: '011-4567890', faxNo: '011-4567891', tpaDeskNo: '011-4567892', emailId: 'tpa@lifelinehospital.org',
    },
  });

  // Users ----------------------------------------------------------------------------------
  const user = (data: Omit<Prisma.UserUncheckedCreateInput, 'passwordHash' | 'status'>) =>
    prisma.user.create({ data: { ...data, passwordHash, status: 'ACTIVE' } });
  await user({ name: 'System Admin', email: 'admin@claimflow.com', role: 'ADMIN', phone: '9800000000' });
  const hospitalStaff = await user({ name: 'Priya Sharma', email: 'hospital_desk@carehosp.com', role: 'HOSPITAL_STAFF', phone: '9876543210', hospitalId: hospital.id });
  // A second desk user, so an emergency entry can be reviewed by someone other than the operator.
  await user({ name: 'Kiran Rao', email: 'kiran@carehosp.com', role: 'HOSPITAL_STAFF', phone: '9876500011', hospitalId: hospital.id });
  const doctorAmit = await user({
    name: 'Dr. Amit Verma', email: 'doctor_101@carehosp.com', role: 'DOCTOR', phone: '9820011223',
    specialization: 'General Surgery', qualification: 'MBBS, MS (General Surgery)', registrationNo: 'MMC20120541', hospitalId: hospital.id,
  });
  const doctorNeha = await user({
    name: 'Dr. Neha Gupta', email: 'neha@carehosp.com', role: 'DOCTOR', phone: '9820099887',
    specialization: 'Internal Medicine', qualification: 'MBBS, MD (Medicine)', registrationNo: 'MMC20150992', hospitalId: hospital.id,
  });
  const emergencyOperator = await user({ name: 'Casualty In-Charge (ER)', email: 'er@carehosp.com', role: 'EMERGENCY_OPERATOR', phone: '9820044556', hospitalId: hospital.id });
  await user({ name: 'Anita Desai', email: 'staff@lifelinehospital.org', role: 'HOSPITAL_STAFF', phone: '9811100022', hospitalId: hospital2.id });
  console.log('Created users for every role in two hospitals');

  // Patients -------------------------------------------------------------------------------
  const patientRajesh = await prisma.patient.create({
    data: { patientCode: 'PAT-000125', name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh.kumar@example.com', addressLine1: '123, MG Road, Mumbai', addressLine2: 'Maharashtra - 400001', gender: 'Male', ageYears: 45, ageMonths: 0, dob: '15061980', occupation: 'Software Engineer', panNumber: 'ABCDE1234F', hospitalId: hospital.id },
  });
  const patientPriya = await prisma.patient.create({
    data: { patientCode: 'PAT-000126', name: 'Meera Joshi', phone: '9812345678', email: 'meera.j@example.com', gender: 'Female', ageYears: 32, dob: '20081993', hospitalId: hospital.id },
  });
  const patientMohan = await prisma.patient.create({
    data: { patientCode: 'PAT-000127', name: 'Mohan Singh', phone: '9823456789', gender: 'Male', ageYears: 58, dob: '10041967', hospitalId: hospital.id },
  });
  await prisma.patient.create({
    data: { patientCode: 'PAT-000128', name: 'Sunita Devi', phone: '9834567890', gender: 'Female', ageYears: 65, dob: '05121960', hospitalId: hospital.id },
  });
  const patientOtherHospital = await prisma.patient.create({
    data: { patientCode: 'PAT-000129', name: 'Vikram Malhotra', phone: '9899988877', gender: 'Male', ageYears: 41, dob: '02031985', hospitalId: hospital2.id },
  });

  // Case 1: CR-2026-00123, everything submitted, ready for hospital review --------------------
  const provider = (h: typeof hospital) => ({
    hospitalName: h.name, city: h.city, state: h.state, pinCode: h.pinCode, hospitalId: h.hospitalIdCode, rohiniId: h.rohiniId,
    landmark: h.landmark, contactNo: h.contactNo, faxNo: h.faxNo, tpaDeskNo: h.tpaDeskNo, emailId: h.emailId,
  });

  const patientPayload = {
    patientName: 'Rajesh Kumar', addressLine1: '123, MG Road, Mumbai', addressLine2: 'Maharashtra - 400001', gender: 'Male',
    ageYears: 45, ageMonths: 0, dob: '15061980', attendantName: 'Sita Kumar', attendantContactNo: '9876543210',
    patientContactNo: '9876543210', insuredCardId: 'BAJ-CC-99218452', occupation: 'Software Engineer',
    policyNumberCorporate: '0128472910 / TechCorp India', employeeId: 'TC-EMP-00918', panNo: 'ABCDE1234F',
    proposerName: 'Rajesh Kumar', proposerCkyc: '20091827364501', hasOtherMediclaim: 'No', hasFamilyPhysician: 'Yes',
    familyPhysicianName: 'Dr. S. P. Sharma', familyPhysicianContactNo: '9811122233', insuredEmailId: 'rajesh.kumar@example.com',
  };
  const clinicalPayload = {
    treatingDoctorName: 'Dr. Amit Verma', treatingDoctorContactNo: '9820011223',
    illnessNatureComplaints: 'Acute severe right lower quadrant pain, nausea, fever',
    relevantClinicalFindings: 'Tenderness at McBurney point, rebound guarding, leukocytosis',
    durationPresentAilmentDays: '3', dateOfFirstConsultation: '12052026', pastHistoryPresentAilment: 'No prior abdominal surgery',
    provisionalDiagnosis: 'Acute Appendicitis', icd10Code: 'K35.80', proposedLineOfTreatment: ['Surgical Management'],
    surgicalNameOfSurgery: 'Laparoscopic Appendectomy', icd10PcsCode: '0DTJ4ZZ',
    routeOfDrugAdministration: 'IV Ceftriaxone, IV Metronidazole, IV Paracetamol', otherTreatmentsDetails: 'Post-op observation and serial vitals',
    accidentIsRta: 'No', accidentReportedToPolice: 'No', substanceAbuseAlcohol: 'No',
  };
  const admissionPayload = {
    admissionDate: '130526', admissionTime: '1030', hospitalizationEventType: 'Planned', expectedDaysStay: '5',
    roomType: 'Single Private', expectedDaysIcu: '2', costRoomRentNursing: '50000', costInvestigationDiagnostics: '25000',
    costIcuCharges: '40000', costOtCharges: '75000', costProfessionalFees: '60000', costMedicinesConsumables: '100000',
    costOtherHospitalExpenses: '20000', costSumTotalExpected: '370000',
  };
  const chronicPayload = {
    diabetes: { present: true, sinceMmyy: '0620' }, hypertension: { present: true, sinceMmyy: '0122' },
  };
  const doctorBlock = { page2DoctorName: 'Dr. Amit Verma', page2DoctorQualification: 'MBBS, MS (General Surgery)', page2DoctorRegistrationNo: 'MMC20120541' };

  const sections = { sectionAStatus: 'SUBMITTED', sectionBStatus: 'SUBMITTED', sectionCStatus: 'SUBMITTED', sectionDStatus: 'SUBMITTED' };
  const request1 = await prisma.cashlessRequest.create({
    data: {
      requestId: 'CR-2026-00123', hospitalId: hospital.id, patientId: patientRajesh.id, doctorId: doctorAmit.id, createdById: hospitalStaff.id,
      ...sections, status: deriveStatus({ ...sections, status: 'IN_PROGRESS' }),
      providerData: JSON.stringify(provider(hospital)), patientData: JSON.stringify(patientPayload),
      clinicalData: JSON.stringify(clinicalPayload), admissionData: JSON.stringify(admissionPayload),
      chronicData: JSON.stringify(chronicPayload), declarationsData: JSON.stringify(doctorBlock),
      sectionMeta: JSON.stringify({
        A: { enteredBy: 'Priya Sharma', enteredByRole: 'HOSPITAL_STAFF', verified: true },
        B: { enteredBy: 'Rajesh Kumar', enteredByRole: 'PATIENT', verified: true },
        C: { enteredBy: 'Dr. Amit Verma', enteredByRole: 'DOCTOR', verified: true },
        D: { enteredBy: 'Priya Sharma', enteredByRole: 'HOSPITAL_STAFF', verified: true },
      }),
    },
  });

  // Case 2: CR-2026-00122, every section still being filled; the patient invitation (OTP 123456) is still unused -----
  const sections2 = { sectionAStatus: 'IN_PROGRESS', sectionBStatus: 'IN_PROGRESS', sectionCStatus: 'IN_PROGRESS', sectionDStatus: 'IN_PROGRESS' };
  await prisma.cashlessRequest.create({
    data: {
      requestId: 'CR-2026-00122', hospitalId: hospital.id, patientId: patientPriya.id, doctorId: doctorNeha.id, createdById: hospitalStaff.id,
      ...sections2, status: deriveStatus({ ...sections2, status: 'IN_PROGRESS' }),
      providerData: JSON.stringify(provider(hospital)),
      patientData: JSON.stringify({
        patientName: 'Meera Joshi', patientContactNo: '9812345678', gender: 'Female', ageYears: 32, dob: '20081993',
        policyNumberCorporate: 'POL-99214-RETAIL', insuredCardId: 'CARD-MEERA-091', proposerName: 'Meera Joshi',
        hasOtherMediclaim: 'No', hasFamilyPhysician: 'No',
      }),
      admissionData: JSON.stringify({ admissionDate: '140526', admissionTime: '0900', hospitalizationEventType: 'Planned', expectedDaysStay: '3', roomType: 'Twin Sharing', costRoomRentNursing: '15000', costSumTotalExpected: '15000' }),
      patientAccessToken: 'seed-invite-token-00122',
      patientOtp: hashOtp(DEMO_OTP, 'CR-2026-00122'),
      patientOtpExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    },
  });

  // Case 3: emergency case entered by the operator; confirmations still pending ----------------------
  const sections3 = { sectionAStatus: 'SUBMITTED', sectionBStatus: 'SUBMITTED', sectionCStatus: 'SUBMITTED', sectionDStatus: 'SUBMITTED' };
  await prisma.cashlessRequest.create({
    data: {
      requestId: 'CR-2026-00124', hospitalId: hospital.id, patientId: patientMohan.id, doctorId: doctorAmit.id, createdById: emergencyOperator.id,
      isEmergency: true, emergencyReason: 'Unconscious road-accident patient brought to casualty, immediate admission',
      emergencyOperatorId: emergencyOperator.id,
      ...sections3, status: deriveStatus({ ...sections3, status: 'IN_PROGRESS' }),
      providerData: JSON.stringify(provider(hospital)),
      patientData: JSON.stringify({ patientName: 'Mohan Singh', patientContactNo: '9823456789', gender: 'Male', ageYears: 58, policyNumberCorporate: 'BAJ-GRP-EMERGENCY-01', insuredCardId: 'CARD-ER-991' }),
      clinicalData: JSON.stringify({
        illnessNatureComplaints: 'Road traffic accident, blunt abdominal trauma', relevantClinicalFindings: 'Unconscious on admission, GCS 11/15',
        durationPresentAilmentDays: '1', provisionalDiagnosis: 'Polytrauma with hemoperitoneum', proposedLineOfTreatment: ['Surgical Management', 'Intensive care'],
        surgicalNameOfSurgery: 'Emergency Exploratory Laparotomy', accidentIsRta: 'Yes', accidentDateOfInjury: '13052026', accidentReportedToPolice: 'Yes', accidentFirNo: 'FIR9912',
      }),
      admissionData: JSON.stringify({ admissionDate: '130526', admissionTime: '0415', hospitalizationEventType: 'Emergency', expectedDaysStay: '7', roomType: 'ICU', expectedDaysIcu: '3', costIcuCharges: '90000', costOtCharges: '85000', costSumTotalExpected: '175000' }),
      sectionMeta: JSON.stringify({
        A: { enteredBy: 'Casualty In-Charge (ER)', enteredByRole: 'EMERGENCY_OPERATOR', verified: true },
        B: { enteredBy: 'Casualty In-Charge (ER)', enteredByRole: 'EMERGENCY_OPERATOR', verified: false },
        C: { enteredBy: 'Casualty In-Charge (ER)', enteredByRole: 'EMERGENCY_OPERATOR', verified: false },
        D: { enteredBy: 'Casualty In-Charge (ER)', enteredByRole: 'EMERGENCY_OPERATOR', verified: false },
      }),
    },
  });

  // Case in the other hospital: used to verify isolation.
  const sections4 = { sectionAStatus: 'IN_PROGRESS', sectionBStatus: 'NOT_STARTED', sectionCStatus: 'NOT_STARTED', sectionDStatus: 'NOT_STARTED' };
  const lifelineStaff = await prisma.user.findUniqueOrThrow({ where: { email: 'staff@lifelinehospital.org' } });
  await prisma.cashlessRequest.create({
    data: {
      requestId: 'CR-2026-00125', hospitalId: hospital2.id, patientId: patientOtherHospital.id, createdById: lifelineStaff.id,
      ...sections4, status: deriveStatus({ ...sections4, status: 'IN_PROGRESS' }), providerData: JSON.stringify(provider(hospital2)),
    },
  });

  await prisma.auditLog.create({
    data: { requestId: request1.id, userId: hospitalStaff.id, userName: hospitalStaff.name, userRole: hospitalStaff.role, action: 'REQUEST_CREATED', details: 'Request CR-2026-00123 created (seed data)' },
  });

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
