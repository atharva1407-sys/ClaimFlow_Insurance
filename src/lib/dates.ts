// Date helpers. The form stores dates as digit strings: DDMMYYYY (most dates),
// DDMMYY (admission date, 6 cells) and MMYY (chronic "since"). Times are HHMM.

const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '');

/** Accepts yyyy-mm-dd, dd/mm/yyyy or raw digits; returns DDMMYYYY or '' if not a full date. */
export function toDdmmyyyy(v: unknown): string {
  const s = String(v ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(8, 10) + s.slice(5, 7) + s.slice(0, 4);
  const d = digits(s);
  if (d.length === 8) return d;
  if (d.length === 6) return d.slice(0, 4) + '20' + d.slice(4); // DDMMYY -> assume 20YY
  return '';
}

/** DDMMYYYY (or DDMMYY) -> DDMMYY, the 6-cell admission date. */
export function toDdmmyy(v: unknown): string {
  const d = digits(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? '').trim())) {
    const s = String(v).trim();
    return s.slice(8, 10) + s.slice(5, 7) + s.slice(2, 4);
  }
  if (d.length === 8) return d.slice(0, 4) + d.slice(6);
  if (d.length === 6) return d;
  return '';
}

export function ddmmyyyyToIso(v: unknown): string {
  const d = toDdmmyyyy(v);
  return d ? `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}` : '';
}

export function ddmmyyToIso(v: unknown): string {
  const d = digits(v);
  if (d.length === 6) return `20${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
  return ddmmyyyyToIso(v);
}

/** HH:MM or HHMM -> HHMM */
export function toHhmm(v: unknown): string {
  const d = digits(v);
  return d.length === 4 ? d : '';
}

export function hhmmToInput(v: unknown): string {
  const d = digits(v);
  return d.length === 4 ? `${d.slice(0, 2)}:${d.slice(2)}` : '';
}

/** Real calendar date from DDMMYYYY, or null. */
export function parseDdmmyyyy(v: unknown): Date | null {
  const d = toDdmmyyyy(v);
  if (!d) return null;
  const day = +d.slice(0, 2), mon = +d.slice(2, 4), yr = +d.slice(4);
  const dt = new Date(Date.UTC(yr, mon - 1, day));
  return dt.getUTCFullYear() === yr && dt.getUTCMonth() === mon - 1 && dt.getUTCDate() === day ? dt : null;
}

/** Indian mobile number: keeps the last 10 digits when a +91/0 prefix is present. */
export function toMobile10(v: unknown): string {
  let d = digits(v);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}

export function todayDdmmyyyy(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return p(now.getDate()) + p(now.getMonth() + 1) + now.getFullYear();
}

export function nowHhmm(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return p(now.getHours()) + p(now.getMinutes());
}
