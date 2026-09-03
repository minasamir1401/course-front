"use client";

import React, { useState, useEffect } from "react";
import { parseJson, translateText } from "../utils";

export default function WordScrambleRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { word: "" });
  const rawWord = translateText(opts.word, language);
  const word = (rawWord || "").toUpperCase();

  const [letters, setLetters] = useState<string[]>([]);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);

  useEffect(() => {
    if (!word) return;
    const shuffled = word.split("").sort(() => Math.random() - 0.5);
    setLetters(shuffled);
    setTypedLetters([]);
  }, [word]);

  const selectLetter = (l: string, idx: number) => {
    const nextTyped = [...typedLetters, l];
    setTypedLetters(nextTyped);
    onChange(nextTyped.join(""));
  };

  const handleClear = () => {
    setTypedLetters([]);
    onChange("");
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "أعد ترتيب الحروف لتكوين الكلمة الصحيحة:" : "Rearrange the letters to form the correct word:"}
      </h4>
      
      <div className="flex justify-center gap-2 py-4">
        {letters.map((l, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => selectLetter(l, idx)}
            className="w-11 h-11 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center font-black text-base text-slate-700 hover:border-slate-800 cursor-pointer transition-all"
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="min-w-[150px] min-h-[46px] border-2 border-slate-950 rounded-2xl px-5 py-2.5 flex items-center justify-center font-black text-lg text-white bg-slate-950">
          {typedLetters.join(" ")}
        </div>
        <button type="button" onClick={handleClear} className="text-xs text-rose-500 font-bold hover:underline">
          {language === "ar" ? "مسح الكلمة" : "Clear Word"}
        </button>
      </div>
    </div>
  );
}
