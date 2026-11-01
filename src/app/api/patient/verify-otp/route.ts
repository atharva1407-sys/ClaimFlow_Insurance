import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PATIENT_COOKIE, PATIENT_TTL_MS, cookieOptions, createPatientToken } from '@/lib/auth';
import { audit } from '@/lib/api';
import { toMobile10 } from '@/lib/dates';
import { OTP_MAX_ATTEMPTS, otpMatches } from '@/lib/otp';
import { clientIp, rateLimited } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// One generic answer for every failure, so the endpoint does not reveal which request IDs or numbers exist.
const DENIED = () => NextResponse.json({ error: 'Those details could not be verified. Check the request ID, mobile number and OTP.' }, { status: 400 });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
    const phone = toMobile10(body.phone);
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    const token = typeof body.token === 'string' ? body.token : '';

    if (!requestId || phone.length !== 10 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Request ID, 10-digit mobile number and 6-digit OTP are required' }, { status: 400 });
    }
    if (rateLimited(`otp:${clientIp(req)}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    // The request ID alone grants nothing: lookup is by the public ID only, never the internal one.
    const request = await prisma.cashlessRequest.findUnique({ where: { requestId }, include: { patient: true } });
    if (!request || !request.patientOtp || !request.patientOtpExpiresAt) return DENIED();
    if (request.patientOtpExpiresAt.getTime() < Date.now()) return DENIED();
    if (request.patientOtpAttempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many wrong codes. Ask the hospital desk to send a new invitation.' }, { status: 429 });
    }

    const phoneOk = toMobile10(request.patient.phone) === phone;
    const tokenOk = !token || token === request.patientAccessToken;
    const otpOk = otpMatches(otp, request.requestId, request.patientOtp);
    if (!phoneOk || !tokenOk || !otpOk) {
      await prisma.cashlessRequest.update({ where: { id: request.id }, data: { patientOtpAttempts: { increment: 1 } } });
      await audit(request.id, { name: request.patient.name, role: 'PATIENT' }, 'PATIENT_OTP_FAILED');
      return DENIED();
    }

    // Single use: the OTP is cleared once it has been accepted.
    await prisma.cashlessRequest.update({
      where: { id: request.id },
      data: { patientVerifiedAt: new Date(), patientOtp: null, patientOtpExpiresAt: null, patientOtpAttempts: 0 },
    });
    await audit(request.id, { name: request.patient.name, role: 'PATIENT' }, 'PATIENT_OTP_VERIFIED', `Mobile ending ${phone.slice(-4)}`);

    const res = NextResponse.json({ success: true, requestId: request.requestId });
    res.cookies.set({ name: PATIENT_COOKIE, value: createPatientToken(request.id), ...cookieOptions(PATIENT_TTL_MS) });
    return res;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
