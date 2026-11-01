'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppHeader() {
  const pathname = usePathname();

  // Hide the global debug/role-switcher header on the home landing page
  if (pathname === '/') {
    return null;
  }

  return (
    <header className="bg-slate-900 text-white text-sm px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-sm z-50">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-bold text-sky-400 hover:text-sky-300 flex items-center gap-2">
          <img src="/images/logo.png" alt="ClaimFlow Health Logo" className="w-5 h-5 rounded object-contain" />
          <span>ClaimFlow Health</span>
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300 font-medium hidden sm:inline">Role Switcher:</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <a
          href="/api/auth/switch-role?role=HOSPITAL_STAFF&redirect=/hospital/dashboard"
          className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 rounded text-white font-medium transition"
        >
          🏥 Hospital Desk
        </a>
        <a
          href="/api/auth/switch-role?role=HOSPITAL_STAFF&redirect=/hospital/requests/new"
          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-white font-medium transition"
        >
          + New Request
        </a>
        <a
          href="/api/auth/switch-role?role=DOCTOR&redirect=/doctor/dashboard"
          className="px-2.5 py-1 bg-teal-700 hover:bg-teal-600 rounded text-white font-medium transition"
        >
          🩺 Doctor Portal
        </a>
        <Link
          href="/patient/access?id=CR-2026-00123"
          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded text-white font-medium transition"
        >
          📱 Patient Access
        </Link>
        <a
          href="/api/auth/switch-role?role=EMERGENCY_OPERATOR&redirect=/emergency"
          className="px-2.5 py-1 bg-red-700 hover:bg-red-600 rounded text-white font-bold transition animate-pulse"
        >
          🚨 Emergency Mode
        </a>
        <a
          href="/api/auth/switch-role?role=HOSPITAL_STAFF&redirect=/hospital/requests/CR-2026-00123"
          className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-600 rounded text-white font-medium transition"
        >
          📋 Review CR-2026-00123
        </a>
      </div>
    </header>
  );
}
