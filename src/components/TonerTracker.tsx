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
    showToast(`${toner.name} er markeret som færdig. Næste toner er aktiveret!`);
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
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Toner-Tracker & Forbrug
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                {totalPrintsAcrossToners} prints logget
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            addToner();
            showToast('Ny toner tilføjet til oversigten');
          }}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors border border-slate-200 shadow-2xs self-start sm:self-auto cursor-pointer"
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

          return (
            <div
              key={toner.id}
              className={`rounded-2xl p-4.5 border transition-all relative flex flex-col justify-between ${
                isFinished
                  ? 'bg-rose-50/70 border-rose-200 shadow-2xs'
                  : isActive
                  ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs ring-1 ring-emerald-300/40'
                  : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <div>
                {/* Status Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="font-bold text-slate-900 text-base">
                    {toner.name}
                  </div>

                  {isFinished && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-700 text-white shadow-2xs">
                      <AlertOctagon className="w-3 h-3" />
                      <span>Færdig</span>
                    </span>
                  )}

                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-200"></span>
                      <span>Aktiv</span>
                    </span>
                  )}

                  {isReady && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Klar</span>
                    </span>
                  )}
                </div>

                {/* Large Counter */}
                <div className="my-2">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Antal print på toner
                  </div>
                  
                  {editingTonerId === toner.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={manualCount}
                        onChange={(e) => setManualCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 px-2 py-1 rounded-lg border border-slate-300 bg-white text-base font-bold text-slate-900"
                      />
                      <button
                        onClick={() => saveEditCount(toner.id)}
                        className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      >
                        Gem
                      </button>
                      <button
                        onClick={() => setEditingTonerId(null)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Luk
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between mt-1">
                      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                        {toner.printedCount}{' '}
                        <span className="text-xs font-semibold text-slate-500">
                          prints
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustTonerCount(toner.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                          title="Træk 1 fra"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => adjustTonerCount(toner.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                          title="Læg 1 til"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => startEditCount(toner)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors ml-0.5 cursor-pointer"
                          title="Rediger tal manuelt"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes if available */}
                {toner.notes && (
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                    {toner.notes}
                  </p>
                )}
              </div>

              {/* Action Controls for this Toner */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2.5">
                {/* Fast Button for Active Toner */}
                {isActive && (
                  <button
                    onClick={() => handleFinishAndNext(toner)}
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl text-white bg-rose-700 hover:bg-rose-800 transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Marker som færdig & aktiver næste</span>
                  </button>
                )}

                {/* Status Switcher */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">Status:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(toner.id, 'active')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Aktiv
                    </button>
                    <button
                      onClick={() => handleStatusChange(toner.id, 'finished')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isFinished
                          ? 'bg-rose-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-800'
                      }`}
                    >
                      Færdig
                    </button>
                    <button
                      onClick={() => handleStatusChange(toner.id, 'ready')}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        isReady
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
