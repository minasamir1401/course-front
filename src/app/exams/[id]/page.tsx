"use client";

import React, { useState, useEffect, Suspense } from "react";
import ExamCountdown from "@/components/ExamCountdown";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { API_URL, apiFetch } from "@/lib/api";
import { getStudentExamDuration } from "@/lib/examModuleView";
import { sanitizeHtml } from "@/lib/sanitize";
import { Clock, ChevronRight, ChevronLeft, Send, AlertCircle, HelpCircle, Lock, Play, Calendar, ShieldCheck, CheckCircle2, Target, Info, Sparkles, BookOpen, MessageSquare, Star, ListOrdered, Award, TrendingUp, Flag } from 'lucide-react';
import { useNotification } from "@/context/NotificationContext";
import VideoPlayer from "@/components/VideoPlayer";
import HtmlRenderer from "@/components/HtmlRenderer";
import Watermark from "@/components/Watermark";
import StudentExamCalculator from "@/components/StudentExamCalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";
import { ItemSectionsBubbles, MetadataModalButton } from '@/components/LessonSubComponents';
import { InteractiveTag } from '@/components/InteractiveTag';
import dynamic from 'next/dynamic';
import { getAnswerStatusLabel, getInExamQuestionTypeLabel, getSafeCurrentQuestion, resolveTakeExamQuestions, toggleReviewFlag } from '@/lib/takeExamUi';

const InteractiveQuestionRenderer = dynamic(() => import('@/components/InteractiveQuestionRenderer'), { ssr: false });

export default function TakeExamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <TakeExamPageContent />
    </Suspense>
  );
}



// Helper: extract choices array from options (handles array, JSON object, and delimited string formats)
const parseQuestionChoices = (options: any): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map(String).filter((s: string) => s.trim().length > 0);
  }
  if (typeof options === 'string') {
    try {
      const parsed: any = JSON.parse(options);
      if (Array.isArray(parsed)) {
        return (parsed as unknown[]).map(String).filter((s: string) => s.trim().length > 0);
      }
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.choices)) {
          return (parsed.choices as unknown[]).map(String).filter((s: string) => s.trim().length > 0);
        }
        if (Array.isArray(parsed.options)) {
          return (parsed.options as unknown[]).map(String).filter((s: string) => s.trim().length > 0);
        }
        const values = Object.values(parsed).map(String).filter((s: string) => s.trim().length > 0);
        if (values.length > 0) return values;
      }
    } catch {
      if (options.includes('\n')) {
        return options.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
      if (options.includes(',')) {
        return options.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
    }
  }
  if (typeof options === 'object' && options !== null) {
    if (Array.isArray(options.choices)) {
      return (options.choices as unknown[]).map(String).filter((s: string) => s.trim().length > 0);
    }
    if (Array.isArray(options.options)) {
      return (options.options as unknown[]).map(String).filter((s: string) => s.trim().length > 0);
    }
    const values = Object.values(options).map(String).filter((s: string) => s.trim().length > 0);
    if (values.length > 0) return values;
  }
  return [];
};

function TakeExamPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';
  const subExamId = searchParams.get('subExamId');
  const moduleId = searchParams.get('moduleId');
  const { showToast } = useNotification();
  const { language } = useLanguage();

  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Hint" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Tip" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Warning" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Key Insight" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Feedback" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Explanation" }
  };

  // Exam data
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Gatekeeper state
  const [started, setStarted] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Taking state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const remainingTimeRef = React.useRef(0);
  const answersById = React.useMemo(() => new Map(answers.map(answer => [answer.questionId, answer])), [answers]);
  const examQuestions = React.useMemo(() => resolveTakeExamQuestions(exam), [exam]);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPreviewAnswers, setShowPreviewAnswers] = useState(false);
  const [reviewFlags, setReviewFlags] = useState<string[]>([]);
  const hasAutoSubmitted = React.useRef(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [studentQuestionLang, setStudentQuestionLang] = useState<'ar' | 'en'>(language === 'en' ? 'en' : 'ar');

  const getAuthHeaders = React.useCallback((): HeadersInit => {
    const candidateToken = isPreviewMode
      ? (localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token") || localStorage.getItem("lms_token"))
      : (localStorage.getItem("lms_token") || localStorage.getItem("school_admin_token") || localStorage.getItem("super_admin_token"));
    const headers: Record<string, string> = {};
    if (candidateToken && candidateToken !== "cookie_auth" && candidateToken !== "null" && candidateToken !== "undefined") {
      headers["Authorization"] = `Bearer ${candidateToken}`;
    }
    return headers;
  }, [isPreviewMode]);

  useEffect(() => {
    try {
      const userStr = isPreviewMode
        ? (localStorage.getItem("super_admin_user") || localStorage.getItem("school_admin_user") || localStorage.getItem("lms_user"))
        : (localStorage.getItem("lms_user") || localStorage.getItem("school_admin_user") || localStorage.getItem("super_admin_user"));
      if (userStr) {
        const user = JSON.parse(userStr);
        let text = user.name || user.email || (isPreviewMode ? "Preview Mode" : "Student");
        if (user.schoolName) text += " - " + user.schoolName;
        else if (user.schoolId) text += " - School: " + user.schoolId;
        text += " - KLEVRO";
        setWatermarkText(text);
      } else {
        setWatermarkText(isPreviewMode ? "Preview Mode - KLEVRO" : "KLEVRO");
      }
    } catch (e) {
      setWatermarkText(isPreviewMode ? "Preview Mode - KLEVRO" : "KLEVRO");
    }
  }, [isPreviewMode]);

  useEffect(() => {
    fetchExam();
  }, [id]);

  // Load saved progress when exam data is ready
  useEffect(() => {
    if (exam && !isPreviewMode) {
      try {
        const savedAnswers = localStorage.getItem(`exam_${id}_${subExamId || "root"}_answers`);
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        const savedReviewFlags = localStorage.getItem(`exam_${id}_${subExamId || "root"}_review_flags`);
        if (savedReviewFlags) setReviewFlags(JSON.parse(savedReviewFlags));
        const savedTime = localStorage.getItem(`exam_${id}_${subExamId || "root"}_time`);
        if (savedTime && parseInt(savedTime) > 0) {
          setTimeLeft(parseInt(savedTime));
        } else {
          setTimeLeft(exam.duration * 60);
        }
      } catch (e) {
        setTimeLeft(exam.duration * 60);
      }
    } else if (exam && isPreviewMode) {
      setTimeLeft(exam.duration * 60);
    }
  }, [exam, id, isPreviewMode]);

  useEffect(() => {
    if (isPreviewMode) return;
    localStorage.setItem(`exam_${id}_${subExamId || "root"}_review_flags`, JSON.stringify(reviewFlags));
  }, [id, isPreviewMode, reviewFlags, subExamId]);

  const fetchExam = async () => {
    try {
      const [res, checkRes] = await Promise.all([
        apiFetch(`${API_URL}/exams/${id}${subExamId ? `?subExamId=${encodeURIComponent(subExamId)}` : ''}`, {
          headers: getAuthHeaders(),
        }),
        isPreviewMode ? Promise.resolve(null) : apiFetch(`${API_URL}/exams/${id}/check?subExamId=${encodeURIComponent(subExamId || '')}`, {
          headers: getAuthHeaders(),
        }),
      ]);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Failed to load exam", "error");
        if (!isPreviewMode) {
          router.back();
        }
        return;
      }

      // Check attempts (skip in preview mode)
      if (!isPreviewMode) {
        if (checkRes?.ok) {
          const checkData = await checkRes.json();
          if (!checkData.canTakeAgain) {
            showToast("You have reached the maximum number of attempts allowed for this exam.", "error");
            if (checkData.submissionId) {
              router.replace(`/exams/result/${checkData.submissionId}`);
            } else {
              router.back();
            }
            return;
          }
        }
      }

      let filteredQuestions = data.questions || [];
      const subExamDuration = getStudentExamDuration(data, subExamId, moduleId);
      if (subExamId) {
        filteredQuestions = filteredQuestions.filter((q: any) => q.subExamId === subExamId);
        const allSubExams = (data.modules || []).flatMap((m: any) => [
          ...(m.subExams || []),
          ...((m.subModules || []).flatMap((sm: any) => sm.subExams || []))
        ]);
        const matchedSubExam = allSubExams.find((se: any) => se.id === subExamId);
        data.selectedSubExam = data.selectedSubExam || matchedSubExam;
      }

      const mappedQuestions = filteredQuestions.map((q: any) => {
        let parsedSections = [];
        try {
          const parsed = typeof q.explanation === 'string' ? JSON.parse(q.explanation) : [];
          if (Array.isArray(parsed)) {
            parsedSections = parsed.map((item: any) => {
              if (typeof item === 'string') {
                return { type: 'EXPLANATION', content: item };
              }
              return item;
            });
          } else {
            parsedSections = [{ type: 'EXPLANATION', content: q.explanation || "" }];
          }
        } catch (e) {
          parsedSections = [{ type: 'EXPLANATION', content: q.explanation || "" }];
        }

        let correctAnswers: string[] = [];
        if (q.type === 'MULTI_SELECT') {
          try {
            const parsed = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
            correctAnswers = Array.isArray(parsed) ? parsed : (q.correctAnswer ? [String(q.correctAnswer)] : []);
          } catch {
            correctAnswers = typeof q.correctAnswer === 'string' 
              ? q.correctAnswer.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [];
          }
        }

        return {
          ...q,
          options: parseQuestionChoices(q.options),
          optionsEn: parseQuestionChoices(q.optionsEn),
          textEn: q.textEn || null,
          explanationEn: q.explanationEn || null,
          correctAnswers: q.type === 'MULTI_SELECT' ? correctAnswers : [],
          sections: parsedSections
        };
      });
      data.duration = subExamDuration || data.duration; // Override duration for the timer


      setExam({
        ...data,
        questions: mappedQuestions,
        selectedSubExam: data.selectedSubExam
          ? {
              ...data.selectedSubExam,
              questions: mappedQuestions,
            }
          : data.selectedSubExam
      });
      // Time is set in the separate useEffect now
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!exam) return;
    if (isPreviewMode) {
      setStarted(true);
      return;
    }

    const now = new Date();
    if (exam.startDate && now < new Date(exam.startDate)) {
      showToast(language === 'ar' ? "لم يحن موعد بدأ الامتحان بعد" : "The exam has not started yet", "error");
      return;
    }
    if (exam.endDate && now > new Date(exam.endDate)) {
      showToast(language === 'ar' ? "انتهى موعد هذا الامتحان" : "This exam time has ended", "error");
      return;
    }
    const childExam = exam.selectedSubExam;
    if (childExam?.publishDate && now < new Date(childExam.publishDate)) {
      showToast(language === 'ar' ? "لم يحن موعد نشر هذا الاختبار بعد" : "This exam has not been published yet", "error");
      return;
    }
    if (childExam?.cutOffDate && now > new Date(childExam.cutOffDate)) {
      showToast(language === 'ar' ? "انتهى موعد هذا الاختبار" : "This exam has expired", "error");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await apiFetch(`${API_URL}/exams/${id}/verify-access${subExamId ? `?subExamId=${encodeURIComponent(subExamId)}` : ''}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          password: passwordInput || null,
          subExamId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || (language === 'ar' ? "تعذر التحقق من صلاحية الدخول" : "Unable to verify exam access"), "error");
        return;
      }
      setStarted(true);
    } catch (error) {
      console.error(error);
      showToast(language === 'ar' ? "خطأ في التحقق من الوصول" : "Access verification failed", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectAnswer = (selectedAnswer: string) => {
    const newAnswers = [...answers];
    const question = getSafeCurrentQuestion(examQuestions, currentQuestion);
    if (!question) return;
    const questionId = question.id;
    const existingIndex = newAnswers.findIndex((a) => a.questionId === questionId);

    if (question.type === "MULTI_SELECT") {
      let currentSelected: string[] = [];
      if (existingIndex > -1) {
        currentSelected = Array.isArray(newAnswers[existingIndex].selectedAnswers) 
          ? newAnswers[existingIndex].selectedAnswers 
          : [newAnswers[existingIndex].selectedAnswer].filter(Boolean);
        
        if (currentSelected.includes(selectedAnswer)) {
          currentSelected = currentSelected.filter(s => s !== selectedAnswer);
        } else {
          currentSelected.push(selectedAnswer);
        }
        newAnswers[existingIndex].selectedAnswers = currentSelected;
        // Keep selectedAnswer for backward compatibility or simple check
        newAnswers[existingIndex].selectedAnswer = JSON.stringify(currentSelected);
      } else {
        newAnswers.push({ questionId, selectedAnswers: [selectedAnswer], selectedAnswer: JSON.stringify([selectedAnswer]) });
      }
    } else {
      if (existingIndex > -1) {
        newAnswers[existingIndex].selectedAnswer = selectedAnswer;
      } else {
        newAnswers.push({ questionId, selectedAnswer });
      }
    }
    setAnswers(newAnswers);
    if (!isPreviewMode) {
      try { localStorage.setItem(`exam_${id}_${subExamId || "root"}_answers`, JSON.stringify(newAnswers)); }
      catch { /* Keep the in-memory answer usable if browser storage is unavailable. */ }
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      const timeTakenInSeconds = Math.max(0, exam.duration * 60 - remainingTimeRef.current);
      const res = await apiFetch(`${API_URL}/exams/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ answers, totalTime: timeTakenInSeconds, subExamId, password: passwordInput || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (!isPreviewMode) {
          localStorage.removeItem(`exam_${id}_${subExamId || "root"}_answers`);
          localStorage.removeItem(`exam_${id}_${subExamId || "root"}_time`);
          localStorage.removeItem(`exam_${id}_${subExamId || "root"}_review_flags`);
        }
        if (isPreviewMode) {
          showToast(language === 'ar' ? "تم التسليم بنجاح في وضع المعاينة" : "Preview submitted successfully", "success");
        }
        router.push(`/exams/result/${data.submissionId}`);
      } else {
        showToast(data.error || "Failed to submit exam", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to connect to the server", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-xl text-slate-400 animate-pulse">{language === 'ar' ? 'جاري تحضير الامتحان...' : 'Preparing Exam...'}</p>
      </div>
    );
  }

  if (!exam) return null; // Prevent crash if exam failed to load but loading is finished (redirecting)

  const isEn = studentQuestionLang === 'en';
  const activeExamLang: 'ar' | 'en' = studentQuestionLang;

  const displayExamTitle = isEn
    ? (exam.selectedSubExam?.titleEn || exam.titleEn || exam.examTitleEn || exam.selectedSubExam?.title || exam.examTitle || exam.title || 'Untitled Exam')
    : (exam.selectedSubExam?.title || exam.examTitle || exam.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam'));
  const displayCourseTitle = isEn
    ? (exam.courseTitleEn || exam.course?.titleEn || exam.selectedSubExam?.courseTitleEn || exam.courseTitle || exam.course?.title || exam.selectedSubExam?.courseTitle || '')
    : (exam.courseTitle || exam.course?.title || exam.selectedSubExam?.courseTitle || '');
  const displayDomain = isEn
    ? (exam.selectedSubExam?.domainEn || exam.domainEn || exam.selectedSubExam?.domain || exam.domain || '')
    : (exam.selectedSubExam?.domain || exam.domain || '');


  // ── Gatekeeper Screen ─────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className={`min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 ${isEn ? 'ltr' : 'rtl'}`} dir={isEn ? 'ltr' : 'rtl'}>
        <div className="max-w-2xl w-full bg-white rounded-[50px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
          {/* Gatekeeper Language Switcher */}
          <div className="absolute top-6 end-6 z-20 flex items-center gap-1 bg-white/20 backdrop-blur-md p-1 rounded-xl border border-white/30 text-xs font-black">
            <button
              type="button"
              onClick={() => setStudentQuestionLang('ar')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !isEn ? 'bg-white text-indigo-900 shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setStudentQuestionLang('en')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isEn ? 'bg-white text-indigo-900 shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              English
            </button>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-center relative overflow-hidden shadow-2xl shadow-indigo-200/50">
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <ShieldCheck className="w-10 h-10 text-amber-300" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{displayExamTitle}</h1>
              <p className="text-indigo-100 font-medium">{isEn ? 'Please read the instructions carefully before starting.' : 'يرجى قراءة التعليمات بعناية قبل البدء.'}</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/20 blur-[100px] -mr-32 -mt-32"></div>
          </div>

          {/* Body */}
          <div className="p-12 space-y-10">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Duration' : 'المدة'}</p>
                <p className="font-black text-slate-700">{exam.duration} {isEn ? 'Minutes' : 'دقيقة'}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <Play className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Questions' : 'الأسئلة'}</p>
                <p className="font-black text-slate-700">{examQuestions.length} {isEn ? 'Questions' : 'سؤال'}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center col-span-2 md:col-span-1">
                <Calendar className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Type' : 'النوع'}</p>
                <p className="font-black text-slate-700">{exam.type === 'Quiz' ? 'Exam' : (exam.type || "Exam")}</p>
              </div>
              {displayCourseTitle && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                  <BookOpen className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Course' : 'الكورس'}</p>
                  <p className="font-black text-slate-700 line-clamp-2">{displayCourseTitle}</p>
                </div>
              )}
              {displayDomain && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                  <Target className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Domain' : 'المجال'}</p>
                  <p className="font-black text-slate-700 line-clamp-2">{displayDomain}</p>
                </div>
              )}
              {exam.password && isPreviewMode && typeof exam.password === 'string' && (
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-center">
                  <Lock className="w-6 h-6 text-amber-600 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">{isEn ? 'Password' : 'كلمة المرور'}</p>
                  <p className="font-black text-slate-800 break-words">{exam.password}</p>
                </div>
              )}
            </div>

            {/* Password Field */}
            {exam.password && (
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {isEn ? 'Exam Password' : 'كلمة سر فتح الامتحان'}
                </label>
                <input
                  type="password"
                  placeholder={isEn ? "Enter password here..." : "أدخل كلمة السر هنا..."}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartExam()}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-4 pt-2">
              <button
                onClick={handleStartExam}
                disabled={isVerifying}
                className="py-5 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {isVerifying ? (isEn ? "Verifying..." : "جاري التحقق...") : (isEn ? "Start Exam Now" : "ابدأ الامتحان الآن")}
                {isEn ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam Taking Screen ────────────────────────────────────────────────────
  const question = getSafeCurrentQuestion(examQuestions, currentQuestion);
  const answerObj = question ? answersById.get(question.id) : null;
  const selectedAnswer = answerObj?.selectedAnswer;
  const selectedAnswers = answerObj?.selectedAnswers || [];
  const isCurrentQuestionFlagged = question ? reviewFlags.includes(String(question.id || '')) : false;
  const currentQuestionSection = isEn
    ? (question?.sectionEn || exam.selectedSubExam?.sectionEn || exam.sectionEn || question?.section || exam.selectedSubExam?.section || exam.section || '')
    : (question?.section || exam.selectedSubExam?.section || exam.section || '');
  const currentAnswerStatus = getAnswerStatusLabel(question, answerObj, activeExamLang);
  const flaggedQuestionsCount = reviewFlags.length;
  
  const questionsThatRequireAnswer = examQuestions.filter((q: any) => q.type !== "TEXT");
  const answeredQuestionsCount = answers.filter(a => {
    const q = examQuestions.find((quest: any) => quest.id === a.questionId);
    return q && q.type !== "TEXT" && (a.selectedAnswer || (Array.isArray(a.selectedAnswers) && a.selectedAnswers.length > 0));
  }).length;
  const unansweredCount = Math.max(0, questionsThatRequireAnswer.length - answeredQuestionsCount);
  const progressDenominator = questionsThatRequireAnswer.length || examQuestions.length || 1;
  const completedProgress = Math.round((answeredQuestionsCount / progressDenominator) * 100);
  const isQuestionAnswered = (examQuestion: any) => {
    if (examQuestion.type === "TEXT") return true;
    const examAnswer = answersById.get(examQuestion.id);
    return Boolean(
      examAnswer?.selectedAnswer ||
      (Array.isArray(examAnswer?.selectedAnswers) && examAnswer.selectedAnswers.length > 0)
    );
  };

  if (!question) {
    return (
      <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-6 ${isEn ? 'ltr' : 'rtl'}`} dir={isEn ? 'ltr' : 'rtl'}>
        <div className="max-w-xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h2 className="text-2xl font-black text-slate-900">
            {isEn ? 'No questions are available for this exam' : 'لا توجد أسئلة متاحة لهذا الاختبار'}
          </h2>
          <p className="mt-3 text-sm font-bold text-slate-500">
            {isEn
              ? 'Make sure questions are attached to the correct exam or section, then try again.'
              : 'تأكد من ربط الأسئلة بالاختبار أو بالقسم الصحيح ثم أعد المحاولة.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${isEn ? 'ltr' : 'rtl'}`} dir={isEn ? 'ltr' : 'rtl'}>
      <Watermark text={watermarkText} />
      <StudentExamCalculator />

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowSubmitModal(false)}
          ></div>
          <div className="relative bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in-95 duration-200">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${unansweredCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
              {unansweredCount > 0 ? <AlertCircle className="w-10 h-10" /> : <Send className="w-10 h-10" />}
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">
              {unansweredCount > 0 ? (isEn ? "Warning: Unanswered Questions" : "تنبيه: أسئلة لم تحل") : (isEn ? "Submit Exam?" : "تسليم الامتحان؟")}
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              {unansweredCount > 0 
                ? (isEn ? `You have answered ${answers.length} out of ${examQuestions.length} questions. There are ${unansweredCount} unanswered questions. Are you sure you want to submit?` : `لقد أجبت على ${answers.length} من أصل ${examQuestions.length} سؤال. هناك ${unansweredCount} سؤال لم يتم حلهم بعد. هل أنت متأكد من التسليم؟`)
                : (isEn ? "You are about to finish the exam and submit your answers. Please review all questions before confirming." : "أنت على وشك إنهاء الامتحان وتسليم إجاباتك. يرجى التأكد من مراجعة كافة الأسئلة قبل التأكيد.")}
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSubmit}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all hover:scale-105 ${unansweredCount > 0 ? 'bg-amber-600 shadow-amber-100 hover:bg-amber-700 text-black' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700 text-white'}`}
              >
                {isEn ? "Yes, Submit Now" : "نعم، قم بالتسليم الآن"}
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all"
              >
                {isEn ? "Go Back to Review" : "الرجوع للمراجعة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Mode Banner with Language Switcher */}
      {isPreviewMode && (
        <div className="bg-amber-500 text-white py-2 px-6 text-xs sm:text-sm font-black tracking-wide shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{isEn ? "Preview Mode – Data will NOT be saved" : "وضع المعاينة – البيانات لن تُحفظ"}</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-600/80 p-0.5 rounded-lg border border-amber-400/60 text-xs">
            <button
              type="button"
              onClick={() => setStudentQuestionLang('ar')}
              className={`px-2.5 py-1 rounded-md transition-all font-black ${
                !isEn ? 'bg-white text-amber-900 shadow-xs' : 'text-white hover:bg-white/20'
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setStudentQuestionLang('en')}
              className={`px-2.5 py-1 rounded-md transition-all font-black ${
                isEn ? 'bg-white text-amber-900 shadow-xs' : 'text-white hover:bg-white/20'
              }`}
            >
              English
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-800 line-clamp-1">{displayExamTitle}</h1>
            <div className="flex flex-wrap gap-2 mt-0.5">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{exam.type === 'Quiz' ? 'Exam' : (exam.type || 'Exam')}</span>
              {currentQuestionSection && (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {isEn ? 'Section: ' : 'القسم: '} {currentQuestionSection}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                currentAnswerStatus === (isEn ? 'Answered' : 'تمت الإجابة')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {isEn ? 'Answer Status: ' : 'الحالة: '} {currentAnswerStatus}
              </span>
              {flaggedQuestionsCount > 0 && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  {isEn ? 'Flagged: ' : 'للمراجعة: '} {flaggedQuestionsCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Top Bar Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setStudentQuestionLang('ar')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  !isEn ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setStudentQuestionLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  isEn ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
              >
                English
              </button>
            </div>

            <ExamCountdown
              initialSeconds={timeLeft}
              storageKey={isPreviewMode ? null : `exam_${id}_${subExamId || "root"}_time`}
              onTick={seconds => { remainingTimeRef.current = seconds; }}
              onExpire={() => {
                if (!hasAutoSubmitted.current) { hasAutoSubmitted.current = true; handleSubmit(); }
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {examQuestions.map((examQuestion: any, index: number) => {
              const answered = isQuestionAnswered(examQuestion);
              const isActive = currentQuestion === index;
              return (
                <button
                  key={String(examQuestion.id || index)}
                  type="button"
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-11 h-11 rounded-xl border text-sm font-black transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                      : answered
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                  aria-label={`${isEn ? 'Question' : 'السؤال'} ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {isEn ? 'Question' : 'السؤال'} {Math.min(currentQuestion + 1, examQuestions.length)} {isEn ? 'of' : 'من'} {examQuestions.length}
              </span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                currentAnswerStatus === (isEn ? 'Answered' : 'تمت الإجابة')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {isEn ? 'Answer Status: ' : 'الحالة: '} {currentAnswerStatus}
              </span>
            </div>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {completedProgress}% {isEn ? 'Completed' : 'اكتمل'}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${completedProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
          <div className="p-8">
            {question.sections && question.sections.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end mb-4">
                <ItemSectionsBubbles item={{sections: question.sections}} isSubmitted={false} language={activeExamLang} filterType="HINT_ONLY" />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm shadow-indigo-200">
                  {getInExamQuestionTypeLabel(question, activeExamLang)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStudentQuestionLang('ar')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    !isEn ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => setStudentQuestionLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    isEn ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            <div dir={isEn ? 'ltr' : 'rtl'}>
              <HtmlRenderer 
                html={sanitizeHtml((isEn && question.textEn) ? question.textEn : (question.text || question.textEn || ''))}
                tag="h2"
                className="text-2xl font-bold text-slate-800 mb-8 leading-relaxed animate-in fade-in duration-500"
              />
            </div>
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt="Question"
                className="max-w-full rounded-2xl mb-8 border border-slate-200 shadow-sm mx-auto"
              />
            )}
            
            {question.videoUrl && (
              <div className="relative w-full aspect-video rounded-[30px] overflow-hidden mb-8 border border-slate-100 shadow-md">
                <VideoPlayer url={question.videoUrl} />
              </div>
            )}
            
            {question.type !== "TEXT" ? (
              <>
                {question.type === "MCQ" || question.type === "MULTI_SELECT" ? (
                  (() => {
                    const rawArChoices = parseQuestionChoices(question.options);
                    const rawEnChoices = parseQuestionChoices(question.optionsEn);
                    const activeChoices = (isEn && rawEnChoices.length > 0) ? rawEnChoices : rawArChoices;
                    const choices = activeChoices.filter((opt: string) => opt && opt.trim() !== "");
                    if (choices.length === 0) {
                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-in fade-in">
                          <label className="block text-sm font-black text-slate-700">
                            {isEn ? 'Enter your answer here (Student-Produced Response / Numeric):' : 'اكتب إجابتك هنا (إجابة حرة / رقمية):'}
                          </label>
                          <input
                            type="text"
                            value={selectedAnswer || ''}
                            onChange={(e) => handleSelectAnswer(e.target.value)}
                            placeholder={isEn ? 'Enter your answer...' : 'أدخل الإجابة...'}
                            className="w-full px-5 py-4 bg-white border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-xl text-lg font-bold text-slate-800 transition-all outline-none"
                          />
                          {showPreviewAnswers && isPreviewMode && question.correctAnswer && (
                            <div className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl mt-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{isEn ? `Correct Answer: ${question.correctAnswerEn || question.correctAnswer}` : `الإجابة النموذجية: ${question.correctAnswer}`}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {choices.map((option: string, i: number) => {
                          const arOpt = rawArChoices[i];
                          const enOpt = rawEnChoices[i];
                          const isSelected = question.type === "MULTI_SELECT" 
                            ? (selectedAnswers.includes(option) || (arOpt && selectedAnswers.includes(arOpt)) || (enOpt && selectedAnswers.includes(enOpt)))
                            : (selectedAnswer === option || (arOpt && selectedAnswer === arOpt) || (enOpt && selectedAnswer === enOpt));

                          const isOptionCorrectInPreview = question.type === "MULTI_SELECT"
                            ? Array.isArray(question.correctAnswers) && (question.correctAnswers.includes(option) || (arOpt && question.correctAnswers.includes(arOpt)))
                            : (question.correctAnswer === option || (arOpt && question.correctAnswer === arOpt));

                          return (
                            <button
                              key={i}
                              dir={isEn ? 'ltr' : 'rtl'}
                              onClick={() => handleSelectAnswer(option)}
                              className={`w-full text-start p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 group ${
                                showPreviewAnswers && isPreviewMode && isOptionCorrectInPreview
                                  ? "bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100"
                                  : showPreviewAnswers && isPreviewMode && isSelected && !isOptionCorrectInPreview
                                  ? "bg-rose-50 border-rose-500 shadow-md shadow-rose-100"
                                  : isSelected
                                  ? "bg-indigo-50 border-indigo-600 shadow-md shadow-indigo-100"
                                  : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3.5 flex-1 text-start">
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                }`}>
                                  {getOptionLetter(i, activeExamLang)}
                                </span>
                                <span className={`text-lg font-bold ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                                  <HtmlRenderer html={cleanOptionText(option)} tag="span" />
                                </span>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ms-3 ${
                                  isSelected
                                    ? "bg-indigo-600 border-indigo-600"
                                    : "border-slate-300 group-hover:border-indigo-400"
                                }`}
                              >
                                {isSelected && (
                                  question.type === "MULTI_SELECT" 
                                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                                    : <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : question.type === "TRUE_FALSE" ? (
                  <div className="flex gap-4">
                    {[
                      { value: "True", label: isEn ? "True" : "صحيح" },
                      { value: "False", label: isEn ? "False" : "خطأ" }
                    ].map((option) => {
                      const normCorrect = question.correctAnswer === "صحيح" ? "True" : question.correctAnswer === "خطأ" ? "False" : question.correctAnswer;
                      const isCorrect = normCorrect === option.value;
                      const isSelected = selectedAnswer === option.value || (option.value === "True" && selectedAnswer === "صحيح") || (option.value === "False" && selectedAnswer === "خطأ");
                      return (
                      <button
                        key={option.value}
                        onClick={() => handleSelectAnswer(option.value)}
                        className={`flex-1 py-6 rounded-2xl border-2 font-bold text-xl transition-all ${
                          showPreviewAnswers && isPreviewMode && isCorrect
                            ? "bg-emerald-50 border-emerald-600 text-emerald-900"
                            : showPreviewAnswers && isPreviewMode && isSelected && !isCorrect
                            ? "bg-rose-50 border-rose-600 text-rose-900"
                            : isSelected
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                            : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    )})}
                  </div>
                ) : (
                  // Advanced question types (MATCHING, DRAG_DROP_FILL, GROUP_SORTING, etc.)
                  <div className="mt-2">
                    <InteractiveQuestionRenderer
                      key={`${question.id}-${activeExamLang}`}
                      question={{
                        ...question,
                        type: question.label || question.type,
                      }}
                      value={selectedAnswer || ''}
                      onChange={(val: string) => handleSelectAnswer(val)}
                      language={activeExamLang}
                    />
                  </div>
                )}
              </>
            ) : (
              question.sections && question.sections.length > 0 && (
                <div className="mt-8 space-y-4 animate-in fade-in duration-700">
                  {question.sections.map((sec: any, sIdx: number) => {
                    const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                    const Icon = preset.icon;
                    const content = (isEn && (sec.contentEn || sec.textEn)) ? (sec.contentEn || sec.textEn) : sec.content;
                    return (
                      <div key={sIdx} className={`p-6 rounded-2xl border-2 ${preset.bg} ${preset.border}`}>
                        <div className={`flex items-center gap-2 mb-3 font-black ${preset.text}`}>
                          <Icon className="w-5 h-5 animate-bounce-slow shrink-0" />
                          <span>{preset.label}</span>
                        </div>
                        <HtmlRenderer html={sanitizeHtml(content)} className={`prose prose-sm max-w-none ${preset.text}`} />
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <button
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-colors"
          >
            {isEn ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {isEn ? 'Previous' : 'السؤال السابق'}
          </button>

          <button
            onClick={() => setReviewFlags((currentFlags) => toggleReviewFlag(currentFlags, String(question.id || '')))}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-bold transition-all ${
              isCurrentQuestionFlagged
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-200 hover:text-rose-600'
            }`}
          >
            <Flag className="w-4 h-4" />
            {isEn ? 'Mark for Review' : 'وضع علامة للمراجعة'}
          </button>

          <div className="flex-1 flex justify-end">
            {currentQuestion === examQuestions.length - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
              >
                {submitting ? (isEn ? "Submitting..." : "جاري الإرسال...") : (isEn ? "Submit Final Exam" : "تسليم الامتحان النهائي")}
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                {isEn ? 'Next' : 'السؤال التالي'}
                {isEn ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
