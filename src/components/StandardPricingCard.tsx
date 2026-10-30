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
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-stone-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Standardpriser & Mængdestaffel
              </h3>
              <p className="text-xs text-stone-500">
                Vejledende priser — auto-udfyldes ved ny ordre
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200/70 self-start sm:self-auto">
            <Users className="w-3.5 h-3.5 text-stone-500" />
            <span>Kontaktgruppe: <strong>{contactPrice.toString().replace('.', ',')} kr./stk</strong></span>
          </span>
        </div>

        {/* Tiers List */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-4">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              onClick={() => onSelectTier?.(parseInt(tier.qtyLabel), false)}
              className="bg-stone-50/80 hover:bg-stone-100/90 p-3 rounded-xl border border-stone-200/70 transition-all text-center cursor-pointer group"
              title="Klik for at åbne ordreformular med denne mængde"
            >
              <div className="text-xs font-semibold text-stone-600 group-hover:text-stone-900">
                {tier.qtyLabel}
              </div>
              <div className="text-base font-bold text-stone-900 mt-0.5 tabular-nums">
                {tier.unit.toString().replace('.', ',')} <span className="text-xs font-normal text-stone-500">kr.</span>
              </div>
              <div className="text-[11px] text-stone-400">
                i alt {tier.total.toString().replace('.', ',')} kr.
              </div>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-stone-500 flex items-start gap-2 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
          <span>
            Ved <strong>Kontaktgruppe</strong> låses prisen til {contactPrice.toString().replace('.', ',')} kr./stk uanset antal. Du kan altid overskrive stk. prisen manuelt på hver ordre, eller justere standardpriserne i Indstillinger.
          </span>
        </div>
      </div>

      {/* Interactive Mini-Calculator widget */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/90 border border-stone-200/70 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-xs font-medium text-stone-700">
            Hurtig-beregner:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="1"
              max="500"
              value={testQty}
              onChange={(e) => setTestQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-900 text-center focus:outline-hidden focus:border-stone-500"
            />
            <span className="text-xs text-stone-500">stk</span>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer ml-1 select-none">
            <input
              type="checkbox"
              checked={testIsContactGroup}
              onChange={(e) => setTestIsContactGroup(e.target.checked)}
              className="rounded border-stone-300 text-stone-800 focus:ring-0 w-3.5 h-3.5 accent-stone-800"
            />
            <span>Kontaktgruppe</span>
          </label>
        </div>

        <div className="text-xs font-semibold text-stone-800 flex items-center gap-2">
          <span className="text-stone-500 font-normal">
            ({testUnitPrice.toString().replace('.', ',')} kr./stk)
          </span>
          <span className="text-stone-900 text-sm font-bold bg-white px-2 py-0.5 rounded-md border border-stone-200">
            = {formatCurrency(testTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
