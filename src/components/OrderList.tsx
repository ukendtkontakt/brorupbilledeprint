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
      showToast(`${order.customerName} er markeret som betalt (${formatCurrency(order.totalPrice)})`);
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
    <section className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
      
      {/* Top Bar: Search, Filters, and Actions */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        
        {/* Title & Counter */}
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-stone-900">
            Ordre-oversigt
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-600">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'ordre' : 'ordrer'}
          </span>
          {unpaidCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              {unpaidCount} udestående
            </span>
          )}
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative flex-1 sm:w-60 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Søg kunde, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-400 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter button: Vis kun manglende betalinger */}
          <button
            onClick={onToggleFilterUnpaid}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
              filterUnpaidOnly
                ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-2xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Kun udestående</span>
            {unpaidCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                filterUnpaidOnly ? 'bg-stone-700 text-stone-100' : 'bg-amber-100 text-amber-900'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              title="Marker alle udestående som betalt på én gang"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Marker alle betalt</span>
            </button>
          )}
        </div>

      </div>

      {/* Modern Responsive Table */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Tabel over fotoprint ordrer"
        className="overflow-x-auto focus:outline-hidden max-h-[600px] overflow-y-auto"
      >
        {filteredOrders.length === 0 ? (
          <div className="py-14 text-center text-stone-500">
            <AlertCircle className="w-7 h-7 mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold text-stone-700">Ingen ordrer fundet</p>
            <p className="text-xs mt-1 text-stone-500">
              {filterUnpaidOnly
                ? 'Alle ordrer er betalt! Der er ingen udestående beløb.'
                : 'Prøv at ændre dine søgekriterier eller opret en ny ordre.'}
            </p>
            {filterUnpaidOnly ? (
              <button
                onClick={onToggleFilterUnpaid}
                className="mt-3.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 cursor-pointer"
              >
                Vis alle ordrer
              </button>
            ) : (
              <button
                onClick={onOpenQuickAdd}
                className="mt-3.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-100 bg-stone-900 hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Opret første ordre</span>
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">Liste over alle kunders printordrer</caption>
            <thead className="bg-stone-50/90 text-stone-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-stone-200 backdrop-blur-xs">
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
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredOrders.map((order) => {
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderForEdit(order)}
                    className="hover:bg-stone-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Kunde Navn */}
                    <th scope="row" className="py-3.5 px-4 font-semibold text-stone-900">
                      <div className="flex items-center gap-2">
                        <span>{order.customerName}</span>
                        {order.isContactGroup && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                            <Users className="w-2.5 h-2.5 text-stone-500" />
                            <span>Kontakt</span>
                          </span>
                        )}
                      </div>
                    </th>

                    {/* Antal */}
                    <td className="py-3.5 px-3 text-center font-bold text-stone-900 tabular-nums">
                      {order.quantity} <span className="text-[10px] font-normal text-stone-500">stk</span>
                    </td>

                    {/* Stk. pris */}
                    <td className="py-3.5 px-3 text-right tabular-nums text-stone-600">
                      {order.unitPrice.toString().replace('.', ',')} kr.
                    </td>

                    {/* Pris i alt */}
                    <td className="py-3.5 px-4 text-right tabular-nums text-sm font-bold text-stone-900">
                      {formatCurrency(order.totalPrice)}
                    </td>

                    {/* Interactive 1-click Betalt Badge:
                        Rolig salvie-grøn for Ja, behagelig terrakotta for Nej. */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePaid(order, e)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer select-none border ${
                          order.isPaid
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                        title={
                          order.isPaid
                            ? 'Markeret som betalt. Klik for at ændre til udestående.'
                            : 'Udestående betaling. Klik for at markere som betalt med 1 klik!'
                        }
                      >
                        {order.isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ja</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>Nej</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Toner & Noter */}
                    <td className="py-3.5 px-4 text-xs text-stone-500">
                      <div className="flex flex-col gap-0.5 max-w-[220px]">
                        <span className="font-medium text-stone-700 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{order.tonerNameText || 'Standard'}</span>
                        </span>
                        {order.notes && (
                          <span className="text-[11px] text-stone-400 italic truncate" title={order.notes}>
                            {order.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dato */}
                    <td className="py-3.5 px-3 text-center text-[11px] text-stone-500 tabular-nums">
                      {order.date}
                    </td>

                    {/* Handlinger */}
                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrderForEdit(order)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Rediger ordre"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(order, e)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
