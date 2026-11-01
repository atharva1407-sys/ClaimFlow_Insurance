'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fmtDate } from '@/lib/client';

export interface CaseRow {
  requestId: string;
  statusLabel: string;
  status: string;
  isEmergency: boolean;
  sectionBStatus: string;
  sectionCStatus: string;
  emergencyPending: string[];
  updatedAt: string;
  patient: { name: string; patientCode: string };
  doctor?: { name: string } | null;
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

export function pillFor(r: CaseRow): { text: string; variant: BadgeVariant } {
  if (r.sectionBStatus === 'RETURNED_FOR_CORRECTION' || r.sectionCStatus === 'RETURNED_FOR_CORRECTION') return { text: 'Revisions required', variant: 'danger' };
  if (r.isEmergency && r.emergencyPending.length) return { text: r.statusLabel, variant: 'danger' };
  if (['TPA_APPROVED', 'DISCHARGED', 'CLOSED'].includes(r.status)) return { text: r.statusLabel, variant: 'success' };
  if (['SUBMITTED_TO_TPA', 'TPA_QUERY', 'ENHANCEMENT_REQUESTED'].includes(r.status)) return { text: r.statusLabel, variant: 'info' };
  if (r.status === 'TPA_REJECTED') return { text: r.statusLabel, variant: 'danger' };
  if (r.status.startsWith('AWAITING')) return { text: r.statusLabel, variant: 'warning' };
  return { text: r.statusLabel, variant: 'info' };
}

type SortKey = 'requestId' | 'patient' | 'updatedAt' | 'status';
const PAGE_SIZE = 10;

export function CaseTable({ rows, hrefFor, empty, loading }: { rows: CaseRow[]; hrefFor: (r: CaseRow) => string; empty: string; loading?: boolean }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const val = (r: CaseRow) => (sortKey === 'patient' ? r.patient.name.toLowerCase() : sortKey === 'status' ? pillFor(r).text.toLowerCase() : sortKey === 'updatedAt' ? new Date(r.updatedAt).getTime() : r.requestId);
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * (dir === 'asc' ? 1 : -1);
    });
  }, [rows, sortKey, dir]);

  // A new filter or search can leave the current page past the end.
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  useEffect(() => { if (page > pages - 1) setPage(pages - 1); }, [page, pages]);
  const shown = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setDir(k === 'updatedAt' ? 'desc' : 'asc'); }
    setPage(0);
  };
  const head = (k: SortKey, label: string) => {
    const Icon = sortKey !== k ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <TableHead className="px-5" aria-sort={sortKey === k ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" onClick={() => sortBy(k)} className="inline-flex items-center gap-1.5 font-bold hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          {label} <Icon className="h-3.5 w-3.5" />
        </button>
      </TableHead>
    );
  };

  return (
    <Card className="rounded-2xl border-slate-200/80 overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            {head('requestId', 'Request ID')}
            {head('patient', 'Patient')}
            <TableHead className="px-5">Doctor</TableHead>
            {head('updatedAt', 'Last updated')}
            {head('status', 'Status')}
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium text-slate-700">
          {shown.map((r) => {
            const pill = pillFor(r);
            return (
              <TableRow
                key={r.requestId}
                className="cursor-pointer"
                onClick={(e) => { if (!(e.target as HTMLElement).closest('a,button')) router.push(hrefFor(r)); }}
              >
                <TableCell className="px-5 py-4">
                  <Link href={hrefFor(r)} className="font-bold text-primary hover:underline">{r.requestId}</Link>
                  {r.isEmergency && <Badge variant="danger" className="ml-2 px-1.5 py-0 text-xs">EMERGENCY</Badge>}
                </TableCell>
                <TableCell className="px-5 py-4 font-semibold text-slate-900">{r.patient.name}<div className="text-xs font-normal text-slate-500">{r.patient.patientCode}</div></TableCell>
                <TableCell className="px-5 py-4 text-slate-600">{r.doctor?.name ?? <span className="text-slate-500">Not assigned</span>}</TableCell>
                <TableCell className="px-5 py-4 text-slate-600">{fmtDate(r.updatedAt)}</TableCell>
                <TableCell className="px-5 py-4"><Badge variant={pill.variant}>{pill.text}</Badge></TableCell>
              </TableRow>
            );
          })}
          {loading && rows.length === 0 && [0, 1, 2, 3].map((i) => (
            <TableRow key={`sk${i}`}><TableCell colSpan={5} className="px-5 py-4"><Skeleton className="h-6 w-full" /></TableCell></TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-500">{empty}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft /> Previous</Button>
            <span>Page {page + 1} of {pages}</span>
            <Button type="button" variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight /></Button>
          </div>
        </div>
      )}
    </Card>
  );
}
