'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, FileText, PlusCircle } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseRow, CaseTable } from '@/components/CaseTable';
import { api, useSession } from '@/lib/client';

type Tab = 'all' | 'pending' | 'in_progress' | 'sent' | 'revisions';

export default function HospitalDashboard() {
  const { user } = useSession();
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    api<{ requests: CaseRow[] }>('/api/requests')
      .then((d) => setRows(d.requests))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const isRevision = (r: CaseRow) => r.sectionBStatus === 'RETURNED_FOR_CORRECTION' || r.sectionCStatus === 'RETURNED_FOR_CORRECTION';
  const isPending = (r: CaseRow) => ['NOT_STARTED', 'IN_PROGRESS'].includes(r.sectionCStatus) && !r.status.startsWith('TPA') && r.status !== 'CLOSED';
  const isSent = (r: CaseRow) => ['SUBMITTED_TO_TPA', 'TPA_QUERY', 'TPA_APPROVED', 'TPA_REJECTED', 'ENHANCEMENT_REQUESTED', 'DISCHARGED', 'CLOSED'].includes(r.status);
  const isOpen = (r: CaseRow) => !isSent(r);

  const counts = {
    all: rows.length,
    pending: rows.filter(isPending).length,
    in_progress: rows.filter(isOpen).length,
    sent: rows.filter(isSent).length,
    revisions: rows.filter(isRevision).length,
  };

  const shown = rows.filter((r) => {
    const t = q.toLowerCase();
    if (t && !(r.requestId.toLowerCase().includes(t) || r.patient.name.toLowerCase().includes(t) || r.doctor?.name.toLowerCase().includes(t))) return false;
    if (tab === 'pending') return isPending(r);
    if (tab === 'in_progress') return isOpen(r);
    if (tab === 'sent') return isSent(r);
    if (tab === 'revisions') return isRevision(r);
    return true;
  });

  const kpis = [
    { label: 'Total requests', value: counts.all, icon: FileText, cls: 'bg-blue-50 text-[#0A65FF]' },
    { label: 'Waiting for the doctor', value: counts.pending, icon: Clock, cls: 'bg-amber-50 text-amber-600' },
    { label: 'Sent to the TPA', value: counts.sent, icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600' },
    { label: 'Sent back for correction', value: counts.revisions, icon: AlertCircle, cls: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <PortalShell title="Cashless requests" role={user?.role === 'EMERGENCY_OPERATOR' ? 'EMERGENCY' : 'HOSPITAL'} activeNav="dashboard" onSearch={setQ}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cashless requests</h1>
            <p className="text-sm text-slate-500 mt-1">Cases for your hospital</p>
          </div>
          {user?.role === 'HOSPITAL_STAFF' && (
            <Button asChild>
              <Link href="/hospital/requests/new"><PlusCircle /> New request</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <Card key={k.label} className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardContent className="p-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.cls}`}><k.icon className="w-5 h-5" /></div>
                <div className="text-3xl font-extrabold text-slate-900">{k.value}</div>
                <div className="text-sm font-semibold text-slate-600 mt-0.5">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="border-b border-slate-200/80 pb-1 w-full justify-start">
            {([
              ['all', `All (${counts.all})`], ['pending', `Awaiting doctor (${counts.pending})`], ['in_progress', `Open (${counts.in_progress})`],
              ['sent', `Sent (${counts.sent})`], ['revisions', `Returned (${counts.revisions})`],
            ] as [Tab, string][]).map(([id, label]) => (
              <TabsTrigger key={id} value={id}>{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {error && <Alert variant="destructive">{error}</Alert>}
        <CaseTable rows={shown} hrefFor={(r) => `/hospital/requests/${r.requestId}`} loading={loading} empty="No cases match." />
      </div>
    </PortalShell>
  );
}
