"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

function generateWordSearchGrid(words: string[]): string[][] {
  const cleanedWords = words.map(w => w.replace(/\s+/g, "").trim().toUpperCase()).filter(Boolean);
  const maxLength = cleanedWords.reduce((max, w) => Math.max(max, w.length), 0);
  const size = Math.max(8, maxLength); // Dynamic size based on longest word (minimum 8)

  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const isArabic = words.some((w) => /[\u0600-\u06FF]/.test(w));
  const arLetters = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"];
  const enLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const getRandomLetter = () => isArabic ? arLetters[Math.floor(Math.random() * arLetters.length)] : enLetters[Math.floor(Math.random() * enLetters.length)];
  const directions = [[0, 1], [1, 0]]; // Only Horizontal (left-to-right) and Vertical (top-to-bottom)

  for (const word of cleanedWords) {
    if (!word) continue;
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 150) {
      attempts++;
      const dirIdx = Math.floor(Math.random() * directions.length);
      const [dr, dc] = directions[dirIdx];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (r + dr * (word.length - 1) >= size || c + dc * (word.length - 1) >= size) continue;
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const currR = r + dr * i;
        const currC = c + dc * i;
        const letterAtCell = grid[currR][currC];
        if (letterAtCell !== "" && letterAtCell !== word[i]) { fits = false; break; }
      }
      if (fits) {
        for (let i = 0; i < word.length; i++) { grid[r + dr * i][c + dc * i] = word[i]; }
        placed = true;
      }
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") grid[r][c] = getRandomLetter();
    }
  }
  return grid;
}

// -------------------------------------------------------------
// 🧩 12. WORD_SEARCH (البحث عن الكلمات)

function WordSearchEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { grid: [], words: [] });
  const words = Array.isArray(opts?.words) ? opts.words : [];
  const grid = Array.isArray(opts?.grid) ? opts.grid : [];

  const [wordInput, setWordInput] = useState("");
  const [wordsList, setWordsList] = useState<string[]>(words);
  const [gridData, setGridData] = useState<string[][]>(grid);

  const saveChanges = (newWords: string[], newGrid: string[][]) => {
    updateQuestionData({ grid: newGrid, words: newWords }, newWords);
  };

  useEffect(() => {
    const loadedWords = Array.isArray(opts?.words) ? opts.words : [];
    setWordsList(loadedWords);
    if (Array.isArray(opts?.grid) && opts.grid.length > 0) {
      setGridData(opts.grid);
    } else if (loadedWords.length > 0) {
      const generated = generateWordSearchGrid(loadedWords);
      setGridData(generated);
      saveChanges(loadedWords, generated);
    } else {
      setGridData([]);
    }
  }, [question.options]);

  const addWord = () => {
    const cleaned = wordInput.trim().toUpperCase();
    if (!cleaned || wordsList.includes(cleaned)) return;
    const newWords = [...wordsList, cleaned];
    const newGrid = generateWordSearchGrid(newWords);
    setWordsList(newWords);
    setGridData(newGrid);
    saveChanges(newWords, newGrid);
    setWordInput("");
  };

  const removeWord = (word: string) => {
    const newWords = wordsList.filter((w) => w !== word);
    const newGrid = generateWordSearchGrid(newWords);
    setWordsList(newWords);
    setGridData(newGrid);
    saveChanges(newWords, newGrid);
  };

  const handleRegenerate = () => {
    const newGrid = generateWordSearchGrid(wordsList);
    setGridData(newGrid);
    saveChanges(wordsList, newGrid);
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر الكلمات المتقاطعة والبحث عن الكلمات (Word Search):
      </h5>
      <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl text-xs text-indigo-900 leading-relaxed font-bold">
        <span>💡 فكرة النشاط: الطالب يختار الكلمة الهدف من الأسفل، ثم يضغط على الحروف المتتالية داخل الشبكة لتحديدها وشطبها!</span>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="أدخل كلمة مخفية (مثال: تفاحة)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
        />
        <button
          type="button"
          onClick={addWord}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer animate-none"
        >
          إضافة كلمة وتحديث الشبكة
        </button>
      </div>

      {wordsList.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {wordsList.map((w, idx) => (
              <div key={idx} className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5 text-xs font-bold truncate max-w-full">
                <span className="truncate">{w}</span>
                <button type="button" onClick={() => removeWord(w)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">×</button>
              </div>
            ))}
          </div>

          {gridData.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 w-full max-w-full">
              <div className="flex flex-col gap-1">
                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">الشبكة المولدة (8x8):</h6>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer text-right"
                >
                  توليد حروف عشوائية جديدة
                </button>
              </div>
              <div className="w-full overflow-x-auto pb-2">
                <div className="bg-slate-50 p-3 border border-slate-150 rounded-2xl flex flex-col gap-1.5 w-fit mx-auto shadow-inner">
                  {gridData.map((row, r) => (
                    <div key={r} className="flex gap-1.5">
                      {row.map((letter, c) => (
                        <div key={c} className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-slate-700 text-xs shadow-sm uppercase shrink-0">
                          {letter}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🗺️ 13. MAZE (مسار المتاهة التعليمي)

export default WordSearchEditor;
