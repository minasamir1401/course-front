"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function MathEquationEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { equation: "" });
  const correctVal = question.correctAnswer || "";

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">حل المعادلة الحسابية (Math Equation):</h5>
      <div className="space-y-3 w-full">
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">صيغة المعادلة الحسابية:</span>
          <MathInput
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center"
            value={opts.equation || ""}
            onChange={(val) => updateQuestionData({ equation: val }, correctVal)}
            placeholder="مثال: \(3x + \frac{5}{2} = 20\)"
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400 font-bold">القيمة الصحيحة لـ x:</span>
          <MathInput
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center"
            value={correctVal}
            onChange={(val) => updateQuestionData(opts, val.trim())}
            placeholder="مثال: \(\frac{35}{6}\)"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔢 20. SEQUENCE_ORDER (ترتيب التسلسل)