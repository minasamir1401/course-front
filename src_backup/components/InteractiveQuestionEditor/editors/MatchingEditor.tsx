"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function MatchingEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { left: [], right: [] });
  const left = Array.isArray(opts?.left) ? opts.left : [];
  const right = Array.isArray(opts?.right) ? opts.right : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [leftInput, setLeftInput] = useState("");
  const [rightInput, setRightInput] = useState("");

  const addPair = () => {
    if (!leftInput.trim() || !rightInput.trim()) return;
    
    const newLeft = [...left, leftInput.trim()];
    const newRight = [...right, rightInput.trim()];
    const newCorrect = { ...correctMap, [leftInput.trim()]: rightInput.trim() };

    updateQuestionData({ left: newLeft, right: newRight }, newCorrect);
    setLeftInput("");
    setRightInput("");
  };

  const removePair = (leftKey: string) => {
    const rightVal = correctMap[leftKey];
    const newLeft = left.filter((l: string) => l !== leftKey);
    const newRight = right.filter((r: string) => r !== rightVal);
    const newCorrect = { ...correctMap };
    delete newCorrect[leftKey];

    updateQuestionData({ left: newLeft, right: newRight }, newCorrect);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        {language === 'ar' ? "تعديل عناصر التوصيل والربط:" : "Edit Matching Elements:"}
      </h5>
      
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "العنصر الأيمن (مع دعم الكسورة والمعادلات)" : "Right Element (Math Support)"}</label>
            <MathInput
              placeholder={language === 'ar' ? "مثال: الكلمة أو المعادلة..." : "e.g. Word or Equation..."}
              className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold"
              value={leftInput}
              onChange={(val) => setLeftInput(val)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "العنصر الأيسر المطابق" : "Matching Left Element"}</label>
            <MathInput
              placeholder={language === 'ar' ? "مثال: الكسر أو الصورة أو الإجابة..." : "e.g. Fraction or Answer..."}
              className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold"
              value={rightInput}
              onChange={(val) => setRightInput(val)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addPair}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? "إضافة زوج مطابق" : "Add Match Pair"}</span>
        </button>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {Object.keys(correctMap).length === 0 ? (
          <div className="text-center p-6 text-slate-400 text-xs font-bold bg-white border border-slate-150 rounded-2xl">
            {language === 'ar' ? "لا توجد أزواج توصيل مضافة بعد. أضف أزواجاً في الأعلى للبدء." : "No matching pairs added yet. Add some above to start."}
          </div>
        ) : (
          Object.keys(correctMap).map((leftKey, idx) => (
            <div key={leftKey} className="p-3 bg-white hover:border-indigo-200 rounded-xl border border-slate-200 flex justify-between items-center text-xs w-full gap-3 shadow-sm transition-all">
              <span className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-black flex items-center justify-center shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="font-black text-slate-800 truncate">{leftKey}</span>
                <span className="text-indigo-500 font-bold text-[10px] shrink-0">↔</span>
                <span className="font-bold text-slate-600 truncate">{correctMap[leftKey]}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px] border border-emerald-200 shrink-0">
                  ✅ {language === 'ar' ? "مطابق صحيح" : "Correct Match"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removePair(leftKey)}
                className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📥 5. DRAG_DROP_FILL (سحب الفراغات)