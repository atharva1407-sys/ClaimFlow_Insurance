import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { audit, auditActor, fail, loadRequest, withUniqueRetry } from '@/lib/api';
import { generateCashlessPdfWithReport } from '@/lib/pdf-generator';
import { pdfOptionsWithAttachments } from '@/lib/attachments';
import { pdfKey, readPdf, savePdf } from '@/lib/storage';
import { validateRequestRecord } from '@/lib/validate-request';

export const dynamic = 'force-dynamic';

const pdfResponse = (bytes: Uint8Array | Buffer, name: string, download: boolean, extra: Record<string, string> = {}) =>
  new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
      'Cache-Control': 'private, no-store',
      ...extra,
    },
  });

/**
 * GET ?version=N        -> a stored version (the file as generated, never regenerated)
 * GET (no version)      -> live preview of the current data; nothing is stored
 * A verified patient may view and download the latest SAVED version only (never a live preview of half-filled data).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id, { allowPatient: true });
    if ('res' in found) return found.res;
    const { actor, request } = found;

    const url = new URL(req.url);
    const download = url.searchParams.get('download') === 'true';
    const versionParam = url.searchParams.get('version');

    if (actor.kind === 'patient') {
      const latest = await prisma.documentVersion.findFirst({ where: { requestId: request.id }, orderBy: { version: 'desc' } });
      const bytes = latest ? readPdf(latest.filePath) : null;
      if (!latest || !bytes) return fail(404, 'The form has not been generated yet. The hospital desk saves it once every section is submitted.');
      return pdfResponse(bytes, `Cashless_${request.requestId}.pdf`, download, {
        'X-Pdf-Outdated': String(latest.isOutdated || latest.caseVersion !== request.caseVersion),
      });
    }

    if (versionParam) {
      const version = await prisma.documentVersion.findFirst({ where: { requestId: request.id, version: Number(versionParam) || -1 } });
      if (!version) return fail(404, 'Version not found');
      const bytes = readPdf(version.filePath);
      if (!bytes) return fail(404, 'Stored file is missing');
      return pdfResponse(bytes, `Cashless_${request.requestId}_v${version.version}.pdf`, download, {
        'X-Pdf-Outdated': String(version.isOutdated || version.caseVersion !== request.caseVersion),
      });
    }

    const { bytes, issues } = await generateCashlessPdfWithReport(await pdfOptionsWithAttachments(request));
    return pdfResponse(bytes, `Cashless_${request.requestId}_preview.pdf`, download, {
      'X-Pdf-Issue-Count': String(issues.length),
      'X-Case-Version': String(request.caseVersion),
    });
  } catch (error) {
    console.error('PDF stream error:', error);
    return fail(500, 'Failed to generate PDF');
  }
}

/** Generates and stores a new PDF version tied to the current case version. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id);
    if ('res' in found) return found.res;
    const { actor, request } = found;
    if (actor.kind !== 'staff' || !['HOSPITAL_STAFF', 'EMERGENCY_OPERATOR'].includes(actor.user.role)) {
      return fail(403, 'Only hospital staff or the emergency operator can generate the official PDF');
    }
    if (actor.user.role === 'EMERGENCY_OPERATOR' && !request.isEmergency) return fail(403, 'Emergency operators can only generate PDFs for emergency cases');

    if (!request.isEmergency) {
      const check = validateRequestRecord(request);
      if (!check.finalisable) return fail(409, 'The case is incomplete and cannot be finalised yet', { blockers: check.blockers });
    }

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 300) : 'PDF generation';

    const { bytes, issues, templateVersion } = await generateCashlessPdfWithReport(await pdfOptionsWithAttachments(request));
    if (issues.length) return fail(422, 'Some values do not fit the printed form. Nothing was generated; shorten or correct them first.', { issues });

    const saved = await withUniqueRetry(async () => {
      const last = await prisma.documentVersion.findFirst({ where: { requestId: request.id }, orderBy: { version: 'desc' } });
      const version = (last?.version ?? 0) + 1;
      const key = pdfKey(request.requestId, version);
      savePdf(key, bytes);
      await prisma.$transaction([
        prisma.documentVersion.updateMany({ where: { requestId: request.id }, data: { isOutdated: true } }),
        prisma.documentVersion.create({
          data: { requestId: request.id, version, caseVersion: request.caseVersion, templateVersion, filePath: key, generatedBy: actor.user.name, reason, isOutdated: false },
        }),
        prisma.cashlessRequest.update({ where: { id: request.id }, data: { currentVersion: version, latestPdfPath: key } }),
      ]);
      return version;
    });

    await audit(request.id, auditActor(actor, request), 'PDF_GENERATED', `Version ${saved} for case version ${request.caseVersion}. ${reason}`);
    return NextResponse.json({ success: true, version: saved, caseVersion: request.caseVersion, pdfUrl: `/api/requests/${request.requestId}/pdf?version=${saved}` });
  } catch (error) {
    console.error('Save PDF version error:', error);
    return fail(500, 'Failed to save PDF version');
  }
}
