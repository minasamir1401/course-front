"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function ColorMatchEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { pairs: [] });
  const pairs = Array.isArray(opts?.pairs) ? opts.pairs : [];
  const [item, setItem] = useState("");
  const [color, setColor] = useState("");

  const addPair = () => {
    if (!item.trim() || !color.trim()) return;
    const nextPairs = [...pairs, { item: item.trim(), color: color.trim() }];
    updateQuestionData({ pairs: nextPairs }, nextPairs);
    setItem("");
    setColor("");
  };

  const removePair = (idx: number) => {
    const nextPairs = pairs.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ pairs: nextPairs }, nextPairs);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">تطابق الألوان والمفاهيم البصرية:</h5>
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="العنصر (مثل: موزة)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <input
          type="text"
          placeholder="اللون الصحيح لها (مثل: أصفر)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button
          type="button"
          onClick={addPair}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black"
        >
          إضافة
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {pairs.map((p: any, idx: number) => (
          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
            <span className="font-bold text-slate-700 truncate min-w-0">{p.item} ➔ {p.color}</span>
            <button type="button" onClick={() => removePair(idx)} className="text-rose-500 hover:text-rose-700">
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}