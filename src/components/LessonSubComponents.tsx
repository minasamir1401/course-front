"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Lock, HelpCircle, Info, BookOpen, MessageSquare, Sparkles, ChevronDown, ChevronRight, ChevronLeft, FileDown, Target } from "lucide-react";
import HtmlRenderer from "@/components/HtmlRenderer";
import AnimatedFeedback from "@/components/AnimatedFeedback";

export const normalizeAnswerGlobal = (value: any) => {
  const norm = String(value ?? '').trim().toLowerCase();
  if (['true', 'صح', 'صحيح', 'صواب', '1'].includes(norm)) return 'true';
  if (['false', 'خطأ', 'خاطئ', 'غير صحيح', '0'].includes(norm)) return 'false';
  return norm;
};

export const checkAdvancedCorrect = (q: any, ans: any) => {
  if (!ans) return false;
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

export const SectionAccordion = ({ sec, preset }: { sec: any; preset: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl ${preset.bg} border-2 ${preset.border} hover:opacity-80 transition-all font-black ${preset.text} text-sm`}
      >
        {React.createElement(preset.icon, { className: "w-5 h-5" })}
        <span>{preset.label}</span>
        <span className={`mr-auto text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className={`p-5 rounded-2xl ${preset.bg} border-2 ${preset.border} animate-in fade-in slide-in-from-top-2 duration-300`}>
          <div className={`flex items-center gap-2 mb-3 font-black ${preset.text}`}>
            {React.createElement(preset.icon, { className: "w-5 h-5" })}
            <span>{preset.label}</span>
          </div>
          <HtmlRenderer html={sec.content} className={`prose prose-sm max-w-none ${preset.text}`} />
        </div>
      )}
    </div>
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

export const SlideSectionsToggle = ({ slide, slideIndex, slideSubmitted, slideAnswers, language }: { slide: any; slideIndex: number; slideSubmitted: Record<number, boolean>; slideAnswers?: Record<number, any>; language: string }) => {
  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: language === 'ar' ? "نقطة هامة" : "Key Insight" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح مفصل" : "Explanation" }
  };

  if (!slide.sections || slide.sections.length === 0) return null;
  
  const filteredSections = slide.sections.filter((sec: any) => sec.type !== 'FEEDBACK');
  if (filteredSections.length === 0) return null;
  
  const isSubmitted = !isQuestionLike(slide) || slideSubmitted[slideIndex];
  const sectionsToShow = filteredSections.filter((sec: any) => sec.type === 'HINT' || isSubmitted);

  if (sectionsToShow.length === 0) return null;
  
  return (
    <div className="mt-6 w-full max-w-4xl space-y-4">
      {sectionsToShow.map((sec: any, idx: number) => {
        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
        return <SectionAccordion key={sec.id || idx} sec={sec} preset={preset} />;
      })}
    </div>
  );
};

export const AssignmentSectionsToggle = ({ assignment, assignmentIndex, assignmentSubmitted, assignmentAnswers, language }: { assignment: any; assignmentIndex: number; assignmentSubmitted: Record<number, boolean>; assignmentAnswers?: Record<number, any>; language: string }) => {
  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: language === 'ar' ? "نقطة هامة" : "Key Insight" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح مفصل" : "Explanation" }
  };

  if (!assignment.sections || assignment.sections.length === 0) return null;
  const filteredSections = assignment.sections.filter((sec: any) => sec.type !== 'FEEDBACK');
  if (filteredSections.length === 0) return null;
  const isSubmitted = assignmentSubmitted[assignmentIndex] || !isQuestionLike(assignment);
  const sectionsToShow = filteredSections.filter((sec: any) => sec.type === 'HINT' || isSubmitted);

  if (sectionsToShow.length === 0) return null;
  
  return (
    <div className="mt-4 space-y-4">
      {sectionsToShow.map((sec: any, idx: number) => {
        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
        return <SectionAccordion key={sec.id || idx} sec={sec} preset={preset} />;
      })}
    </div>
  );
};

export const QuizSectionsToggle = ({ question, questionIndex, quizSubmitted, quizAnswers, language }: { question: any; questionIndex: number; quizSubmitted: Record<number, boolean>; quizAnswers?: Record<number, any>; language: string }) => {
  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: language === 'ar' ? "نقطة هامة" : "Key Insight" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح مفصل" : "Explanation" }
  };

  if (!question.sections || question.sections.length === 0) return null;
  
  const filteredSections = question.sections.filter((sec: any) => sec.type !== 'FEEDBACK');
  if (filteredSections.length === 0) return null;
  
  const isSubmitted = quizSubmitted[questionIndex];
  const sectionsToShow = filteredSections.filter((sec: any) => sec.type === 'HINT' || isSubmitted);
    
  if (sectionsToShow.length === 0) return null;

  return (
    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
      {sectionsToShow.map((sec: any, idx: number) => {
        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
        return <SectionAccordion key={sec.id || idx} sec={sec} preset={preset} />;
      })}
    </div>
  );
};
