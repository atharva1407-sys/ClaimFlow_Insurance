import { NextRequest, NextResponse } from 'next/server';
import { fail, loadRequest } from '@/lib/api';
import { validateRequestRecord } from '@/lib/validate-request';
import { generateCashlessPdfWithReport } from '@/lib/pdf-generator';
import { pdfOptionsWithAttachments } from '@/lib/attachments';

export const dynamic = 'force-dynamic';

/** Pre-submission rules check plus a dry-run of the PDF overlay, so values that will not fit are caught early. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const found = await loadRequest(req, params.id);
    if ('res' in found) return found.res;
    const { request } = found;
    const check = validateRequestRecord(request);
    const { issues } = await generateCashlessPdfWithReport(await pdfOptionsWithAttachments(request));
    return NextResponse.json({ ...check, pdfIssues: issues, caseVersion: request.caseVersion });
  } catch (error) {
    console.error('Validate error:', error);
    return fail(500, 'Internal server error');
  }
}
