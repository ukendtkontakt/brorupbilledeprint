import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Newsreader } from 'next/font/google';
import './globals.css';
import { PrintStoreProvider } from '@/context/PrintStoreContext';
import { ToastProvider } from '@/context/ToastContext';

const sans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const serif = Newsreader({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
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
    <html lang="da" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white font-sans">
        <PrintStoreProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </PrintStoreProvider>
      </body>
    </html>
  );
}
