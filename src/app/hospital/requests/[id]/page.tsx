'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Eye, KeyRound, Loader2, Send, Trash2 } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SupportingDocuments } from '@/components/forms/SupportingDocuments';
import { ApiError, api, fmtDate, useRequest, useSession } from '@/lib/client';
import { STATUS_TRANSITIONS } from '@/lib/workflow';

const SECTION_META = [
  { key: 'A', title: 'Details of the Provider', owner: 'Hospital desk', href: (id: string) => `/hospital/requests/${id}/section-a` },
  { key: 'B', title: 'Insured / Patient', owner: 'Patient', href: (id: string) => `/hospital/requests/${id}/section-b` },
  { key: 'C', title: 'Treating doctor', owner: 'Doctor', href: (id: string) => `/hospital/requests/${id}/section-c` },
  { key: 'D', title: 'Admission, costs, chronic history', owner: 'Hospital desk', href: (id: string) => `/hospital/requests/${id}/section-d` },
] as const;

const PILL: Record<string, 'neutral' | 'info' | 'success' | 'danger'> = {
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'info',
  SUBMITTED: 'success',
  RETURNED_FOR_CORRECTION: 'danger',
  REVIEWED: 'success',
};

export default function CaseHubPage() {
  const id = useParams().id as string;
  const { user } = useSession();
  const { request, loading, error, act, reload } = useRequest(id);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [returning, setReturning] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [invite, setInvite] = useState<{ url: string; devOtp?: string } | null>(null);
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const isStaff = user?.role === 'HOSPITAL_STAFF';
  const shellRole = user?.role === 'EMERGENCY_OPERATOR' ? 'EMERGENCY' : 'HOSPITAL';

  const run = async (label: string, fn: () => Promise<any>, ok?: string) => {
    setBusy(label);
    setMsg(null);
    try {
      const d = await fn();
      if (ok) setMsg({ kind: 'ok', text: ok });
      return d;
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Something went wrong.' });
    } finally {
      setBusy('');
    }
  };


  const allowedNext = request ? STATUS_TRANSITIONS[request.status] ?? [] : [];

  return (
    <PortalShell title={`Case ${request?.requestId ?? id}`} role={shellRole} activeNav="dashboard" backLink={{ href: '/hospital/dashboard', label: 'Back to dashboard' }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Case management</h1>
          <p className="text-sm text-slate-500 mt-1">Progress of each section, review actions and sending to the TPA</p>
        </div>

        {loading && <PageSkeleton />}
        {error && <Alert variant="destructive">{error}</Alert>}

        {request && (
          <>
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardContent className="p-6 flex flex-wrap items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{request.patientRecord?.name ?? request.patient.name}</h2>
                    <Badge variant={request.isEmergency && request.emergencyPending?.length ? 'danger' : 'info'}>{request.statusLabel}</Badge>
                  </div>
                  <div className="text-sm text-slate-500 mt-1 font-mono">{request.requestId} · {request.patient.patientCode} · updated {fmtDate(request.updatedAt)}</div>
                </div>
                <div className="text-sm">
                  <div className="text-slate-500 font-medium">Treating doctor</div>
                  <div className="text-slate-800 font-bold">{request.doctor?.name ?? 'Not assigned'}</div>
                </div>
              </CardContent>
            </Card>

            {msg && <Alert variant={msg.kind === 'ok' ? 'success' : 'destructive'}>{msg.text}</Alert>}

            {request.isEmergency && (
              <Card className="rounded-2xl border-rose-200 bg-rose-50/40">
                <CardContent className="p-5 text-sm space-y-3">
                  <div className="flex items-center gap-2 font-bold text-rose-700"><AlertTriangle className="w-4 h-4" /> Emergency mode: {request.statusLabel}</div>
                  <div>Reason: <span className="font-semibold">{request.emergencyReason}</span></div>
                  <div className="flex flex-wrap gap-4">
                    {[['Doctor verified', request.emergencyDoctorConfirmed], ['Patient confirmed', request.emergencyPatientConfirmed], ['Supervisor reviewed', request.emergencySupervisorReviewed]].map(([l, v]) => (
                      <span key={String(l)} className={v ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>{v ? '✓' : '○'} {l}</span>
                    ))}
                  </div>
                  {isStaff && !request.emergencySupervisorReviewed && (
                    <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run('sup', () => act({ action: 'EMERGENCY_CONFIRM', confirmType: 'SUPERVISOR' }), 'Emergency entry marked as reviewed.')} className="border-rose-300 text-rose-700 hover:bg-rose-100">
                      Record supervisor review
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 text-sm font-semibold">
              <Link href={`/hospital/requests/${request.requestId}/history`} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Audit trail and versions</Link>
            </div>

            {(
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {isStaff && ['A', 'B', 'C', 'D'].some((k) => request[`section${k}Status`] === 'SUBMITTED') && (
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" disabled={!!busy} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => run('rev', async () => {
                          for (const k of ['A', 'B', 'C', 'D']) {
                            if (request[`section${k}Status`] === 'SUBMITTED') await api(`/api/requests/${encodeURIComponent(id)}`, { method: 'PATCH', json: { action: 'REVIEW_SECTION', section: k } });
                          }
                          await reload();
                        }, 'All submitted sections are marked reviewed.')}>
                        Mark all submitted sections reviewed
                      </Button>
                    </div>
                  )}
                  {SECTION_META.map((s) => {
                    const status: string = request[`section${s.key}Status`];
                    const canReturn = isStaff && ['SUBMITTED', 'REVIEWED'].includes(status);
                    return (
                      <Card key={s.key} className="rounded-2xl border-slate-200/80 shadow-xs">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A65FF] flex items-center justify-center font-bold text-sm">{s.key}</div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">Section {s.key} · {s.title}</div>
                                <div className="text-xs text-slate-500">Filled by: {s.owner}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={PILL[status] ?? 'neutral'}>{status.replace(/_/g, ' ').toLowerCase()}</Badge>
                              {request.editable?.[s.key] && <Link href={s.href(request.requestId)} className="text-sm font-bold text-[#0A65FF] hover:underline">Edit</Link>}
                              {!request.editable?.[s.key] && <Link href={s.href(request.requestId)} className="text-sm font-semibold text-slate-500 hover:underline">View</Link>}
                            </div>
                          </div>

                          {s.key === 'B' && isStaff && (
                            <div className="text-sm space-y-2">
                              <Button size="sm" variant="outline" disabled={!!busy} onClick={async () => { const d = await run('inv', () => act({ action: 'REISSUE_INVITE' })); if (d) setInvite({ url: `${window.location.origin}${d.patientAccessUrl}`, devOtp: d.devOtp }); }}>
                                <KeyRound /> Send new patient invitation
                              </Button>
                              {invite && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                                  <div className="font-mono break-all">{invite.url}</div>
                                  {invite.devOtp ? <div>OTP (no SMS gateway in this environment): <strong className="font-mono">{invite.devOtp}</strong>, valid 30 minutes, works once.</div> : <div>OTP sent to the patient&apos;s registered mobile number.</div>}
                                </div>
                              )}
                            </div>
                          )}

                          {s.key === 'C' && isStaff && (
                            <div className="text-sm flex items-center gap-2">
                              <AssignDoctor current={request.doctor?.id} onAssign={(doctorId) => run('assign', () => act({ action: 'ASSIGN_DOCTOR', doctorId }), 'Doctor assigned.')} />
                            </div>
                          )}

                          {canReturn && (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              {returning === s.key ? (
                                <>
                                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs correcting?" className="flex-1 min-w-[200px] h-8 rounded-lg" />
                                  <Button size="sm" variant="destructive" disabled={!note.trim() || !!busy} onClick={async () => { await run('ret', () => act({ action: 'RETURN_SECTION', section: s.key, note }), `Section ${s.key} returned.`); setReturning(null); setNote(''); }}>Return</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setReturning(null)}>Cancel</Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setReturning(s.key)}>Return for correction</Button>
                                </>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  <SupportingDocuments requestId={request.requestId} />

                  <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                    <CardContent className="p-5 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
                      {(request.auditLogs || []).slice(0, 8).map((a: any) => (
                        <div key={a.id} className="text-sm border-l-2 border-slate-200 pl-3">
                          <div className="font-semibold text-slate-800">{a.action.replace(/_/g, ' ').toLowerCase()}</div>
                          <div className="text-xs text-slate-500">{a.userName} · {fmtDate(a.timestamp)}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                    <CardContent className="p-5 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Actions</h3>
                      <Link href={`/hospital/requests/${request.requestId}/review`} className="block w-full text-center py-2.5 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-800 text-sm font-bold hover:bg-amber-100/70">Pre-submission rules check</Link>
                      <Link href={`/hospital/requests/${request.requestId}/preview`} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-[#0A65FF] text-sm font-bold hover:bg-blue-100/70"><Eye className="w-3.5 h-3.5" /> PDF preview and versions</Link>
                    </CardContent>
                  </Card>

                  {isStaff && (
                    <Button type="button" variant="outline" className="w-full border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={() => { setConfirmText(''); setDeleteError(''); setDeleteOpen(true); }}>
                      <Trash2 /> Delete case
                    </Button>
                  )}

                  {isStaff && allowedNext.length > 0 && (
                    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                      <CardContent className="p-5 space-y-3 text-sm">
                        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">TPA status</h3>
                        <Select value={nextStatus} onValueChange={setNextStatus}>
                          <SelectTrigger aria-label="Move the case to a new TPA status"><SelectValue placeholder="Move to…" /></SelectTrigger>
                          <SelectContent>
                            {allowedNext.map((st) => <SelectItem key={st} value={st}>{st.replace(/_/g, ' ').toLowerCase()}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Textarea rows={2} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Note (query text, rejection reason…)" />
                        <Button disabled={!nextStatus || !!busy} className="w-full" onClick={async () => { const d = await run('status', () => act({ action: 'UPDATE_STATUS', newStatus: nextStatus, note: statusNote }), 'Status updated.'); if (d !== undefined) { setNextStatus(''); setStatusNote(''); } }}>
                          <Send /> Update status
                        </Button>
                        <p className="text-xs text-slate-500">Sending to the TPA is recorded manually. It needs all sections submitted, no blocking issues and a current PDF version.</p>
                      </CardContent>
                    </Card>
                  )}
                  {request.tpaQueryNotes && request.status === 'TPA_QUERY' && (
                    <Card className="rounded-2xl border-amber-200 bg-amber-50/50"><CardContent className="p-5 text-sm"><div className="font-bold text-amber-800 mb-1">TPA query</div>{request.tpaQueryNotes}</CardContent></Card>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Dialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete case {request?.requestId}?</DialogTitle>
            <DialogDescription>
              This permanently removes the case everywhere: its sections, every saved PDF version, all supporting documents and the activity log for this case. The patient&apos;s record is removed too unless they have other cases. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-id">Type <span className="font-mono">{request?.requestId}</span> to confirm</Label>
            <Input id="confirm-id" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          </div>
          {deleteError && <Alert variant="destructive">{deleteError}</Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting || confirmText.trim() !== request?.requestId}
              onClick={async () => {
                setDeleting(true);
                setDeleteError('');
                try {
                  await api(`/api/requests/${encodeURIComponent(request.requestId)}?confirm=${encodeURIComponent(confirmText.trim())}`, { method: 'DELETE' });
                  router.replace('/hospital/dashboard');
                } catch (e) {
                  setDeleteError(e instanceof ApiError ? e.message : 'Could not delete the case.');
                  setDeleting(false);
                }
              }}
            >
              {deleting && <Loader2 className="animate-spin" />} Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}

function AssignDoctor({ current, onAssign }: { current?: string; onAssign: (id: string) => void }) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [pick, setPick] = useState(current ?? '');
  useEffect(() => { api('/api/meta').then((d) => setDoctors(d.doctors)).catch(() => {}); }, []);
  return (
    <>
      <Select value={pick} onValueChange={setPick}>
        <SelectTrigger className="h-8 w-52 rounded-lg" aria-label="Choose a doctor"><SelectValue placeholder="Choose a doctor…" /></SelectTrigger>
        <SelectContent>
          {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" disabled={!pick || pick === current} onClick={() => onAssign(pick)}>Assign</Button>
    </>
  );
}
