'use client';

import React from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { formatCurrency, formatNumber } from '@/utils/calculations';
import {
  TrendingUp,
  AlertCircle,
  Layers,
  CircleDollarSign,
  Filter,
} from 'lucide-react';

interface PrimaryKpiCardsProps {
  filterUnpaidOnly: boolean;
  onToggleFilterUnpaid: () => void;
}

export const PrimaryKpiCards: React.FC<PrimaryKpiCardsProps> = ({
  filterUnpaidOnly,
  onToggleFilterUnpaid,
}) => {
  const { kpis } = usePrintStore();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Omsat */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Omsat i alt
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CircleDollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(kpis.totalRevenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-emerald-700 font-medium">
              Modtaget: {formatCurrency(kpis.paidRevenue)}
            </span>
            <span>
              Mangler: {formatCurrency(kpis.outstandingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Profit minus slid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative flex flex-col justify-between transition-all hover:border-emerald-300 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Profit minus slid
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700 tabular-nums">
            {formatCurrency(kpis.profitMinusWear)}
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2 truncate">
            Slid: {formatCurrency(kpis.totalWearCost)} ({formatNumber(kpis.costPerPrint, 2)} kr./print)
          </div>
        </div>
      </div>

      {/* 3. Printet i alt */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Printet i alt
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {kpis.totalPrints} <span className="text-sm font-semibold text-slate-500">stk</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
            Gns. {kpis.totalPrints > 0 ? formatCurrency(kpis.totalRevenue / kpis.totalPrints) : '0 kr.'} pr. print
          </div>
        </div>
      </div>

      {/* 4. Udestående (Skyldnere) */}
      <div
        onClick={onToggleFilterUnpaid}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggleFilterUnpaid();
        }}
        className={`cursor-pointer rounded-2xl p-5 border shadow-xs relative flex flex-col justify-between transition-all select-none ${
          filterUnpaidOnly
            ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-300/50'
            : kpis.outstandingAmount > 0
            ? 'bg-amber-50/70 border-amber-300/80 hover:border-amber-400 hover:bg-amber-50'
            : 'bg-white border-slate-200/90 hover:border-slate-300'
        }`}
        title="Klik for at filtrere ordrer med udestående betaling"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Udestående
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              kpis.outstandingAmount > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
            kpis.outstandingAmount > 0 ? 'text-amber-900' : 'text-slate-900'
          }`}>
            {formatCurrency(kpis.outstandingAmount)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs border-t border-slate-100 pt-2">
            <span className={kpis.outstandingAmount > 0 ? 'text-amber-800 font-semibold' : 'text-slate-500'}>
              {kpis.unpaidOrdersCount} ordre{kpis.unpaidOrdersCount === 1 ? '' : 'r'} mangler
            </span>
            <span className="text-xs font-semibold text-slate-700 underline decoration-slate-300 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              {filterUnpaidOnly ? 'Nulstil filter' : 'Filtrer liste'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
