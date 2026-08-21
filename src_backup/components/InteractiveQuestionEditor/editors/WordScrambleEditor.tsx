"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function WordScrambleEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const correctVal = question.correctAnswer || "";

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">ترتيب الحروف (Word Scramble):</h5>
      <div className="flex flex-col gap-1 w-full">
        <span className="text-[10px] font-black text-slate-400 font-bold">الكلمة الصحيحة:</span>
        <input
          type="text"
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-right"
          value={correctVal}
          onChange={(e) => updateQuestionData({ word: e.target.value.trim().toUpperCase() }, e.target.value.trim().toUpperCase())}
          placeholder="مثال: قطار"
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔤 18. SENTENCE_REORDER (ترتيب الجملة)