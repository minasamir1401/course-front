"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function TrueFalseEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const correctVal = question.correctAnswer || "صح";
  const isTrueVal = (v: any) => ["صح", "صحيح", "صواب", "true", "1"].includes(String(v || "").trim().toLowerCase()) || String(v) === "True";
  const isFalseVal = (v: any) => ["خطأ", "false", "0", "غير صحيح"].includes(String(v || "").trim().toLowerCase()) || String(v) === "False";

  const setCorrect = (val: string) => {
    updateQuestionData({ choices: ["True", "False"] }, val);
  };

  const isTrue = isTrueVal(correctVal);
  const isFalse = isFalseVal(correctVal);

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        <span>{language === 'ar' ? "حدد الإجابة الصحيحة للنشاط:" : "Select the Correct Answer:"}</span>
      </h5>
      <div className="grid grid-cols-2 gap-4 py-2">
        <button
          type="button"
          onClick={() => setCorrect("True")}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
            isTrue 
              ? "bg-emerald-50/70 border-emerald-500 shadow-md shadow-emerald-500/10 text-emerald-700" 
              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${isTrue ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span className="font-black text-sm">True</span>
        </button>

        <button
          type="button"
          onClick={() => setCorrect("False")}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
            isFalse 
              ? "bg-rose-50/70 border-rose-500 shadow-md shadow-rose-500/10 text-rose-700" 
              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${isFalse ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="font-black text-sm">False</span>
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📝 3. MULTI_SELECT (اختيارات متعددة)