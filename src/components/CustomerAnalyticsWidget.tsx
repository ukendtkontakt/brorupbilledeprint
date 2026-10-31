'use client';

import React, { useState, useMemo } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { formatCurrency } from '@/utils/calculations';
import { Users, Plus, Search, AlertCircle, CheckCircle2, Award } from 'lucide-react';

interface CustomerAnalyticsWidgetProps {
  onQuickAddForCustomer: (customerName: string, isContactGroup: boolean) => void;
}

export const CustomerAnalyticsWidget: React.FC<CustomerAnalyticsWidgetProps> = ({
  onQuickAddForCustomer,
}) => {
  const { orders } = usePrintStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'prints' | 'debt'>('revenue');

  // Aggregate stats per customer
  const customerList = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        totalPrints: number;
        totalRevenue: number;
        unpaidAmount: number;
        orderCount: number;
        isContactGroup: boolean;
        lastOrderDate: string;
      }
    >();

    orders.forEach((order) => {
      const name = order.customerName.trim() || 'Ukendt';
      const existing = map.get(name) || {
        name,
        totalPrints: 0,
        totalRevenue: 0,
        unpaidAmount: 0,
        orderCount: 0,
        isContactGroup: false,
        lastOrderDate: order.date,
      };

      existing.totalPrints += order.quantity;
      existing.totalRevenue += order.totalPrice;
      if (!order.isPaid) {
        existing.unpaidAmount += order.totalPrice;
      }
      if (order.isContactGroup) {
        existing.isContactGroup = true;
      }
      if (order.date > existing.lastOrderDate) {
        existing.lastOrderDate = order.date;
      }
      existing.orderCount += 1;

      map.set(name, existing);
    });

    let list = Array.from(map.values());

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (sortBy === 'prints') return b.totalPrints - a.totalPrints;
      return b.unpaidAmount - a.unpaidAmount;
    });

    return list;
  }, [orders, searchTerm, sortBy]);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Kunde-Oversigt & Hurtig-Genbestilling
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                  {customerList.length} kunder
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Se kundernes samlede køb og opret en ny ordre med 1 klik
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrer kunde..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-slate-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Sort Pills */}
        <div className="flex items-center gap-2 my-3 text-xs">
          <span className="text-slate-400 font-medium">Sorter efter:</span>
          <button
            type="button"
            onClick={() => setSortBy('revenue')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              sortBy === 'revenue'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mest omsat
          </button>
          <button
            type="button"
            onClick={() => setSortBy('prints')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              sortBy === 'prints'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Flest prints
          </button>
          <button
            type="button"
            onClick={() => setSortBy('debt')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              sortBy === 'debt'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Skylder penge
          </button>
        </div>

        {/* Customer Cards List */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {customerList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Ingen kunder matcher din søgning.
            </div>
          ) : (
            customerList.map((customer, idx) => (
              <div
                key={customer.name}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx === 0 ? <Award className="w-3.5 h-3.5 text-amber-600" /> : idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {customer.name}
                      </span>
                      {customer.isContactGroup && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Kontakt
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{customer.totalPrints} prints</span>
                      <span>•</span>
                      <span>{customer.orderCount} {customer.orderCount === 1 ? 'ordre' : 'ordrer'}</span>
                      <span>•</span>
                      <span>Senest: {customer.lastOrderDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  {/* Financials / Debt tag */}
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(customer.totalRevenue)}
                    </div>
                    {customer.unpaidAmount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <AlertCircle className="w-3 h-3" />
                        <span>Mangler {formatCurrency(customer.unpaidAmount)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Alt betalt</span>
                      </span>
                    )}
                  </div>

                  {/* 1-Click Quick Add Order Button */}
                  <button
                    type="button"
                    onClick={() => onQuickAddForCustomer(customer.name, customer.isContactGroup)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                    title={`Opret ny ordre for ${customer.name}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ny ordre</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Tryk på &quot;Ny ordre&quot; for at åbne ordreformularen udfyldt med kundens navn.</span>
      </div>
    </div>
  );
};
