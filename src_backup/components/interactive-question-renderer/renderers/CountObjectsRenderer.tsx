"use client";

import React from "react";
import { parseJson, translateText } from "../utils";

export default function CountObjectsRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { itemImage: "", itemName: "", count: 5 });
  const itemName = translateText(opts.itemName, language) || "item";
  const itemImage = opts.itemImage || "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150";
  // Use count from options (default 5)
  const itemCount = Math.max(1, Math.min(20, parseInt(opts.count ?? 5) || 5));

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {translateText(question.title, language) || (language === "ar" ? `كم عدد الـ ${itemName} الموجودة بالأسفل؟` : `How many ${itemName} are shown below?`)}
      </h4>
      
      <div className="flex flex-wrap gap-3 justify-center py-6 bg-slate-50 rounded-3xl border border-slate-150">
        {Array.from({ length: itemCount }).map((_, i) => (
          <img loading="lazy" decoding="async" key={i}
            src={itemImage}
            alt={itemName}
            className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-md animate-gravity"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      <div className="w-full max-w-xs mx-auto space-y-2">
        <label className="text-xs font-bold text-slate-500 block text-center">{language === "ar" ? "العدد الكلي:" : "Total count:"}</label>
        <input
          type="number"
          min="0"
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center font-bold text-2xl"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={language === "ar" ? "اكتب العدد..." : "Type number..."}
        />
      </div>
    </div>
  );
}
