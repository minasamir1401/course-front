"use client";

import React from "react";
import { parseJson, translateText } from "../utils";

export default function CrosswordRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { words: [] });
  const words = Array.isArray(opts?.words) ? opts.words : [];
  const crosswordState = parseJson(value, {});

  const handleInputChange = (idx: number, text: string) => {
    const nextAnswers = { ...crosswordState, [idx]: text.toUpperCase() };
    onChange(JSON.stringify(nextAnswers));
  };

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "أجب عن الكلمات المتقاطعة حسب التلميحات:" : "Answer crossword puzzles based on clues:"}
      </span>
      <div className="space-y-3.5">
        {words.map((item: any, idx: number) => {
          const typedVal = crosswordState[idx] || "";
          return (
            <div key={idx} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-gravity">
              <span className="font-bold text-slate-700 text-xs">{idx + 1}. {translateText(item.clue, language)}</span>
              <input
                type="text"
                className="w-full sm:w-44 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center font-bold text-xs uppercase"
                value={typedVal}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                maxLength={item.word ? item.word.length : 15}
                placeholder={language === "ar" ? `حروف الكلمة (${item.word ? item.word.length : ""} حروف)` : `Word (${item.word ? item.word.length : ""} chars)`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
