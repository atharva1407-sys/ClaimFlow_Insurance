ROLE
You are a senior full-stack engineer and healthcare-workflow analyst. Steps a to c of the working order in section 10 are analysis only. In step d you may write small throwaway proof-of-concept scripts for PDF placement. Write no application code (database, portals, workflows) until I have confirmed the output of steps a to d and the open questions in section 9. After each step in section 10, STOP and wait for my confirmation before starting the next one.

Source file: cashless_request_form.pdf (in this project folder).

1. PROJECT IN ONE PARAGRAPH
Hospitals in India fill a paper "Cashless Form" (Bajaj General Insurance) to request cashless hospitalisation for an insured patient. Three different people fill different parts: the patient, the treating doctor, and the hospital desk. Today it is handwritten, passed between them, then faxed or scanned to the insurer's TPA desk. I want a web application where each person completes only their own part digitally, all data is stored centrally under one Cashless Request ID, and the system writes the data onto the ORIGINAL PDF to produce the completed form. The form is never redesigned. In an emergency, one authorised person can fill the whole form alone and generate it immediately. Beyond digitising the form, the system automates the surrounding process: intake, prefill, checking, sending, tracking insurer queries, and collecting claim documents.

2. THE REAL-LIFE PROCESS (what happens today)
- The patient is admitted, planned or emergency.
- The hospital's insurance desk starts the cashless request.
- The patient provides personal and policy details (Section B).
- The treating doctor provides diagnosis, ICD codes, treatment plan, and accident or maternity details (Section C).
- The hospital provides provider details (Section A), admission details and estimated costs (Section D).
- Pages 1 and 2 are faxed or scanned to the insurer's TPA desk. Page 3 is "NOT TO BE FAXED/SCANNED" and stays with the hospital.
- The insurer may raise queries, approve, reject, or later receive an enhancement request.
- After discharge, the hospital sends supporting documents (the page 4 checklist).
- In emergencies the patient may be unable to fill anything and the doctor may be unavailable, yet the request cannot wait.

3. THE SOURCE DOCUMENT (the authority)
- cashless_request_form.pdf: 4 pages, A4. It has no interactive fields (an empty AcroForm), so values must be placed at mapped coordinates over the original pages. Inspect it yourself to confirm.
- Page 1: company header, Section A (provider), Section B (insured/patient), Section C (treating doctor/hospital).
- Page 2: Section D (patient admitted details, estimated costs, mandatory chronic illness history with "since" month/year), the declaration line, four CKYC consent categories, doctor name/qualification/registration number, hospital seal, patient signature area.
- Page 3: patient/representative declaration (clauses lettered A to G and then I; there is no H, preserve this exactly) and the nine-clause hospital declaration.
- Page 4: the documents checklist (5 items) and the IRDA AML/CFT KYC footnote.
- Preserve all printed wording, layout, checkboxes, footers, CIN and UIN exactly. Do not paraphrase any legal text. Do not add options that are not on the original form (for example extra gender options or invented dropdown lists) without flagging them.

4. WHO DOES WHAT
- Hospital staff: create the request, assign patient and doctor, fill Section A and Section D (admission and costs), review everything, return sections for correction, approve, generate the PDF, send, track.
- Patient (or representative): fills Section B only, via a secure link with OTP. Cannot see or edit clinical or hospital fields.
- Treating doctor: fills Section C and the clinical items (chronic illness history, qualification, registration number). Sees only assigned cases.
- Emergency operator: a designated person (hospital emergency/casualty staff or a doctor) who can fill ALL sections of an emergency case alone. See section 7.
- Admin: manages users, hospitals, roles, templates, audit records. No casual access to patient data.
Ownership of some fields is ambiguous (for example chronic illness history). Flag these; do not decide silently.

5. HOW A NORMAL CASE FLOWS
Create (hospital) -> invite patient and doctor -> patient, doctor and hospital fill in parallel -> each submits their section -> validation -> hospital review (can return a section with a note) -> approve -> generate PDF -> send to TPA -> track status (query, approved, rejected, enhancement) -> collect discharge documents.
- Each section has its own status: Not started, In progress, Submitted, Returned for correction, Reviewed.
- The case has an overall status that never contradicts its sections.
- Two IDs: Patient ID (e.g. PAT-000125) and Cashless Request ID (e.g. CR-2026-00152). A patient can have many requests. An ID is never a password; access always needs authentication or an expiring, revocable invitation.

6. THE AUTOMATED VERSION (priority order)
Core (version 1):
- The role-based portals and shared case record above.
- Patient intake by SMS/WhatsApp link or QR, OTP verification, mobile-friendly form.
- Returning-patient prefill (patient confirms).
- Doctor templates for common diagnoses and procedures, and ICD-10 suggestions that the doctor must confirm. Suggestions are labelled as suggestions.
- Hospital rate card and agreed package rates that prefill cost estimates; automatic total shown for staff verification; warning when the estimate exceeds an agreed package rate. Do not assume the total formula; list it as an open question.
- Pre-submission rules check (see section 8).
- Notifications and reminders to the next responsible person.
- The emergency portal (section 7).
- PDF generation, preview, download, versioning.
- Manual "sent to TPA" and manual status entry (query, approved, rejected), with the query text routed back to the right person and resubmission creating a new PDF version.
- Page 4 checklist as a live task list with upload slots.
Phase 2 (design as swappable connectors, do not assume availability):
- Policy verification, direct submission to the TPA, and status sync, only where the insurer offers it.
- Insurance card OCR prefill with explicit patient consent (do not store Aadhaar numbers).
- Analytics dashboard: turnaround time, cases waiting by role, common query reasons, emergency-mode usage.
- Template engine so another insurer's form can be added with a new template file and coordinate map.

7. EMERGENCY PORTAL
Purpose: when a patient is admitted as an emergency, one authorised person can fill the entire form (Sections A, B, C and D) alone and generate the original PDF immediately, without waiting for the patient, doctor or other staff.
Access
- Role/permission "Emergency operator", given by the hospital to designated staff or doctors. Never a shared login.
- Starting emergency mode requires a mandatory short reason, creates the case and Cashless Request ID, sets Section D's Emergency/Planned field to Emergency, and flags the case "emergency mode" in the database and audit log. Add no emergency marking to the generated PDF; the printed template stays unchanged.
Data entry
- One fast, mobile-friendly guided flow covering all four sections. Prefill where possible: hospital details from the hospital profile; treating-doctor details from the doctor directory; patient details from a previous admission or an insurance-card scan, always shown to the operator for confirmation; cost estimates from the hospital rate card, shown for verification.
- If the operator is the treating doctor, the doctor's fields are prefilled and Section C counts as doctor-verified.
- A configurable minimum set of required fields applies before generation (an open question). Missing fields stay blank on the PDF; never invent or default values.
Generation
- The operator can generate and preview the four-page PDF as soon as the minimum set is complete.
- Signature areas, hospital seal, patient declaration and hospital declaration stay blank and unmarked. Never imply that any signature, consent, doctor verification or declaration has occurred unless it did.
Post-generation confirmations (tracked tasks; they do not block generation)
- Doctor verifies or corrects Section C (skipped if the doctor was the operator).
- Patient or representative confirms Section B via OTP link.
- Patient/representative and hospital complete the declarations through the hospital-approved signing process.
- Hospital supervisor reviews the emergency-mode entry.
- Any change made during these confirmations creates a new PDF version; the earlier version is marked outdated and kept in history.
- Each field records who entered it and whether it is verified. Clinical fields entered by a non-doctor display as "unverified" until the doctor confirms.
- Case status shows pending confirmations, e.g. "Emergency: awaiting doctor / patient / supervisor".
Controls against misuse
- Only designated roles may use emergency mode; reason is mandatory; every use is audited; a report shows emergency-mode usage by user, count and case.
- Emergency mode never relaxes hospital data isolation, server-side permission checks, or the rule that an ID alone grants no access.

8. RULES ENGINE, PDF, DATA AND SECURITY
Pre-submission checks. Warn or block on, for example: admission date earlier than first consultation date; surgery selected but no surgery name or OT charges; accident case without RTA, police or FIR information; maternity fields incomplete; ICU days with no ICU charges, or the reverse; total not matching its components; emergency versus planned inconsistent with dates. Only implement rules supported by the form or approved by the hospital; mark anything else "needs confirmation".
PDF
- Keep the original PDF as the base template and overlay values using a field-to-coordinate map stored as data (page, x, y, width, font size, type), not hardcoded. Swapping a template means changing the file and map only.
- Handle text, multiline text, dates, times, numbers, checkboxes and Yes/No marks. Never silently truncate; flag values that do not fit.
- Every generated PDF is tied to a template version and a case version. If data changes afterwards, mark the old PDF as outdated and generate a new version, keeping history.
Data and security
- Store structured data in a database, never only in the PDF. Keep an audit log of who changed what and when. Private encrypted storage, role-based access checked on the server, hospital-level data isolation, no patient data in URLs, retention settings.
- Use synthetic data only until the hospital approves real data and privacy requirements (including India's DPDP Act) have been reviewed by qualified people.
- Suggested stack: Next.js with TypeScript, Tailwind, React Hook Form and Zod; PostgreSQL with Prisma; pdf-lib; private object storage.

9. OPEN QUESTIONS (list these back to me; do not decide them)
- Which fields are mandatory? The original form does not mark them.
- Who owns the chronic illness history, and how is "no chronic illness" represented, given the form has no such option?
- How is the total expected cost calculated, and does the package amount replace the other items?
- How does the patient get access: OTP link or account?
- Are Hospital ID and Rohini ID required for every hospital?
- Will the insurer accept a system-filled PDF, and how is it submitted?
- Emergency: who may be an emergency operator; the minimum required fields; deadlines for the confirmations and what happens if they are missed; the insurer's/TPA's emergency intimation rules and time limits; whether the PDF may be sent before the doctor's confirmation.
- Never invent validation rules, mandatory fields, clinical values or legal wording.

10. WORKING ORDER (stop after each step and wait for my confirmation)
 a. Inspect the PDF and restate in your own words your understanding of the project, the process, the three-role handoff and the emergency route, so I can confirm it. Note anything in this spec that is unclear or contradictory.
 b. Produce the complete field map for all four pages (label, page, section, owner role, input type, required/optional/conditional, conditional rule, coordinates, database field). Save it as field-map.md and field-map.json.
 c. List every open question and ambiguity for the hospital and doctor, and mark which fields each one affects.
 d. Prove the PDF overlay with synthetic data using throwaway scripts, and show the rendered pages next to the original.
 e. After I confirm a to d, build in this order, stopping after each for my review: 1) database and roles, 2) the portals and normal workflow, 3) the emergency portal, 4) rules checks, 5) full PDF generation with preview and versioning, 6) security hardening and automated tests.

11. ACCEPTANCE CHECKS
- The printed template is unchanged; every original field has a mapping decision.
- Data from all roles sits under one request ID.
- Roles cannot edit each other's sections; conditional sections (other insurance, accident, maternity, surgery, chronic illness) behave correctly.
- Incomplete normal cases cannot be finalised; no text is clipped or overlapping; declarations and signature areas are untouched.
- Changed data produces a new PDF version.
- Users cannot reach records by changing an ID in the URL.
- An emergency operator can create a case, fill all four sections and generate the four-page PDF without any other user acting; the PDF shows only the entered values with signature, seal and declaration areas blank and no emergency marking.
- The case record shows emergency mode, the reason, the operator and every pending confirmation; doctor, patient and supervisor confirmations work after generation and corrections produce a new version.
- Non-designated users cannot start emergency mode, and unverified clinical fields are labelled until the doctor confirms.