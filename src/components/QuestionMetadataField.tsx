// @ts-nocheck
"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  formatEstimatedTime,
  parseEstimatedTime,
} from "@/lib/examQuestionMetadata";

export const QuestionMetadataField = ({
  label,
  language,
  value,
  options = [],
  onChange,
  onAddCustom,
  onDeleteOption,
  isTime = false,
}) => {
  const timeParts = parseEstimatedTime(value);

  if (isTime) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {label}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600 font-bold"
            placeholder={language === "ar" ? "دقائق" : "Minutes"}
            value={timeParts.minutes}
            onChange={(e) => onChange(formatEstimatedTime(e.target.value, timeParts.seconds))}
          />
          <input
            type="number"
            min="0"
            max="59"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600 font-bold"
            placeholder={language === "ar" ? "ثواني" : "Seconds"}
            value={timeParts.seconds}
            onChange={(e) => onChange(formatEstimatedTime(timeParts.minutes, e.target.value))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}
      </label>
      <select
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600 font-bold appearance-none"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{language === "ar" ? "اختر..." : "Select..."}</option>
        {options.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAddCustom}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-600 transition hover:bg-indigo-100"
        >
          <Plus className="h-3.5 w-3.5" />
          {language === "ar" ? "إضافة مخصص" : "Add Custom"}
        </button>
        <button
          type="button"
          onClick={onDeleteOption}
          disabled={!value}
          className="inline-flex items-center justify-center rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-rose-500 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
