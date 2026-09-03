"use client";

import React, { useState } from "react";
import { CheckCircle2 } from 'lucide-react';
import HtmlRenderer from "../../HtmlRenderer";
import QuestionHeader from "../QuestionHeader";
import { parseJson, translateText } from "../utils";

export default function GroupSortingRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { groups: [], items: [] });
  const groups = Array.isArray(opts?.groups) ? opts.groups : [];
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const sortingState = parseJson(value, {});

  const [activeItem, setActiveItem] = useState<string | null>(null);

  const placeItem = (groupName: string) => {
    if (!activeItem) return;
    const newState = { ...sortingState, [activeItem]: groupName };
    onChange(JSON.stringify(newState));
    setActiveItem(null);
  };

  const handleDragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData("text/plain", item);
    setActiveItem(item);
  };

  const handleDrop = (e: React.DragEvent, groupName: string) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain") || activeItem;
    if (item) {
      const newState = { ...sortingState, [item]: groupName };
      onChange(JSON.stringify(newState));
      setActiveItem(null);
    }
  };

  const clearItem = (item: string) => {
    const newState = { ...sortingState };
    delete newState[item];
    onChange(JSON.stringify(newState));
  };

  const groupColors = [
    { bg: "bg-indigo-50/60 border-indigo-200 text-indigo-900", header: "text-indigo-950 border-indigo-100", itemBg: "bg-white border-indigo-150 text-indigo-900" },
    { bg: "bg-emerald-50/60 border-emerald-200 text-emerald-900", header: "text-emerald-950 border-emerald-100", itemBg: "bg-white border-emerald-150 text-emerald-900" },
    { bg: "bg-amber-50/60 border-amber-200 text-amber-900", header: "text-amber-950 border-amber-100", itemBg: "bg-white border-amber-150 text-amber-900" },
    { bg: "bg-rose-50/60 border-rose-200 text-rose-900", header: "text-rose-950 border-rose-100", itemBg: "bg-white border-rose-150 text-rose-900" },
    { bg: "bg-sky-50/60 border-sky-200 text-sky-900", header: "text-sky-950 border-sky-100", itemBg: "bg-white border-sky-150 text-sky-900" }
  ];

  const unsortedItems = items.filter((i: string) => !sortingState[i]);

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />

      <div className="space-y-3">
        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
          {language === "ar" ? "عناصر للتصنيف (اسحب العنصر للمجموعة المناسبة أو اضغط عليه):" : "Items to sort (drag or click to group):"}
        </span>
        <div className="flex flex-wrap gap-2.5 justify-start min-h-[60px] p-4 bg-slate-50/60 rounded-2xl border border-slate-200 transition-all">
          {unsortedItems.map((item: any) => {
            const isSelected = activeItem === item;
            return (
              <button
                key={item}
                type="button"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => setActiveItem(isSelected ? null : item)}
                className={`px-3 py-2 rounded-2xl border-2 transition-all font-black text-xs cursor-grab active:cursor-grabbing ${
                  isSelected 
                    ? "bg-indigo-100 border-indigo-400 text-slate-900 scale-[1.03] shadow-md shadow-indigo-500/15" 
                    : "bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-slate-50"
                }`}
              >
                <HtmlRenderer html={translateText(item, language)} tag="span" />
              </button>
            );
          })}
          {unsortedItems.length === 0 && (
            <p className="text-emerald-700 text-xs font-black w-full text-center py-2 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === "ar" ? "أحسنت! تم تصنيف جميع العناصر بنجاح." : "Excellent! All items classified."}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {groups.map((grp: any, index: number) => {
          const color = groupColors[index % groupColors.length];
          const isTargetGroup = activeItem;

          return (
            <div
              key={grp}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, grp)}
              onClick={() => placeItem(grp)}
              className={`rounded-2xl border-2 p-4 min-h-[140px] flex flex-col justify-between transition-all cursor-pointer ${color.bg} ${
                isTargetGroup 
                  ? "border-amber-400 ring-2 ring-amber-400/20 scale-[1.01]" 
                  : "hover:border-indigo-200"
              }`}
            >
              <div className={`border-b pb-2 mb-3 ${color.header} shrink-0`}>
                <span className="font-black text-sm">{translateText(grp, language)}</span>
              </div>
              <div className="flex-1 flex flex-wrap gap-2 items-start content-start">
                {Object.keys(sortingState)
                  .filter((item) => sortingState[item] === grp)
                  .map((item) => (
                    <div key={item} className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-black shadow-sm animate-pop-in ${color.itemBg}`}>
                      <HtmlRenderer html={translateText(item, language)} tag="span" />
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); clearItem(item); }} 
                        className="text-slate-400 hover:text-rose-500 font-black text-sm shrink-0 ml-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
