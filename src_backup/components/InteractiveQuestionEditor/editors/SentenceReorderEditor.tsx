"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function SentenceReorderEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const correctVal = question.correctAnswer || "";

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">ترتيب كلمات الجملة (Sentence Reorder):</h5>
      <div className="flex flex-col gap-1 w-full">
        <span className="text-[10px] font-black text-slate-400 font-bold">الجملة بالترتيب الصحيح (مفصولة بمسافات):</span>
        <textarea
          rows={3}
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-right"
          value={correctVal}
          onChange={(e) => {
            const sentence = e.target.value;
            const words = sentence.split(" ").map(w => w.trim()).filter(w => w.length > 0);
            updateQuestionData({ words }, sentence);
          }}
          placeholder="مثال: السماء تمطر بغزارة في فصل الشتاء"
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📐 19. MATH_EQUATION (معادلة حسابية)