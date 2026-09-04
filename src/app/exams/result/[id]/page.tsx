"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, LayoutDashboard, RefreshCw, Award, Target, MessageCircle, Lock, EyeOff, HelpCircle, Info, AlertCircle, Sparkles, BookOpen, MessageSquare, Star, ListOrdered, TrendingUp, Globe } from 'lucide-react';
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";
import HtmlRenderer from "@/components/HtmlRenderer";
import Watermark from "@/components/Watermark";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";
import { normalizeAnswerGlobal } from "@/components/LessonSubComponents";
import { InteractiveTag } from "@/components/InteractiveTag";
import InteractiveQuestionRenderer from "@/components/InteractiveQuestionRenderer";
import { getSubmissionTotalPoints } from "@/lib/examResult";
import { getExamSessionToken } from "@/lib/examSession";

const stripHtmlAndNormalize = (str: any) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\s\u00A0]+/g, ' ')
    .trim()
    .toLowerCase();
};

const isOptionMatch = (targetVal: any, optText: string, optIndex: number = -1) => {
  if (targetVal === null || targetVal === undefined || optText === null || optText === undefined) return false;
  const rawTarget = String(targetVal).trim();
  const normTarget = stripHtmlAndNormalize(rawTarget);
  const normOpt = stripHtmlAndNormalize(optText);

  if (!normTarget || !normOpt) return false;

  // 1. Direct exact normalized string match
  if (normTarget === normOpt) return true;

  // 2. True / False / Correct / Incorrect normalization check
  const tfTarget = normalizeAnswerGlobal(rawTarget);
  const tfOpt = normalizeAnswerGlobal(optText);
  const isTfKeywords = ['true', 'false', 'صح', 'خطأ', 'correct', 'incorrect'];
  
  if (isTfKeywords.includes(normTarget) || isTfKeywords.includes(normOpt)) {
    return tfTarget === tfOpt;
  }

  // 3. Option letter/index check (e.g. target is "A", "B", "C", "D" or "0", "1", "2", "3")
  if (optIndex >= 0) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const targetClean = rawTarget.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (targetClean === letters[optIndex] || targetClean === String(optIndex)) return true;
  }

  // 4. Multi-word string containment (only for long strings with multiple words)
  if (normTarget.length > 6 && normOpt.length > 6) {
    const targetWords = normTarget.split(/\s+/).filter(Boolean);
    const optWords = normOpt.split(/\s+/).filter(Boolean);
    if (targetWords.length >= 3 && optWords.length >= 3) {
      if (normTarget.includes(normOpt) || normOpt.includes(normTarget)) return true;
    }
  }

  return false;
};

const t = (key: string, lang: 'ar' | 'en') => {
  const translations: Record<string, { ar: string; en: string }> = {
    loading: { ar: 'جاري جلب النتيجة...', en: 'Loading result...' },
    loadError: { ar: 'فشل في تحميل تفاصيل النتيجة', en: 'Failed to load result details' },
    backToExams: { ar: 'العودة للامتحانات', en: 'Back to Exams' },
    resultsHidden: { ar: 'النتائج محجوبة', en: 'Results Hidden' },
    resultsHiddenMsg: { ar: 'لقد تم تسليم إجاباتك بنجاح. قام المعلم بإخفاء تفاصيل النتائج والدرجات لهذا الامتحان حالياً. سيتم إخطارك عند إتاحة النتائج.', en: 'Your answers have been submitted successfully. The teacher has hidden the results and grades for this exam. You will be notified when results are available.' },
    submittedOn: { ar: 'تاريخ التسليم:', en: 'Submitted on:' },
    finalGrade: { ar: 'الدرجة النهائية', en: 'Final Grade' },
    pointsEarned: { ar: 'النقاط المحصلة', en: 'Points Earned' },
    result: { ar: 'نتيجة التقييم', en: 'Result' },
    xpEarned: { ar: 'نقاط الـ XP المكتسبة', en: 'XP Points Earned' },
    backToList: { ar: 'العودة لقائمة الامتحانات', en: 'Back to Exams List' },
    reviewAnswers: { ar: 'مراجعة الإجابات', en: 'Answer Review' },
    questionsEvaluated: { ar: 'سؤال تم تقييمه', en: 'questions evaluated' },
    mcq: { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
    multiSelect: { ar: 'اختيار متعدد', en: 'Multi-Select' },
    trueFalse: { ar: 'صح وخطأ', en: 'True / False' },
    level: { ar: 'المستوى', en: 'Level' },
    dok: { ar: 'عمق المعرفة', en: 'DOK' },
    domain: { ar: 'المجال', en: 'Domain' },
    skill: { ar: 'المهارة', en: 'Skill' },
    subskill: { ar: 'المهارة الفرعية', en: 'Subskill' },
    microSkill: { ar: 'المهارة الدقيقة', en: 'Micro Skill' },
    cognitive: { ar: 'المستوى المعرفي', en: 'Cognitive' },
    errorPattern: { ar: 'نمط الخطأ', en: 'Error Pattern' },
    standard: { ar: 'المعيار', en: 'Standard' },
    indicator: { ar: 'المؤشر', en: 'Indicator' },
    outcome: { ar: 'ناتج التعلم', en: 'Outcome' },
    correct: { ar: 'صحيح', en: 'Correct' },
    wrong: { ar: 'خطأ', en: 'Wrong' },
    explanationLabel: { ar: 'شرح وتوضيح الإجابة', en: 'Answer Explanation' },
    reviewUnavailable: { ar: 'مراجعة الأسئلة غير متاحة', en: 'Question review unavailable' },
    reviewUnavailableMsg: { ar: 'لقد اختار المعلم عرض الدرجة النهائية فقط لهذا الامتحان.', en: 'The teacher has chosen to show only the final grade for this exam.' },
    foundation: { ar: 'تأسيسي', en: 'Foundation' },
    onLevel: { ar: 'في المستوى', en: 'On Level' },
    advanced: { ar: 'متقدم', en: 'Advanced' },
    general: { ar: 'عام', en: 'General' },
    loginRequired: { ar: 'يجب تسجيل الدخول أولاً', en: 'You must log in first' },
    resultError: { ar: 'خطأ في تحميل النتيجة', en: 'Error loading result' },
    hint: { ar: 'تلميح', en: 'Hint' },
    tip: { ar: 'نصيحة', en: 'Tip' },
    warning: { ar: 'تحذير', en: 'Warning' },
    keyInsight: { ar: 'نقطة هامة', en: 'Key Insight' },
    feedback: { ar: 'ملاحظات', en: 'Feedback' },
    explanation: { ar: 'شرح مفصل', en: 'Detailed Explanation' },
  };
  return translations[key]?.[lang] ?? key;
};

const renderExplanation = (explanationString: string, lang: 'ar' | 'en') => {
  if (!explanationString || explanationString === "[]" || explanationString === '""' || explanationString.trim() === "") return null;

  let sections: any[] = [];
  let isJson = false;
  try {
    const parsed = JSON.parse(explanationString);
    if (Array.isArray(parsed)) {
      sections = parsed
        .map((item: any) => {
          if (typeof item === 'string') return { type: 'EXPLANATION', content: item };
          return item;
        })
        .filter((item: any) => item.content && String(item.content).trim() !== '');
      isJson = true;
    }
  } catch (e) {}

  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50/70", text: "text-amber-700", border: "border-amber-200", label: lang === 'ar' ? 'تلميح للمساعدة' : 'Hint' },
    TIP: { icon: Info, bg: "bg-blue-50/70", text: "text-blue-700", border: "border-blue-200", label: lang === 'ar' ? 'نصيحة ذكية' : 'Smart Tip' },
    WARNING: { icon: AlertCircle, bg: "bg-red-50/70", text: "text-red-700", border: "border-red-200", label: lang === 'ar' ? 'تحذير' : 'Warning' },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50/70", text: "text-purple-700", border: "border-purple-200", label: lang === 'ar' ? 'فكرة جوهرية' : 'Key Insight' },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50/70", text: "text-emerald-700", border: "border-emerald-200", label: lang === 'ar' ? 'ملاحظات' : 'Feedback' },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50/70", text: "text-indigo-700", border: "border-indigo-200", label: lang === 'ar' ? 'الشرح والتوضيح' : 'Explanation' }
  };

  if (isJson && sections.length === 0) {
    return null;
  }

  if (!isJson || sections.length === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex gap-5">
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 shrink-0">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">{t('explanationLabel', lang)}</p>
          <HtmlRenderer html={explanationString} className="text-slate-600 leading-relaxed font-medium prose prose-sm max-w-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((sec: any, i: number) => {
        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
        const Icon = preset.icon;
        return (
          <div key={i} className={`${preset.bg} rounded-2xl p-5 border ${preset.border} flex gap-4 items-start`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${preset.text} bg-white/60 shadow-2xs`}>
              <Icon className="w-5 h-5 shrink-0" />
            </div>
            <div className="flex-1 space-y-1">
              <span className={`text-xs font-black uppercase tracking-wider block ${preset.text}`}>{preset.label}</span>
              <HtmlRenderer html={sec.content} className={`prose prose-sm max-w-none ${preset.text}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function ExamResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotification();
  const { language: ctxLang } = useLanguage();
  const [lang, setLang] = useState<'ar' | 'en'>(ctxLang as 'ar' | 'en' || 'ar');
  const [watermarkText, setWatermarkText] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("lms_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        let text = user.name || user.email || "Student";
        if (user.schoolName) text += " - " + user.schoolName;
        else if (user.schoolId) text += " - School: " + user.schoolId;
        text += " - KLEVRO";
        setWatermarkText(text);
      } else {
        setWatermarkText("KLEVRO");
      }
    } catch {
      setWatermarkText("KLEVRO");
    }
  }, []);

  const translateTrueFalse = (opt: string) => {
    const norm = normalizeAnswerGlobal(opt);
    if (norm === 'true') return lang === 'ar' ? 'صح' : 'True';
    if (norm === 'false') return lang === 'ar' ? 'خطأ' : 'False';
    return opt;
  };

  const translateLevel = (level: string) => {
    if (!level) return '';
    if (level === 'Easy' || level === 'Foundation') return t('foundation', lang);
    if (level === 'Medium' || level === 'On Level') return t('onLevel', lang);
    return t('advanced', lang);
  };

  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchResult(); }, [id]);

  const fetchResult = async () => {
    try {
      const isAdminPreviewSession = !!(
        localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token")
      );
      const token = getExamSessionToken(localStorage, { preferAdmin: isAdminPreviewSession });
      if (!token) {
        showToast(t('loginRequired', lang), "error");
        router.push("/login");
        return;
      }
      const res = await fetch(`${API_URL}/exams/submissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSubmission(data);
      } else {
        showToast(data.error || t('resultError', lang), "error");
        router.push("/exams");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-xl text-slate-400 animate-pulse">{t('loading', lang)}</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <XCircle className="w-16 h-16 text-rose-500" />
        <p className="font-black text-xl text-slate-600">{t('loadError', lang)}</p>
        <Link href="/exams" className="btn-primary">{t('backToExams', lang)}</Link>
      </div>
    );
  }

  const isAdmin = !!(localStorage.getItem("school_admin_token") || localStorage.getItem("super_admin_token"));
  const visibility = submission.exam.resultVisibility || "SHOW_SCORE";
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const submissionTotalPoints = getSubmissionTotalPoints(submission);

  // Language Toggle Button
  const LangToggle = () => (
    <button
      onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
      className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg px-4 py-2 rounded-full font-black text-sm text-slate-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
    >
      <Globe className="w-4 h-4 text-indigo-500" />
      {lang === 'ar' ? 'English' : 'عربي'}
    </button>
  );

  // HIDE_ALL STATE
  if (visibility === "HIDE_ALL" && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir={dir}>
        <LangToggle />
        <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-12 text-center border border-slate-100">
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-100">
            <EyeOff className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4">{t('resultsHidden', lang)}</h1>
          <p className="text-slate-500 mb-10 leading-relaxed text-lg">{t('resultsHiddenMsg', lang)}</p>
          <div className="bg-slate-50 p-6 rounded-2xl mb-10 text-right border border-slate-100">
            <h4 className="font-black text-slate-700 mb-1">{submission.subExam?.title || submission.exam.title}</h4>
            <p className="text-sm text-slate-400">{t('submittedOn', lang)} {new Date(submission.createdAt).toLocaleDateString(lang === 'ar' ? "ar-EG" : "en-GB")}</p>
          </div>
          <Link href="/exams" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
            {t('backToExams', lang)}
            {lang === 'ar' ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-20" dir={dir}>
      <Watermark text={watermarkText} />
      <LangToggle />

      {/* Premium Header */}
      <div className="relative pt-16 pb-36 px-6 bg-indigo-600 text-white text-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/20 shadow-xl">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 drop-shadow-sm">
            {t('result', lang)}
          </h1>
          <p className="text-white/80 text-lg font-bold">{submission.subExam?.title || submission.exam.title}</p>
          <div className="flex justify-center gap-3 mt-4">
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black border border-white/20">
              {submission.exam.skill || t('general', lang)}
            </span>
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black border border-white/20">
              {translateLevel(submission.exam.level)}
            </span>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20">
        {/* Score Card */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-8 md:p-12 mb-8 border border-slate-100 flex flex-col md:flex-row items-center gap-12">
          <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-100" />
              <circle
                cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="14" fill="transparent"
                strokeDasharray={540}
                strokeDashoffset={540 - (540 * submission.percentage) / 100}
                strokeLinecap="round"
                className="text-indigo-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black text-slate-800">{Math.round(submission.percentage)}%</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{t('finalGrade', lang)}</span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 gap-5">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{t('pointsEarned', lang)}</p>
              <h4 className="text-3xl font-black text-slate-800">
                {submission.totalScore}
                <span className="text-lg font-bold text-slate-300 mx-2">/</span>
                <span className="text-lg font-bold text-slate-400">
                  {submissionTotalPoints}
                </span>
              </h4>
            </div>
            {submission.earnedXP !== undefined && submission.earnedXP > 0 && (
              <div className="col-span-full bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-widest">{t('xpEarned', lang)}</p>
                <h4 className="text-3xl font-black text-amber-500 flex items-center gap-2">
                  <span>⭐</span>
                  <span>+{submission.earnedXP}</span>
                  <span className="text-xl">XP</span>
                </h4>
              </div>
            )}

            <Link
              href="/exams"
              className="col-span-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200"
            >
              <LayoutDashboard className="w-6 h-6" />
              {t('backToList', lang)}
            </Link>
          </div>
        </div>

        {/* Detailed Review */}
        {(visibility === "SHOW_ANSWERS" || visibility === "SHOW_MARK_ONLY" || visibility === "SHOW_ALL" || isAdmin) ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">{t('reviewAnswers', lang)}</h3>
              </div>
              <span className="text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200">
                {lang === 'ar'
                  ? `${submission.answers.length} ${t('questionsEvaluated', lang)}`
                  : `${submission.answers.length} ${t('questionsEvaluated', lang)}`}
              </span>
            </div>

            {submission.answers.map((answer: any, index: number) => {
              const isQuestionCorrect = answer.isCorrect || (
                !!answer.question.correctAnswer && isOptionMatch(answer.question.correctAnswer, answer.selectedAnswer, -1)
              );
              const questionTags = [
                answer.question.domain && {
                  key: 'domain',
                  label: t('domain', lang),
                  value: answer.question.domain,
                  icon: Globe,
                  colorClass: 'bg-cyan-50 text-cyan-700 border border-cyan-100 hover:bg-cyan-100',
                  bubbleTheme: 'border-cyan-200 text-cyan-900',
                },
                answer.question.level && {
                  key: 'level',
                  label: t('level', lang),
                  value: translateLevel(answer.question.level),
                  icon: undefined,
                  colorClass: 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200',
                  bubbleTheme: 'border-slate-200 text-slate-800',
                },
                answer.question.dok && {
                  key: 'dok',
                  label: t('dok', lang),
                  value: answer.question.dok,
                  icon: ListOrdered,
                  colorClass: 'bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100',
                  bubbleTheme: 'border-yellow-200 text-yellow-900',
                },
                answer.question.skill && {
                  key: 'skill',
                  label: t('skill', lang),
                  value: answer.question.skill,
                  icon: Star,
                  colorClass: 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100',
                  bubbleTheme: 'border-amber-200 text-amber-900',
                },
                answer.question.subskill && {
                  key: 'subskill',
                  label: t('subskill', lang),
                  value: answer.question.subskill,
                  icon: Star,
                  colorClass: 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100',
                  bubbleTheme: 'border-orange-200 text-orange-900',
                },
                answer.question.microSkill && {
                  key: 'microSkill',
                  label: t('microSkill', lang),
                  value: answer.question.microSkill,
                  icon: Star,
                  colorClass: 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100',
                  bubbleTheme: 'border-rose-200 text-rose-900',
                },
                answer.question.cognitive && {
                  key: 'cognitive',
                  label: t('cognitive', lang),
                  value: answer.question.cognitive,
                  icon: Target,
                  colorClass: 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200',
                  bubbleTheme: 'border-slate-300 text-slate-900',
                },
                answer.question.standard && {
                  key: 'standard',
                  label: t('standard', lang),
                  value: answer.question.standard,
                  icon: Target,
                  colorClass: 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100',
                  bubbleTheme: 'border-blue-200 text-blue-900',
                },
                answer.question.indicator && {
                  key: 'indicator',
                  label: t('indicator', lang),
                  value: answer.question.indicator,
                  icon: TrendingUp,
                  colorClass: 'bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100',
                  bubbleTheme: 'border-purple-200 text-purple-900',
                },
                answer.question.learningOutcome && {
                  key: 'outcome',
                  label: t('outcome', lang),
                  value: answer.question.learningOutcome,
                  icon: Award,
                  colorClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100',
                  bubbleTheme: 'border-emerald-200 text-emerald-900',
                },
                answer.question.errorPattern && {
                  key: 'errorPattern',
                  label: t('errorPattern', lang),
                  value: answer.question.errorPattern,
                  icon: AlertCircle,
                  colorClass: 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100',
                  bubbleTheme: 'border-rose-200 text-rose-900',
                },
              ].filter(Boolean) as any[];

              const bottomKeys = ['level', 'skill', 'subskill', 'microSkill'];
              const topTags = questionTags.filter((tag: any) => !bottomKeys.includes(tag.key)).slice(0, 4);
              const bottomTags = [
                questionTags.find((tag: any) => tag.key === 'level'),
                questionTags.find((tag: any) => tag.key === 'skill'),
                questionTags.find((tag: any) => tag.key === 'subskill'),
                questionTags.find((tag: any) => tag.key === 'microSkill'),
              ].filter(Boolean);

              return (
                <div key={index} className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden group hover:border-indigo-200 transition-all">
                  <div className="p-8 md:p-10">
                    <div className="flex justify-between items-start gap-4 mb-6">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <span className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1.5">
                            {answer.question.type === 'MCQ' ? t('mcq', lang) : answer.question.type === 'MULTI_SELECT' ? t('multiSelect', lang) : t('trueFalse', lang)}
                          </span>
                          {/* Parallel 4+4 metadata tags container: Top 4 (Domain, DOK, Cognitive, Indicator) + Bottom 4 (Level, Skill, Subskill, Micro Skill) */}
                          <div className="flex flex-col gap-1.5 pt-0.5">
                            {topTags.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {topTags.map((tag: any) => (
                                  <InteractiveTag
                                    key={tag.key}
                                    label={tag.label}
                                    value={tag.value}
                                    icon={tag.icon}
                                    colorClass={tag.colorClass}
                                    bubbleTheme={tag.bubbleTheme}
                                    size="sm"
                                  />
                                ))}
                              </div>
                            )}
                            {bottomTags.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {bottomTags.map((tag: any) => (
                                  <InteractiveTag
                                    key={tag.key}
                                    label={tag.label}
                                    value={tag.value}
                                    icon={tag.icon}
                                    colorClass={tag.colorClass}
                                    bubbleTheme={tag.bubbleTheme}
                                    size="sm"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Auto-fit Right Badge: never wrap text, keep Wrong and Correct intact */}

                      <div className={`shrink-0 whitespace-nowrap self-start px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 border shadow-2xs ${isQuestionCorrect ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                        {isQuestionCorrect ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> : <XCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />}
                        <span>{isQuestionCorrect ? `+${answer.question.points} ${lang === 'ar' ? 'درجة' : 'pts'}` : t('wrong', lang)}</span>
                      </div>
                    </div>


                    <HtmlRenderer
                      html={answer.question.text}
                      tag="h4"
                      className="text-xl font-bold text-slate-800 mb-8 leading-relaxed"
                    />

                    {!['MCQ', 'MULTI_SELECT', 'TRUE_FALSE', 'TEXT'].includes(answer.question.type) && answer.question.type !== 'EXPLANATION' && answer.question.type !== 'CONTENT' ? (
                      <div className="mt-4 mb-8 pointer-events-none opacity-90 relative">
                        <div className="absolute inset-0 z-50"></div>
                        <InteractiveQuestionRenderer
                          question={{
                            ...answer.question,
                            type: answer.question.label || answer.question.type,
                          }}
                          value={answer.selectedAnswer || ''}
                          onChange={() => {}}
                          language={lang}
                        />
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {(answer.question.type === 'TRUE_FALSE' ? ["True", "False"] : (typeof answer.question.options === 'string' ? JSON.parse(answer.question.options) : (Array.isArray(answer.question.options) ? answer.question.options : [])))
                        .filter((opt: string) => opt && opt.trim() !== "")
                        .map((opt: string, oIdx: number) => {
                          let correctAnswers = [answer.question.correctAnswer];
                          let selectedAnswers = [answer.selectedAnswer];

                          if (answer.question.type === 'MULTI_SELECT') {
                            try {
                              correctAnswers = typeof answer.question.correctAnswer === 'string' && (answer.question.correctAnswer.startsWith('[') || answer.question.correctAnswer.startsWith('{')) ? JSON.parse(answer.question.correctAnswer) : (answer.question.correctAnswer || "").split(",");
                            } catch {
                              correctAnswers = (answer.question.correctAnswer || "").split(",");
                            }
                            try {
                              selectedAnswers = typeof answer.selectedAnswer === 'string' && (answer.selectedAnswer.startsWith('[') || answer.selectedAnswer.startsWith('{')) ? JSON.parse(answer.selectedAnswer) : (answer.selectedAnswer || "").split(",");
                            } catch {
                              selectedAnswers = (answer.selectedAnswer || "").split(",");
                            }
                          }

                          const isCorrectOption = correctAnswers.some((c: any) => isOptionMatch(c, opt, oIdx));
                          const isSelectedOption = selectedAnswers.some((s: any) => isOptionMatch(s, opt, oIdx));

                          let bgClass = "bg-slate-50 border-transparent";
                          let textClass = "text-slate-600";
                          let icon = null;

                          const shouldShowCorrect = (visibility === "SHOW_ANSWERS" || visibility === "SHOW_ALL" || isAdmin);
                          const shouldShowMark = (visibility === "SHOW_MARK_ONLY" || visibility === "SHOW_ANSWERS" || visibility === "SHOW_ALL" || isAdmin);

                          if (shouldShowCorrect && isCorrectOption) {
                            bgClass = "bg-emerald-50 border-emerald-500 shadow-sm";
                            textClass = "text-emerald-700";
                            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
                          } else if (shouldShowMark && isSelectedOption) {
                            if (isCorrectOption) {
                              bgClass = "bg-emerald-50 border-emerald-500 shadow-sm";
                              textClass = "text-emerald-700";
                              icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
                            } else {
                              bgClass = "bg-rose-50 border-rose-500 shadow-sm";
                              textClass = "text-rose-700";
                              icon = <XCircle className="w-5 h-5 text-rose-500" />;
                            }
                          }

                        return (
                          <div key={oIdx} className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${bgClass}`}>
                            <div className="flex items-center gap-3.5 flex-1 text-start">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                                bgClass.includes('emerald') ? "bg-emerald-600 text-white shadow-sm"
                                  : bgClass.includes('rose') ? "bg-rose-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {getOptionLetter(oIdx, lang)}
                              </span>
                              <span className={`font-bold flex-1 ${textClass}`}>
                                <HtmlRenderer html={answer.question.type === 'TRUE_FALSE' ? translateTrueFalse(opt) : cleanOptionText(opt)} tag="span" />
                              </span>
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                  </div>
                    )}

                  {(answer.question.explanation || answer.question.imageUrl) && (
                    <div className="space-y-4">
                      {answer.question.imageUrl && (
                        <img
                          src={answer.question.imageUrl}
                          alt="Question"
                          className="max-w-full rounded-2xl border border-slate-100 shadow-sm mx-auto"
                        />
                      )}
                      {answer.question.explanation && (visibility === "SHOW_ANSWERS" || visibility === "SHOW_ALL" || isAdmin) && renderExplanation(answer.question.explanation, lang)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-12 border border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-400 mb-2">{t('reviewUnavailable', lang)}</h3>
            <p className="text-slate-400">{t('reviewUnavailableMsg', lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
