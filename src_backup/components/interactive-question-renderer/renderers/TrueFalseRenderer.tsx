"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from 'lucide-react';
import QuestionHeader from "../QuestionHeader";
import { parseJson } from "../utils";

export default function TrueFalseRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, {});
  const trueLabel = "True";
  const falseLabel = "False";

  const isTrueVal = (v: any) => ["صح", "صحيح", "صواب", "true", "1"].includes(String(v || "").trim().toLowerCase()) || String(v) === "True";
  const isFalseVal = (v: any) => ["خطأ", "false", "0", "غير صحيح"].includes(String(v || "").trim().toLowerCase()) || String(v) === "False";

  const isTrue = isTrueVal(value);
  const isFalse = isFalseVal(value);

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          type="button"
          dir="auto"
          onClick={() => onChange("True")}
          className={`p-3 md:p-4 rounded-2xl border-2 text-center font-black text-base md:text-lg transition-all cursor-pointer select-none duration-200 group overflow-hidden ${
            isTrue 
              ? "bg-emerald-50/90 backdrop-blur-sm border-emerald-500 shadow-sm shadow-emerald-500/10 text-emerald-950 scale-[1.01]" 
              : "bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isTrue && <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />}
            <span>{trueLabel}</span>
          </div>
        </button>

        <button
          type="button"
          dir="auto"
          onClick={() => onChange("False")}
          className={`p-3 md:p-4 rounded-2xl border-2 text-center font-black text-base md:text-lg transition-all cursor-pointer select-none duration-200 group overflow-hidden ${
            isFalse 
              ? "bg-rose-50/90 backdrop-blur-sm border-rose-500 shadow-sm shadow-rose-500/10 text-rose-950 scale-[1.01]" 
              : "bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isFalse && <AlertCircle className="w-5 h-5 text-rose-600 animate-bounce" />}
            <span>{falseLabel}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
