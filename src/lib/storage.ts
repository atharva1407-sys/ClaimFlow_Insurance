// Generated PDFs and supporting documents contain patient data. They are stored as bytes in the database
// (DocumentVersion.fileData, ClaimChecklistDocument.fileData) and only served by authenticated routes, so they
// survive serverless restarts and are removed with their case. These keys are only labels for a stored file.

export function pdfKey(requestId: string, version: number): string {
  return `${requestId.replace(/[^A-Za-z0-9-]/g, '_')}_v${version}.pdf`;
}
