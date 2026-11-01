'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Copy, Loader2 } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApiError, api } from '@/lib/client';

const NONE = '__none__'; // Radix Select items cannot have an empty value

export default function CreateNewRequestPage() {
  const [meta, setMeta] = useState<{ doctors: any[]; patients: any[] } | null>(null);
  const [mode, setMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingId, setExistingId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [doctorId, setDoctorId] = useState(NONE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ requestId: string; devOtp?: string; url: string } | null>(null);

  useEffect(() => {
    api('/api/meta').then(setMeta).catch((e: ApiError) => setError(e.message));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api('/api/requests', {
        method: 'POST',
        json: {
          admissionType: 'Planned',
          doctorId: doctorId === NONE ? undefined : doctorId,
          ...(mode === 'EXISTING' ? { existingPatientId: existingId } : { patientDetails: { name, phone, email } }),
        },
      });
      setCreated({ requestId: d.request.requestId, devOtp: d.devOtp, url: `${window.location.origin}${d.patientAccessUrl}` });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell title="New request" role="HOSPITAL" activeNav="new-request" backLink={{ href: '/hospital/dashboard', label: 'Back to dashboard' }}>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create new cashless request</h1>
          <p className="text-sm text-slate-500 mt-1">One Cashless Request ID is created per case. Emergency admissions start from the Emergency portal.</p>
        </div>

        {created ? (
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50/40">
            <CardContent className="p-6 space-y-3 text-sm text-slate-700">
              <div className="text-sm font-bold text-emerald-700">Request {created.requestId} created</div>
              <p>Give the patient this link and the one-time password. The link alone does not open anything; the patient must also enter their registered mobile number and the OTP.</p>
              <div className="flex items-center gap-2 font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 break-all">
                {created.url}
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Copy" onClick={() => navigator.clipboard.writeText(created.url)}><Copy /></Button>
              </div>
              {created.devOtp ? (
                <p>OTP (shown because no SMS gateway is connected in this environment): <strong className="font-mono text-base">{created.devOtp}</strong>. It is valid for 30 minutes and works once.</p>
              ) : (
                <p>The OTP is sent to the patient&apos;s registered mobile number.</p>
              )}
              <Button asChild>
                <Link href={`/hospital/requests/${created.requestId}`}>Open case <ArrowRight /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Patient</h2>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'NEW' | 'EXISTING')} className="flex gap-6">
                  <div className="flex items-center gap-2"><RadioGroupItem value="NEW" id="m-new" /><Label htmlFor="m-new" className="font-normal">New patient</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="EXISTING" id="m-old" /><Label htmlFor="m-old" className="font-normal">Returning patient</Label></div>
                </RadioGroup>
                {mode === 'NEW' ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="n">Full name</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="p">Mobile number</Label><Input id="p" required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10 digits" /></div>
                    <div className="space-y-1.5"><Label htmlFor="e">Email (optional)</Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Patient</Label>
                    <Select value={existingId} onValueChange={setExistingId}>
                      <SelectTrigger aria-label="Patient"><SelectValue placeholder="Select a patient" /></SelectTrigger>
                      <SelectContent>
                        {meta?.patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.patientCode})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Treating doctor</h2>
                <div className="space-y-1.5">
                  <Label>Doctor (can also be assigned later)</Label>
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger aria-label="Treating doctor"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not assigned yet</SelectItem>
                      {meta?.doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}{d.specialization ? ` - ${d.specialization}` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {error && <Alert variant="destructive">{error}</Alert>}
            <Button type="submit" disabled={busy || !meta || (mode === 'EXISTING' && !existingId)} className="w-full h-11">
              {busy && <Loader2 className="animate-spin" />}
              Generate Cashless Request ID
            </Button>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
