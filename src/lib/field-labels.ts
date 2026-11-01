import type { z } from 'zod';
import { CHRONIC_ITEMS, DOCTOR_BLOCK, SECTION_A, SECTION_B, SECTION_C, SECTION_D, labelOf } from './section-config';

// Turns validation errors into sentences that use the form's own printed labels.
const LABELS: Record<string, string> = {};
for (const g of [...SECTION_A, ...SECTION_B, ...SECTION_C, ...SECTION_D]) for (const f of g.fields) LABELS[f.key] = labelOf(f.mapId);
for (const f of DOCTOR_BLOCK) LABELS[f.key] = labelOf(f.mapId);
for (const c of CHRONIC_ITEMS) LABELS[c.key] = labelOf(c.mapId);

export function friendlyIssues(error: z.ZodError): string {
  return error.issues
    .map((i: any) => {
      const key = String(i.path?.[0] ?? '');
      const label = LABELS[key];
      let msg: string = i.message;
      if (i.code === 'too_big' && /^Too big/.test(msg)) msg = i.origin === 'number' ? `must be at most ${i.maximum}` : `is too long (at most ${i.maximum} characters)`;
      else if (i.code === 'too_small' && /^Too small/.test(msg)) msg = i.origin === 'number' ? `must be at least ${i.minimum}` : 'is too short';
      else if ((i.code === 'invalid_type' || i.code === 'invalid_value') && /^Invalid/.test(msg)) msg = 'is not a valid choice';
      if (!label) return msg;
      if (/^(is|must) /.test(msg)) return `${label} ${msg}`;
      // Messages written for a specific field already name it ("Date of birth: enter a full date").
      if (/^[^:]{3,40}:/.test(msg)) return msg;
      return `${label}: ${msg}`;
    })
    .join('; ');
}
