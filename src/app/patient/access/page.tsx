'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import { api, useDocumentTitle } from '@/lib/client';

function PatientAccessForm() {
  useDocumentTitle('Patient verification');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requestId, setRequestId] = useState(searchParams.get('id') || '');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Functional updates, so fast typing, pasting or an SMS autofill never overwrites digits with stale state.
  const handleOtpChange = (index: number, val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      setOtp((cur) => cur.map((d, i) => (i === index ? '' : d)));
      return;
    }
    // A whole code arriving in one box (autofill) is spread over the boxes; a normal keystroke keeps only its last digit.
    const take = digits.length >= 4 ? digits.slice(0, 6) : digits.slice(-1);
    const start = digits.length >= 4 ? 0 : index;
    setOtp((cur) => {
      const next = [...cur];
      take.split('').forEach((d, k) => { if (start + k < 6) next[start + k] = d; });
      return next;
    });
    inputRefs.current[Math.min(start + take.length, 5)]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (d.length > 1) {
      e.preventDefault();
      setOtp((cur) => cur.map((x, i) => d[i] ?? ''));
      inputRefs.current[Math.min(d.length, 5)]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const d = await api<{ requestId: string }>('/api/patient/verify-otp', {
        method: 'POST',
        json: { requestId: requestId.trim(), phone, otp: otp.join('') },
      });
      router.push(`/patient/${d.requestId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Friendly Hospital / Patient Hero Banner matching Screenshot */}
        <div className="relative bg-gradient-to-br from-[#0A65FF] to-[#0440A8] p-8 text-white flex flex-col justify-center gap-8 overflow-hidden">
          {/* Background Decorative Rings */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="flex items-center gap-2.5 z-10">
            <img src="/images/logo.png" alt="ClaimFlow Health Logo" className="w-10 h-10 object-contain drop-shadow-md" />
            <span className="text-xl font-extrabold tracking-tight">ClaimFlow Health</span>
          </div>

          {/* Center Illustration or Hero Photo */}
          <div className="relative z-10">
            <div className="relative w-full aspect-[1024/559] rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-[#0065FE]">
              <Image
                src="/images/patient_access_hero.webp"
                alt="Secure Access for Patients"
                fill
                unoptimized
                priority
                className="object-cover object-center"
              />
            </div>

          </div>
        </div>

        {/* Right Column: OTP Verification Box */}
        <div className="p-8 sm:p-10 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0A65FF] flex items-center justify-center mb-4">
            <Smartphone className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Patient Verification
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Enter your Cashless Request ID, the mobile number registered with the hospital, and the OTP they gave you.
          </p>

          {/* 6 Digit Input Boxes matching Screenshot */}
          <form onSubmit={handleVerify} className="w-full mt-8 space-y-5 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="rid">Cashless Request ID</Label>
              <Input id="rid" required value={requestId} onChange={(e) => setRequestId(e.target.value)} placeholder="CR-2026-00001" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mob">Registered mobile number</Label>
              <Input id="mob" required type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
            </div>
            <div className="text-sm font-semibold text-slate-700">One-time password</div>
            <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`OTP digit ${idx + 1}`}
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl border border-slate-300 text-center text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition bg-white shadow-sm"
                />
              ))}
            </div>

            <p className="text-xs text-slate-500">
              No code, or it has expired? Ask the hospital desk to send a new invitation.
            </p>
            {error && <Alert variant="destructive">{error}</Alert>}

            <Button type="submit" disabled={submitting || !requestId.trim() || phone.replace(/\D/g, '').length < 10 || otp.some((d) => !d)} className="w-full h-11">
              {submitting ? <><Loader2 className="animate-spin" /> Verifying...</> : <>Verify &amp; Continue <ArrowRight /></>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PatientAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500 text-sm">Loading Secure Verification...</div>}>
      <PatientAccessForm />
    </Suspense>
  );
}
