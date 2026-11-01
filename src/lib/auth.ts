import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { UserRole } from './types';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId?: string | null;
  specialization?: string | null;
  qualification?: string | null;
  registrationNo?: string | null;
}

export const SESSION_COOKIE = 'claimflow_session';
export const PATIENT_COOKIE = 'claimflow_patient';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const PATIENT_TTL_MS = 2 * 60 * 60 * 1000;

export const isProd = process.env.NODE_ENV === 'production';

export function cookieOptions(maxAgeMs: number) {
  return { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/', maxAge: Math.floor(maxAgeMs / 1000) };
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// A throwaway hash so a login for an unknown e-mail costs the same as a real one.
export const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (isProd) throw new Error('SESSION_SECRET (at least 32 characters) must be set in production');
  return 'dev-only-session-secret-do-not-use-in-production';
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Signed, expiring token: base64url(json).hmac-sha256 */
export function signToken(data: Record<string, unknown>, ttlMs: number): string {
  const encoded = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlMs })).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyToken<T extends Record<string, unknown>>(token: string | undefined | null): (T & { exp: number }) | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = Buffer.from(sign(encoded));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createSessionToken(user: SessionUser): string {
  // Only the user id travels in the token; role/hospital are re-read from the database on each request
  // so deactivation and role changes take effect immediately.
  return signToken({ kind: 'staff', uid: user.id }, SESSION_TTL_MS);
}

export function createPatientToken(requestDbId: string): string {
  return signToken({ kind: 'patient', rid: requestDbId }, PATIENT_TTL_MS);
}

/** Authenticated staff user for this request, or null. Re-validated against the database. */
export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const t = verifyToken<{ kind: string; uid: string }>(req.cookies.get(SESSION_COOKIE)?.value);
  if (!t || t.kind !== 'staff' || !t.uid) return null;
  const user = await prisma.user.findUnique({ where: { id: t.uid } });
  if (!user || user.status !== 'ACTIVE') return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    hospitalId: user.hospitalId,
    specialization: user.specialization,
    qualification: user.qualification,
    registrationNo: user.registrationNo,
  };
}

/** Database id of the single request a patient has verified an OTP for, or null. */
export function getPatientRequestId(req: NextRequest): string | null {
  const t = verifyToken<{ kind: string; rid: string }>(req.cookies.get(PATIENT_COOKIE)?.value);
  return t && t.kind === 'patient' && t.rid ? t.rid : null;
}

// Role-based permission guards ------------------------------------------------

export interface AccessTarget {
  hospitalId: string;
  doctorId?: string | null;
}

/** Admins manage users and hospitals only; they have no casual access to patient data. */
export function canAccessRequest(user: SessionUser, target: AccessTarget): boolean {
  switch (user.role) {
    case 'HOSPITAL_STAFF':
    case 'EMERGENCY_OPERATOR':
      return !!user.hospitalId && user.hospitalId === target.hospitalId;
    case 'DOCTOR':
      return !!user.hospitalId && user.hospitalId === target.hospitalId && target.doctorId === user.id;
    default:
      return false;
  }
}

/** Who may edit which section. Roles never edit each other's sections; emergency mode only widens the operator. */
export function canEditSection(user: Pick<SessionUser, 'role'>, section: 'A' | 'B' | 'C' | 'D', isEmergency: boolean): boolean {
  if (user.role === 'EMERGENCY_OPERATOR') return isEmergency;
  switch (section) {
    case 'A':
    case 'D':
      return user.role === 'HOSPITAL_STAFF';
    case 'B':
      return user.role === 'PATIENT';
    case 'C':
      return user.role === 'DOCTOR';
    default:
      return false;
  }
}
