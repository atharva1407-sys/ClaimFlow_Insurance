'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/** JSON fetch that throws ApiError with the server's message on any non-2xx answer. */
export async function api<T = any>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: 'same-origin',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body?.error || `Request failed (${res.status})`, res.status, body);
  return body as T;
}

export interface SessionInfo {
  id: string;
  name: string;
  role: 'ADMIN' | 'HOSPITAL_STAFF' | 'DOCTOR' | 'EMERGENCY_OPERATOR' | 'PATIENT';
  email?: string;
  hospitalId?: string | null;
  qualification?: string | null;
  registrationNo?: string | null;
  specialization?: string | null;
  requestId?: string;
}

export const ROLE_HOME: Record<string, string> = {
  HOSPITAL_STAFF: '/hospital/dashboard',
  DOCTOR: '/doctor/dashboard',
  EMERGENCY_OPERATOR: '/emergency',
  ADMIN: '/admin',
};

export const ROLE_LABEL: Record<string, string> = {
  HOSPITAL_STAFF: 'Hospital desk',
  DOCTOR: 'Treating doctor',
  EMERGENCY_OPERATOR: 'Emergency operator',
  PATIENT: 'Patient',
  ADMIN: 'Administrator',
};

/** Current signed-in user. Redirects to the right sign-in page when there is no session. */
export function useSession(opts: { patient?: boolean } = {}) {
  const router = useRouter();
  const path = usePathname();
  const [user, setUser] = useState<SessionInfo | null>(null);
  const [hospital, setHospital] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api<{ user: SessionInfo; hospital: any }>(opts.patient ? '/api/auth/me?as=patient' : '/api/auth/me')
      .then((d) => {
        if (!alive) return;
        setUser(d.user);
        setHospital(d.hospital);
      })
      .catch(() => {
        if (!alive) return;
        router.replace(opts.patient ? '/patient/access' : `/login?next=${encodeURIComponent(path || '/')}`);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    await api('/api/auth/me', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  }, [router]);

  return { user, hospital, loading, logout };
}

/** Loads one request and exposes save helpers. */
export function useRequest(id: string) {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const d = await api<{ request: any }>(`/api/requests/${encodeURIComponent(id)}`);
      setRequest(d.request);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const act = useCallback(
    async (body: Record<string, unknown>) => {
      const d = await api<any>(`/api/requests/${encodeURIComponent(id)}`, { method: 'PATCH', json: body });
      await reload();
      return d;
    },
    [id, reload]
  );

  return { request, loading, error, reload, act };
}

export const fmtDate = (v?: string | Date | null) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

/** Sets the browser tab title for a client page, e.g. useDocumentTitle('Case CR-2026-00001'). */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (title) document.title = `${title} | ClaimFlow Health`;
  }, [title]);
}
