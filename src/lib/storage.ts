import fs from 'fs';
import path from 'path';

// Generated PDFs contain patient data, so they live outside /public and are only served by an
// authenticated route. Swap this module for private object storage (S3 with SSE) in production.

const ROOT = path.resolve(process.cwd(), 'storage', 'pdfs');

function resolveKey(key: string): string {
  const safe = path.basename(key);
  if (!/^[A-Za-z0-9._-]+\.pdf$/.test(safe)) throw new Error('Invalid storage key');
  return path.join(ROOT, safe);
}

export function pdfKey(requestId: string, version: number): string {
  return `${requestId.replace(/[^A-Za-z0-9-]/g, '_')}_v${version}.pdf`;
}

export function savePdf(key: string, bytes: Uint8Array): void {
  fs.mkdirSync(ROOT, { recursive: true });
  // The version number comes from the database, so an existing file with this key can only be an orphan
  // from an interrupted earlier attempt; a stored version is never rewritten.
  fs.writeFileSync(resolveKey(key), Buffer.from(bytes));
}

export function deletePdf(key: string): void {
  fs.rmSync(resolveKey(key), { force: true });
}

export function readPdf(key: string): Buffer | null {
  const p = resolveKey(key);
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

// Optional supporting documents uploaded by any role live in their own private folder.
const DOCS_ROOT = path.resolve(process.cwd(), 'storage', 'docs');

function resolveDoc(key: string): string {
  const safe = path.basename(key);
  if (!/^[A-Za-z0-9._-]+$/.test(safe)) throw new Error('Invalid storage key');
  return path.join(DOCS_ROOT, safe);
}

export function saveDoc(key: string, bytes: Buffer): void {
  fs.mkdirSync(DOCS_ROOT, { recursive: true });
  fs.writeFileSync(resolveDoc(key), bytes, { flag: 'wx' });
}

export function readDoc(key: string): Buffer | null {
  const p = resolveDoc(key);
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

export function deleteDoc(key: string): void {
  fs.rmSync(resolveDoc(key), { force: true });
}
