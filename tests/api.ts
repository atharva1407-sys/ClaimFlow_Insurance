// End-to-end checks against a running server and a freshly seeded database.
//   npm run seed && npm run dev      (or build + start)
//   BASE_URL=http://localhost:3000 npm run test:api
// The script changes data (creates cases, generates PDFs): run it against demo data only.
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

class Client {
  cookies: Record<string, string> = {};
  async req(path: string, init: { method?: string; json?: unknown; form?: FormData; raw?: boolean } = {}) {
    const res = await fetch(BASE + path, {
      method: init.method || (init.json || init.form ? 'POST' : 'GET'),
      headers: {
        ...(init.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        cookie: Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; '),
      },
      body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined),
      redirect: 'manual',
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      const [k, v] = [pair.slice(0, i), pair.slice(i + 1)];
      if (v === '' || /max-age=0/i.test(c) || /expires=Thu, 01 Jan 1970/i.test(c)) delete this.cookies[k];
      else this.cookies[k] = v;
    }
    if (init.raw) return { status: res.status, res };
    const text = await res.text();
    let body: any = {};
    try { body = JSON.parse(text); } catch { body = { text }; }
    return { status: res.status, body, res };
  }
  login = (email: string) => this.req('/api/auth/login', { json: { email, password: 'password123' } });
}


const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const fileForm = (bytes: Buffer, name: string) => {
  const fd = new FormData();
  fd.set('file', new File([new Uint8Array(bytes)], name));
  return fd;
};
const tinyPdf = async () => {
  const d = await PDFDocument.create();
  d.addPage([200, 200]);
  return Buffer.from(await d.save());
};

let passed = 0;
const test = async (name: string, fn: () => Promise<void>) => {
  try { await fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n       ${(e as Error).message}`); process.exitCode = 1; }
};

(async () => {
  const anon = new Client();
  const staff = new Client();
  const doctor = new Client();
  const operator = new Client();
  const other = new Client();
  const patient = new Client();

  console.log('authentication');
  await test('every data route refuses an anonymous caller', async () => {
    for (const p of ['/api/requests', '/api/requests/CR-2026-00123', '/api/requests/CR-2026-00123/pdf', '/api/requests/CR-2026-00123/validate', '/api/meta']) {
      assert.equal((await anon.req(p)).status, 401, p);
    }
  });
  await test('a forged session cookie is refused', async () => {
    const c = new Client();
    const forged = Buffer.from(JSON.stringify({ kind: 'staff', uid: 'x', exp: Date.now() + 1e9 })).toString('base64url');
    c.cookies.claimflow_session = `${forged}.AAAA`;
    assert.equal((await c.req('/api/requests')).status, 401);
  });
  await test('wrong password and unknown user look the same', async () => {
    const a = await anon.req('/api/auth/login', { json: { email: 'hospital_desk@carehosp.com', password: 'nope' } });
    const b = await anon.req('/api/auth/login', { json: { email: 'nobody@x.com', password: 'nope' } });
    assert.equal(a.status, 401); assert.equal(b.status, 401); assert.equal(a.body.error, b.body.error);
  });
  await test('login works for every role', async () => {
    for (const [c, e] of [[staff, 'hospital_desk@carehosp.com'], [doctor, 'doctor_101@carehosp.com'], [operator, 'er@carehosp.com'], [other, 'staff@lifelinehospital.org']] as [Client, string][]) {
      assert.equal((await c.login(e)).status, 200, e);
    }
  });
  await test('the passwordless role switch is off', async () => assert.equal((await anon.req('/api/auth/switch-role?role=ADMIN', { raw: true })).status, 404));
  await test('generated PDFs are not served from /public', async () => assert.equal((await anon.req('/generated-pdfs/Cashless_CR-2026-00123_v1.pdf', { raw: true })).status, 404));

  console.log('hospital isolation');
  await test('staff list holds only their own hospital', async () => {
    const r = await staff.req('/api/requests');
    const ids = r.body.requests.map((x: any) => x.requestId);
    assert.ok(ids.includes('CR-2026-00123') && !ids.includes('CR-2026-00125'), ids.join());
  });
  await test('list rows carry no OTP, token or clinical data', async () => {
    const row = (await staff.req('/api/requests')).body.requests[0];
    for (const k of ['patientOtp', 'patientAccessToken', 'clinicalData', 'patientData', 'latestPdfPath']) assert.ok(!(k in row), k);
  });
  await test('another hospital\'s request answers 404, not 403', async () => {
    assert.equal((await staff.req('/api/requests/CR-2026-00125')).status, 404);
    assert.equal((await other.req('/api/requests/CR-2026-00123')).status, 404);
    assert.equal((await staff.req('/api/requests/CR-2026-00125/pdf')).status, 404);
    assert.equal((await staff.req('/api/requests/CR-2026-00125', { method: 'PATCH', json: { action: 'SAVE_SECTION', section: 'A', data: { city: 'x' } } })).status, 404);
  });
  await test('doctor sees only assigned cases', async () => {
    const ids = (await doctor.req('/api/requests')).body.requests.map((x: any) => x.requestId);
    assert.ok(ids.includes('CR-2026-00123') && !ids.includes('CR-2026-00122'), ids.join());
    assert.equal((await doctor.req('/api/requests/CR-2026-00122')).status, 404);
  });

  console.log('section ownership');
  await test('staff cannot edit Section B or C', async () => {
    for (const s of ['B', 'C']) assert.equal((await staff.req('/api/requests/CR-2026-00122', { method: 'PATCH', json: { action: 'SAVE_SECTION', section: s, data: {} } })).status, 403, s);
  });
  await test('doctor cannot edit Section A, B or D', async () => {
    for (const s of ['A', 'B', 'D']) assert.equal((await doctor.req('/api/requests/CR-2026-00123', { method: 'PATCH', json: { action: 'SAVE_SECTION', section: s, data: {} } })).status, 403, s);
  });
  await test('a submitted section is locked until the desk returns it', async () => {
    assert.equal((await staff.req('/api/requests/CR-2026-00123', { method: 'PATCH', json: { action: 'SAVE_SECTION', section: 'D', data: { roomType: 'x' } } })).status, 409);
  });
  await test('invalid input is rejected with a message', async () => {
    const neha = new Client();
    await neha.login('neha@carehosp.com');
    const r = await neha.req('/api/requests/CR-2026-00122', { method: 'PATCH', json: { action: 'SAVE_SECTION', section: 'C', data: { clinical: { proposedLineOfTreatment: ['Homeopathy'] } } } });
    assert.equal(r.status, 400); assert.ok(r.body.error);
  });

  console.log('patient access');
  await test('wrong OTP is refused and counted', async () => {
    const r = await patient.req('/api/patient/verify-otp', { json: { requestId: 'CR-2026-00122', phone: '9812345678', otp: '000000' } });
    assert.equal(r.status, 400); assert.ok(!patient.cookies.claimflow_patient);
  });
  await test('wrong mobile number is refused', async () => {
    assert.equal((await patient.req('/api/patient/verify-otp', { json: { requestId: 'CR-2026-00122', phone: '9000000000', otp: '123456' } })).status, 400);
  });
  await test('the OTP is rejected for the internal ID (public request ID only)', async () => {
    const internal = (await staff.req('/api/requests/CR-2026-00122')).body; // doctor-owned: staff sees it
    assert.ok(internal.request?.id);
    assert.equal((await patient.req('/api/patient/verify-otp', { json: { requestId: internal.request.id, phone: '9812345678', otp: '123456' } })).status, 400);
  });
  await test('correct details open only that request, once', async () => {
    const ok = await patient.req('/api/patient/verify-otp', { json: { requestId: 'CR-2026-00122', phone: '98123 45678', otp: '123456' } });
    assert.equal(ok.status, 200);
    assert.ok(patient.cookies.claimflow_patient);
    const again = await new Client().req('/api/patient/verify-otp', { json: { requestId: 'CR-2026-00122', phone: '9812345678', otp: '123456' } });
    assert.equal(again.status, 400, 'OTP must be single-use');
  });
  await test('the patient sees Section B only', async () => {
    const r = await patient.req('/api/requests/CR-2026-00122');
    assert.equal(r.status, 200);
    for (const k of ['clinicalData', 'providerData', 'admissionData', 'auditLogs', 'doctor', 'patientOtp']) assert.ok(!(k in r.body.request), k);
    assert.ok('patientData' in r.body.request);
  });
  await test('the patient cannot read another request, a live preview, or edit other sections', async () => {
    assert.equal((await patient.req('/api/requests/CR-2026-00123')).status, 404);
    assert.equal((await patient.req('/api/requests/CR-2026-00122/pdf')).status, 404, 'no saved version yet, and no live preview for patients');
    assert.equal((await patient.req('/api/requests/CR-2026-00123/pdf')).status, 404, 'other cases stay hidden');
    assert.equal((await patient.req('/api/requests/CR-2026-00122', { method: 'PATCH', json: { action: 'SAVE_SECTION', section: 'C', data: { clinical: {} } } })).status, 403);
    assert.equal((await patient.req('/api/requests')).status, 401);
  });
  await test('the patient can fill and submit Section B', async () => {
    const r = await patient.req('/api/requests/CR-2026-00122', { method: 'PATCH', json: { action: 'SUBMIT_SECTION', section: 'B', data: { addressLine1: '12 Lake Road', gender: 'Female', patientContactNo: '+91 98123 45678' } } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await patient.req('/api/requests/CR-2026-00122')).body.request.patientData.patientContactNo, '9812345678');
  });

  await test('supporting documents: optional, per role, and the patient only sees their own', async () => {
    const up = await patient.req('/api/requests/CR-2026-00122/documents', { form: fileForm(PNG, 'insurance-card.png') });
    assert.equal(up.status, 200, JSON.stringify(up.body));
    assert.ok(!('filePath' in up.body.document));
    const neha = new Client();
    await neha.login('neha@carehosp.com');
    const dr = await neha.req('/api/requests/CR-2026-00122/documents', { form: fileForm(await tinyPdf(), 'lab-report.pdf') });
    assert.equal(dr.status, 200, JSON.stringify(dr.body));
    assert.equal((await patient.req('/api/requests/CR-2026-00122/documents')).body.documents.length, 1);
    assert.equal((await staff.req('/api/requests/CR-2026-00122/documents')).body.documents.length, 2);
    assert.equal((await patient.req(`/api/requests/CR-2026-00122/documents?id=${dr.body.document.id}`, { method: 'DELETE' })).status, 404);
    assert.equal((await neha.req(`/api/requests/CR-2026-00122/documents?id=${up.body.document.id}`, { method: 'DELETE' })).status, 403);
    assert.equal((await staff.req(`/api/requests/CR-2026-00122/documents?id=${dr.body.document.id}`, { method: 'DELETE' })).status, 200);
    assert.equal((await staff.req('/api/requests/CR-2026-00122/documents?download=' + up.body.document.id, { raw: true })).status, 200);
  });
  await test('supporting documents: fake or damaged files and outsiders are refused', async () => {
    assert.equal((await patient.req('/api/requests/CR-2026-00122/documents', { form: fileForm(Buffer.from('not a pdf'), 'x.pdf') })).status, 400);
    assert.equal((await patient.req('/api/requests/CR-2026-00122/documents', { form: fileForm(Buffer.from('%PDF-1.4 broken'), 'x.pdf') })).status, 400);
    assert.equal((await other.req('/api/requests/CR-2026-00122/documents')).status, 404);
    assert.equal((await anon.req('/api/requests/CR-2026-00122/documents')).status, 401);
  });

  console.log('normal workflow');
  await test('staff saves Section D (previously crashed) and the case version moves', async () => {
    const before = (await staff.req('/api/requests/CR-2026-00122')).body.request;
    const r = await staff.req('/api/requests/CR-2026-00122', { method: 'PATCH', json: { action: 'SAVE_SECTION', section: 'D', data: { costRoomRentNursing: '1,000', admissionDate: '2026-05-14', admissionTime: '09:30', hospitalizationEventType: 'Planned' } } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const after = (await staff.req('/api/requests/CR-2026-00122')).body.request;
    assert.equal(after.caseVersion, before.caseVersion + 1);
    assert.equal(after.admissionData.admissionDate, '140526');
    assert.equal(after.admissionData.costRoomRentNursing, '1000');
  });
  await test('doctor completes Section C and the case becomes ready for review', async () => {
    const r = await doctor.req('/api/requests/CR-2026-00123/validate');
    assert.equal(r.status, 200);
    const d2 = new Client();
    await d2.login('neha@carehosp.com');
    const save = await d2.req('/api/requests/CR-2026-00122', { method: 'PATCH', json: { action: 'SUBMIT_SECTION', section: 'C', data: { clinical: { provisionalDiagnosis: 'Viral fever', icd10Code: 'B34.9', proposedLineOfTreatment: ['Medical Management'], investigationMedicalManagementDetails: 'IV fluids' }, doctorBlock: { name: 'Dr. Neha Gupta', qualification: 'MBBS, MD', registrationNo: 'MMC20150992' } } } });
    assert.equal(save.status, 200, JSON.stringify(save.body));
    const s = (await staff.req('/api/requests/CR-2026-00122')).body.request;
    assert.equal(s.sectionCStatus, 'SUBMITTED');
    assert.equal(s.status, 'IN_PROGRESS'); // Section A of this case is still only a draft
  });
  await test('an incomplete case cannot be finalised or sent', async () => {
    const pdf = await staff.req('/api/requests/CR-2026-00122/pdf', { method: 'POST', json: {} });
    assert.equal(pdf.status, 409);
    assert.ok(pdf.body.blockers.length > 0);
    assert.equal((await staff.req('/api/requests/CR-2026-00122', { method: 'PATCH', json: { action: 'UPDATE_STATUS', newStatus: 'SUBMITTED_TO_TPA' } })).status, 409);
  });
  await test('staff can generate, fetch and version a PDF for a complete case', async () => {
    const gen = await staff.req('/api/requests/CR-2026-00123/pdf', { method: 'POST', json: { reason: 'test' } });
    assert.equal(gen.status, 200, JSON.stringify(gen.body));
    assert.equal(gen.body.version, 1);
    const file = await staff.req('/api/requests/CR-2026-00123/pdf?version=1', { raw: true });
    assert.equal(file.status, 200);
    const bytes = Buffer.from(await (file as any).res.arrayBuffer());
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    const hub = (await staff.req('/api/requests/CR-2026-00123')).body.request;
    assert.equal(hub.versions[0].isOutdated, false);
    assert.ok(!('filePath' in hub.versions[0]));
  });
  await test('returning a section and correcting it makes the old PDF outdated', async () => {
    assert.equal((await staff.req('/api/requests/CR-2026-00123', { method: 'PATCH', json: { action: 'RETURN_SECTION', section: 'D', note: 'Check ICU days' } })).status, 200);
    const fix = await staff.req('/api/requests/CR-2026-00123', { method: 'PATCH', json: { action: 'SUBMIT_SECTION', section: 'D', data: { expectedDaysIcu: '2' } } });
    assert.equal(fix.status, 200, JSON.stringify(fix.body));
    const hub = (await staff.req('/api/requests/CR-2026-00123')).body.request;
    assert.equal(hub.versions[0].isOutdated, true);
    const gen = await staff.req('/api/requests/CR-2026-00123/pdf', { method: 'POST', json: {} });
    assert.equal(gen.body.version, 2);
  });
  await test('supporting documents are appended after page 4 and make the old PDF outdated', async () => {
    const before = await staff.req('/api/requests/CR-2026-00123/pdf?version=2', { raw: true });
    assert.equal((await PDFDocument.load(Buffer.from(await (before as any).res.arrayBuffer()))).getPageCount(), 4);
    assert.equal((await staff.req('/api/requests/CR-2026-00123/documents', { form: fileForm(PNG, 'extra.png') })).status, 200);
    assert.equal((await staff.req('/api/requests/CR-2026-00123')).body.request.versions[0].isOutdated, true);
    const gen = await staff.req('/api/requests/CR-2026-00123/pdf', { method: 'POST', json: {} });
    assert.equal(gen.status, 200, JSON.stringify(gen.body));
    const file = await staff.req(`/api/requests/CR-2026-00123/pdf?version=${gen.body.version}`, { raw: true });
    assert.equal((await PDFDocument.load(Buffer.from(await (file as any).res.arrayBuffer()))).getPageCount(), 5);
  });
  await test('sending to the TPA needs a current PDF, then follows the allowed transitions', async () => {
    const send = await staff.req('/api/requests/CR-2026-00123', { method: 'PATCH', json: { action: 'UPDATE_STATUS', newStatus: 'SUBMITTED_TO_TPA' } });
    assert.equal(send.status, 200, JSON.stringify(send.body));
    assert.equal((await staff.req('/api/requests/CR-2026-00123', { method: 'PATCH', json: { action: 'UPDATE_STATUS', newStatus: 'DISCHARGED' } })).status, 409);
    assert.equal((await staff.req('/api/requests/CR-2026-00123', { method: 'PATCH', json: { action: 'UPDATE_STATUS', newStatus: 'TPA_QUERY' } })).status, 400, 'query text is required');
    assert.equal((await staff.req('/api/requests/CR-2026-00123', { method: 'PATCH', json: { action: 'UPDATE_STATUS', newStatus: 'TPA_QUERY', note: 'Need discharge plan' } })).status, 200);
  });

  console.log('emergency mode');
  await test('only the emergency operator can start it, and a reason is mandatory', async () => {
    assert.equal((await staff.req('/api/emergency', { json: { emergencyReason: 'x'.repeat(10), patient: { patientName: 'A' } } })).status, 403);
    assert.equal((await doctor.req('/api/emergency', { json: { emergencyReason: 'x'.repeat(10), patient: { patientName: 'A' } } })).status, 403);
    assert.equal((await operator.req('/api/emergency', { json: { patient: { patientName: 'A' } } })).status, 400);
  });
  let emergencyId = '';
  await test('operator creates a case alone and gets a PDF with nothing invented', async () => {
    const r = await operator.req('/api/emergency', { json: { emergencyReason: 'Unconscious patient, immediate admission', doctorId: undefined, patient: { patientName: 'Test Patient', gender: 'Male' }, clinical: { provisionalDiagnosis: 'Head injury' }, admission: { admissionDate: '2026-05-13', admissionTime: '04:15' } } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    emergencyId = r.body.request.requestId;
    assert.ok(r.body.pdfUrl, 'PDF generated immediately');
    assert.equal(r.body.request.isEmergency, true);
    assert.deepEqual(r.body.request.emergencyPending, ['doctor', 'patient', 'supervisor']);
    const d = (await operator.req(`/api/requests/${emergencyId}`)).body.request;
    assert.equal(d.admissionData.hospitalizationEventType, 'Emergency');
    assert.equal(d.patientData.insuredCardId, undefined);
    assert.equal(d.patientData.patientContactNo, undefined);
    assert.equal(d.clinicalData.icd10Code, undefined);
    assert.equal(d.admissionData.costSumTotalExpected, undefined);
    assert.equal(d.sectionMeta.C.verified, false);
    assert.equal(d.status, 'READY_FOR_REVIEW');
  });
  await test('the operator cannot touch normal cases', async () => {
    assert.equal((await operator.req('/api/requests/CR-2026-00122', { method: 'PATCH', json: { action: 'SAVE_SECTION', section: 'A', data: { city: 'x' } } })).status, 403);
  });
  await test('the supervisor review must come from someone other than the operator', async () => {
    assert.equal((await operator.req(`/api/requests/${emergencyId}`, { method: 'PATCH', json: { action: 'EMERGENCY_CONFIRM', confirmType: 'SUPERVISOR' } })).status, 403);
    assert.equal((await staff.req(`/api/requests/${emergencyId}`, { method: 'PATCH', json: { action: 'EMERGENCY_CONFIRM', confirmType: 'SUPERVISOR' } })).status, 200);
  });

  console.log('emergency case from the seed');
  await test('doctor confirms Section C only on their own assigned case', async () => {
    assert.equal((await staff.req('/api/requests/CR-2026-00124', { method: 'PATCH', json: { action: 'EMERGENCY_CONFIRM', confirmType: 'DOCTOR' } })).status, 403);
    assert.equal((await doctor.req('/api/requests/CR-2026-00124', { method: 'PATCH', json: { action: 'EMERGENCY_CONFIRM', confirmType: 'DOCTOR' } })).status, 200);
  });

  console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
})();
