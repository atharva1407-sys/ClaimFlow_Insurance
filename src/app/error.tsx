'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Shown instead of a blank page when something unexpected breaks while a page is open.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-extrabold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-600">The page could not be shown. Your saved data is safe. Try again, or go back to the start.</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline"><Link href="/">Go to the start</Link></Button>
      </div>
    </div>
  );
}
