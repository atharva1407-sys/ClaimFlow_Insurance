'use client';

import { usePathname } from 'next/navigation';

export function AppFooter() {
  const pathname = usePathname();

  // Hide the footer on the home landing page to preserve the clean split-screen UI
  if (pathname === '/') {
    return null;
  }

  return (
    <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-sm text-slate-500">
      <span>
        ClaimFlow Health &bull; Cashless hospitalisation request system
      </span>
    </footer>
  );
}
