import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, SESSION_TTL_MS, cookieOptions, createSessionToken, isProd } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Passwordless role switch for demo machines only. It is a deliberate backdoor, so it is off unless
// ENABLE_DEMO_LOGIN=true is set explicitly, and it never works in production.
const ROLE_EMAILS: Record<string, string> = {
  HOSPITAL_STAFF: 'hospital_desk@carehosp.com',
  DOCTOR: 'doctor_101@carehosp.com',
  EMERGENCY_OPERATOR: 'er@carehosp.com',
};

export async function GET(req: NextRequest) {
  if (isProd || process.env.ENABLE_DEMO_LOGIN !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const url = new URL(req.url);
  const email = ROLE_EMAILS[url.searchParams.get('role') || ''];
  const requested = url.searchParams.get('redirect') || '/hospital/dashboard';
  // Only same-site relative paths, never //host or absolute URLs.
  const redirect = /^\/(?!\/)[A-Za-z0-9/_\-.?=&]*$/.test(requested) ? requested : '/hospital/dashboard';
  if (!email) return NextResponse.json({ error: 'Unknown role' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') return NextResponse.redirect(new URL('/login', req.url));

  const res = NextResponse.redirect(new URL(redirect, req.url));
  res.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role as any, hospitalId: user.hospitalId }),
    ...cookieOptions(SESSION_TTL_MS),
  });
  return res;
}
