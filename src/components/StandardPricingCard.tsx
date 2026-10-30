'use client';

import React, { useState } from 'react';
import { Tag, Users, Calculator, Info } from 'lucide-react';
import { getStandardUnitPrice, formatCurrency } from '@/utils/calculations';
import { usePrintStore } from '@/context/PrintStoreContext';

interface StandardPricingCardProps {
  onSelectTier?: (quantity: number, isContactGroup: boolean) => void;
}

export const StandardPricingCard: React.FC<StandardPricingCardProps> = ({
  onSelectTier,
}) => {
  const { settings } = usePrintStore();
  const [testQty, setTestQty] = useState<number>(3);
  const [testIsContactGroup, setTestIsContactGroup] = useState<boolean>(false);

  const testUnitPrice = getStandardUnitPrice(testQty, testIsContactGroup, settings);
  const testTotal = testQty * testUnitPrice;

  const t1 = settings.tier1Price ?? 8.0;
  const t3 = settings.tier3Price ?? 7.0;
  const t5 = settings.tier5Price ?? 6.0;
  const t10 = settings.tier10Price ?? 5.5;
  const t20 = settings.tier20Price ?? 5.0;
  const contactPrice = settings.contactGroupPrice ?? 5.0;

  const tiers = [
    { qtyLabel: '1 stk', unit: t1, total: Math.round(1 * t1 * 100) / 100, threshold: '1–2 stk' },
    { qtyLabel: '3 stk', unit: t3, total: Math.round(3 * t3 * 100) / 100, threshold: '3–4 stk' },
    { qtyLabel: '5 stk', unit: t5, total: Math.round(5 * t5 * 100) / 100, threshold: '5–9 stk' },
    { qtyLabel: '10 stk', unit: t10, total: Math.round(10 * t10 * 100) / 100, threshold: '10–19 stk' },
    { qtyLabel: '≥ 20 stk', unit: t20, total: Math.round(20 * t20 * 100) / 100, threshold: '20+ stk' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Standardpriser & Mængdestaffel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auto-udfyldes automatisk ved ny ordre
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <Users className="w-3.5 h-3.5" />
            <span>Kontaktgruppe: {contactPrice.toString().replace('.', ',')} kr./stk</span>
          </span>
        </div>

        {/* Tiers List */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-3.5">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              onClick={() => onSelectTier?.(parseInt(tier.qtyLabel), false)}
              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all text-center cursor-pointer group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {tier.qtyLabel}
              </div>
              <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                {tier.unit.toString().replace('.', ',')} kr.
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                i alt {tier.total.toString().replace('.', ',')} kr.
              </div>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            <strong>Kontaktgruppe-regel:</strong> Sæt kryds i kontaktgruppe for altid at låse prisen til fast {contactPrice.toString().replace('.', ',')} kr./stk uanset mængde. Priserne kan ændres i Indstillinger.
          </span>
        </div>
      </div>

      {/* Interactive Mini-Calculator widget */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-blue-50/40 dark:bg-slate-800/30 p-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Hurtig-beregner:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="1"
              max="500"
              value={testQty}
              onChange={(e) => setTestQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center"
            />
            <span className="text-xs text-slate-500">stk</span>
          </div>

          <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={testIsContactGroup}
              onChange={(e) => setTestIsContactGroup(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Kontaktgruppe</span>
          </label>
        </div>

        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="text-slate-500 font-normal">
            ({testUnitPrice.toString().replace('.', ',')} kr./stk)
          </span>
          <span className="text-blue-600 dark:text-blue-400 text-sm font-extrabold">
            = {formatCurrency(testTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
