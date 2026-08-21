"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function ClockEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  let timeStr = "12:00";
  if (typeof question.correctAnswer === "string") {
    const t = question.correctAnswer.trim();
    if (t.startsWith("{")) {
      try {
        const p = JSON.parse(t);
        timeStr = p.time || `${String(p.hour || 12).padStart(2, "0")}:${String(p.minute || 0).padStart(2, "0")}`;
      } catch {}
    } else {
      timeStr = t;
    }
  } else if (typeof question.correctAnswer === "object" && question.correctAnswer) {
    timeStr = question.correctAnswer.time || `${String(question.correctAnswer.hour || 12).padStart(2, "0")}:${String(question.correctAnswer.minute || 0).padStart(2, "0")}`;
  }
  const parts = timeStr.split(":");
  const hour = parseInt(parts[0]) || 12;
  const minute = parseInt(parts[1]) || 0;

  const handleClockChange = (field: "hour" | "minute", val: number) => {
    const nextHour = field === "hour" ? val : hour;
    const nextMinute = field === "minute" ? val : minute;
    const timeStr = `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
    updateQuestionData({ minuteStep: 5 }, timeStr);
  };

  return (
    <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">تحديد وقت عقارب الساعة:</h5>
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex flex-col gap-1 min-w-[100px] flex-1">
          <span className="text-[10px] font-black text-slate-400">الساعة:</span>
          <select
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs"
            value={hour}
            onChange={(e) => handleClockChange("hour", parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <option key={idx} value={idx + 1}>{idx + 1}</option>
            ))}
          </select>
        </div>
        <span className="text-2xl font-black text-slate-300 shrink-0 pt-4">:</span>
        <div className="flex flex-col gap-1 min-w-[100px] flex-1">
          <span className="text-[10px] font-black text-slate-400">الدقيقة:</span>
          <select
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs"
            value={minute}
            onChange={(e) => handleClockChange("minute", parseInt(e.target.value))}
          >
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🗺️ 8. MIND_MAP (خريطة المفاهيم)