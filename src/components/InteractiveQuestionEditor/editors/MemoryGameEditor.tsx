"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function MemoryGameEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { pairs: [] });
  const pairs = Array.isArray(opts?.pairs) ? opts.pairs : [];
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const addPair = () => {
    if (!left.trim() || !right.trim()) return;
    const nextPairs = [...pairs, { left: left.trim(), right: right.trim() }];
    updateQuestionData({ pairs: nextPairs }, nextPairs);
    setLeft("");
    setRight("");
  };

  const removePair = (idx: number) => {
    const nextPairs = pairs.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ pairs: nextPairs }, nextPairs);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">لعبة الذاكرة (Memory Matches):</h5>
      <div className="flex flex-col gap-2 w-full">
        <MathInput
          placeholder="الكارت الأول (مع دعم الكسورة والمعادلات)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={left}
          onChange={(val) => setLeft(val)}
        />
        <MathInput
          placeholder="الكارت المطابق الثاني..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={right}
          onChange={(val) => setRight(val)}
        />
        <button
          type="button"
          onClick={addPair}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black"
        >
          إضافة الزوج المتطابق
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {pairs.map((p: any, idx: number) => (
          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
            <span className="font-bold text-slate-700 truncate min-w-0">{p.left} ↔ {p.right}</span>
            <button type="button" onClick={() => removePair(idx)} className="text-rose-500 hover:text-rose-700">
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔠 17. WORD_SCRAMBLE (ترتيب الحروف)