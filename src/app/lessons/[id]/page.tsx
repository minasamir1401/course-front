"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
import {
  Play, Pause, ChevronLeft, ChevronRight, CheckCircle,
  HelpCircle, BookOpen, Target, Layout, Monitor,
  MessageSquare, FileDown, Clock, Info, X, Maximize,
  Volume2, Settings, ArrowRight, ArrowLeft, Star, Award, RotateCcw,
  CheckCircle2, AlertCircle, Sparkles, Lock, Timer,
  ArrowUpRight, ListOrdered, TrendingUp, GraduationCap
} from "lucide-react";
import dynamic from 'next/dynamic';
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

const QuestionFeedback = ({ isCorrect, correctAnswer, language }: any) => {
  if (!isCorrect) {
    return (
      <div className="p-6 rounded-[30px] border-2 flex flex-col items-center justify-center gap-3 animate-in zoom-in duration-500 mb-6 bg-red-50 border-red-200">
        <div className="relative w-20 h-20 rounded-3xl bg-red-500/10 border-2 border-red-300 flex items-center justify-center animate-pulse">
          <div className="absolute inset-0 rounded-3xl border-2 border-red-400/40 animate-ping" />
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <p className="text-red-700 font-black text-sm md:text-base">
          {language === 'ar' ? 'إجابة غير صحيحة' : 'Incorrect answer'}
        </p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-[30px] border-2 flex items-center gap-6 animate-in zoom-in duration-500 mb-6 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
      <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center shadow-lg ${isCorrect ? 'bg-emerald-500 shadow-emerald-200 animate-bounce' : 'bg-red-500 shadow-red-200 animate-pulse'}`}>
        <span className="text-4xl">{isCorrect ? '🎉' : '❌'}</span>
      </div>
      <div>
        <h3 className={`text-xl md:text-2xl font-black mb-2 ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
          {isCorrect
            ? (language === 'ar' ? 'أحسنت! إجابة صحيحة' : 'Great Job! Correct')
            : (language === 'ar' ? 'حاول مرة أخرى' : 'Try Again')}
        </h3>
        {isCorrect && (
          <p className="text-emerald-600 font-bold text-sm md:text-base">
            {language === 'ar' ? 'عمل ممتاز، استمر في هذا الأداء!' : 'Excellent work, keep it up!'}
          </p>
        )}
      </div>
    </div>
  );
};

const SectionsInlineTabs = ({
  sections,
  language,
  isSubmitted = true
}: {
  sections: any[],
  language: string,
  isSubmitted?: boolean
}) => {
  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint", chip: "bg-amber-100 text-amber-700 border-amber-200" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip", chip: "bg-blue-100 text-blue-700 border-blue-200" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning", chip: "bg-red-100 text-red-700 border-red-200" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: language === 'ar' ? "نقطة هامة" : "Key Insight", chip: "bg-purple-100 text-purple-700 border-purple-200" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback", chip: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح" : "Explanation", chip: "bg-indigo-100 text-indigo-700 border-indigo-200" }
  };

  const filteredSections = (sections || []).filter((sec) => sec?.type !== "FEEDBACK");
  const [activeIndex, setActiveIndex] = useState(0);

  // Default active index to the first unlocked section (usually HINT) if currently locked
  useEffect(() => {
    const defaultIdx = filteredSections.findIndex(
      (sec) => sec.type === 'HINT' || isSubmitted
    );
    setActiveIndex(defaultIdx >= 0 ? defaultIdx : 0);
  }, [filteredSections.length, isSubmitted]);

  if (!filteredSections.length) return null;

  const active = filteredSections[Math.min(activeIndex, filteredSections.length - 1)];
  const preset = SECTION_STYLE_PRESETS[active.type] || SECTION_STYLE_PRESETS.HINT;
  const ActiveIcon = preset.icon;
  const isActiveLocked = active.type !== 'HINT' && !isSubmitted;

  return (
    <div className="mt-5 w-full space-y-4">
      <div className={`flex flex-wrap gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
        {filteredSections.map((sec, idx) => {
          const p = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.HINT;
          const Icon = p.icon;
          const isActive = idx === activeIndex;
          const isLocked = sec.type !== 'HINT' && !isSubmitted;

          return (
            <button
              key={sec.id || idx}
              type="button"
              onClick={() => {
                if (!isLocked) {
                  setActiveIndex(idx);
                }
              }}
              disabled={isLocked}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-xs md:text-sm transition-all ${
                isLocked 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' 
                  : isActive 
                    ? `${p.chip} shadow-sm scale-[1.02]` 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-4 h-4" />}
              <span>{p.label}</span>
              {isLocked && <span className="text-[10px]">🔒</span>}
            </button>
          );
        })}
      </div>

      <div className={`rounded-2xl border-2 p-5 md:p-6 transition-all duration-300 ${isActiveLocked ? 'bg-slate-50 border-slate-200 text-slate-400' : `${preset.bg} ${preset.border}`}`}>
        <div className={`flex items-center gap-2 mb-3 font-black ${isActiveLocked ? 'text-slate-500' : preset.text}`}>
          {isActiveLocked ? <Lock className="w-5 h-5 text-slate-400 animate-pulse" /> : <ActiveIcon className="w-5 h-5" />}
          <span>{preset.label}</span>
        </div>
        {isActiveLocked ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <span className="text-3xl animate-bounce">🔒</span>
            <p className="font-bold text-sm md:text-base text-slate-700">
              {language === 'ar' 
                ? 'هذا القسم مغلق حتى تقوم بتأكيد إجابتك' 
                : 'This section is locked until you submit your answer'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'ar'
                ? 'قم بحل السؤال وتأكيد إجابتك أولاً لعرض هذا المحتوى'
                : 'Solve the question and confirm your answer first to view this content'}
            </p>
          </div>
        ) : (
          <div
            className={`prose prose-sm md:prose-base max-w-none leading-relaxed break-words ${preset.text}`}
            dir="auto"
            dangerouslySetInnerHTML={{ __html: active.content }}
          />
        )}
      </div>
    </div>
  );
};

const isQuestionLike = (item: any) =>
  item?.type === 'QUESTION' || item?.type === 'MCQ' || item?.type === 'TRUE_FALSE' || item?.type === 'MULTI_SELECT' || item?.label === 'MULTI_SELECT';

const getQuestionOptions = (q: any, language: string) => {
  if (!q) return [];
  if (Array.isArray(q.options) && q.options.filter(Boolean).length > 0) {
    return q.options.filter(Boolean);
  }
  if (q.type === 'TRUE_FALSE') {
    return [language === 'ar' ? 'صحيح' : 'True', language === 'ar' ? 'خطأ' : 'False'];
  }
  return [];
};

const SlideSectionsToggle = ({ slide, slideIndex, slideSubmitted, slideAnswers, language }: { slide: any; slideIndex: number; slideSubmitted: Record<number, boolean>; slideAnswers: Record<number, any>; language: string }) => {
  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: language === 'ar' ? "نقطة هامة" : "Key Insight" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح مفصل" : "Explanation" }
  };

  const [showSlideSections, setShowSlideSections] = useState(false);

  if (!slide.sections || slide.sections.length === 0) return null;
  
  const filteredSections = slide.sections.filter((sec: any) => sec.type !== 'FEEDBACK');
  if (filteredSections.length === 0) return null;
  
  const isSubmitted = !isQuestionLike(slide) || slideSubmitted[slideIndex];
  const hintSection = filteredSections.find((s: any) => s.type === 'HINT');
  const otherSections = isSubmitted 
    ? filteredSections.filter((s: any) => s.type !== 'HINT')
    : [];

  if (!hintSection && otherSections.length === 0) return null;
  
  return (
    <div className="mt-6 w-full max-w-4xl space-y-4">
      {hintSection && (
        <div className="space-y-3">
          <button
            onClick={() => setShowSlideSections(!showSlideSections)}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 transition-all font-black text-amber-700 text-sm"
          >
            <HelpCircle className="w-5 h-5" />
            <span>{SECTION_STYLE_PRESETS.HINT.label}</span>
            <span className={`mr-auto text-lg transition-transform ${showSlideSections ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showSlideSections && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-3 font-black text-amber-700">
                <HelpCircle className="w-5 h-5" />
                <span>{SECTION_STYLE_PRESETS.HINT.label}</span>
              </div>
              <div className="prose prose-sm max-w-none text-amber-700 animate-in duration-200" dir="auto" dangerouslySetInnerHTML={{ __html: hintSection.content }} />
            </div>
          )}
        </div>
      )}
      
      {otherSections.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          {otherSections.map((sec: any, sIdx: number) => {
            const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
            return (
              <div key={sec.id || sIdx} className={`p-5 rounded-2xl border-2 ${preset.bg} ${preset.border}`}>
                <div className={`flex items-center gap-2 mb-3 font-black ${preset.text}`}>
                  {React.createElement(preset.icon, { className: "w-5 h-5" })}
                  <span>{preset.label}</span>
                </div>
                <div className={`prose prose-sm max-w-none ${preset.text}`} dir="auto" dangerouslySetInnerHTML={{ __html: sec.content }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AssignmentSectionsToggle = ({ assignment, assignmentIndex, assignmentSubmitted, assignmentAnswers, language }: { assignment: any; assignmentIndex: number; assignmentSubmitted: Record<number, boolean>; assignmentAnswers: Record<number, any>; language: string }) => {
  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: language === 'ar' ? "نقطة هامة" : "Key Insight" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح مفصل" : "Explanation" }
  };

  const [showSections, setShowSections] = useState(false);

  if (!assignment.sections || assignment.sections.length === 0) return null;
  const filteredSections = assignment.sections.filter((sec: any) => sec.type !== 'FEEDBACK');
  if (filteredSections.length === 0) return null;
  const isSubmitted = assignmentSubmitted[assignmentIndex] || !isQuestionLike(assignment);
  
  const hintSection = filteredSections.find((s: any) => s.type === 'HINT');
  const otherSections = isSubmitted
    ? filteredSections.filter((s: any) => s.type !== 'HINT')
    : [];

  if (!hintSection && otherSections.length === 0) return null;
  
  return (
    <div className="mt-4 space-y-4">
      {hintSection && (
        <div className="space-y-3">
          <button
            onClick={() => setShowSections(!showSections)}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 transition-all font-black text-amber-700 text-sm"
          >
            <HelpCircle className="w-5 h-5" />
            <span>{SECTION_STYLE_PRESETS.HINT.label}</span>
            <span className={`mr-auto text-lg transition-transform ${showSections ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showSections && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-3 font-black text-amber-700">
                <HelpCircle className="w-5 h-5" />
                <span>{SECTION_STYLE_PRESETS.HINT.label}</span>
              </div>
              <div className="prose prose-sm max-w-none text-amber-700 animate-in duration-200" dir="auto" dangerouslySetInnerHTML={{ __html: hintSection.content }} />
            </div>
          )}
        </div>
      )}
      
      {otherSections.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          {otherSections.map((sec: any, sIdx: number) => {
            const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
            return (
              <div key={sec.id || sIdx} className={`p-5 rounded-2xl border-2 ${preset.bg} ${preset.border}`}>
                <div className={`flex items-center gap-2 mb-3 font-black ${preset.text}`}>
                  {React.createElement(preset.icon, { className: "w-5 h-5" })}
                  <span>{preset.label}</span>
                </div>
                <div className={`prose prose-sm max-w-none ${preset.text}`} dir="auto" dangerouslySetInnerHTML={{ __html: sec.content }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const QuizSectionsToggle = ({ question, questionIndex, quizSubmitted, language }: { question: any; questionIndex: number; quizSubmitted: Record<number, boolean>; language: string }) => {
  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: language === 'ar' ? "نقطة هامة" : "Key Insight" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح مفصل" : "Explanation" }
  };

  const [showQuizSections, setShowQuizSections] = useState(false);

  if (!question.sections || question.sections.length === 0) return null;
  
  const filteredSections = question.sections.filter((sec: any) => sec.type !== 'FEEDBACK');
  if (filteredSections.length === 0) return null;
  
  const isSubmitted = quizSubmitted[questionIndex];
  const hintSection = filteredSections.find((s: any) => s.type === 'HINT');
  const otherSections = isSubmitted 
    ? filteredSections.filter((s: any) => s.type !== 'HINT')
    : [];
    
  if (!hintSection && otherSections.length === 0) return null;

  return (
    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
      {hintSection && (
        <div className="space-y-3">
          <button
            onClick={() => setShowQuizSections(!showQuizSections)}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 transition-all font-black text-amber-700 text-sm"
          >
            <HelpCircle className="w-5 h-5" />
            <span>{SECTION_STYLE_PRESETS.HINT.label}</span>
            <span className={`mr-auto text-lg transition-transform ${showQuizSections ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showQuizSections && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-3 font-black text-amber-700">
                <HelpCircle className="w-5 h-5" />
                <span>{SECTION_STYLE_PRESETS.HINT.label}</span>
              </div>
              <div className="prose prose-sm max-w-none text-amber-700 animate-in duration-200" dir="auto" dangerouslySetInnerHTML={{ __html: hintSection.content }} />
            </div>
          )}
        </div>
      )}
      
      {otherSections.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          {otherSections.map((sec: any, sIdx: number) => {
            const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
            return (
              <div key={sec.id || sIdx} className={`p-5 rounded-2xl border-2 ${preset.bg} ${preset.border}`}>
                <div className={`flex items-center gap-2 mb-3 font-black ${preset.text}`}>
                  {React.createElement(preset.icon, { className: "w-5 h-5" })}
                  <span>{preset.label}</span>
                </div>
                <div className={`prose prose-sm max-w-none ${preset.text}`} dir="auto" dangerouslySetInnerHTML={{ __html: sec.content }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function LessonPlayerPage() {
  const { t, language } = useLanguage();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = searchParams.get('courseId');
  const lessonId = params.id as string;
  const { showToast } = useNotification();

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  // Player State
  const [currentStage, setCurrentStage] = useState<'welcome' | 'slides' | 'assignments' | 'exercises' | 'summary'>('welcome');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [score, setScore] = useState(0);
  const [quizTimer, setQuizTimer] = useState(0);

  const [slideAnswers, setSlideAnswers] = useState<Record<number, any>>({});
  const [slideSubmitted, setSlideSubmitted] = useState<Record<number, boolean>>({});
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<number, any>>({});
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<Record<number, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptedQuestionsCount, setAttemptedQuestionsCount] = useState(0);
  const [attemptedMaxScore, setAttemptedMaxScore] = useState(0);
  const [actualVideoDuration, setActualVideoDuration] = useState<number>(0);

  const normalizeAnswer = (value: any) => String(value ?? '').trim().toLowerCase();

  // Dynamic Score Calculation across Slides, Assignments, and Exercises
  useEffect(() => {
    if (!lesson) return;

    let totalScore = 0;
    let correctQ = 0;
    let totalQ = 0;
    let attemptedQ = 0;
    let attemptedScoreCap = 0;

    // 1. Slides questions
    lesson.slides?.forEach((slide: any, idx: number) => {
      if (isQuestionLike(slide)) {
        totalQ++;
        if (slideSubmitted[idx]) {
          attemptedQ++;
          attemptedScoreCap += (Number(slide.points) || 1);
          const isMulti = slide.label === 'MULTI_SELECT';
          const studentAnswers = slideAnswers[idx] || (isMulti ? [] : '');
          const isCorrect = isMulti
            ? studentAnswers.length === (slide.correctAnswers || []).length &&
              studentAnswers.every((a: string) => (slide.correctAnswers || []).map(normalizeAnswer).includes(normalizeAnswer(a)))
            : (!slide.correctAnswer || normalizeAnswer(slideAnswers[idx]) === normalizeAnswer(slide.correctAnswer));
          if (isCorrect && studentAnswers.length > 0) {
            totalScore += (Number(slide.points) || 1);
            correctQ++;
          }
        }
      }
    });

    // 2. Assignment questions
    lesson.assignments?.forEach((as: any, idx: number) => {
      if (isQuestionLike(as)) {
        totalQ++;
        if (assignmentSubmitted[idx]) {
          attemptedQ++;
          attemptedScoreCap += (Number(as.points) || 1);
          const isMulti = as.type === 'MULTI_SELECT';
          const studentAnswers = assignmentAnswers[idx] || (isMulti ? [] : '');
          const isCorrect = isMulti
            ? studentAnswers.length === (as.correctAnswers || []).length &&
              studentAnswers.every((a: string) => (as.correctAnswers || []).map(normalizeAnswer).includes(normalizeAnswer(a)))
            : (!as.correctAnswer || normalizeAnswer(assignmentAnswers[idx]) === normalizeAnswer(as.correctAnswer));
          if (isCorrect && studentAnswers.length > 0) {
            totalScore += (Number(as.points) || 1);
            correctQ++;
          }
        }
      }
    });

    // 3. Exercise questions
    lesson.questions?.forEach((q: any, idx: number) => {
      if (isQuestionLike(q) || !q.type) {
        totalQ++;
        if (quizSubmitted[idx]) {
          attemptedQ++;
          attemptedScoreCap += (Number(q.points) || 1);
          const isMulti = q.type === 'MULTI_SELECT';
          const studentAnswers = answers[idx] || (isMulti ? [] : '');
          const isCorrect = isMulti
            ? studentAnswers.length === (q.correctAnswers || []).length &&
              studentAnswers.every((a: string) => (q.correctAnswers || []).map(normalizeAnswer).includes(normalizeAnswer(a)))
            : (!q.correctAnswer || normalizeAnswer(answers[idx]) === normalizeAnswer(q.correctAnswer));
          if (isCorrect && studentAnswers.length > 0) {
            totalScore += (Number(q.points) || 1);
            correctQ++;
          }
        }
      }
    });

    setScore(totalScore);
    setCorrectCount(correctQ);
    setAttemptedQuestionsCount(attemptedQ);
    setAttemptedMaxScore(Math.max(1, attemptedScoreCap));
  }, [slideAnswers, slideSubmitted, assignmentAnswers, assignmentSubmitted, answers, quizSubmitted, lesson]);

  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "تلميح" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "نصيحة" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "تحذير" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "نقطة هامة" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "ملاحظات" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "شرح مفصل" }
  };

  useEffect(() => {
    let interval: any;
    if (currentStage === 'exercises') {
      interval = setInterval(() => {
        setQuizTimer(prev => prev + 1);
      }, 1000);
    } else {
      setQuizTimer(0);
    }
    return () => clearInterval(interval);
  }, [currentStage]);

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("lms_token") || 
                    localStorage.getItem("super_admin_token") || 
                    localStorage.getItem("school_admin_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/lessons/${lessonId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();

        // Check Cut-off Date
        if (data.cutOffDate) {
          const now = new Date();
          const cutOff = new Date(data.cutOffDate);
          if (now > cutOff) {
            setIsExpired(true);
            setIsLoading(false);
            return;
          }
        }

        // Parse metadata
        let slides = [];
        let questions = [];
        let assignments = [];
        let attachments = [];

        try { slides = typeof data.slides === 'string' ? JSON.parse(data.slides) : (data.slides || []); } catch (e) { }
        try { questions = typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || []); } catch (e) { }
        try { assignments = typeof data.assignments === 'string' ? JSON.parse(data.assignments) : (data.assignments || []); } catch (e) { }
        try { attachments = typeof data.attachments === 'string' ? JSON.parse(data.attachments) : (data.attachments || []); } catch (e) { }

        const sanitizedQuestions = Array.isArray(questions) ? questions.map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        })) : [];

        const sanitizedAssignments = Array.isArray(assignments) ? assignments.map(a => ({
          ...a,
          options: Array.isArray(a.options) ? a.options : []
        })) : [];

        const parsedSlides = Array.isArray(slides) && slides.length ? [...slides] : [{ title: t('lesson.lessonIntro'), content: data.summary || t('lesson.welcomeToLesson') }];
        if (data.videoUrl) {
          parsedSlides.unshift({
            id: 'intro-video-slide',
            title: language === 'ar' ? "فيديو مقدمة الدرس" : "Lesson Introduction Video",
            content: `<p>${language === 'ar' ? 'يرجى مشاهدة هذا الفيديو التمهيدي قبل البدء في تصفح الدرس الشرح.' : 'Please watch this introductory video before you start browsing the lesson explanation.'}</p>`,
            videoUrl: data.videoUrl
          });
        }

        setLesson({
          ...data,
          slides: parsedSlides,
          questions: sanitizedQuestions,
          assignments: sanitizedAssignments,
          attachments: Array.isArray(attachments) ? attachments : []
        });

        const finalCourseId = data.courseId || courseId;
        if (finalCourseId) {
          const cRes = await fetch(`${API_URL}/courses/${finalCourseId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (cRes.ok) {
            const courseData = await cRes.json();
            setCourse(courseData);
            if (Array.isArray(courseData.lessons)) {
              const sorted = [...courseData.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              setCourseLessons(sorted);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch lesson data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async (state: { playedSeconds: number }) => {
    if (searchParams.get('preview') === 'true') return; // Do not save progress in preview mode
    try {
      const token = localStorage.getItem("lms_token") || 
                    localStorage.getItem("super_admin_token") || 
                    localStorage.getItem("school_admin_token");
      if (!token) return;

      await fetch(`${API_URL}/progress/lesson/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ watchedSeconds: Math.floor(state.playedSeconds) })
      });
    } catch (error) {
      console.error("Progress save failed", error);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (quizSubmitted[currentQuestionIndex]) return;
    if (lesson.questions[currentQuestionIndex]?.type === 'MULTI_SELECT') {
      const currentArr = answers[currentQuestionIndex] || [];
      const newArr = currentArr.includes(option) ? currentArr.filter((a: string) => a !== option) : [...currentArr, option];
      setAnswers({ ...answers, [currentQuestionIndex]: newArr });
    } else {
      setAnswers({ ...answers, [currentQuestionIndex]: option });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < lesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStage('summary');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 border-[6px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-200 mx-auto"></div>
            <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] animate-pulse">{t('lesson.preparing')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isExpired) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-24 h-24 bg-red-500/10 rounded-[40px] flex items-center justify-center mb-8 border border-red-500/20 animate-bounce">
            <Timer className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{t('lesson.expiredAccess')}</h2>
          <p className="text-slate-500 text-lg font-bold max-w-md mb-12 leading-relaxed">
            {t('lesson.expiredMessage')} ({new Date(lesson?.cutOffDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}). {t('lesson.contactAdmin')}
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="bg-indigo-600 text-white px-12 py-5 rounded-[22px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-100"
          >
            {t('lesson.backToCourses')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
            <p className="text-slate-400 font-black text-xl">{t('lesson.contentNotAvailable')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentLessonIdx = courseLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentLessonIdx > 0 ? courseLessons[currentLessonIdx - 1] : null;
  const nextLesson = currentLessonIdx >= 0 && currentLessonIdx < courseLessons.length - 1 ? courseLessons[currentLessonIdx + 1] : null;

  const goToLesson = (lsn: any) => {
    router.push(`/lessons/${lsn.id}?courseId=${lesson?.courseId || courseId}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-12 pb-24 overflow-x-hidden px-1 sm:px-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>

        {/* Preview Banner */}
        {searchParams.get('preview') === 'true' && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between shadow-lg font-black text-sm gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 animate-pulse text-amber-200" />
              <span>{language === 'ar' ? 'وضع المعاينة النشط (لن يتم تسجيل المشاهدة أو نتائج التمارين في قاعدة البيانات)' : 'Active Preview Mode (Progress and exercise results will not be recorded in database)'}</span>
            </div>
            <button 
              onClick={() => window.close()} 
              className="bg-white/20 hover:bg-white text-white hover:text-orange-600 px-6 py-2.5 rounded-2xl transition-all text-xs font-black shadow-inner"
            >
              {language === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
            </button>
          </div>
        )}

        {/* ── TOP HEADER BAR ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 px-1 sm:px-2">
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            {prevLesson ? (
              <button
                onClick={() => goToLesson(prevLesson)}
                className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm group shrink-0"
                title={prevLesson.title}
              >
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            ) : (
              <button
                onClick={() => router.back()}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
              >
                <ArrowRight className="w-6 h-6 text-slate-900" />
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">{lesson.title}</h1>
              <p className="text-indigo-600 font-bold text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {course?.title || t('lesson.educationalCourse')}
              </p>
            </div>
            {nextLesson && (
              <button
                onClick={() => goToLesson(nextLesson)}
                className="w-12 h-12 rounded-2xl bg-indigo-600 border-2 border-indigo-600 flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group shrink-0"
                title={nextLesson.title}
              >
                <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-1.5 p-2 bg-slate-100/50 rounded-2xl">
              {['welcome', 'slides', 'assignments', 'exercises', 'summary'].map((s) => (
                <div key={s} className={`h-2 rounded-full transition-all duration-500 ${currentStage === s ? 'w-10 bg-indigo-600 shadow-lg shadow-indigo-100' : 'w-4 bg-slate-200'}`}></div>
              ))}
            </div>
            <div className="h-10 w-px bg-slate-100 mx-2"></div>
            <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 shadow-xl shadow-indigo-100">
              <Star className="w-5 h-5 fill-current text-amber-300" />
              {score} {t('lesson.pointsEarned')}
            </div>
          </div>
        </div>

        {/* Elegant Next/Prev Lesson Switcher Bar (Placed directly below the header) */}
        {(prevLesson || nextLesson) && (
          <div className="premium-card p-4 rounded-[30px] flex flex-col sm:flex-row items-center justify-between border-r-4 border-indigo-600 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {language === 'ar' ? 'تنقل سريع بين الدروس' : 'Quick Lesson Navigation'}
                </p>
                <p className="text-sm font-black text-slate-700 truncate max-w-[250px]">
                  {course?.title || (language === 'ar' ? "الكورس الدراسي" : "Educational Course")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              {prevLesson && (
                <button
                  onClick={() => goToLesson(prevLesson)}
                  title={prevLesson.title}
                  className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black text-sm hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm group cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-indigo-600" />
                  <div className="flex flex-col text-start">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'ar' ? 'الدرس السابق' : 'Previous Lesson'}
                    </span>
                    <span className="truncate max-w-[140px] text-xs sm:text-sm font-black">{prevLesson.title}</span>
                  </div>
                </button>
              )}
              {nextLesson && (
                <button
                  onClick={() => goToLesson(nextLesson)}
                  title={nextLesson.title}
                  className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 group cursor-pointer"
                >
                  <div className="flex flex-col text-start">
                    <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">
                      {language === 'ar' ? 'الدرس التالي' : 'Next Lesson'}
                    </span>
                    <span className="truncate max-w-[140px] text-xs sm:text-sm font-black">{nextLesson.title}</span>
                  </div>
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform text-indigo-200 group-hover:text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT AREA ── */}
        <div className={`grid grid-cols-1 items-start ${currentStage === 'welcome' || currentStage === 'summary' ? 'xl:grid-cols-12' : 'xl:grid-cols-1'} gap-10`}>

          <div className={`${currentStage === 'welcome' || currentStage === 'summary' ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-10`}>



            {currentStage === 'welcome' && (
              <div className="premium-card p-8 md:p-16 rounded-[48px] animate-in fade-in zoom-in duration-700 flex flex-col justify-center min-h-[400px]">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-100 animate-bounce-slow">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">{t('lesson.readyToStart')}</h2>
                  <p className="text-slate-500 text-base md:text-lg font-bold max-w-xl mx-auto leading-relaxed">{t('lesson.readyMessage')}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                  {[
                    { title: t('lesson.standards'), icon: Target, content: lesson.standards, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: t('lesson.indicators'), icon: TrendingUp, content: lesson.indicators, color: "text-purple-600", bg: "bg-purple-50" },
                    { title: t('lesson.outcomes'), icon: Award, content: lesson.learningOutcomes, color: "text-emerald-600", bg: "bg-emerald-50" },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50/50 border border-slate-100 p-6 md:p-8 rounded-[35px] hover:bg-white hover:shadow-xl transition-all duration-500 group">
                      <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform shadow-sm`}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{item.title}</h3>
                      <p className="text-sm md:text-base text-slate-600 leading-relaxed font-bold">{item.content || t('lesson.plannedGoals')}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 text-center space-y-6">
                  <button
                    onClick={() => setCurrentStage('slides')}
                    className="premium-gradient-primary text-white px-12 py-5 rounded-[25px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-4 mx-auto"
                  >
                    {t('lesson.showExplanation')}
                    <ArrowLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {currentStage === 'slides' && (
              <div className="premium-card rounded-[48px] overflow-hidden flex flex-col group mx-auto w-full max-w-5xl">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
                  <div className="flex items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-widest">
                    <Layout className="w-4 h-4" />
                    {t('lesson.slides')}
                  </div>
                  <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">
                    {t('lesson.slide')} {currentSlideIndex + 1} / {lesson.slides.length}
                  </div>
                </div>

                <div className="p-8 md:p-12 flex flex-col items-center text-center w-full">
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight animate-in fade-in slide-in-from-top-4 duration-500">
                    {lesson.slides[currentSlideIndex].id === 'intro-video-slide'
                      ? (language === 'ar' ? "فيديو مقدمة الدرس" : "Lesson Introduction Video")
                      : lesson.slides[currentSlideIndex].title}
                  </h3>
                  {lesson.slides[currentSlideIndex].videoUrl && (
                    <div className="w-full max-w-4xl mx-auto mb-8 rounded-[35px] overflow-hidden shadow-2xl border border-slate-100 relative aspect-video" style={{ aspectRatio: '16/9' }}>
                      <VideoPlayer
                        url={lesson.slides[currentSlideIndex].videoUrl}
                        onProgress={lesson.slides[currentSlideIndex].id === 'intro-video-slide' ? handleProgressUpdate : undefined}
                        onDuration={lesson.slides[currentSlideIndex].id === 'intro-video-slide' ? ((d) => setActualVideoDuration(d)) : undefined}
                      />
                    </div>
                  )}
                  <div
                    className="text-base md:text-xl text-slate-600 leading-[1.8] max-w-5xl font-bold prose prose-indigo break-words w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 text-start"
                    dir="auto"
                    dangerouslySetInnerHTML={{ __html: lesson.slides[currentSlideIndex].content }}
                  />



                  {/* Question Options for Slide */}
                  {isQuestionLike(lesson.slides[currentSlideIndex]) && getQuestionOptions(lesson.slides[currentSlideIndex], language).length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                      {getQuestionOptions(lesson.slides[currentSlideIndex], language).map((opt: string, oIdx: number) => {
                        const isMulti = lesson.slides[currentSlideIndex].label === 'MULTI_SELECT';
                        const isSelected = isMulti ? (slideAnswers[currentSlideIndex] || []).includes(opt) : slideAnswers[currentSlideIndex] === opt;
                        const isSubmitted = slideSubmitted[currentSlideIndex];
                        const isCorrect = isSubmitted && (isMulti ? (lesson.slides[currentSlideIndex].correctAnswers || []).includes(opt) : ((!lesson.slides[currentSlideIndex].correctAnswer && isSelected) || opt === lesson.slides[currentSlideIndex].correctAnswer));
                        const isWrong = isSubmitted && isSelected && !isCorrect;

                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              if (!isSubmitted) {
                                if (isMulti) {
                                  const currentArr = slideAnswers[currentSlideIndex] || [];
                                  const newArr = currentArr.includes(opt) ? currentArr.filter((a: string) => a !== opt) : [...currentArr, opt];
                                  setSlideAnswers({ ...slideAnswers, [currentSlideIndex]: newArr });
                                } else {
                                  setSlideAnswers({ ...slideAnswers, [currentSlideIndex]: opt });
                                }
                              }
                            }}
                            className={`relative p-6 rounded-3xl border-4 text-right transition-all group overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-red-500 bg-red-50' : 'border-indigo-500 bg-indigo-50') : 'border-slate-100 bg-white hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                            disabled={isSubmitted}
                          >
                            <span className={`text-xl font-bold ${isSelected ? (isCorrect ? 'text-emerald-700' : isWrong ? 'text-red-700' : 'text-indigo-700') : 'text-slate-700'}`}>{opt}</span>
                            {isSelected && !isSubmitted && <CheckCircle2 className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-indigo-500" />}
                            {isCorrect && <CheckCircle2 className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-emerald-500" />}
                            {isWrong && <X className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-red-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isQuestionLike(lesson.slides[currentSlideIndex]) && slideAnswers[currentSlideIndex] && !slideSubmitted[currentSlideIndex] && (
                    <button
                      onClick={() => setSlideSubmitted({ ...slideSubmitted, [currentSlideIndex]: true })}
                      className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl"
                    >
                      {language === 'ar' ? 'تأكيد الإجابة ✓' : 'Confirm Answer ✓'}
                    </button>
                  )}

                  {slideSubmitted[currentSlideIndex] && isQuestionLike(lesson.slides[currentSlideIndex]) && (() => {
                    const isMulti = lesson.slides[currentSlideIndex].label === 'MULTI_SELECT';
                    const studentAnswers = slideAnswers[currentSlideIndex] || (isMulti ? [] : '');
                    const isCorrect = isMulti ? studentAnswers.length === (lesson.slides[currentSlideIndex].correctAnswers || []).length && studentAnswers.every((a: string) => (lesson.slides[currentSlideIndex].correctAnswers || []).includes(a)) : slideAnswers[currentSlideIndex] === lesson.slides[currentSlideIndex].correctAnswer;
                    return (
                      <div className="mt-8 w-full max-w-4xl">
                        <QuestionFeedback
                          isCorrect={isCorrect}
                          correctAnswer={isMulti ? lesson.slides[currentSlideIndex].correctAnswers : lesson.slides[currentSlideIndex].correctAnswer}
                          language={language}
                        />
                      </div>
                    );
                  })()}

                  <SlideSectionsToggle 
                    slide={lesson.slides[currentSlideIndex]} 
                    slideIndex={currentSlideIndex}
                    slideSubmitted={slideSubmitted} 
                    slideAnswers={slideAnswers}
                    language={language}
                  />
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center gap-6 shrink-0">
                  <button
                    onClick={() => {
                      if (currentSlideIndex > 0) {
                        setCurrentSlideIndex(prev => prev - 1);
                      } else {
                        setCurrentStage('welcome');
                      }
                    }}
                    className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-6 h-6 text-slate-900" />
                  </button>

                  <div className="flex gap-2 flex-wrap justify-center">
                    {lesson.slides.map((_: any, i: number) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${currentSlideIndex === i ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}></div>
                    ))}
                  </div>

                  {currentSlideIndex < lesson.slides.length - 1 ? (
                    <button
                      onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                      className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentStage('assignments')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-base hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center gap-3 shrink-0"
                    >
                      {t('lesson.showAssignments')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentStage === 'assignments' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{t('lesson.assignments')}</h2>
                  <p className="text-slate-400 font-bold">{t('lesson.assignmentsMsg')}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto w-full">
                  {lesson.assignments?.length > 0 ? lesson.assignments.map((as: any, idx: number) => {
                    const isSubmitted = assignmentSubmitted[idx];
                    return (
                      <div key={idx} className="premium-card p-8 rounded-[40px] border-r-8 border-indigo-600">
                        <div className="flex items-center gap-4 mb-6">
                          <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                            {idx + 1}
                          </span>
                          <h3 className="font-black text-slate-900 text-lg">{as.type === 'QUESTION' ? t('lesson.requiredAssignment') : t('lesson.requiredAssignment')}</h3>
                        </div>
                        <div className="text-slate-600 text-lg leading-relaxed prose prose-indigo mb-6 text-start" dir="auto" dangerouslySetInnerHTML={{ __html: as.text }} />

                        {isQuestionLike(as) && (as.options || []).filter(Boolean).length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {(as.options || []).filter(Boolean).map((opt: string, oIdx: number) => {
                              const isMulti = as.type === 'MULTI_SELECT' || as.label === 'MULTI_SELECT';
                              const isSelected = isMulti ? (assignmentAnswers[idx] || []).includes(opt) : assignmentAnswers[idx] === opt;
                              const isCorrect = isSubmitted && (isMulti ? (as.correctAnswers || []).includes(opt) : ((!as.correctAnswer && isSelected) || opt === as.correctAnswer));
                              const isWrong = isSubmitted && isSelected && !isCorrect;
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => {
                                    if (!isSubmitted) {
                                      if (isMulti) {
                                        const currentArr = assignmentAnswers[idx] || [];
                                        const newArr = currentArr.includes(opt) ? currentArr.filter((a: string) => a !== opt) : [...currentArr, opt];
                                        setAssignmentAnswers({ ...assignmentAnswers, [idx]: newArr });
                                      } else {
                                        setAssignmentAnswers({ ...assignmentAnswers, [idx]: opt });
                                      }
                                    }
                                  }}
                                  className={`relative p-5 rounded-3xl border-4 text-right transition-all group overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-red-500 bg-red-50' : 'border-indigo-500 bg-indigo-50') : 'border-slate-100 bg-white hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                                  disabled={isSubmitted}
                                >
                                  <span className={`text-lg font-bold ${isSelected ? (isCorrect ? 'text-emerald-700' : isWrong ? 'text-red-700' : 'text-indigo-700') : 'text-slate-700'}`}>{opt}</span>
                                  {isSelected && !isSubmitted && <CheckCircle2 className="absolute top-1/2 left-4 -translate-y-1/2 w-6 h-6 text-indigo-500" />}
                                  {isCorrect && <CheckCircle2 className="absolute top-1/2 left-4 -translate-y-1/2 w-6 h-6 text-emerald-500" />}
                                  {isWrong && <X className="absolute top-1/2 left-4 -translate-y-1/2 w-6 h-6 text-red-500" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {isQuestionLike(as) && assignmentAnswers[idx] && !isSubmitted && (
                          <button
                            onClick={() => setAssignmentSubmitted({ ...assignmentSubmitted, [idx]: true })}
                            className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl"
                          >
                            {language === 'ar' ? 'تأكيد الإجابة' : 'Confirm Answer'}
                          </button>
                        )}

                        {isSubmitted && isQuestionLike(as) && (() => {
                          const isMulti = as.type === 'MULTI_SELECT' || as.label === 'MULTI_SELECT';
                          const studentAnswers = assignmentAnswers[idx] || (isMulti ? [] : '');
                          const isCorrect = isMulti ? studentAnswers.length === (as.correctAnswers || []).length && studentAnswers.every((a: string) => (as.correctAnswers || []).includes(a)) : (!as.correctAnswer || assignmentAnswers[idx] === as.correctAnswer);
                          return (
                            <div className="mt-8">
                              <QuestionFeedback
                                isCorrect={isCorrect}
                                correctAnswer={isMulti ? as.correctAnswers : as.correctAnswer}
                                language={language}
                              />
                            </div>
                          );
                        })()}

                        <AssignmentSectionsToggle 
                          assignment={as} 
                          assignmentIndex={idx}
                          assignmentSubmitted={assignmentSubmitted} 
                          assignmentAnswers={assignmentAnswers}
                          language={language}
                        />
                      </div>
                    );
                  }) : (
                    <div className="premium-card p-12 rounded-[40px] text-center text-slate-400 font-bold">
                      {t('lesson.noAssignments')}
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-8 gap-4 flex-wrap">
                  <button
                    onClick={() => setCurrentStage('slides')}
                    className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-5 rounded-[25px] font-black text-lg hover:bg-slate-50 transition-all flex items-center gap-4"
                  >
                    <ArrowRight className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                    {t('lesson.previous')}
                  </button>
                  <button
                    onClick={() => setCurrentStage('exercises')}
                    className="bg-emerald-600 text-white px-12 py-5 rounded-[25px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-emerald-100 flex items-center gap-4"
                  >
                    {t('lesson.startExercises')}
                    <ArrowLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {currentStage === 'exercises' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 flex flex-col items-center w-full">
                <div className="premium-card p-4 rounded-[30px] flex flex-col md:flex-row items-center justify-between border-b-4 border-indigo-600 w-full max-w-4xl mx-auto gap-4 shrink-0">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {lesson.questions.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setCurrentQuestionIndex(i)}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-black transition-all border-2 flex items-center justify-center text-xs ${currentQuestionIndex === i ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : answers[i] ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(t('lesson.quizModePrompt'))) {
                        showToast(t('lesson.quizModeEnabled'), "info");
                      }
                    }}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Quiz Me!
                  </button>
                </div>

                <div className="premium-card rounded-[40px] overflow-hidden shadow-2xl border-indigo-50 w-full max-w-5xl mx-auto flex flex-col">
                  {lesson.questions.length > 0 && lesson.questions[currentQuestionIndex] ? (
                    <>
                      <div className="p-8 md:p-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex flex-wrap items-center gap-3 max-w-full w-full">
                            <span className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-black uppercase tracking-wider shadow-sm max-w-full break-words whitespace-normal text-right">
                              {t('lesson.question')} {currentQuestionIndex + 1}
                            </span>
                            {lesson.questions[currentQuestionIndex].level && (
                              <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.level')}: {lesson.questions[currentQuestionIndex].level === 'Easy' ? t('lesson.easy') : lesson.questions[currentQuestionIndex].level === 'Medium' ? t('lesson.medium') : t('lesson.hard')}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].skill && (
                              <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.skill')}: {lesson.questions[currentQuestionIndex].skill}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].standard && (
                              <span className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.standard')}: {lesson.questions[currentQuestionIndex].standard}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].indicator && (
                              <span className="px-3 py-2 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.indicator')}: {lesson.questions[currentQuestionIndex].indicator}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].learningOutcome && (
                              <span className="flex items-start gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{t('lesson.outcome')}: {lesson.questions[currentQuestionIndex].learningOutcome}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-mono font-bold text-sm shadow-sm shrink-0">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            {Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, '0')}
                          </div>
                        </div>

                        <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-8 leading-relaxed tracking-tight break-words w-full text-start" dir="auto" dangerouslySetInnerHTML={{ __html: lesson.questions[currentQuestionIndex].text }} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 mb-6">
                          {(lesson.questions[currentQuestionIndex].options || []).filter(Boolean).map((opt: string, oIdx: number) => {
                            const isMulti = lesson.questions[currentQuestionIndex].type === 'MULTI_SELECT';
                            const isSelected = isMulti ? (answers[currentQuestionIndex] || []).includes(opt) : answers[currentQuestionIndex] === opt;
                            const isSubmitted = quizSubmitted[currentQuestionIndex];
                            const isCorrect = isSubmitted && (isMulti ? (lesson.questions[currentQuestionIndex].correctAnswers || []).includes(opt) : ((!lesson.questions[currentQuestionIndex].correctAnswer && isSelected) || opt === lesson.questions[currentQuestionIndex].correctAnswer));
                            const isWrong = isSubmitted && isSelected && !isCorrect;

                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleAnswerSelect(opt)}
                                disabled={isSubmitted}
                                className={`p-5 md:p-6 rounded-[25px] border-4 text-start transition-all duration-300 font-black text-sm md:text-base relative break-words overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : isWrong ? 'border-red-500 bg-red-50 text-red-700' : 'bg-indigo-600 border-white text-white shadow-xl shadow-indigo-100') : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <span className={`flex-1 break-words leading-relaxed ${isSelected && !isSubmitted ? 'text-white' : ''}`}>{opt}</span>
                                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected && !isSubmitted ? 'border-white bg-white/20' : isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : isWrong ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200'}`}>
                                    {isSelected && !isSubmitted && <CheckCircle2 className="w-4 h-4" />}
                                    {isCorrect && <CheckCircle2 className="w-4 h-4" />}
                                    {isWrong && <X className="w-4 h-4" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {answers[currentQuestionIndex] && !quizSubmitted[currentQuestionIndex] && (
                          <button
                            onClick={() => setQuizSubmitted({ ...quizSubmitted, [currentQuestionIndex]: true })}
                            className="mt-2 mb-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl"
                          >
                            {language === 'ar' ? 'تأكيد الإجابة' : 'Confirm Answer'}
                          </button>
                        )}

                        {quizSubmitted[currentQuestionIndex] && (() => {
                          const isMulti = lesson.questions[currentQuestionIndex].type === 'MULTI_SELECT';
                          const studentAnswers = answers[currentQuestionIndex] || (isMulti ? [] : '');
                          const isCorrect = isMulti ? studentAnswers.length === (lesson.questions[currentQuestionIndex].correctAnswers || []).length && studentAnswers.every((a: string) => (lesson.questions[currentQuestionIndex].correctAnswers || []).includes(a)) : (!lesson.questions[currentQuestionIndex].correctAnswer || answers[currentQuestionIndex] === lesson.questions[currentQuestionIndex].correctAnswer);
                          return (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                              <QuestionFeedback
                                isCorrect={isCorrect}
                                correctAnswer={isMulti ? lesson.questions[currentQuestionIndex].correctAnswers : lesson.questions[currentQuestionIndex].correctAnswer}
                                language={language}
                              />
                            </div>
                          );
                        })()}

                        <QuizSectionsToggle 
                          question={lesson.questions[currentQuestionIndex]} 
                          questionIndex={currentQuestionIndex}
                          quizSubmitted={quizSubmitted}
                          language={language}
                        />
                      </div>

                      <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="text-slate-400 px-6 py-3 rounded-xl font-black hover:text-slate-600 disabled:opacity-20 text-sm"
                        >
                          {t('lesson.previous')}
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          className={`px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-3 text-base shadow-xl ${currentQuestionIndex < lesson.questions.length - 1 ? 'bg-slate-950 text-white hover:bg-indigo-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {currentQuestionIndex < lesson.questions.length - 1 ? t('lesson.next') : t('lesson.finishQuiz')}
                          <ChevronLeft className={`w-5 h-5 transition-transform ${language === 'ar' ? 'group-hover:-translate-x-2' : 'group-hover:translate-x-2 rotate-180'}`} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20 space-y-6 flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <HelpCircle className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold text-base">{t('lesson.noExercises')}</p>
                      <button
                        onClick={() => setCurrentStage('summary')}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black"
                      >
                        {t('lesson.skipExercises')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStage === 'summary' && (() => {
              const pct = Math.round((score / attemptedMaxScore) * 100);

              let title = t('lesson.greatJob') || (language === 'ar' ? "عمل رائع!" : "Great Job!");
              let message = t('lesson.completedMessage') || (language === 'ar' ? "لقد أكملت جميع متطلبات هذا الدرس بنجاح." : "You have successfully completed all the requirements of this lesson.");
              let borderCol = "border-indigo-600";
              let iconEl: React.ReactNode;

              if (pct >= 85) {
                title = language === 'ar' ? "أداء ممتاز! 🏆" : "Excellent Performance! 🏆";
                message = language === 'ar' ? "رائع جداً! لقد تفوقت وأكملت الدرس بنسبة ممتازة تليق بذكائك." : "Awesome! You excelled and completed the lesson with an excellent score.";
                borderCol = "border-emerald-500";
                iconEl = (
                  <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full animate-ping-slow" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)' }} />
                    <div className="absolute inset-2 rounded-full animate-ping-slow" style={{ animationDelay: '0.4s', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' }} />
                    <div className="w-24 h-24 rounded-[35px] flex items-center justify-center shadow-2xl animate-float-trophy" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 40px rgba(16,185,129,0.6), 0 20px 40px rgba(5,150,105,0.4)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                    </div>
                  </div>
                );
              } else if (pct >= 50) {
                title = language === 'ar' ? "عمل جيد جداً! ⭐" : "Very Good Work! ⭐";
                message = language === 'ar' ? "أحسنت! لقد نجحت واجتزت الدرس بنجاح. استمر في التقدم!" : "Well done! You successfully passed the lesson. Keep moving forward!";
                borderCol = "border-amber-500";
                iconEl = (
                  <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                    {/* Rotating sparkle ring */}
                    <div className="absolute inset-0 animate-spin-slow" style={{ background: 'conic-gradient(from 0deg, rgba(245,158,11,0.8), rgba(251,191,36,0.4), rgba(245,158,11,0.8))', borderRadius: '50%', filter: 'blur(8px)' }} />
                    <div className="absolute inset-3 rounded-full" style={{ background: 'white' }} />
                    <div className="w-24 h-24 rounded-[35px] flex items-center justify-center shadow-2xl animate-float-star relative" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 0 50px rgba(245,158,11,0.7), 0 20px 40px rgba(217,119,6,0.5)' }}>
                      <Star className="w-12 h-12 text-white fill-current animate-spin-slow" style={{ animationDuration: '4s' }} />
                    </div>
                  </div>
                );
              } else {
                title = language === 'ar' ? "تحتاج للمحاولة مجدداً 🔄" : "Need to Try Again 🔄";
                message = language === 'ar' ? "لم تحقق نسبة الاجتياز المطلوبة (50%). لا تقلق، التعلم يحتاج لبعض التدريب الإضافي!" : "You did not achieve the required passing score (50%). Don't worry, learning requires some extra practice!";
                borderCol = "border-rose-500";
                iconEl = (
                  <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                    <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)' }} />
                    <div className="w-24 h-24 rounded-[35px] flex items-center justify-center shadow-2xl animate-shake" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 0 40px rgba(244,63,94,0.6), 0 20px 40px rgba(225,29,72,0.4)' }}>
                      <RotateCcw className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '2s' }} />
                    </div>
                  </div>
                );
              }

              return (
                <div className="premium-card p-10 md:p-20 rounded-[50px] animate-in zoom-in duration-700 text-center relative">
                  {pct >= 50 && (
                    <div className="fixed inset-0 pointer-events-none z-[100]">
                      <Confetti
                        recycle={false}
                        numberOfPieces={600}
                        gravity={0.15}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-center mx-auto mb-8 relative z-10">
                    {iconEl}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">{title}</h2>
                  <p className="text-slate-500 text-lg font-bold mb-12">{message}</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 md:gap-10 mb-10 md:mb-16">
                    <div className={`premium-card p-8 rounded-[35px] min-w-[180px] border-b-8 ${borderCol}`}>
                      <p className="text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest">{t('lesson.score') || (language === 'ar' ? 'الدرجة' : 'Score')}</p>
                      <p className="text-4xl md:text-6xl font-black text-slate-900">{correctCount} <span className="text-2xl text-slate-400">/ {attemptedQuestionsCount}</span></p>
                    </div>
                    <div className={`premium-card p-8 rounded-[35px] min-w-[180px] border-b-8 ${pct >= 50 ? 'border-amber-500' : 'border-rose-500'}`}>
                      <p className="text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest">{t('lesson.percentage') || (language === 'ar' ? 'النسبة' : 'Percentage')}</p>
                      <p className={`text-4xl md:text-6xl font-black ${pct >= 85 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{pct}%</p>
                    </div>
                  </div>

                  {/* ── STUDENT PROGRESS PORTFOLIO DASHBOARD ── */}
                  <div className="max-w-4xl mx-auto mb-12 text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="premium-card p-6 md:p-8 rounded-[35px] border-t-4 border-indigo-600 bg-white shadow-sm space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 justify-start">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="text-start">
                          <h3 className="text-lg font-black text-slate-900">
                            {language === 'ar' ? 'ملف إنجاز الطالب والتقدم الدراسي' : 'Student Progress Portfolio'}
                          </h3>
                          <p className="text-xs text-slate-400 font-bold">
                            {language === 'ar' ? 'مؤشرات الأداء وتفاصيل التحصيل لهذا الدرس' : 'Performance indicators and achievement details for this lesson'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                            {language === 'ar' ? 'الوقت المستغرق' : 'Time Spent'}
                          </span>
                          <span className="text-lg font-black text-slate-800">
                            {Math.floor(quizTimer / 60)} {language === 'ar' ? 'دقيقة' : 'min'}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                            {language === 'ar' ? 'الشرائح المقروءة' : 'Slides Read'}
                          </span>
                          <span className="text-lg font-black text-slate-800">
                            {lesson.slides?.length || 0} / {lesson.slides?.length || 0}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                            {language === 'ar' ? 'الواجبات المحلولة' : 'Solved Assignments'}
                          </span>
                          <span className="text-lg font-black text-slate-800">
                            {Object.keys(assignmentSubmitted).length} / {lesson.assignments?.length || 0}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                            {language === 'ar' ? 'التمارين المحلولة' : 'Solved Exercises'}
                          </span>
                          <span className="text-lg font-black text-slate-800">
                            {Object.keys(quizSubmitted).length} / {lesson.questions?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Breakdown */}
                      {lesson.questions && lesson.questions.length > 0 && (
                        <div className="space-y-3 pt-2 text-start">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 justify-start">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>{language === 'ar' ? 'تقرير الإجابات والتقييم الذاتي' : 'Answers Report & Self-Evaluation'}</span>
                          </h4>
                          
                          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                            {lesson.questions?.map((q: any, qIdx: number) => {
                              const isMulti = q.type === 'MULTI_SELECT';
                              const studentAns = answers[qIdx];
                              const isSubmitted = quizSubmitted[qIdx];
                              const isCorrect = isSubmitted && (isMulti
                                ? Array.isArray(studentAns) && studentAns.length === (q.correctAnswers || []).length && studentAns.every((a: string) => (q.correctAnswers || []).includes(a))
                                : studentAns === q.correctAnswer);
                              
                              return (
                                <div key={qIdx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                  <span className="font-bold text-slate-700 truncate max-w-[70%]">
                                    {language === 'ar' ? 'سؤال' : 'Question'} {qIdx + 1}: <span className="font-normal text-slate-500" dangerouslySetInnerHTML={{ __html: q.text }} />
                                  </span>
                                  <span className={`px-2 py-1 rounded-lg font-black ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {isCorrect ? (language === 'ar' ? 'صحيحة ✓' : 'Correct ✓') : (language === 'ar' ? 'خاطئة ✗' : 'Wrong ✗')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {pct < 50 && (
                      <button
                        onClick={() => {
                          setAnswers({});
                          setSlideAnswers({});
                          setSlideSubmitted({});
                          setAssignmentAnswers({});
                          setAssignmentSubmitted({});
                          setQuizSubmitted({});
                          setScore(0);
                          setCurrentStage('welcome');
                          setCurrentSlideIndex(0);
                          setCurrentQuestionIndex(0);
                        }}
                        className="bg-slate-950 text-white px-10 py-5 rounded-[25px] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-slate-200"
                      >
                        {language === 'ar' ? 'إعادة المحاولة 🔄' : 'Try Again 🔄'}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/courses/${lesson.courseId}`)}
                      className="premium-gradient-primary text-white px-16 py-5 rounded-[25px] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-indigo-200"
                    >
                      {t('lesson.backToCourse')}
                    </button>
                  </div>

                  {/* Prev / Next lesson navigation */}
                  {(prevLesson || nextLesson) && (
                    <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full sm:w-auto text-center">
                        {language === 'ar' ? 'الدروس الأخرى في الكورس' : 'Other Lessons in Course'}
                      </p>
                      <div className="flex gap-4">
                        {prevLesson && (
                          <button
                            onClick={() => goToLesson(prevLesson)}
                            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-[22px] font-black hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm group"
                          >
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الدرس السابق' : 'Previous Lesson'}</p>
                              <p className="text-sm font-black truncate max-w-[160px]">{prevLesson.title}</p>
                            </div>
                          </button>
                        )}
                        {nextLesson && (
                          <button
                            onClick={() => goToLesson(nextLesson)}
                            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[22px] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 group"
                          >
                            <div className="text-right">
                              <p className="text-[10px] text-indigo-200 uppercase tracking-widest">{language === 'ar' ? 'الدرس التالي' : 'Next Lesson'}</p>
                              <p className="text-sm font-black truncate max-w-[160px]">{nextLesson.title}</p>
                            </div>
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── SIDEBAR AREA (VISIBLE ONLY IN WELCOME/SUMMARY) ── */}
          {(currentStage === 'welcome' || currentStage === 'summary') && (
            <div className="xl:col-span-4 space-y-10">

              {/* Summary Widget */}
              <div className="premium-card rounded-[40px] p-8 md:p-10 space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-3">
                  <Info className="w-4 h-4 text-indigo-600" />
                  {t('lesson.lessonSummary')}
                </h4>
                <p className="text-sm text-slate-600 font-bold leading-relaxed">{lesson.summary || t('lesson.noSummary')}</p>
                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t('lesson.exercises')}</p>
                    <p className="text-xl font-black text-slate-900">{lesson.questions?.length || 0}</p>
                  </div>
                  <div className="text-center border-r border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t('lesson.attachments')}</p>
                    <p className="text-xl font-black text-slate-900">{lesson.attachments?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Resources Widget */}
              <div className="premium-card rounded-[40px] p-8 md:p-10 space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-3">
                  <FileDown className="w-4 h-4 text-indigo-600" />
                  {t('lesson.attachments')}
                </h4>
                <div className="space-y-3">
                  {lesson.attachments?.length > 0 ? lesson.attachments.map((att: any, i: number) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <FileDown className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black text-slate-700 truncate">{att.name || `${t('lesson.attachment')} ${i + 1}`}</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300" />
                    </a>
                  )) : (
                    <p className="text-[11px] text-slate-400 font-bold text-center py-4">{t('lesson.noAttachments')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.2); }

      @keyframes bounce-slow {
        0 %, 100 % { transform: translateY(0); }
          50% {transform: translateY(-10px); }
        }
      .animate-bounce-slow {animation: bounce-slow 3s infinite ease-in-out; }

      /* ── Trophy float: gentle up/down with scale pulse ── */
      @keyframes float-trophy {
        0 % { transform: translateY(0px) scale(1); box- shadow: 0 0 40px rgba(16,185,129,0.6), 0 20px 40px rgba(5,150,105,0.4); }
      30%  {transform: translateY(-14px) scale(1.06); box-shadow: 0 0 70px rgba(16,185,129,0.9), 0 30px 60px rgba(5,150,105,0.6); }
      60%  {transform: translateY(-6px) scale(1.03); }
      100% {transform: translateY(0px) scale(1); box-shadow: 0 0 40px rgba(16,185,129,0.6), 0 20px 40px rgba(5,150,105,0.4); }
        }
      .animate-float-trophy {animation: float-trophy 2.4s infinite ease-in-out; }

      /* ── Star float: bouncy with glow pulse ── */
      @keyframes float-star {
        0 % { transform: translateY(0px) rotate(- 3deg) scale(1); }
      25%  {transform: translateY(-16px) rotate(4deg) scale(1.08); }
      50%  {transform: translateY(-8px) rotate(-2deg) scale(1.04); }
      75%  {transform: translateY(-18px) rotate(5deg) scale(1.1); }
      100% {transform: translateY(0px) rotate(-3deg) scale(1); }
        }
      .animate-float-star {animation: float-star 2.2s infinite ease-in-out; }

      /* ── Slow spin for conic ring & star icon ── */
      @keyframes spin-slow {
        from {transform: rotate(0deg); }
      to   {transform: rotate(360deg); }
        }
      .animate-spin-slow {animation: spin-slow 6s linear infinite; }

      /* ── Shake for retry icon ── */
      @keyframes shake {
        0 %, 100 % { transform: translateX(0) rotate(0deg); }
          15%      {transform: translateX(-8px) rotate(-6deg); }
      30%      {transform: translateX(8px) rotate(6deg); }
      45%      {transform: translateX(-5px) rotate(-3deg); }
      60%      {transform: translateX(5px) rotate(3deg); }
      75%      {transform: translateX(-3px) rotate(-1deg); }
      90%      {transform: translateX(3px) rotate(1deg); }
        }
      .animate-shake {animation: shake 1.8s infinite ease-in-out; }

      /* ── Slow ping for glow rings ── */
      @keyframes ping-slow {
        0 % { transform: scale(0.85); opacity: 0.8; }
          50%  {transform: scale(1.15); opacity: 0.3; }
      100% {transform: scale(0.85); opacity: 0.8; }
        }
      .animate-ping-slow {animation: ping-slow 2s infinite ease-in-out; }

      .premium-card {
        background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.02);
        }

      .premium-gradient-primary {
        background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
        }

      .animate-in {
        animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

      @keyframes fade-in {
        from {opacity: 0; transform: translateY(10px); }
      to {opacity: 1; transform: translateY(0); }
        }
      ` }} />

    </DashboardLayout>
  );
}
