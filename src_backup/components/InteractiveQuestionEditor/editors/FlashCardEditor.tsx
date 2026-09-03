"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function FlashCardEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { front: "", back: "" });

  const handleChange = (field: "front" | "back", val: string) => {
    const nextOpts = { ...opts, [field]: val };
    updateQuestionData(nextOpts, nextOpts.back);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">محرر البطاقات التعليمية (Flash Card):</h5>
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الوجه الأمامي (السؤال):</span>
          <textarea
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-right"
            value={opts.front || ""}
            onChange={(e) => handleChange("front", e.target.value)}
            placeholder="مثال: ما هو ناتج 6 ضرب 7؟"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الوجه الخلفي (الحل):</span>
          <textarea
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-right"
            value={opts.back || ""}
            onChange={(e) => handleChange("back", e.target.value)}
            placeholder="مثال: 42"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🧠 16. MEMORY_GAME (لعبة الذاكرة)