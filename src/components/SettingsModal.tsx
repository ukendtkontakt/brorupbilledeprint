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
    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-stone-200 shadow-xl relative max-h-[92vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              System-indstillinger & Priser
            </h3>
            <p className="text-xs text-stone-500">
              Juster materialepriser, printer startpris og standard salgspriser
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSave} className="mt-5 space-y-5">
        
        {/* Section 1: Standard Salgspriser & Mængdestaffel */}
        <div className="space-y-3 p-4 rounded-2xl bg-stone-50/80 border border-stone-200">
          <div className="flex items-center gap-2 pb-1 border-b border-stone-200">
            <Tag className="w-4 h-4 text-stone-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
              Standard Salgspriser & Mængdestaffel (kr./stk)
            </h4>
          </div>
          <p className="text-[11px] text-stone-500">
            Disse priser bruges automatisk som standard, når du opretter nye ordrer. Decimaler med komma (f.eks. 5,5) understøttes.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1 stk */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                1–2 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier1Input}
                  onChange={(e) => setTier1Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">kr.</span>
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 8 kr.</span>
            </div>

            {/* 3 stk */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                3–4 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier3Input}
                  onChange={(e) => setTier3Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">kr.</span>
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 7 kr.</span>
            </div>

            {/* 5 stk */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                5–9 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier5Input}
                  onChange={(e) => setTier5Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">kr.</span>
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 6 kr.</span>
            </div>

            {/* 10 stk */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                10–19 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier10Input}
                  onChange={(e) => setTier10Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">kr.</span>
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 5,5 kr.</span>
            </div>

            {/* 20+ stk */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                ≥ 20 stk
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tier20Input}
                  onChange={(e) => setTier20Input(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">kr.</span>
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 5 kr.</span>
            </div>

            {/* Kontaktgruppe */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-stone-600" />
                <span>Kontaktgruppe</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={contactGroupInput}
                  onChange={(e) => setContactGroupInput(e.target.value)}
                  className="w-full pl-3 pr-7 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">kr.</span>
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 5 kr.</span>
            </div>
          </div>
        </div>

        {/* Section 2: Materiale- & Slidomkostninger */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-stone-200">
            <Calculator className="w-4 h-4 text-stone-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
              Materiale- & Slidomkostninger
            </h4>
          </div>

          {/* Paper Pack Price & Shipping */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Pris pr. 108-pakke (kr.)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formState.paperPackPrice}
                onChange={(e) => setFormState({ ...formState, paperPackPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 170 kr.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Fragt ved køb (kr.)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formState.shippingPrice}
                onChange={(e) => setFormState({ ...formState, shippingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 39 kr.</span>
            </div>
          </div>

          {/* Packs & Prints per pack */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Antal pakker pr. køb
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formState.packsPerPurchase}
                onChange={(e) => setFormState({ ...formState, packsPerPurchase: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 2 pakker</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Prints pr. pakke
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formState.printsPerPack}
                onChange={(e) => setFormState({ ...formState, printsPerPack: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Standard: 108 prints</span>
            </div>
          </div>

          {/* Printer startpris */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Printer købspris / startpris (kr.)
            </label>
            <input
              type="number"
              step="50"
              min="0"
              value={formState.printerCost}
              onChange={(e) => setFormState({ ...formState, printerCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-bold text-sm focus:outline-hidden focus:border-stone-500 tabular-nums"
            />
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              Startinvestering der skal tjenes hjem (Standard: 1.000 kr.)
            </span>
          </div>

          {/* Live Calculation Display Box */}
          <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
              <Calculator className="w-4 h-4 text-stone-500" />
              <span>Live Beregningsresultat</span>
            </div>

            <div className="text-xs space-y-1.5 text-stone-700">
              <div className="flex justify-between">
                <span>Samlet indkøb ({formState.packsPerPurchase} pakker + fragt):</span>
                <span className="font-semibold tabular-nums">({formState.paperPackPrice} × {formState.packsPerPurchase}) + {formState.shippingPrice} = {formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Samlet antal prints:</span>
                <span className="font-semibold tabular-nums">{formState.packsPerPurchase} × {formState.printsPerPack} = {totalPrints} prints</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-stone-200 text-sm font-bold text-stone-900">
                <span>Pris pr. print (slid/materiale):</span>
                <span className="tabular-nums font-mono text-xs sm:text-sm">{costPerPrint.toFixed(7)} kr.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-100">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Gendan standard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              Annuller
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-medium shadow-xs cursor-pointer active:scale-[0.99]"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <SettingsFormInner key={JSON.stringify(settings)} settings={settings} onClose={onClose} />
    </div>
  );
};
