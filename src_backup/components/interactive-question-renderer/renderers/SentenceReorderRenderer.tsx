"use client";

import React, { useState, useEffect } from "react";
import { parseJson, translateText } from "../utils";

export default function SentenceReorderRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { words: [] });
  const rawWords = Array.isArray(opts?.words) ? opts.words : [];

  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  useEffect(() => {
    const shuffled = [...rawWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    
    if (value && typeof value === 'string') {
      const wordsInValue = value.split(" ").filter((w: string) => w.trim() !== "");
      const used = new Set<number>();
      const initial: number[] = [];
      for (const w of wordsInValue) {
        const idx = shuffled.findIndex((sw, i) => sw === w && !used.has(i));
        if (idx !== -1) {
          initial.push(idx);
          used.add(idx);
        }
      }
      setSelectedIndices(initial);
    } else {
      setSelectedIndices([]);
    }
  }, [question.options]);

  const selectWord = (idx: number) => {
    if (selectedIndices.includes(idx)) return;
    const nextSelected = [...selectedIndices, idx];
    setSelectedIndices(nextSelected);
    onChange(nextSelected.map(i => shuffledWords[i]).join(" "));
  };

  const handleClear = () => {
    setSelectedIndices([]);
    onChange("");
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "اضغط على الكلمات بالترتيب الصحيح لتكوين الجملة:" : "Click the words in the correct order to build the sentence:"}
      </h4>
      
      <div className="flex flex-wrap gap-2 justify-center py-4">
        {shuffledWords.map((w, idx) => {
          const isSelected = selectedIndices.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              disabled={isSelected}
              onClick={() => selectWord(idx)}
              className={`px-4.5 py-3 rounded-2xl border-2 transition-all font-black text-xs ${isSelected ? "bg-slate-100 border-slate-200 text-slate-350 opacity-40 cursor-not-allowed" : "bg-white border-slate-200 hover:border-slate-400"}`}
            >
              {translateText(w, language)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="w-full min-h-[55px] border-2 border-slate-950 rounded-3xl p-4 flex flex-wrap items-center justify-center gap-2.5 font-black text-sm text-white bg-slate-950">
          {selectedIndices.map((idx) => translateText(shuffledWords[idx], language)).join(" ")}
        </div>
        <button type="button" onClick={handleClear} className="text-xs text-rose-500 font-bold hover:underline">
          {language === "ar" ? "إعادة ترتيب" : "Reset"}
        </button>
      </div>
    </div>
  );
}
