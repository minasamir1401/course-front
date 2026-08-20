"use client";

import React from "react";
import { parseJson } from "../utils";

export default function ImageLabelRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { imageUrl: "", labels: [] });
  const imageUrl = opts.imageUrl || "";
  const labels = Array.isArray(opts?.labels) ? opts.labels : [];
  
  const currentAnswers = parseJson(value, {});

  const handleLabelChange = (idx: number, text: string) => {
    const nextAnswers = { ...currentAnswers, [idx]: text };
    onChange(JSON.stringify(nextAnswers));
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "اكتب الاسم المقابل لكل علامة على الصورة:" : "Write label names corresponding to each marker:"}
      </span>
      
      {imageUrl && (
        <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white">
          <img loading="lazy" decoding="async" src={imageUrl} alt="Background" className="w-full h-full object-cover" />
          {labels.map((item: any, idx: number) => (
            <div
              key={idx}
              className="absolute w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white cursor-pointer"
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}
              title={`Label ${idx + 1}`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3.5">
        {labels.map((item: any, idx: number) => {
          const currentText = currentAnswers[idx] || "";
          return (
            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
              <span className="font-bold text-slate-700 text-xs">
                {language === "ar" ? `العلامة ${idx + 1}:` : `Marker ${idx + 1}:`}
              </span>
              <input
                type="text"
                className="w-full max-w-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-xs"
                value={currentText}
                onChange={(e) => handleLabelChange(idx, e.target.value)}
                placeholder={language === "ar" ? "اكتب التسمية هنا..." : "Type label here..."}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
