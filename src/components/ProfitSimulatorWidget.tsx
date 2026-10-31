'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { getStandardUnitPrice, formatCurrency, formatNumber } from '@/utils/calculations';
import { ArrowRight, Sparkles, Sliders } from 'lucide-react';

interface ProfitSimulatorWidgetProps {
  onApplySimulation: (quantity: number, unitPrice: number, isContactGroup: boolean) => void;
}

export const ProfitSimulatorWidget: React.FC<ProfitSimulatorWidgetProps> = ({
  onApplySimulation,
}) => {
  const { settings, kpis } = usePrintStore();

  const [simQty, setSimQty] = useState<number>(24);
  const [isContactGroup, setIsContactGroup] = useState<boolean>(false);
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  const [useCustomPrice, setUseCustomPrice] = useState<boolean>(false);

  // Cost per print from settings
  const costPerPrint = (() => {
    const totalCost = settings.paperPackPrice * settings.packsPerPurchase + settings.shippingPrice;
    const totalPrints = settings.packsPerPurchase * settings.printsPerPack;
    return totalPrints > 0 ? totalCost / totalPrints : 1.7546;
  })();

  // Unit price determination
  const standardPrice = getStandardUnitPrice(simQty, isContactGroup, settings);
  const effectiveUnitPrice = (() => {
    if (useCustomPrice) {
      const parsed = parseFloat(customPriceInput.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return standardPrice;
  })();

  const totalRevenue = simQty * effectiveUnitPrice;
  const totalWear = simQty * costPerPrint;
  const netProfit = totalRevenue - totalWear;
  const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // How much of remaining printer cost does this single job pay off?
  const payoffCoveragePct = kpis.printerRemainingCost > 0
    ? Math.min(100, (netProfit / kpis.printerRemainingCost) * 100)
    : 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setSimQty(val);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Print- & Fortjeneste-Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Test en potentiel ordre og se live omkostninger, profit og afbetalings-effekt
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Live Kalkulation
          </span>
        </div>

        {/* Interactive Slider */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Antal prints at simulere:
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {simQty}
              </span>
              <span className="text-xs font-semibold text-slate-500">stk</span>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="150"
            value={simQty}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>1 print</span>
            <span>50 prints</span>
            <span>100 prints</span>
            <span>150 prints</span>
          </div>
        </div>

        {/* Price configuration options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isContactGroup}
                onChange={(e) => {
                  setIsContactGroup(e.target.checked);
                  setUseCustomPrice(false);
                }}
                className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
              />
              <span>Fast kontaktgruppe-takst (5 kr.)</span>
            </label>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <input
              type="checkbox"
              id="custom-price-toggle"
              checked={useCustomPrice}
              onChange={(e) => setUseCustomPrice(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <label htmlFor="custom-price-toggle" className="text-xs font-semibold text-slate-700 select-none">
              Manuel stk. pris:
            </label>
            <input
              type="text"
              disabled={!useCustomPrice}
              placeholder="F.eks. 4,5"
              value={customPriceInput}
              onChange={(e) => setCustomPriceInput(e.target.value)}
              className={`w-20 px-2 py-1 text-xs font-bold rounded-lg border text-center ${
                useCustomPrice
                  ? 'bg-white border-indigo-400 text-slate-900'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            />
            <span className="text-xs text-slate-500">kr.</span>
          </div>
        </div>

        {/* Realtime KPI Simulation Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Brutto omsætning
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-0.5">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {effectiveUnitPrice.toString().replace('.', ',')} kr./stk
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Materiale & Slid
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-600 tabular-nums mt-0.5">
              {formatCurrency(totalWear)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {formatNumber(costPerPrint, 2)} kr./print
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Netto fortjeneste
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 tabular-nums mt-0.5">
              {formatCurrency(netProfit)}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5 font-semibold">
              {formatNumber(marginPct, 1)}% avance
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
            <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
              Printer-afdrag
            </div>
            <div className="text-lg sm:text-xl font-black text-indigo-700 tabular-nums mt-0.5">
              +{formatNumber(payoffCoveragePct, 1)}%
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">
              af restgæld dækkes
            </div>
          </div>
        </div>
      </div>

      {/* Action: Apply simulation to new order */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Vil du bogføre denne ordre direkte i systemet?
        </span>
        <button
          type="button"
          onClick={() => onApplySimulation(simQty, effectiveUnitPrice, isContactGroup)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Opret {simQty} print som ordre nu ({formatCurrency(totalRevenue)})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
