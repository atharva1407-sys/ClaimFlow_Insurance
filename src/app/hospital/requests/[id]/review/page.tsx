'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, useSession } from '@/lib/client';

interface Issue { section: string; fieldId?: string; severity: 'BLOCKER' | 'WARNING'; message: string }
interface Result { blockers: Issue[]; warnings: Issue[]; pdfIssues: { fieldId: string; label: string; message: string }[]; finalisable: boolean }

export default function RulesReviewPage() {
  const id = useParams().id as string;
  const { user } = useSession();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setResult(await api<Result>(`/api/requests/${encodeURIComponent(id)}/validate`));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { run(); }, [run]);

  const sectionHref = (s: string) => ({ A: 'section-a', B: 'section-b', C: 'section-c', D: 'section-d' } as Record<string, string>)[s] ?? '';
  const shellRole = user?.role === 'EMERGENCY_OPERATOR' ? 'EMERGENCY' : 'HOSPITAL';

  const rows: (Issue & { kind: 'error' | 'warning' | 'pdf' })[] = result
    ? [
        ...result.blockers.map((b) => ({ ...b, kind: 'error' as const })),
        ...result.warnings.map((w) => ({ ...w, kind: 'warning' as const })),
        ...result.pdfIssues.map((p) => ({ section: '', fieldId: p.fieldId, severity: 'BLOCKER' as const, message: `${p.label}: ${p.message}`, kind: 'pdf' as const })),
      ]
    : [];

  return (
    <PortalShell title={`Rules check · ${id}`}
      role={shellRole}
      activeNav="dashboard"
      backLink={{ href: `/hospital/requests/${id}`, label: 'Back to case' }}
      topActions={<Button size="sm" onClick={run} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} /> Re-check</Button>}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pre-submission rules check</h1>
          <p className="text-sm text-slate-500 mt-1">Consistency checks between the sections. Blocking items stop the case being finalised; warnings do not.</p>
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}
        {loading && <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking…</div>}

        {result && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Blocking', n: result.blockers.length + result.pdfIssues.length, cls: 'text-rose-600 bg-rose-50/40 border-rose-100', icon: AlertCircle },
                { label: 'Warnings', n: result.warnings.length, cls: 'text-amber-600 bg-amber-50/40 border-amber-100', icon: AlertTriangle },
                { label: result.finalisable && result.pdfIssues.length === 0 ? 'Ready to finalise' : 'Not ready', n: result.finalisable && result.pdfIssues.length === 0 ? 1 : 0, cls: 'text-emerald-600 bg-emerald-50/40 border-emerald-100', icon: CheckCircle2 },
              ].map((c) => (
                <Card key={c.label} className={`rounded-2xl shadow-xs ${c.cls}`}>
                  <CardContent className="p-5 flex items-center gap-3"><c.icon className="w-6 h-6" /><div><div className="text-2xl font-extrabold">{c.label === 'Ready to finalise' || c.label === 'Not ready' ? '' : c.n}</div><div className="text-sm font-bold text-slate-900">{c.label}</div></div></CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardContent className="p-6">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-28">Type</TableHead><TableHead className="w-28">Section</TableHead><TableHead>Message</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell><Badge variant={r.kind === 'warning' ? 'warning' : 'danger'}>{r.kind === 'warning' ? 'Warning' : r.kind === 'pdf' ? 'Does not fit' : 'Blocking'}</Badge></TableCell>
                        <TableCell className="font-bold text-slate-900">{r.section ? `Section ${r.section}` : 'PDF'}</TableCell>
                        <TableCell className="text-slate-700">{r.message}</TableCell>
                        <TableCell className="text-right">{r.section && sectionHref(r.section) && <Button asChild variant="link" size="sm"><Link href={`/hospital/requests/${id}/${sectionHref(r.section)}`}>Open</Link></Button>}</TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">Nothing to report.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PortalShell>
  );
}
