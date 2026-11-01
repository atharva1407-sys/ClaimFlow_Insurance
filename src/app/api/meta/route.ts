import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { fail } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Directory data for the signed-in user's own hospital only (doctors, recent patients, hospital profile).
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return fail(401, 'Not signed in');
    if (!session.hospitalId || !['HOSPITAL_STAFF', 'EMERGENCY_OPERATOR', 'DOCTOR'].includes(session.role)) return fail(403, 'Forbidden');
    const hospitalId = session.hospitalId;

    const canSeePatients = session.role !== 'DOCTOR';
    const [doctors, patients, hospital] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'DOCTOR', status: 'ACTIVE', hospitalId },
        select: { id: true, name: true, specialization: true, qualification: true, registrationNo: true, phone: true },
        orderBy: { name: 'asc' },
      }),
      canSeePatients
        ? prisma.patient.findMany({
            where: { hospitalId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: { id: true, patientCode: true, name: true, phone: true, email: true, gender: true, ageYears: true },
          })
        : Promise.resolve([]),
      prisma.hospital.findUnique({ where: { id: hospitalId }, select: { id: true, name: true, city: true, state: true } }),
    ]);

    return NextResponse.json({ doctors, patients, hospital });
  } catch (error) {
    console.error('Fetch meta error:', error);
    return fail(500, 'Failed to load metadata');
  }
}
