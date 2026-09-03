"use client";

import React from "react";
import { CheckCircle2 } from 'lucide-react';
import HtmlRenderer from "../../HtmlRenderer";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";
import QuestionHeader from "../QuestionHeader";
import { parseJson, translateText } from "../utils";

export default function McqRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { choices: [] });
  const choices = Array.isArray(opts?.choices) ? opts.choices : [];
  const isShort = choices.every((c: any) => (typeof c === 'string' ? c.length : 0) <= 60);

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
        {choices.map((choice: any, idx: number) => {
          const isSelected = value === choice;
          return (
            <button
              key={idx}
              type="button"
              dir="auto"
              onClick={() => onChange(choice)}
              className={`w-full p-3 md:p-4 rounded-2xl border-2 transition-all flex justify-between items-center cursor-pointer select-none duration-200 group overflow-hidden ${
                isSelected 
                  ? "bg-indigo-50/90 backdrop-blur-sm border-indigo-500 shadow-sm shadow-indigo-500/10 text-indigo-950 scale-[1.01]" 
                  : "bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 text-start min-w-0">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                }`}>
                  {getOptionLetter(idx, language)}
                </span>
                <HtmlRenderer html={translateText(cleanOptionText(choice), language)} tag="span" className={`font-bold font-sans text-base transition-colors flex-1 break-words whitespace-normal min-w-0 !leading-snug ${isSelected ? "text-indigo-950" : "text-slate-700"}`} />
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ms-2 ${isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-white"}`}>
                {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
