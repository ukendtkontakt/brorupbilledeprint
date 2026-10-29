'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { Toner, TonerStatus } from '@/types';
import {
  Layers,
  Plus,
  AlertOctagon,
  Clock,
  Minus,
  Edit2,
} from 'lucide-react';

export const TonerTracker: React.FC = () => {
  const {
    toners,
    addToner,
    setTonerStatus,
    markTonerFinishedAndActivateNext,
    adjustTonerCount,
  } = usePrintStore();
  const { showToast } = useToast();

  const [editingTonerId, setEditingTonerId] = useState<string | null>(null);
  const [manualCount, setManualCount] = useState<number>(0);

  const handleFinishAndNext = (toner: Toner) => {
    markTonerFinishedAndActivateNext(toner.id);
    showToast(`${toner.name} er nu markeret som FÆRDIG (Rød). Næste toner er aktiveret!`);
  };

  const handleStatusChange = (tonerId: string, newStatus: TonerStatus) => {
    setTonerStatus(tonerId, newStatus);
    showToast(`Status opdateret for toner.`);
  };

  const startEditCount = (toner: Toner) => {
    setEditingTonerId(toner.id);
    setManualCount(toner.printedCount);
  };

  const saveEditCount = (tonerId: string) => {
    const delta = manualCount - (toners.find((t) => t.id === tonerId)?.printedCount || 0);
    adjustTonerCount(tonerId, delta);
    setEditingTonerId(null);
    showToast('Toner tæller opdateret');
  };

  const totalPrintsAcrossToners = toners.reduce((acc, t) => acc + t.printedCount, 0);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Toner-Tracker & Forbrug
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {totalPrintsAcrossToners} prints logget
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Styr patroner & bånd. Nye ordrer tilføjes automatisk til den aktive toner.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            addToner();
            showToast('Ny toner tilføjet til oversigten');
          }}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tilføj ny toner</span>
        </button>
      </div>

      {/* Toner Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {toners.map((toner) => {
          const isFinished = toner.status === 'finished';
          const isActive = toner.status === 'active';
          const isReady = toner.status === 'ready';

          const pct = Math.min(100, Math.round((toner.printedCount / (toner.capacity || 108)) * 100));

          return (
            <div
              key={toner.id}
              className={`rounded-2xl p-4 border transition-all relative overflow-hidden flex flex-col justify-between ${
                isFinished
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/70 shadow-sm'
                  : isActive
                  ? 'bg-gradient-to-b from-blue-50/90 to-indigo-50/50 dark:from-slate-800 dark:to-slate-900 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Status Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="font-bold text-slate-900 dark:text-white text-base">
                    {toner.name}
                  </div>

                  {isFinished && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                      <AlertOctagon className="w-3 h-3" />
                      <span>Færdig (Rød)</span>
                    </span>
                  )}

                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      <span>Aktiv nu</span>
                    </span>
                  )}

                  {isReady && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      <Clock className="w-3 h-3" />
                      <span>Klar</span>
                    </span>
                  )}
                </div>

                {/* Explicit Requirement Notice for Finished Red status */}
                {isFinished && (
                  <div className="mb-3 px-2 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 border border-rose-200 dark:border-rose-800/80 text-[11px] font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Rød betyder den er færdig nu</span>
                  </div>
                )}

                {/* Active explanation */}
                {isActive && (
                  <div className="mb-3 px-2 py-1 rounded-lg bg-blue-100/70 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300">
                    Nye print-ordrer tilføjes automatisk her.
                  </div>
                )}

                {/* Large Counter */}
                <div className="my-2">
                  <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Antal print på toner
                  </div>
                  
                  {editingTonerId === toner.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={manualCount}
                        onChange={(e) => setManualCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 px-2 py-1 rounded border border-blue-500 bg-white dark:bg-slate-800 text-lg font-bold"
                      />
                      <button
                        onClick={() => saveEditCount(toner.id)}
                        className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Gem
                      </button>
                      <button
                        onClick={() => setEditingTonerId(null)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Annuller
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between mt-0.5">
                      <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                        {toner.printedCount}{' '}
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          / {toner.capacity || 108} stk
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustTonerCount(toner.id, -1)}
                          className="w-6 h-6 rounded bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 flex items-center justify-center text-slate-700 dark:text-slate-200"
                          title="Træk 1 fra"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => adjustTonerCount(toner.id, 1)}
                          className="w-6 h-6 rounded bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 flex items-center justify-center text-slate-700 dark:text-slate-200"
                          title="Læg 1 til"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => startEditCount(toner)}
                          className="w-6 h-6 rounded bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 flex items-center justify-center text-slate-500 dark:text-slate-400 ml-0.5"
                          title="Rediger tal manuelt"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFinished
                        ? 'bg-rose-500'
                        : isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Notes if available */}
                {toner.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 italic">
                    {toner.notes}
                  </p>
                )}
              </div>

              {/* Action Controls for this Toner */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                {/* Fast Button for Active Toner */}
                {isActive && (
                  <button
                    onClick={() => handleFinishAndNext(toner)}
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Marker som færdig & aktiver næste</span>
                  </button>
                )}

                {/* Status Switcher */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Skift status:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(toner.id, 'active')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Aktiv
                    </button>
                    <button
                      onClick={() => handleStatusChange(toner.id, 'finished')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        isFinished
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950'
                      }`}
                    >
                      Færdig (Rød)
                    </button>
                    <button
                      onClick={() => handleStatusChange(toner.id, 'ready')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        isReady
                          ? 'bg-slate-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Klar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
