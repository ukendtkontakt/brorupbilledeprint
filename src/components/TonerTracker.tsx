'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { Toner } from '@/types';
import {
  Layers,
  Plus,
  Minus,
  Edit2,
  RotateCw,
  Clock,
  Trash2,
  CheckCircle2,
  Archive,
  Undo2,
} from 'lucide-react';

export const TonerTracker: React.FC = () => {
  const {
    toners,
    addToner,
    deleteToner,
    setTonerStatus,
    replaceActiveToner,
    adjustTonerCount,
    getNextTonerName,
  } = usePrintStore();
  const { showToast } = useToast();

  const [editingTonerId, setEditingTonerId] = useState<string | null>(null);
  const [manualCount, setManualCount] = useState<number>(0);
  const [isConfirmingSwitch, setIsConfirmingSwitch] = useState<boolean>(false);
  const [isAddingReady, setIsAddingReady] = useState<boolean>(false);
  const [newReadyName, setNewReadyName] = useState<string>('');

  const nextSequentialName = getNextTonerName();

  const activeToner = toners.find((t) => t.status === 'active');
  const readyToners = toners.filter((t) => t.status === 'ready');
  const finishedToners = toners.filter((t) => t.status === 'finished');

  const totalPrintsAcrossToners = toners.reduce((acc, t) => acc + t.printedCount, 0);

  const averageYield =
    finishedToners.length > 0
      ? Math.round(
          finishedToners.reduce((acc, t) => acc + t.printedCount, 0) /
            finishedToners.length
        )
      : null;

  const startEditCount = (toner: Toner) => {
    setEditingTonerId(toner.id);
    setManualCount(toner.printedCount);
  };

  const saveEditCount = (tonerId: string) => {
    const target = toners.find((t) => t.id === tonerId);
    if (target) {
      const delta = manualCount - target.printedCount;
      adjustTonerCount(tonerId, delta);
    }
    setEditingTonerId(null);
    showToast('Toner-tæller opdateret');
  };

  const handleExecuteSwitch = () => {
    if (!activeToner) return;
    const nextName = readyToners.length > 0 ? readyToners[0].name : nextSequentialName;
    replaceActiveToner(activeToner.id);
    setIsConfirmingSwitch(false);
    showToast(`${activeToner.name} er arkiveret. ${nextName} er sat i printeren!`);
  };

  const handleCreateReadyToner = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newReadyName.trim() || nextSequentialName;
    addToner(name);
    setNewReadyName('');
    setIsAddingReady(false);
    showToast(`${name} er lagt på reservelager`);
  };

  const handleDeleteToner = (toner: Toner) => {
    if (confirm(`Er du sikker på, at du vil slette ${toner.name}?`)) {
      deleteToner(toner.id);
      showToast(`${toner.name} blev slettet`);
    }
  };

  const handleReactivateToner = (toner: Toner) => {
    setTonerStatus(toner.id, 'active');
    showToast(`${toner.name} er genaktiveret som aktiv patron`);
  };

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Toner & Patronstyring
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 tabular-nums">
                {totalPrintsAcrossToners} prints samlet logget
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setNewReadyName(nextSequentialName);
            setIsAddingReady((prev) => !prev);
          }}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors border border-slate-200 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>Klargør reservepatron</span>
        </button>
      </div>

      {/* Inline Form to Add Ready Toner */}
      {isAddingReady && (
        <form
          onSubmit={handleCreateReadyToner}
          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2.5 animate-in fade-in duration-150"
        >
          <div className="text-xs font-semibold text-slate-700 shrink-0">
            Navn på ny patron:
          </div>
          <input
            type="text"
            value={newReadyName}
            onChange={(e) => setNewReadyName(e.target.value)}
            placeholder={nextSequentialName}
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
            autoFocus
          />
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsAddingReady(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Annuller
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
            >
              Gem på lager
            </button>
          </div>
        </form>
      )}

      {/* SECTION 1: HERO - AKTIV PATRON I PRINTEREN */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
          <span>Aktiv patron i printeren</span>
          <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Modtager nye ordrer
          </span>
        </div>

        {activeToner ? (
          <div className="rounded-2xl p-5 sm:p-6 bg-emerald-50/40 border border-emerald-300 ring-1 ring-emerald-300/30 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-2xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Aktiv i printer</span>
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">
                    {activeToner.name}
                  </h4>
                </div>

                {/* Print counter */}
                <div className="mt-3">
                  {editingTonerId === activeToner.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={manualCount}
                        onChange={(e) =>
                          setManualCount(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-900"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEditCount(activeToner.id)}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      >
                        Gem
                      </button>
                      <button
                        onClick={() => setEditingTonerId(null)}
                        className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Luk
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                        {activeToner.printedCount}{' '}
                        <span className="text-sm font-semibold text-slate-600">
                          prints
                        </span>
                      </div>

                      {/* +/- Quick adjustments for test prints */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustTonerCount(activeToner.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shadow-2xs"
                          title="Træk 1 print fra"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => adjustTonerCount(activeToner.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shadow-2xs"
                          title="Læg 1 print til (f.eks. testprint)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEditCount(activeToner)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer shadow-2xs"
                          title="Rediger tal manuelt"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Antal print produceret på denne patron indtil videre
                  </p>
                </div>
              </div>

              {/* Fast switch button */}
              <div className="sm:self-end">
                {!isConfirmingSwitch ? (
                  <button
                    onClick={() => setIsConfirmingSwitch(true)}
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Skift patron nu</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-sm space-y-2 animate-in fade-in duration-150">
                    <div className="text-xs font-bold text-slate-900">
                      Er patronen løbet tør?
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Arkiverer {activeToner.name} ({activeToner.printedCount} prints) og aktiverer{' '}
                      <b>{readyToners[0]?.name || nextSequentialName}</b>.
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleExecuteSwitch}
                        type="button"
                        className="px-3 py-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Bekræft skift
                      </button>
                      <button
                        onClick={() => setIsConfirmingSwitch(false)}
                        type="button"
                        className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Annuller
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
            <p className="text-xs text-slate-500 mb-2 font-medium">
              Ingen patron er markeret som aktiv lige nu.
            </p>
            <button
              onClick={() => {
                if (readyToners.length > 0) {
                  setTonerStatus(readyToners[0].id, 'active');
                } else {
                  addToner();
                }
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
            >
              Aktivér en patron
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: RESERVER PÅ LAGER (READY TONERS) */}
      {readyToners.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Klar på lager ({readyToners.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {readyToners.map((toner) => (
              <div
                key={toner.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-xs text-slate-800">
                      {toner.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {toner.printedCount} prints logget
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleReactivateToner(toner)}
                    type="button"
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors shadow-2xs"
                    title="Sæt som aktiv patron i printeren"
                  >
                    Sæt i printer
                  </button>
                  <button
                    onClick={() => handleDeleteToner(toner)}
                    type="button"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Slet patron"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: OPBRUGTE PATRONER (HISTORIK & REELT UDBYTTE) */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 text-slate-400" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Opbrugte patroner ({finishedToners.length})
            </h5>
          </div>

          {averageYield !== null && (
            <div className="text-xs px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100/90 text-indigo-900 font-bold">
              Gennemsnit: <span className="text-indigo-600 font-extrabold">{averageYield} prints</span> / patron
            </div>
          )}
        </div>

        {finishedToners.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {finishedToners.map((toner) => (
              <div
                key={toner.id}
                className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{toner.name}</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Holdt til: <span className="text-slate-900 font-bold">{toner.printedCount} prints</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleReactivateToner(toner)}
                    type="button"
                    className="p-1 text-slate-400 hover:text-emerald-700 rounded transition-colors cursor-pointer"
                    title="Gør aktiv igen (hvis markeret ved en fejl)"
                  >
                    <Undo2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteToner(toner)}
                    type="button"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Slet fra historik"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Ingen opbrugte patroner endnu. Når en patron løber tør, arkiveres den her med sit samlede printantal.
          </p>
        )}
      </div>
    </section>
  );
};
