'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, PlusCircle, Search, ArrowLeft, User, AlertTriangle, Menu, X, LogOut, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROLE_LABEL, useDocumentTitle, useSession } from '@/lib/client';

interface PortalShellProps {
  role: 'HOSPITAL' | 'DOCTOR' | 'PATIENT' | 'EMERGENCY' | 'ADMIN';
  activeNav: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  backLink?: { href: string; label: string };
  topActions?: React.ReactNode;
  /** Patient portal only: the request the verified patient is allowed to open. */
  patientRequestId?: string;
  /** Browser tab title, e.g. "Case CR-2026-00001". */
  title?: string;
  children: React.ReactNode;
}

const PORTAL_PILL: Record<PortalShellProps['role'], string> = {
  HOSPITAL: 'Hospital Desk',
  DOCTOR: 'Doctor Portal',
  PATIENT: 'Patient Portal',
  EMERGENCY: 'Emergency Fast-Track',
  ADMIN: 'Administration',
};

export function PortalShell({ role, activeNav, searchPlaceholder = 'Search by patient name or request ID...', onSearch, backLink, topActions, patientRequestId, title, children }: PortalShellProps) {
  useDocumentTitle(title ?? PORTAL_PILL[role]);
  const { user, hospital, loading, logout } = useSession({ patient: role === 'PATIENT' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const navItems = (() => {
    switch (role) {
      case 'DOCTOR':
        return [{ id: 'worklist', label: 'Worklist', href: '/doctor/dashboard', icon: LayoutDashboard }];
      case 'PATIENT':
        return patientRequestId ? [{ id: 'my-details', label: 'My Details', href: `/patient/${patientRequestId}`, icon: User }] : [];
      case 'ADMIN':
        return [{ id: 'admin', label: 'Administration', href: '/admin', icon: LayoutDashboard }];
      case 'EMERGENCY':
        return [
          { id: 'emergency', label: 'Emergency', href: '/emergency', icon: AlertTriangle, isEmergency: true },
          { id: 'dashboard', label: 'Cases', href: '/hospital/dashboard', icon: LayoutDashboard },
        ];
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', href: '/hospital/dashboard', icon: LayoutDashboard },
          { id: 'new-request', label: 'New Request', href: '/hospital/requests/new', icon: PlusCircle },
        ];
    }
  })();

  const initials = (user?.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  const roleText = user ? ROLE_LABEL[user.role] ?? user.role : '';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500">Loading…</div>;
  }
  if (!user) return null; // redirecting to sign-in

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-800 font-sans">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg">Skip to main content</a>
      <aside className="hidden lg:flex w-64 flex-col justify-between bg-white border-r border-slate-200/80 p-5 shrink-0 sticky top-0 h-screen z-30">
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-6 group">
            <img src="/images/logo.png" alt="ClaimFlow Health Logo" className="w-9 h-9 rounded-xl object-contain shrink-0 shadow-xs group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              ClaimFlow <span className="text-[#0A65FF]">Health</span>
            </span>
          </Link>

          <div className="mb-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-600">{PORTAL_PILL[role]}</div>
          {hospital && <div className="mb-6 px-3 text-xs text-slate-500 truncate">{hospital.name}</div>}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              const isEmergency = (item as any).isEmergency;
              const styles = isActive
                ? isEmergency ? 'bg-rose-50 text-rose-600 font-semibold' : 'bg-blue-50/80 text-[#0A65FF] font-semibold'
                : isEmergency ? 'text-rose-600 hover:bg-rose-50/50' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
              return (
                <Link key={item.id} href={item.href} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${styles}`}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">{initials}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 truncate">{user.name}</div>
              {user.name.trim().toLowerCase() !== roleText.toLowerCase() && <div className="text-xs text-slate-500 truncate">{roleText}</div>}
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full justify-start"><LogOut /> Sign out</Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" alt="ClaimFlow Health Logo" className="w-6 h-6 rounded-md object-contain shrink-0" />
              <span className="text-base font-extrabold text-slate-900">ClaimFlow <span className="text-[#0A65FF]">Health</span></span>
            </div>
          </div>

          <div className="flex-1 max-w-lg hidden sm:block">
            {backLink ? (
              <Link href={backLink.href} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{backLink.label}</span>
              </Link>
            ) : onSearch ? (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="search"
                  aria-label={searchPlaceholder}
                  value={searchVal}
                  onChange={(e) => { setSearchVal(e.target.value); onSearch(e.target.value); }}
                  placeholder={searchPlaceholder}
                  className="pl-9 bg-slate-50"
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {topActions}
            <div className="hidden md:block text-left pl-2 border-l border-slate-200">
              <div className="text-sm font-bold text-slate-800 leading-tight">{user.name}</div>
              {user.name.trim().toLowerCase() !== roleText.toLowerCase() && <div className="text-xs text-slate-500">{roleText}</div>}
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.id} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${activeNav === item.id ? 'bg-blue-50 text-[#0A65FF] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Button variant="ghost" onClick={logout} className="w-full justify-start"><LogOut /> Sign out</Button>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="flex-1 p-6 max-w-7xl w-full mx-auto focus:outline-none">{children}</main>
      </div>
    </div>
  );
}
