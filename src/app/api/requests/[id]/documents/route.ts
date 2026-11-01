import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import { Actor, FullRequest, auditActor, fail, loadRequest } from '@/lib/api';
import { SUPPORTING } from '@/lib/attachments';
import { ROLE_LABEL_SERVER } from '@/lib/roles';
import { MAX_DOCUMENTS_PER_CASE, MAX_UPLOAD_BYTES, sniffType } from '@/lib/upload';
import { deleteDoc, readDoc, saveDoc } from '@/lib/storage';
import { EDITABLE_CASE_STATUSES } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

// Optional supporting documents. Any role with access to the case may add them; they are appended to the
// PDF after page 4 at generation. A patient only sees and removes the files they uploaded themselves.

const uploaderLabel = (a: Actor, r: FullRequest) =>
  a.kind === 'staff' ? `${a.user.name} (${ROLE_LABEL_SERVER[a.user.role] ?? a.user.role})` : `${r.patient.name} (Patient)`;

const publicDoc = (d: { id: string; fileName: string; fileSize: number; uploadedAt: Date; uploadedBy: string }) => ({
  id: d.id, fileName: d.fileName, fileSize: d.fileSize, uploadedAt: d.uploadedAt, uploadedBy: d.uploadedBy,
});

/** Adding or removing a file changes what the PDF contains, so saved PDFs become outdated. */
async function bumpVersion(requestDbId: string) {
  await prisma.$transaction([
    prisma.cashlessRequest.update({ where: { id: requestDbId }, data: { caseVersion: { increment: 1 } } }),
    prisma.documentVersion.updateMany({ where: { requestId: requestDbId, isOutdated: false }, data: { isOutdated: true } }),
  ]);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id, { allowPatient: true });
    if ('res' in found) return found.res;
    const { actor, request } = found;
    let docs = await prisma.claimChecklistDocument.findMany({ where: { requestId: request.id, checklistNumber: SUPPORTING }, orderBy: { uploadedAt: 'asc' } });
    if (actor.kind === 'patient') docs = docs.filter((d) => d.uploadedBy.endsWith('(Patient)'));

    const dl = new URL(req.url).searchParams.get('download');
    if (dl) {
      const doc = docs.find((d) => d.id === dl);
      const bytes = doc ? readDoc(doc.filePath) : null;
      if (!doc || !bytes) return fail(404, 'Document not found');
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          'Content-Type': sniffType(bytes)?.mime ?? 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${doc.fileName.replace(/[^\w.\- ]/g, '_')}"`,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-store',
        },
      });
    }
    return NextResponse.json({
      documents: docs.map(publicDoc),
      canChange: EDITABLE_CASE_STATUSES.includes(request.status),
      me: uploaderLabel(actor, request),
      isDesk: actor.kind === 'staff' && actor.user.role === 'HOSPITAL_STAFF',
    });
  } catch (error) {
    console.error('Documents GET error:', error);
    return fail(500, 'Internal server error');
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id, { allowPatient: true });
    if ('res' in found) return found.res;
    const { actor, request } = found;
    if (!EDITABLE_CASE_STATUSES.includes(request.status)) return fail(409, 'This case can no longer be changed');

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) return fail(400, 'Attach a file');
    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return fail(400, 'File must be between 1 byte and 5 MB');
    if ((await prisma.claimChecklistDocument.count({ where: { requestId: request.id, checklistNumber: SUPPORTING } })) >= MAX_DOCUMENTS_PER_CASE) {
      return fail(409, `At most ${MAX_DOCUMENTS_PER_CASE} supporting documents per case`);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const type = sniffType(bytes);
    if (!type) return fail(400, 'Only PDF, JPG or PNG files are accepted');
    // The file must open cleanly, otherwise it could not be added to the final PDF.
    try {
      if (type.ext === 'pdf') await PDFDocument.load(bytes);
      else {
        const probe = await PDFDocument.create();
        if (type.ext === 'jpg') await probe.embedJpg(bytes);
        else await probe.embedPng(bytes);
      }
    } catch {
      return fail(400, 'This file cannot be read (it may be encrypted or damaged). Upload a clean copy.');
    }

    const key = `${request.requestId.replace(/[^A-Za-z0-9-]/g, '_')}_doc_${crypto.randomBytes(6).toString('hex')}.${type.ext}`;
    saveDoc(key, bytes);
    const fileName = file.name.replace(/[^\w.\- ]/g, '_').slice(0, 120) || `document.${type.ext}`;
    const doc = await prisma.claimChecklistDocument.create({
      data: { requestId: request.id, checklistNumber: SUPPORTING, documentTitle: fileName, fileName, filePath: key, fileSize: bytes.length, uploadedBy: uploaderLabel(actor, request), verified: false },
    });
    await bumpVersion(request.id);
    const a = auditActor(actor, request);
    await prisma.auditLog.create({ data: { requestId: request.id, userId: a.id, userName: a.name, userRole: a.role, action: 'SUPPORTING_DOCUMENT_ADDED', details: `${fileName} (${bytes.length} bytes)` } });
    return NextResponse.json({ success: true, document: publicDoc(doc) });
  } catch (error) {
    console.error('Documents POST error:', error);
    return fail(500, 'Failed to save the document');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id, { allowPatient: true });
    if ('res' in found) return found.res;
    const { actor, request } = found;
    if (!EDITABLE_CASE_STATUSES.includes(request.status)) return fail(409, 'This case can no longer be changed');

    const id = new URL(req.url).searchParams.get('id') || '';
    const doc = await prisma.claimChecklistDocument.findFirst({ where: { id, requestId: request.id, checklistNumber: SUPPORTING } });
    if (!doc) return fail(404, 'Document not found');
    // Only the uploader or the hospital desk may remove a file.
    const isDesk = actor.kind === 'staff' && actor.user.role === 'HOSPITAL_STAFF';
    if (!isDesk && doc.uploadedBy !== uploaderLabel(actor, request)) return fail(403, 'You can only remove documents you uploaded');

    await prisma.claimChecklistDocument.delete({ where: { id: doc.id } });
    deleteDoc(doc.filePath);
    await bumpVersion(request.id);
    const a = auditActor(actor, request);
    await prisma.auditLog.create({ data: { requestId: request.id, userId: a.id, userName: a.name, userRole: a.role, action: 'SUPPORTING_DOCUMENT_REMOVED', details: doc.fileName } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Documents DELETE error:', error);
    return fail(500, 'Failed to remove the document');
  }
}
