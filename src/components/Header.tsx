'use client';

import React from 'react';
import { Printer, Plus, Settings, Database, CloudOff, LayoutGrid, Check } from 'lucide-react';
import { usePrintStore } from '@/context/PrintStoreContext';

interface HeaderProps {
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onToggleEditLayout: () => void;
  isEditingLayout: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickAdd,
  onOpenSettings,
  onOpenBackup,
  onToggleEditLayout,
  isEditingLayout,
}) => {
  const { isCloudConnected } = usePrintStore();

  return (
    <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Printer className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Billede Print Studio
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Regnskab, toner-tracker & fleksibelt layout
              </p>
            </div>
          </div>

          {/* Mobile Cloud / Local badge */}
          <div className="flex sm:hidden items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-white">
            {isCloudConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Sky-sync</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Lokal</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
          
          {/* Desktop Cloud Sync status indicator */}
          <div
            className={`hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border mr-1 ${
              isCloudConnected
                ? 'text-emerald-800 bg-emerald-50 border-emerald-200/80 font-semibold'
                : 'text-slate-600 bg-slate-100/90 border-slate-200 font-medium'
            }`}
            title={
              isCloudConnected
                ? 'Forbundet til Supabase: Ændringer opdateres live på tværs af PC og mobil!'
                : 'Kører lokalt i browseren. Tilføj Supabase keys i Vercel for at aktivere realtids-sync overalt.'
            }
          >
            {isCloudConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Sky-synkroniseret (PC & Mobil)</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Lokal lagring (LocalStorage)</span>
              </>
            )}
          </div>

          {/* Toggle Layout Mode button */}
          <button
            onClick={onToggleEditLayout}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 ${
              isEditingLayout
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
                : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/70'
            }`}
            title={isEditingLayout ? 'Afslut layout-tilstand' : 'Aktiver tilstand til at flytte rundt på firkanterne'}
          >
            {isEditingLayout ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Færdig</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Tilpas layout</span>
                <span className="md:hidden">Flyt</span>
              </>
            )}
          </button>

          {/* Backup / Export */}
          <button
            onClick={onOpenBackup}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
            title="Import/Eksport af data, CSV og backup"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Data & Backup</span>
            <span className="md:hidden">Data</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
            title="Omkostnings-indstillinger & formler"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Indstillinger</span>
            <span className="md:hidden">Priser</span>
          </button>

          {/* Primary Quick Add */}
          <button
            onClick={onOpenQuickAdd}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Opret ordre</span>
          </button>
        </div>

      </div>
    </header>
  );
};
