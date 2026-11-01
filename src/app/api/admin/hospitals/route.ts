import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit, fail, requireAdmin } from '@/lib/api';
import { formatIssues } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

const s = (max: number) => z.string().trim().max(max);
const optional = (max: number) => s(max).optional().transform((v) => v || null);

const hospitalSchema = z.object({
  name: s(200).min(1, 'Hospital name is required'),
  city: s(80).min(1, 'City is required'),
  state: s(80).min(1, 'State is required'),
  pinCode: s(14).min(1, 'Pin code is required'),
  contactNo: s(30).min(1, 'Contact number is required'),
  emailId: s(120).min(1, 'Email is required'),
  hospitalIdCode: optional(14),
  rohiniId: optional(14),
  landmark: optional(120),
  faxNo: optional(30),
  tpaDeskNo: optional(30),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if ('res' in admin) return admin.res;
  const hospitals = await prisma.hospital.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true } } } });
  return NextResponse.json({ hospitals });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if ('res' in admin) return admin.res;
  const parsed = hospitalSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(400, formatIssues(parsed.error));
  const hospital = await prisma.hospital.create({ data: parsed.data });
  await audit(null, admin.user, 'HOSPITAL_CREATED', `Hospital ${hospital.name}`);
  return NextResponse.json({ success: true, hospital });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if ('res' in admin) return admin.res;
  const body = await req.json().catch(() => ({}));
  const parsed = hospitalSchema.partial().safeParse(body);
  if (!parsed.success || typeof body.id !== 'string') return fail(400, parsed.success ? 'Hospital id is required' : formatIssues(parsed.error));
  const exists = await prisma.hospital.findUnique({ where: { id: body.id } });
  if (!exists) return fail(404, 'Hospital not found');
  const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  const hospital = await prisma.hospital.update({ where: { id: body.id }, data });
  await audit(null, admin.user, 'HOSPITAL_UPDATED', `Hospital ${hospital.name}: ${Object.keys(data).join(', ')}`);
  return NextResponse.json({ success: true, hospital });
}
