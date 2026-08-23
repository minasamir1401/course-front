"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { Clock, ChevronRight, ChevronLeft, Send, AlertCircle, HelpCircle, Lock, Play, Calendar, ShieldCheck, CheckCircle2, Target, Info, Sparkles, BookOpen, MessageSquare, Star, ListOrdered, Award, TrendingUp, Flag } from 'lucide-react';
import { useNotification } from "@/context/NotificationContext";
import VideoPlayer from "@/components/VideoPlayer";
import HtmlRenderer from "@/components/HtmlRenderer";
import Watermark from "@/components/Watermark";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";
import { ItemSectionsBubbles, MetadataModalButton } from '@/components/LessonSubComponents';
import { InteractiveTag } from '@/components/InteractiveTag';
import dynamic from 'next/dynamic';
import { getAnswerStatusLabel, getInExamQuestionTypeLabel, toggleReviewFlag } from '@/lib/takeExamUi';

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



// Helper: extract choices array from options (handles both array and JSON object formats)
const parseQuestionChoices = (options: any): string[] => {
  if (!options) return [];
  // If it's already an array, return it
  if (Array.isArray(options)) return options;
  // If it's a string, try to parse it
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) return parsed;
      // Handle {choices: [...]} format
      if (parsed && Array.isArray(parsed.choices)) return parsed.choices;
    } catch {}
  }
  // If it's an object with choices property
  if (typeof options === 'object' && Array.isArray(options.choices)) {
    return options.choices;
  }
  return [];
};

function TakeExamPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';
  const subExamId = searchParams.get('subExamId');
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
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPreviewAnswers, setShowPreviewAnswers] = useState(false);
  const [reviewFlags, setReviewFlags] = useState<string[]>([]);
  const hasAutoSubmitted = React.useRef(false);
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
    } catch (e) {
      setWatermarkText("KLEVRO");
    }
  }, []);

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

  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (!isPreviewMode) localStorage.setItem(`exam_${id}_${subExamId || "root"}_time`, newTime.toString());
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (started && timeLeft <= 0 && exam && !loading && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      handleSubmit();
    }
  }, [timeLeft, exam, loading, started, isPreviewMode, id]);

  const fetchExam = async () => {
    try {
      const token = isPreviewMode
        ? (localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token") || localStorage.getItem("lms_token"))
        : (localStorage.getItem("lms_token") || localStorage.getItem("school_admin_token") || localStorage.getItem("super_admin_token"));
      const res = await fetch(`${API_URL}/exams/${id}${subExamId ? `?subExamId=${encodeURIComponent(subExamId)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "خطأ في تحميل الامتحان", "error");
        router.back();
        return;
      }

      // Check attempts (skip in preview mode)
      if (!isPreviewMode) {
        const checkRes = await fetch(`${API_URL}/exams/${id}/check?subExamId=${subExamId || ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (!checkData.canTakeAgain) {
            showToast("لقد استنفدت عدد المحاولات المسموح بها.", "error");
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
      let subExamDuration = data.duration;
      if (subExamId) {
        filteredQuestions = filteredQuestions.filter((q: any) => q.subExamId === subExamId);
        // Find subExam duration if possible
        const subExam = data.modules?.flatMap((m: any) => m.subExams || []).find((se: any) => se.id === subExamId);
        if (subExam && subExam.duration) {
          subExamDuration = subExam.duration;
        }
        data.selectedSubExam = subExam;
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
          correctAnswers: q.type === 'MULTI_SELECT' ? correctAnswers : [],
          sections: parsedSections
        };
      });
      data.duration = subExamDuration || data.duration; // Override duration for the timer


      setExam({
        ...data,
        questions: mappedQuestions
      });
      // Time is set in the separate useEffect now
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    if (!isPreviewMode) {
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
    }
    if (exam.password && passwordInput !== exam.password) {
      showToast(language === 'ar' ? "كلمة السر غير صحيحة" : "Incorrect password", "error");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setStarted(true);
      setIsVerifying(false);
    }, 800);
  };

  const handleSelectAnswer = (selectedAnswer: string) => {
    const newAnswers = [...answers];
    const question = exam.questions[currentQuestion];
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
      localStorage.setItem(`exam_${id}_${subExamId || "root"}_answers`, JSON.stringify(newAnswers));
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      const token = isPreviewMode
        ? (localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token") || localStorage.getItem("lms_token"))
        : (localStorage.getItem("lms_token") || localStorage.getItem("school_admin_token") || localStorage.getItem("super_admin_token"));
      
      const timeTakenInSeconds = exam.duration * 60 - timeLeft;
      const res = await fetch(`${API_URL}/exams/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers, totalTime: timeTakenInSeconds, subExamId }),
      });
      const data = await res.json();
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
        showToast(data.error || "خطأ في تقديم الامتحان", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("خطأ في الاتصال بالخادم", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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

  // ── Gatekeeper Screen ─────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className={`min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl w-full bg-white rounded-[50px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-center relative overflow-hidden shadow-2xl shadow-indigo-200/50">
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <ShieldCheck className="w-10 h-10 text-amber-300" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{exam.title}</h1>
              <p className="text-indigo-100 font-medium">{language === 'ar' ? 'يرجى قراءة التعليمات بعناية قبل البدء.' : 'Please read the instructions carefully before starting.'}</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/20 blur-[100px] -mr-32 -mt-32"></div>
          </div>

          {/* Body */}
          <div className="p-12 space-y-10">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'المدة' : 'Duration'}</p>
                <p className="font-black text-slate-700">{exam.duration} {language === 'ar' ? 'دقيقة' : 'Minutes'}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <Play className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'الأسئلة' : 'Questions'}</p>
                <p className="font-black text-slate-700">{exam.questions?.length || 0} {language === 'ar' ? 'سؤال' : 'Questions'}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center col-span-2 md:col-span-1">
                <Calendar className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'النوع' : 'Type'}</p>
                <p className="font-black text-slate-700">{exam.type === 'Quiz' ? 'Exam' : (exam.type || "Exam")}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <HelpCircle className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'المستوى' : 'Level'}</p>
                <p className="font-black text-slate-700">{exam.level === 'Easy' || exam.level === 'Foundation' ? (language === 'ar' ? 'تأسيسي' : 'Foundation') : exam.level === 'Medium' || exam.level === 'On Level' || exam.level === 'On_Level' ? (language === 'ar' ? 'On_Level' : 'On_Level') : (language === 'ar' ? 'متقدم' : 'Advanced')}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <Play className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{language === 'ar' ? 'المهارة' : 'Skill'}</p>
                <p className="font-black text-slate-700">{exam.skill || (language === 'ar' ? 'عام' : 'General')}</p>
              </div>
            </div>

            {/* Password Field */}
            {exam.password && (
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {language === 'ar' ? 'كلمة سر فتح الامتحان' : 'Exam Password'}
                </label>
                <input
                  type="password"
                  placeholder={language === 'ar' ? "أدخل كلمة السر هنا..." : "Enter password here..."}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-xl font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartExam()}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 pt-2">
              <button
                onClick={() => router.back()}
                className="flex-1 py-5 rounded-2xl bg-slate-50 text-slate-500 font-black hover:bg-slate-100 transition-all"
              >
                {language === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <button
                onClick={handleStartExam}
                disabled={isVerifying}
                className="flex-[2] py-5 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {isVerifying ? (language === 'ar' ? "جاري التحقق..." : "Verifying...") : (language === 'ar' ? "ابدأ الامتحان الآن" : "Start Exam Now")}
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam Taking Screen ────────────────────────────────────────────────────
  const question = exam.questions[currentQuestion];
  const answerObj = answers.find((a) => a.questionId === question.id);
  const selectedAnswer = answerObj?.selectedAnswer;
  const selectedAnswers = answerObj?.selectedAnswers || [];
  const isCurrentQuestionFlagged = reviewFlags.includes(String(question.id || ''));
  const currentQuestionSection = question.section || exam.selectedSubExam?.section || exam.section || '';
  const currentAnswerStatus = getAnswerStatusLabel(question, answerObj, language);
  const flaggedQuestionsCount = reviewFlags.length;
  
  const questionsThatRequireAnswer = exam.questions.filter((q: any) => q.type !== "TEXT");
  const answeredQuestionsCount = answers.filter(a => {
    const q = exam.questions.find((quest: any) => quest.id === a.questionId);
    return q && q.type !== "TEXT" && (a.selectedAnswer || (Array.isArray(a.selectedAnswers) && a.selectedAnswers.length > 0));
  }).length;
  const unansweredCount = Math.max(0, questionsThatRequireAnswer.length - answeredQuestionsCount);

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Watermark text={watermarkText} />

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
              {unansweredCount > 0 ? (language === 'ar' ? "تنبيه: أسئلة لم تحل" : "Warning: Unanswered Questions") : (language === 'ar' ? "تسليم الامتحان؟" : "Submit Exam?")}
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              {unansweredCount > 0 
                ? (language === 'ar' ? `لقد أجبت على ${answers.length} من أصل ${exam.questions.length} سؤال. هناك ${unansweredCount} سؤال لم يتم حلهم بعد. هل أنت متأكد من التسليم؟` : `You have answered ${answers.length} out of ${exam.questions.length} questions. There are ${unansweredCount} unanswered questions. Are you sure you want to submit?`)
                : (language === 'ar' ? "أنت على وشك إنهاء الامتحان وتسليم إجاباتك. يرجى التأكد من مراجعة كافة الأسئلة قبل التأكيد." : "You are about to finish the exam and submit your answers. Please review all questions before confirming.")}
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSubmit}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all hover:scale-105 ${unansweredCount > 0 ? 'bg-amber-600 shadow-amber-100 hover:bg-amber-700 text-black' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700 text-white'}`}
              >
                {language === 'ar' ? "نعم، قم بالتسليم الآن" : "Yes, Submit Now"}
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all"
              >
                {language === 'ar' ? "الرجوع للمراجعة" : "Go Back to Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-amber-500 text-white text-center py-2.5 px-6 text-sm font-black uppercase tracking-widest shadow-md">
          👁️ {language === 'ar' ? "وضع المعاينة – البيانات لن تُحفظ" : "Preview Mode – Data will NOT be saved"}
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-800 line-clamp-1">{exam.title}</h1>
            <div className="flex gap-2 mt-0.5">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{exam.type === 'Quiz' ? 'Exam' : (exam.type || 'Exam')}</span>
              {currentQuestionSection && (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {language === 'ar' ? 'القسم: ' : 'Section: '} {currentQuestionSection}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                currentAnswerStatus === (language === 'ar' ? 'تمت الإجابة' : 'Answered')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {language === 'ar' ? 'الحالة: ' : 'Answer Status: '} {currentAnswerStatus}
              </span>
              {flaggedQuestionsCount > 0 && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  {language === 'ar' ? 'للمراجعة: ' : 'Flagged: '} {flaggedQuestionsCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${
                timeLeft < 300 ? "bg-red-100 text-red-600 animate-pulse" : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {language === 'ar' ? 'السؤال' : 'Question'} {currentQuestion + 1} {language === 'ar' ? 'من' : 'of'} {exam.questions.length}
              </span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                currentAnswerStatus === (language === 'ar' ? 'تمت الإجابة' : 'Answered')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {language === 'ar' ? 'الحالة: ' : 'Answer Status: '} {currentAnswerStatus}
              </span>
            </div>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {Math.round(((currentQuestion + 1) / exam.questions.length) * 100)}% {language === 'ar' ? 'اكتمل' : 'Completed'}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${((currentQuestion + 1) / exam.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
          <div className="p-8">
            {question.sections && question.sections.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end mb-4">
                <ItemSectionsBubbles item={{sections: question.sections}} isSubmitted={false} language={language} filterType="HINT_ONLY" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <HelpCircle className="w-6 h-6" />
              </div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm shadow-indigo-200">
                {getInExamQuestionTypeLabel(question, language)}
              </span>
            </div>
            </div>
            <HtmlRenderer 
              html={sanitizeHtml(question.text)}
              tag="h2"
              className="text-2xl font-bold text-slate-800 mb-8 leading-relaxed animate-in fade-in duration-500"
            />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parseQuestionChoices(question.options).filter((opt: string) => opt && opt.trim() !== "").map((option: string, i: number) => {
                    const isSelected = question.type === "MULTI_SELECT" 
                      ? selectedAnswers.includes(option)
                      : selectedAnswer === option;

                    return (
                      <button
                        key={i}
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                        onClick={() => handleSelectAnswer(option)}
                        className={`w-full text-start p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 group ${
                          showPreviewAnswers && isPreviewMode && (question.type === "MULTI_SELECT" ? Array.isArray(question.correctAnswers) && question.correctAnswers.includes(option) : question.correctAnswer === option)
                            ? "bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100"
                            : showPreviewAnswers && isPreviewMode && isSelected && !(question.type === "MULTI_SELECT" ? Array.isArray(question.correctAnswers) && question.correctAnswers.includes(option) : question.correctAnswer === option)
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
                            {getOptionLetter(i, language)}
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
                ) : question.type === "TRUE_FALSE" ? (
                  <div className="flex gap-4">
                    {[
                      { value: "True", label: language === 'ar' ? "صحيح" : "True" },
                      { value: "False", label: language === 'ar' ? "خطأ" : "False" }
                    ].map((option) => {
                      const normCorrect = question.correctAnswer === "صحيح" ? "True" : question.correctAnswer === "خطأ" ? "False" : question.correctAnswer;
                      const isCorrect = normCorrect === option.value;
                      return (
                      <button
                        key={option.value}
                        onClick={() => handleSelectAnswer(option.value)}
                        className={`flex-1 py-6 rounded-2xl border-2 font-bold text-xl transition-all ${
                          showPreviewAnswers && isPreviewMode && isCorrect
                            ? "bg-emerald-50 border-emerald-600 text-emerald-900"
                            : showPreviewAnswers && isPreviewMode && selectedAnswer === option.value && !isCorrect
                            ? "bg-rose-50 border-rose-600 text-rose-900"
                            : selectedAnswer === option.value
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
                      key={question.id}
                      question={{
                        ...question,
                        type: question.label || question.type,
                      }}
                      value={selectedAnswer || ''}
                      onChange={(val: string) => handleSelectAnswer(val)}
                      language={language}
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
                    return (
                      <div key={sIdx} className={`p-6 rounded-2xl border-2 ${preset.bg} ${preset.border}`}>
                        <div className={`flex items-center gap-2 mb-3 font-black ${preset.text}`}>
                          <Icon className="w-5 h-5 animate-bounce-slow shrink-0" />
                          <span>{preset.label}</span>
                        </div>
                        <HtmlRenderer html={sanitizeHtml(sec.content)} className={`prose prose-sm max-w-none ${preset.text}`} />
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
            {language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {language === 'ar' ? 'السؤال السابق' : 'Previous'}
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
            {language === 'ar' ? 'وضع علامة للمراجعة' : 'Mark for Review'}
          </button>

          <div className="flex-1 flex justify-end">
            {currentQuestion === exam.questions.length - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
              >
                {submitting ? (language === 'ar' ? "جاري الإرسال..." : "Submitting...") : (language === 'ar' ? "تسليم الامتحان النهائي" : "Submit Final Exam")}
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                {language === 'ar' ? 'السؤال التالي' : 'Next'}
                {language === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
