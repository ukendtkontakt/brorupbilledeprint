'use client';

import React from 'react';
import { Printer, Plus, Settings, Database, CloudOff } from 'lucide-react';
import { usePrintStore } from '@/context/PrintStoreContext';

interface HeaderProps {
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickAdd,
  onOpenSettings,
  onOpenBackup,
}) => {
  const { isCloudConnected } = usePrintStore();

  return (
    <header className="border-b border-stone-200/80 bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-stone-100 shadow-xs">
              <Printer className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  Billede Print
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200/80">
                  Værksted
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Regnskab, toner-oversigt & afbetaling
              </p>
            </div>
          </div>

          {/* Mobile Cloud / Local badge */}
          <div className="flex sm:hidden items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-stone-200 bg-white">
            {isCloudConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Sky-sync</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                <CloudOff className="w-3 h-3 text-stone-400" />
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
                ? 'text-emerald-800 bg-emerald-50/70 border-emerald-200/70'
                : 'text-stone-600 bg-stone-100/80 border-stone-200'
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
                <span className="font-medium">Sky-synkroniseret (PC & Mobil)</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Lokal lagring (LocalStorage)</span>
              </>
            )}
          </div>

          {/* Backup / Export */}
          <button
            onClick={onOpenBackup}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 hover:border-stone-300 transition-colors border border-stone-200/80 shadow-2xs cursor-pointer"
            title="Import/Eksport af data, CSV og backup"
          >
            <Database className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden md:inline">Data & Backup</span>
            <span className="md:hidden">Data</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 hover:border-stone-300 transition-colors border border-stone-200/80 shadow-2xs cursor-pointer"
            title="Omkostnings-indstillinger & formler"
          >
            <Settings className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden md:inline">Indstillinger</span>
            <span className="md:hidden">Priser</span>
          </button>

          {/* Primary Quick Add */}
          <button
            onClick={onOpenQuickAdd}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl text-stone-100 bg-stone-900 hover:bg-stone-800 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Opret ordre</span>
          </button>
        </div>

      </div>
    </header>
  );
};
