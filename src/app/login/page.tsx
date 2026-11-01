'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FC] p-6 font-sans">
      <Card className="w-full max-w-sm rounded-3xl shadow-xl">
        <CardContent className="p-8">
          <form onSubmit={submit} className="space-y-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="ClaimFlow Health logo" className="w-11 h-11 object-contain" />
              <span className="text-lg font-extrabold tracking-tight text-slate-900">ClaimFlow <span className="text-primary">Health</span></span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Sign in</h1>
              <p className="text-sm text-slate-500 mt-1">Hospital desk, doctor, emergency operator and admin accounts. Patients use the OTP link from the hospital.</p>
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
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
              Sign in
            </Button>
            <Button asChild variant="link" className="w-full">
              <a href="/patient/access">I am a patient with an OTP</a>
            </Button>
          </form>
        </CardContent>
      </Card>
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
