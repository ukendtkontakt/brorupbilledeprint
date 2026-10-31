'use client';

import React from 'react';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { DashboardWidgetId } from '@/types';

interface MovableWidgetWrapperProps {
  id: DashboardWidgetId;
  index: number;
  totalWidgets: number;
  title: string;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  children: React.ReactNode;
}

export const MovableWidgetWrapper: React.FC<MovableWidgetWrapperProps> = ({
  id,
  index,
  totalWidgets,
  title,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  children,
}) => {
  return (
    <div
      id={`widget-${id}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative transition-all duration-200 ${
        isDragging ? 'widget-dragging' : ''
      } ${isDragOver ? 'widget-drag-over' : ''}`}
    >
      {/* Reorder control strip */}
      <div className="flex items-center justify-between mb-2 px-1 select-none opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <div
            className="flex items-center gap-1 cursor-grab active:cursor-grabbing hover:text-slate-800 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
            title="Træk for at bytte rækkefølge"
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">{title}</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Flytbar modul)
          </span>
        </div>

        {/* Quick move up / down buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(index);
            }}
            disabled={index === 0}
            className={`p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-all ${
              index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Flyt sektion op"
            aria-label={`Flyt ${title} op`}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown(index);
            }}
            disabled={index === totalWidgets - 1}
            className={`p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-all ${
              index === totalWidgets - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Flyt sektion ned"
            aria-label={`Flyt ${title} ned`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actual widget content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};
