import { prisma } from './prisma';
import { readDoc } from './storage';
import { sniffType } from './upload';
import { pdfOptionsFor } from './pdf-data';
import type { FullRequest } from './api';
import type { GeneratePdfOptions } from './pdf-generator';

/** Supporting documents are stored in the claim-document table with checklistNumber 0 (no checklist any more). */
export const SUPPORTING = 0;

/** Case data plus the optional supporting documents, in upload order, ready for the PDF overlay. */
export async function pdfOptionsWithAttachments(r: FullRequest): Promise<GeneratePdfOptions> {
  const docs = await prisma.claimChecklistDocument.findMany({ where: { requestId: r.id, checklistNumber: SUPPORTING }, orderBy: { uploadedAt: 'asc' } });
  const attachments: NonNullable<GeneratePdfOptions['attachments']> = [];
  for (const d of docs) {
    const bytes = readDoc(d.filePath);
    const type = bytes ? sniffType(bytes) : null;
    if (bytes && type) attachments.push({ name: d.fileName, bytes, type: type.ext });
  }
  return { ...pdfOptionsFor(r), attachments };
}
