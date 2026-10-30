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
  const { addOrder, toners, activeToner, orders, settings } = usePrintStore();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1);
  const [isContactGroup, setIsContactGroup] = useState<boolean>(initialIsContactGroup || false);

  // Decimal price string supporting comma e.g. "4,7" or "4.7"
  const defaultInitialPrice = getStandardUnitPrice(initialQuantity || 1, initialIsContactGroup || false, settings);
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
      return getStandardUnitPrice(quantity, isContactGroup, settings);
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
      const autoPrice = getStandardUnitPrice(validQty, isContactGroup, settings);
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
    const autoPrice = getStandardUnitPrice(quantity, checked, settings);
    setPriceInput(autoPrice.toString().replace('.', ','));
  };

  const handlePriceChange = (val: string) => {
    setPriceInput(val);
    setIsManualPrice(true);
  };

  const resetToAutoPrice = () => {
    setIsManualPrice(false);
    const autoPrice = getStandardUnitPrice(quantity, isContactGroup, settings);
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
    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-stone-200 shadow-xl relative max-h-[92vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-stone-900">
            Opret ny print-ordre
          </h3>
          <p className="text-xs text-stone-500">
            Udfyld kundenavn, antal og evt. fordeling på flere tonere.
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Kunde Navn *
          </label>
          <input
            type="text"
            required
            placeholder="F.eks. Folke, Teng, Johannes..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm font-medium focus:outline-hidden focus:border-stone-500"
            autoFocus
          />

          {/* Quick autocomplete chips */}
          {existingCustomers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-stone-400">Hurtigvalg:</span>
              {existingCustomers.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCustomerName(name)}
                  className="text-xs px-2.5 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
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
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Antal prints *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5, 10, 12, 20, 38].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuantityChange(num)}
                  className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                    quantity === num
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-base font-bold focus:outline-hidden focus:border-stone-500 tabular-nums"
          />
        </div>

        {/* Contact Group toggle */}
        <div className="p-3 rounded-xl bg-stone-50/80 border border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-stone-600" />
            <div>
              <div className="text-xs font-semibold text-stone-800">
                Kontaktgruppe
              </div>
              <div className="text-[11px] text-stone-500">
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
            <div className="w-10 h-5.5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-stone-900"></div>
          </label>
        </div>

        {/* Unit Price & Total live price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Pris pr. stk (kr.)
              </label>
              {isManualPrice && (
                <button
                  type="button"
                  onClick={resetToAutoPrice}
                  className="text-[10px] text-stone-600 hover:text-stone-900 underline flex items-center gap-0.5 cursor-pointer"
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
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-stone-900 text-sm font-bold focus:outline-hidden focus:border-stone-500 tabular-nums ${
                isManualPrice
                  ? 'border-amber-400 bg-amber-50/20'
                  : 'border-stone-300'
              }`}
            />
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              {isManualPrice ? 'Manuel pris (f.eks. 4,7)' : 'Auto takst'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Pris i alt
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-900 text-base sm:text-lg font-bold tabular-nums flex items-center justify-between">
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              {quantity} stk × {parsedUnitPrice.toString().replace('.', ',')} kr.
            </span>
          </div>
        </div>

        {/* Payment Status Toggle (Ja / Nej) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Betalingsstatus *
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={`py-2.5 px-3 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPaid
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ja (Betalt)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={`py-2.5 px-3 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isPaid
                  ? 'bg-rose-800 text-white border-rose-800 shadow-2xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Nej (Udestående)</span>
            </button>
          </div>
        </div>

        {/* Toner Section - Single or Multi-Toner split */}
        <div className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>Toner-forbrug</span>
            </label>

            <button
              type="button"
              onClick={() => handleToggleMultiToner(!isMultiToner)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all border cursor-pointer ${
                isMultiToner
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Split className="w-3 h-3" />
              <span>{isMultiToner ? 'Opdelt på flere' : 'Opdel på flere tonere?'}</span>
            </button>
          </div>

          {!isMultiToner ? (
            /* Single Toner Selection */
            <div>
              <select
                value={singleTonerId}
                onChange={(e) => setSingleTonerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-medium focus:outline-hidden focus:border-stone-500"
              >
                {toners.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.status === 'active' ? '(Aktiv patron)' : t.status === 'finished' ? '(Færdig)' : '(Klar)'} — {t.printedCount}/{t.capacity || 108} print
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Alle {quantity} prints registreres på denne toner. Løber den tør midt i? Tryk på &quot;Opdel på flere tonere&quot; ovenfor.
              </span>
            </div>
          ) : (
            /* Multi-Toner Allocation Breakdown */
            <div className="space-y-2.5">
              <div className="text-[11px] text-stone-500">
                Fordel de {quantity} prints på de tonere, der blev brugt:
              </div>

              {tonerAllocations.map((alloc, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-stone-200">
                  <span className="text-xs font-semibold text-stone-400 w-5 text-center">
                    #{idx + 1}
                  </span>
                  <select
                    value={alloc.tonerId}
                    onChange={(e) => handleUpdateAllocation(idx, 'tonerId', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 text-stone-900 text-xs font-medium focus:outline-hidden focus:border-stone-500"
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
                      className="w-16 px-2 py-1.5 rounded-lg border border-stone-300 bg-stone-50 text-stone-900 text-xs font-bold text-center tabular-nums"
                    />
                    <span className="text-xs text-stone-400">stk</span>
                  </div>

                  {allocationDiff !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleFillRemainderOnRow(idx)}
                      className="px-2 py-1 rounded-lg bg-stone-100 text-stone-800 text-[10px] font-bold hover:bg-stone-200 whitespace-nowrap cursor-pointer"
                      title="Læg manglende prints til her"
                    >
                      +{allocationDiff}
                    </button>
                  )}

                  {tonerAllocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTonerRow(idx)}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-700 cursor-pointer"
                      title="Fjern toner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Status and Action row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleAddTonerRow}
                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 hover:text-stone-900 underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tilføj toner mere</span>
                </button>

                <div className="text-xs">
                  {allocationDiff === 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Alle {quantity} prints fordelt</span>
                    </span>
                  ) : allocationDiff > 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <span>Mangler at fordele {allocationDiff} stk</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-800 font-medium bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Dato</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-medium focus:outline-hidden focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Noter (valgfrit)
            </label>
            <input
              type="text"
              placeholder="F.eks. Vennerabat, MobilePay..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:outline-hidden focus:border-stone-500"
            />
          </div>
        </div>

        {/* Submit & Cancel */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 text-xs font-semibold rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Annuller
          </button>
          <button
            type="submit"
            className="flex-2 py-3 px-4 text-xs font-medium rounded-xl text-stone-100 bg-stone-900 hover:bg-stone-800 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <QuickAddFormInner
        onClose={onClose}
        initialQuantity={initialQuantity}
        initialIsContactGroup={initialIsContactGroup}
      />
    </div>
  );
};
