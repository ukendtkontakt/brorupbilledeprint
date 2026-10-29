'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import { X, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

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
  const { updateOrder, deleteOrder } = usePrintStore();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(order.customerName);
  const [quantity, setQuantity] = useState<number>(order.quantity);
  const [unitPrice, setUnitPrice] = useState<number>(order.unitPrice);
  const [isPaid, setIsPaid] = useState<boolean>(order.isPaid);
  const [isContactGroup, setIsContactGroup] = useState<boolean>(order.isContactGroup);
  const [tonerNameText, setTonerNameText] = useState<string>(order.tonerNameText);
  const [date, setDate] = useState<string>(order.date);
  const [notes, setNotes] = useState<string>(order.notes || '');

  const totalPrice = Math.round(quantity * unitPrice * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Kundenavn er påkrævet', 'error');
      return;
    }

    updateOrder({
      ...order,
      customerName: customerName.trim(),
      quantity,
      unitPrice,
      totalPrice,
      isPaid,
      isContactGroup,
      tonerNameText,
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
    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Rediger ordre
        </h3>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Kunde Navn
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Antal prints
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Stk. pris (kr.)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Kontaktgruppe toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Kontaktgruppe (5 kr./stk takst)
          </span>
          <input
            type="checkbox"
            checked={isContactGroup}
            onChange={(e) => setIsContactGroup(e.target.checked)}
            className="rounded text-blue-600 w-4 h-4"
          />
        </div>

        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
            Samlet pris i alt:
          </span>
          <span className="text-base font-black text-blue-700 dark:text-blue-300">
            {formatCurrency(totalPrice)}
          </span>
        </div>

        {/* Payment Toggle */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Betalt status
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                isPaid
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ja (Betalt)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                !isPaid
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Nej (Mangler)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Toner reference
            </label>
            <input
              type="text"
              value={tonerNameText}
              onChange={(e) => setTonerNameText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Dato
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
            Noter
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>

        <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Slet ordre</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Annuller
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <EditOrderFormInner key={order.id} order={order} onClose={onClose} />
    </div>
  );
};
