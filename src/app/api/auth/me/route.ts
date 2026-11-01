import { NextRequest, NextResponse } from 'next/server';
import { PATIENT_COOKIE, SESSION_COOKIE, getPatientRequestId, getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // The patient portal asks for the patient identity so a staff sign-in in the same browser does not take over its header.
  const asPatient = new URL(req.url).searchParams.get('as') === 'patient';
  const user = asPatient ? null : await getSession(req);
  if (user) {
    const hospital = user.hospitalId
      ? await prisma.hospital.findUnique({ where: { id: user.hospitalId }, select: { id: true, name: true, city: true } })
      : null;
    return NextResponse.json({ user, hospital });
  }
  const rid = getPatientRequestId(req);
  if (rid) {
    const r = await prisma.cashlessRequest.findUnique({ where: { id: rid }, include: { patient: true } });
    if (r) return NextResponse.json({ user: { id: 'patient', name: r.patient.name, role: 'PATIENT', requestId: r.requestId }, hospital: null });
  }
  return NextResponse.json({ user: null }, { status: 401 });
}

export async function POST() {
  // Logout
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(PATIENT_COOKIE);
  return response;
}
