'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { Header } from '@/components/Header';
import { KpiCards } from '@/components/KpiCards';
import { StandardPricingCard } from '@/components/StandardPricingCard';
import { TonerTracker } from '@/components/TonerTracker';
import { OrderList } from '@/components/OrderList';
import { QuickAddOrderModal } from '@/components/QuickAddOrderModal';
import { SettingsModal } from '@/components/SettingsModal';
import { BackupModal } from '@/components/BackupModal';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const { isLoaded } = usePrintStore();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [filterUnpaidOnly, setFilterUnpaidOnly] = useState(false);

  // Quick prefill from standard pricing card
  const [prefillQty, setPrefillQty] = useState<number | undefined>(undefined);
  const [prefillContact, setPrefillContact] = useState<boolean | undefined>(undefined);

  const handleOpenQuickAddWithTier = (quantity: number, isContactGroup: boolean) => {
    setPrefillQty(quantity);
    setPrefillContact(isContactGroup);
    setIsQuickAddOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Indlæser dashboard og data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      
      {/* Top Sticky Navigation */}
      <Header
        onOpenQuickAdd={() => {
          setPrefillQty(undefined);
          setPrefillContact(undefined);
          setIsQuickAddOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Section 1: KPI Cards & Printer Payoff Tracker */}
        <KpiCards
          filterUnpaidOnly={filterUnpaidOnly}
          onToggleFilterUnpaid={() => setFilterUnpaidOnly((prev) => !prev)}
        />

        {/* Section 2: Grid with Standard Pricing & Toner Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Standard Pricing Tier reference & calculator (5 cols) */}
          <div className="lg:col-span-5">
            <StandardPricingCard onSelectTier={handleOpenQuickAddWithTier} />
          </div>

          {/* Right Column: Toner Tracker Module (7 cols) */}
          <div className="lg:col-span-7">
            <TonerTracker />
          </div>

        </div>

        {/* Section 3: Orders List & 1-Click Payment Management */}
        <OrderList
          filterUnpaidOnly={filterUnpaidOnly}
          onToggleFilterUnpaid={() => setFilterUnpaidOnly((prev) => !prev)}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        />

      </main>

      {/* Modals */}
      <QuickAddOrderModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialQuantity={prefillQty}
        initialIsContactGroup={prefillContact}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      {/* Floating Action Button for Mobile quick access */}
      <div className="sm:hidden fixed bottom-5 right-5 z-40">
        <button
          onClick={() => {
            setPrefillQty(undefined);
            setPrefillContact(undefined);
            setIsQuickAddOpen(true);
          }}
          type="button"
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
          aria-label="Opret ny ordre"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Billede Print Dashboard
            </span>
            <span>•</span>
            <span>Klar til Vercel & GitHub deployment</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              Juster formler & priser
            </button>
            <span>•</span>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="hover:text-blue-600 transition-colors"
            >
              Eksportér regneark (CSV)
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
