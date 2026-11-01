'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fmtDate, useRequest, useSession } from '@/lib/client';

const ALL = '__all__'; // Radix Select items cannot have an empty value

export default function AuditTrailPage() {
  const id = useParams().id as string;
  const { user } = useSession();
  const { request, loading, error } = useRequest(id);
  const [filter, setFilter] = useState(ALL);

  const logs: any[] = useMemo(() => request?.auditLogs ?? [], [request]);
  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs]);
  const shown = logs.filter((l) => filter === ALL || l.action === filter);
  const shellRole = user?.role === 'EMERGENCY_OPERATOR' ? 'EMERGENCY' : user?.role === 'DOCTOR' ? 'DOCTOR' : 'HOSPITAL';

  return (
    <PortalShell title={`Audit trail · ${request?.requestId ?? id}`} role={shellRole} activeNav="dashboard" backLink={{ href: `/hospital/requests/${id}`, label: 'Back to case' }}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit trail and versions</h1>
          <p className="text-sm text-slate-500 mt-1 font-mono">{request?.requestId ?? id}</p>
        </div>
        {loading && <PageSkeleton />}
        {error && <Alert variant="destructive">{error}</Alert>}

        {request && (
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity log</TabsTrigger>
              <TabsTrigger value="versions">PDF versions</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <div className="w-64">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="h-9" aria-label="Filter by action"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All actions</SelectItem>
                    {actions.map((a) => <SelectItem key={a} value={a}>{a.replace(/_/g, ' ').toLowerCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                <Table>
                  <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {shown.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap text-slate-500">{fmtDate(l.timestamp)}</TableCell>
                        <TableCell><div className="font-semibold text-slate-900">{l.userName ?? 'System'}</div><div className="text-xs text-slate-500">{String(l.userRole ?? '').toLowerCase().replace(/_/g, ' ')}</div></TableCell>
                        <TableCell className="font-semibold text-slate-800">{l.action.replace(/_/g, ' ').toLowerCase()}</TableCell>
                        <TableCell className="text-slate-600">{l.details}</TableCell>
                      </TableRow>
                    ))}
                    {shown.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">No entries.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="versions">
              <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                <Table>
                  <TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Generated</TableHead><TableHead>By</TableHead><TableHead>Case version</TableHead><TableHead>State</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {(request.versions ?? []).map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-bold">v{v.version}</TableCell>
                        <TableCell className="text-slate-500">{fmtDate(v.generatedAt)}</TableCell>
                        <TableCell>{v.generatedBy}</TableCell>
                        <TableCell>{v.caseVersion}</TableCell>
                        <TableCell><Badge variant={v.isOutdated ? 'warning' : 'success'}>{v.isOutdated ? 'outdated' : 'current'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="link" size="sm"><a href={`/api/requests/${request.requestId}/pdf?version=${v.version}&download=true`}>Download</a></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(request.versions ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">No PDF version has been saved yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PortalShell>
  );
}
