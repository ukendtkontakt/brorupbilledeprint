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
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface KpiCardsProps {
  filterUnpaidOnly: boolean;
  onToggleFilterUnpaid: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  filterUnpaidOnly,
  onToggleFilterUnpaid,
}) => {
  const { kpis, settings } = usePrintStore();

  const isPrinterFullyPaid = kpis.printerRemainingCost <= 0;

  return (
    <section className="space-y-4">
      {/* 4-Card Primary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Omsat */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs relative flex flex-col justify-between transition-all hover:border-stone-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Omsat i alt
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 pt-2">
              <span className="text-emerald-700 font-medium">
                Modtaget: {formatCurrency(kpis.paidRevenue)}
              </span>
              <span>
                Mangler: {formatCurrency(kpis.outstandingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Profit minus slid */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs relative flex flex-col justify-between transition-all hover:border-stone-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Profit minus slid
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-850 text-emerald-800 tabular-nums">
              {formatCurrency(kpis.profitMinusWear)}
            </div>
            <div className="mt-2 text-xs text-stone-500 border-t border-stone-100 pt-2 truncate">
              Slid: {formatCurrency(kpis.totalWearCost)} ({formatNumber(kpis.costPerPrint, 2)} kr./print)
            </div>
          </div>
        </div>

        {/* 3. Printet i alt */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs relative flex flex-col justify-between transition-all hover:border-stone-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Printet i alt
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">
              {kpis.totalPrints} <span className="text-sm font-normal text-stone-500">stk</span>
            </div>
            <div className="mt-2 text-xs text-stone-500 border-t border-stone-100 pt-2">
              Gns. {kpis.totalPrints > 0 ? formatCurrency(kpis.totalRevenue / kpis.totalPrints) : '0 kr.'} pr. print
            </div>
          </div>
        </div>

        {/* 4. Udestående (Skyldnere) - med rolig filterfunktion */}
        <div
          onClick={onToggleFilterUnpaid}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onToggleFilterUnpaid();
          }}
          className={`cursor-pointer rounded-2xl p-5 border shadow-2xs relative flex flex-col justify-between transition-all select-none ${
            filterUnpaidOnly
              ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-300/40'
              : kpis.outstandingAmount > 0
              ? 'bg-amber-50/50 border-amber-200/90 hover:border-amber-300'
              : 'bg-white border-stone-200/80 hover:border-stone-300'
          }`}
          title="Klik for at filtrere ordrer med udestående betaling"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Udestående
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                kpis.outstandingAmount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${
              kpis.outstandingAmount > 0 ? 'text-amber-900' : 'text-stone-900'
            }`}>
              {formatCurrency(kpis.outstandingAmount)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs border-t border-stone-100 pt-2">
              <span className={kpis.outstandingAmount > 0 ? 'text-amber-800 font-medium' : 'text-stone-500'}>
                {kpis.unpaidOrdersCount} ordre{kpis.unpaidOrdersCount === 1 ? '' : 'r'} mangler
              </span>
              <span className="text-[11px] font-medium text-stone-600 underline decoration-stone-300 flex items-center gap-1">
                <Filter className="w-3 h-3 text-stone-400" />
                {filterUnpaidOnly ? 'Nulstil' : 'Filtrer'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Printer-afbetalingskort: Værksted Ledger stil (roligt og smukt) */}
      <div className="bg-[#1F2724] text-stone-100 rounded-2xl p-6 sm:p-7 border border-stone-800 shadow-sm relative overflow-hidden">
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800/80 text-stone-300 border border-stone-700/80 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-stone-400" />
                <span>Printer Investering</span>
              </span>
              {isPrinterFullyPaid ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-700/70 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Tjent hjem!</span>
                </span>
              ) : (
                <span className="text-xs text-stone-400">
                  Startpris: {formatCurrency(settings.printerCost)}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-100 flex items-baseline gap-2.5">
              <span className="text-stone-300 font-normal text-lg sm:text-xl">Mangler at blive betalt af:</span>
              <span className="text-amber-200/95 font-bold text-2xl sm:text-3xl tabular-nums">
                {formatCurrency(kpis.printerRemainingCost)}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              Afdrages automatisk via reel profit (<span className="text-stone-200 font-medium">{formatCurrency(kpis.profitMinusWear)}</span> tjent ind efter fradrag for slid på papir og toner).
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center shrink-0">
            <div className="text-xs uppercase tracking-wider text-stone-400 font-medium">
              Afbetalt
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums mt-0.5">
              {formatNumber(kpis.printerPayoffPercentage, 1)}%
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {formatCurrency(kpis.profitMinusWear)} af {formatCurrency(settings.printerCost)}
            </div>
          </div>

        </div>

        {/* Visual Progress Bar */}
        <div className="mt-6 pt-4 border-t border-stone-800/80">
          <div className="flex justify-between text-xs text-stone-400 mb-2">
            <span>0 kr.</span>
            <span className="text-stone-300 font-medium">Mål: 0 kr. tilbage ({formatCurrency(settings.printerCost)})</span>
          </div>

          <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(2, kpis.printerPayoffPercentage))}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-400">
            <span>Formel: Printerpris - (Omsat - Print * Slidpris)</span>
            <span className="text-stone-300 font-mono text-[11px]">
              {formatNumber(settings.printerCost, 0)} - {formatNumber(kpis.profitMinusWear, 2)} = {formatNumber(kpis.printerRemainingCost, 2)} kr.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
