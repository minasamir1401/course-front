"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function NumberLineEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { min: 0, max: 10, step: 1, labels: ["0", "5", "10"] });
  const labels = Array.isArray(opts?.labels) ? opts.labels : ["0", "5", "10"];
  const correctVal = question.correctAnswer || "5";

  const [min, setMin] = useState<number>(opts.min ?? 0);
  const [max, setMax] = useState<number>(opts.max ?? 10);
  const [step, setStep] = useState<number>(opts.step ?? 1);
  const [labelsText, setLabelsText] = useState<string>(labels.join(", "));
  const [correctAnswer, setCorrectAnswer] = useState<string>(correctVal);

  const saveChanges = (newMin: number, newMax: number, newStep: number, labelStr: string, correct: string) => {
    const labelsArr = labelStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    updateQuestionData({ min: newMin, max: newMax, step: newStep, labels: labelsArr }, correct);
  };

  const handleAutoGenerateLabels = () => {
    const newLabels: string[] = [];
    const diff = max - min;
    if (diff <= 0 || step <= 0) return;
    const maxLabelsCount = 5; // Limiting count for narrow viewports
    const calcStep = diff / (maxLabelsCount - 1);
    for (let i = 0; i < maxLabelsCount; i++) {
      const val = min + i * calcStep;
      newLabels.push(String(Math.round(val * 100) / 100));
    }
    const labelStr = newLabels.join(", ");
    setLabelsText(labelStr);
    saveChanges(min, max, step, labelStr, correctAnswer);
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر خط الأعداد (Number Line):
      </h5>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الحد الأدنى (Min):</span>
          <input
            type="number"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={min}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setMin(val);
              saveChanges(val, max, step, labelsText, correctAnswer);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الحد الأقصى (Max):</span>
          <input
            type="number"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={max}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setMax(val);
              saveChanges(min, val, step, labelsText, correctAnswer);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الخطوة (Step):</span>
          <input
            type="number"
            step="0.01"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={step}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 1;
              setStep(val);
              saveChanges(min, max, val, labelsText, correctAnswer);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400">العناوين (مفصولة بفاصلة):</span>
          <button
            type="button"
            onClick={handleAutoGenerateLabels}
            className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer"
          >
            توليد تلقائي
          </button>
        </div>
        <input
          type="text"
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold w-full"
          value={labelsText}
          onChange={(e) => {
            setLabelsText(e.target.value);
            saveChanges(min, max, step, e.target.value, correctAnswer);
          }}
          placeholder="مثال: 0, 5, 10"
        />
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100 w-full">
        <div className="flex justify-between text-xs font-black text-slate-400">
          <span>الإجابة الصحيحة:</span>
          <span className="text-indigo-500 text-sm font-black">{correctAnswer}</span>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={parseFloat(correctAnswer) || min}
            onChange={(e) => {
              setCorrectAnswer(e.target.value);
              saveChanges(min, max, step, labelsText, e.target.value);
            }}
            className="w-full accent-indigo-655 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            step={step}
            value={correctAnswer}
            onChange={(e) => {
              setCorrectAnswer(e.target.value);
              saveChanges(min, max, step, labelsText, e.target.value);
            }}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔄 11. SWIPE_SORT (فرز البطاقات بالـ Swipe)