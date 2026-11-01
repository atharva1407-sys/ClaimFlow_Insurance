import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DUMMY_HASH, SESSION_COOKIE, SESSION_TTL_MS, cookieOptions, createSessionToken, verifyPassword } from '@/lib/auth';
import { audit } from '@/lib/api';
import { clientIp, rateLimited } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const BAD = () => NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    if (rateLimited(`login:${clientIp(req)}:${email}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { hospital: true } });
    // Always run one bcrypt comparison so response time does not reveal whether the e-mail exists.
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok || user.status !== 'ACTIVE') return BAD();

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      hospitalId: user.hospitalId,
      specialization: user.specialization,
      qualification: user.qualification,
      registrationNo: user.registrationNo,
    };

    const response = NextResponse.json({ success: true, user: sessionUser, hospital: user.hospital ? { id: user.hospital.id, name: user.hospital.name } : null });
    response.cookies.set({ name: SESSION_COOKIE, value: createSessionToken(sessionUser), ...cookieOptions(SESSION_TTL_MS) });
    await audit(null, { id: user.id, name: user.name, role: user.role }, 'LOGIN');
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
