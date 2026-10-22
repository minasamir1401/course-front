"use client";

import { shouldSkipImageOptimization } from "@/lib/imageDisplay";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useModalFocus } from "@/hooks/useModalFocus";
import ExamCountdown from "@/components/ExamCountdown";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useExamMedia } from "@/hooks/useExamMedia";
import { resolveMediaUrl } from "@/lib/utils";
import { API_URL, apiFetch } from "@/lib/api";
import { getStudentExamDuration } from "@/lib/examModuleView";
import { sanitizeHtml } from "@/lib/sanitize";
import { ChevronRight, ChevronLeft, Send, AlertCircle, HelpCircle, CheckCircle2, Info, Sparkles, BookOpen, MessageSquare, ListOrdered, Flag, Lightbulb } from 'lucide-react';
import { useNotification } from "@/context/NotificationContext";
import VideoPlayer from "@/components/VideoPlayer";
import HtmlRenderer from "@/components/HtmlRenderer";
import Watermark from "@/components/Watermark";
import StudentExamCalculator from "@/components/StudentExamCalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";
import { getAnswerStatusLabel, getInExamQuestionTypeLabel, getSafeCurrentQuestion, resolveTakeExamQuestions, toggleReviewFlag } from '@/lib/takeExamUi';
import InteractiveQuestionRenderer from '@/components/InteractiveQuestionRenderer';
import StudentExamIntro from '@/components/student/StudentExamIntro';
import styles from './TakeExam.module.css';

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

interface ExamOptionButtonProps {
  option: string;
  index: number;
  isSelected: boolean;
  isOptionCorrectInPreview: boolean;
  showPreviewAnswers: boolean;
  isPreviewMode: boolean;
  isMultiSelect: boolean;
  activeExamLang: 'ar' | 'en';
  isEn: boolean;
  onSelect: (option: string) => void;
}

const ExamOptionButton = React.memo(function ExamOptionButton({
  option,
  index,
  isSelected,
  isOptionCorrectInPreview,
  showPreviewAnswers,
  isPreviewMode,
  isMultiSelect,
  activeExamLang,
  isEn,
  onSelect,
}: ExamOptionButtonProps) {
  return (
    <button
      type="button"
      dir={isEn ? 'ltr' : 'rtl'}
      aria-pressed={!!isSelected}
      onClick={() => onSelect(option)}
      data-preview-result={showPreviewAnswers && isPreviewMode ? isOptionCorrectInPreview ? "correct" : isSelected ? "incorrect" : undefined : undefined}
      className={`${styles.option} w-full text-start p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 group ${
        showPreviewAnswers && isPreviewMode && isOptionCorrectInPreview
          ? "bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100"
          : showPreviewAnswers && isPreviewMode && isSelected && !isOptionCorrectInPreview
          ? "bg-rose-50 border-rose-500 shadow-md shadow-rose-100"
          : isSelected
          ? "bg-indigo-50 border-indigo-600 shadow-md shadow-indigo-100"
          : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0 text-start">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
          isSelected
            ? "bg-indigo-600 text-white shadow-sm"
            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
        }`}>
          {getOptionLetter(index, activeExamLang)}
        </span>
        <span className={`exam-option-content flex-1 min-w-0 overflow-x-auto py-1 text-base sm:text-lg font-bold ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
          <HtmlRenderer html={cleanOptionText(option)} tag="span" imageLoading="eager" />
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
          isMultiSelect 
            ? <CheckCircle2 className="w-4 h-4 text-white" />
            : <div className="w-2 h-2 bg-white rounded-full"></div>
        )}
      </div>
    </button>
  );
});

function TakeExamPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';
  const subExamId = searchParams.get('subExamId');
  const moduleId = searchParams.get('moduleId');
  const { showToast } = useNotification();
  const { language } = useLanguage();

  const getSectionStylePresets = (en: boolean): Record<string, any> => ({
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: en ? "Hint" : "تلميح" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: en ? "Tip" : "نصيحة" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: en ? "Warning" : "تحذير" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: en ? "Key Insight" : "نقطة هامة" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: en ? "Feedback" : "ملاحظات" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: en ? "Explanation" : "شرح مفصل" }
  });

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
  const submitDialogRef = React.useRef<HTMLDivElement>(null);
  useModalFocus(showSubmitModal, submitDialogRef, () => setShowSubmitModal(false));
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [localSaveFailed, setLocalSaveFailed] = useState(false);
  const [questionFilter, setQuestionFilter] = useState('all');
  const [navigationExpanded, setNavigationExpanded] = useState(false);
  useEffect(() => {
    if (!started) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [started]);


  const [showPreviewAnswers, setShowPreviewAnswers] = useState(false);
  const [reviewFlags, setReviewFlags] = useState<string[]>([]);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const hasAutoSubmitted = React.useRef(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [studentQuestionLang, setStudentQuestionLang] = useState<'ar' | 'en'>(language === 'en' ? 'en' : 'ar');

  const questionWorkspaceRef = React.useRef<HTMLDivElement>(null);
  const mediaQuestion = getSafeCurrentQuestion(examQuestions, currentQuestion);
  const mediaKey = String(mediaQuestion?.id || currentQuestion) + ':' + studentQuestionLang;
  const questionMedia = useExamMedia(questionWorkspaceRef, mediaKey, started && !loading && !!mediaQuestion, examQuestions[currentQuestion + 1]);

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
    setWatermarkText(isPreviewMode ? "Preview Mode - Klevro" : "Klevro");
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
  }, [exam, id, isPreviewMode, subExamId]);

  useEffect(() => {
    // Restore the saved flags before the first write for this attempt.
    if (isPreviewMode || !started) return;
    try { localStorage.setItem(`exam_${id}_${subExamId || "root"}_review_flags`, JSON.stringify(reviewFlags)); } catch { setLocalSaveFailed(true); }
  }, [id, isPreviewMode, reviewFlags, subExamId, started]);

  const fetchExam = async () => {
    setLoading(true); setLoadError("");
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
        setLoadError(language === 'ar' ? 'تعذر تحميل الامتحان. تحقق من الاتصال أو صلاحية الدخول.' : 'Could not load this exam. Check your connection or access.');
        return;
      }

      // Check attempts (skip in preview mode)
      if (!isPreviewMode) {
        if (checkRes?.ok) {
          const checkData = await checkRes.json();
          if (!checkData.canTakeAgain) {
            showToast(language === "ar" ? "استخدمت جميع المحاولات المسموح بها." : "You have used all available attempts.", "error");
            if (checkData.submissionId) {
              router.replace(`/exams/result/${checkData.submissionId}`);
            } else {
              setLoadError(language === "ar" ? "لا توجد محاولات متاحة لهذا الامتحان." : "No attempts are available for this exam.");
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
        let parsedSections = Array.isArray(q.sections) && q.sections.length > 0 ? q.sections : [];
        if (parsedSections.length === 0 && q.explanation) {
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
          hint: q.hint || null,
          hintEn: q.hintEn || null,
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
      setLoadError(language === "ar" ? "تعذر الاتصال لتحميل الامتحان. أعد المحاولة." : "Could not connect to load the exam. Please retry.");
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

  const handleSelectAnswer = React.useCallback((selectedAnswer: string) => {
    setAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers];
      const question = getSafeCurrentQuestion(examQuestions, currentQuestion);
      if (!question) return prevAnswers;
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
          newAnswers[existingIndex] = {
            ...newAnswers[existingIndex],
            selectedAnswers: currentSelected,
            selectedAnswer: JSON.stringify(currentSelected)
          };
        } else {
          newAnswers.push({ questionId, selectedAnswers: [selectedAnswer], selectedAnswer: JSON.stringify([selectedAnswer]) });
        }
      } else {
        if (existingIndex > -1) {
          newAnswers[existingIndex] = {
            ...newAnswers[existingIndex],
            selectedAnswer
          };
        } else {
          newAnswers.push({ questionId, selectedAnswer });
        }
      }
      if (!isPreviewMode) {
        try { localStorage.setItem(`exam_${id}_${subExamId || "root"}_answers`, JSON.stringify(newAnswers)); }
        catch { setLocalSaveFailed(true); /* Keep in-memory answer usable */ }
      }
      return newAnswers;
    });
  }, [examQuestions, currentQuestion, isPreviewMode, id, subExamId]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true); setSubmitError("");
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
      if (res.ok && typeof data.submissionId === "string" && data.submissionId) {
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
        setSubmitError(language === "ar" ? "لم يتم تأكيد التسليم. إجاباتك ما زالت موجودة؛ أعد المحاولة." : "Submission was not confirmed. Your answers are still here; please retry.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError(language === "ar" ? "انقطع الاتصال أثناء التسليم. احتفظ بهذه الصفحة مفتوحة وأعد الإرسال." : "Connection failed during submission. Keep this page open and retry.");
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

  if (loadError || !exam) return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5" dir={language === 'ar' ? 'rtl' : 'ltr'}><section className="student-panel max-w-lg space-y-5"><h1 className="text-2xl font-black">{language === 'ar' ? 'تعذر فتح الامتحان' : 'Could not open exam'}</h1><p role="alert">{loadError}</p><div className="flex flex-wrap gap-3"><button className="report-primary" onClick={() => fetchExam()}>{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button><Link className="report-secondary" href="/exams">{language === 'ar' ? 'العودة للامتحانات' : 'Back to exams'}</Link></div></section></main>;

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


  // The entry screen shares the student design; starting still uses the same access check.
  if (!started) return <StudentExamIntro examId={String(id)} title={displayExamTitle} isEn={isEn} setExamLanguage={setStudentQuestionLang} duration={exam.duration} questions={examQuestions.length} type={exam.type} courseTitle={displayCourseTitle} domain={displayDomain} subject={exam.subjects || exam.subject || exam.category || exam.course?.subject} coverImage={exam.course?.coverImage} description={exam.description} passwordRequired={Boolean(exam.password)} password={passwordInput} setPassword={setPasswordInput} previewPassword={isPreviewMode && typeof exam.password === 'string' ? exam.password : undefined} preview={isPreviewMode} verifying={isVerifying} onStart={handleStartExam} opens={exam.selectedSubExam?.publishDate || exam.startDate} closes={exam.selectedSubExam?.cutOffDate || exam.endDate}/>;

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
    <div className={styles.exam} dir={isEn ? 'ltr' : 'rtl'} data-exam-workspace>
      <div className={styles.background} aria-hidden="true"/>
      <Watermark text={watermarkText} />
      <OfflineBanner language={language} />
      <StudentExamCalculator />

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className={styles.modalBackdrop}
            onClick={() => setShowSubmitModal(false)}
          ></div>
          <div ref={submitDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="submit-exam-title" className={styles.modal}>
            <div className={styles.modalIcon} data-complete={unansweredCount===0}>
              {unansweredCount > 0 ? <AlertCircle className="w-10 h-10" /> : <Send className="w-10 h-10" />}
            </div>
            <h2 id="submit-exam-title" className="text-2xl font-black text-slate-800 mb-4">
              {unansweredCount > 0 ? (isEn ? "Warning: Unanswered Questions" : "تنبيه: أسئلة لم تحل") : (isEn ? "Submit Exam?" : "تسليم الامتحان؟")}
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              {unansweredCount > 0 
                ? (isEn ? `You have answered ${answeredQuestionsCount} out of ${questionsThatRequireAnswer.length} questions. There are ${unansweredCount} unanswered questions. Are you sure you want to submit?` : `لقد أجبت على ${answeredQuestionsCount} من أصل ${questionsThatRequireAnswer.length} سؤال. هناك ${unansweredCount} سؤال لم يتم حلهم بعد. هل أنت متأكد من التسليم؟`)
                : (isEn ? "You are about to finish the exam and submit your answers. Please review all questions before confirming." : "أنت على وشك إنهاء الامتحان وتسليم إجاباتك. يرجى التأكد من مراجعة كافة الأسئلة قبل التأكيد.")}
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={handleSubmit}
                className={styles.submit}
              >
                {isEn ? "Yes, Submit Now" : "نعم، قم بالتسليم الآن"}
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className={styles.previous}
              >
                {isEn ? "Go Back to Review" : "الرجوع للمراجعة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewMode && <div className={styles.previewBanner}>{isEn ? 'Preview mode — answers are not recorded.' : 'وضع المعاينة — لا تُسجّل الإجابات.'}</div>}

      <header className={styles.topbar}><div className={styles.headerInner}>
        <div className={styles.heading}><span className={styles.brand}><Image src="/logo.jpeg" alt="Klevro" width={33} height={36}/></span><div className={styles.headingCopy}><p className={styles.eyebrow}><span aria-hidden="true"/>{isEn ? 'Assessment in progress' : 'اختبار جارٍ'}</p><h1>{displayExamTitle}</h1><div className={styles.headerMeta}><span className={styles.type}>{exam.type === 'Assignment' ? (isEn ? 'Assignment' : 'واجب تطبيقي') : exam.type === 'Quiz' || exam.type === 'Exam' || !exam.type ? (isEn ? 'Exam' : 'امتحان') : exam.type}</span>{currentQuestionSection && <span>{isEn ? 'Section: ' : 'القسم: '}{currentQuestionSection}</span>}</div></div></div>
        <div className={styles.headerTools}><div className={styles.language} role="group" aria-label={isEn?'Exam language':'لغة الامتحان'}><button type="button" aria-pressed={!isEn} onClick={()=>setStudentQuestionLang('ar')}>العربية</button><button type="button" aria-pressed={isEn} onClick={()=>setStudentQuestionLang('en')}>English</button></div><div className={styles.timer}><p>{!questionMedia.ready ? (isEn ? 'Paused while loading' : 'متوقف أثناء التحميل') : (isEn ? 'Time remaining' : 'الوقت المتبقي')}</p><ExamCountdown initialSeconds={timeLeft} paused={!questionMedia.ready} storageKey={isPreviewMode ? null : `exam_${id}_${subExamId || "root"}_time`} onTick={seconds=>{remainingTimeRef.current=seconds;}} onExpire={()=>{if(!hasAutoSubmitted.current){hasAutoSubmitted.current=true;handleSubmit();}}}/></div></div>
      </div></header>
      <div className={styles.workspace}>
        <aside className={styles.navigator} aria-labelledby="question-navigator-title"><div className={styles.navHeading}><h2 id="question-navigator-title">{isEn ? 'Your progress' : 'تقدمك في الاختبار'}</h2><strong>{completedProgress}%</strong><button type="button" className={styles.mobileToggle} aria-expanded={navigationExpanded} aria-controls="exam-question-navigation" onClick={()=>setNavigationExpanded(value=>!value)}><ListOrdered size={15} aria-hidden="true"/>{navigationExpanded ? (isEn?'Hide questions':'إخفاء الأسئلة') : (isEn?'Show questions':'عرض الأسئلة')}</button></div><progress className={styles.progress} max={100} value={completedProgress} aria-label={isEn?'Assessment progress':'تقدم الاختبار'}/>
          <div className={styles.counts}><div><strong>{answeredQuestionsCount}</strong><span>{isEn?'Answered':'تم حلها'}</span></div><div><strong>{unansweredCount}</strong><span>{isEn?'Remaining':'متبقية'}</span></div><div><strong>{flaggedQuestionsCount}</strong><span>{isEn?'For review':'للمراجعة'}</span></div></div>
          <div id="exam-question-navigation" className={styles.questionTools} data-expanded={navigationExpanded}><label className={styles.filter}><span>{isEn?'Question navigation':'التنقل بين الأسئلة'}</span><select value={questionFilter} onChange={e=>setQuestionFilter(e.target.value)}><option value="all">{isEn?'All questions':'كل الأسئلة'}</option><option value="unanswered">{isEn?'Unanswered questions':'الأسئلة غير المجابة'}</option><option value="flagged">{isEn?'Flagged for review':'المعلّمة للمراجعة'}</option></select></label>
            {questionFilter!=='all' && !examQuestions.some((q:any)=>questionFilter==='unanswered'?!isQuestionAnswered(q):reviewFlags.includes(String(q.id))) && <p role="status" className={styles.noMatches}>{isEn?'No questions match this selection.':'لا توجد أسئلة في هذا الاختيار.'}</p>}
            <nav className={styles.questionNumbers} aria-label={isEn?'Exam questions':'أسئلة الاختبار'}>{examQuestions.map((examQuestion:any,index:number)=>{const answered=isQuestionAnswered(examQuestion),flagged=reviewFlags.includes(String(examQuestion.id));if(questionFilter==='unanswered'&&answered || questionFilter==='flagged'&&!flagged)return null;return <button key={String(examQuestion.id||index)} type="button" className={styles.questionNumber} data-answered={answered} data-flagged={flagged} onClick={()=>setCurrentQuestion(index)} aria-current={currentQuestion===index?'step':undefined} aria-label={`${isEn?'Question':'السؤال'} ${index+1} — ${answered?(isEn?'Answered':'تمت الإجابة'):(isEn?'Unanswered':'لم تجب')} ${flagged?(isEn?'Flagged for review':'للمراجعة'):''}`}>{index+1}</button>;})}</nav>
            <div className={styles.legend} aria-hidden="true"><span><i/>{isEn?'Current':'الحالي'}</span><span><i/>{isEn?'Answered':'تم حلّه'}</span><span><i/>{isEn?'For review':'للمراجعة'}</span></div>
          </div><button type="button" className={styles.reviewSubmit} disabled={submitting} onClick={()=>setShowSubmitModal(true)}><Send size={15} aria-hidden="true"/>{isEn?'Review & submit':'مراجعة وتسليم'}</button>
        </aside>
        <main className={styles.main} id="exam-main-content">

        <div role="status" className={styles.saveNotice} data-warning={localSaveFailed}><CheckCircle2 size={15} aria-hidden="true"/><p>{isPreviewMode ? (isEn ? 'Preview: answers are not recorded.' : 'معاينة: لا تُسجّل الإجابات.') : localSaveFailed ? (isEn ? 'Device storage is unavailable. Keep this page open until submission.' : 'تعذر الحفظ على الجهاز. احتفظ بالصفحة مفتوحة حتى التسليم.') : (isEn ? 'Answers are saved on this device. They reach your school only after successful submission.' : 'الإجابات محفوظة على هذا الجهاز، ولا تصل للمدرسة إلا بعد تأكيد التسليم.')}</p></div>
        {submitError && <div role="alert" className={styles.error}><p>{submitError}</p><button className="report-primary mt-3" disabled={submitting} onClick={handleSubmit}>{isEn ? 'Retry submission' : 'إعادة التسليم'}</button></div>}

        <div className={styles.questionPosition}><h2>{isEn?'Question':'السؤال'} {Math.min(currentQuestion+1,examQuestions.length)} <span>{isEn?'of':'من'} {examQuestions.length}</span></h2><span className={styles.answerStatus} data-answered={isQuestionAnswered(question)}><span aria-hidden="true"/>{currentAnswerStatus}</span></div>
        {!questionMedia.ready && <div role="status" className="mb-4 p-4 bg-indigo-50 text-indigo-800 rounded-xl">
          {questionMedia.failed ? (isEn ? 'An image could not load. Retry before continuing.' : 'تعذر تحميل إحدى الصور. أعد المحاولة قبل المتابعة.') : (isEn ? 'Preparing question images… Timer paused.' : 'جاري تجهيز صور السؤال… الوقت متوقف أثناء التحميل.')}
          {questionMedia.failed && <button type="button" onClick={questionMedia.retry} className="underline ms-3">{isEn ? 'Retry' : 'إعادة المحاولة'}</button>}
        </div>}
        <div ref={questionWorkspaceRef} aria-busy={!questionMedia.ready} className={`exam-question-media ${styles.questionCard}`} data-exam-question>
          <div className={styles.questionBody}>
            {(() => {
              const legacyHint = question.sections?.find((s: any) => s.type === 'HINT');
              const legacyHintContent = (isEn && legacyHint?.contentEn) ? legacyHint.contentEn : (legacyHint?.content || legacyHint?.contentEn || '');
              const activeHint = (isEn && question.hintEn) ? question.hintEn : (question.hint || question.hintEn || legacyHintContent || '');
              const isRevealed = Boolean(revealedHints[question.id]);

              return (
                <>
                  <div className={styles.questionType}><div className={styles.questionTypeLabel}><span><HelpCircle size={21} aria-hidden="true"/></span><strong>{getInExamQuestionTypeLabel(question,activeExamLang)}</strong></div>
                    {activeHint && (
                      <button
                        type="button"
                        onClick={() => setRevealedHints(prev => ({ ...prev, [question.id]: !prev[question.id] }))}
                        className={styles.hintButton}
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{isRevealed ? (isEn ? 'Hide Hint' : 'إخفاء التلميح') : (isEn ? 'Show Hint' : 'إظهار التلميح')}</span>
                      </button>
                    )}
                  </div>

                  {activeHint && isRevealed && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-sm leading-relaxed animate-in slide-in-from-top-2 duration-200">
                      <HtmlRenderer html={sanitizeHtml(activeHint)} />
                    </div>
                  )}
                </>
              );
            })()}
            <div dir={isEn ? 'ltr' : 'rtl'}>
              <HtmlRenderer 
                imageLoading="eager"
                html={sanitizeHtml((isEn && question.textEn) ? question.textEn : (question.text || question.textEn || ''))}
                tag="h2"
                className={styles.questionText}
              />
            </div>
            {question.imageUrl && (
              <Image
                src={resolveMediaUrl(question.imageUrl)}
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 700px"
                alt="Question"
                width={700}
                height={400}
                className="max-w-full h-auto rounded-2xl mb-8 border border-slate-200 shadow-sm mx-auto object-contain"
                unoptimized={shouldSkipImageOptimization(resolveMediaUrl(question.imageUrl))}
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
                          <label htmlFor="exam-free-answer" className="block text-sm font-black text-slate-700">
                            {isEn ? 'Enter your answer here (Student-Produced Response / Numeric):' : 'اكتب إجابتك هنا (إجابة حرة / رقمية):'}
                          </label>
                          <input
                            type="text"
                            id="exam-free-answer"
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
                    const hasLongChoices = choices.some((opt: string) => {
                      const clean = cleanOptionText(opt).replace(/<[^>]+>/g, '').trim();
                      return clean.length > 25 || clean.includes('\\') || clean.includes('$') || clean.includes('=') || clean.includes('^') || opt.includes('<img');
                    });

                    return (
                      <div className={`grid gap-4 ${hasLongChoices ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
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
                            <ExamOptionButton
                              key={i}
                              option={option}
                              index={i}
                              isSelected={Boolean(isSelected)}
                              isOptionCorrectInPreview={Boolean(isOptionCorrectInPreview)}
                              showPreviewAnswers={showPreviewAnswers}
                              isPreviewMode={isPreviewMode}
                              isMultiSelect={question.type === "MULTI_SELECT"}
                              activeExamLang={activeExamLang}
                              isEn={isEn}
                              onSelect={handleSelectAnswer}
                            />
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
                        aria-pressed={isSelected}
                        onClick={() => handleSelectAnswer(option.value)}
                        className={`${styles.binaryChoice} flex-1 py-6 rounded-2xl border-2 font-bold text-xl transition-all ${
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
                  {question.sections.filter((s: any) => s.type !== 'EXPLANATION').map((sec: any, sIdx: number) => {
                    const SECTION_STYLE_PRESETS = getSectionStylePresets(isEn);
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

        <div className={styles.navigation} aria-label={isEn?'Question actions':'إجراءات السؤال'}><button type="button" className={styles.previous} disabled={currentQuestion===0} onClick={()=>setCurrentQuestion(currentQuestion-1)}>{isEn?<ChevronLeft size={16}/>:<ChevronRight size={16}/>} {isEn?'Previous':'السؤال السابق'}</button><button type="button" className={styles.review} data-flagged={isCurrentQuestionFlagged} aria-pressed={isCurrentQuestionFlagged} onClick={()=>setReviewFlags(currentFlags=>toggleReviewFlag(currentFlags,String(question.id||'')))}><Flag size={15} aria-hidden="true"/>{isEn?'Mark for Review':'وضع علامة للمراجعة'}</button>{currentQuestion===examQuestions.length-1?<button type="button" className={styles.submit} disabled={submitting} onClick={()=>setShowSubmitModal(true)}>{submitting?(isEn?'Submitting...':'جاري الإرسال...'):(isEn?'Submit Final Exam':'تسليم الامتحان النهائي')}<Send size={16}/></button>:<button type="button" className={styles.next} onClick={()=>setCurrentQuestion(currentQuestion+1)}>{isEn?'Next':'السؤال التالي'}{isEn?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</button>}</div>
        </main>
      </div>
    </div>
  );
}
