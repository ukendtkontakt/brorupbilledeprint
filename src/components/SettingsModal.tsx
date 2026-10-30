'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { CostSettings } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import { X, Settings, RotateCcw, Calculator, Tag, Users } from 'lucide-react';
import { DEFAULT_SETTINGS } from '@/utils/initialData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsFormInnerProps {
  settings: CostSettings;
  onClose: () => void;
}

function parseDecimal(val: string, fallback: number): number {
  const clean = val.replace(',', '.').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? fallback : n;
}

function SettingsFormInner({ settings, onClose }: SettingsFormInnerProps) {
  const { updateSettings } = usePrintStore();
  const { showToast } = useToast();

  const [formState, setFormState] = useState<CostSettings>(settings);

  // Decimal string inputs supporting comma e.g. "5,5" or "4,7"
  const [tier1Input, setTier1Input] = useState<string>(() =>
    (settings.tier1Price ?? 8.0).toString().replace('.', ',')
  );
  const [tier3Input, setTier3Input] = useState<string>(() =>
    (settings.tier3Price ?? 7.0).toString().replace('.', ',')
  );
  const [tier5Input, setTier5Input] = useState<string>(() =>
    (settings.tier5Price ?? 6.0).toString().replace('.', ',')
  );
  const [tier10Input, setTier10Input] = useState<string>(() =>
    (settings.tier10Price ?? 5.5).toString().replace('.', ',')
  );
  const [tier20Input, setTier20Input] = useState<string>(() =>
    (settings.tier20Price ?? 5.0).toString().replace('.', ',')
  );
  const [contactGroupInput, setContactGroupInput] = useState<string>(() =>
    (settings.contactGroupPrice ?? 5.0).toString().replace('.', ',')
  );

  // Live calculation of wear/material cost values
  const totalCost = (formState.paperPackPrice * formState.packsPerPurchase) + formState.shippingPrice;
  const totalPrints = formState.packsPerPurchase * formState.printsPerPack;
  const costPerPrint = totalPrints > 0 ? totalCost / totalPrints : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings: CostSettings = {
      ...formState,
      tier1Price: parseDecimal(tier1Input, 8.0),
      tier3Price: parseDecimal(tier3Input, 7.0),
      tier5Price: parseDecimal(tier5Input, 6.0),
      tier10Price: parseDecimal(tier10Input, 5.5),
      tier20Price: parseDecimal(tier20Input, 5.0),
      contactGroupPrice: parseDecimal(contactGroupInput, 5.0),
    };

    updateSettings(updatedSettings);
    showToast('Omkostnings- og standardpriser er opdateret!');
    onClose();
  };

  const handleReset = () => {
    if (confirm('Vil du nulstille alle indstillinger og standardpriser til standardværdierne?')) {
      setFormState(DEFAULT_SETTINGS);
      setTier1Input((DEFAULT_SETTINGS.tier1Price ?? 8.0).toString().replace('.', ','));
      setTier3Input((DEFAULT_SETTINGS.tier3Price ?? 7.0).toString().replace('.', ','));
      setTier5Input((DEFAULT_SETTINGS.tier5Price ?? 6.0).toString().replace('.', ','));
      setTier10Input((DEFAULT_SETTINGS.tier10Price ?? 5.5).toString().replace('.', ','));
      setTier20Input((DEFAULT_SETTINGS.tier20Price ?? 5.0).toString().replace('.', ','));
      setContactGroupInput((DEFAULT_SETTINGS.contactGroupPrice ?? 5.0).toString().replace('.', ','));

      updateSettings(DEFAULT_SETTINGS);
      showToast('Indstillinger nulstillet til standard');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              System-indstillinger & Priser
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Juster materialepriser, printer startpris og standard salgspriser
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSave} className="mt-5 space-y-5">
        
        {/* Section 1: Standard Salgspriser & Mængdestaffel */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
            <Tag className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Standard Salgspriser & Mængdestaffel (kr./stk)
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Disse priser bruges automatisk som standard, når du opretter nye ordrer. Decimaler med komma (f.eks. 5,5) understøttes.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1 stk */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                1–2 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier1Input}
                  onChange={(e) => setTier1Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">kr.</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 8 kr.</span>
            </div>

            {/* 3 stk */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                3–4 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier3Input}
                  onChange={(e) => setTier3Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">kr.</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 7 kr.</span>
            </div>

            {/* 5 stk */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                5–9 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier5Input}
                  onChange={(e) => setTier5Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">kr.</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 6 kr.</span>
            </div>

            {/* 10 stk */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                10–19 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier10Input}
                  onChange={(e) => setTier10Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">kr.</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 5,5 kr.</span>
            </div>

            {/* 20+ stk */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                ≥ 20 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier20Input}
                  onChange={(e) => setTier20Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">kr.</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 5 kr.</span>
            </div>

            {/* Kontaktgruppe */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-600" />
                <span>Kontaktgruppe</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={contactGroupInput}
                  onChange={(e) => setContactGroupInput(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">kr.</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 5 kr.</span>
            </div>
          </div>
        </div>

        {/* Section 2: Materiale- & Slidomkostninger */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800">
            <Calculator className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Materiale- & Slidomkostninger
            </h4>
          </div>

          {/* Paper Pack Price & Shipping */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Pris pr. 108-pakke (kr.)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formState.paperPackPrice}
                onChange={(e) => setFormState({ ...formState, paperPackPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 170 kr.</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Fragt ved køb (kr.)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formState.shippingPrice}
                onChange={(e) => setFormState({ ...formState, shippingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 39 kr.</span>
            </div>
          </div>

          {/* Packs & Prints per pack */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Antal pakker pr. køb
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formState.packsPerPurchase}
                onChange={(e) => setFormState({ ...formState, packsPerPurchase: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 2 pakker</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Prints pr. pakke
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formState.printsPerPack}
                onChange={(e) => setFormState({ ...formState, printsPerPack: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 108 prints</span>
            </div>
          </div>

          {/* Printer startpris */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Printer købspris / startpris (kr.)
            </label>
            <input
              type="number"
              step="50"
              min="0"
              value={formState.printerCost}
              onChange={(e) => setFormState({ ...formState, printerCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Startinvestering der skal tjenes hjem (Standard: 1.000 kr.)
            </span>
          </div>

          {/* Live Calculation Display Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 dark:from-slate-800 dark:to-slate-900 border border-blue-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
              <Calculator className="w-4 h-4" />
              <span>Live Beregningsresultat</span>
            </div>

            <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Samlet indkøb ({formState.packsPerPurchase} pakker + fragt):</span>
                <span className="font-bold">({formState.paperPackPrice} × {formState.packsPerPurchase}) + {formState.shippingPrice} = {formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Samlet antal prints:</span>
                <span className="font-bold">{formState.packsPerPurchase} × {formState.printsPerPack} = {totalPrints} prints</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200 dark:border-slate-700 text-sm font-extrabold text-blue-700 dark:text-blue-400">
                <span>Pris pr. print (slid/materiale):</span>
                <span>{costPerPrint.toFixed(7)} kr.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Gendan standard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Annuller
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
            >
              Gem indstillinger
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings } = usePrintStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <SettingsFormInner settings={settings} onClose={onClose} />
    </div>
  );
};
