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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-stone-200 shadow-xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Data, Eksport & Backup
              </h3>
              <p className="text-xs text-stone-500">
                Data gemmes automatisk i din browser (LocalStorage)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          
          {/* Quick Export Cards */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
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
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-stone-100 transition-all text-left flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    Eksporter JSON
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
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
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-stone-100 transition-all text-left flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    Eksporter til Excel (CSV)
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    Klar til regneark med dato, kunde, pris, betalt og toner.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Import JSON Section */}
          <div className="space-y-2.5 pt-3 border-t border-stone-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
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
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-stone-500" />
                <span>Vælg JSON backupfil fra computer</span>
              </button>
            </div>

            <div className="text-center text-xs text-stone-400 my-1">— eller indsæt rå JSON tekst —</div>

            <textarea
              rows={3}
              placeholder='Indsæt backup JSON her {"version": "1.0", ...}'
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono text-stone-800 focus:outline-hidden focus:border-stone-400"
            />
            {jsonText.trim() && (
              <button
                type="button"
                onClick={handleManualImport}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-medium transition-colors cursor-pointer"
              >
                Indlæs JSON tekst
              </button>
            )}
          </div>

          {/* Reset to Default Data */}
          <div className="pt-3 border-t border-stone-100">
            {showConfirmReset ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Er du sikker på, at du vil nulstille?</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Dette vil overskrive dine nuværende data og genindlæse de 4 oprindelige testordrer (Folke, Teng, Johannes) og standard tonere.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Ja, genindlæs startdata
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 border border-stone-200 cursor-pointer"
                  >
                    Annuller
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-stone-800">
                    Fabriksindstillinger
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Genindlæs regnearkets oprindelige startdata
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
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
