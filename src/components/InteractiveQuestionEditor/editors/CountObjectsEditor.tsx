"use client";
import React from "react";
import { parseJson } from "../utils";
import { extractImageUrls } from "@/lib/image-utils";

export default function CountObjectsEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { itemImage: "", itemName: "" });
  const correctVal = question.correctAnswer || "1";

  const availableImages = Array.from(new Set([
    ...(question.image ? [String(question.image).trim()] : []),
    ...(question.imageUrl ? [String(question.imageUrl).trim()] : []),
    ...extractImageUrls(question.text || question.questionText || question.content || ''),
    ...extractImageUrls(question.textEn || question.questionTextEn || question.contentEn || ''),
    ...extractImageUrls(question.explanation || question.explanationEn || '')
  ])).filter(Boolean);

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
          {availableImages.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'الصور المتوفرة في السؤال:' : 'Available in question:'}</span>
              {availableImages.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChange("itemImage", imgUrl)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    opts.itemImage === imgUrl
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-3.5 h-3.5 object-cover rounded" />
                  <span>{language === 'ar' ? `صورة ${i + 1}` : `Image ${i + 1}`}</span>
                </button>
              ))}
            </div>
          )}
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
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center"
            value={correctVal}
            onChange={(e) => updateQuestionData(opts, e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
    </div>
  );
}