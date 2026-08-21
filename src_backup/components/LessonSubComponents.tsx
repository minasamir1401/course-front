"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Lock, HelpCircle, Info, BookOpen, MessageSquare, Sparkles, ChevronDown, ChevronRight, ChevronLeft, FileDown, Target, X } from "lucide-react";
import HtmlRenderer from "@/components/HtmlRenderer";
import { InteractiveTag } from "@/components/InteractiveTag";
import AnimatedFeedback from "@/components/AnimatedFeedback";
import { createPortal } from "react-dom";

export const normalizeAnswerGlobal = (value: any) => {
  const norm = String(value ?? '').trim().toLowerCase();
  if (['true', 'صح', 'صحيح', 'صواب', '1'].includes(norm)) return 'true';
  if (['false', 'خطأ', 'خاطئ', 'غير صحيح', '0'].includes(norm)) return 'false';
  return norm;
};

export const checkAdvancedCorrect = (q: any, ans: any) => {
  if (!ans) return false;
  
  if (q?.type === 'MEMORY_GAME') {
    try {
      let parsedAns = typeof ans === 'string' ? JSON.parse(ans) : ans;
      if (typeof parsedAns === 'string') parsedAns = JSON.parse(parsedAns);
      
      let parsedOpts = q.options || {};
      if (typeof parsedOpts === 'string') parsedOpts = JSON.parse(parsedOpts);
      if (typeof parsedOpts === 'string') parsedOpts = JSON.parse(parsedOpts);
      
      if (Array.isArray(parsedAns) && Array.isArray(parsedOpts?.pairs)) {
        return parsedAns.length === parsedOpts.pairs.length;
      }
    } catch(e) {}
    return false;
  }

  if (q?.type === 'TRUE_FALSE') {
    return normalizeAnswerGlobal(ans) === normalizeAnswerGlobal(q.correctAnswer);
  }
  const cleanStr = (s: any) => String(s ?? '').trim().replace(/"/g, '');
  try {
    const isJsonString = (str: any) => {
      if (typeof str !== 'string') return false;
      const trimmed = str.trim();
      return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
    };
    
    const corrAns = q.correctAnswer;
    const hasJson = isJsonString(corrAns) || isJsonString(ans) || typeof ans === 'object' || typeof corrAns === 'object';
    if (hasJson) {
      const correct = typeof corrAns === 'string' && (corrAns.startsWith('{') || corrAns.startsWith('[')) ? JSON.parse(corrAns) : corrAns;
      const student = typeof ans === 'string' && (ans.startsWith('{') || ans.startsWith('[')) ? JSON.parse(ans) : ans;
      if (Array.isArray(correct) && Array.isArray(student)) {
        return correct.length === student.length && correct.every((val: any, i: number) => cleanStr(val) === cleanStr(student[i]));
      }
      if (typeof correct === 'object' && typeof student === 'object' && correct !== null && student !== null) {
        const correctKeys = Object.keys(correct);
        const studentKeys = Object.keys(student);
        if (correctKeys.length !== studentKeys.length) return false;
        return correctKeys.every((k: string) => cleanStr(correct[k]) === cleanStr(student[k]));
      }
    }
  } catch (e) {}
  return cleanStr(ans) === cleanStr(q.correctAnswer);
};

export const isQuestionLike = (item: any) => {
  if (!item) return false;
  const type = item.type || '';
  const label = item.label || '';
  // Any block with type='QUESTION' is question-like (regardless of label)
  if (type === 'QUESTION') return true;
  // Legacy direct types
  const questionTypes = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'MATCHING', 'DRAG_DROP_FILL',
    'GROUP_SORTING', 'CLOCK', 'MIND_MAP', 'VIDEO_CHECKPOINT', 'NUMBER_LINE', 'SWIPE_SORT',
    'MAZE', 'WORD_SEARCH', 'GEOGEBRA', 'FLASH_CARD', 'MEMORY_GAME', 'WORD_SCRAMBLE',
    'SENTENCE_REORDER', 'MATH_EQUATION', 'SEQUENCE_ORDER', 'CROSSWORD', 'COUNT_OBJECTS',
    'IMAGE_LABEL', 'COLOR_MATCH'];
  if (questionTypes.includes(type)) return true;
  if (questionTypes.includes(label)) return true;
  return false;
};

export const getQuestionOptions = (q: any, language: string) => {
  if (!q) return [];
  if (q.type === 'TRUE_FALSE' || q.label === 'TRUE_FALSE') {
    return ['True', 'False'];
  }
  let options = q.options;
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      options = parsed.choices || parsed;
    } catch (e) {}
  }
  if (Array.isArray(options) && options.filter(Boolean).length > 0) {
    return options.filter(Boolean);
  }
  return [];
};

export const QuestionFeedback = ({ isCorrect, isSkipped, xp, streak, language }: any) => {
  if (isSkipped) {
    return null;
  }

  return (
    <AnimatedFeedback 
      isCorrect={isCorrect} 
      xp={xp} 
      streak={streak}
    />
  );
};

export const SectionModalButton = ({ sec, preset, language }: { sec: any; preset: any; language?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border bg-opacity-50 ${preset.bg} ${preset.border} hover:scale-[1.02] ${preset.text} font-black text-sm transition-all`}
      >
        <span className="flex items-center gap-2">
          {React.createElement(preset.icon, { className: "w-4 h-4" })}
          {preset.label}
        </span>
        {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[170] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <h4 className={`text-base font-black flex items-center gap-2 ${preset.text}`}>
              {React.createElement(preset.icon, { className: "w-5 h-5" })}
              {preset.label}
            </h4>
            <div className="text-slate-600 text-sm font-bold leading-relaxed max-h-[60vh] overflow-y-auto">
              <HtmlRenderer html={sec.content} />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-sm transition-all"
              >
                {language === 'ar' ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const MetadataModalButton = ({ icon: Icon, label, content, language, color }: { icon: any, label: string, content: string, language?: string, color: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (/[\u0600-\u06FF]/.test(content || "")) {
    return null;
  }

  const colorStyles: Record<string, string> = {
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    indigo: "text-indigo-700 bg-indigo-50 border-indigo-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100",
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border bg-opacity-50 hover:scale-[1.02] ${style} font-black text-xs transition-all`}
      >
        <span className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        {language === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[170] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <h4 className={`text-sm font-black flex items-center gap-2 ${style.split(' ')[0]}`}>
              <Icon className="w-4 h-4" />
              {label}
            </h4>
            <div className="text-slate-700 text-sm font-bold leading-relaxed max-h-[60vh] overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {content}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all"
              >
                {language === 'ar' ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const WelcomeGadgetCard = ({ item, t }: { item: any; t: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-slate-50/50 border border-slate-100 p-6 md:p-8 rounded-[35px] hover:bg-white hover:shadow-xl transition-all duration-500 group flex flex-col">
      <div 
        className="cursor-pointer flex flex-col items-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex w-full items-center justify-between mb-4">
          <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm`}>
            {React.createElement(item.icon, { className: "w-7 h-7" })}
          </div>
          <button className={`w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </button>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{item.title}</h3>
      </div>
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="text-sm md:text-base text-slate-600 leading-relaxed font-bold whitespace-pre-wrap">
            {item.content || t('lesson.plannedGoals')}
          </div>
        </div>
      )}
    </div>
  );
};

export const ItemSectionsBubbles = ({ item, isSubmitted, language, filterType = 'ALL' }: { item: any; isSubmitted: boolean; language: string; filterType?: 'HINT_ONLY' | 'POST_ANSWER_ONLY' | 'PRE_QUESTION_ONLY' | 'ALL' }) => {
  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "نقطة هامة" : "Insight" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح مفصل" : "Explanation" }
  };

  if (!item?.sections || item.sections.length === 0) return null;
  
  let filteredSections = item.sections.filter((sec: any) => sec.type !== 'FEEDBACK' && sec.type !== 'EXPLANATION');
  if (filterType === 'HINT_ONLY') {
    filteredSections = filteredSections.filter((sec: any) => sec.type === 'HINT');
  } else if (filterType === 'PRE_QUESTION_ONLY') {
    filteredSections = filteredSections.filter((sec: any) => sec.type === 'WARNING');
  } else if (filterType === 'POST_ANSWER_ONLY') {
    filteredSections = filteredSections.filter((sec: any) => sec.type !== 'HINT' && sec.type !== 'WARNING');
  }
  
  if (filteredSections.length === 0) return null;
  
  // Only show non-HINT/WARNING sections if submitted.
  const sectionsToShow = filteredSections.filter((sec: any) => sec.type === 'HINT' || sec.type === 'WARNING' || isSubmitted);

  if (sectionsToShow.length === 0) return null;
  
  return (
    <>
      {sectionsToShow.map((sec: any, idx: number) => {
        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
        return (
          <InteractiveTag 
            key={sec.id || idx}
            label={preset.label}
            value={<HtmlRenderer html={sec.content} />}
            icon={preset.icon}
            colorClass={`${preset.bg} ${preset.text} border ${preset.border} hover:scale-[1.02]`}
            bubbleTheme={`${preset.border} ${preset.text}`}
            variant="helper"
          />
        );
      })}
    </>
  );
};
