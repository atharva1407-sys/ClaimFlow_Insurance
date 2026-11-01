import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppFooter } from '@/components/layout/AppFooter';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ClaimFlow Health | Cashless Insurance Request Management',
  description: 'Digital cashless hospitalisation request management with exact coordinate PDF overlay',
  icons: {
    icon: [{ url: '/images/favicon-64.png', sizes: '64x64', type: 'image/png' }, { url: '/images/logo.png', sizes: '512x512', type: 'image/png' }],
    apple: '/images/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
        <main className="flex-1 flex flex-col">{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
