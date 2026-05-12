"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, LayoutDashboard, RefreshCw, Award, Target, Clock, MessageCircle, Lock, EyeOff } from "lucide-react";
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";

export default function ExamResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotification();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem("lms_token") || localStorage.getItem("school_admin_token") || localStorage.getItem("super_admin_token");
      if (!token) {
        showToast("يجب تسجيل الدخول أولاً", "error");
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
        showToast(data.error || "خطأ في تحميل النتيجة", "error");
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
        <p className="font-black text-xl text-slate-400 animate-pulse">جاري جلب النتيجة...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
        <XCircle className="w-16 h-16 text-rose-500" />
        <p className="font-black text-xl text-slate-600">فشل في تحميل تفاصيل النتيجة</p>
        <Link href="/exams" className="btn-primary">العودة للامتحانات</Link>
      </div>
    );
  }

  const isAdmin = !!(localStorage.getItem("school_admin_token") || localStorage.getItem("super_admin_token"));
  const isPassed = submission.percentage >= submission.exam.passingScore;
  const visibility = submission.exam.resultVisibility || "SHOW_SCORE"; // Default for safety

  // ── HIDE_ALL STATE (Bypass for Admins) ──────────────────────────────────────────
  if (visibility === "HIDE_ALL" && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 rtl" dir="rtl">
        <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-12 text-center border border-slate-100">
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-100">
            <EyeOff className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4">النتائج محجوبة</h1>
          <p className="text-slate-500 mb-10 leading-relaxed text-lg">
            لقد تم تسليم إجاباتك بنجاح. قام المعلم بإخفاء تفاصيل النتائج والدرجات لهذا الامتحان حالياً. سيتم إخطارك عند إتاحة النتائج.
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl mb-10 text-right border border-slate-100">
            <h4 className="font-black text-slate-700 mb-1">{submission.exam.title}</h4>
            <p className="text-sm text-slate-400">تاريخ التسليم: {new Date(submission.createdAt).toLocaleDateString("ar-EG")}</p>
          </div>
          <Link
            href="/exams"
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            العودة للامتحانات
            <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-20 rtl" dir="rtl">
      {/* Premium Header */}
      <div
        className={`relative pt-16 pb-36 px-6 ${
          isPassed ? "bg-emerald-600" : "bg-rose-600"
        } text-white text-center overflow-hidden`}
      >
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/20 shadow-xl">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 drop-shadow-sm">
            {isPassed ? "تهانينا، لقد نجحت بنجاح!" : "للأسف، لم يحالفك الحظ هذه المرة"}
          </h1>
          <p className="text-white/80 text-lg font-bold">{submission.exam.title}</p>
          <div className="flex justify-center gap-3 mt-4">
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black border border-white/20">
              {submission.exam.skill || 'عام'}
            </span>
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black border border-white/20">
              {submission.exam.level === 'Easy' ? 'سهل' : submission.exam.level === 'Medium' ? 'متوسط' : 'صعب'}
            </span>
          </div>
        </div>

        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20">
        {/* Score Card */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-8 md:p-12 mb-8 border border-slate-100 flex flex-col md:flex-row items-center gap-12">
          <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="86"
                stroke="currentColor"
                strokeWidth="14"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="96"
                cy="96"
                r="86"
                stroke="currentColor"
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={540}
                strokeDashoffset={540 - (540 * submission.percentage) / 100}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${isPassed ? "text-emerald-500" : "text-rose-500"}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black text-slate-800">{Math.round(submission.percentage)}%</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">الدرجة النهائية</span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 gap-5">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">النقاط المحصلة</p>
              <h4 className="text-3xl font-black text-slate-800">
                {submission.totalScore}
                <span className="text-lg font-bold text-slate-300 mx-2">/</span>
                <span className="text-lg font-bold text-slate-400">
                  {submission.exam.questions.reduce((acc: number, q: any) => acc + q.points, 0)}
                </span>
              </h4>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">نتيجة التقييم</p>
              <h4 className={`text-2xl font-black ${isPassed ? "text-emerald-600" : "text-rose-600"}`}>
                {isPassed ? "ناجح" : "راسب"}
              </h4>
            </div>
            <Link
              href="/exams"
              className="col-span-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200"
            >
              <LayoutDashboard className="w-6 h-6" />
              العودة لقائمة الامتحانات
            </Link>
          </div>
        </div>

        {/* Detailed Review - Conditioned by policy (Always visible for Admins) */}
        { (visibility === "SHOW_ANSWERS" || visibility === "SHOW_MARK_ONLY" || visibility === "SHOW_ALL" || isAdmin) ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">مراجعة الإجابات</h3>
              </div>
              <span className="text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200">
                {submission.answers.length} سؤال تم تقييمه
              </span>
            </div>

            {submission.answers.map((answer: any, index: number) => (
              <div
                key={index}
                className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden group hover:border-indigo-200 transition-all"
              >
                <div className="p-8 md:p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">
                          {answer.question.type === 'MCQ' ? 'اختيار من متعدد' : answer.question.type === 'MULTI_SELECT' ? 'اختيار متعدد' : 'صح وخطأ'}
                        </span>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {answer.question.skill || "Skill"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 leading-none">
                            | مستوى: {answer.question.level === 'Easy' ? 'سهل' : answer.question.level === 'Medium' ? 'متوسط' : 'صعب'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 ${
                        answer.isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {answer.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      {answer.isCorrect ? `+${answer.question.points} درجة` : "خطأ"}
                    </div>
                  </div>

                  <div className="mb-4">
                    {answer.question.learningOutcome && (
                      <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 mb-2 w-fit">
                        <Target className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">ناتج التعلم: {answer.question.learningOutcome}</span>
                      </div>
                    )}
                  </div>
                  <h4 
                    className="text-xl font-bold text-slate-800 mb-8 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: answer.question.text }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {(typeof answer.question.options === 'string' ? JSON.parse(answer.question.options) : answer.question.options)
                      .filter((opt: string) => opt && opt.trim() !== "")
                      .map((opt: string, oIdx: number) => {
                        const correctAnswers = answer.question.type === 'MULTI_SELECT' 
                          ? (answer.question.correctAnswer || "").split(",") 
                          : [answer.question.correctAnswer];
                        
                        const selectedAnswers = answer.question.type === 'MULTI_SELECT'
                          ? (answer.selectedAnswer || "").split(",")
                          : [answer.selectedAnswer];

                        const isCorrectOption = correctAnswers.includes(opt);
                        const isSelectedOption = selectedAnswers.includes(opt);
                        
                        let bgClass = "bg-slate-50 border-transparent";
                        let textClass = "text-slate-600";
                        let icon = null;

                        // Logic for showing correctness
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
                            <span className={`font-bold ${textClass}`}>{opt}</span>
                            {icon}
                          </div>
                        );
                    })}
                  </div>

                  {(answer.question.explanation || answer.question.imageUrl) && (
                    <div className="space-y-4">
                      {answer.question.imageUrl && (
                        <img
                          src={answer.question.imageUrl}
                          alt="Question"
                          className="max-w-full rounded-2xl border border-slate-100 shadow-sm"
                        />
                      )}
                      {answer.question.explanation && (
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex gap-5">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 shrink-0">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">
                              شرح وتوضيح الإجابة
                            </p>
                            <div 
                              className="text-slate-600 leading-relaxed font-medium"
                              dangerouslySetInnerHTML={{ __html: answer.question.explanation }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-12 border border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-400 mb-2">مراجعة الأسئلة غير متاحة</h3>
            <p className="text-slate-400">لقد اختار المعلم عرض الدرجة النهائية فقط لهذا الامتحان.</p>
          </div>
        )}
      </div>
    </div>
  );
}
