"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function CrosswordEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { words: [] });
  const words = Array.isArray(opts?.words) ? opts.words : [];
  const [word, setWord] = useState("");
  const [clue, setClue] = useState("");

  const addPair = () => {
    if (!word.trim() || !clue.trim()) return;
    const nextWords = [...words, { word: word.trim().toUpperCase(), clue: clue.trim() }];
    updateQuestionData({ words: nextWords }, nextWords);
    setWord("");
    setClue("");
  };

  const removePair = (idx: number) => {
    const nextWords = words.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ words: nextWords }, nextWords);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">الكلمات المتقاطعة (Crossword):</h5>
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="الكلمة (مثل: أسد)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />
        <input
          type="text"
          placeholder="التلميح والسؤال..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={clue}
          onChange={(e) => setClue(e.target.value)}
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
        {words.map((item: any, idx: number) => (
          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
            <span className="font-bold text-slate-700 truncate min-w-0">{item.word} ➔ {item.clue}</span>
            <button type="button" onClick={() => removePair(idx)} className="text-rose-500 hover:text-rose-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔢 22. COUNT_OBJECTS (عد العناصر)