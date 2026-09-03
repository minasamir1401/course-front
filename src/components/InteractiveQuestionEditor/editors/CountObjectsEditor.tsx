"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function CountObjectsEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { itemImage: "", itemName: "" });
  const correctVal = question.correctAnswer || "1";

  const handleChange = (field: "itemImage" | "itemName", val: string) => {
    updateQuestionData({ ...opts, [field]: val }, correctVal);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">لعبة عد العناصر والمطابقة العددية:</h5>
      <div className="space-y-3 w-full">
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">رابط صورة العنصر:</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={opts.itemImage || ""}
            onChange={(e) => handleChange("itemImage", e.target.value)}
            placeholder="https://example.com/apple.png"
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">اسم العنصر:</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={opts.itemName || ""}
            onChange={(e) => handleChange("itemName", e.target.value)}
            placeholder="تفاحة"
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400 font-bold">العدد الإجمالي المطلوب:</span>
          <input
            type="number"
            min="1"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center font-bold"
            value={correctVal}
            onChange={(e) => updateQuestionData(opts, e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🖼️ 23. IMAGE_LABEL (تسمية أجزاء الصورة)