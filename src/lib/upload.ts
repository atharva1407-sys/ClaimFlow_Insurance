// Server-only helpers for optional supporting documents.
// Vercel functions accept at most 4.5 MB per request and return at most 4.5 MB per response. The final PDF
// carries every attachment, so the total per case is capped there too.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_TOTAL_BYTES = process.env.VERCEL ? 3.5 * 1024 * 1024 : 25 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_CASE = 10;

export type DocType = { ext: 'pdf' | 'jpg' | 'png'; mime: string };

/** Detects the real type from the file's first bytes; the client-supplied type is not trusted. */
export function sniffType(b: Buffer): DocType | null {
  if (b.length >= 5 && b.subarray(0, 5).toString('latin1') === '%PDF-') return { ext: 'pdf', mime: 'application/pdf' };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' };
  return null;
}
