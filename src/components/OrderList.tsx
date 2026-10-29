'use client';

import React, { useState, useMemo } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import { EditOrderModal } from './EditOrderModal';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Layers,
  Users,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderListProps {
  filterUnpaidOnly: boolean;
  onToggleFilterUnpaid: () => void;
  onOpenQuickAdd: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  filterUnpaidOnly,
  onToggleFilterUnpaid,
  onOpenQuickAdd,
}) => {
  const { orders, togglePaymentStatus, deleteOrder, markAllAsPaid } = usePrintStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);

  // Filter and search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Unpaid filter
      if (filterUnpaidOnly && order.isPaid) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = order.customerName.toLowerCase().includes(q);
        const notesMatch = (order.notes || '').toLowerCase().includes(q);
        const tonerMatch = (order.tonerNameText || '').toLowerCase().includes(q);
        if (!nameMatch && !notesMatch && !tonerMatch) return false;
      }
      return true;
    });
  }, [orders, filterUnpaidOnly, searchQuery]);

  const unpaidCount = orders.filter((o) => !o.isPaid).length;

  const handleTogglePaid = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    togglePaymentStatus(order.id);
    const nextStatus = !order.isPaid;
    if (nextStatus) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
      showToast(`🎉 ${order.customerName} er markeret som BETALT (${formatCurrency(order.totalPrice)})`);
    } else {
      showToast(`${order.customerName} er markeret som udestående betaling`, 'info');
    }
  };

  const handleDelete = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Vil du slette ordren for ${order.customerName}?`)) {
      deleteOrder(order.id);
      showToast(`Ordren for ${order.customerName} blev slettet`);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      
      {/* Top Bar: Search, Filters, and Actions */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        
        {/* Title & Counter */}
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Ordre-oversigt
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'ordre' : 'ordrer'}
          </span>
          {unpaidCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              {unpaidCount} udestående
            </span>
          )}
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative flex-1 sm:w-60 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Søg kunde, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter button: Vis kun manglende betalinger */}
          <button
            onClick={onToggleFilterUnpaid}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filterUnpaidOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Kun manglende</span>
            {unpaidCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filterUnpaidOnly ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'
              }`}>
                {unpaidCount}
              </span>
            )}
          </button>

          {/* Mark all as paid if unpaid exists */}
          {unpaidCount > 0 && (
            <button
              onClick={() => {
                markAllAsPaid();
                showToast('Alle ordrer er nu markeret som betalt!');
              }}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800 transition-colors"
              title="Marker alle udestående som betalt på én gang"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Marker alle betalt</span>
            </button>
          )}
        </div>

      </div>

      {/* Modern Responsive Table (follows modern-web-guidance: role="region", tabindex="0", sticky headers) */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Tabel over fotoprint ordrer"
        className="overflow-x-auto focus:outline-hidden max-h-[600px] overflow-y-auto"
      >
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold">Ingen ordrer fundet</p>
            <p className="text-xs mt-1">
              {filterUnpaidOnly
                ? 'Der er ingen udestående betalinger lige nu! Alle kunder har betalt.'
                : 'Prøv at ændre dine søgekriterier eller opret en ny ordre.'}
            </p>
            {filterUnpaidOnly ? (
              <button
                onClick={onToggleFilterUnpaid}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100"
              >
                Vis alle ordrer
              </button>
            ) : (
              <button
                onClick={onOpenQuickAdd}
                className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Opret første ordre</span>
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">Liste over alle kunders printordrer</caption>
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 backdrop-blur-xs">
              <tr>
                <th scope="col" className="py-3 px-4">Kunde</th>
                <th scope="col" className="py-3 px-3 text-center">Antal</th>
                <th scope="col" className="py-3 px-3 text-right">Stk. pris</th>
                <th scope="col" className="py-3 px-4 text-right">Pris i alt</th>
                <th scope="col" className="py-3 px-4 text-center">
                  Betalt? (1-klik)
                </th>
                <th scope="col" className="py-3 px-4">Toner & Noter</th>
                <th scope="col" className="py-3 px-3 text-center">Dato</th>
                <th scope="col" className="py-3 px-3 text-right">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredOrders.map((order) => {
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderForEdit(order)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    {/* Kunde Navn */}
                    <th scope="row" className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{order.customerName}</span>
                        {order.isContactGroup && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                            <Users className="w-2.5 h-2.5" />
                            <span>Kontakt</span>
                          </span>
                        )}
                      </div>
                    </th>

                    {/* Antal */}
                    <td className="py-3.5 px-3 text-center font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {order.quantity} <span className="text-[10px] font-normal text-slate-500">stk</span>
                    </td>

                    {/* Stk. pris */}
                    <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                      {order.unitPrice.toString().replace('.', ',')} kr.
                    </td>

                    {/* Pris i alt */}
                    <td className="py-3.5 px-4 text-right tabular-nums text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(order.totalPrice)}
                    </td>

                    {/* Interactive 1-click Betalt Badge:
                        Grøn for Ja, Rød for Nej.
                        Designed for instant 1-tap on mobile or desktop! */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePaid(order, e)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all transform active:scale-95 shadow-xs cursor-pointer select-none ${
                          order.isPaid
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white ring-2 ring-emerald-500/20'
                            : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-600/30 animate-pulse'
                        }`}
                        title={
                          order.isPaid
                            ? 'Klik for at markere som ubetalt (Nej)'
                            : 'Klik for at markere som betalt (Ja) med ét klik!'
                        }
                      >
                        {order.isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ja</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Nej</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Toner & Noter */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col gap-0.5 max-w-[220px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{order.tonerNameText || 'Standard'}</span>
                        </span>
                        {order.notes && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic truncate" title={order.notes}>
                            {order.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dato */}
                    <td className="py-3.5 px-3 text-center text-[11px] text-slate-500 tabular-nums">
                      {order.date}
                    </td>

                    {/* Handlinger */}
                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrderForEdit(order)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="Rediger ordre"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(order, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Slet ordre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Order Modal */}
      <EditOrderModal
        order={selectedOrderForEdit}
        isOpen={!!selectedOrderForEdit}
        onClose={() => setSelectedOrderForEdit(null)}
      />

    </section>
  );
};
