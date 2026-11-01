// Pure-logic checks: no database and no running server. Run with `npm run test:unit`.
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { canAccessRequest, canEditSection, signToken, verifyToken, createSessionToken } from '../src/lib/auth';
import { validateCashlessRequest } from '../src/lib/rules';
import { deriveStatus, pendingEmergencyConfirmations } from '../src/lib/workflow';
import { flattenForPdf, generateCashlessPdfWithReport } from '../src/lib/pdf-generator';
import { admissionSchema, patientSchema, clinicalSchema } from '../src/lib/schemas';
import { toDdmmyy, toDdmmyyyy, toMobile10 } from '../src/lib/dates';
import { hashOtp, otpMatches } from '../src/lib/otp';

let passed = 0;
const test = async (name: string, fn: () => unknown) => {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${(e as Error).message}`);
    process.exitCode = 1;
  }
};

(async () => {
  console.log('auth tokens');
  await test('round trip', () => assert.equal(verifyToken<any>(signToken({ uid: 'u1' }, 60_000))?.uid, 'u1'));
  await test('tampered payload is rejected', () => {
    const [body, sig] = signToken({ uid: 'u1' }, 60_000).split('.');
    const forged = Buffer.from(JSON.stringify({ uid: 'admin', exp: Date.now() + 1e9 })).toString('base64url');
    assert.equal(verifyToken(`${forged}.${sig}`), null);
    assert.equal(verifyToken(`${body}.${sig}x`), null);
  });
  await test('the old guessable signature scheme no longer works', () => {
    const encoded = Buffer.from(JSON.stringify({ id: 'x', role: 'ADMIN', exp: Date.now() + 1e9 })).toString('base64url');
    const oldSig = Buffer.from(`${encoded}:claimflow-secret-key-2026-secure-session`).toString('base64url').substring(0, 16);
    assert.equal(verifyToken(`${encoded}.${oldSig}`), null);
  });
  await test('expired token is rejected', () => assert.equal(verifyToken(signToken({ uid: 'u1' }, -1)), null));
  await test('session token carries only the user id', () => {
    const t = verifyToken<any>(createSessionToken({ id: 'u9', name: 'N', email: 'e', role: 'ADMIN' }));
    assert.deepEqual(Object.keys(t!).sort(), ['exp', 'kind', 'uid']);
  });

  console.log('permissions');
  const staff = { role: 'HOSPITAL_STAFF' as const, hospitalId: 'h1', id: 's', name: '', email: '' };
  const doctor = { role: 'DOCTOR' as const, hospitalId: 'h1', id: 'd1', name: '', email: '' };
  const op = { role: 'EMERGENCY_OPERATOR' as const, hospitalId: 'h1', id: 'o', name: '', email: '' };
  const admin = { role: 'ADMIN' as const, hospitalId: null, id: 'a', name: '', email: '' };
  await test('roles edit only their own sections', () => {
    assert.ok(canEditSection(staff, 'A', false) && canEditSection(staff, 'D', false));
    assert.ok(!canEditSection(staff, 'B', false) && !canEditSection(staff, 'C', false));
    assert.ok(canEditSection(doctor, 'C', false) && !canEditSection(doctor, 'A', false) && !canEditSection(doctor, 'B', false));
    assert.ok(canEditSection({ role: 'PATIENT' }, 'B', false) && !canEditSection({ role: 'PATIENT' }, 'C', false));
  });
  await test('emergency operator edits all sections only in an emergency case', () => {
    for (const s of ['A', 'B', 'C', 'D'] as const) {
      assert.ok(canEditSection(op, s, true));
      assert.ok(!canEditSection(op, s, false));
    }
  });
  await test('admin cannot edit any section', () => assert.ok(!canEditSection(admin, 'A', false) && !canEditSection(admin, 'C', true)));
  await test('hospital isolation and doctor assignment', () => {
    assert.ok(canAccessRequest(staff, { hospitalId: 'h1' }));
    assert.ok(!canAccessRequest(staff, { hospitalId: 'h2' }));
    assert.ok(canAccessRequest(doctor, { hospitalId: 'h1', doctorId: 'd1' }));
    assert.ok(!canAccessRequest(doctor, { hospitalId: 'h1', doctorId: 'other' }));
    assert.ok(!canAccessRequest(doctor, { hospitalId: 'h1', doctorId: null }));
    assert.ok(!canAccessRequest(admin, { hospitalId: 'h1' }));
  });

  console.log('workflow');
  await test('status follows the sections', () => {
    const base = { status: 'IN_PROGRESS', sectionAStatus: 'SUBMITTED', sectionDStatus: 'SUBMITTED' };
    assert.equal(deriveStatus({ ...base, sectionBStatus: 'SUBMITTED', sectionCStatus: 'SUBMITTED' }), 'READY_FOR_REVIEW');
    assert.equal(deriveStatus({ ...base, sectionBStatus: 'SUBMITTED', sectionCStatus: 'IN_PROGRESS' }), 'AWAITING_DOCTOR');
    assert.equal(deriveStatus({ ...base, sectionBStatus: 'NOT_STARTED', sectionCStatus: 'SUBMITTED' }), 'AWAITING_PATIENT');
    assert.equal(deriveStatus({ ...base, sectionAStatus: 'IN_PROGRESS', sectionBStatus: 'SUBMITTED', sectionCStatus: 'SUBMITTED' }), 'IN_PROGRESS');
    assert.equal(deriveStatus({ ...base, status: 'SUBMITTED_TO_TPA', sectionBStatus: 'NOT_STARTED', sectionCStatus: 'NOT_STARTED' }), 'SUBMITTED_TO_TPA');
  });
  await test('emergency pending confirmations', () =>
    assert.deepEqual(pendingEmergencyConfirmations({ isEmergency: true, emergencyDoctorConfirmed: true, emergencyPatientConfirmed: false, emergencySupervisorReviewed: false }), ['patient', 'supervisor']));

  console.log('dates and input schemas');
  await test('date helpers', () => {
    assert.equal(toDdmmyyyy('2026-05-12'), '12052026');
    assert.equal(toDdmmyy('12052026'), '120526');
    assert.equal(toDdmmyy('2026-05-12'), '120526');
    assert.equal(toMobile10('+91 98765 43210'), '9876543210');
  });
  await test('gender "Other" is rejected because the form has no such option', () => assert.equal(patientSchema.safeParse({ gender: 'Other' }).success, false));
  await test('mobile numbers are normalised and checked', () => {
    assert.equal(patientSchema.parse({ patientContactNo: '+91 98765 43210' }).patientContactNo, '9876543210');
    assert.equal(patientSchema.safeParse({ patientContactNo: '12345' }).success, false);
  });
  await test('unknown keys are dropped', () => assert.deepEqual(Object.keys(patientSchema.parse({ patientName: 'A', isAdmin: true })), ['patientName']));
  await test('amounts: commas ok, paise rejected, no zero padding', () => {
    assert.equal(admissionSchema.parse({ costOtCharges: '3,50,000' }).costOtCharges, '350000');
    assert.equal(admissionSchema.safeParse({ costOtCharges: '100.50' }).success, false);
  });
  await test('invalid dates and treatment options are rejected', () => {
    assert.equal(clinicalSchema.safeParse({ dateOfFirstConsultation: '99' }).success, false);
    assert.equal(clinicalSchema.safeParse({ proposedLineOfTreatment: ['Homeopathy'] }).success, false);
  });
  await test('OTP is hashed and bound to the request', () => {
    const h = hashOtp('123456', 'CR-1');
    assert.ok(otpMatches('123456', 'CR-1', h));
    assert.ok(!otpMatches('123456', 'CR-2', h));
    assert.ok(!otpMatches('000000', 'CR-1', h));
    assert.ok(!otpMatches('123456', 'CR-1', null));
  });

  console.log('rules engine');
  await test('empty fields never block or warn: the app does not decide what is mandatory', () => {
    const r = validateCashlessRequest({ patient: {}, clinical: {}, admissionExpense: {}, chronic: {} });
    assert.deepEqual(r.blockers, []);
    assert.deepEqual(r.warnings, []);
  });
  await test('surgery without a name blocks; without OT charges warns', () => {
    const r = validateCashlessRequest({ clinical: { proposedLineOfTreatment: ['Surgical Management'] }, admissionExpense: { costOtCharges: '0' } });
    assert.ok(r.blockers.some((b) => b.fieldId === 'surgical_name_of_surgery'));
    assert.ok(r.warnings.some((w) => w.fieldId === 'cost_ot_charges'));
  });
  await test('admission before first consultation (6- and 8-digit dates)', () => {
    const r = validateCashlessRequest({ clinical: { dateOfFirstConsultation: '20052026' }, admissionExpense: { admissionDate: '120526' } });
    assert.ok(r.warnings.some((w) => /earlier than the date of first consultation/.test(w.message)));
  });
  await test('ICU days and charges must agree', () => {
    const a = validateCashlessRequest({ admissionExpense: { expectedDaysIcu: '2', costIcuCharges: '0' } });
    const b = validateCashlessRequest({ admissionExpense: { expectedDaysIcu: '0', costIcuCharges: '5000' } });
    assert.ok(a.warnings.some((w) => w.fieldId === 'cost_icu_charges') && b.warnings.some((w) => w.fieldId === 'expected_days_icu'));
  });
  await test('total is accepted under any plausible formula, flagged otherwise', () => {
    const ok = validateCashlessRequest({ admissionExpense: { costOtCharges: '1000', costProfessionalFees: '500', costSumTotalExpected: '1500' } });
    const pkg = validateCashlessRequest({ admissionExpense: { costOtCharges: '1000', costAllInclusivePackage: '900', costSumTotalExpected: '900' } });
    const bad = validateCashlessRequest({ admissionExpense: { costOtCharges: '1000', costSumTotalExpected: '7' } });
    assert.ok(!ok.warnings.some((w) => w.fieldId === 'cost_sum_total_expected'));
    assert.ok(!pkg.warnings.some((w) => w.fieldId === 'cost_sum_total_expected'));
    assert.ok(bad.warnings.some((w) => w.fieldId === 'cost_sum_total_expected'));
  });
  await test('emergency case must have admission type Emergency', () => {
    const r = validateCashlessRequest({ isEmergency: true, admissionExpense: { hospitalizationEventType: 'Planned' } });
    assert.ok(r.blockers.some((b) => b.fieldId === 'hospitalization_event_type'));
  });

  console.log('pdf overlay');
  const sample = {
    provider: { hospitalName: 'City Care Super Specialty Hospital', city: 'Mumbai', state: 'Maharashtra', pinCode: '400001', contactNo: '022-2345678', emailId: 'insurance@citycare.com' },
    patient: { patientName: 'Rajesh Kumar', gender: 'Male', ageYears: 45, dob: '15061980', patientContactNo: '9876543210', insuredCardId: 'BAJ-CC-99218452', hasOtherMediclaim: 'No' },
    clinical: { provisionalDiagnosis: 'Acute Appendicitis', icd10Code: 'K35.80', proposedLineOfTreatment: ['Surgical Management'], dateOfFirstConsultation: '12052026' },
    admissionExpense: { admissionDate: '130526', admissionTime: '1030', hospitalizationEventType: 'Planned', expectedDaysStay: '5', costOtCharges: '75000' },
    chronic: { diabetes: { present: true, sinceMmyy: '0620' } },
    declarations: { page2DoctorName: 'Dr. Amit Verma', page2DoctorQualification: 'MBBS', page2DoctorRegistrationNo: 'MMC20120541', page3PatientName: 'x', page3PatientDate: '12/05/2026' } as any,
  };
  await test('four pages, nothing reported for a good case', async () => {
    const { bytes, issues } = await generateCashlessPdfWithReport(sample as any);
    assert.deepEqual(issues, []);
    assert.equal((await PDFDocument.load(bytes)).getPageCount(), 4);
  });
  await test('page 3 declarations, dates and signatures are never filled', () => {
    const flat = flattenForPdf(sample as any);
    assert.deepEqual(Object.keys(flat).filter((k) => k.startsWith('page3_')), []);
  });
  await test('doctor block can be withheld', () => {
    assert.ok('page2_doctor_name' in flattenForPdf(sample as any));
    assert.deepEqual(Object.keys(flattenForPdf({ ...sample, omitDoctorBlock: true } as any)).filter((k) => k.startsWith('page2_')), []);
  });
  await test('no zero padding: unfilled boxes stay empty', () => assert.equal(flattenForPdf(sample as any).cost_ot_charges, '75000'));
  await test('values that do not fit are reported, never truncated', async () => {
    const { issues } = await generateCashlessPdfWithReport({ patient: { insuredCardId: 'A'.repeat(20), patientName: 'N'.repeat(300), gender: 'Other' as any } });
    const by = Object.fromEntries(issues.map((i) => [i.fieldId, i.kind]));
    assert.equal(by.insured_card_id, 'overflow');
    assert.equal(by.patient_name, 'overflow');
    assert.equal(by.patient_gender, 'unsupported_value');
  });
  await test('characters the form font cannot print are reported, not thrown', async () => {
    const { issues } = await generateCashlessPdfWithReport({ patient: { patientName: 'राजेश' } });
    assert.equal(issues[0]?.kind, 'unsupported_character');
  });
  await test('incomplete dates are reported', async () => {
    const { issues } = await generateCashlessPdfWithReport({ patient: { dob: '1506' } });
    assert.equal(issues[0]?.kind, 'bad_format');
  });
  await test('long text shrinks to fit before it is rejected', async () => {
    const { issues } = await generateCashlessPdfWithReport({ patient: { patientName: 'Venkata Subramaniam Ramachandran Iyer Krishnamurthy' } });
    assert.deepEqual(issues, []);
  });

  await test('supporting documents are appended after the four form pages', async () => {
    const extra = await PDFDocument.create();
    extra.addPage([300, 300]);
    extra.addPage([300, 300]);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const { bytes, issues } = await generateCashlessPdfWithReport({
      attachments: [
        { name: 'a.pdf', bytes: await extra.save(), type: 'pdf' },
        { name: 'b.png', bytes: png, type: 'png' },
      ],
    });
    assert.deepEqual(issues, []);
    assert.equal((await PDFDocument.load(bytes)).getPageCount(), 4 + 2 + 1);
  });
  await test('an unreadable supporting document is reported, not silently dropped', async () => {
    const { issues } = await generateCashlessPdfWithReport({ attachments: [{ name: 'bad.pdf', bytes: Buffer.from('%PDF-1.4 broken'), type: 'pdf' }] });
    assert.equal(issues[0]?.kind, 'bad_attachment');
  });

  console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
})();
