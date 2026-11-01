'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, FileCheck2, Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLE_HOME, api, useDocumentTitle } from '@/lib/client';

function LoginForm() {
  useDocumentTitle('Sign in');
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api<{ user: { role: string } }>('/api/auth/login', { method: 'POST', json: { email, password } });
      const next = params.get('next');
      // Same-site relative paths only.
      const safeNext = next && /^\/(?!\/)[A-Za-z0-9/_\-.?=&%]*$/.test(next) ? next : null;
      router.replace(safeNext || ROLE_HOME[d.user.role] || '/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="relative bg-gradient-to-br from-[#0A65FF] to-[#0440A8] p-8 text-white flex flex-col justify-between gap-10 overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
          <a href="/" className="relative z-10 flex items-center gap-2.5 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="ClaimFlow Health logo" className="w-10 h-10 object-contain drop-shadow-md" />
            <span className="text-xl font-extrabold tracking-tight">ClaimFlow Health</span>
          </a>
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl font-extrabold leading-snug tracking-tight">One cashless request, completed together and printed on the original form.</h2>
            <ul className="space-y-4 text-sm text-blue-50">
              {[
                { icon: ClipboardList, title: 'Each person fills their own part', text: 'Hospital desk, patient and doctor edit only their section.' },
                { icon: FileCheck2, title: "The insurer's own form", text: 'Values are written onto the original four-page Bajaj form.' },
                { icon: ShieldCheck, title: 'Private and traceable', text: 'Access is limited to your hospital, and every change is logged.' },
              ].map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15"><f.icon className="h-5 w-5" /></span>
                  <span><span className="block font-bold text-white">{f.title}</span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in</h1>
              <p className="text-sm text-slate-500 mt-1">Hospital desk, doctor, emergency operator and admin accounts.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <Alert variant="destructive">{error}</Alert>}
            <Button type="submit" disabled={busy} className="w-full h-11">
              {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
              Sign in
            </Button>
            <p className="text-center text-sm text-slate-500">
              Are you a patient? <a href="/patient/access" className="font-semibold text-primary hover:underline">Continue with your OTP</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
