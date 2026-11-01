'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChronicEditor, FieldList, SectionEditor } from '@/components/forms/SectionEditor';
import { SupportingDocuments } from '@/components/forms/SupportingDocuments';
import { ApiError, fmtDate, useRequest, useSession } from '@/lib/client';
import { DOCTOR_BLOCK, SECTION_A, SECTION_B, SECTION_C, SECTION_D } from '@/lib/section-config';

type Section = 'A' | 'B' | 'C' | 'D';

interface Props {
  section: Section;
  id: string;
  shellRole: 'HOSPITAL' | 'DOCTOR' | 'PATIENT';
  activeNav: string;
  title: string;
  subtitle: string;
  backLink?: { href: string; label: string };
  /** Where to go after a successful submit. */
  doneHref: string;
}

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
  RETURNED_FOR_CORRECTION: 'Returned for correction',
  REVIEWED: 'Reviewed',
};

export function SectionPage({ section, id, shellRole, activeNav, title, subtitle, backLink, doneHref }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession({ patient: shellRole === 'PATIENT' });
  const { request, loading, error, act } = useRequest(id);

  const [values, setValues] = useState<Record<string, any>>({});
  const [chronic, setChronic] = useState<Record<string, any>>({});
  const [doctorBlock, setDoctorBlock] = useState<Record<string, any>>({});
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [busy, setBusy] = useState<'save' | 'submit' | 'confirm' | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Load the stored values once, then keep local edits.
  useEffect(() => {
    if (!request || ready) return;
    const dec = request.declarationsData || {};
    if (section === 'A') setValues(request.providerData || {});
    if (section === 'B') setValues({ ...(request.prefill || {}), ...(request.patientData || {}) });
    if (section === 'D') setValues(request.admissionData || {});
    if (section === 'C') {
      setValues(request.clinicalData || {});
      setChronic(request.chronicData || {});
      setDoctorBlock({ name: dec.page2DoctorName, qualification: dec.page2DoctorQualification, registrationNo: dec.page2DoctorRegistrationNo });
    }
    setReady(true);
  }, [request, ready, section]);

  // The doctor's own profile fills blank page-2 items; they stay editable.
  useEffect(() => {
    if (section !== 'C' || !ready || !user || user.role !== 'DOCTOR') return;
    setDoctorBlock((b) => ({ name: b.name || user.name, qualification: b.qualification || user.qualification || '', registrationNo: b.registrationNo || user.registrationNo || '' }));
    setValues((v) => ({ ...v, treatingDoctorName: v.treatingDoctorName || user.name }));
  }, [section, ready, user]);

  // Warn before the browser tab is closed or reloaded with edits that were never saved.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (errorFields.length) document.getElementById(`f-${errorFields[0]}`)?.focus();
  }, [errorFields]);

  const editValues = (v: Record<string, any>) => { setValues(v); setDirty(true); setErrorFields([]); };
  const editChronic = (v: Record<string, any>) => { setChronic(v); setDirty(true); };
  const editDoctorBlock = (v: Record<string, any>) => { setDoctorBlock(v); setDirty(true); };

  const groups = { A: SECTION_A, B: SECTION_B, C: SECTION_C, D: SECTION_D }[section];
  const status: string = request ? request[`section${section}Status`] : 'NOT_STARTED';
  const editable: boolean = !!request?.editable?.[section];
  const note: string | null = section === 'B' ? request?.patientSectionNote : section === 'C' ? request?.doctorSectionNote : null;
  const meta = request?.sectionMeta?.[section];

  const payload = () => (section === 'C' ? { clinical: values, chronic, doctorBlock } : values);

  const send = async (submit: boolean) => {
    setBusy(submit ? 'submit' : 'save');
    setMessage(null);
    setErrorFields([]);
    try {
      await act({ action: submit ? 'SUBMIT_SECTION' : 'SAVE_SECTION', section, data: payload() });
      setDirty(false);
      if (submit && doneHref !== pathname) router.push(doneHref);
      else setMessage({ kind: 'ok', text: submit ? `Section ${section} submitted. Thank you.` : 'Draft saved.' });
    } catch (e) {
      setMessage({ kind: 'err', text: e instanceof ApiError ? e.message : 'Could not save.' });
      if (e instanceof ApiError && Array.isArray(e.body?.fields)) setErrorFields(e.body.fields);
    } finally {
      setBusy(null);
    }
  };

  const confirmEmergency = async (confirmType: 'DOCTOR' | 'PATIENT') => {
    setBusy('confirm');
    setMessage(null);
    try {
      await act({ action: 'EMERGENCY_CONFIRM', confirmType });
      setMessage({ kind: 'ok', text: 'Confirmation recorded.' });
    } catch (e) {
      setMessage({ kind: 'err', text: e instanceof ApiError ? e.message : 'Could not confirm.' });
    } finally {
      setBusy(null);
    }
  };

  const canConfirm =
    request?.isEmergency &&
    ((section === 'C' && user?.role === 'DOCTOR' && !request.emergencyDoctorConfirmed) || (section === 'B' && user?.role === 'PATIENT' && !request.emergencyPatientConfirmed));

  return (
    <PortalShell title={`${title} · ${request?.requestId ?? id}`} role={shellRole} activeNav={activeNav} backLink={backLink} patientRequestId={shellRole === 'PATIENT' ? request?.requestId : undefined}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          {request && (
            <div className="text-sm text-right">
              <div className="font-mono font-bold text-slate-600">{request.requestId}</div>
              <Badge variant={status === 'RETURNED_FOR_CORRECTION' ? 'danger' : status === 'SUBMITTED' || status === 'REVIEWED' ? 'success' : 'info'} className="mt-1">{STATUS_LABEL[status] ?? status}</Badge>
            </div>
          )}
        </div>

        {loading && <PageSkeleton />}
        {error && <Alert variant="destructive">{error}</Alert>}

        {request && (
          <>
            {note && status === 'RETURNED_FOR_CORRECTION' && (
              <Alert variant="warning" className="flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> Returned for correction: {note}</Alert>
            )}
            {!editable && (
              <Alert className="flex gap-2 bg-slate-100 text-slate-600">
                <Lock className="w-4 h-4 shrink-0" /> This section is read-only for you right now ({STATUS_LABEL[status] ?? status}).
              </Alert>
            )}
            {request.isEmergency && meta && meta.verified === false && (
              <Alert variant="destructive">
                Emergency entry by {meta.enteredBy} ({String(meta.enteredByRole).toLowerCase().replace(/_/g, ' ')}) on {fmtDate(meta.enteredAt)}. <strong>Unverified</strong> until {section === 'C' ? 'the treating doctor' : 'the patient or representative'} confirms.
              </Alert>
            )}

            <SectionEditor
              groups={groups}
              values={values}
              onChange={editValues}
              errorFields={errorFields}
              disabled={!editable}
              optionOverrides={section === 'D' ? { hospitalizationEventType: request.isEmergency ? ['Emergency'] : ['Planned'] } : undefined}
            />

            {section === 'C' && (
              <>
                <ChronicEditor values={chronic} onChange={editChronic} disabled={!editable} />
                <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Doctor details printed on page 2</h2>
                    <FieldList fields={DOCTOR_BLOCK} values={doctorBlock} onChange={editDoctorBlock} disabled={!editable} errorFields={errorFields} />
                  </CardContent>
                </Card>
              </>
            )}

            {shellRole === 'PATIENT' && (
              <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                <CardContent className="p-6 space-y-2 text-sm">
                  <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Your cashless form</h2>
                  {request.pdf ? (
                    <>
                      <p className="text-slate-600">The hospital has saved the completed form (version {request.pdf.version}, {fmtDate(request.pdf.generatedAt)}).{request.pdf.outdated ? ' Something changed after it was saved; the hospital will save a new version.' : ''}</p>
                      <div className="flex gap-3 pt-1">
                        <Button asChild><a href={`/api/requests/${request.requestId}/pdf`} target="_blank" rel="noreferrer">View form</a></Button>
                        <Button asChild variant="outline"><a href={`/api/requests/${request.requestId}/pdf?download=true`}>Download PDF</a></Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500">The form is not ready yet. You can view and download it here once every section has been submitted and the hospital has saved it.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {((section === 'B' && shellRole === 'PATIENT') || (section === 'C' && shellRole === 'DOCTOR')) && <SupportingDocuments requestId={request.requestId} />}

            {message && <Alert variant={message.kind === 'ok' ? 'success' : 'destructive'}>{message.text}</Alert>}

            <div className="sticky bottom-0 z-10 -mx-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200/80 bg-white/90 px-2 py-3 backdrop-blur">
              {canConfirm && (
                <Button type="button" variant="outline" onClick={() => confirmEmergency(section === 'C' ? 'DOCTOR' : 'PATIENT')} disabled={busy !== null} className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100">
                  <CheckCircle2 /> Confirm this section is correct
                </Button>
              )}
              {editable && (
                <>
                  <Button type="button" variant="outline" onClick={() => send(false)} disabled={busy !== null}>
                    {busy === 'save' ? 'Saving…' : dirty ? 'Save as draft *' : 'Save as draft'}
                  </Button>
                  <Button type="button" onClick={() => send(true)} disabled={busy !== null}>
                    {busy === 'submit' && <Loader2 className="animate-spin" />}
                    Submit section {section}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
