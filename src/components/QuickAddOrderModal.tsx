'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { getStandardUnitPrice, formatCurrency } from '@/utils/calculations';
import { OrderTonerBreakdown } from '@/types';
import {
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  RotateCcw,
  Split,
  Plus,
  Trash2,
  Check,
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

  // Decimal price string supporting comma e.g. "4,7" or "4.7"
  const defaultInitialPrice = getStandardUnitPrice(initialQuantity || 1, initialIsContactGroup || false);
  const [priceInput, setPriceInput] = useState<string>(() =>
    defaultInitialPrice.toString().replace('.', ',')
  );
  const [isManualPrice, setIsManualPrice] = useState<boolean>(false);

  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Single vs Multi-toner split
  const defaultTonerId = activeToner?.id || toners[0]?.id || '';
  const [isMultiToner, setIsMultiToner] = useState<boolean>(false);
  const [singleTonerId, setSingleTonerId] = useState<string>(defaultTonerId);
  const [tonerAllocations, setTonerAllocations] = useState<OrderTonerBreakdown[]>([
    { tonerId: defaultTonerId, count: initialQuantity || 1 },
  ]);

  // Extract unique customer names for quick autocomplete
  const existingCustomers = Array.from(new Set(orders.map((o) => o.customerName))).filter(Boolean);

  // Parse price safely from comma or dot input
  const parsedUnitPrice = (() => {
    if (!isManualPrice) {
      return getStandardUnitPrice(quantity, isContactGroup);
    }
    const clean = priceInput.replace(',', '.').trim();
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  })();

  const totalPrice = Math.round(quantity * parsedUnitPrice * 100) / 100;

  // Handle quantity changes
  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);
    if (!isManualPrice) {
      const autoPrice = getStandardUnitPrice(validQty, isContactGroup);
      setPriceInput(autoPrice.toString().replace('.', ','));
    }

    // If multi toner is on and only 1 allocation exists, update it to match
    if (tonerAllocations.length === 1) {
      setTonerAllocations([{ tonerId: tonerAllocations[0].tonerId, count: validQty }]);
    }
  };

  const handleContactGroupToggle = (checked: boolean) => {
    setIsContactGroup(checked);
    setIsManualPrice(false);
    const autoPrice = getStandardUnitPrice(quantity, checked);
    setPriceInput(autoPrice.toString().replace('.', ','));
  };

  const handlePriceChange = (val: string) => {
    setPriceInput(val);
    setIsManualPrice(true);
  };

  const resetToAutoPrice = () => {
    setIsManualPrice(false);
    const autoPrice = getStandardUnitPrice(quantity, isContactGroup);
    setPriceInput(autoPrice.toString().replace('.', ','));
    showToast('Pris nulstillet til standard takst');
  };

  // Multi-toner management
  const totalAllocated = isMultiToner
    ? tonerAllocations.reduce((sum, item) => sum + (Number(item.count) || 0), 0)
    : quantity;
  const allocationDiff = quantity - totalAllocated;

  const handleToggleMultiToner = (enable: boolean) => {
    setIsMultiToner(enable);
    if (enable && tonerAllocations.length <= 1) {
      // Find next ready toner or fallback
      const currentId = singleTonerId || defaultTonerId;
      const otherToner = toners.find((t) => t.id !== currentId) || toners[0];

      // Propose a sensible split (e.g. half/half or 20 + rest)
      const part1 = Math.max(1, Math.floor(quantity / 2));
      const part2 = Math.max(1, quantity - part1);

      setTonerAllocations([
        { tonerId: currentId, count: part1 },
        { tonerId: otherToner ? otherToner.id : currentId, count: part2 },
      ]);
    }
  };

  const handleUpdateAllocation = (index: number, field: 'tonerId' | 'count', value: string | number) => {
    setTonerAllocations((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          [field]: field === 'count' ? Math.max(0, Number(value) || 0) : value,
        };
      })
    );
  };

  const handleAddTonerRow = () => {
    // Pick the first toner not already in allocations, or active
    const usedIds = new Set(tonerAllocations.map((a) => a.tonerId));
    const nextUnused = toners.find((t) => !usedIds.has(t.id)) || toners[0];
    const fillRemainder = Math.max(0, allocationDiff);

    setTonerAllocations((prev) => [
      ...prev,
      { tonerId: nextUnused.id, count: fillRemainder },
    ]);
  };

  const handleRemoveTonerRow = (index: number) => {
    if (tonerAllocations.length <= 1) return;
    setTonerAllocations((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFillRemainderOnRow = (index: number) => {
    if (allocationDiff === 0) return;
    setTonerAllocations((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          count: Math.max(0, item.count + allocationDiff),
        };
      })
    );
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

    if (isMultiToner) {
      if (allocationDiff !== 0) {
        showToast(
          allocationDiff > 0
            ? `Du mangler at fordele ${allocationDiff} prints på tonerne`
            : `Du har fordelt ${Math.abs(allocationDiff)} prints for meget på tonerne`,
          'error'
        );
        return;
      }
    }

    const createdOrder = addOrder({
      customerName,
      quantity,
      unitPrice: parsedUnitPrice,
      totalPrice,
      isPaid,
      isContactGroup,
      tonerId: isMultiToner ? undefined : singleTonerId,
      tonerBreakdown: isMultiToner ? tonerAllocations.filter((a) => a.count > 0) : undefined,
      date,
      notes,
    });

    showToast(
      `Ordre oprettet for ${createdOrder.customerName} (${createdOrder.quantity} stk - ${formatCurrency(createdOrder.totalPrice)})`
    );
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
            Udfyld kundenavn, antal og evt. fordeling på flere tonere.
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
                  onClick={() => setCustomerName(name)}
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
              {[1, 2, 3, 5, 10, 12, 20, 38].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuantityChange(num)}
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
            max="2000"
            required
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
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
              onChange={(e) => handleContactGroupToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Unit Price & Total live price - Supports comma "4,7" and "4.7" freely */}
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
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="F.eks. 4,7 eller 5"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                isManualPrice
                  ? 'border-amber-400 ring-1 ring-amber-400/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {isManualPrice ? 'Manuel særpris (f.eks. 4,7)' : 'Auto standardtakst'}
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
              {quantity} stk × {parsedUnitPrice.toString().replace('.', ',')} kr.
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

        {/* Toner Section - Single or Multi-Toner split */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Toner-forbrug</span>
            </label>

            <button
              type="button"
              onClick={() => handleToggleMultiToner(!isMultiToner)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all border ${
                isMultiToner
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
              }`}
            >
              <Split className="w-3 h-3" />
              <span>{isMultiToner ? 'Opdelt på flere tonere' : 'Opdel på flere tonere?'}</span>
            </button>
          </div>

          {!isMultiToner ? (
            /* Single Toner Selection */
            <div>
              <select
                value={singleTonerId}
                onChange={(e) => setSingleTonerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                {toners.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.status === 'active' ? '(Aktiv patron)' : t.status === 'finished' ? '(Færdig)' : '(Klar)'} — {t.printedCount}/{t.capacity || 108} print
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Alle {quantity} prints registreres på denne toner. Løber den tør midt i? Tryk på &quot;Opdel på flere tonere&quot; ovenfor.
              </span>
            </div>
          ) : (
            /* Multi-Toner Allocation Breakdown */
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Fordel de {quantity} prints på de tonere, der blev brugt (f.eks. ved skift undervejs):
              </div>

              {tonerAllocations.map((alloc, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center">
                    #{idx + 1}
                  </span>
                  <select
                    value={alloc.tonerId}
                    onChange={(e) => handleUpdateAllocation(idx, 'tonerId', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {toners.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.status === 'active' ? '(Aktiv)' : t.status === 'finished' ? '(Færdig)' : '(Klar)'} ({t.printedCount} print)
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      min="0"
                      max={quantity}
                      value={alloc.count}
                      onChange={(e) => handleUpdateAllocation(idx, 'count', e.target.value)}
                      className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold text-center"
                    />
                    <span className="text-xs text-slate-400">stk</span>
                  </div>

                  {allocationDiff !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleFillRemainderOnRow(idx)}
                      className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[10px] font-bold hover:bg-blue-100 whitespace-nowrap"
                      title="Læg manglende prints til her"
                    >
                      +{allocationDiff}
                    </button>
                  )}

                  {tonerAllocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTonerRow(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500"
                      title="Fjern toner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Status and Action row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={handleAddTonerRow}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tilføj toner mere</span>
                </button>

                <div className="text-xs">
                  {allocationDiff === 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      <Check className="w-3.5 h-3.5" />
                      <span>Alle {quantity} prints fordelt</span>
                    </span>
                  ) : allocationDiff > 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60">
                      <span>Mangler at fordele {allocationDiff} stk</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200/60">
                      <span>{Math.abs(allocationDiff)} stk for meget!</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date and Notes */}
        <div className="grid grid-cols-2 gap-3">
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Noter (valgfrit)
            </label>
            <input
              type="text"
              placeholder="F.eks. Vennerabat, MobilePay..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
