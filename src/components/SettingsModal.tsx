'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { CostSettings } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import { X, Settings, RotateCcw, Calculator } from 'lucide-react';
import { DEFAULT_SETTINGS } from '@/utils/initialData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsFormInnerProps {
  settings: CostSettings;
  onClose: () => void;
}

function SettingsFormInner({ settings, onClose }: SettingsFormInnerProps) {
  const { updateSettings } = usePrintStore();
  const { showToast } = useToast();

  const [formState, setFormState] = useState<CostSettings>(settings);

  // Live calculation of values
  const totalCost = (formState.paperPackPrice * formState.packsPerPurchase) + formState.shippingPrice;
  const totalPrints = formState.packsPerPurchase * formState.printsPerPack;
  const costPerPrint = totalPrints > 0 ? totalCost / totalPrints : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    showToast('Omkostnings-indstillinger opdateret!');
    onClose();
  };

  const handleReset = () => {
    if (confirm('Vil du nulstille alle indstillinger til standardværdierne?')) {
      setFormState(DEFAULT_SETTINGS);
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
              Omkostnings-indstillinger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Juster materialepriser, fragt og printer startpris
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

      <form onSubmit={handleSave} className="mt-5 space-y-4">
        {/* Paper Pack Price */}
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

        {/* Action buttons */}
        <div className="pt-2 flex items-center justify-between gap-3">
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
