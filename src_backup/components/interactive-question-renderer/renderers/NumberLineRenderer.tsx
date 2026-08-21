"use client";

import React from "react";
import { parseJson, translateText } from "../utils";

export default function NumberLineRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { min: 0, max: 10, step: 1, labels: [] });
  const min = opts.min ?? 0;
  const max = opts.max ?? 10;
  const step = opts.step ?? 1;
  const labels = Array.isArray(opts?.labels) ? opts.labels : [];
  
  const currentVal = value ? parseFloat(value) : min;

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "حرّك المؤشر لتحديد الرقم المطلوب:" : "Move the slider to select the correct number:"}
      </h4>
      
      <div className="flex flex-col gap-4 py-8 items-center w-full relative">
        <div className="relative w-full flex items-center py-2">
          <div className="absolute inset-x-0 h-3 bg-slate-200 rounded-full shadow-inner pointer-events-none" />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentVal}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-3 bg-transparent accent-indigo-600 rounded-lg cursor-pointer relative z-10"
          />
        </div>
        <div className="flex justify-between w-full px-1 text-xs font-black text-slate-600 flex-wrap gap-1">
          {labels && labels.length > 0 ? (
            labels.map((lbl: any, i: number) => (
              <span key={i} className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{translateText(lbl, language)}</span>
            ))
          ) : (
            <div className="flex justify-between w-full">
              <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{min}</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{max}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <span className="text-3xl font-black text-white bg-slate-950 border border-slate-950 px-6 py-3.5 rounded-2xl shadow-lg">{currentVal}</span>
      </div>
    </div>
  );
}
