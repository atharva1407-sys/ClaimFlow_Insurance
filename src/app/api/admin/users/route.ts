import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, fail, requireAdmin } from '@/lib/api';
import { hashPassword } from '@/lib/auth';
import { formatIssues } from '@/lib/schemas';
import { toMobile10 } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const ROLES = ['HOSPITAL_STAFF', 'DOCTOR', 'EMERGENCY_OPERATOR', 'ADMIN'] as const;
const text = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(12, 'Password must be at least 12 characters').max(200),
  role: z.enum(ROLES),
  hospitalId: z.string().trim().optional(),
  phone: z.string().trim().optional().transform((v) => (v ? toMobile10(v) : null)),
  qualification: text(160),
  registrationNo: text(20),
  specialization: text(100),
});

const publicUser = { id: true, name: true, email: true, role: true, status: true, phone: true, qualification: true, registrationNo: true, specialization: true, hospitalId: true, createdAt: true, hospital: { select: { name: true } } } as const;

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if ('res' in admin) return admin.res;
  const users = await prisma.user.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }], select: publicUser });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if ('res' in admin) return admin.res;
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(400, formatIssues(parsed.error));
  const { password, hospitalId, ...rest } = parsed.data;

  if (rest.role !== 'ADMIN') {
    if (!hospitalId) return fail(400, 'Choose a hospital for this user');
    if (!(await prisma.hospital.findUnique({ where: { id: hospitalId } }))) return fail(400, 'Hospital not found');
  }
  if (await prisma.user.findUnique({ where: { email: rest.email } })) return fail(409, 'A user with this email already exists');

  const user = await prisma.user.create({
    data: { ...rest, passwordHash: await hashPassword(password), status: 'ACTIVE', hospitalId: rest.role === 'ADMIN' ? null : hospitalId },
    select: publicUser,
  });
  await audit(null, admin.user, 'USER_CREATED', `${user.role} ${user.email}`);
  return NextResponse.json({ success: true, user });
}

/** { id, status } to activate or deactivate, { id, password } to reset a password. */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if ('res' in admin) return admin.res;
  const body = await req.json().catch(() => ({}));
  const target = typeof body.id === 'string' ? await prisma.user.findUnique({ where: { id: body.id } }) : null;
  if (!target) return fail(404, 'User not found');

  if (body.status !== undefined) {
    if (!['ACTIVE', 'INACTIVE'].includes(body.status)) return fail(400, 'Status must be ACTIVE or INACTIVE');
    if (target.id === admin.user.id && body.status === 'INACTIVE') return fail(400, 'You cannot deactivate your own account');
    await prisma.user.update({ where: { id: target.id }, data: { status: body.status } });
    await audit(null, admin.user, body.status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', target.email);
  }
  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 12) return fail(400, 'Password must be at least 12 characters');
    await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await hashPassword(body.password) } });
    await audit(null, admin.user, 'USER_PASSWORD_RESET', target.email);
  }
  return NextResponse.json({ success: true });
}
