import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Audit entries without their detail text, so the administrator sees activity but no patient content. */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if ('res' in admin) return admin.res;
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 300,
    select: { id: true, timestamp: true, userName: true, userRole: true, action: true, request: { select: { requestId: true } } },
  });
  return NextResponse.json({ logs: logs.map(({ request, ...l }) => ({ ...l, requestId: request?.requestId ?? null })) });
}
