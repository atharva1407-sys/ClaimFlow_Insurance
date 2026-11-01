import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-bold text-primary">404</p>
      <h1 className="text-2xl font-extrabold text-slate-900">Page not found</h1>
      <p className="max-w-md text-sm text-slate-600">This address does not exist, or you do not have access to it.</p>
      <Button asChild><Link href="/">Go to the start</Link></Button>
    </div>
  );
}
