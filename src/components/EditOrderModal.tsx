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

  // Toner management (supports streamlined splitting on two toners)
  const defaultTonerId = activeToner?.id || toners[0]?.id || '';
  const existingBreakdown = order.tonerBreakdown && order.tonerBreakdown.length > 0 ? order.tonerBreakdown : null;
  const isInitiallySplit = Boolean(existingBreakdown && existingBreakdown.length > 1);

  const [isSplitToner, setIsSplitToner] = useState<boolean>(isInitiallySplit);
  const [selectedTonerId, setSelectedTonerId] = useState<string>(() => {
    if (existingBreakdown && existingBreakdown[0]) return existingBreakdown[0].tonerId;
    const match = toners.find((t) => order.tonerNameText.includes(t.name));
    return match ? match.id : defaultTonerId;
  });

  const [printsOnFirstToner, setPrintsOnFirstToner] = useState<number>(() => {
    if (existingBreakdown && existingBreakdown[0]) return existingBreakdown[0].count;
    return Math.max(1, Math.min(14, quantity - 1));
  });

  const [secondTonerId, setSecondTonerId] = useState<string>(() => {
    if (existingBreakdown && existingBreakdown[1]) return existingBreakdown[1].tonerId;
    const other = toners.find((t) => t.id !== selectedTonerId);
    return other?.id || toners[0]?.id || '';
  });

  // Parse price safely
  const parsedUnitPrice = (() => {
    const clean = priceInput.replace(',', '.').trim();
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  })();

  const totalPrice = Math.round(quantity * parsedUnitPrice * 100) / 100;

  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);
    if (printsOnFirstToner >= validQty) {
      setPrintsOnFirstToner(Math.max(1, validQty - 1));
    }
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

    let finalBreakdown: OrderTonerBreakdown[] | undefined;
    let finalTonerName = order.tonerNameText;

    if (isSplitToner && quantity > 1) {
      const firstCount = Math.max(1, Math.min(printsOnFirstToner, quantity - 1));
      const secondCount = quantity - firstCount;

      finalBreakdown = [
        { tonerId: selectedTonerId, count: firstCount },
        { tonerId: secondTonerId, count: secondCount },
      ];

      const t1 = toners.find((t) => t.id === selectedTonerId);
      const t2 = toners.find((t) => t.id === secondTonerId);
      finalTonerName = `${t1 ? t1.name : 'Toner'} (${firstCount} stk) / ${t2 ? t2.name : 'Toner'} (${secondCount} stk)`;
    } else {
      const t = toners.find((item) => item.id === selectedTonerId);
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
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
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
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Toner-forbrug</span>
            </label>

            {quantity > 1 && (
              <button
                type="button"
                onClick={() => {
                  const nextSplit = !isSplitToner;
                  setIsSplitToner(nextSplit);
                  if (nextSplit) {
                    setPrintsOnFirstToner(Math.max(1, Math.min(14, quantity - 1)));
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  isSplitToner
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>{isSplitToner ? 'Opdelt på 2 patroner' : 'Opdel på 2 patroner?'}</span>
              </button>
            )}
          </div>

          {!isSplitToner ? (
            <div>
              <select
                value={selectedTonerId}
                onChange={(e) => setSelectedTonerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              >
                {toners.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.status === 'active' ? '(Aktiv)' : t.status === 'finished' ? '(Færdig)' : '(Klar)'} ({t.printedCount} print)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                {/* Patron 1 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Første patron</span>
                    <span className="text-[11px] text-slate-500 font-semibold">{printsOnFirstToner} stk</span>
                  </div>

                  <select
                    value={selectedTonerId}
                    onChange={(e) => setSelectedTonerId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs font-medium"
                  >
                    {toners.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      Antal prints:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max={quantity - 1}
                        value={printsOnFirstToner}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setPrintsOnFirstToner(Math.max(1, Math.min(val, quantity - 1)));
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 tabular-nums"
                      />
                      <span className="text-xs text-slate-500">stk</span>
                    </div>
                  </div>
                </div>

                {/* Patron 2 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Anden patron</span>
                    <span className="text-[11px] text-slate-500 font-semibold">{quantity - printsOnFirstToner} stk</span>
                  </div>

                  <select
                    value={secondTonerId}
                    onChange={(e) => setSecondTonerId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs font-medium"
                  >
                    {toners.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <div className="text-[11px] text-slate-500 pt-2 font-medium">
                    Resten (<b>{quantity - printsOnFirstToner} prints</b>) registreres automatisk her.
                  </div>
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
