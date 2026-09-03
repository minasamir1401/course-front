"use client";

import React, { useState } from "react";
import { parseJson, translateText } from "../utils";

export default function FlashCardRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { front: "", back: "", cards: [] });
  // Support both single card (front/back) and multi-card array
  const cards: { front: string; back: string }[] = Array.isArray(opts.cards) && opts.cards.length > 0
    ? opts.cards
    : [{ front: opts.front || "", back: opts.back || "" }];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIdx] || { front: "", back: "" };

  const goNext = () => {
    setCurrentIdx(i => Math.min(i + 1, cards.length - 1));
    setIsFlipped(false);
  };
  const goPrev = () => {
    setCurrentIdx(i => Math.max(i - 1, 0));
    setIsFlipped(false);
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-black text-slate-800 text-center">{translateText(question.title, language)}</h4>

      {/* Card Navigator */}
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={goPrev} disabled={currentIdx === 0}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            {language === 'ar' ? '›' : '‹'}
          </button>
          <span className="text-xs font-black text-slate-500">{currentIdx + 1} / {cards.length}</span>
          <button type="button" onClick={goNext} disabled={currentIdx === cards.length - 1}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            {language === 'ar' ? '‹' : '›'}
          </button>
        </div>
      )}

      {/* Flip Card */}
      <div className="flex justify-center py-4">
        <div
          onClick={() => {
            const nextFlipped = !isFlipped;
            setIsFlipped(nextFlipped);
            if (onChange && !value) {
              onChange(currentCard.back || "FLIPPED");
            }
          }}
          className={`w-80 h-48 rounded-3xl border-2 p-6 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-500 relative shadow-md animate-pop-in ${
            isFlipped ? "bg-slate-950 border-slate-950 text-white" : "bg-white border-slate-250 text-slate-800"
          }`}
        >
          <span className="absolute top-3 text-[9px] font-black uppercase tracking-widest opacity-40">
            {isFlipped ? (language === 'ar' ? 'الجهة الخلفية' : 'Back') : (language === 'ar' ? 'الجهة الأمامية' : 'Front')}
          </span>
          <p className="text-base font-black leading-relaxed">
            {isFlipped ? translateText(currentCard.back, language) : translateText(currentCard.front, language)}
          </p>
          <span className="absolute bottom-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {language === "ar" ? "اضغط لقلب البطاقة" : "Click to flip"}
          </span>
        </div>
      </div>
    </div>
  );
}
