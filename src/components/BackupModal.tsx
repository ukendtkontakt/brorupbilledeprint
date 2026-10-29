'use client';

import React, { useRef, useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import {
  X,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { exportJson, importJson, exportCsv, resetToDefaults } = usePrintStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importJson(content);
      if (res.success) {
        showToast('Backup data importeret med succes!');
        onClose();
      } else {
        showToast(res.error || 'Fejl ved indlæsning af fil', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again if needed
    e.target.value = '';
  };

  const handleManualImport = () => {
    if (!jsonText.trim()) {
      showToast('Indsæt venligst JSON data i tekstfeltet', 'error');
      return;
    }
    const res = importJson(jsonText);
    if (res.success) {
      showToast('Backup data importeret med succes!');
      onClose();
    } else {
      showToast(res.error || 'Ugyldig JSON data', 'error');
    }
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    showToast('Appen er nulstillet til startdataene (Folke, Teng, Johannes)');
    setShowConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Data, Eksport & Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data gemmes automatisk i din browser (LocalStorage)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          
          {/* Quick Export Cards */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Download Backup & Regneark
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* JSON Export */}
              <button
                type="button"
                onClick={() => {
                  exportJson();
                  showToast('JSON backup fil downloadet!');
                }}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-750 transition-all text-left flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Eksporter JSON
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Gemmer alle ordrer, tonere og indstillinger i én backupfil.
                  </div>
                </div>
              </button>

              {/* CSV Export */}
              <button
                type="button"
                onClick={() => {
                  exportCsv();
                  showToast('Excel CSV fil downloadet!');
                }}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50/50 dark:hover:bg-slate-750 transition-all text-left flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Eksporter til Excel (CSV)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Klar til regneark med dato, kunde, pris, betalt og toner.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Import JSON Section */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Gendan fra JSON Backup
            </label>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Vælg JSON backupfil fra computer</span>
              </button>
            </div>

            <div className="text-center text-xs text-slate-400 my-1">— eller indsæt rå JSON tekst —</div>

            <textarea
              rows={3}
              placeholder='Indsæt backup JSON her {"version": "1.0", ...}'
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {jsonText.trim() && (
              <button
                type="button"
                onClick={handleManualImport}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                Indlæs JSON tekst
              </button>
            )}
          </div>

          {/* Reset to Default Data */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            {showConfirmReset ? (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Er du sikker på, at du vil nulstille?</span>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  Dette vil overskrive dine nuværende data og genindlæse de 4 oprindelige testordrer (Folke, Teng, Johannes) og standard tonere.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                  >
                    Ja, genindlæs startdata
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100"
                  >
                    Annuller
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Fabriksindstillinger
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Genindlæs regnearkets oprindelige startdata
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Genindlæs startdata</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
