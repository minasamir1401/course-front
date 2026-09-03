"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function SwipeSortEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { leftGroup: "Left Group", rightGroup: "Right Group", items: [] });
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [leftGroup, setLeftGroup] = useState(opts.leftGroup || "Left Group");
  const [rightGroup, setRightGroup] = useState(opts.rightGroup || "Right Group");
  const [cardText, setCardText] = useState("");
  const [cardDirection, setCardDirection] = useState<"left" | "right">("left");

  const saveChanges = (leftGrp: string, rightGrp: string, itemsList: string[], correct: any) => {
    updateQuestionData({ leftGroup: leftGrp, rightGroup: rightGrp, items: itemsList }, correct);
  };

  const addCard = () => {
    if (!cardText.trim() || items.includes(cardText.trim())) return;
    const newItems = [...items, cardText.trim()];
    const newCorrect = { ...correctMap, [cardText.trim()]: cardDirection };
    saveChanges(leftGroup, rightGroup, newItems, newCorrect);
    setCardText("");
  };

  const removeCard = (item: string) => {
    const newItems = items.filter((i: string) => i !== item);
    const newCorrect = { ...correctMap };
    delete newCorrect[item];
    saveChanges(leftGroup, rightGroup, newItems, newCorrect);
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر فرز بطاقات السحب (Swipe Sort):
      </h5>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">المجموعة اليسرى (← يسار):</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={leftGroup}
            onChange={(e) => {
              setLeftGroup(e.target.value);
              saveChanges(e.target.value, rightGroup, items, correctMap);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">المجموعة اليمنى (يمين →):</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={rightGroup}
            onChange={(e) => {
              setRightGroup(e.target.value);
              saveChanges(leftGroup, e.target.value, items, correctMap);
            }}
          />
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-100">
        <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إضافة بطاقة جديدة:</h6>
        <div className="flex flex-col gap-2 w-full">
          <input
            type="text"
            placeholder="اكتب النص للبطاقة..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={cardText}
            onChange={(e) => setCardText(e.target.value)}
          />
          <select
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold min-h-[34px]"
            value={cardDirection}
            onChange={(e) => setCardDirection(e.target.value as "left" | "right")}
          >
            <option value="left">{leftGroup}</option>
            <option value="right">{rightGroup}</option>
          </select>
          <button
            type="button"
            onClick={addCard}
            className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة بطاقة
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100 max-h-60 overflow-y-auto">
          <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">البطاقات المضافة وتصنيفاتها:</h6>
          <div className="flex flex-col gap-3">
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-rose-500 uppercase">{leftGroup} (←)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-200">
                  ✅ {language === 'ar' ? "فرز يسار صحيح" : "Correct Left Sort"}
                </span>
              </div>
              <div className="space-y-1">
                {items
                  .filter((item: string) => correctMap[item] === "left")
                  .map((item: string) => (
                    <div key={item} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-200 text-xs font-bold gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-600 font-black">✔</span>
                        <span className="truncate">{item}</span>
                      </div>
                      <button type="button" onClick={() => removeCard(item)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">×</button>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-500 uppercase">{rightGroup} (→)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-200">
                  ✅ {language === 'ar' ? "فرز يمين صحيح" : "Correct Right Sort"}
                </span>
              </div>
              <div className="space-y-1">
                {items
                  .filter((item: string) => correctMap[item] === "right")
                  .map((item: string) => (
                    <div key={item} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-200 text-xs font-bold gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-600 font-black">✔</span>
                        <span className="truncate">{item}</span>
                      </div>
                      <button type="button" onClick={() => removeCard(item)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">×</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to generate word search grid with dynamic size and space-stripping