'use client';

import React from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { formatCurrency, formatNumber } from '@/utils/calculations';
import { Printer, CheckCircle2, Target } from 'lucide-react';

export const PrinterPayoffCard: React.FC = () => {
  const { kpis, settings } = usePrintStore();

  const isPrinterFullyPaid = kpis.printerRemainingCost <= 0;

  // Calculate approximate prints left until fully paid at average profit per print
  const avgProfitPerPrint = kpis.totalPrints > 0 ? kpis.profitMinusWear / kpis.totalPrints : 3.25;
  const printsNeeded = !isPrinterFullyPaid && avgProfitPerPrint > 0
    ? Math.ceil(kpis.printerRemainingCost / avgProfitPerPrint)
    : 0;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md relative overflow-hidden">
      
      {/* Background subtle radial illumination */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span>Printer Investering</span>
            </span>
            {isPrinterFullyPaid ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Betalt af!</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">
                Købspris: {formatCurrency(settings.printerCost)}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-baseline gap-2.5">
            <span className="text-slate-300 font-normal text-lg sm:text-xl">Mangler at blive betalt af:</span>
            <span className="text-amber-300 font-extrabold text-2xl sm:text-3xl tabular-nums">
              {formatCurrency(kpis.printerRemainingCost)}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Afdrages automatisk via din reelle profit (<span className="text-emerald-400 font-semibold">{formatCurrency(kpis.profitMinusWear)}</span> tjent ind efter fradrag for papir/toner-slid).
          </p>

          {!isPrinterFullyPaid && printsNeeded > 0 && (
            <div className="inline-flex items-center gap-2 text-xs text-indigo-200 bg-indigo-950/60 border border-indigo-800/80 px-3 py-1.5 rounded-xl mt-1">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ved dit nuværende gennemsnit mangler du ca. <strong>{printsNeeded} prints</strong> for at nå 0 kr.!</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end justify-center shrink-0">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            Afbetalingsstatus
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums mt-0.5">
            {formatNumber(kpis.printerPayoffPercentage, 1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {formatCurrency(kpis.profitMinusWear)} af {formatCurrency(settings.printerCost)}
          </div>
        </div>

      </div>

      {/* Progress Bar & Visual Breakdown */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
          <span className="text-emerald-400 font-semibold">
            0 kr. ({formatCurrency(kpis.profitMinusWear)} afdraget)
          </span>
          <span className="text-slate-300">
            Mål: 0 kr. tilbage ({formatCurrency(settings.printerCost)})
          </span>
        </div>

        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${Math.min(100, Math.max(3, kpis.printerPayoffPercentage))}%` }}
          />
        </div>

        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1.5">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Formel:</span>
            <span>Printer startpris - (Omsat - Print * Slidpris)</span>
          </span>
          <span className="text-slate-300 font-mono text-xs bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 self-start sm:self-auto">
            {formatNumber(settings.printerCost, 0)} - {formatNumber(kpis.profitMinusWear, 2)} = {formatNumber(kpis.printerRemainingCost, 2)} kr.
          </span>
        </div>
      </div>

    </div>
  );
};
