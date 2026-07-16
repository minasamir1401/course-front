"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, Info, Sparkles, BookOpen, Clock as ClockIcon, Award, Play } from 'lucide-react';
import HtmlRenderer from "./HtmlRenderer";
import GeoGebraWidget from "./GeoGebraWidget";
import MathInput from "./MathInput";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";

interface QuestionProps {
  question: any;
  value: string; // The current answer stored (serialized JSON or string)
  onChange: (val: string) => void;
  language: string;
}

// Safely parse JSON
const parseJson = (str: any, fallback: any = {}) => {
  try {
    if (str === undefined || str === null) return fallback;
    let parsed = str;
    if (typeof str === "string") {
      const trimmed = str.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        parsed = JSON.parse(trimmed);
      } else {
        return fallback;
      }
    }
    if (typeof parsed !== "object" || parsed === null) {
      return fallback;
    }
    if (fallback && !Array.isArray(fallback) && Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

// Bilingual translation helper
const translateText = (val: any, lang: string): string => {
  if (!val) return "";
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object") {
        return parsed[lang] || parsed["ar"] || parsed["en"] || "";
      }
    } catch {}
    return val;
  }
  if (typeof val === "object" && val !== null) {
    return val[lang] || val["ar"] || val["en"] || "";
  }
  return String(val);
};

function QuestionHeader({ question, language, opts }: any) {
  return (
    <div className="flex flex-col mb-4 gap-3">
      <div className="flex justify-between items-start gap-4">
        {opts?.questionText ? (
          <HtmlRenderer html={translateText(question.title, language)} tag="h4" className="text-sm font-black text-slate-400 uppercase tracking-widest leading-snug" />
        ) : (
          <HtmlRenderer html={translateText(question.title, language)} tag="h4" className="text-lg font-black text-slate-800 leading-snug" />
        )}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-2xl font-black text-xs shrink-0 select-none shadow-sm animate-pulse">
          <Award className="w-4 h-4 text-amber-500" />
          <span>+10 XP</span>
        </div>
      </div>
      {opts?.questionText && (
        <div className="prose prose-sm max-w-none text-slate-800 font-bold text-base bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-[24px] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <HtmlRenderer html={translateText(opts.questionText, language)} />
        </div>
      )}
    </div>
  );
}

export default function InteractiveQuestionRenderer({ question, value, onChange, language }: QuestionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Render individual component based on type
  const renderWidget = () => {
    switch (question.type) {
      case "MCQ":
        return <McqRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "TRUE_FALSE":
        return <TrueFalseRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MULTI_SELECT":
        return <MultiSelectRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MATCHING":
        return <MatchingRenderer question={question} value={value} onChange={onChange} language={language} containerRef={containerRef} />;
      case "DRAG_DROP_FILL":
        return <DragDropFillRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "GROUP_SORTING":
        return <GroupSortingRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "CLOCK":
        return <ClockRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MIND_MAP":
        return <MindMapRenderer question={question} value={value} onChange={onChange} language={language} containerRef={containerRef} />;
      case "VIDEO_CHECKPOINT":
        return <VideoCheckpointRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "NUMBER_LINE":
        return <NumberLineRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "SWIPE_SORT":
        return <SwipeSortRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MAZE":
        return <MazeRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "WORD_SEARCH":
        return <WordSearchRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "GEOGEBRA":
        return <GeoGebraRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "FLASH_CARD":
        return <FlashCardRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MEMORY_GAME":
        return <MemoryGameRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "WORD_SCRAMBLE":
        return <WordScrambleRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "SENTENCE_REORDER":
        return <SentenceReorderRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "MATH_EQUATION":
        return <MathEquationRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "SEQUENCE_ORDER":
        return <SequenceOrderRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "CROSSWORD":
        return <CrosswordRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "COUNT_OBJECTS":
        return <CountObjectsRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "IMAGE_LABEL":
        return <ImageLabelRenderer question={question} value={value} onChange={onChange} language={language} />;
      case "COLOR_MATCH":
        return <ColorMatchRenderer question={question} value={value} onChange={onChange} language={language} />;
      default:
        return (
          <div className="p-6 text-center text-slate-400 font-bold w-full max-w-full">
            {language === "ar" ? "نوع السؤال غير مدعوم حالياً." : "Question type not supported."}
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className="w-full relative max-w-full overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gravity-drop {
          0% { transform: translateY(-200px) scaleY(1.3); opacity: 0; }
          60% { transform: translateY(12px) scaleY(0.85); opacity: 1; }
          85% { transform: translateY(-5px) scaleY(1.04); }
          100% { transform: translateY(0) scaleY(1); }
        }
        @keyframes jiggle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          15% { transform: scale(1.04) rotate(-2deg); }
          30% { transform: scale(1.04) rotate(2deg); }
          45% { transform: scale(1.04) rotate(-1.5deg); }
          60% { transform: scale(1.04) rotate(1.5deg); }
        }
        @keyframes pop-in {
          0% { transform: scale(0.82); opacity: 0; }
          70% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(0.6deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(-6px) rotate(-0.6deg); }
          50% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        @keyframes path-pulse {
          0% { stroke-width: 4px; opacity: 0.8; }
          50% { stroke-width: 6px; opacity: 1; }
          100% { stroke-width: 4px; opacity: 0.8; }
        }
        @keyframes swipe-left-out {
          0% { transform: translate(0, 0) rotate(0); opacity: 1; }
          100% { transform: translate(-380px, 35px) rotate(-22deg); opacity: 0; }
        }
        @keyframes swipe-right-out {
          0% { transform: translate(0, 0) rotate(0); opacity: 1; }
          100% { transform: translate(380px, 35px) rotate(22deg); opacity: 0; }
        }

        .game-card-3d-violet {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          border-bottom-width: 7px;
          border-bottom-color: #cbd5e1;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.03);
        }
        .game-card-3d-violet:hover:not(:disabled) {
          transform: translateY(-3px);
          border-bottom-width: 10px;
          border-bottom-color: #94a3b8;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
        }
        .game-card-3d-violet:active:not(:disabled) {
          transform: translateY(3px);
          border-bottom-width: 2px;
        }

        .game-card-3d-teal {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 2px solid #e2e8f0;
          border-bottom-width: 7px;
          border-bottom-color: #cbd5e1;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.03);
        }
        .game-card-3d-teal:hover:not(:disabled) {
          transform: translateY(-3px);
          border-bottom-width: 10px;
          border-bottom-color: #94a3b8;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
        }
        .game-card-3d-teal:active:not(:disabled) {
          transform: translateY(3px);
          border-bottom-width: 2px;
        }

        .game-btn-3d-selected {
          transform: translateY(3px) !important;
          border-bottom-width: 2px !important;
          background: #bae6fd !important;
          border-color: #38bdf8 !important;
          color: #0f172a !important;
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.25) !important;
        }
        .game-btn-3d-selected * {
          color: #0f172a !important;
        }

        .game-btn-3d-matched {
          transform: translateY(3px) !important;
          border-bottom-width: 2px !important;
          background: #7dd3fc !important;
          border-color: #0284c7 !important;
          color: #0f172a !important;
          box-shadow: none !important;
        }
        .game-btn-3d-matched * {
          color: #0f172a !important;
        }

        .game-slot-3d {
          background: #f8fafc;
          box-shadow: inset 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 0 rgba(255,255,255,0.8);
          border: 2px dashed #cbd5e1;
          transition: all 0.2s ease;
        }

        .game-slot-3d-filled {
          background: #bae6fd !important;
          border: 2px solid #38bdf8 !important;
          border-bottom-width: 6px !important;
          border-bottom-color: #0284c7 !important;
          color: #0f172a !important;
          box-shadow: 0 6px 15px rgba(56, 189, 248, 0.15) !important;
        }

        .candy-choice {
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-bottom-width: 6px;
          border-bottom-color: #cbd5e1;
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.03);
          border-radius: 18px;
          transition: all 0.15s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
        }
        .candy-choice:hover:not(:disabled) {
          transform: translateY(-2px);
          border-bottom-width: 8px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }
        .candy-choice:active:not(:disabled) {
          transform: translateY(4px);
          border-bottom-width: 2px;
        }

        .animate-gravity {
          animation: gravity-drop 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .animate-float {
          animation: float 3.2s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 3.2s ease-in-out infinite;
        }
        .animate-pop-in {
          animation: pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .animate-jiggle {
          animation: jiggle 0.45s ease-in-out;
        }
        .animate-swipe-left {
          animation: swipe-left-out 0.4s ease-out forwards;
        }
        .animate-swipe-right {
          animation: swipe-right-out 0.4s ease-out forwards;
        }
        .animate-dash {
          stroke-dasharray: 8, 4;
          animation: dash 1s linear infinite, path-pulse 2s ease-in-out infinite;
        }
        
        .scale-up {
          animation: pop-in 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.2) both;
        }
      ` }} />
      {renderWidget()}
    </div>
  );
}

// -------------------------------------------------------------
// 📝 1. MCQ (اختيار من متعدد)
// -------------------------------------------------------------
function McqRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { choices: [] });
  const choices = Array.isArray(opts?.choices) ? opts.choices : [];

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />
      <div className="flex flex-col gap-3">
        {choices.map((choice: any, idx: number) => {
          const isSelected = value === choice;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(choice)}
              className={`w-full p-5 rounded-2xl border-2 transition-all flex justify-between items-center cursor-pointer select-none duration-200 ${
                isSelected 
                  ? "bg-indigo-50/90 backdrop-blur-sm border-indigo-500 shadow-md shadow-indigo-500/10 text-indigo-950 scale-[1.01]" 
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 text-start min-w-0">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                }`}>
                  {getOptionLetter(idx, language)}
                </span>
                <HtmlRenderer html={translateText(cleanOptionText(choice), language)} tag="span" className={`font-black text-base transition-colors flex-1 break-words whitespace-normal min-w-0 !leading-relaxed ${isSelected ? "text-indigo-950" : "text-slate-700"}`} />
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ms-3 ${isSelected ? "border-indigo-650 bg-indigo-650 text-white" : "border-slate-300 bg-white"}`}>
                {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📝 2. TRUE_FALSE (صح أم خطأ)
// -------------------------------------------------------------
function TrueFalseRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, {});
  const trueLabel = "True";
  const falseLabel = "False";

  const isTrueVal = (v: any) => ["صح", "صحيح", "صواب", "true", "1"].includes(String(v || "").trim().toLowerCase()) || String(v) === "True";
  const isFalseVal = (v: any) => ["خطأ", "false", "0", "غير صحيح"].includes(String(v || "").trim().toLowerCase()) || String(v) === "False";

  const isTrue = isTrueVal(value);
  const isFalse = isFalseVal(value);

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => onChange("True")}
          className={`p-6 rounded-3xl border-2 text-center font-black text-xl transition-all cursor-pointer select-none duration-200 ${
            isTrue 
              ? "bg-emerald-50/90 backdrop-blur-sm border-emerald-500 shadow-md shadow-emerald-500/10 text-emerald-950 scale-[1.01]" 
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isTrue && <CheckCircle2 className="w-6 h-6 text-emerald-600 animate-bounce" />}
            <span>{trueLabel}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange("False")}
          className={`p-6 rounded-3xl border-2 text-center font-black text-xl transition-all cursor-pointer select-none duration-200 ${
            isFalse 
              ? "bg-rose-50/90 backdrop-blur-sm border-rose-500 shadow-md shadow-rose-500/10 text-rose-950 scale-[1.01]" 
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isFalse && <AlertCircle className="w-6 h-6 text-rose-600 animate-bounce" />}
            <span>{falseLabel}</span>
          </div>
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📝 3. MULTI_SELECT (اختيارات متعددة)
// -------------------------------------------------------------
function MultiSelectRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { choices: [] });
  const choices = Array.isArray(opts?.choices) ? opts.choices : [];
  const selectedList = parseJson(value, []);

  const handleToggle = (choice: string) => {
    let nextList = [...selectedList];
    if (nextList.includes(choice)) {
      nextList = nextList.filter((x) => x !== choice);
    } else {
      nextList.push(choice);
    }
    onChange(JSON.stringify(nextList));
  };

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />
      <div className="flex flex-col gap-3">
        {choices.map((choice: any, idx: number) => {
          const isSelected = selectedList.includes(choice);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleToggle(choice)}
              className={`w-full p-5 rounded-2xl border-2 transition-all flex justify-between items-center cursor-pointer select-none duration-200 ${
                isSelected 
                  ? "bg-indigo-50/90 backdrop-blur-sm border-indigo-500 shadow-md shadow-indigo-500/10 text-indigo-950 scale-[1.01]" 
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 text-start min-w-0">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                }`}>
                  {getOptionLetter(idx, language)}
                </span>
                <HtmlRenderer html={translateText(cleanOptionText(choice), language)} tag="span" className={`font-black text-base transition-colors flex-1 break-words whitespace-normal min-w-0 !leading-relaxed ${isSelected ? "text-indigo-950" : "text-slate-700"}`} />
              </div>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ms-3 ${isSelected ? "border-indigo-650 bg-indigo-650 text-white" : "border-slate-300 bg-white"}`}>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🤝 4. MATCHING (توصيل)
// -------------------------------------------------------------
function MatchingRenderer({ question, value, onChange, language }: any) {
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
                className={`p-4 rounded-2xl border-2 transition-all duration-200 flex justify-between items-center cursor-pointer relative select-none ${
                  isSelected 
                    ? "bg-indigo-50 border-indigo-500 text-indigo-950 scale-[1.01] shadow-sm shadow-indigo-500/10" 
                    : matched 
                      ? "bg-indigo-50/30 border-indigo-200 text-indigo-900" 
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-350"
                }`}
              >
                <span className="font-bold text-sm truncate">{translateText(item, language)}</span>
                
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
                className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center relative select-none ${
                  isMatched 
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 opacity-60 pointer-events-none scale-95" 
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 cursor-pointer"
                }`}
              >
                {/* Visual anchor dot */}
                <div className={`absolute w-3.5 h-3.5 rounded-full border-2 border-teal-400 bg-white top-1/2 -translate-y-1/2 transition-transform ${
                  language === 'ar' ? '-right-1.75' : '-left-1.75'
                } ${isMatched ? 'scale-125 bg-emerald-600 border-white shadow' : ''}`} />

                <span className="font-bold text-sm truncate">{translateText(item, language)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📥 5. DRAG_DROP_FILL (سحب الفراغات)
// -------------------------------------------------------------
function DragDropFillRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { sentence: "", choices: [] });
  const sentence = opts.sentence || "";
  const choices = Array.isArray(opts?.choices) ? opts.choices : [];
  const currentSlots = parseJson(value, []);

  const [activeWord, setActiveWord] = useState<string | null>(null);

  const handleSlotClick = (slotIdx: number) => {
    if (activeWord) {
      const nextSlots = [...currentSlots];
      nextSlots[slotIdx] = activeWord;
      onChange(JSON.stringify(nextSlots));
      setActiveWord(null);
    } else {
      const nextSlots = [...currentSlots];
      nextSlots[slotIdx] = "";
      onChange(JSON.stringify(nextSlots));
    }
  };

  const handleDragStart = (e: React.DragEvent, word: string) => {
    e.dataTransfer.setData("text/plain", word);
    setActiveWord(word);
  };

  const handleDrop = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain") || activeWord;
    if (word) {
      const nextSlots = [...currentSlots];
      nextSlots[slotIdx] = word;
      onChange(JSON.stringify(nextSlots));
      setActiveWord(null);
    }
  };

  const renderSentence = () => {
    const translatedSentence = translateText(sentence, language);
    const parts = translatedSentence.split(/(\[slot\d+\])/g);
    return parts.map((part: string, idx: number) => {
      const match = part.match(/\[slot(\d+)\]/);
      if (match) {
        const slotIdx = parseInt(match[1]);
        const wordInSlot = currentSlots[slotIdx];
        const isSelectedSlot = activeWord && !wordInSlot;

        return (
          <span
            key={idx}
            onClick={() => handleSlotClick(slotIdx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, slotIdx)}
            className={`inline-flex items-center justify-center min-w-[90px] h-9 mx-1.5 align-middle rounded-xl text-center font-black text-xs px-2.5 border transition-all cursor-pointer ${
              wordInSlot 
                ? "bg-indigo-50 border-indigo-400 text-indigo-950 scale-100 shadow-sm" 
                : isSelectedSlot
                  ? "bg-amber-50 border-amber-400 text-amber-700 animate-pulse border-2"
                  : "bg-slate-100/80 border-dashed border-slate-305 text-slate-400 hover:border-slate-400 hover:bg-slate-100"
            }`}
          >
            {translateText(wordInSlot, language) || (language === "ar" ? `فراغ ${slotIdx + 1}` : `Blank ${slotIdx + 1}`)}
          </span>
        );
      }
      return <span key={idx} className="font-bold text-slate-800 leading-loose">{part}</span>;
    });
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <QuestionHeader question={question} language={language} opts={opts} />

      <div className={`bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-slate-200 leading-loose text-base ${language === 'ar' ? 'text-right' : 'text-left'} shadow-sm`}>
        {renderSentence()}
      </div>

      <div className="space-y-3">
        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
          {language === "ar" ? "الكلمات المتاحة (اسحبها للمكان المناسب أو اضغط عليها):" : "Available words (drag or click to place):"}
        </span>
        <div className="flex flex-wrap gap-2.5 justify-start p-4 bg-slate-50/50 rounded-2xl border border-slate-200">
          {choices.map((word: any, i: number) => {
            const isPlaced = currentSlots.includes(word);
            const isSelected = activeWord === word;
            return (
              <button
                key={i}
                type="button"
                draggable={!isPlaced}
                onDragStart={(e) => handleDragStart(e, word)}
                onClick={() => setActiveWord(isSelected ? null : word)}
                className={`px-4 py-2.5 rounded-xl border-2 transition-all font-black text-xs select-none cursor-grab active:cursor-grabbing ${
                  isPlaced 
                    ? "opacity-30 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" 
                    : isSelected 
                      ? "bg-indigo-650 border-indigo-650 text-white scale-[1.03] shadow-md shadow-indigo-650/15" 
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50"
                }`}
              >
                {translateText(word, language)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🗂️ 6. GROUP_SORTING (تصنيف المجموعات)
// -------------------------------------------------------------
function GroupSortingRenderer({ question, value, onChange, language }: any) {
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
                className={`px-4 py-2.5 rounded-xl border-2 transition-all font-black text-xs cursor-grab active:cursor-grabbing ${
                  isSelected 
                    ? "bg-indigo-650 border-indigo-650 text-white scale-[1.03] shadow-md shadow-indigo-650/15" 
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50"
                }`}
              >
                {translateText(item, language)}
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
              className={`rounded-2xl border-2 p-5 min-h-[160px] flex flex-col justify-between transition-all cursor-pointer ${color.bg} ${
                isTargetGroup 
                  ? "border-amber-400 ring-2 ring-amber-400/20 scale-[1.01]" 
                  : "hover:border-slate-400"
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
                      <span>{translateText(item, language)}</span>
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

// -------------------------------------------------------------
// 🕰️ 7. CLOCK (عقارب الساعة التفاعلية)
// -------------------------------------------------------------
function ClockRenderer({ question, value, onChange, language }: any) {
  let timeStr = "12:00";
  const valToParse = value || question?.correctAnswer || "12:00";
  if (typeof valToParse === "string") {
    const t = valToParse.trim();
    if (t.startsWith("{")) {
      try {
        const p = JSON.parse(t);
        timeStr = p.time || `${String(p.hour || 12).padStart(2, "0")}:${String(p.minute || 0).padStart(2, "0")}`;
      } catch {}
    } else {
      timeStr = t;
    }
  } else if (typeof valToParse === "object" && valToParse) {
    timeStr = valToParse.time || `${String(valToParse.hour || 12).padStart(2, "0")}:${String(valToParse.minute || 0).padStart(2, "0")}`;
  }
  const parts = timeStr.split(":");
  const hour = parseInt(parts[0]) || 12;
  const minute = parseInt(parts[1]) || 0;

  const clockRef = useRef<HTMLDivElement>(null);
  const [activeHand, setActiveHand] = useState<"hour" | "minute" | null>(null);

  const updateTime = (field: "hour" | "minute", val: number) => {
    const nextH = field === "hour" ? val : hour;
    const nextM = field === "minute" ? val : minute;
    onChange(`${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`);
  };

  const handlePointerInteraction = (clientX: number, clientY: number) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    let targetHand = activeHand;
    if (!targetHand) {
      targetHand = distance < rect.width * 0.3 ? "hour" : "minute";
    }

    if (targetHand === "hour") {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      updateTime("hour", h);
    } else {
      let mVal = Math.round(angle / 6);
      if (mVal === 60) mVal = 0;
      updateTime("minute", mVal);
    }
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const selected = dist < rect.width * 0.3 ? "hour" : "minute";
    setActiveHand(selected);
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeHand) return;
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setActiveHand(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const dx = touch.clientX - (rect.left + rect.width / 2);
    const dy = touch.clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const selected = dist < rect.width * 0.3 ? "hour" : "minute";
    setActiveHand(selected);
    handlePointerInteraction(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!activeHand || e.touches.length === 0) return;
    const touch = e.touches[0];
    handlePointerInteraction(touch.clientX, touch.clientY);
  };

  return (
    <div className={`space-y-6 w-full max-w-full select-none ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "اضغط واسحب عقارب الساعة مباشرة لتعديل الوقت:" : "Click and drag clock hands directly to set time:"}
      </h4>
      
      <div className="flex justify-center">
        <div
          ref={clockRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handlePointerUp}
          className="w-60 h-60 rounded-full border-4 border-slate-900 bg-white relative flex items-center justify-center shadow-xl cursor-crosshair"
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = ((i + 1) * 30 * Math.PI) / 180;
            const x = 50 + 40 * Math.sin(angle);
            const y = 50 - 40 * Math.cos(angle);
            return (
              <span key={i} className="absolute text-xs font-black text-slate-500" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
                {i + 1}
              </span>
            );
          })}
          
          <div
            className="w-2 h-14 bg-blue-900 absolute bottom-1/2 left-1/2 origin-bottom rounded-full shadow-sm"
            style={{ transform: `translate(-50%, 0) rotate(${(hour % 12) * 30 + minute * 0.5}deg)` }}
          />
          <div
            className="w-1 h-20 bg-blue-600 absolute bottom-1/2 left-1/2 origin-bottom rounded-full shadow-sm"
            style={{ transform: `translate(-50%, 0) rotate(${minute * 6}deg)` }}
          />
          <div className="w-4 h-4 rounded-full bg-sky-500 absolute border-2 border-white shadow" />
        </div>
      </div>

      <div className="text-center">
        <span className="text-3xl font-black text-slate-950 bg-sky-100 border border-sky-300 px-6 py-3.5 rounded-2xl tracking-widest shadow-lg">
          {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🗺️ 8. MIND_MAP (خريطة المفاهيم)
// -------------------------------------------------------------
function MindMapRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { nodes: [] });
  const nodes = Array.isArray(opts?.nodes) ? opts.nodes : [];
  const mapAnswers = parseJson(value, {});

  const [activeWord, setActiveWord] = useState<string | null>(null);

  const handleNodeClick = (nodeId: string, node: any) => {
    if (!node.isBlank) return;
    if (activeWord) {
      const nextAnswers = { ...mapAnswers, [nodeId]: activeWord };
      onChange(JSON.stringify(nextAnswers));
      setActiveWord(null);
    } else {
      const nextAnswers = { ...mapAnswers };
      delete nextAnswers[nodeId];
      onChange(JSON.stringify(nextAnswers));
    }
  };

  const blanksList = nodes.filter((n: any) => n.isBlank).map((n: any) => n.label);
  const rootNodes = nodes.filter((n: any) => !n.parent);

  const renderTreeNode = (node: any) => {
    const children = nodes.filter((n: any) => n.parent === node.id);
    const isBlank = node.isBlank;
    const nodeAns = mapAnswers[node.id];
    
    const isRoot = !node.parent;
    const nodeClass = isBlank
      ? (nodeAns
        ? "bg-emerald-50 border-emerald-300 text-emerald-800 scale-105 shadow-md shadow-emerald-100/60"
        : "border-dashed border-2 border-indigo-300 bg-indigo-50/50 text-indigo-400 animate-pulse")
      : (isRoot
        ? "premium-gradient-primary text-white shadow-xl scale-105 border-none"
        : "bg-white border-2 border-slate-200 text-slate-800 shadow-sm");

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node card */}
        <div
          data-node-id={node.id}
          onClick={() => handleNodeClick(node.id, node)}
          className={`px-5 py-3.5 rounded-2xl transition-all cursor-pointer font-black text-sm min-w-[140px] max-w-[200px] text-center z-20 border ${nodeClass}`}
        >
          {isBlank ? (translateText(nodeAns, language) || "?") : translateText(node.label, language)}
        </div>

        {/* Children rendering */}
        {children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical connector from parent */}
            <div className="w-0.5 h-4 bg-slate-350" />
            
            {/* Row of children */}
            <div className="flex justify-center gap-8 w-full">
              {children.map((child: any, idx: number) => {
                const isFirst = idx === 0;
                const isLast = idx === children.length - 1;
                return (
                  <div key={child.id} className="relative flex flex-col items-center pt-4">
                    {/* Horizontal connecting line */}
                    {children.length > 1 && (
                      <div className={`absolute top-0 h-0.5 bg-slate-350 ${
                        isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'
                      }`} />
                    )}
                    {/* Vertical connector down to child card */}
                    <div className="absolute top-0 w-0.5 h-4 bg-slate-350 left-1/2 -translate-x-1/2" />
                    {renderTreeNode(child)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 relative w-full overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap justify-center gap-12 py-6 relative z-20 w-full overflow-x-auto pb-6">
        {rootNodes.map(renderTreeNode)}
      </div>

      {blanksList.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <span className="text-xs font-black text-slate-400 block uppercase">
            {language === "ar" ? "الخيارات المتاحة (اضغط على الخيار ثم اضغط على الفراغ):" : "Available choices (click choice then blank):"}
          </span>
          <div className="flex flex-wrap gap-2.5">
            {blanksList.map((word: any, i: number) => {
              const isPlaced = Object.values(mapAnswers).includes(word);
              const isSelected = activeWord === word;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveWord(isSelected ? null : word)}
                  className={`px-5 py-3 rounded-2xl border-2 transition-all font-black text-xs cursor-pointer ${isPlaced ? "opacity-30 cursor-not-allowed bg-slate-100 border-slate-200" : isSelected ? "bg-sky-200 border-sky-300 text-slate-900" : "bg-white border-slate-200 hover:border-slate-400"}`}
                >
                  {translateText(word, language)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// ⏸️ 9. VIDEO_CHECKPOINT (فيديو تفاعلي)
// -------------------------------------------------------------
function VideoCheckpointRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { videoUrl: "", checkpoints: [] });
  const videoUrl = opts.videoUrl || "";
  const checkpoints = Array.isArray(opts?.checkpoints) ? opts.checkpoints : [];
  const stateData = parseJson(value, { answeredCheckpoints: {} });
  const answered = stateData.answeredCheckpoints || {};

  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>(answered);

  const handleSelectAnswer = (timeKey: string, val: string) => {
    const nextAns = { ...currentAnswers, [timeKey]: val };
    setCurrentAnswers(nextAns);
    onChange(JSON.stringify({ answeredCheckpoints: nextAns }));
  };

  // Convert any YouTube URL format to embed URL
  const getEmbedUrl = (url: string): string => {
    if (!url) return "";
    const cleanUrl = url.trim();
    if (cleanUrl.includes("/embed/")) return cleanUrl;
    
    // Support youtube.com/shorts/ID or youtube.com/watch?v=ID or youtu.be/ID
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = cleanUrl.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    
    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const vimeoMatch = cleanUrl.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return cleanUrl;
  };

  const isDirectVideo = /\.(mp4|webm|ogg|mov)$/i.test(videoUrl) || videoUrl.startsWith("blob:") || videoUrl.startsWith("data:video");
  const embedUrl = isDirectVideo ? "" : getEmbedUrl(videoUrl);

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-black text-slate-800">{translateText(question.title, language)}</h4>
      {isDirectVideo && (
        <div className="w-full aspect-video rounded-3xl overflow-hidden border border-slate-200 bg-black">
          <video src={videoUrl} controls className="w-full h-full" />
        </div>
      )}
      {!isDirectVideo && embedUrl && (
        <div className="w-full aspect-video rounded-3xl overflow-hidden border border-slate-200 bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {!isDirectVideo && !embedUrl && (
        <div className="w-full aspect-video rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
          <span className="text-slate-400 font-bold text-sm">{language === 'ar' ? 'لا يوجد رابط فيديو صالح' : 'No valid video URL'}</span>
        </div>
      )}
      <div className="space-y-4">
        <span className="text-xs font-black text-slate-400 block uppercase">
          {language === "ar" ? "الأسئلة التفاعلية المرفقة بالفيديو:" : "Interactive questions attached to the video:"}
        </span>
        <div className="space-y-4">
          {checkpoints.map((cp: any, idx: number) => {
            const timeKey = String(cp.time);
            const selectedVal = currentAnswers[timeKey] || "";
            return (
              <div key={idx} className="bg-slate-50 p-5 rounded-3xl border border-slate-150 space-y-4">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-900 text-white text-[10px] font-black rounded-lg">
                  {language === "ar" ? `ثانية ${cp.time}` : `${cp.time}s`}
                </span>
                <p className="font-black text-slate-800 text-sm">{translateText(cp.question, language)}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(cp.choices || []).map((ch: any) => {
                    const isSelected = selectedVal === ch;
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => handleSelectAnswer(timeKey, ch)}
                        className={`p-3.5 rounded-2xl border-2 transition-all font-bold text-xs cursor-pointer ${
                          language === 'ar' ? 'text-right' : 'text-left'
                        } ${isSelected ? "bg-slate-950 border-slate-950 text-white" : "bg-white border-slate-200 hover:border-slate-400"}`}
                      >
                        {translateText(ch, language)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📐 10. NUMBER_LINE (خط الأعداد)
// -------------------------------------------------------------
function NumberLineRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { min: 0, max: 10, step: 1, labels: [] });
  const min = opts.min ?? 0;
  const max = opts.max ?? 10;
  const step = opts.step ?? 1;
  const labels = Array.isArray(opts?.labels) ? opts.labels : [];
  
  const currentVal = value ? parseFloat(value) : min;

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "حرّك المؤشر لتحديد الرقم المطلوب:" : "Move the slider to select the correct number:"}
      </h4>
      
      <div className="flex flex-col gap-4 py-8 items-center w-full relative">
        <div className="relative w-full flex items-center py-2">
          <div className="absolute inset-x-0 h-3 bg-slate-200 rounded-full shadow-inner pointer-events-none" />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentVal}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-3 bg-transparent accent-indigo-600 rounded-lg cursor-pointer relative z-10"
          />
        </div>
        <div className="flex justify-between w-full px-1 text-xs font-black text-slate-600 flex-wrap gap-1">
          {labels && labels.length > 0 ? (
            labels.map((lbl: any, i: number) => (
              <span key={i} className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{translateText(lbl, language)}</span>
            ))
          ) : (
            <div className="flex justify-between w-full">
              <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{min}</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{max}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <span className="text-3xl font-black text-white bg-slate-950 border border-slate-950 px-6 py-3.5 rounded-2xl shadow-lg">{currentVal}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔄 11. SWIPE_SORT (فرز البطاقات بالـ Swipe)
// -------------------------------------------------------------
function SwipeSortRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { leftGroup: "Left Group", rightGroup: "Right Group", items: [] });
  const leftGroup = opts.leftGroup || "Left";
  const rightGroup = opts.rightGroup || "Right";
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const swipeState = parseJson(value, {});

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex >= items.length) return;
    const cardText = items[currentIndex];
    const newState = { ...swipeState, [cardText]: direction };
    onChange(JSON.stringify(newState));
    setCurrentIndex((prev) => prev + 1);
  };

  const hasMore = currentIndex < items.length;

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {hasMore ? (
        <div className="flex flex-col items-center gap-6">
          <div className="w-72 h-56 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-xl flex flex-col justify-between items-center text-center animate-gravity">
            <span className="text-xs font-black text-slate-400">
              {language === "ar" ? `بطاقة رقم ${currentIndex + 1} / ${items.length}` : `Card ${currentIndex + 1} / ${items.length}`}
            </span>
            <p className="text-lg font-black text-slate-800 my-auto leading-relaxed">{translateText(items[currentIndex], language)}</p>
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => handleSwipe("left")}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-950 text-xs font-black"
              >
                ← {translateText(leftGroup, language)}
              </button>
              <button
                type="button"
                onClick={() => handleSwipe("right")}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-950 text-xs font-black"
              >
                {translateText(rightGroup, language)} →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-950 font-black text-sm">
            {language === "ar" ? "تم تصنيف كافة البطاقات بنجاح! يمكنك إرسال الإجابة." : "All cards categorized! You can submit your answer."}
          </p>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🗺️ 12. MAZE (مسار المتاهة التعليمي)
// -------------------------------------------------------------
function MazeRenderer({ question, value, onChange, language }: any) {
  const defaultGrid = Array.from({ length: 5 }, () => Array(5).fill(1));
  const opts = parseJson(question.options, { mazeGrid: defaultGrid, start: [0, 0], end: [4, 4], labels: {} });
  const grid = Array.isArray(opts?.mazeGrid) ? opts.mazeGrid : defaultGrid;
  const start = opts.start || [0, 0];
  const end = opts.end || [4, 4];
  const labels = opts.labels || {};
  
  const currentPath = parseJson(value, []);

  const handleCellClick = (r: number, c: number) => {
    if (grid[r][c] === 0) return; // Wall
    const coordStr = `${r},${c}`;
    if (currentPath.includes(coordStr)) {
      const idx = currentPath.indexOf(coordStr);
      const nextPath = currentPath.slice(0, idx + 1);
      onChange(JSON.stringify(nextPath));
    } else {
      if (currentPath.length > 0) {
        const last = currentPath[currentPath.length - 1].split(",").map(Number);
        const dist = Math.abs(r - last[0]) + Math.abs(c - last[1]);
        if (dist !== 1) return; // Must be adjacent
      } else {
        if (r !== start[0] || c !== start[1]) return; // Must start at start coord
      }
      const nextPath = [...currentPath, coordStr];
      onChange(JSON.stringify(nextPath));
    }
  };

  const handleReset = () => {
    onChange(JSON.stringify([`${start[0]},${start[1]}`]));
  };

  const isAtEnd = currentPath.length > 0 && currentPath[currentPath.length - 1] === `${end[0]},${end[1]}`;

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-black text-slate-800">{translateText(question.title, language)}</h4>
      {isAtEnd && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
          <span className="font-black text-emerald-700 text-sm">🎉 {language === 'ar' ? 'وصلت للمخرج! أحسنت!' : 'You reached the exit! Well done!'}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500">
          {language === "ar" ? "ارسم مساراً من البداية حتى المخرج بالتتبع الصحيح:" : "Draw a path from start to end by tracking correctly:"}
        </span>
        <button type="button" onClick={handleReset} className="text-xs text-rose-500 font-bold hover:underline">
          {language === "ar" ? "إعادة تعيين" : "Reset"}
        </button>
      </div>

      <div className="w-full overflow-x-auto pb-2 flex justify-center">
        <div className="flex flex-col gap-1.5 border-2 border-slate-200 p-3 bg-slate-100 rounded-2xl w-fit">
          {grid.map((row: any[], rIdx: number) => (
            <div key={rIdx} className="flex gap-1.5">
              {row.map((val: number, cIdx: number) => {
                const coordStr = `${rIdx},${cIdx}`;
                const isWall = val === 0;
                const isStart = start[0] === rIdx && start[1] === cIdx;
                const isEnd = end[0] === rIdx && end[1] === cIdx;
                const isPath = currentPath.includes(coordStr);
                const pathIndex = currentPath.indexOf(coordStr);
                const label = labels[coordStr] || "";

                return (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    disabled={isWall}
                    className={`w-12 h-12 rounded-lg border transition-all flex flex-col items-center justify-center font-black text-xs relative shrink-0 ${isWall ? "bg-slate-800 border-slate-900 text-slate-400 cursor-not-allowed" : isStart ? "bg-slate-950 border-slate-950 text-white" : isEnd ? "bg-emerald-650 border-emerald-700 text-white" : isPath ? "bg-indigo-600 border-indigo-650 text-white" : "bg-white border-slate-200 hover:border-slate-350"}`}
                  >
                    {isStart && <span className="text-[7px] absolute top-0.5 opacity-80">{language === "ar" ? "البداية" : "Start"}</span>}
                    {isEnd && <span className="text-[7px] absolute top-0.5 opacity-80">{language === "ar" ? "المخرج" : "Exit"}</span>}
                    {label && <span className={`${isStart || isEnd ? "pt-2 text-[9px]" : "text-xs"}`}>{label}</span>}
                    {!isStart && !isEnd && isPath && <span className="absolute bottom-0.5 right-0.5 text-[7px] text-slate-350">{pathIndex + 1}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🧩 13. WORD_SEARCH (البحث عن الكلمات)
// -------------------------------------------------------------
function WordSearchRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { grid: [], words: [] });
  const grid = Array.isArray(opts?.grid) ? opts.grid : [];
  const words = Array.isArray(opts?.words) ? opts.words : [];
  const foundWords = parseJson(value, []);

  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCells([]);
    setErrorMsg(null);
  }, [activeWord]);

  const handleCellClick = (r: number, c: number, letter: string) => {
    if (!activeWord) return;
    setErrorMsg(null);
    const coord = `${r},${c}`;
    if (selectedCells.includes(coord)) {
      setSelectedCells(selectedCells.filter((x) => x !== coord));
    } else {
      setSelectedCells([...selectedCells, coord]);
    }
  };

  const handleConfirmWord = () => {
    if (!activeWord) return;
    if (selectedCells.length === 0) return;

    const targetWord = activeWord.replace(/\s+/g, "").toUpperCase();

    // Verify if selection forms a valid contiguous straight line (horizontal or vertical) and matches targetWord
    const verifySelection = (coords: string[], target: string) => {
      if (coords.length !== target.length) return false;
      const parsed = coords.map(c => {
        const [row, col] = c.split(',').map(Number);
        return { r: row, c: col };
      });
      // Check if horizontal (all cells share the same row)
      const firstR = parsed[0].r;
      const isH = parsed.every(p => p.r === firstR);
      // Check if vertical (all cells share the same column)
      const firstC = parsed[0].c;
      const isV = parsed.every(p => p.c === firstC);
      
      if (!isH && !isV) return false;
      
      if (isH) {
        parsed.sort((a, b) => a.c - b.c);
        for (let i = 1; i < parsed.length; i++) {
          if (parsed[i].c !== parsed[i-1].c + 1) return false;
        }
      } else {
        parsed.sort((a, b) => a.r - b.r);
        for (let i = 1; i < parsed.length; i++) {
          if (parsed[i].r !== parsed[i-1].r + 1) return false;
        }
      }
      
      const spelled = parsed.map(p => grid[p.r]?.[p.c] || "").join("").toUpperCase();
      const reversed = spelled.split("").reverse().join("");
      return spelled === target || reversed === target;
    };

    if (!verifySelection(selectedCells, targetWord)) {
      setErrorMsg(language === 'ar' 
        ? "⚠️ التحديد غير صحيح! يجب اختيار جميع حروف الكلمة متتابعة في خط مستقيم (أفقي أو رأسي)." 
        : "⚠️ Invalid selection! You must select all letters of the word contiguously in a straight line (horizontal or vertical).");
      return;
    }

    if (!foundWords.includes(activeWord)) {
      const nextFound = [...foundWords, activeWord];
      onChange(JSON.stringify(nextFound));
    }
    setActiveWord(null);
    setSelectedCells([]);
    setErrorMsg(null);
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-black text-slate-800">{translateText(question.title, language)}</h4>

      {activeWord && (
        <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pop-in">
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-900">
                {language === "ar" ? `الكلمة المحددة للبحث: ` : `Searching for: `}
              </span>
              <span className="px-3 py-1 bg-indigo-600 text-white font-black rounded-xl text-sm shadow-sm">{activeWord}</span>
            </div>
            {errorMsg && <span className="text-[10px] text-rose-500 font-bold mt-1">{errorMsg}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmWord}
              disabled={selectedCells.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all"
            >
              {language === "ar" ? "✓ تأكيد تحديد الكلمة" : "✓ Confirm Word Found"}
            </button>
            <button
              type="button"
              onClick={() => { setActiveWord(null); setSelectedCells([]); }}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {grid.length > 0 && (
        <div className="w-full overflow-x-auto pb-2 flex justify-center">
          <div className="bg-slate-50 p-3 border border-slate-150 rounded-2xl flex flex-col gap-1.5 w-fit mx-auto shadow-inner">
            {grid.map((row: string[], r: number) => (
              <div key={r} className="flex gap-1.5">
                {row.map((letter: string, c: number) => {
                  const coord = `${r},${c}`;
                  const isSelected = selectedCells.includes(coord);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCellClick(r, c, letter)}
                      disabled={!activeWord}
                      className={`w-9 h-9 border rounded-lg flex items-center justify-center font-black text-xs shadow-sm uppercase shrink-0 transition-all ${
                        isSelected
                          ? "bg-amber-400 border-amber-500 text-slate-950 scale-105 shadow-md"
                          : activeWord
                          ? "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer"
                          : "bg-white border-slate-200 text-slate-700 opacity-80 cursor-default"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <span className="text-xs font-black text-slate-400 block uppercase">
          {language === "ar" ? "الخطوة 1: اضغط على الكلمة بالأسفل لاختيارها، ثم الخطوة 2: اضغط على حروفها بالجدول أعلاه:" : "Step 1: Click word below, Step 2: Click its letters in grid:"}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {words.map((w: any) => {
            const isFound = foundWords.includes(w);
            const isTarget = activeWord === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => !isFound && setActiveWord(isTarget ? null : w)}
                className={`p-3.5 rounded-xl border-2 transition-all font-black text-xs text-center cursor-pointer ${
                  isFound
                    ? "bg-slate-950 border-slate-950 text-white line-through opacity-60"
                    : isTarget
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                    : "bg-white border-slate-200 hover:border-indigo-400"
                }`}
              >
                {translateText(w, language)} {isFound && "✓"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📐 14. GEOGEBRA (جيوجيبرا)
// -------------------------------------------------------------
function GeoGebraRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { materialId: "", width: 800, height: 500, iframeUrl: "" });
  const materialId = opts.materialId || "";
  const w = opts.width || 800;
  const h = opts.height || 500;
  const iframeUrl = opts.iframeUrl || "";

  return (
    <div className="flex flex-col gap-6 w-full max-w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Graph On Top */}
      <div className="w-full min-h-[350px] lg:min-h-[450px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {iframeUrl && (
          <GeoGebraWidget materialId={materialId} iframeUrl={iframeUrl} w={w} h={h} />
        )}
        {!iframeUrl && materialId && (
          <GeoGebraWidget materialId={materialId} iframeUrl={`https://www.geogebra.org/material/iframe/id/${materialId}`} w={w} h={h} />
        )}
        {!iframeUrl && !materialId && (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm p-8">
            {language === "ar" ? "لم يتم تحديد مادة GeoGebra" : "No GeoGebra material specified"}
          </div>
        )}
      </div>

      {/* Question & Answer Below (Centered layout) */}
      <div className="w-full max-w-2xl mx-auto flex flex-col justify-center items-center text-center gap-6">
        <h4 className="text-lg font-black text-slate-800">
          {translateText(question.title, language)}
        </h4>
        {question.text && (
          <div className="text-sm text-slate-600 leading-relaxed">
            <HtmlRenderer html={question.text} />
          </div>
        )}
        <div className="w-full max-w-md space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
            {language === "ar" ? "أدخل الحل النهائي هنا:" : "Enter the final solution here:"}
          </label>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm text-center focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={language === "ar" ? "الحل..." : "Answer..."}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🎴 15. FLASH_CARD (البطاقات التعليمية)
// -------------------------------------------------------------
function FlashCardRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { front: "", back: "", cards: [] });
  // Support both single card (front/back) and multi-card array
  const cards: { front: string; back: string }[] = Array.isArray(opts.cards) && opts.cards.length > 0
    ? opts.cards
    : [{ front: opts.front || "", back: opts.back || "" }];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIdx] || { front: "", back: "" };

  const goNext = () => {
    setCurrentIdx(i => Math.min(i + 1, cards.length - 1));
    setIsFlipped(false);
  };
  const goPrev = () => {
    setCurrentIdx(i => Math.max(i - 1, 0));
    setIsFlipped(false);
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-black text-slate-800 text-center">{translateText(question.title, language)}</h4>

      {/* Card Navigator */}
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={goPrev} disabled={currentIdx === 0}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            {language === 'ar' ? '›' : '‹'}
          </button>
          <span className="text-xs font-black text-slate-500">{currentIdx + 1} / {cards.length}</span>
          <button type="button" onClick={goNext} disabled={currentIdx === cards.length - 1}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            {language === 'ar' ? '‹' : '›'}
          </button>
        </div>
      )}

      {/* Flip Card */}
      <div className="flex justify-center py-4">
        <div
          onClick={() => {
            const nextFlipped = !isFlipped;
            setIsFlipped(nextFlipped);
            if (onChange && !value) {
              onChange(currentCard.back || "FLIPPED");
            }
          }}
          className={`w-80 h-48 rounded-3xl border-2 p-6 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-500 relative shadow-md animate-pop-in ${
            isFlipped ? "bg-slate-950 border-slate-950 text-white" : "bg-white border-slate-250 text-slate-800"
          }`}
        >
          <span className="absolute top-3 text-[9px] font-black uppercase tracking-widest opacity-40">
            {isFlipped ? (language === 'ar' ? 'الجهة الخلفية' : 'Back') : (language === 'ar' ? 'الجهة الأمامية' : 'Front')}
          </span>
          <p className="text-base font-black leading-relaxed">
            {isFlipped ? translateText(currentCard.back, language) : translateText(currentCard.front, language)}
          </p>
          <span className="absolute bottom-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {language === "ar" ? "اضغط لقلب البطاقة" : "Click to flip"}
          </span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🧠 16. MEMORY_GAME (لعبة الذاكرة)
// -------------------------------------------------------------
interface MemoryCard {
  id: number;
  text: string;
  type: "left" | "right";
  pairIndex: number;
}

function MemoryGameRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { pairs: [] });
  const rawPairs = Array.isArray(opts?.pairs) ? opts.pairs : [];
  
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);

  useEffect(() => {
    const generated: MemoryCard[] = [];
    rawPairs.forEach((p: any, idx: number) => {
      generated.push({ id: idx * 2, text: p.left, type: "left", pairIndex: idx });
      generated.push({ id: idx * 2 + 1, text: p.right, type: "right", pairIndex: idx });
    });
    const shuffled = [...generated].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [question.options]);

  const handleCardClick = (cardId: number, pairIndex: number) => {
    if (flippedIds.includes(cardId) || matchedPairs.includes(pairIndex)) return;
    if (flippedIds.length >= 2) return;

    const nextFlipped = [...flippedIds, cardId];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      const firstCard = cards.find((c) => c.id === nextFlipped[0]);
      const secondCard = cards.find((c) => c.id === nextFlipped[1]);
      if (firstCard && secondCard && firstCard.pairIndex === secondCard.pairIndex) {
        const nextMatched = [...matchedPairs, firstCard.pairIndex];
        setMatchedPairs(nextMatched);
        setFlippedIds([]);
        onChange(JSON.stringify(nextMatched));
      } else {
        setTimeout(() => setFlippedIds([]), 1000);
      }
    }
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "لعبة الذاكرة (اعثر على الكروت المتطابقة):" : "Memory Game (Match the cards):"}
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-center">
        {cards.map((c) => {
          const isOpen = flippedIds.includes(c.id) || matchedPairs.includes(c.pairIndex);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCardClick(c.id, c.pairIndex)}
              className={`w-full aspect-[4/3] rounded-2xl border-2 flex items-center justify-center font-black text-xs p-3 transition-all ${isOpen ? "bg-slate-950 border-slate-950 text-white animate-pop-in" : "bg-white border-slate-200 hover:border-slate-450"}`}
            >
              {isOpen ? translateText(c.text, language) : "🌟"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔠 17. WORD_SCRAMBLE (ترتيب الحروف)
// -------------------------------------------------------------
function WordScrambleRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { word: "" });
  const rawWord = translateText(opts.word, language);
  const word = (rawWord || "").toUpperCase();

  const [letters, setLetters] = useState<string[]>([]);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);

  useEffect(() => {
    if (!word) return;
    const shuffled = word.split("").sort(() => Math.random() - 0.5);
    setLetters(shuffled);
    setTypedLetters([]);
  }, [word]);

  const selectLetter = (l: string, idx: number) => {
    const nextTyped = [...typedLetters, l];
    setTypedLetters(nextTyped);
    onChange(nextTyped.join(""));
  };

  const handleClear = () => {
    setTypedLetters([]);
    onChange("");
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "أعد ترتيب الحروف لتكوين الكلمة الصحيحة:" : "Rearrange the letters to form the correct word:"}
      </h4>
      
      <div className="flex justify-center gap-2 py-4">
        {letters.map((l, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => selectLetter(l, idx)}
            className="w-11 h-11 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center font-black text-base text-slate-700 hover:border-slate-800 cursor-pointer transition-all"
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="min-w-[150px] min-h-[46px] border-2 border-slate-950 rounded-2xl px-5 py-2.5 flex items-center justify-center font-black text-lg text-white bg-slate-950">
          {typedLetters.join(" ")}
        </div>
        <button type="button" onClick={handleClear} className="text-xs text-rose-500 font-bold hover:underline">
          {language === "ar" ? "مسح الكلمة" : "Clear Word"}
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔤 18. SENTENCE_REORDER (ترتيب الجملة)
// -------------------------------------------------------------
function SentenceReorderRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { words: [] });
  const rawWords = Array.isArray(opts?.words) ? opts.words : [];

  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...rawWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setSelectedWords([]);
  }, [question.options]);

  const selectWord = (word: string) => {
    if (selectedWords.includes(word)) return;
    const nextSelected = [...selectedWords, word];
    setSelectedWords(nextSelected);
    onChange(nextSelected.join(" "));
  };

  const handleClear = () => {
    setSelectedWords([]);
    onChange("");
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "اضغط على الكلمات بالترتيب الصحيح لتكوين الجملة:" : "Click the words in the correct order to build the sentence:"}
      </h4>
      
      <div className="flex flex-wrap gap-2 justify-center py-4">
        {shuffledWords.map((w, idx) => {
          const isSelected = selectedWords.includes(w);
          return (
            <button
              key={idx}
              type="button"
              disabled={isSelected}
              onClick={() => selectWord(w)}
              className={`px-4.5 py-3 rounded-2xl border-2 transition-all font-black text-xs ${isSelected ? "bg-slate-100 border-slate-200 text-slate-350 opacity-40 cursor-not-allowed" : "bg-white border-slate-200 hover:border-slate-400"}`}
            >
              {translateText(w, language)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="w-full min-h-[55px] border-2 border-slate-950 rounded-3xl p-4 flex flex-wrap items-center justify-center gap-2.5 font-black text-sm text-white bg-slate-950">
          {selectedWords.map((w) => translateText(w, language)).join(" ")}
        </div>
        <button type="button" onClick={handleClear} className="text-xs text-rose-500 font-bold hover:underline">
          {language === "ar" ? "إعادة ترتيب" : "Reset"}
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📐 19. MATH_EQUATION (معادلة حسابية)
// -------------------------------------------------------------
function MathEquationRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { equation: "" });
  const equation = translateText(opts.equation, language);

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "أوجد قيمة المتغير x لحل المعادلة:" : "Solve the equation for x:"}
      </h4>
      
      <div className="text-center py-6">
        <span className="text-3xl font-black text-slate-800 border-b-4 border-slate-900 pb-2 px-6">{equation}</span>
      </div>

      <div className="w-full max-w-xs mx-auto space-y-2">
        <label className="text-xs font-bold text-slate-500 block text-center">
          {language === "ar" ? "الجواب (قيمة x):" : "Answer (x value):"}
        </label>
        <MathInput
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-center font-bold text-sm"
          value={value || ""}
          onChange={(val) => onChange(val)}
          placeholder={language === "ar" ? "قيمة x = ..." : "x = ..."}
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔢 20. SEQUENCE_ORDER (ترتيب التسلسل)
// -------------------------------------------------------------
function SequenceOrderRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { items: [] });
  const rawItems = Array.isArray(opts?.items) ? opts.items : [];
  
  const [itemsList, setItemsList] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...rawItems].sort(() => Math.random() - 0.5);
    setItemsList(shuffled);
    onChange(JSON.stringify(shuffled));
  }, [question.options]);

  const moveItem = (idx: number, direction: "up" | "down") => {
    const nextItems = [...itemsList];
    if (direction === "up" && idx > 0) {
      const temp = nextItems[idx];
      nextItems[idx] = nextItems[idx - 1];
      nextItems[idx - 1] = temp;
    } else if (direction === "down" && idx < nextItems.length - 1) {
      const temp = nextItems[idx];
      nextItems[idx] = nextItems[idx + 1];
      nextItems[idx + 1] = temp;
    }
    setItemsList(nextItems);
    onChange(JSON.stringify(nextItems));
  };

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "رتب العناصر بالتسلسل الصحيح (باستخدام الأسهم):" : "Order the elements in the correct sequence:"}
      </span>
      <div className="flex flex-col gap-2.5">
        {itemsList.map((item, idx) => (
          <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-sm animate-gravity">
            <span className="font-bold text-slate-700 text-xs">{idx + 1}. {translateText(item, language)}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => moveItem(idx, "up")}
                className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={idx === itemsList.length - 1}
                onClick={() => moveItem(idx, "down")}
                className="w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔠 21. CROSSWORD (الكلمات المتقاطعة)
// -------------------------------------------------------------
function CrosswordRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { words: [] });
  const words = Array.isArray(opts?.words) ? opts.words : [];
  const crosswordState = parseJson(value, {});

  const handleInputChange = (idx: number, text: string) => {
    const nextAnswers = { ...crosswordState, [idx]: text.toUpperCase() };
    onChange(JSON.stringify(nextAnswers));
  };

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "أجب عن الكلمات المتقاطعة حسب التلميحات:" : "Answer crossword puzzles based on clues:"}
      </span>
      <div className="space-y-3.5">
        {words.map((item: any, idx: number) => {
          const typedVal = crosswordState[idx] || "";
          return (
            <div key={idx} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-gravity">
              <span className="font-bold text-slate-700 text-xs">{idx + 1}. {translateText(item.clue, language)}</span>
              <input
                type="text"
                className="w-full sm:w-44 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center font-bold text-xs uppercase"
                value={typedVal}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                maxLength={item.word ? item.word.length : 15}
                placeholder={language === "ar" ? `حروف الكلمة (${item.word ? item.word.length : ""} حروف)` : `Word (${item.word ? item.word.length : ""} chars)`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔢 22. COUNT_OBJECTS (عد العناصر)
// -------------------------------------------------------------
function CountObjectsRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { itemImage: "", itemName: "", count: 5 });
  const itemName = translateText(opts.itemName, language) || "item";
  const itemImage = opts.itemImage || "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=150";
  // Use count from options (default 5)
  const itemCount = Math.max(1, Math.min(20, parseInt(opts.count ?? 5) || 5));

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {translateText(question.title, language) || (language === "ar" ? `كم عدد الـ ${itemName} الموجودة بالأسفل؟` : `How many ${itemName} are shown below?`)}
      </h4>
      
      <div className="flex flex-wrap gap-3 justify-center py-6 bg-slate-50 rounded-3xl border border-slate-150">
        {Array.from({ length: itemCount }).map((_, i) => (
          <img
            key={i}
            src={itemImage}
            alt={itemName}
            className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-md animate-gravity"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      <div className="w-full max-w-xs mx-auto space-y-2">
        <label className="text-xs font-bold text-slate-500 block text-center">{language === "ar" ? "العدد الكلي:" : "Total count:"}</label>
        <input
          type="number"
          min="0"
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center font-bold text-2xl"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={language === "ar" ? "اكتب العدد..." : "Type number..."}
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🖼️ 23. IMAGE_LABEL (تسمية أجزاء الصورة)
// -------------------------------------------------------------
function ImageLabelRenderer({ question, value, onChange, language }: any) {
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
          <img src={imageUrl} alt="Background" className="w-full h-full object-cover" />
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

// -------------------------------------------------------------
// 🎨 24. COLOR_MATCH (تطابق الألوان)
// -------------------------------------------------------------
function ColorMatchRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { pairs: [] });
  const pairs = Array.isArray(opts?.pairs) ? opts.pairs : [];
  
  const currentAnswers = parseJson(value, {});

  const handleColorChange = (idx: number, colorText: string) => {
    const nextAnswers = { ...currentAnswers, [idx]: colorText };
    onChange(JSON.stringify(nextAnswers));
  };

  return (
    <div className={`space-y-4 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "حدد اللون الصحيح لكل عنصر بالأسفل:" : "Define the correct color for each element below:"}
      </span>
      <div className="space-y-3.5">
        {pairs.map((p: any, idx: number) => {
          const typedVal = currentAnswers[idx] || "";
          return (
            <div key={idx} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-gravity">
              <span className="font-black text-slate-800 text-sm">
                {language === "ar" ? `ماهو لون الـ ${translateText(p.item, language)}؟` : `What is the color of ${translateText(p.item, language)}?`}
              </span>
              <input
                type="text"
                className="w-full sm:w-44 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-center font-bold text-xs"
                value={typedVal}
                onChange={(e) => handleColorChange(idx, e.target.value)}
                placeholder={language === "ar" ? "مثال: أصفر" : "Example: Yellow"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
