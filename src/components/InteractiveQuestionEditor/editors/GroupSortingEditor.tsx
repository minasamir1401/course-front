"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function GroupSortingEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { groups: [], items: [] });
  const groups = Array.isArray(opts?.groups) ? opts.groups : [];
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [groupInput, setGroupInput] = useState("");
  const [itemInput, setItemInput] = useState("");
  const [targetGroup, setTargetGroup] = useState("");

  const addGroup = () => {
    if (!groupInput.trim() || groups.includes(groupInput.trim())) return;
    const updatedGroups = [...groups, groupInput.trim()];
    updateQuestionData({ groups: updatedGroups, items }, correctMap);
    setGroupInput("");
  };

  const removeGroup = (grp: string) => {
    const updatedGroups = groups.filter((g: string) => g !== grp);
    const newCorrect = { ...correctMap };
    Object.keys(newCorrect).forEach((k) => {
      if (newCorrect[k] === grp) delete newCorrect[k];
    });
    updateQuestionData({ groups: updatedGroups, items }, newCorrect);
  };

  const addItem = () => {
    if (!itemInput.trim() || items.includes(itemInput.trim()) || !targetGroup) return;
    const updatedItems = [...items, itemInput.trim()];
    const newCorrect = { ...correctMap, [itemInput.trim()]: targetGroup };
    updateQuestionData({ groups, items: updatedItems }, newCorrect);
    setItemInput("");
    setTargetGroup("");
  };

  const removeItem = (item: string) => {
    const updatedItems = items.filter((i: string) => i !== item);
    const newCorrect = { ...correctMap };
    delete newCorrect[item];
    updateQuestionData({ groups, items: updatedItems }, newCorrect);
  };

  const groupColors = [
    { bg: "bg-indigo-50/70 border-indigo-200 text-indigo-900", label: "indigo" },
    { bg: "bg-emerald-50/70 border-emerald-200 text-emerald-900", label: "emerald" },
    { bg: "bg-amber-50/70 border-amber-200 text-amber-900", label: "amber" },
    { bg: "bg-rose-50/70 border-rose-200 text-rose-900", label: "rose" },
    { bg: "bg-sky-50/70 border-sky-200 text-sky-900", label: "sky" },
    { bg: "bg-purple-50/70 border-purple-200 text-purple-900", label: "purple" }
  ];

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        {language === 'ar' ? "محرر تصنيف المجموعات (Group Sorting):" : "Group Sorting Editor:"}
      </h5>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "المجموعات / التصنيفات المتاحة:" : "Available Groups / Classifications:"}</label>
        <div className="flex gap-2 w-full">
          <input
            type="text"
            placeholder={language === 'ar' ? "اسم مجموعة جديدة (مثل: ثدييات)..." : "New group name (e.g. Mammals)..."}
            className="flex-1 bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
            value={groupInput}
            onChange={(e) => setGroupInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addGroup(); } }}
          />
          <button
            type="button"
            onClick={addGroup}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer shrink-0"
          >
            {language === 'ar' ? "إضافة مجموعة" : "Add Group"}
          </button>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "إضافة كارت عنصر جديد للمجموعات:" : "Add New Item Card to Groups:"}</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <MathInput
              placeholder={language === 'ar' ? "العنصر/الكسر (مثل: 1/2 أو معادلة)..." : "Item/Fraction (e.g. 1/2)..."}
              className="md:col-span-1 bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold"
              value={itemInput}
              onChange={(val) => setItemInput(val)}
            />
            <select
              className="md:col-span-1 bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
            >
              <option value="">{language === 'ar' ? "اختر المجموعة المقابلة..." : "Select Group..."}</option>
              {groups.map((g: string, idx: number) => (
                <option key={idx} value={g}>{g}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addItem}
              className="md:col-span-1 py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
            >
              {language === 'ar' ? "إضافة بطاقة" : "Add Card"}
            </button>
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">{language === 'ar' ? "الهيكل العام للمجموعات والعناصر:" : "Group & Items Breakdown Structure:"}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((grp: string, index: number) => {
              const color = groupColors[index % groupColors.length];
              const grpItems = items.filter((item: any) => correctMap[item] === grp);

              return (
                <div key={grp} className={`rounded-2xl border-2 p-4 flex flex-col min-h-[140px] shadow-sm ${color.bg}`}>
                  <div className="flex justify-between items-center border-b border-black/5 pb-2 mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{grp}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] shadow-xs">
                        ✅ {language === 'ar' ? "تصنيف صحيح" : "Correct Category"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGroup(grp)}
                      className="text-slate-400 hover:text-rose-500 p-1 hover:bg-white rounded transition-all shrink-0 cursor-pointer font-black"
                      title={language === 'ar' ? "حذف المجموعة وكل عناصرها" : "Delete group and all its items"}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    {grpItems.length === 0 ? (
                      <span className="text-[10px] font-bold text-slate-400/80 italic block text-center py-4">{language === 'ar' ? "مجموعة فارغة. أضف بطاقات." : "Empty group. Add items."}</span>
                    ) : (
                      grpItems.map((item: any) => (
                        <div key={item} className="bg-white/90 border border-emerald-300 p-2 rounded-xl flex justify-between items-center text-xs shadow-sm">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-emerald-600 font-black">✔</span>
                            <span className="font-bold text-slate-800 truncate">{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item)}
                            className="text-slate-400 hover:text-rose-500 p-1 hover:bg-slate-50 rounded transition-all shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🕰️ 7. CLOCK (عقارب الساعة التفاعلية)