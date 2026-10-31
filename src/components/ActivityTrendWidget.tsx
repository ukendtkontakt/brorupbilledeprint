'use client';

import React, { useState, useMemo } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { formatCurrency, formatNumber } from '@/utils/calculations';
import { BarChart3, Calendar, ArrowUpRight } from 'lucide-react';

type MetricType = 'revenue' | 'prints' | 'profit';

export const ActivityTrendWidget: React.FC = () => {
  const { orders, settings } = usePrintStore();
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const costPerPrint = useMemo(() => {
    const totalCost = settings.paperPackPrice * settings.packsPerPurchase + settings.shippingPrice;
    const totalPrints = settings.packsPerPurchase * settings.printsPerPack;
    return totalPrints > 0 ? totalCost / totalPrints : 1.75;
  }, [settings]);

  // Aggregate orders by date (or customer if few dates)
  const aggregatedData = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; prints: number; profit: number; orderCount: number }>();

    // Process from oldest to newest for chronological flow
    const sorted = [...orders].sort((a, b) => a.createdAt - b.createdAt);

    sorted.forEach((order) => {
      const dateKey = order.date || 'Tidligere';
      const existing = map.get(dateKey) || {
        date: dateKey,
        revenue: 0,
        prints: 0,
        profit: 0,
        orderCount: 0,
      };

      const wear = order.quantity * costPerPrint;
      const profit = order.totalPrice - wear;

      existing.revenue += order.totalPrice;
      existing.prints += order.quantity;
      existing.profit += profit;
      existing.orderCount += 1;

      map.set(dateKey, existing);
    });

    return Array.from(map.values());
  }, [orders, costPerPrint]);

  // Find max for bar scaling
  const maxValue = useMemo(() => {
    if (aggregatedData.length === 0) return 100;
    const values = aggregatedData.map((d) => {
      if (metric === 'revenue') return d.revenue;
      if (metric === 'prints') return d.prints;
      return d.profit;
    });
    return Math.max(...values, 10);
  }, [aggregatedData, metric]);

  const totalRev = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalPrints = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalWear = totalPrints * costPerPrint;
  const totalProfit = totalRev - totalWear;
  const profitMarginPct = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
  const avgOrderValue = orders.length > 0 ? totalRev / orders.length : 0;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header with Title and Metric Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Aktivitet & Økonomisk Udvikling
              </h3>
              <p className="text-xs text-slate-500">
                Interaktiv visualisering over dine ordrer fordelt over tid
              </p>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metric === 'revenue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omsætning
            </button>
            <button
              type="button"
              onClick={() => setMetric('profit')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metric === 'profit'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profit
            </button>
            <button
              type="button"
              onClick={() => setMetric('prints')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metric === 'prints'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Antal print
            </button>
          </div>
        </div>

        {/* High Level Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gns. ordreværdi
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
              {formatCurrency(avgOrderValue)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <span>Fortjeneste-grad</span>
              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-emerald-700 tabular-nums mt-0.5">
              {formatNumber(profitMarginPct, 1)}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Aktive ordredatoer
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
              {aggregatedData.length} <span className="text-xs font-normal text-slate-500">dage</span>
            </div>
          </div>
        </div>

        {/* Interactive Visual Bar Chart */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center justify-between">
            <span>Udvikling pr. dato:</span>
            {hoveredDate && (
              <span className="text-xs font-bold text-indigo-600">
                Aktiv dato: {hoveredDate}
              </span>
            )}
          </div>

          {aggregatedData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Ingen ordrer at vise endnu.
            </div>
          ) : (
            <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-200 bg-slate-50/50 rounded-xl overflow-x-auto">
              {aggregatedData.map((item, idx) => {
                const currentVal =
                  metric === 'revenue'
                    ? item.revenue
                    : metric === 'profit'
                    ? item.profit
                    : item.prints;

                const heightPct = Math.max(12, Math.round((currentVal / maxValue) * 100));

                const barColor =
                  metric === 'profit'
                    ? 'bg-gradient-to-t from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300'
                    : metric === 'revenue'
                    ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300'
                    : 'bg-gradient-to-t from-slate-700 to-slate-500 hover:from-slate-600 hover:to-slate-400';

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDate(item.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className="flex-1 min-w-[50px] max-w-[90px] flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Floating Value Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold text-slate-800 tabular-nums whitespace-nowrap mb-1">
                      {metric === 'prints' ? `${item.prints} stk` : formatCurrency(currentVal)}
                    </div>

                    {/* Bar Pillar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${barColor} shadow-2xs group-hover:scale-y-105 origin-bottom`}
                    />

                    {/* Date label */}
                    <div className="text-[10px] text-slate-500 mt-2 truncate w-full text-center font-medium">
                      {item.date}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Opgjort på tværs af alle registrerede prints ({totalPrints} stk)</span>
        </span>
        <span className="font-semibold text-slate-700">
          Samlet profit: {formatCurrency(totalProfit)}
        </span>
      </div>
    </div>
  );
};
