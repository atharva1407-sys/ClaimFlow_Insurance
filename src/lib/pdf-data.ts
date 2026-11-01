import { parseJson, type FullRequest } from './api';
import type { GeneratePdfOptions } from './pdf-generator';

/** Stored case data -> overlay input. The overlay never receives anything that is not in the case record. */
export function pdfOptionsFor(r: FullRequest): GeneratePdfOptions {
  const meta = parseJson<Record<string, { verified?: boolean }>>(r.sectionMeta) ?? {};
  // In an emergency the page-2 doctor block (name, qualification, registration) stays blank until a doctor has verified Section C.
  const doctorVerified = !r.isEmergency || r.emergencyDoctorConfirmed || meta.C?.verified === true;
  return {
    provider: parseJson(r.providerData) ?? undefined,
    patient: parseJson(r.patientData) ?? undefined,
    clinical: parseJson(r.clinicalData) ?? undefined,
    admissionExpense: parseJson(r.admissionData) ?? parseJson(r.expenseData) ?? undefined,
    chronic: parseJson(r.chronicData) ?? undefined,
    declarations: parseJson(r.declarationsData) ?? undefined,
    isEmergency: r.isEmergency,
    omitDoctorBlock: !doctorVerified,
    title: `Cashless request ${r.requestId}`,
  };
}
