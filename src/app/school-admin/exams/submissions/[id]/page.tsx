"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  CheckCircle2, XCircle, ChevronRight, LayoutDashboard, 
  RefreshCw, Award, Target, Clock, User, Mail, 
  ArrowRight, FileText, BarChart3
} from "lucide-react";
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";

export default function SchoolAdminSubmissionDetailsPage() {
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
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/exams/submissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSubmission(data);
      } else {
        showToast(data.error || "خطأ في تحميل النتيجة", "error");
        router.push("/school-admin/reports");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-xl text-slate-400 animate-pulse text-right rtl" dir="rtl">جاري جلب تفاصيل إجابة الطالب...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isPassed = submission.percentage >= (submission.exam.passingScore || 50);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 rtl pb-20" dir="rtl">
        
        {/* Header with Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <ArrowRight className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800">تقرير إجابة الطالب</h1>
              <p className="text-slate-500 font-medium">مراجعة تفصيلية لأداء الطالب في الامتحان.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm ${isPassed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {isPassed ? "حالة الطالب: ناجح" : "حالة الطالب: راسب"}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Student Info & Summary */}
          <div className="lg:col-span-1 space-y-8">
            {/* Student Card */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black mb-6 shadow-xl shadow-indigo-100">
                  {submission.user.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{submission.user.name}</h3>
                <p className="text-slate-400 font-bold mb-6 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {submission.user.username}
                </p>
                
                <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">النتيجة</p>
                      <p className="text-xl font-black text-slate-800">{Math.round(submission.percentage)}%</p>
                   </div>
                   <div className="text-right border-r border-slate-50 pr-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الدرجة</p>
                      <p className="text-xl font-black text-slate-800">{submission.totalScore} / {submission.exam.questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0)}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Exam Summary Card */}
            <div className="bg-slate-900 text-white p-8 rounded-[35px] shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
               <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-tr-[100px] -ml-10 -mb-10"></div>
               <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">تفاصيل الامتحان</h4>
               <h3 className="text-2xl font-black mb-6 leading-tight">{submission.exam.title}</h3>
               
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/60">
                     <FileText className="w-5 h-5" />
                     <span className="font-bold text-sm">{submission.exam.type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                     <BarChart3 className="w-5 h-5" />
                     <span className="font-bold text-sm">عدد الأسئلة: {submission.exam.questions.length}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                     <Clock className="w-5 h-5" />
                     <span className="font-bold text-sm">وقت التسليم: {new Date(submission.createdAt).toLocaleString('ar-EG')}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column: Detailed Answers */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2 mb-2">
               <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <RefreshCw className="w-5 h-5" />
                 </div>
                 مراجعة الإجابات
               </h3>
            </div>

            {submission.answers.map((answer: any, index: number) => (
              <div 
                key={index}
                className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden group hover:border-indigo-200 transition-all"
              >
                <div className="p-8 md:p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                          {answer.question.skill || "Skill"}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 leading-none">
                          مستوى: {answer.question.level || "Medium"}
                        </span>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 ${answer.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {answer.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      {answer.isCorrect ? `+${answer.question.points} درجة` : "خطأ"}
                    </div>
                  </div>

                  <h4 className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">{answer.question.text}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {(typeof answer.question.options === 'string' ? JSON.parse(answer.question.options) : answer.question.options).map((opt: string, oIdx: number) => {
                      const isCorrectOption = opt === answer.question.correctAnswer;
                      const isSelectedOption = opt === answer.selectedAnswer;
                      
                      let bgClass = "bg-slate-50 border-transparent";
                      let textClass = "text-slate-600";
                      let icon = null;

                      if (isCorrectOption) {
                        bgClass = "bg-emerald-50 border-emerald-500 shadow-sm";
                        textClass = "text-emerald-700";
                        icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
                      } else if (isSelectedOption && !isCorrectOption) {
                        bgClass = "bg-rose-50 border-rose-500 shadow-sm";
                        textClass = "text-rose-700";
                        icon = <XCircle className="w-5 h-5 text-rose-500" />;
                      }

                      return (
                        <div key={oIdx} className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${bgClass}`}>
                          <span className={`font-bold ${textClass}`}>{opt}</span>
                          {icon}
                        </div>
                      );
                    })}
                  </div>

                  {answer.question.explanation && (
                    <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 mt-4">
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">تفسير الإجابة</p>
                       <p className="text-indigo-900 font-medium text-sm leading-relaxed">{answer.question.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
