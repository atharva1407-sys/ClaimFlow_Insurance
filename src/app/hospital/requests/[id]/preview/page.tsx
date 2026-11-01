'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, FileText, Loader2, Sparkles } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError, api, fmtDate, useRequest, useSession } from '@/lib/client';

export default function PdfPreviewPage() {
  const id = useParams().id as string;
  const { user } = useSession();
  const { request, loading, error, reload } = useRequest(id);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null); // null = live preview of current data
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<{ fieldId: string; label: string; message: string }[]>([]);
  const [blockers, setBlockers] = useState<{ section: string; message: string }[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const canGenerate = user?.role === 'HOSPITAL_STAFF' || (user?.role === 'EMERGENCY_OPERATOR' && request?.isEmergency);
  const shellRole = user?.role === 'EMERGENCY_OPERATOR' ? 'EMERGENCY' : user?.role === 'DOCTOR' ? 'DOCTOR' : 'HOSPITAL';
  const rid: string = request?.requestId ?? id;

  const src = selected
    ? `/api/requests/${encodeURIComponent(rid)}/pdf?version=${selected}#page=${page}`
    : `/api/requests/${encodeURIComponent(rid)}/pdf?cb=${request?.caseVersion ?? 0}#page=${page}`;

  const generate = async () => {
    setBusy(true);
    setMsg(null);
    setIssues([]);
    setBlockers([]);
    try {
      const d = await api(`/api/requests/${encodeURIComponent(rid)}/pdf`, { method: 'POST', json: { reason: 'Generated from the preview screen' } });
      await reload();
      setSelected(d.version);
      setMsg({ kind: 'ok', text: `Version ${d.version} saved for case version ${d.caseVersion}.` });
    } catch (e) {
      if (e instanceof ApiError) {
        setIssues(e.body?.issues ?? []);
        setBlockers(e.body?.blockers ?? []);
        setMsg({ kind: 'err', text: e.message });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell title={`PDF preview · ${request?.requestId ?? id}`} role={shellRole} activeNav="dashboard" backLink={{ href: `/hospital/requests/${rid}`, label: 'Back to case' }}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">PDF preview and versions</h1>
          <p className="text-sm text-slate-500 mt-1">Values are written onto the original form. The printed template, signature areas, seal and page 3 declarations are never changed or filled.</p>
        </div>

        {loading && <PageSkeleton />}
        {error && <Alert variant="destructive">{error}</Alert>}

        {request && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-9 space-y-3">
              <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((p) => (
                      <Button key={p} size="sm" variant={page === p ? 'default' : 'ghost'} onClick={() => setPage(p)}>Page {p}</Button>
                    ))}
                  </div>
                  <div className="text-slate-500">{selected ? `Saved version ${selected}` : 'Live preview of current data (not saved)'}</div>
                  <Button asChild size="sm" variant="outline">
                    <a href={selected ? `/api/requests/${rid}/pdf?version=${selected}&download=true` : `/api/requests/${rid}/pdf?download=true`}><Download /> Download</a>
                  </Button>
                </div>
                <iframe key={`${src}`} src={src} title="Cashless form PDF" className="w-full h-[calc(100vh-13rem)] min-h-[480px] bg-slate-200" />
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {canGenerate && (
                <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                  <CardContent className="p-5 space-y-3 text-sm">
                    <Button onClick={generate} disabled={busy} className="w-full">
                      {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Save as new version
                    </Button>
                    <p className="text-xs text-slate-500">Case version is {request.caseVersion}. Any later change makes saved versions outdated; they stay in the history.</p>
                    {msg && <Alert variant={msg.kind === 'ok' ? 'success' : 'destructive'}>{msg.text}</Alert>}
                    {blockers.length > 0 && <ul className="list-disc pl-4 text-rose-700">{blockers.map((b, i) => <li key={i}>{b.message}</li>)}</ul>}
                    {issues.length > 0 && (
                      <ul className="list-disc pl-4 text-rose-700">
                        {issues.map((i, n) => <li key={n}><strong>{i.label}</strong>: {i.message}</li>)}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                <CardContent className="p-5 space-y-2 text-sm">
                  <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Versions</div>
                  <button onClick={() => setSelected(null)} className={`w-full text-left px-3 py-2 rounded-lg border ${selected === null ? 'border-[#0A65FF] bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <div className="font-semibold text-slate-800">Live preview</div>
                    <div className="text-xs text-slate-500">Current data, case version {request.caseVersion}</div>
                  </button>
                  {(request.versions ?? []).map((v: any) => (
                    <button key={v.id} onClick={() => setSelected(v.version)} className={`w-full text-left px-3 py-2 rounded-lg border ${selected === v.version ? 'border-[#0A65FF] bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Version {v.version}</span>
                        <Badge variant={v.isOutdated ? 'warning' : 'success'} className="text-xs px-2 py-0">{v.isOutdated ? 'outdated' : 'current'}</Badge>
                      </div>
                      <div className="text-xs text-slate-500">{fmtDate(v.generatedAt)} · {v.generatedBy} · case v{v.caseVersion}</div>
                    </button>
                  ))}
                  {(request.versions ?? []).length === 0 && <div className="text-slate-500">No version has been saved yet.</div>}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
