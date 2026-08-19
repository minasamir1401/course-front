"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function SequenceOrderEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { items: [] });
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const [itemInput, setItemInput] = useState("");

  const addItem = () => {
    if (!itemInput.trim()) return;
    const nextItems = [...items, itemInput.trim()];
    updateQuestionData({ items: nextItems }, nextItems);
    setItemInput("");
  };

  const removeItem = (idx: number) => {
    const nextItems = items.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ items: nextItems }, nextItems);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">ترتيب التسلسل التصاعدي/التنازلي:</h5>
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="أدخل العنصر بالترتيب الصحيح..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={itemInput}
          onChange={(e) => setItemInput(e.target.value)}
        />
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black"
        >
          إضافة
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {items.map((item: string, idx: number) => (
          <div key={idx} className="p-2.5 bg-white rounded-xl border border-emerald-200 flex justify-between items-center text-xs gap-2 min-w-0 shadow-2xs">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-[10px]">{idx + 1}</span>
              <span className="font-bold text-slate-800 truncate min-w-0">{item}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-200 shrink-0">
                ✅ {language === 'ar' ? `الترتيب ${idx + 1} الصحيح` : `Correct Step ${idx + 1}`}
              </span>
            </div>
            <button type="button" onClick={() => removeItem(idx)} className="text-rose-500 hover:text-rose-700 shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 font-bold">
        💡 أدخل العناصر بالترتيب الصحيح، وسيبعثرها النظام للطلبة تلقائياً.
      </p>
    </div>
  );
}

// -------------------------------------------------------------
// 🔠 21. CROSSWORD (الكلمات المتقاطعة)