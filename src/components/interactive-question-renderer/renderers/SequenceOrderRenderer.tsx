"use client";

import React, { useState, useEffect } from "react";
import { parseJson, translateText } from "../utils";

export default function SequenceOrderRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { items: [] });
  const rawItems = Array.isArray(opts?.items) ? opts.items : [];
  
  const [itemsList, setItemsList] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...rawItems].sort(() => Math.random() - 0.5);
    setItemsList(shuffled);
    onChange(JSON.stringify(shuffled));
  }, [question.options]);

  const moveItem = (idx: number, direction: "up" | "down") => {
    const nextItems = [...itemsList];
    if (direction === "up" && idx > 0) {
      const temp = nextItems[idx];
      nextItems[idx] = nextItems[idx - 1];
      nextItems[idx - 1] = temp;
    } else if (direction === "down" && idx < nextItems.length - 1) {
      const temp = nextItems[idx];
      nextItems[idx] = nextItems[idx + 1];
      nextItems[idx + 1] = temp;
    }
    setItemsList(nextItems);
    onChange(JSON.stringify(nextItems));
  };

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "رتب العناصر بالتسلسل الصحيح (باستخدام الأسهم):" : "Order the elements in the correct sequence:"}
      </span>
      <div className="flex flex-col gap-2.5">
        {itemsList.map((item, idx) => (
          <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-sm animate-gravity">
            <span className="font-bold text-slate-700 text-xs">{idx + 1}. {translateText(item, language)}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => moveItem(idx, "up")}
                className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={idx === itemsList.length - 1}
                onClick={() => moveItem(idx, "down")}
                className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
