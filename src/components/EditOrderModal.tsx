'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { Order, OrderTonerBreakdown } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Layers,
  Split,
  Plus,
  Check,
  Calendar,
} from 'lucide-react';

interface EditOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

interface EditFormInnerProps {
  order: Order;
  onClose: () => void;
}

function EditOrderFormInner({ order, onClose }: EditFormInnerProps) {
  const { updateOrder, deleteOrder, toners, activeToner } = usePrintStore();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(order.customerName);
  const [quantity, setQuantity] = useState<number>(order.quantity);

  // Decimal price input string supporting comma e.g. "4,7"
  const [priceInput, setPriceInput] = useState<string>(() =>
    order.unitPrice.toString().replace('.', ',')
  );

  const [isPaid, setIsPaid] = useState<boolean>(order.isPaid);
  const [isContactGroup, setIsContactGroup] = useState<boolean>(order.isContactGroup);
  const [date, setDate] = useState<string>(order.date);
  const [notes, setNotes] = useState<string>(order.notes || '');

  // Toner management (supports splitting on multiple toners)
  const defaultTonerId = activeToner?.id || toners[0]?.id || '';
  const hasExistingBreakdown = Boolean(order.tonerBreakdown && order.tonerBreakdown.length > 0);
  const [isMultiToner, setIsMultiToner] = useState<boolean>(
    hasExistingBreakdown && (order.tonerBreakdown?.length || 0) > 1
  );

  const [singleTonerId, setSingleTonerId] = useState<string>(() => {
    if (order.tonerBreakdown && order.tonerBreakdown.length === 1) {
      return order.tonerBreakdown[0].tonerId;
    }
    // Match by name in tonerNameText if possible
    const match = toners.find((t) => order.tonerNameText.includes(t.name));
    return match ? match.id : defaultTonerId;
  });

  const [tonerAllocations, setTonerAllocations] = useState<OrderTonerBreakdown[]>(() => {
    if (order.tonerBreakdown && order.tonerBreakdown.length > 0) {
      return order.tonerBreakdown;
    }
    return [{ tonerId: defaultTonerId, count: order.quantity }];
  });

  // Parse price safely
  const parsedUnitPrice = (() => {
    const clean = priceInput.replace(',', '.').trim();
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  })();

  const totalPrice = Math.round(quantity * parsedUnitPrice * 100) / 100;

  // Multi-toner helpers
  const totalAllocated = isMultiToner
    ? tonerAllocations.reduce((sum, item) => sum + (Number(item.count) || 0), 0)
    : quantity;
  const allocationDiff = quantity - totalAllocated;

  const handleToggleMultiToner = (enable: boolean) => {
    setIsMultiToner(enable);
    if (enable && tonerAllocations.length <= 1) {
      const currentId = singleTonerId || defaultTonerId;
      const otherToner = toners.find((t) => t.id !== currentId) || toners[0];
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
      showToast('Kundenavn er påkrævet', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('Antal skal være mindst 1 print', 'error');
      return;
    }

    if (isMultiToner && allocationDiff !== 0) {
      showToast(
        allocationDiff > 0
          ? `Du mangler at fordele ${allocationDiff} prints på tonerne`
          : `Du har fordelt ${Math.abs(allocationDiff)} prints for meget på tonerne`,
        'error'
      );
      return;
    }

    let finalBreakdown: OrderTonerBreakdown[] | undefined;
    let finalTonerName = order.tonerNameText;

    if (isMultiToner) {
      finalBreakdown = tonerAllocations.filter((a) => a.count > 0);
      finalTonerName = finalBreakdown
        .map((b) => {
          const t = toners.find((item) => item.id === b.tonerId);
          return `${t ? t.name : 'Toner'} (${b.count} stk)`;
        })
        .join(' / ');
    } else {
      const t = toners.find((item) => item.id === singleTonerId);
      finalBreakdown = t ? [{ tonerId: t.id, count: quantity }] : undefined;
      finalTonerName = t ? `${t.name} (${quantity} stk)` : `Toner (${quantity} stk)`;
    }

    updateOrder({
      ...order,
      customerName: customerName.trim(),
      quantity,
      unitPrice: parsedUnitPrice,
      totalPrice,
      isPaid,
      isContactGroup,
      tonerNameText: finalTonerName,
      tonerBreakdown: finalBreakdown,
      date,
      notes,
    });

    showToast(`Ordren for ${customerName} blev opdateret`);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Er du sikker på, at du vil slette ordren for ${order.customerName}?`)) {
      deleteOrder(order.id);
      showToast(`Ordren for ${order.customerName} blev slettet`);
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-stone-200 shadow-xl relative max-h-[92vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
        <h3 className="text-base sm:text-lg font-bold text-stone-900">
          Rediger ordre
        </h3>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
            Kunde Navn
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm font-semibold focus:outline-hidden focus:border-stone-500"
          />
        </div>

        {/* Quantity and Unit Price (supporting comma e.g. "4,7") */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Antal prints
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm font-bold focus:outline-hidden focus:border-stone-500 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Stk. pris (kr.)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="F.eks. 4,7 eller 5"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm font-bold focus:outline-hidden focus:border-stone-500 tabular-nums"
            />
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              Kan skrives med komma (f.eks. 4,7)
            </span>
          </div>
        </div>

        {/* Kontaktgruppe toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
          <span className="text-xs font-semibold text-stone-700">
            Kontaktgruppe (fast særpris)
          </span>
          <input
            type="checkbox"
            checked={isContactGroup}
            onChange={(e) => setIsContactGroup(e.target.checked)}
            className="rounded text-stone-900 w-4 h-4 accent-stone-900 cursor-pointer"
          />
        </div>

        {/* Total Price */}
        <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-between">
          <span className="text-xs font-medium text-stone-700">
            Samlet pris i alt:
          </span>
          <span className="text-base font-bold text-stone-900 tabular-nums">
            {formatCurrency(totalPrice)}
          </span>
        </div>

        {/* Payment Toggle */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
            Betalt status
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isPaid
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Ja (Betalt)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !isPaid
                  ? 'bg-rose-800 text-white border-rose-800'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-rose-300" />
              <span>Nej (Udestående)</span>
            </button>
          </div>
        </div>

        {/* Toner Allocation Section */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>Toner-fordeling</span>
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
            <div>
              <select
                value={singleTonerId}
                onChange={(e) => setSingleTonerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-medium focus:outline-hidden focus:border-stone-500"
              >
                {toners.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.status === 'active' ? '(Aktiv)' : t.status === 'finished' ? '(Færdig)' : '(Klar)'} ({t.printedCount} print)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2.5">
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
                        {t.name} {t.status === 'active' ? '(Aktiv)' : t.status === 'finished' ? '(Færdig)' : '(Klar)'}
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
                      <span>Mangler {allocationDiff} stk</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-800 font-medium bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <span>{Math.abs(allocationDiff)} stk for meget</span>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Noter
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:outline-hidden focus:border-stone-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center justify-between gap-2 border-t border-stone-100">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2.5 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Slet ordre</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 text-xs font-medium hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Annuller
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-medium shadow-xs transition-all cursor-pointer active:scale-[0.99]"
            >
              Gem ændringer
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <EditOrderFormInner key={order.id} order={order} onClose={onClose} />
    </div>
  );
};
