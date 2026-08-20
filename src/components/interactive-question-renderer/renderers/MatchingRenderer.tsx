"use client";

import React, { useState, useEffect, useRef } from "react";
import HtmlRenderer from "../../HtmlRenderer";
import QuestionHeader from "../QuestionHeader";
import { parseJson, translateText } from "../utils";

export default function MatchingRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { left: [], right: [] });
  const leftItems = Array.isArray(opts?.left) ? opts.left : [];
  const rightItemsRaw = Array.isArray(opts?.right) ? opts.right : [];
  const matchingState = parseJson(value, {});

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([]);
  const localRef = useRef<HTMLDivElement>(null);

  const [rightItems, setRightItems] = useState<string[]>([]);
  useEffect(() => {
    const shuffled = [...rightItemsRaw].sort(() => Math.random() - 0.5);
    setRightItems(shuffled);
  }, [question.options]);

  useEffect(() => {
    const container = localRef.current;
    if (!container) return;
    const updateCoords = () => {
      const containerRect = container.getBoundingClientRect();
      const newCoords: typeof coords = [];
      const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

      const getEl = (attr: string, val: string) => container.querySelector(`[${attr}="${CSS.escape(val)}"]`);

      Object.entries(matchingState).forEach(([lKey, rVal], idx) => {
        const leftEl = getEl("data-left-id", lKey);
        const rightEl = getEl("data-right-id", rVal as string);
        if (leftEl && rightEl) {
          const lRect = leftEl.getBoundingClientRect();
          const rRect = rightEl.getBoundingClientRect();
          
          const x1Val = (language === "ar" ? lRect.left : lRect.right) - containerRect.left;
          const x2Val = (language === "ar" ? rRect.right : rRect.left) - containerRect.left;

          newCoords.push({
            x1: x1Val,
            y1: lRect.top + lRect.height / 2 - containerRect.top,
            x2: x2Val,
            y2: rRect.top + rRect.height / 2 - containerRect.top,
            color: colors[idx % colors.length]
          });
        }
      });
      setCoords(newCoords);
    };

    updateCoords();
    window.addEventListener("resize", updateCoords);
    const timeout = setTimeout(updateCoords, 100);
    return () => {
      window.removeEventListener("resize", updateCoords);
      clearTimeout(timeout);
    };
  }, [value, question, language, rightItems]);

  const handleLeftClick = (item: string) => {
    setSelectedLeft(item);
  };

  const handleRightClick = (item: string) => {
    if (!selectedLeft) return;
    const newState = { ...matchingState, [selectedLeft]: item };
    onChange(JSON.stringify(newState));
    setSelectedLeft(null);
  };

  const clearMatch = (leftItem: string) => {
    const newState = { ...matchingState };
    delete newState[leftItem];
    onChange(JSON.stringify(newState));
  };

  return (
    <div ref={localRef} className="space-y-6 relative w-full overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {coords.map((c, idx) => (
          <path
            key={idx}
            d={`M ${c.x1} ${c.y1} C ${(c.x1 + c.x2) / 2} ${c.y1}, ${(c.x1 + c.x2) / 2} ${c.y2}, ${c.x2} ${c.y2}`}
            fill="none"
            stroke={c.color}
            strokeWidth="4"
            className="animate-dash"
          />
        ))}
      </svg>

      <div className="grid grid-cols-2 gap-8 min-h-[250px] relative z-20">
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
            {language === "ar" ? "العمود الأول (اضغط للتوصيل)" : "First Column (Click to match)"}
          </span>
          {leftItems.map((item: any, i: number) => {
            const matched = !!matchingState[item];
            const isSelected = selectedLeft === item;
            return (
              <div
                key={i}
                data-left-id={item}
                onClick={() => handleLeftClick(item)}
                className={`p-3 md:p-4 rounded-2xl border-2 transition-all duration-200 flex justify-between items-center cursor-pointer relative select-none ${
                  isSelected 
                    ? "bg-indigo-50 border-indigo-500 text-indigo-950 scale-[1.01] shadow-sm shadow-indigo-500/10" 
                    : matched 
                      ? "bg-indigo-50/30 border-indigo-200 text-indigo-900" 
                      : "bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-slate-50/50"
                }`}
              >
                <span className="font-bold font-sans text-sm break-words whitespace-normal leading-relaxed">
                  <HtmlRenderer html={translateText(item, language)} tag="span" />
                </span>
                
                {/* Visual anchor dot */}
                <div className={`absolute w-3.5 h-3.5 rounded-full border-2 border-indigo-400 bg-white top-1/2 -translate-y-1/2 transition-transform ${
                  language === 'ar' ? '-left-1.75' : '-right-1.75'
                } ${isSelected || matched ? 'scale-125 bg-indigo-600 border-white shadow' : ''}`} />

                {matched && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); clearMatch(item); }} 
                    className="text-rose-500 font-black hover:text-rose-700 hover:underline text-xs z-30 shrink-0 ml-2"
                  >
                    {language === "ar" ? "مسح" : "Clear"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
            {language === "ar" ? "العمود الثاني" : "Second Column"}
          </span>
          {rightItems.map((item: any, i: number) => {
            const isMatched = Object.values(matchingState).includes(item);
            return (
              <div
                key={i}
                data-right-id={item}
                onClick={() => handleRightClick(item)}
                className={`p-3 md:p-4 rounded-2xl border-2 transition-all duration-200 text-center relative select-none cursor-pointer ${
                  isMatched 
                    ? "bg-emerald-50/30 border-emerald-300 text-emerald-950" 
                    : "bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-slate-50/50"
                }`}
              >
                {/* Visual anchor dot */}
                <div className={`absolute w-3.5 h-3.5 rounded-full border-2 border-teal-400 bg-white top-1/2 -translate-y-1/2 transition-transform ${
                  language === 'ar' ? '-right-1.75' : '-left-1.75'
                } ${isMatched ? 'scale-125 bg-emerald-600 border-white shadow' : ''}`} />

                <span className="font-bold font-sans text-sm break-words whitespace-normal leading-relaxed">
                  <HtmlRenderer html={translateText(item, language)} tag="span" />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
