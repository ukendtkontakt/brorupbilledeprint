'use client';

import React from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { formatCurrency, formatNumber } from '@/utils/calculations';
import {
  TrendingUp,
  AlertCircle,
  Layers,
  CircleDollarSign,
  Printer,
  Sparkles,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface KpiCardsProps {
  filterUnpaidOnly: boolean;
  onToggleFilterUnpaid: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  filterUnpaidOnly,
  onToggleFilterUnpaid,
}) => {
  const { kpis, settings } = usePrintStore();

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const isPrinterFullyPaid = kpis.printerRemainingCost <= 0;

  return (
    <section className="space-y-4">
      {/* 5-Card Grid: Responsive layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Omsat */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-all hover:border-blue-300 dark:hover:border-blue-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Omsat
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Modtaget: {formatCurrency(kpis.paidRevenue)}
              </span>
              <span>
                Mangler: {formatCurrency(kpis.outstandingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Profit minus slid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-all hover:border-emerald-300 dark:hover:border-emerald-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Profit minus slid
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(kpis.profitMinusWear)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              Fratrukket slid: {formatCurrency(kpis.totalWearCost)} ({formatNumber(kpis.costPerPrint, 2)} kr./print)
            </div>
          </div>
        </div>

        {/* 3. Printet i alt */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Printet i alt
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {kpis.totalPrints} <span className="text-sm font-medium text-slate-500">stk</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Gns. omsætning: {kpis.totalPrints > 0 ? formatCurrency(kpis.totalRevenue / kpis.totalPrints) : '0 kr.'} / stk
            </div>
          </div>
        </div>

        {/* 4. Udestående (Skyldnere) - med hurtig filter action */}
        <div
          onClick={onToggleFilterUnpaid}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onToggleFilterUnpaid();
          }}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 border shadow-xs relative overflow-hidden transition-all select-none ${
            filterUnpaidOnly
              ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30'
              : kpis.outstandingAmount > 0
              ? 'bg-white dark:bg-slate-900 border-rose-300/80 dark:border-rose-900/60 hover:border-rose-400'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Udestående (Skyldnere)
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                kpis.outstandingAmount > 0
                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
              kpis.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {formatCurrency(kpis.outstandingAmount)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-rose-700 dark:text-rose-300 font-medium">
                {kpis.unpaidOrdersCount} ordre{kpis.unpaidOrdersCount === 1 ? '' : 'r'} mangler betaling
              </span>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 underline decoration-rose-300 flex items-center gap-0.5">
                <Filter className="w-3 h-3" />
                {filterUnpaidOnly ? 'Vis alle' : 'Filtrer'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Printer-afbetalingskort med progress-bar mod 0 kr. */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-700/80 shadow-md relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Printer className="w-3 h-3" />
                <span>Printer Investering</span>
              </span>
              {isPrinterFullyPaid ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 flex items-center gap-1 animate-bounce">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>100% Betalt af!</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Købspris: {formatCurrency(settings.printerCost)}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-baseline gap-2">
              <span>Mangler at blive betalt af:</span>
              <span className="text-amber-300 font-extrabold text-2xl sm:text-3xl tabular-nums">
                {formatCurrency(kpis.printerRemainingCost)}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Afbetales via din reelle profit (<span className="text-emerald-400 font-semibold">{formatCurrency(kpis.profitMinusWear)}</span> tjent hjem hidtil efter fradrag af papir/toner-slid).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-2 shrink-0">
            <div className="text-left md:text-right">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Afdragsstatus
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                {formatNumber(kpis.printerPayoffPercentage, 1)}%
              </div>
            </div>

            <button
              onClick={handleCelebrate}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              title="Test afbetalings-jubel"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Fejr fremskridt</span>
            </button>
          </div>

        </div>

        {/* Visual Progress Bar */}
        <div className="mt-5 relative">
          <div className="flex justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span className="text-emerald-400">
              Start: 0 kr. ({formatCurrency(kpis.profitMinusWear)} afdraget)
            </span>
            <span className="text-slate-300">
              Mål: 0 kr. udestående ({formatCurrency(settings.printerCost)})
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-700/70 rounded-full overflow-hidden p-0.5 border border-slate-600/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${Math.min(100, Math.max(3, kpis.printerPayoffPercentage))}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Formel: Printer startpris - (Omsat - Printet i alt * Pris pr. print)</span>
            <span className="text-amber-200/90 font-mono">
              {formatNumber(settings.printerCost, 0)} - {formatNumber(kpis.profitMinusWear, 2)} = {formatNumber(kpis.printerRemainingCost, 2)} kr.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
