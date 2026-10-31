'use client';

import React, { useState } from 'react';
import { DashboardWidgetConfig, DashboardWidgetId } from '@/types';
import {
  X,
  LayoutGrid,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  MoveDown,
} from 'lucide-react';

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  onSaveWidgets: (updated: DashboardWidgetConfig[]) => void;
  onResetToDefaults: () => void;
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onSaveWidgets,
  onResetToDefaults,
}) => {
  const [list, setList] = useState<DashboardWidgetConfig[]>(() => [...widgets]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= list.length) return;
    const copy = [...list];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    setList(copy);
  };

  const handleToggleEnable = (id: DashboardWidgetId) => {
    setList((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleSendToBottom = (id: DashboardWidgetId) => {
    const idx = list.findIndex((w) => w.id === id);
    if (idx !== -1) {
      handleMove(idx, list.length - 1);
    }
  };

  const handleSave = () => {
    onSaveWidgets(list);
    onClose();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    handleMove(draggedIdx, index);
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Tilpas Dashboard & Rækkefølge
              </h3>
              <p className="text-xs text-slate-500">
                Arrangér firkanterne som du foretrækker og skjul/vis moduler
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick actions info */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-xs text-indigo-900 flex items-center justify-between">
          <span>
            💡 <strong>Tip:</strong> Du kan trække modulerne eller bruge pilene op/ned.
          </span>
          <button
            type="button"
            onClick={() => handleSendToBottom('printer_payoff')}
            className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
          >
            <MoveDown className="w-3 h-3" />
            <span>Send printer-afbetaling nederst</span>
          </button>
        </div>

        {/* Movable Items List */}
        <div className="space-y-2 mt-4 max-h-[380px] overflow-y-auto pr-1">
          {list.map((widget, idx) => (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                draggedIdx === idx
                  ? 'bg-indigo-50 border-indigo-400 opacity-60'
                  : widget.enabled
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-slate-100/60 border-slate-200 opacity-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600"
                  title="Træk for at flytte"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {widget.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {widget.description}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleEnable(widget.id)}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    widget.enabled
                      ? 'text-slate-600 hover:bg-slate-200'
                      : 'text-slate-400 hover:bg-slate-200'
                  }`}
                  title={widget.enabled ? 'Skjul modul' : 'Vis modul'}
                >
                  {widget.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Move Up */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, idx - 1)}
                  className={`p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors ${
                    idx === 0 ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Flyt op"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  disabled={idx === list.length - 1}
                  onClick={() => handleMove(idx, idx + 1)}
                  className={`p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors ${
                    idx === list.length - 1 ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Flyt ned"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetToDefaults();
              onClose();
            }}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nulstil standard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Annuller
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Gem rækkefølge</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
