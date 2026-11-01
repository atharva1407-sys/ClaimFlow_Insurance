import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import fieldMapData from '../../field-map.json';
import { toDdmmyy, toDdmmyyyy, toHhmm } from './dates';
import {
  ProviderData,
  PatientSectionData,
  ClinicalSectionData,
  AdmissionExpenseData,
  ChronicHistoryData,
  DeclarationsData,
} from './types';

export interface GeneratePdfOptions {
  provider?: Partial<ProviderData>;
  patient?: Partial<PatientSectionData>;
  clinical?: Partial<ClinicalSectionData>;
  admissionExpense?: Partial<AdmissionExpenseData>;
  chronic?: Partial<ChronicHistoryData>;
  declarations?: Partial<DeclarationsData>;
  /** Emergency cases get no marking on the PDF; the flag is accepted so callers can pass the case as is. */
  isEmergency?: boolean;
  /** Leave the page-2 doctor name / qualification / registration blank (doctor has not verified them). */
  omitDoctorBlock?: boolean;
  /** Optional supporting documents, appended as extra pages after page 4. The form pages are not changed. */
  attachments?: { name: string; bytes: Uint8Array; type: 'pdf' | 'jpg' | 'png' }[];
}

export interface PdfIssue {
  fieldId: string;
  label: string;
  kind: 'overflow' | 'unsupported_value' | 'unsupported_character' | 'bad_format' | 'bad_attachment';
  message: string;
}

export interface GeneratePdfResult {
  bytes: Uint8Array;
  issues: PdfIssue[];
  templateVersion: string;
}

const TEMPLATE_PATH = path.resolve(process.cwd(), 'cashless_request_form.pdf');
const INK = rgb(0.05, 0.15, 0.5);
const MIN_FONT = 6;

const fieldMap: Record<string, any> = {};
for (const item of fieldMapData as any[]) fieldMap[item.id] = item;

let templateCache: { bytes: Buffer; version: string } | null = null;
function loadTemplate() {
  if (!templateCache) {
    const bytes = fs.readFileSync(TEMPLATE_PATH);
    templateCache = { bytes, version: crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12) };
  }
  return templateCache;
}

export function getTemplateVersion(): string {
  return loadTemplate().version;
}

// ---------------------------------------------------------------------------------------------
// App data -> field-map IDs
// ---------------------------------------------------------------------------------------------

const PROVIDER_MAP: Record<string, string> = {
  hospitalName: 'provider_hospital_name', city: 'provider_city', pinCode: 'provider_pin_code', state: 'provider_state',
  hospitalId: 'provider_hospital_id', landmark: 'provider_landmark', rohiniId: 'provider_rohini_id',
  contactNo: 'provider_contact_no', faxNo: 'provider_fax_no', tpaDeskNo: 'provider_tpa_desk_no', emailId: 'provider_email_id',
};
const PATIENT_MAP: Record<string, string> = {
  patientName: 'patient_name', addressLine1: 'patient_address_line1', addressLine2: 'patient_address_line2',
  gender: 'patient_gender', ageYears: 'patient_age_years', ageMonths: 'patient_age_months', dob: 'patient_dob',
  attendantName: 'patient_attendant_name', attendantContactNo: 'patient_attendant_contact_no',
  patientContactNo: 'patient_contact_no', insuredCardId: 'insured_card_id', occupation: 'patient_occupation',
  policyNumberCorporate: 'policy_number_corporate', employeeId: 'employee_id', panNo: 'insured_pan_no',
  proposerName: 'proposer_name', proposerCkyc: 'proposer_ckyc', hasOtherMediclaim: 'has_other_mediclaim',
  otherInsuranceCompanyName: 'other_insurance_company_name', otherInsuranceDetails: 'other_insurance_details',
  hasFamilyPhysician: 'has_family_physician', familyPhysicianName: 'family_physician_name',
  familyPhysicianContactNo: 'family_physician_contact_no', insuredEmailId: 'insured_email_id',
};
const CLINICAL_MAP: Record<string, string> = {
  treatingDoctorName: 'treating_doctor_name', treatingDoctorContactNo: 'treating_doctor_contact_no',
  illnessNatureComplaints: 'illness_nature_complaints', relevantClinicalFindings: 'relevant_clinical_findings',
  durationPresentAilmentDays: 'duration_present_ailment_days', dateOfFirstConsultation: 'date_of_first_consultation',
  pastHistoryPresentAilment: 'past_history_present_ailment', provisionalDiagnosis: 'provisional_diagnosis',
  icd10Code: 'icd_10_code', proposedLineOfTreatment: 'proposed_line_of_treatment',
  investigationMedicalManagementDetails: 'investigation_medical_management_details',
  routeOfDrugAdministration: 'route_of_drug_administration', surgicalNameOfSurgery: 'surgical_name_of_surgery',
  icd10PcsCode: 'icd_10_pcs_code', otherTreatmentsDetails: 'other_treatments_details',
  howDidInjuryOccur: 'how_did_injury_occur', accidentIsRta: 'accident_is_rta',
  accidentDateOfInjury: 'accident_date_of_injury', accidentReportedToPolice: 'accident_reported_to_police',
  accidentFirNo: 'accident_fir_no', substanceAbuseAlcohol: 'substance_abuse_alcohol',
  substanceAbuseTestConducted: 'substance_abuse_test_conducted', maternityG: 'maternity_g', maternityP: 'maternity_p',
  maternityL: 'maternity_l', maternityA: 'maternity_a', maternityEdd: 'maternity_edd', maternityLmp: 'maternity_lmp',
};
const ADMISSION_MAP: Record<string, string> = {
  admissionDate: 'admission_date', admissionTime: 'admission_time', hospitalizationEventType: 'hospitalization_event_type',
  expectedDaysStay: 'expected_days_stay', roomType: 'room_type', expectedDaysIcu: 'expected_days_icu',
  costRoomRentNursing: 'cost_room_rent_nursing', costInvestigationDiagnostics: 'cost_investigation_diagnostics',
  costIcuCharges: 'cost_icu_charges', costOtCharges: 'cost_ot_charges', costProfessionalFees: 'cost_professional_fees',
  costMedicinesConsumables: 'cost_medicines_consumables', costOtherHospitalExpenses: 'cost_other_hospital_expenses',
  costAllInclusivePackage: 'cost_all_inclusive_package', costSumTotalExpected: 'cost_sum_total_expected',
};
const CHRONIC_MAP: Record<string, string> = {
  diabetes: 'diabetes', heartDisease: 'heart_disease', hypertension: 'hypertension', hyperlipidemia: 'hyperlipidemia',
  osteoarthritis: 'osteoarthritis', asthmaCopd: 'asthma_copd', cancer: 'cancer', alcoholDrug: 'alcohol_drug', hivStd: 'hiv_std',
};
const DOCTOR_BLOCK_IDS = ['page2_doctor_name', 'page2_doctor_qualification', 'page2_doctor_registration_no'];

// Numeric combs are right-aligned (unused leading cells stay blank); others fill from the left.
const RIGHT_ALIGNED = new Set([
  'patient_age_years', 'patient_age_months', 'duration_present_ailment_days', 'expected_days_stay', 'expected_days_icu',
  'cost_room_rent_nursing', 'cost_investigation_diagnostics', 'cost_icu_charges', 'cost_ot_charges', 'cost_professional_fees',
  'cost_medicines_consumables', 'cost_other_hospital_expenses', 'cost_all_inclusive_package', 'cost_sum_total_expected',
]);
const AMOUNT_IDS = new Set([...RIGHT_ALIGNED].filter((id) => id.startsWith('cost_')));
const NUMBER_IDS = new Set([...RIGHT_ALIGNED]);
const PHONE_IDS = new Set(['patient_attendant_contact_no', 'patient_contact_no', 'family_physician_contact_no', 'treating_doctor_contact_no']);
const DATE8_IDS = new Set(['patient_dob', 'date_of_first_consultation', 'accident_date_of_injury', 'maternity_edd', 'maternity_lmp']);

function normalise(id: string, raw: unknown): string {
  if (Array.isArray(raw) || typeof raw === 'boolean') return raw as any;
  const v = String(raw ?? '').trim();
  if (DATE8_IDS.has(id)) return toDdmmyyyy(v) || v;
  if (id === 'admission_date') return toDdmmyy(v) || v;
  if (id === 'admission_time') return toHhmm(v) || v;
  if (id.endsWith('_since')) return v.replace(/\D/g, '');
  if (AMOUNT_IDS.has(id)) {
    const d = v.replace(/[,\s]/g, '');
    return /^\d+$/.test(d) ? String(Number(d)) : v;
  }
  if (NUMBER_IDS.has(id)) return /^\d+$/.test(v) ? String(Number(v)) : v;
  if (PHONE_IDS.has(id)) return v.replace(/\D/g, '');
  return v;
}

export function flattenForPdf(options: GeneratePdfOptions): Record<string, any> {
  const flat: Record<string, any> = {};
  const put = (id: string, v: unknown) => {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
    flat[id] = normalise(id, v);
  };
  const mapInto = (src: Record<string, any> | undefined, map: Record<string, string>) => {
    if (!src) return;
    for (const [k, id] of Object.entries(map)) put(id, src[k]);
  };
  mapInto(options.provider as any, PROVIDER_MAP);
  mapInto(options.patient as any, PATIENT_MAP);
  mapInto(options.clinical as any, CLINICAL_MAP);
  mapInto(options.admissionExpense as any, ADMISSION_MAP);

  const ch = options.chronic as Record<string, any> | undefined;
  if (ch) {
    for (const [k, base] of Object.entries(CHRONIC_MAP)) {
      if (ch[k]?.present) {
        flat[`chronic_${base}_check`] = true;
        put(`chronic_${base}_since`, ch[k].sinceMmyy);
      }
    }
    put('chronic_other_ailment_details', ch.otherAilmentDetails);
  }

  // Page 2 doctor block only. Everything on page 3 (patient and hospital declarations, dates, times,
  // signatures, seal) is deliberately never filled: nothing may imply that a signature or declaration happened.
  const dec = options.declarations;
  if (dec && !options.omitDoctorBlock) {
    put('page2_doctor_name', dec.page2DoctorName);
    put('page2_doctor_qualification', dec.page2DoctorQualification);
    put('page2_doctor_registration_no', dec.page2DoctorRegistrationNo);
  }
  for (const id of DOCTOR_BLOCK_IDS) if (options.omitDoctorBlock) delete flat[id];
  return flat;
}

// ---------------------------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------------------------

function widthOf(font: PDFFont, text: string, size: number): number | null {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    return null; // character outside WinAnsi
  }
}

function drawCross(page: PDFPage, x: number, yTop: number, w: number, h: number) {
  const H = page.getHeight();
  const bx = x, by = H - (yTop + h);
  const opts = { thickness: 1.3, color: INK };
  page.drawLine({ start: { x: bx + 2.2, y: by + 2.2 }, end: { x: bx + w - 2.2, y: by + h - 2.2 }, ...opts });
  page.drawLine({ start: { x: bx + w - 2.2, y: by + 2.2 }, end: { x: bx + 2.2, y: by + h - 2.2 }, ...opts });
}

function wrapLines(font: PDFFont, text: string, lines: { max_width: number }[], size: number): string[] | null {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let li = 0;
  let cur = '';
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    const tw = widthOf(font, trial, size);
    if (tw === null) return null;
    if (tw <= lines[li].max_width) {
      cur = trial;
    } else {
      if (!cur) return null; // a single word is wider than the line
      out.push(cur);
      li++;
      if (li >= lines.length) return null;
      if ((widthOf(font, w, size) ?? Infinity) > lines[li].max_width) return null;
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
}

export async function generateCashlessPdfWithReport(options: GeneratePdfOptions): Promise<GeneratePdfResult> {
  const tpl = loadTemplate();
  const pdfDoc = await PDFDocument.load(tpl.bytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const issues: PdfIssue[] = [];
  const flat = flattenForPdf(options);

  for (const [fieldId, val] of Object.entries(flat)) {
    const item = fieldMap[fieldId];
    if (!item) continue;
    const page = pages[item.page - 1];
    if (!page) continue;
    const H = page.getHeight();
    const c = item.coordinates;
    const flag = (kind: PdfIssue['kind'], message: string) => issues.push({ fieldId, label: item.label, kind, message });

    switch (c.type) {
      case 'text': {
        const text = String(val).replace(/\s+/g, ' ').trim();
        let size = c.font_size || 8.5;
        let w = widthOf(font, text, size);
        if (w === null) { flag('unsupported_character', 'Contains a character the form font cannot print.'); break; }
        while (w > c.max_width && size > MIN_FONT) { size -= 0.25; w = widthOf(font, text, size)!; }
        if (w > c.max_width) { flag('overflow', `Does not fit the printed line (${Math.round(w)}pt needed, ${c.max_width}pt available).`); break; }
        page.drawText(text, { x: c.x, y: H - c.y, size, font, color: INK });
        break;
      }
      case 'multiline_text': {
        const text = String(val).replace(/\s+/g, ' ').trim();
        let size = c.font_size || 8.5;
        let lines: string[] | null = null;
        while (size >= MIN_FONT) {
          if (widthOf(font, text, size) === null) { flag('unsupported_character', 'Contains a character the form font cannot print.'); lines = []; break; }
          lines = wrapLines(font, text, c.lines, size);
          if (lines) break;
          size -= 0.25;
        }
        if (lines === null) { flag('overflow', 'Does not fit the printed lines.'); break; }
        lines.forEach((ln, i) => page.drawText(ln, { x: c.lines[i].x, y: H - c.lines[i].y, size, font, color: INK }));
        break;
      }
      case 'comb': {
        const chars = String(val).replace(/[\s-]/g, '');
        if (chars.length > c.count) { flag('overflow', `${chars.length} characters but the printed boxes hold ${c.count}.`); break; }
        const start = RIGHT_ALIGNED.has(fieldId) ? c.count - chars.length : 0;
        const size = c.font_size || 8.5;
        let bad = false;
        for (let i = 0; i < chars.length; i++) {
          const cw = widthOf(font, chars[i], size);
          if (cw === null) { bad = true; break; }
          page.drawText(chars[i], { x: c.start_x + (start + i) * c.cell_width + (c.cell_width - cw) / 2, y: H - c.y, size, font, color: INK });
        }
        if (bad) flag('unsupported_character', 'Contains a character the form font cannot print.');
        break;
      }
      case 'segmented_comb': {
        const chars = String(val).replace(/[\s/:-]/g, '');
        const total = c.segments.reduce((n: number, s: any) => n + s.count, 0);
        if (chars.length !== total || !/^\d+$/.test(chars)) {
          flag('bad_format', `Expected exactly ${total} digits, got "${String(val)}".`);
          break;
        }
        const size = c.font_size || 8.5;
        let k = 0;
        for (const seg of c.segments) {
          for (let j = 0; j < seg.count; j++) {
            const cw = widthOf(font, chars[k], size) ?? 0;
            page.drawText(chars[k], { x: seg.start_x + j * c.cell_width + (c.cell_width - cw) / 2, y: H - c.y, size, font, color: INK });
            k++;
          }
        }
        break;
      }
      case 'checkbox_options': {
        const opt = c.options?.[String(val)];
        if (!opt) { flag('unsupported_value', `"${String(val)}" is not an option on the printed form (${Object.keys(c.options).join(' / ')}).`); break; }
        drawCross(page, opt.x, opt.y, opt.w, opt.h);
        break;
      }
      case 'checkbox_multi': {
        for (const key of Array.isArray(val) ? val : [String(val)]) {
          const opt = c.options?.[key];
          if (!opt) { flag('unsupported_value', `"${key}" is not an option on the printed form.`); continue; }
          drawCross(page, opt.x, opt.y, opt.w, opt.h);
        }
        break;
      }
      case 'checkbox': {
        if (val === true || String(val).toLowerCase() === 'yes') drawCross(page, c.x, c.y, c.w, c.h);
        break;
      }
      default:
        break; // signature / seal boxes and checklist tasks are never drawn
    }
  }

  // Optional supporting documents go after the form, each on its own page(s).
  for (const att of options.attachments ?? []) {
    try {
      if (att.type === 'pdf') {
        const src = await PDFDocument.load(att.bytes);
        for (const pg of await pdfDoc.copyPages(src, src.getPageIndices())) pdfDoc.addPage(pg);
      } else {
        const img = att.type === 'jpg' ? await pdfDoc.embedJpg(att.bytes) : await pdfDoc.embedPng(att.bytes);
        const page = pdfDoc.addPage([595.28, 841.89]);
        const scale = Math.min((595.28 - 72) / img.width, (841.89 - 72) / img.height, 1);
        const w = img.width * scale, h = img.height * scale;
        page.drawImage(img, { x: (595.28 - w) / 2, y: (841.89 - h) / 2, width: w, height: h });
      }
    } catch {
      issues.push({ fieldId: 'attachment', label: att.name, kind: 'bad_attachment', message: 'This supporting document could not be added (it may be encrypted or damaged). Remove it or upload a clean copy.' });
    }
  }

  return { bytes: await pdfDoc.save(), issues, templateVersion: tpl.version };
}

/** Bytes only, for callers that do not need the issue report. */
export async function generateCashlessPdf(options: GeneratePdfOptions): Promise<Uint8Array> {
  return (await generateCashlessPdfWithReport(options)).bytes;
}
