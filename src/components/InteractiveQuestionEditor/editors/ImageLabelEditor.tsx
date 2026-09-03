"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function ImageLabelEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { imageUrl: "", labels: [] });
  const labels = Array.isArray(opts?.labels) ? opts.labels : [];
  const [label, setLabel] = useState("");
  const [xPercent, setXPercent] = useState("50");
  const [yPercent, setYPercent] = useState("50");

  const addLabel = () => {
    if (!label.trim()) return;
    const nextLabels = [...labels, { text: label.trim(), x: parseFloat(xPercent) || 50, y: parseFloat(yPercent) || 50 }];
    updateQuestionData({ imageUrl: opts.imageUrl, labels: nextLabels }, nextLabels);
    setLabel("");
  };

  const removeLabel = (idx: number) => {
    const nextLabels = labels.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ imageUrl: opts.imageUrl, labels: nextLabels }, nextLabels);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">تسمية أجزاء ومحتويات الصورة:</h5>
      <div className="space-y-3 w-full">
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400 font-bold">رابط الصورة الخلفية:</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={opts.imageUrl || ""}
            onChange={(e) => updateQuestionData({ imageUrl: e.target.value, labels }, labels)}
            placeholder="https://example.com/anatomy.jpg"
          />
        </div>

        <div className="bg-slate-50 p-3.5 border border-slate-150 rounded-xl space-y-3 w-full">
          <span className="text-[10px] font-black text-slate-400 block font-bold">إضافة علامة تسمية جديدة:</span>
          <div className="flex flex-col gap-2 w-full">
            <input
              type="text"
              placeholder="اسم التسمية..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              type="number"
              placeholder="X (0-100)%"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              value={xPercent}
              onChange={(e) => setXPercent(e.target.value)}
            />
            <input
              type="number"
              placeholder="Y (0-100)%"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              value={yPercent}
              onChange={(e) => setYPercent(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={addLabel}
            className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة علامة تسمية
          </button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {labels.map((item: any, idx: number) => (
            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
              <span className="font-bold text-slate-700 truncate min-w-0">{item.text} (X: {item.x}%, Y: {item.y}%)</span>
              <button type="button" onClick={() => removeLabel(idx)} className="text-rose-500 hover:text-rose-700">
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🎨 24. COLOR_MATCH (تطابق الألوان)