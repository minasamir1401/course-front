"use client";

import React, { useState, useEffect } from 'react';
import { LucideIcon, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface InteractiveTagProps {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
  colorClass: string; 
  bubbleTheme?: string; 
  variant?: 'meta' | 'helper';
  size?: 'xs' | 'sm' | 'md';
}

export function InteractiveTag({ label, value, icon: Icon, colorClass, bubbleTheme = "border-slate-200 text-slate-700", variant = 'meta', size = 'sm' }: InteractiveTagProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isSm = size === 'sm' || size === 'xs';
  const buttonClass = variant === 'helper'
    ? (isSm ? "px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-[10.5px] font-black tracking-normal normal-case gap-1.5 shadow-2xs whitespace-nowrap" : "px-3 py-1.5 rounded-full text-[11px] font-black tracking-normal normal-case gap-2 shadow-sm whitespace-nowrap")
    : (isSm
        ? "px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9.5px] md:text-[10.5px] font-bold uppercase tracking-wide gap-1 shadow-2xs whitespace-nowrap"
        : "px-2.5 py-1 md:py-1.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider gap-1.5 shadow-2xs whitespace-nowrap");

  const iconClass = isSm ? "w-3 h-3 md:w-3.5 md:h-3.5" : (variant === 'helper' ? "w-3.5 h-3.5" : "w-3.5 h-3.5 md:w-4 md:h-4");


  useEffect(() => {
    setMounted(true);
  }, []);

  if (!value) return null;

  // Filter out placeholder/empty strings that might come from DB or Excel imports
  const stringValue = String(value).trim().toLowerCase();
  const placeholders = [
    'level', 'dok', 'skill', 'standard', 'indicator', 'outcome', 'undefined', 'null', 'nan', '-', 'n/a', 'na',
    'المستوى', 'مستوى', 'عمق المعرفة', 'المهارة', 'مهارة', 'المعيار', 'معيار', 'المؤشر', 'مؤشر', 'الناتج', 'ناتج التعلم'
  ];
  if (placeholders.includes(stringValue)) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center transition-all hover:brightness-95 cursor-pointer active:scale-95 ${buttonClass} ${colorClass}`}
        title={label}
      >
        {Icon && <Icon className={`${iconClass} shrink-0`} />}
        <span>{label}</span>
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-6 md:p-8 border-2 space-y-4 animate-in zoom-in-95 duration-200 ${bubbleTheme}`}>
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h4 className="text-lg font-black flex items-center gap-2 uppercase tracking-widest">
                {Icon && <Icon className="w-6 h-6" />}
                {label}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-slate-800 text-base md:text-lg font-bold leading-relaxed max-h-[60vh] overflow-y-auto">
              {value}
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
