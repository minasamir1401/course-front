"use client";

import React, { useState, useEffect } from "react";
import { parseJson, translateText } from "../utils";

export default function WordSearchRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { grid: [], words: [] });
  const grid = Array.isArray(opts?.grid) ? opts.grid : [];
  const words = Array.isArray(opts?.words) ? opts.words : [];
  const foundWords = parseJson(value, []);

  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCells([]);
    setErrorMsg(null);
  }, [activeWord]);

  const handleCellClick = (r: number, c: number, letter: string) => {
    if (!activeWord) return;
    setErrorMsg(null);
    const coord = `${r},${c}`;
    if (selectedCells.includes(coord)) {
      setSelectedCells(selectedCells.filter((x) => x !== coord));
    } else {
      setSelectedCells([...selectedCells, coord]);
    }
  };

  const handleConfirmWord = () => {
    if (!activeWord) return;
    if (selectedCells.length === 0) return;

    const targetWord = activeWord.replace(/\s+/g, "").toUpperCase();

    // Verify if selection forms a valid contiguous straight line (horizontal or vertical) and matches targetWord
    const verifySelection = (coords: string[], target: string) => {
      if (coords.length !== target.length) return false;
      const parsed = coords.map(c => {
        const [row, col] = c.split(',').map(Number);
        return { r: row, c: col };
      });
      // Check if horizontal (all cells share the same row)
      const firstR = parsed[0].r;
      const isH = parsed.every(p => p.r === firstR);
      // Check if vertical (all cells share the same column)
      const firstC = parsed[0].c;
      const isV = parsed.every(p => p.c === firstC);
      
      if (!isH && !isV) return false;
      
      if (isH) {
        parsed.sort((a, b) => a.c - b.c);
        for (let i = 1; i < parsed.length; i++) {
          if (parsed[i].c !== parsed[i-1].c + 1) return false;
        }
      } else {
        parsed.sort((a, b) => a.r - b.r);
        for (let i = 1; i < parsed.length; i++) {
          if (parsed[i].r !== parsed[i-1].r + 1) return false;
        }
      }
      
      const spelled = parsed.map(p => grid[p.r]?.[p.c] || "").join("").toUpperCase();
      const reversed = spelled.split("").reverse().join("");
      return spelled === target || reversed === target;
    };

    if (!verifySelection(selectedCells, targetWord)) {
      setErrorMsg(language === 'ar' 
        ? "⚠️ التحديد غير صحيح! يجب اختيار جميع حروف الكلمة متتابعة في خط مستقيم (أفقي أو رأسي)." 
        : "⚠️ Invalid selection! You must select all letters of the word contiguously in a straight line (horizontal or vertical).");
      return;
    }

    if (!foundWords.includes(activeWord)) {
      const nextFound = [...foundWords, activeWord];
      onChange(JSON.stringify(nextFound));
    }
    setActiveWord(null);
    setSelectedCells([]);
    setErrorMsg(null);
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-black text-slate-800">{translateText(question.title, language)}</h4>

      {activeWord && (
        <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pop-in">
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-900">
                {language === "ar" ? `الكلمة المحددة للبحث: ` : `Searching for: `}
              </span>
              <span className="px-3 py-1 bg-indigo-600 text-white font-black rounded-xl text-sm shadow-sm">{activeWord}</span>
            </div>
            {errorMsg && <span className="text-[10px] text-rose-500 font-bold mt-1">{errorMsg}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmWord}
              disabled={selectedCells.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all"
            >
              {language === "ar" ? "✓ تأكيد تحديد الكلمة" : "✓ Confirm Word Found"}
            </button>
            <button
              type="button"
              onClick={() => { setActiveWord(null); setSelectedCells([]); }}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {grid.length > 0 && (
        <div className="w-full overflow-x-auto pb-2 flex justify-center">
          <div className="bg-slate-50 p-3 border border-slate-150 rounded-2xl flex flex-col gap-1.5 w-fit mx-auto shadow-inner">
            {grid.map((row: string[], r: number) => (
              <div key={r} className="flex gap-1.5">
                {row.map((letter: string, c: number) => {
                  const coord = `${r},${c}`;
                  const isSelected = selectedCells.includes(coord);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCellClick(r, c, letter)}
                      disabled={!activeWord}
                      className={`w-9 h-9 border rounded-lg flex items-center justify-center font-black text-xs shadow-sm uppercase shrink-0 transition-all ${
                        isSelected
                          ? "bg-amber-400 border-amber-500 text-slate-950 scale-105 shadow-md"
                          : activeWord
                          ? "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer"
                          : "bg-white border-slate-200 text-slate-700 opacity-80 cursor-default"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <span className="text-xs font-black text-slate-400 block uppercase">
          {language === "ar" ? "الخطوة 1: اضغط على الكلمة بالأسفل لاختيارها، ثم الخطوة 2: اضغط على حروفها بالجدول أعلاه:" : "Step 1: Click word below, Step 2: Click its letters in grid:"}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {words.map((w: any) => {
            const isFound = foundWords.includes(w);
            const isTarget = activeWord === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => !isFound && setActiveWord(isTarget ? null : w)}
                className={`p-3.5 rounded-xl border-2 transition-all font-black text-xs text-center cursor-pointer ${
                  isFound
                    ? "bg-slate-950 border-slate-950 text-white line-through opacity-60"
                    : isTarget
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                    : "bg-white border-slate-200 hover:border-indigo-400"
                }`}
              >
                {translateText(w, language)} {isFound && "✓"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
