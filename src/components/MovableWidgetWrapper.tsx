'use client';

import React from 'react';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { DashboardWidgetId } from '@/types';

interface MovableWidgetWrapperProps {
  id: DashboardWidgetId;
  index: number;
  totalWidgets: number;
  title: string;
  isEditingLayout: boolean;
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
  isEditingLayout,
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
  // In normal operational mode: render completely clean without handles or drag clutter
  if (!isEditingLayout) {
    return (
      <div id={`widget-${id}`} className="relative transition-all duration-200">
        {children}
      </div>
    );
  }

  // In edit mode: show drag handle, up/down arrows and clear visual boundary
  return (
    <div
      id={`widget-${id}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative transition-all duration-200 p-2 sm:p-2.5 rounded-3xl border-2 border-dashed border-indigo-200/90 bg-indigo-50/20 ${
        isDragging ? 'widget-dragging opacity-50 scale-[0.99]' : ''
      } ${isDragOver ? 'widget-drag-over border-indigo-500 bg-indigo-100/40' : ''}`}
    >
      {/* Reorder control strip */}
      <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-white rounded-xl border border-indigo-100 shadow-2xs select-none">
        <div
          className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-xs text-slate-700 font-semibold"
          title="Træk for at bytte rækkefølge"
        >
          <GripVertical className="w-4 h-4 text-indigo-500" />
          <span>{title}</span>
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
            className={`p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all ${
              index === 0 ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'
            }`}
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
            className={`p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all ${
              index === totalWidgets - 1 ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'
            }`}
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
