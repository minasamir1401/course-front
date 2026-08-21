"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FileText, Clock, AlertCircle, CheckCircle2, Calendar, Lock, Eye, EyeOff, Hourglass, CalendarClock, Sparkles, Target, Award, PlayCircle, Timer, ArrowLeft, ArrowRight, ChevronRight, Layers, Flame, Zap, Trophy, Medal, Map, ArrowDown, ChevronDown, Check } from 'lucide-react';
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExamDetailsPage() {
  const { t, language } = useLanguage();
  const { id } = useParams();
  const router = useRouter();
  
  const [activeModule, setActiveModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("lms_token") ||
        localStorage.getItem("school_admin_token") ||
        localStorage.getItem("super_admin_token");

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/exams/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setActiveModule(await res.json());
      } else {
        setError("Failed to load exam details");
      }
    } catch (e) {
      setError(t('exams.connError') || "Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam: any, userSubs: any[]) => {
    const now = new Date();
    const start = exam.startDate ? new Date(exam.startDate) : null;
    const end = exam.endDate ? new Date(exam.endDate) : null;

    if (start && now < start) return { label: language === 'ar' ? "قريباً" : "Upcoming", color: "bg-amber-100 text-amber-700", icon: CalendarClock, type: "UPCOMING" };
    if (end && now > end) return { label: language === 'ar' ? "منتهي" : "Expired", color: "bg-slate-100 text-slate-500", icon: Hourglass, type: "EXPIRED" };

    if (exam.attemptsAllowed && userSubs.length >= exam.attemptsAllowed) {
      return { label: language === 'ar' ? "مكتمل" : "Completed", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2, type: "COMPLETED" };
    }

    return { label: language === 'ar' ? "متاح الآن" : "Available Now", color: "bg-green-100 text-green-700", icon: PlayCircle, type: "AVAILABLE" };
  };

  // We are not fetching portfolio here for simplicity, but we could.
  const getSubmissionsForExam = (examId: string): any[] => {
    return []; // Placeholder for student submissions in details page
  };

  return (
    <DashboardLayout>
      <div className={`w-full max-w-[1000px] mx-auto space-y-8 pb-24 px-4 sm:px-6 md:px-8 bg-slate-50/50 min-h-screen overflow-x-hidden ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>
        
        <div className="pt-8 flex items-center gap-4">
            <button onClick={() => router.push('/exams')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                <ArrowRight className="w-5 h-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{language === 'ar' ? 'تفاصيل الامتحان' : 'Exam Details'}</h1>
        </div>

        {loading ? (
            <div className="py-24 text-center flex flex-col items-center gap-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
            </div>
        ) : error ? (
            <div className="py-24 text-center bg-rose-50 rounded-[32px] border border-rose-100 shadow-sm">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <p className="text-rose-600 font-black text-xl">{error}</p>
            </div>
        ) : !activeModule ? (
            <div className="py-24 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-slate-600 font-black text-xl">{language === 'ar' ? 'لم يتم العثور على الامتحان' : 'Exam not found'}</p>
            </div>
        ) : (
            <div className="bg-white rounded-[40px] border-2 border-indigo-100 shadow-xl shadow-indigo-100/50 p-6 md:p-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{activeModule.title}</h3>
                    <p className="text-slate-500 font-bold">{activeModule.modules?.length || 0} {language === 'ar' ? 'أقسام متاحة' : 'Available Sections'}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {activeModule.modules?.map((section: any, idx: number) => (
                    <div key={section.id} className="relative pl-0 pr-8 md:pr-12">
                      <div className="absolute top-0 right-0 w-8 md:w-12 h-full flex flex-col items-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 border-2 border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center font-black text-sm z-10 shadow-sm">
                          {idx + 1}
                        </div>
                        {idx !== (activeModule.modules.length - 1) && (
                          <div className="w-1 flex-1 bg-indigo-50 my-2 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mr-2 md:mr-4">
                        <h4 className="text-lg md:text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                          <Target className="w-5 h-5 text-indigo-500" />
                          {section.title}
                        </h4>
                        
                        <div className="space-y-4">
                          {section.subExams?.map((exam: any) => {
                            const userSubs = getSubmissionsForExam(exam.id);
                            const status = getExamStatus(exam, userSubs);
                            
                            return (
                              <div key={exam.id} className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-center group">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${status.type === 'AVAILABLE' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 text-center md:text-right">
                                  <h5 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">{exam.title}</h5>
                                  <div className="flex items-center justify-center md:justify-start gap-3 text-[11px] font-bold text-slate-500">
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration} {language === 'ar' ? 'دقيقة' : 'Minutes'}</span>
                                    {exam.attemptsAllowed !== 999 && (
                                      <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> {language === 'ar' ? 'مسموح' : 'Allowed'} {exam.attemptsAllowed} {language === 'ar' ? 'محاولات' : 'Attempts'}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-3">
                                  {userSubs.length > 0 && (
                                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black border border-emerald-100 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      {language === 'ar' ? 'تمت المحاولة' : 'Attempted'}
                                    </div>
                                  )}
                                  <Link
                                    href={status.type === 'AVAILABLE' ? `/exams/${activeModule.id}?subExamId=${exam.id}` : `/exams/result/${userSubs[0]?.id || ''}`}
                                    className={`px-6 py-3 rounded-xl font-black text-xs transition-colors flex items-center gap-2 ${status.type === 'AVAILABLE' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  >
                                    {status.type === 'AVAILABLE' ? (language === 'ar' ? 'ابدأ الاختبار' : 'Start Exam') : (language === 'ar' ? 'عرض النتيجة' : 'View Result')}
                                    <ArrowLeft className="w-4 h-4" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                          {/* If no subExams but there are questions directly in the module, show start button */}
                          {(!section.subExams || section.subExams.length === 0) && section.questions && section.questions.length > 0 && (
                            <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-center group">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="flex-1 text-center md:text-right">
                                <h5 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">{section.title}</h5>
                                <div className="flex items-center justify-center md:justify-start gap-3 text-[11px] font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {section.questions.length} {language === 'ar' ? 'سؤال' : 'Questions'}</span>
                                  {activeModule.duration && (
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeModule.duration} {language === 'ar' ? 'دقيقة' : 'Minutes'}</span>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0">
                                <Link
                                  href={`/exams/${activeModule.id}?moduleId=${section.id}`}
                                  className="px-6 py-3 rounded-xl font-black text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors flex items-center gap-2"
                                >
                                  {language === 'ar' ? 'ابدأ الاختبار' : 'Start Exam'}
                                  <ArrowLeft className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          )}
                          {(!section.subExams || section.subExams.length === 0) && (!section.questions || section.questions.length === 0) && (
                            <div className="text-center py-6 text-slate-400 text-sm font-bold bg-white rounded-2xl border border-dashed border-slate-200">
                              {language === 'ar' ? 'لا يوجد اختبارات في هذا القسم' : 'No exams in this section'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
        )}
      </div>
    </DashboardLayout>
  );
}
