"use client";

import React from "react";
import { CheckCircle2, XCircle } from 'lucide-react';

interface ResultProps {
  question: any;
  studentAnswer: string;
  language: string;
}

export default function InteractiveResultRenderer({ question, studentAnswer, language }: ResultProps) {
  const cleanStr = (s: any) => String(s ?? "").trim().replace(/"/g, "");

  // Helpers to parse JSON safely
  const parseJson = (str: string, fallback: any = {}) => {
    try {
      if (typeof str === "string" && (str.startsWith("{") || str.startsWith("["))) {
        return JSON.parse(str);
      }
      return str || fallback;
    } catch {
      return fallback;
    }
  };

  const correctVal = parseJson(question.correctAnswer);
  const studentVal = parseJson(studentAnswer);

  // -------------------------------------------------------------
  // 🤝 1. MATCHING (توصيل)
  // -------------------------------------------------------------
  if (question.type === "MATCHING") {
    const correctMap = correctVal || {};
    const studentMap = studentVal || {};
    const leftKeys = Object.keys(correctMap);

    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          {language === "ar" ? "تفاصيل التوصيل والمطابقة:" : "Matching Pairs Review:"}
        </h5>
        <div className="space-y-2">
          {leftKeys.map((leftKey) => {
            const studentMatch = studentMap[leftKey];
            const correctMatch = correctMap[leftKey];
            const isCorrect = cleanStr(studentMatch) === cleanStr(correctMatch);

            return (
              <div
                key={leftKey}
                className={`p-3 rounded-xl border flex items-center justify-between gap-4 text-sm ${
                  isCorrect ? "bg-emerald-50 border-emerald-250 text-emerald-900" : "bg-rose-50 border-rose-250 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <span>{leftKey}</span>
                  <span>←</span>
                  <span className="underline">{studentMatch || `(${language === "ar" ? "فارغ" : "empty"})`}</span>
                </div>
                {!isCorrect && (
                  <div className="text-xs font-black text-slate-500">
                    {language === "ar" ? "الإجابة الصحيحة:" : "Correct:"} <span className="text-emerald-700 font-bold">{correctMatch}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 📥 2. DRAG_DROP_FILL (سحب الفراغات)
  // -------------------------------------------------------------
  if (question.type === "DRAG_DROP_FILL") {
    let config = { sentence: "", choices: [] };
    try {
      config = parseJson(question.options);
    } catch {}

    const sentence = config.sentence || "";
    const correctList = Array.isArray(correctVal) ? correctVal : [];
    const studentList = Array.isArray(studentVal) ? studentVal : [];
    const parts = sentence.split(/(\[slot\d+\])/g);

    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
        <div className="leading-loose text-base font-bold text-slate-700 flex flex-wrap gap-2 items-center">
          {parts.map((part: string, idx: number) => {
            const match = part.match(/\[slot(\d+)\]/);
            if (match) {
              const slotIdx = parseInt(match[1]);
              const filledValue = studentList[slotIdx] || "";
              const correctValue = correctList[slotIdx] || "";
              const isCorrect = cleanStr(filledValue) === cleanStr(correctValue);

              return (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-black text-xs ${
                    isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}
                >
                  <span>{filledValue || "?"}</span>
                  {!isCorrect && (
                    <span className="text-[10px] text-slate-500 line-through mr-1">({correctValue})</span>
                  )}
                </div>
              );
            }
            return <span key={idx}>{part}</span>;
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 🗂️ 3. GROUP_SORTING (تصنيف المجموعات)
  // -------------------------------------------------------------
  if (question.type === "GROUP_SORTING") {
    const correctMap = correctVal || {};
    const studentMap = studentVal || {};
    
    // Group mapping items
    const items = Object.keys(correctMap);

    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          {language === "ar" ? "تفاصيل التصنيف والفرز:" : "Grouping Review:"}
        </h5>
        <div className="grid grid-cols-1 gap-2">
          {items.map((item) => {
            const studentGrp = studentMap[item] || "";
            const correctGrp = correctMap[item] || "";
            const isCorrect = cleanStr(studentGrp) === cleanStr(correctGrp);

            return (
              <div
                key={item}
                className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                  isCorrect ? "bg-emerald-50 border-emerald-250 text-emerald-900" : "bg-rose-50 border-rose-250 text-rose-900"
                }`}
              >
                <span className="font-bold">{item} → {studentGrp || `(${language === "ar" ? "غير مصنف" : "Unsorted"})`}</span>
                {!isCorrect && (
                  <span className="font-black text-slate-500">
                    {language === "ar" ? "الصحيح:" : "Correct:"} <span className="text-emerald-700 font-bold">{correctGrp}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 🕰️ 4. CLOCK (عقارب الساعة التفاعلية)
  // -------------------------------------------------------------
  if (question.type === "CLOCK") {
    const isCorrect = cleanStr(studentAnswer) === cleanStr(question.correctAnswer);
    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150 text-center">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {language === "ar" ? "الوقت المختار:" : "Selected Time:"}
        </h5>
        <div className="flex justify-center items-center gap-6">
          <div className={`px-6 py-3 rounded-2xl border-2 font-mono text-xl font-black ${
            isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-rose-50 border-rose-500 text-rose-800"
          }`}>
            {studentAnswer || "--:--"}
          </div>
          {!isCorrect && (
            <div className="text-sm font-bold text-slate-500">
              {language === "ar" ? "الوقت الصحيح:" : "Correct Time:"} <span className="text-emerald-600 font-black">{question.correctAnswer}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 🗺️ 5. MIND_MAP (خريطة المفاهيم)
  // -------------------------------------------------------------
  if (question.type === "MIND_MAP") {
    const correctMap = correctVal || {};
    const studentMap = studentVal || {};
    const nodeIds = Object.keys(correctMap);

    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          {language === "ar" ? "مراجعة خريطة المفاهيم:" : "Mind Map Review:"}
        </h5>
        <div className="space-y-2">
          {nodeIds.map((nodeId) => {
            const studentLabel = studentMap[nodeId];
            const correctLabel = correctMap[nodeId];
            const isCorrect = cleanStr(studentLabel) === cleanStr(correctLabel);

            return (
              <div
                key={nodeId}
                className={`p-3 rounded-xl border flex items-center justify-between gap-4 text-sm ${
                  isCorrect ? "bg-emerald-50 border-emerald-250 text-emerald-900" : "bg-rose-50 border-rose-250 text-rose-900"
                }`}
              >
                <div className="font-bold">
                  {language === "ar" ? `العقدة #${nodeId}:` : `Node #${nodeId}:`}{" "}
                  <span className="underline">{studentLabel || `(${language === "ar" ? "فارغ" : "empty"})`}</span>
                </div>
                {!isCorrect && (
                  <div className="text-xs font-black text-slate-500">
                    {language === "ar" ? "الصحيح:" : "Correct:"} <span className="text-emerald-700 font-bold">{correctLabel}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ⏸️ 6. VIDEO_CHECKPOINT (فيديو تفاعلي)
  // -------------------------------------------------------------
  if (question.type === "VIDEO_CHECKPOINT") {
    const correctMap = correctVal || {};
    const studentMap = studentVal?.answeredCheckpoints || {};
    const timeMarks = Object.keys(correctMap);

    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          {language === "ar" ? "مراجعة أسئلة الفيديو التفاعلي:" : "Video Checkpoints Review:"}
        </h5>
        <div className="space-y-2">
          {timeMarks.map((timeMark) => {
            const studentAns = studentMap[timeMark];
            const correctAns = correctMap[timeMark];
            const isCorrect = cleanStr(studentAns) === cleanStr(correctAns);
            const minutes = Math.floor(parseInt(timeMark) / 60);
            const seconds = parseInt(timeMark) % 60;

            return (
              <div
                key={timeMark}
                className={`p-3 rounded-xl border flex items-center justify-between gap-4 text-sm ${
                  isCorrect ? "bg-emerald-50 border-emerald-250 text-emerald-900" : "bg-rose-50 border-rose-250 text-rose-900"
                }`}
              >
                <div className="font-bold flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-black">
                    {minutes}:{String(seconds).padStart(2, "0")}
                  </span>
                  <span>{studentAns || `(${language === "ar" ? "بلا إجابة" : "unanswered"})`}</span>
                </div>
                {!isCorrect && (
                  <div className="text-xs font-black text-slate-500">
                    {language === "ar" ? "الصحيح:" : "Correct:"} <span className="text-emerald-700 font-bold">{correctAns}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 📏 7. NUMBER_LINE (خط الأعداد)
  // -------------------------------------------------------------
  if (question.type === "NUMBER_LINE") {
    const isCorrect = cleanStr(studentAnswer) === cleanStr(question.correctAnswer);
    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150 text-center">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {language === "ar" ? "القيمة المحددة على المقاييس:" : "Indicated scale value:"}
        </h5>
        <div className="flex justify-center items-center gap-6">
          <div className={`px-6 py-3 rounded-2xl border-2 text-xl font-black ${
            isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-rose-50 border-rose-500 text-rose-800"
          }`}>
            {studentAnswer || "0"}
          </div>
          {!isCorrect && (
            <div className="text-sm font-bold text-slate-500">
              {language === "ar" ? "القيمة الصحيحة:" : "Correct Value:"} <span className="text-emerald-600 font-black">{question.correctAnswer}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 🔄 8. SWIPE_SORT (فرز البطاقات بالـ Swipe)
  // -------------------------------------------------------------
  if (question.type === "SWIPE_SORT") {
    const correctMap = correctVal || {};
    const studentMap = studentVal || {};
    const items = Object.keys(correctMap);

    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          {language === "ar" ? "مراجعة سحب وتصنيف البطاقات:" : "Swipe Cards Review:"}
        </h5>
        <div className="space-y-2">
          {items.map((item) => {
            const studentDir = studentMap[item];
            const correctDir = correctMap[item];
            const isCorrect = cleanStr(studentDir) === cleanStr(correctDir);

            return (
              <div
                key={item}
                className={`p-3 rounded-xl border flex items-center justify-between gap-4 text-xs ${
                  isCorrect ? "bg-emerald-50 border-emerald-250 text-emerald-900" : "bg-rose-50 border-rose-250 text-rose-900"
                }`}
              >
                <div className="font-bold">
                  {item} → <span className="underline">{studentDir || `(${language === "ar" ? "فارغ" : "empty"})`}</span>
                </div>
                {!isCorrect && (
                  <div className="text-xs font-black text-slate-500">
                    {language === "ar" ? "الصحيح:" : "Correct:"} <span className="text-emerald-700 font-bold">{correctDir}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 🗺️ 9. MAZE (مسار المتاهة التعليمي)
  // -------------------------------------------------------------
  if (question.type === "MAZE") {
    const correctPathList = Array.isArray(correctVal) ? correctVal : [];
    const studentPathList = Array.isArray(studentVal) ? studentVal : [];
    const isCorrect = correctPathList.length === studentPathList.length && correctPathList.every((val: string, i: number) => val === studentPathList[i]);

    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150 text-center">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {language === "ar" ? "مسار المتاهة المتخذ:" : "Chosen Maze Path:"}
        </h5>
        <div className="flex justify-center items-center gap-4 flex-wrap">
          {studentPathList.map((coord, i) => (
            <span key={i} className={`px-3 py-1 rounded-lg border text-xs font-black ${
              isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              {coord}
            </span>
          ))}
          {studentPathList.length === 0 && (
            <span className="text-xs font-bold text-slate-400">{language === "ar" ? "لم يتم اختيار مسار" : "No path selected"}</span>
          )}
        </div>
        {!isCorrect && (
          <div className="text-xs font-bold text-slate-500 mt-2">
            {language === "ar" ? "المسار الصحيح:" : "Correct Path:"} <span className="text-emerald-600 font-black">{correctPathList.join(" → ")}</span>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 🧩 10. WORD_SEARCH (الكلمات المتقاطعة)
  // -------------------------------------------------------------
  if (question.type === "WORD_SEARCH") {
    const correctList = Array.isArray(correctVal) ? correctVal : [];
    const studentList = Array.isArray(studentVal) ? studentVal : [];

    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          {language === "ar" ? "مراجعة الكلمات المكتشفة:" : "Word Search Review:"}
        </h5>
        <div className="flex flex-wrap gap-2.5">
          {correctList.map((word: string) => {
            const isFound = studentList.includes(word);
            return (
              <span
                key={word}
                className={`px-4 py-2 rounded-xl border-2 font-black text-xs flex items-center gap-1.5 ${
                  isFound ? "bg-emerald-50 border-emerald-300 text-emerald-950" : "bg-rose-55/70 border-rose-300 text-rose-950"
                }`}
              >
                <span>{word}</span>
                {isFound ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-650" />}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 📐 11. GEOGEBRA (جيوجيبرا)
  // -------------------------------------------------------------
  if (question.type === "GEOGEBRA") {
    const isCorrect = cleanStr(studentAnswer) === cleanStr(question.correctAnswer);
    return (
      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150 text-center">
        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {language === "ar" ? "إجابتك المدخلة للرسم البياني:" : "Entered plot answer:"}
        </h5>
        <div className="flex justify-center items-center gap-6">
          <div className={`px-6 py-3 rounded-2xl border-2 text-xl font-black ${
            isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-rose-50 border-rose-500 text-rose-800"
          }`}>
            {studentAnswer || `(${language === "ar" ? "بلا إجابة" : "empty"})`}
          </div>
          {!isCorrect && (
            <div className="text-sm font-bold text-slate-500">
              {language === "ar" ? "الإجابة الصحيحة:" : "Correct Answer:"} <span className="text-emerald-600 font-black">{question.correctAnswer}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
