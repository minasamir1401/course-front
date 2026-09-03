"use client";

import React from "react";
import { parseJson, translateText } from "../utils";

export default function ColorMatchRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { pairs: [] });
  const pairs = Array.isArray(opts?.pairs) ? opts.pairs : [];
  
  const currentAnswers = parseJson(value, {});

  const handleColorChange = (idx: number, colorText: string) => {
    const nextAnswers = { ...currentAnswers, [idx]: colorText };
    onChange(JSON.stringify(nextAnswers));
  };

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "حدد اللون الصحيح لكل عنصر بالأسفل:" : "Define the correct color for each element below:"}
      </span>
      <div className="space-y-3.5">
        {pairs.map((p: any, idx: number) => {
          const typedVal = currentAnswers[idx] || "";
          return (
            <div key={idx} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-gravity">
              <span className="font-black text-slate-800 text-sm">
                {language === "ar" ? `ماهو لون الـ ${translateText(p.item, language)}؟` : `What is the color of ${translateText(p.item, language)}?`}
              </span>
              <input
                type="text"
                className="w-full sm:w-44 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center font-bold text-xs"
                value={typedVal}
                onChange={(e) => handleColorChange(idx, e.target.value)}
                placeholder={language === "ar" ? "مثال: أصفر" : "Example: Yellow"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
