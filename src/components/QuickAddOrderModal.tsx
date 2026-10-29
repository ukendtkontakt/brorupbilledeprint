'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { getStandardUnitPrice, formatCurrency } from '@/utils/calculations';
import {
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  RotateCcw,
} from 'lucide-react';

interface QuickAddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuantity?: number;
  initialIsContactGroup?: boolean;
}

interface FormInnerProps {
  onClose: () => void;
  initialQuantity?: number;
  initialIsContactGroup?: boolean;
}

function QuickAddFormInner({
  onClose,
  initialQuantity,
  initialIsContactGroup,
}: FormInnerProps) {
  const { addOrder, toners, activeToner, orders } = usePrintStore();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1);
  const [isContactGroup, setIsContactGroup] = useState<boolean>(initialIsContactGroup || false);
  const [overrideUnitPrice, setOverrideUnitPrice] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [selectedTonerId, setSelectedTonerId] = useState<string>(activeToner?.id || toners[0]?.id || '');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Extract unique customer names for quick autocomplete
  const existingCustomers = Array.from(new Set(orders.map((o) => o.customerName))).filter(Boolean);

  // Derived price calculation without useEffect
  const isManualPrice = overrideUnitPrice !== null;
  const unitPrice = isManualPrice ? overrideUnitPrice : getStandardUnitPrice(quantity, isContactGroup);
  const totalPrice = Math.round(quantity * unitPrice * 100) / 100;

  const handleSelectCustomer = (name: string) => {
    setCustomerName(name);
  };

  const handleQuickQty = (qty: number) => {
    setQuantity(qty);
  };

  const resetToAutoPrice = () => {
    setOverrideUnitPrice(null);
    showToast('Pris nulstillet til standard takst');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Angiv venligst et kundenavn', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('Antal skal være mindst 1 print', 'error');
      return;
    }

    const createdOrder = addOrder({
      customerName,
      quantity,
      unitPrice,
      totalPrice,
      isPaid,
      isContactGroup,
      tonerId: selectedTonerId,
      date,
      notes,
    });

    showToast(`Ordre oprettet for ${createdOrder.customerName} (${createdOrder.quantity} stk - ${formatCurrency(createdOrder.totalPrice)})`);
    onClose();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Opret ny print-ordre
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Udfyld kundenavn og antal prints. Pris udregnes automatisk.
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Kunde Navn *
          </label>
          <input
            type="text"
            required
            placeholder="F.eks. Folke, Teng, Johannes..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            autoFocus
          />

          {/* Quick autocomplete chips */}
          {existingCustomers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Hurtigvalg:</span>
              {existingCustomers.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectCustomer(name)}
                  className="text-xs px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quantity & Quick Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Antal prints *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5, 10, 12, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickQty(num)}
                  className={`text-xs px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    quantity === num
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <input
            type="number"
            min="1"
            max="1000"
            required
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Contact Group toggle */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Kontaktgruppe
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Låser automatisk prisen til fast 5,00 kr./stk uanset antal
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isContactGroup}
              onChange={(e) => {
                setIsContactGroup(e.target.checked);
                setOverrideUnitPrice(null);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Unit Price & Total live price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Pris pr. stk (kr.)
              </label>
              {isManualPrice && (
                <button
                  type="button"
                  onClick={resetToAutoPrice}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                  title="Nulstil til auto-udregnet takst"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Auto
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.5"
              min="0"
              value={unitPrice}
              onChange={(e) => {
                setOverrideUnitPrice(parseFloat(e.target.value) || 0);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                isManualPrice
                  ? 'border-amber-400 ring-1 ring-amber-400/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {isManualPrice ? 'Manuel særpris' : 'Auto standardtakst'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Pris i alt
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-lg font-black tabular-nums flex items-center justify-between">
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {quantity} stk × {unitPrice.toString().replace('.', ',')} kr.
            </span>
          </div>
        </div>

        {/* Payment Status Toggle (Ja / Nej) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Betalingsstatus *
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={`py-2.5 px-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isPaid
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ja (Betalt nu)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={`py-2.5 px-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                !isPaid
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Nej (Skylder penge)</span>
            </button>
          </div>
        </div>

        {/* Toner and Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Printet på toner</span>
            </label>
            <select
              value={selectedTonerId}
              onChange={(e) => setSelectedTonerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            >
              {toners.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.status === 'active' ? '(Aktiv)' : t.status === 'finished' ? '(Færdig)' : '(Klar)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Dato</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Noter (valgfrit)
          </label>
          <input
            type="text"
            placeholder="F.eks. Vennerabat, 10x15 glanspapir, MobilePay overførsel..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit & Cancel */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Annuller
          </button>
          <button
            type="submit"
            className="flex-2 py-3 px-4 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/30 transition-all hover:scale-[1.01]"
          >
            Gem & opret ordre ({formatCurrency(totalPrice)})
          </button>
        </div>
      </form>
    </div>
  );
}

export const QuickAddOrderModal: React.FC<QuickAddOrderModalProps> = ({
  isOpen,
  onClose,
  initialQuantity,
  initialIsContactGroup,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <QuickAddFormInner
        onClose={onClose}
        initialQuantity={initialQuantity}
        initialIsContactGroup={initialIsContactGroup}
      />
    </div>
  );
};
