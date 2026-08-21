"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function MultiSelectEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { choices: ["", "", "", ""] });
  const choices = Array.isArray(opts?.choices) ? opts.choices : ["", "", "", ""];
  const rawCorrect = parseJson(question.correctAnswer, []);
  const correctList = Array.isArray(rawCorrect) ? rawCorrect : [rawCorrect];

  const handleChoiceChange = (idx: number, val: string) => {
    const nextChoices = [...choices];
    nextChoices[idx] = val;
    updateQuestionData({ choices: nextChoices }, correctList);
  };

  const addChoiceField = () => {
    updateQuestionData({ choices: [...choices, ""] }, correctList);
  };

  const removeChoiceField = (idx: number) => {
    if (choices.length <= 2) return;
    const targetVal = choices[idx];
    const nextChoices = choices.filter((_: any, i: number) => i !== idx);
    const nextCorrect = correctList.filter(x => x !== targetVal);
    updateQuestionData({ choices: nextChoices }, nextCorrect);
  };

  const handleCheckChange = (c: string, checked: boolean) => {
    let nextCorrect = [...correctList];
    if (checked) {
      if (!nextCorrect.includes(c)) nextCorrect.push(c);
    } else {
      nextCorrect = nextCorrect.filter((x) => x !== c);
    }
    updateQuestionData({ choices }, nextCorrect);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
          {language === 'ar' ? "خيارات الإجابة (اختيار متعدد Checkboxes):" : "Answer Choices (Multi-Select Checkboxes):"}
        </h5>
        <button
          type="button"
          onClick={addChoiceField}
          className="text-xs font-black text-indigo-500 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? "إضافة خيار" : "Add Option"}</span>
        </button>
      </div>

      <div className="space-y-3">
        {choices.map((c: string, idx: number) => {
          const isCorrect = correctList.includes(c) && c !== "";
          return (
            <div 
              key={idx} 
              className={`flex gap-3 items-center w-full p-3 rounded-2xl border transition-all duration-200 ${
                isCorrect 
                  ? "bg-indigo-50/40 border-indigo-300 shadow-sm" 
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={isCorrect}
                disabled={c === ""}
                onChange={(e) => handleCheckChange(c, e.target.checked)}
                className="w-5 h-5 accent-indigo-500 cursor-pointer rounded shrink-0"
              />
              <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-[11px] text-indigo-600 shrink-0 select-none">
                {getOptionLetter(idx, language)}
              </span>
              <MathInput
                placeholder={language === 'ar' ? `اكتب الخيار ${idx + 1} (بدون أ، ب، ج)...` : `Option ${idx + 1} (without A, B, C)...`}
                className="flex-1 min-w-0 font-bold text-slate-800 text-xs py-1"
                value={c}
                onChange={(val) => handleChoiceChange(idx, val)}
              />
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoiceField(idx)}
                  className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-white rounded-lg transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>{language === 'ar' ? "يمكنك تفعيل أكثر من إجابة صحيحة بالضغط على مربعات الصح." : "You can select multiple correct options by checking the checkboxes."}</span>
      </p>
    </div>
  );
}

// -------------------------------------------------------------
// 🤝 4. MATCHING (توصيل)