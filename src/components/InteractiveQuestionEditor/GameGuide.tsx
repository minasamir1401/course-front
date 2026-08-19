"use client";
import React from "react";
import {   HelpCircle , Sparkles , Info } from 'lucide-react';
import { guides } from "./guides";

export function GameGuide({ type }: { type: string }) {
  const guide = guides[type];
  if (!guide) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/75 via-sky-50/40 to-white rounded-3xl border border-indigo-100/60 p-5 shadow-sm space-y-4 text-right animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-start gap-3 justify-start">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-sm text-indigo-950 flex items-center gap-2">
            <span>دليل ومثال محرر: {guide.title}</span>
          </h4>
          <p className="text-xs font-bold text-indigo-900/85 leading-relaxed">
            {guide.desc}
          </p>
        </div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-50/70 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-indigo-700 font-black">
          <Info className="w-4 h-4" />
          <span>مثال توضيحي (مصري بسيط):</span>
        </div>
        <p className="font-bold text-slate-700 leading-relaxed">
          {guide.example}
        </p>
        
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
          <span className="font-black text-indigo-950 block">خطوات العمل في هذا المحرر:</span>
          <p className="font-bold text-slate-500 leading-relaxed">
            {guide.steps}
          </p>
        </div>
      </div>
    </div>
  );
}