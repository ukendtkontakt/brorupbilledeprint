import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PrintStoreProvider } from '@/context/PrintStoreContext';
import { ToastProvider } from '@/context/ToastContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Billede Print Dashboard | Regnskab & Toner-styring',
  description: 'Komplet administrations- og økonomisystem til fotoprint-forretning med live KPI-beregninger, afbetalingstracker og tonerforbrug.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white">
        <PrintStoreProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </PrintStoreProvider>
      </body>
    </html>
  );
}
