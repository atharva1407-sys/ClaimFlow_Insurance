'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PortalShell } from '@/components/layout/PortalShell';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError, api, fmtDate, ROLE_LABEL, useSession } from '@/lib/client';

const ROLES = ['HOSPITAL_STAFF', 'DOCTOR', 'EMERGENCY_OPERATOR', 'ADMIN'];

export default function AdminPage() {
  const { user } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetFor, setResetFor] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    try {
      const [u, h, a] = await Promise.all([api('/api/admin/users'), api('/api/admin/hospitals'), api('/api/admin/audit')]);
      setUsers(u.users); setHospitals(h.hospitals); setLogs(a.logs);
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.message });
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ kind: 'ok', text: ok }); await load(); return true; }
    catch (e) { setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Something went wrong.' }); return false; }
    finally { setBusy(false); }
  };

  const [h, setH] = useState<Record<string, string>>({});
  const [u, setU] = useState<Record<string, string>>({ role: 'HOSPITAL_STAFF' });
  const bind = (state: Record<string, string>, setter: (v: any) => void, k: string) => ({
    value: state[k] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setter((cur: any) => ({ ...cur, [k]: e.target.value })),
  });

  return (
    <PortalShell title="Administration" role="ADMIN" activeNav="admin">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Administration</h1>
          <p className="text-sm text-slate-500 mt-1">Hospitals, user accounts and the audit log. Administrators cannot open patient cases.</p>
        </div>
        {msg && <Alert variant={msg.kind === 'ok' ? 'success' : 'destructive'}>{msg.text}</Alert>}

        <Tabs defaultValue="users">
          <div className="flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
              <TabsTrigger value="hospitals">Hospitals ({hospitals.length})</TabsTrigger>
              <TabsTrigger value="audit">Audit log</TabsTrigger>
            </TabsList>
            {busy && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
          </div>

          <TabsContent value="users" className="space-y-6">
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Hospital</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {users.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell><div className="font-semibold text-slate-900">{x.name}</div><div className="text-slate-500">{x.email}</div></TableCell>
                      <TableCell>{ROLE_LABEL[x.role] ?? x.role}</TableCell>
                      <TableCell>{x.hospital?.name ?? '-'}</TableCell>
                      <TableCell><Badge variant={x.status === 'ACTIVE' ? 'success' : 'neutral'}>{x.status.toLowerCase()}</Badge></TableCell>
                      <TableCell className="text-right whitespace-nowrap space-x-1">
                        {x.id !== user?.id && (
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => api('/api/admin/users', { method: 'PATCH', json: { id: x.id, status: x.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } }), 'User updated.')}>
                            {x.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setResetFor(x); setNewPassword(''); }}>Reset password</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs"><CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Add user</h2>
              <form className="grid sm:grid-cols-3 gap-4" autoComplete="off" onSubmit={async (e) => { e.preventDefault(); if (await run(() => api('/api/admin/users', { method: 'POST', json: u }), 'User created.')) setU({ role: u.role }); }}>
                <div className="space-y-1.5"><Label htmlFor="un">Name *</Label><Input id="un" {...bind(u, setU, 'name')} /></div>
                <div className="space-y-1.5"><Label htmlFor="ue">Email *</Label><Input id="ue" type="email" {...bind(u, setU, 'email')} /></div>
                <div className="space-y-1.5"><Label htmlFor="up">Password * (12+ characters)</Label><Input id="up" type="password" autoComplete="new-password" {...bind(u, setU, 'password')} /></div>
                <div className="space-y-1.5">
                  <Label>Role *</Label>
                  <Select value={u.role} onValueChange={(v) => setU((c) => ({ ...c, role: v }))}>
                    <SelectTrigger aria-label="Role"><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {u.role !== 'ADMIN' && (
                  <div className="space-y-1.5">
                    <Label>Hospital *</Label>
                    <Select value={u.hospitalId ?? ''} onValueChange={(v) => setU((c) => ({ ...c, hospitalId: v }))}>
                      <SelectTrigger aria-label="Hospital"><SelectValue placeholder="Select a hospital" /></SelectTrigger>
                      <SelectContent>{hospitals.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5"><Label htmlFor="uph">Mobile</Label><Input id="uph" {...bind(u, setU, 'phone')} /></div>
                {u.role === 'DOCTOR' && (
                  <>
                    <div className="space-y-1.5"><Label htmlFor="uq">Qualification</Label><Input id="uq" {...bind(u, setU, 'qualification')} /></div>
                    <div className="space-y-1.5"><Label htmlFor="ur">Registration no. with state code</Label><Input id="ur" {...bind(u, setU, 'registrationNo')} /></div>
                    <div className="space-y-1.5"><Label htmlFor="us">Specialization</Label><Input id="us" {...bind(u, setU, 'specialization')} /></div>
                  </>
                )}
                <div className="sm:col-span-3"><Button type="submit" disabled={busy}>Create user</Button></div>
              </form>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="hospitals" className="space-y-6">
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <Table>
                <TableHeader><TableRow><TableHead>Hospital</TableHead><TableHead>City</TableHead><TableHead>Contact</TableHead><TableHead>Users</TableHead></TableRow></TableHeader>
                <TableBody>
                  {hospitals.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell className="font-semibold text-slate-900">{x.name}</TableCell>
                      <TableCell>{x.city}, {x.state}</TableCell>
                      <TableCell>{x.contactNo}<div className="text-slate-500">{x.emailId}</div></TableCell>
                      <TableCell>{x._count.users}</TableCell>
                    </TableRow>
                  ))}
                  {hospitals.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">No hospitals yet. Add one below.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
            <Card className="rounded-2xl border-slate-200/80 shadow-xs"><CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Add hospital</h2>
              <form className="grid sm:grid-cols-3 gap-4" onSubmit={async (e) => { e.preventDefault(); if (await run(() => api('/api/admin/hospitals', { method: 'POST', json: h }), 'Hospital added.')) setH({}); }}>
                {([['name', 'Hospital name *'], ['city', 'City *'], ['state', 'State *'], ['pinCode', 'Pin code *'], ['contactNo', 'Contact number *'], ['emailId', 'Email *'], ['hospitalIdCode', 'Hosp Id'], ['rohiniId', 'Rohini ID'], ['landmark', 'Landmark'], ['faxNo', 'Fax no'], ['tpaDeskNo', 'TPA desk no']] as const).map(([k, l]) => (
                  <div key={k} className="space-y-1.5"><Label htmlFor={`h-${k}`}>{l}</Label><Input id={`h-${k}`} {...bind(h, setH, k)} /></div>
                ))}
                <div className="sm:col-span-3"><Button type="submit" disabled={busy}>Add hospital</Button></div>
              </form>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <Table>
                <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead>Case</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-slate-500">{fmtDate(l.timestamp)}</TableCell>
                      <TableCell>{l.userName ?? 'System'}<div className="text-xs text-slate-500">{String(l.userRole ?? '').toLowerCase().replace(/_/g, ' ')}</div></TableCell>
                      <TableCell className="font-semibold">{l.action.replace(/_/g, ' ').toLowerCase()}</TableCell>
                      <TableCell className="font-mono">{l.requestId ?? ''}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">No activity yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!resetFor} onOpenChange={(o) => !o && setResetFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>{resetFor?.email}. Enter a new password of at least 12 characters.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await run(() => api('/api/admin/users', { method: 'PATCH', json: { id: resetFor.id, password: newPassword } }), 'Password reset.')) setResetFor(null);
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="np">New password</Label>
                <Input id="np" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setResetFor(null)}>Cancel</Button>
                <Button type="submit" disabled={busy || newPassword.length < 12}>Reset password</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PortalShell>
  );
}
