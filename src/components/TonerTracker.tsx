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
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                Toner-Tracker & Forbrug
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-600">
                {totalPrintsAcrossToners} prints logget
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Nye ordrer tilføjes automatisk til den aktive toner
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            addToner();
            showToast('Ny toner tilføjet til oversigten');
          }}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 hover:border-stone-300 transition-colors border border-stone-200/80 shadow-2xs self-start sm:self-auto cursor-pointer"
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
              className={`rounded-2xl p-4.5 border transition-all relative flex flex-col justify-between ${
                isFinished
                  ? 'bg-[#FDF7F5] border-rose-200/90 shadow-2xs'
                  : isActive
                  ? 'bg-[#F4F7F4] border-emerald-300 shadow-2xs ring-1 ring-emerald-300/40'
                  : 'bg-stone-50/70 border-stone-200/80'
              }`}
            >
              <div>
                {/* Status Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="font-bold text-stone-900 text-base">
                    {toner.name}
                  </div>

                  {isFinished && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-700 text-white shadow-2xs">
                      <AlertOctagon className="w-3 h-3" />
                      <span>Færdig (Rød)</span>
                    </span>
                  )}

                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-800 text-white shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-200"></span>
                      <span>Aktiv</span>
                    </span>
                  )}

                  {isReady && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-200/80 text-stone-600">
                      <Clock className="w-3 h-3 text-stone-500" />
                      <span>Klar</span>
                    </span>
                  )}
                </div>

                {/* Explicit Requirement Notice for Finished Red status */}
                {isFinished && (
                  <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-rose-100/60 border border-rose-200 text-[11px] font-medium text-rose-800 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Rød betyder den er færdig nu</span>
                  </div>
                )}

                {/* Active explanation */}
                {isActive && (
                  <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-emerald-100/60 border border-emerald-200/80 text-[11px] text-emerald-900">
                    Nye ordrer tilføjes automatisk her.
                  </div>
                )}

                {/* Large Counter */}
                <div className="my-2">
                  <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                    Antal print på toner
                  </div>
                  
                  {editingTonerId === toner.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={manualCount}
                        onChange={(e) => setManualCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 px-2 py-1 rounded-lg border border-stone-400 bg-white text-base font-bold text-stone-900"
                      />
                      <button
                        onClick={() => saveEditCount(toner.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-stone-900 text-stone-100 rounded-lg hover:bg-stone-800"
                      >
                        Gem
                      </button>
                      <button
                        onClick={() => setEditingTonerId(null)}
                        className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800"
                      >
                        Luk
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between mt-1">
                      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 tabular-nums">
                        {toner.printedCount}{' '}
                        <span className="text-xs font-normal text-stone-500">
                          / {toner.capacity || 108} stk
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustTonerCount(toner.id, -1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                          title="Træk 1 fra"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => adjustTonerCount(toner.id, 1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                          title="Læg 1 til"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => startEditCount(toner)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors ml-0.5 cursor-pointer"
                          title="Rediger tal manuelt"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFinished
                        ? 'bg-rose-500'
                        : isActive
                        ? 'bg-emerald-600'
                        : 'bg-stone-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Notes if available */}
                {toner.notes && (
                  <p className="text-[11px] text-stone-500 mt-2 line-clamp-2 italic">
                    {toner.notes}
                  </p>
                )}
              </div>

              {/* Action Controls for this Toner */}
              <div className="mt-4 pt-3 border-t border-stone-200/60 space-y-2.5">
                {/* Fast Button for Active Toner */}
                {isActive && (
                  <button
                    onClick={() => handleFinishAndNext(toner)}
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl text-white bg-rose-700 hover:bg-rose-800 transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Marker som færdig & aktiver næste</span>
                  </button>
                )}

                {/* Status Switcher */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 text-[11px]">Skift status:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(toner.id, 'active')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Aktiv
                    </button>
                    <button
                      onClick={() => handleStatusChange(toner.id, 'finished')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        isFinished
                          ? 'bg-rose-700 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-rose-100 hover:text-rose-800'
                      }`}
                    >
                      Færdig (Rød)
                    </button>
                    <button
                      onClick={() => handleStatusChange(toner.id, 'ready')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        isReady
                          ? 'bg-stone-700 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
