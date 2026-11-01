import crypto from 'crypto';

// Patient invitation helpers. The OTP is stored only as a salted hash and is single-use.

export const OTP_TTL_MS = 30 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function generateInviteToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function hashOtp(otp: string, requestId: string): string {
  return crypto.createHash('sha256').update(`${requestId}:${otp}`).digest('hex');
}

export function otpMatches(otp: string, requestId: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashOtp(otp, requestId), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
