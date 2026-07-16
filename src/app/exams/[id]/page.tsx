"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { Clock, ChevronRight, ChevronLeft, Send, AlertCircle, HelpCircle, Lock, Play, Calendar, ShieldCheck, CheckCircle2, Target, Info, Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { useNotification } from "@/context/NotificationContext";
import VideoPlayer from "@/components/VideoPlayer";
import HtmlRenderer from "@/components/HtmlRenderer";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";

export default function TakeExamPage() {
  const { id } = useParams();
  const router = useRouter();
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

  useEffect(() => {
    fetchExam();
  }, [id]);

  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (started && timeLeft === 0 && exam && !loading) {
      handleSubmit();
    }
  }, [timeLeft, exam, loading, started]);

  const fetchExam = async () => {
    try {
      const token =
        localStorage.getItem("lms_token") ||
        localStorage.getItem("school_admin_token") ||
        localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "خطأ في تحميل الامتحان", "error");
        router.back();
        return;
      }

      // Check attempts
      const checkRes = await fetch(`${API_URL}/exams/${id}/check`, {
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

      const mappedQuestions = data.questions?.map((q: any) => {
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
        return {
          ...q,
          sections: parsedSections
        };
      }) || [];

      setExam({
        ...data,
        questions: mappedQuestions
      });
      setTimeLeft(data.duration * 60);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    const now = new Date();
    if (exam.startDate && now < new Date(exam.startDate)) {
      showToast("لم يحن موعد بدأ الامتحان بعد", "error");
      return;
    }
    if (exam.endDate && now > new Date(exam.endDate)) {
      showToast("انتهى موعد هذا الامتحان", "error");
      return;
    }
    if (exam.password && passwordInput !== exam.password) {
      showToast("كلمة السر غير صحيحة", "error");
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
        newAnswers[existingIndex].selectedAnswer = currentSelected.join(",");
      } else {
        newAnswers.push({ questionId, selectedAnswers: [selectedAnswer], selectedAnswer: selectedAnswer });
      }
    } else {
      if (existingIndex > -1) {
        newAnswers[existingIndex].selectedAnswer = selectedAnswer;
      } else {
        newAnswers.push({ questionId, selectedAnswer });
      }
    }
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      const token =
        localStorage.getItem("lms_token") ||
        localStorage.getItem("school_admin_token") ||
        localStorage.getItem("super_admin_token");
      const timeTakenInSeconds = exam.duration * 60 - timeLeft;
      const res = await fetch(`${API_URL}/exams/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers, totalTime: timeTakenInSeconds }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/exams/result/${data.submissionId}`);
      } else {
        showToast(data.error || "خطأ في تقديم الامتحان", "error");
      }
    } catch (error) {
      console.error(error);
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
        <p className="font-black text-xl text-slate-400 animate-pulse">جاري تحضير الامتحان...</p>
      </div>
    );
  }

  if (!exam) return null; // Prevent crash if exam failed to load but loading is finished (redirecting)

  // ── Gatekeeper Screen ─────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 rtl" dir="rtl">
        <div className="max-w-2xl w-full bg-white rounded-[50px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-center relative overflow-hidden shadow-2xl shadow-indigo-200/50">
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <ShieldCheck className="w-10 h-10 text-amber-300" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{exam.title}</h1>
              <p className="text-indigo-100 font-medium">يرجى قراءة التعليمات بعناية قبل البدء.</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/20 blur-[100px] -mr-32 -mt-32"></div>
          </div>

          {/* Body */}
          <div className="p-12 space-y-10">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المدة</p>
                <p className="font-black text-slate-700">{exam.duration} دقيقة</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <Play className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الأسئلة</p>
                <p className="font-black text-slate-700">{exam.questions?.length || 0} سؤال</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center col-span-2 md:col-span-1">
                <Calendar className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">النوع</p>
                <p className="font-black text-slate-700">{exam.type || "Exam"}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <HelpCircle className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المستوى</p>
                <p className="font-black text-slate-700">{exam.level === 'Easy' || exam.level === 'Foundation' ? 'تأسيسي' : exam.level === 'Medium' || exam.level === 'On Level' ? 'في المستوى' : 'متقدم'}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <Play className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المهارة</p>
                <p className="font-black text-slate-700">{exam.skill || 'عام'}</p>
              </div>
            </div>

            {/* Password Field */}
            {exam.password && (
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  كلمة سر فتح الامتحان
                </label>
                <input
                  type="password"
                  placeholder="أدخل كلمة السر هنا..."
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
                رجوع
              </button>
              <button
                onClick={handleStartExam}
                disabled={isVerifying}
                className="flex-[2] py-5 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {isVerifying ? "جاري التحقق..." : "ابدأ الامتحان الآن"}
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
  
  const questionsThatRequireAnswer = exam.questions.filter((q: any) => q.type !== "TEXT");
  const answeredQuestionsCount = answers.filter(a => {
    const q = exam.questions.find((quest: any) => quest.id === a.questionId);
    return q && q.type !== "TEXT" && (a.selectedAnswer || (Array.isArray(a.selectedAnswers) && a.selectedAnswers.length > 0));
  }).length;
  const unansweredCount = Math.max(0, questionsThatRequireAnswer.length - answeredQuestionsCount);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col rtl" dir="rtl">
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
              {unansweredCount > 0 ? "تنبيه: أسئلة لم تحل" : "تسليم الامتحان؟"}
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              {unansweredCount > 0 
                ? `لقد أجبت على ${answers.length} من أصل ${exam.questions.length} سؤال. هناك ${unansweredCount} سؤال لم يتم حلهم بعد. هل أنت متأكد من التسليم؟`
                : "أنت على وشك إنهاء الامتحان وتسليم إجاباتك. يرجى التأكد من مراجعة كافة الأسئلة قبل التأكيد."}
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSubmit}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all hover:scale-105 ${unansweredCount > 0 ? 'bg-amber-600 shadow-amber-100 hover:bg-amber-700 text-black' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700 text-white'}`}
              >
                نعم، قم بالتسليم الآن
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all"
              >
                الرجوع للمراجعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-800 line-clamp-1">{exam.title}</h1>
            <div className="flex gap-2 mt-0.5">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{exam.type}</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{exam.skill}</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                {exam.level === 'Easy' || exam.level === 'Foundation' ? 'تأسيسي' : exam.level === 'Medium' || exam.level === 'On Level' ? 'في المستوى' : 'متقدم'}
              </span>
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
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100 flex items-center gap-2"
            >
              {submitting ? "جاري الإرسال..." : "تسليم الإجابات"}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              السؤال {currentQuestion + 1} من {exam.questions.length}
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {Math.round(((currentQuestion + 1) / exam.questions.length) * 100)}% اكتمل
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <HelpCircle className="w-6 h-6" />
              </div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {question.type === 'MCQ' ? 'اختيار من متعدد' : question.type === 'MULTI_SELECT' ? 'اختيار متعدد' : question.type === 'TEXT' ? 'شريحة شرح' : 'صح وخطأ'}
              </span>
              {question.type !== 'TEXT' && (
                <>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {question.skill} | {question.level === 'Easy' || question.level === 'Foundation' ? 'تأسيسي' : question.level === 'Medium' || question.level === 'On Level' ? 'في المستوى' : 'متقدم'}
                  </span>
                  {question.dok && (
                    <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {language === 'ar' ? `عمق المعرفة: ${question.dok}` : `DOK: ${question.dok}`}
                    </span>
                  )}
                  {question.standard && (
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      المعيار: {question.standard}
                    </span>
                  )}
                  {question.indicator && (
                    <span className="px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      المؤشر: {question.indicator}
                    </span>
                  )}
                  {question.learningOutcome && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      <Target className="w-3 h-3" />
                      الناتج: {question.learningOutcome}
                    </span>
                  )}
                </>
              )}
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
              <div className="flex flex-col gap-4">
                {question.type === "MCQ" || question.type === "MULTI_SELECT" ? (
                  question.options.filter((opt: string) => opt && opt.trim() !== "").map((option: string, i: number) => {
                    const isSelected = question.type === "MULTI_SELECT" 
                      ? selectedAnswers.includes(option)
                      : selectedAnswer === option;

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectAnswer(option)}
                        className={`w-full text-right p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                          isSelected
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
                  })
                ) : (
                  <div className="flex gap-4">
                    {[
                      { value: "True", label: "True", matches: ["True", "true", "صحيح", "صح", "صواب", "1"] },
                      { value: "False", label: "False", matches: ["False", "false", "خطأ", "خاطئ", "غير صحيح", "0"] }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelectAnswer(option.value)}
                        className={`flex-1 py-6 rounded-2xl border-2 font-bold text-xl transition-all ${
                          option.matches.includes(String(selectedAnswer || "").trim())
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900"
                            : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
        <div className="flex justify-between items-center">
          <button
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            className="flex items-center gap-2 font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
            السؤال السابق
          </button>
          {currentQuestion === exam.questions.length - 1 ? (
            <div className="flex items-center gap-2 text-green-600 font-bold">
              <AlertCircle className="w-5 h-5" />
              لقد وصلت لآخر سؤال
            </div>
          ) : (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              السؤال التالي
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
