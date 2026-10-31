'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/Header';
import { PrimaryKpiCards } from '@/components/PrimaryKpiCards';
import { PrinterPayoffCard } from '@/components/PrinterPayoffCard';
import { ActivityTrendWidget } from '@/components/ActivityTrendWidget';
import { ProfitSimulatorWidget } from '@/components/ProfitSimulatorWidget';
import { CustomerAnalyticsWidget } from '@/components/CustomerAnalyticsWidget';
import { StandardPricingCard } from '@/components/StandardPricingCard';
import { TonerTracker } from '@/components/TonerTracker';
import { OrderList } from '@/components/OrderList';
import { MovableWidgetWrapper } from '@/components/MovableWidgetWrapper';
import { DashboardCustomizerModal } from '@/components/DashboardCustomizerModal';
import { QuickAddOrderModal } from '@/components/QuickAddOrderModal';
import { SettingsModal } from '@/components/SettingsModal';
import { BackupModal } from '@/components/BackupModal';
import { DashboardWidgetConfig } from '@/types';
import { Plus, LayoutGrid, RotateCcw } from 'lucide-react';

const WIDGET_STORAGE_KEY = 'brorup_dashboard_widgets_v3';

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'kpis',
    title: 'Nøgletal (Omsat, Profit, Prints & Udestående)',
    description: 'Overblik over samlet økonomi og udestående betalinger',
    enabled: true,
  },
  {
    id: 'activity_trend',
    title: 'Aktivitet & Økonomisk Udvikling',
    description: 'Interaktiv tidslinje over omsætning, profit og printforbrug',
    enabled: true,
  },
  {
    id: 'pricing_calculator',
    title: 'Standardpriser & Hurtig-beregner',
    description: 'Mængdestaffel og interaktiv prisberegner',
    enabled: true,
  },
  {
    id: 'toner_tracker',
    title: 'Toner-Tracker & Patronforbrug',
    description: 'Patronstatus og registrering af prints',
    enabled: true,
  },
  {
    id: 'profit_simulator',
    title: 'Print- & Fortjeneste-Simulator',
    description: 'Test ordrestørrelser, beregn dækningsbidrag og afdrag',
    enabled: true,
  },
  {
    id: 'customer_stats',
    title: 'Kunde-Topliste & Hurtig-Genbestilling',
    description: 'Kundeoversigt med 1-klik ordreoprettelse og udestående',
    enabled: true,
  },
  {
    id: 'printer_payoff',
    title: 'Printer-Afbetaling (1.000 kr.)',
    description: 'Måler for afdrag på printerinvesteringen mod 0 kr.',
    enabled: true,
  },
  {
    id: 'orders_table',
    title: 'Ordre-oversigt & Administration',
    description: 'Komplet ordreliste med 1-klik betalingsstatus og redigering',
    enabled: true,
  },
];

export default function DashboardPage() {
  const { isLoaded } = usePrintStore();
  const { showToast } = useToast();

  // Widget layout state - initialized lazily from localStorage
  const [widgetConfigs, setWidgetConfigs] = useState<DashboardWidgetConfig[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGETS;
    try {
      const saved = localStorage.getItem(WIDGET_STORAGE_KEY);
      if (saved) {
        const parsed: DashboardWidgetConfig[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((w) => w.id));
        return [
          ...parsed,
          ...DEFAULT_WIDGETS.filter((w) => !existingIds.has(w.id)),
        ];
      }
    } catch {
      // Fallback
    }
    return DEFAULT_WIDGETS;
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modals state
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [filterUnpaidOnly, setFilterUnpaidOnly] = useState(false);

  // Prefill states for QuickAddOrderModal
  const [prefillQty, setPrefillQty] = useState<number | undefined>(undefined);
  const [prefillContact, setPrefillContact] = useState<boolean | undefined>(undefined);
  const [prefillCustomer, setPrefillCustomer] = useState<string | undefined>(undefined);
  const [prefillUnitPrice, setPrefillUnitPrice] = useState<number | undefined>(undefined);

  const saveWidgetsToStorage = (updated: DashboardWidgetConfig[]) => {
    setWidgetConfigs(updated);
    try {
      localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore write errors
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...widgetConfigs];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    saveWidgetsToStorage(copy);
  };

  const handleMoveDown = (index: number) => {
    if (index >= widgetConfigs.length - 1) return;
    const copy = [...widgetConfigs];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    saveWidgetsToStorage(copy);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {
      // Fallback
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const copy = [...widgetConfigs];
    const [moved] = copy.splice(draggedIndex, 1);
    copy.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);
    saveWidgetsToStorage(copy);
    showToast('Layout opdateret og gemt');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetWidgets = () => {
    saveWidgetsToStorage(DEFAULT_WIDGETS);
    showToast('Dashboard nulstillet til standard layout');
  };

  const clearPrefills = () => {
    setPrefillQty(undefined);
    setPrefillContact(undefined);
    setPrefillCustomer(undefined);
    setPrefillUnitPrice(undefined);
  };

  // Callback from StandardPricingCard
  const handleOpenQuickAddWithTier = (quantity: number, isContactGroup: boolean) => {
    clearPrefills();
    setPrefillQty(quantity);
    setPrefillContact(isContactGroup);
    setIsQuickAddOpen(true);
  };

  // Callback from CustomerAnalyticsWidget
  const handleQuickAddForCustomer = (customerName: string, isContactGroup: boolean) => {
    clearPrefills();
    setPrefillCustomer(customerName);
    setPrefillContact(isContactGroup);
    setIsQuickAddOpen(true);
  };

  // Callback from ProfitSimulatorWidget
  const handleApplySimulation = (quantity: number, unitPrice: number, isContactGroup: boolean) => {
    clearPrefills();
    setPrefillQty(quantity);
    setPrefillUnitPrice(unitPrice);
    setPrefillContact(isContactGroup);
    setIsQuickAddOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            Indlæser Billede Print Studio...
          </p>
        </div>
      </div>
    );
  }

  // Filter only active widgets
  const visibleWidgets = widgetConfigs.filter((w) => w.enabled);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Sticky Navigation */}
      <Header
        onOpenQuickAdd={() => {
          clearPrefills();
          setIsQuickAddOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        {/* Helper sub-bar for layout organization */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Modulært Dashboard:</span>
            <span>Træk i sektionerne eller brug pilene for at flytte rundt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tilpas / Gem layout</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={handleResetWidgets}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Gendan standard rækkefølge"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Nulstil</span>
            </button>
          </div>
        </div>

        {/* Dynamic Reorderable Widgets */}
        {visibleWidgets.map((widget, index) => {
          let content: React.ReactNode = null;

          switch (widget.id) {
            case 'kpis':
              content = (
                <PrimaryKpiCards
                  filterUnpaidOnly={filterUnpaidOnly}
                  onToggleFilterUnpaid={() => setFilterUnpaidOnly((prev) => !prev)}
                />
              );
              break;

            case 'printer_payoff':
              content = <PrinterPayoffCard />;
              break;

            case 'activity_trend':
              content = <ActivityTrendWidget />;
              break;

            case 'pricing_calculator':
              content = (
                <StandardPricingCard onSelectTier={handleOpenQuickAddWithTier} />
              );
              break;

            case 'toner_tracker':
              content = <TonerTracker />;
              break;

            case 'profit_simulator':
              content = (
                <ProfitSimulatorWidget onApplySimulation={handleApplySimulation} />
              );
              break;

            case 'customer_stats':
              content = (
                <CustomerAnalyticsWidget
                  onQuickAddForCustomer={handleQuickAddForCustomer}
                />
              );
              break;

            case 'orders_table':
              content = (
                <OrderList
                  filterUnpaidOnly={filterUnpaidOnly}
                  onToggleFilterUnpaid={() => setFilterUnpaidOnly((prev) => !prev)}
                  onOpenQuickAdd={() => {
                    clearPrefills();
                    setIsQuickAddOpen(true);
                  }}
                />
              );
              break;

            default:
              content = null;
          }

          if (!content) return null;

          return (
            <MovableWidgetWrapper
              key={widget.id}
              id={widget.id}
              index={index}
              totalWidgets={visibleWidgets.length}
              title={widget.title}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
              isDragOver={dragOverIndex === index}
            >
              {content}
            </MovableWidgetWrapper>
          );
        })}
      </main>

      {/* Modals */}
      <DashboardCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={widgetConfigs}
        onSaveWidgets={saveWidgetsToStorage}
        onResetToDefaults={handleResetWidgets}
      />

      <QuickAddOrderModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          clearPrefills();
          setIsQuickAddOpen(false);
        }}
        initialQuantity={prefillQty}
        initialIsContactGroup={prefillContact}
        initialCustomerName={prefillCustomer}
        initialUnitPrice={prefillUnitPrice}
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
      <div className="sm:hidden fixed bottom-6 right-5 z-40">
        <button
          onClick={() => {
            clearPrefills();
            setIsQuickAddOpen(true);
          }}
          type="button"
          className="w-13 h-13 rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/25 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all"
          aria-label="Opret ny ordre"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white/80 py-6 mt-12 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Billede Print Studio
            </span>
            <span className="text-slate-300">•</span>
            <span>Nordisk Præcision & Modulært Layout</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer font-medium"
            >
              Tilpas firkanter
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Juster formler & priser
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setIsBackupOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Eksportér regneark (CSV)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}