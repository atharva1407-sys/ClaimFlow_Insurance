'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, Trash2, Upload } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError, api, fmtDate } from '@/lib/client';

interface Doc { id: string; fileName: string; fileSize: number; uploadedAt: string; uploadedBy: string }

/** Optional supporting documents. Files are added to the end of the final PDF, after page 4. */
export function SupportingDocuments({ requestId }: { requestId: string }) {
  const base = `/api/requests/${encodeURIComponent(requestId)}/documents`;
  const [docs, setDocs] = useState<Doc[]>([]);
  const [info, setInfo] = useState<{ canChange: boolean; me: string; isDesk: boolean }>({ canChange: false, me: '', isDesk: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api<{ documents: Doc[]; canChange: boolean; me: string; isDesk: boolean }>(base);
      setDocs(d.documents);
      setInfo({ canChange: d.canChange, me: d.me, isDesk: d.isDesk });
    } catch (e: any) {
      setError(e.message);
    }
  }, [base]);
  useEffect(() => { load(); }, [load]);

  const upload = async (file: File) => {
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(base, { method: 'POST', body: fd, credentials: 'same-origin' });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new ApiError(b.error || 'Upload failed', r.status, b);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true); setError('');
    try { await api(`${base}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-xs">
      <CardContent className="p-6 space-y-4">
        <div className="pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Supporting documents (optional)</h2>
          <p className="text-xs text-slate-500 mt-1">PDF, JPG or PNG, up to 4 MB each and 10 per case. They are added to the end of the final PDF, after page 4.</p>
        </div>

        {docs.map((d) => {
          const mine = d.uploadedBy === info.me;
          return (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <a href={`${base}?download=${d.id}`} className="flex items-center gap-2 font-semibold text-[#0A65FF] truncate"><Download className="w-3.5 h-3.5 shrink-0" /> {d.fileName}</a>
                <div className="text-xs text-slate-500">{d.uploadedBy} · {fmtDate(d.uploadedAt)} · {(d.fileSize / 1024).toFixed(0)} KB</div>
              </div>
              {info.canChange && (mine || info.isDesk) && (
                <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => remove(d.id)} className="text-slate-500 hover:text-rose-600"><Trash2 /> Remove</Button>
              )}
            </div>
          );
        })}
        {docs.length === 0 && <div className="text-sm text-slate-500">No supporting documents added.</div>}

        {error && <Alert variant="destructive">{error}</Alert>}

        {info.canChange && (
          <Button asChild variant="outline" className={busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}>
            <label>
              {busy ? <Loader2 className="animate-spin" /> : <Upload />} Add a document
              <input type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
            </label>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
