"use client";

import React, { useState } from "react";
import HtmlRenderer from "../../HtmlRenderer";
import QuestionHeader from "../QuestionHeader";
import { parseJson, translateText } from "../utils";

export default function DragDropFillRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { sentence: "", choices: [] });
  const sentence = opts.sentence || "";
  const choices = Array.isArray(opts?.choices) ? opts.choices : [];
  const isShort = choices.every((c: any) => (typeof c === 'string' ? c.length : 0) <= 60);
  const currentSlots = parseJson(value, []);

  const [activeWord, setActiveWord] = useState<string | null>(null);

  const handleSlotClick = (slotIdx: number) => {
    if (activeWord) {
      const nextSlots = [...currentSlots];
      nextSlots[slotIdx] = activeWord;
      onChange(JSON.stringify(nextSlots));
      setActiveWord(null);
    } else {
      const nextSlots = [...currentSlots];
      nextSlots[slotIdx] = "";
      onChange(JSON.stringify(nextSlots));
    }
  };

  const handleDragStart = (e: React.DragEvent, word: string) => {
    e.dataTransfer.setData("text/plain", word);
    setActiveWord(word);
  };

  const handleDrop = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain") || activeWord;
    if (word) {
      const nextSlots = [...currentSlots];
      nextSlots[slotIdx] = word;
      onChange(JSON.stringify(nextSlots));
      setActiveWord(null);
    }
  };

  const renderSentence = () => {
    const translatedSentence = translateText(sentence, language);
    const parts = translatedSentence.split(/(\[slot\d+\])/g);
    return parts.map((part: string, idx: number) => {
      const match = part.match(/\[slot(\d+)\]/);
      if (match) {
        const slotIdx = parseInt(match[1]);
        const wordInSlot = currentSlots[slotIdx];
        const isSelectedSlot = activeWord && !wordInSlot;

        return (
          <span
            key={idx}
            onClick={() => handleSlotClick(slotIdx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, slotIdx)}
            className={`inline-flex items-center justify-center min-w-[90px] h-9 mx-1.5 align-middle rounded-xl text-center font-black text-xs px-2.5 border transition-all cursor-pointer ${
              wordInSlot 
                ? "bg-indigo-50 border-indigo-400 text-indigo-950 scale-100 shadow-sm" 
                : isSelectedSlot
                  ? "bg-amber-50 border-amber-400 text-amber-700 animate-pulse border-2"
                  : "bg-slate-100/80 border-dashed border-slate-305 text-slate-400 hover:border-slate-400 hover:bg-slate-100"
            }`}
          >
            <HtmlRenderer html={translateText(wordInSlot, language) || (language === "ar" ? `فراغ ${slotIdx + 1}` : `Blank ${slotIdx + 1}`)} tag="span" />
          </span>
        );
      }
      return <span key={idx} className="font-bold text-slate-800 leading-loose">{part}</span>;
    });
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />

      <div className={`bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-slate-200 leading-loose text-base ${language === 'ar' ? 'text-right' : 'text-left'} shadow-sm`}>
        {renderSentence()}
      </div>

      <div className="space-y-3">
        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
          {language === "ar" ? "الكلمات المتاحة (اسحبها للمكان المناسب أو اضغط عليها):" : "Available words (drag or click to place):"}
        </span>
        <div className="flex flex-wrap gap-2.5 justify-start p-4 bg-slate-50/50 rounded-2xl border border-slate-200">
          {choices.map((word: any, i: number) => {
            const isPlaced = currentSlots.includes(word);
            const isSelected = activeWord === word;
            return (
              <button
                key={i}
                type="button"
                draggable={!isPlaced}
                onDragStart={(e) => handleDragStart(e, word)}
                onClick={() => setActiveWord(isSelected ? null : word)}
                className={`px-3 py-2 rounded-2xl border-2 transition-all font-black text-xs select-none cursor-grab active:cursor-grabbing ${
                  isPlaced 
                    ? "opacity-30 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" 
                    : isSelected 
                      ? "bg-indigo-100 border-indigo-400 text-slate-900 scale-[1.03] shadow-md shadow-indigo-500/15" 
                      : "bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-slate-50"
                }`}
              >
                <HtmlRenderer html={translateText(word, language)} tag="span" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
