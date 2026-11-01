'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChronicEditor, FieldList, SectionEditor } from '@/components/forms/SectionEditor';
import { ApiError, api, useSession } from '@/lib/client';
import { nowHhmm, todayDdmmyyyy } from '@/lib/dates';
import { DOCTOR_BLOCK, SECTION_B, SECTION_C, SECTION_D } from '@/lib/section-config';

const NONE = '__none__'; // Radix Select items cannot have an empty value

export default function EmergencyPage() {
  const { user } = useSession();
  const [meta, setMeta] = useState<{ doctors: any[]; patients: any[]; hospital: any } | null>(null);
  const [reason, setReason] = useState('');
  const [operatorIsDoctor, setOperatorIsDoctor] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [existingId, setExistingId] = useState('');
  const [patient, setPatient] = useState<Record<string, any>>({});
  const [clinical, setClinical] = useState<Record<string, any>>({});
  const [chronic, setChronic] = useState<Record<string, any>>({});
  const [doctorBlock, setDoctorBlock] = useState<Record<string, any>>({});
  const [admission, setAdmission] = useState<Record<string, any>>({ hospitalizationEventType: 'Emergency' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // Warn before leaving with a half-filled emergency form (nothing is saved until it is submitted).
  const snapshot = (...v: unknown[]) => JSON.stringify(v);
  const initial = useRef(snapshot('', false, '', '', {}, {}, {}, {}, { hospitalizationEventType: 'Emergency' }));
  const dirty = !result && snapshot(reason, operatorIsDoctor, doctorId, existingId, patient, clinical, chronic, doctorBlock, admission) !== initial.current;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => { api('/api/meta').then(setMeta).catch((e: ApiError) => setError(e.message)); }, []);

  // Returning patient: details are copied in for the operator to confirm, never submitted silently.
  const pickPatient = (pid: string) => {
    setExistingId(pid);
    const p = meta?.patients.find((x) => x.id === pid);
    if (p) setPatient((cur) => ({ ...cur, patientName: p.name, patientContactNo: p.phone || '', insuredEmailId: p.email || '', gender: p.gender || '', ageYears: p.ageYears ?? '' }));
  };

  // Treating doctor from the directory: shown to the operator, editable.
  const pickDoctor = (did: string) => {
    setDoctorId(did);
    const d = meta?.doctors.find((x) => x.id === did);
    if (d) {
      setClinical((c) => ({ ...c, treatingDoctorName: d.name, treatingDoctorContactNo: d.phone || '' }));
      setDoctorBlock((b) => ({ ...b, name: d.name, qualification: d.qualification || '', registrationNo: d.registrationNo || '' }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api('/api/emergency', {
        method: 'POST',
        json: {
          emergencyReason: reason,
          operatorIsDoctor,
          doctorId: doctorId || undefined,
          existingPatientId: existingId || undefined,
          patient, clinical, chronic, doctorBlock,
          admission: { ...admission, hospitalizationEventType: 'Emergency' },
        },
      });
      setResult(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell title="Emergency portal" role="EMERGENCY" activeNav="emergency">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-[#E11D48] flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Emergency portal</h1>
            <p className="text-sm text-slate-500 mt-0.5">Fill the whole form alone and generate the original PDF now. Anything you leave empty stays blank on the PDF; nothing is defaulted. Doctor, patient and supervisor confirm afterwards.</p>
          </div>
        </div>

        {result ? (
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50/40">
            <CardContent className="p-6 space-y-3 text-sm text-slate-700">
              <div className="text-sm font-bold text-emerald-700">Emergency case {result.request.requestId} created</div>
              {result.pdfUrl ? (
                <p>The four-page PDF (version 1) has been generated. <a className="font-bold text-[#0A65FF] hover:underline" href={result.pdfUrl}>Open PDF</a></p>
              ) : (
                <div className="text-rose-700">
                  <p className="font-bold">The case was created but the PDF was not generated because some values do not fit the printed form:</p>
                  <ul className="list-disc pl-4">{result.issues.map((i: any, n: number) => <li key={n}><strong>{i.label}</strong>: {i.message}</li>)}</ul>
                  <p className="mt-1">Shorten them in the case, then generate again.</p>
                </div>
              )}
              <p>Pending after generation: {result.request.emergencyPending.join(', ') || 'nothing'}.</p>
              {result.devOtp && <p>Patient OTP for later confirmation (no SMS gateway here): <strong className="font-mono">{result.devOtp}</strong></p>}
              <Button asChild><Link href={`/hospital/requests/${result.request.requestId}`}>Open case</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <nav aria-label="Jump to a section" className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-600">Jump to:</span>
              {[['section-b', 'Section B'], ['section-c', 'Section C'], ['section-d', 'Section D']].map(([hid, label]) => (
                <a key={hid} href={`#${hid}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50">{label}</a>
              ))}
            </nav>
            <Card className="rounded-2xl border-rose-200 shadow-xs">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Start emergency mode</h2>
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Reason (mandatory, recorded in the audit log)</Label>
                  <Input id="reason" required minLength={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Returning patient (optional)</Label>
                    <Select value={existingId || NONE} onValueChange={(v) => pickPatient(v === NONE ? '' : v)}>
                      <SelectTrigger aria-label="Returning patient"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>New patient</SelectItem>
                        {meta?.patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.patientCode})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Treating doctor from directory (optional)</Label>
                    <Select value={doctorId || NONE} onValueChange={(v) => pickDoctor(v === NONE ? '' : v)}>
                      <SelectTrigger aria-label="Treating doctor from directory"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Not known yet</SelectItem>
                        {meta?.doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}{d.specialization ? ` - ${d.specialization}` : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="opdoc" checked={operatorIsDoctor} onCheckedChange={(c) => setOperatorIsDoctor(c === true)} />
                  <Label htmlFor="opdoc" className="font-normal">I am the treating doctor (uses my profile for the doctor items; Section C counts as doctor-verified)</Label>
                </div>
                {operatorIsDoctor && !user?.registrationNo && <p className="text-sm text-rose-600">Your profile has no registration number, so this cannot be used.</p>}
              </CardContent>
            </Card>

            <h2 id="section-b" className="scroll-mt-20 text-base font-bold text-slate-900">Section B - Insured / Patient</h2>
            <SectionEditor groups={SECTION_B} values={patient} onChange={setPatient} />

            <h2 id="section-c" className="scroll-mt-20 text-base font-bold text-slate-900">Section C - Treating doctor</h2>
            <p className="text-xs text-rose-700 -mt-4">Clinical details entered here are shown as unverified until the doctor confirms them.</p>
            <SectionEditor groups={SECTION_C} values={clinical} onChange={setClinical} />
            <ChronicEditor values={chronic} onChange={setChronic} />
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Doctor details printed on page 2</h2>
                <p className="text-xs text-slate-500">Left blank on the PDF unless a doctor has entered or confirmed them.</p>
                <FieldList fields={DOCTOR_BLOCK} values={doctorBlock} onChange={setDoctorBlock} />
              </CardContent>
            </Card>

            <h2 id="section-d" className="scroll-mt-20 text-base font-bold text-slate-900">Section D - Admission and costs</h2>
            <div className="flex items-center gap-3 text-sm">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdmission((a) => ({ ...a, admissionDate: todayDdmmyyyy().slice(0, 4) + todayDdmmyyyy().slice(6), admissionTime: nowHhmm() }))}>Set admission date and time to now</Button>
              <span className="text-slate-500">Shown for you to confirm; not filled automatically.</span>
            </div>
            <SectionEditor groups={SECTION_D} values={admission} onChange={setAdmission} optionOverrides={{ hospitalizationEventType: ['Emergency'] }} />

            {error && <Alert variant="destructive">{error}</Alert>}
            <div className="sticky bottom-0 z-10 -mx-2 flex items-center justify-end gap-3 border-t border-slate-200/80 bg-white/90 px-2 py-3 backdrop-blur">
              <Button type="submit" variant="emergency" size="lg" disabled={busy || !patient.patientName || reason.trim().length < 3}>
                {busy && <Loader2 className="animate-spin" />} Create case and generate PDF
              </Button>
            </div>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
