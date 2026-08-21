"use client";

import React, { useState } from "react";
import { parseJson, translateText } from "../utils";

export default function SwipeSortRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { leftGroup: "Left Group", rightGroup: "Right Group", items: [] });
  const leftGroup = opts.leftGroup || "Left";
  const rightGroup = opts.rightGroup || "Right";
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const swipeState = parseJson(value, {});

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex >= items.length) return;
    const cardText = items[currentIndex];
    const newState = { ...swipeState, [cardText]: direction };
    onChange(JSON.stringify(newState));
    setCurrentIndex((prev) => prev + 1);
  };

  const hasMore = currentIndex < items.length;

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {hasMore ? (
        <div className="flex flex-col items-center gap-6">
          <div className="w-72 h-56 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-xl flex flex-col justify-between items-center text-center animate-gravity">
            <span className="text-xs font-black text-slate-400">
              {language === "ar" ? `بطاقة رقم ${currentIndex + 1} / ${items.length}` : `Card ${currentIndex + 1} / ${items.length}`}
            </span>
            <p className="text-lg font-black text-slate-800 my-auto leading-relaxed">{translateText(items[currentIndex], language)}</p>
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => handleSwipe("left")}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-950 text-xs font-black"
              >
                ← {translateText(leftGroup, language)}
              </button>
              <button
                type="button"
                onClick={() => handleSwipe("right")}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-950 text-xs font-black"
              >
                {translateText(rightGroup, language)} →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-950 font-black text-sm">
            {language === "ar" ? "تم تصنيف كافة البطاقات بنجاح! يمكنك إرسال الإجابة." : "All cards categorized! You can submit your answer."}
          </p>
        </div>
      )}
    </div>
  );
}
