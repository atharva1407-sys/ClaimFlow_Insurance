'use client';

import { useEffect, useState } from 'react';
import { PortalShell } from '@/components/layout/PortalShell';
import { Alert } from '@/components/ui/alert';
import { CaseRow, CaseTable } from '@/components/CaseTable';
import { api } from '@/lib/client';

export default function DoctorDashboard() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    api<{ requests: CaseRow[] }>('/api/requests')
      .then((d) => setRows(d.requests))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const shown = rows.filter((r) => {
    const t = q.toLowerCase();
    return !t || r.requestId.toLowerCase().includes(t) || r.patient.name.toLowerCase().includes(t);
  });

  return (
    <PortalShell title="My worklist" role="DOCTOR" activeNav="worklist" onSearch={setQ}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My worklist</h1>
          <p className="text-sm text-slate-500 mt-1">Only cases assigned to you are listed.</p>
        </div>
        {error && <Alert variant="destructive">{error}</Alert>}
        <CaseTable rows={shown} hrefFor={(r) => `/doctor/requests/${r.requestId}`} loading={loading} empty="No cases assigned to you." />
      </div>
    </PortalShell>
  );
}
