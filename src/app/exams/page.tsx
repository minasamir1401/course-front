"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText, Clock, AlertCircle, CheckCircle2,
  ChevronRight, ChevronLeft, Calendar, ArrowUpRight, Filter, Search,
  PlayCircle, Timer, Award, Lock, Eye, EyeOff, Hourglass, CalendarClock,
  Sparkles, Target, ArrowLeft
} from "lucide-react";
import Link from "next/link";

import { API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExamsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [exams, setExams] = React.useState<any[]>([]);
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("lms_token") ||
        localStorage.getItem("school_admin_token") ||
        localStorage.getItem("super_admin_token");

      if (!token) {
        setLoading(false);
        return;
      }

      const examsRes = await fetch(`${API_URL}/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(Array.isArray(examsData) ? examsData : []);
      }

      try {
        const statsRes = await fetch(`${API_URL}/student/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setSubmissions(statsData.submissions || []);
        }
      } catch (e) {
        console.warn("Could not fetch student stats, probably an admin user.");
      }

    } catch (e) {
      setError(t('exams.connError'));
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionsForExam = (examId: string) => {
    return submissions.filter(s => s.examId === examId);
  };

  const getExamStatus = (exam: any) => {
    const now = new Date();
    const start = exam.startDate ? new Date(exam.startDate) : null;
    const end = exam.endDate ? new Date(exam.endDate) : null;

    if (start && now < start) return { label: t('exams.status.upcoming'), color: "bg-amber-100 text-amber-700", icon: CalendarClock, type: "UPCOMING" };
    if (end && now > end) return { label: t('exams.status.expired'), color: "bg-slate-100 text-slate-500", icon: Hourglass, type: "EXPIRED" };

    const userSubs = getSubmissionsForExam(exam.id);
    if (exam.attemptsAllowed && userSubs.length >= exam.attemptsAllowed) {
      return { label: t('exams.status.noAttempts'), color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2, type: "COMPLETED" };
    }

    return { label: t('exams.status.available'), color: "bg-green-100 text-green-700", icon: PlayCircle, type: "AVAILABLE" };
  };

  let averagePerformance = 0;
  if (submissions.length > 0) {
    const total = submissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0);
    averagePerformance = Math.round(total / submissions.length);
  }

  const performanceText =
    averagePerformance >= 90 ? t('exams.performance.excellent') :
      averagePerformance >= 80 ? t('exams.performance.veryGood') :
        averagePerformance >= 70 ? t('exams.performance.good') :
          averagePerformance >= 50 ? t('exams.performance.acceptable') :
            averagePerformance === 0 && submissions.length === 0 ? t('exams.performance.noData') :
              t('exams.performance.needsImprovement');

  const performanceLevel =
    averagePerformance >= 90 ? t('exams.level.aPlus') :
      averagePerformance >= 80 ? t('exams.level.b') :
        averagePerformance >= 70 ? t('exams.level.c') :
          averagePerformance >= 50 ? t('exams.level.d') :
            averagePerformance === 0 && submissions.length === 0 ? t('exams.level.na') :
              t('exams.level.f');

  return (
    <DashboardLayout>
      <div className={`w-full max-w-[1400px] mx-auto space-y-8 md:space-y-12 pb-24 px-4 sm:px-6 md:px-8 bg-slate-50/50 min-h-screen overflow-x-hidden ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>
        
        {/* ── PREMIUM HEADER HERO ── */}
        <div className="relative w-full rounded-[32px] md:rounded-[40px] bg-white overflow-hidden p-6 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-100/50 transition-colors duration-1000" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-fuchsia-50/50 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-start w-full">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-50/80 rounded-[24px] flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
               <FileText className="w-10 h-10 md:w-12 md:h-12 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl border border-indigo-100 mb-4">
                 <Sparkles className="w-3.5 h-3.5" />
                 {t('exams.title')}
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight leading-tight">{t('exams.title')}</h1>
              <p className="text-slate-500 font-bold text-sm md:text-lg max-w-2xl">{t('exams.subtitle')}</p>
            </div>
            
            <div className="shrink-0 mt-4 md:mt-0">
               <button className="w-full md:w-auto px-6 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black text-sm hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95">
                 <Award className="w-5 h-5" />
                 {t('exams.resultsRecord')}
               </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
          
          {/* ── MAIN CONTENT: EXAMS LIST ── */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <div className="flex items-center justify-between mb-4 md:mb-6 px-2">
               <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                     <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  {t('exams.availableExams')}
               </h2>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="py-24 text-center flex flex-col items-center gap-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                  <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] animate-pulse">{t('exams.loading')}</p>
                </div>
              ) : error ? (
                <div className="py-24 text-center bg-rose-50 rounded-[32px] border border-rose-100 shadow-sm">
                  <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                  <p className="text-rose-600 font-black text-xl">{error}</p>
                </div>
              ) : exams.length === 0 ? (
                <div className="py-32 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm group">
                  <div className="w-24 h-24 bg-slate-50 border-2 border-slate-100 rounded-[28px] flex items-center justify-center mx-auto mb-8 text-slate-300 group-hover:scale-110 transition-transform duration-500">
                    <FileText className="w-12 h-12" />
                  </div>
                  <p className="text-slate-900 font-black text-2xl tracking-tight mb-2">{t('exams.noAvailableExams')}</p>
                  <p className="text-slate-400 font-bold text-sm">
                    {language === 'ar' ? 'استرخِ الآن، لا توجد امتحانات في الوقت الحالي.' : 'Relax now, there are no exams at the moment.'}
                  </p>
                </div>
              ) : (
                exams.map((exam: any) => {
                  const status = getExamStatus(exam);
                  const userSubs = getSubmissionsForExam(exam.id);
                  const attemptsLeft = (exam.attemptsAllowed || 1) - userSubs.length;

                  return (
                     <div key={exam.id} className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/40 hover:-translate-y-1 hover:border-indigo-200/60 transition-all duration-500 group relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
                        {exam.isCentral && (
                          <div className={`absolute top-0 px-6 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md ${language === 'ar' ? 'right-0 rounded-bl-3xl' : 'left-0 rounded-br-3xl'}`}>
                            {t('exams.centralExam')}
                          </div>
                        )}

                        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[28px] flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner ${status.type === 'AVAILABLE' ? 'bg-indigo-50 border border-indigo-100/50' : 'bg-slate-50 border border-slate-100'}`}>
                           <FileText className={`w-10 h-10 md:w-12 md:h-12 ${status.type === 'AVAILABLE' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        </div>

                        <div className="flex-1 w-full text-center md:text-start">
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl flex items-center gap-1.5 border shadow-sm ${status.color.replace('bg-', 'border-').replace('100', '200')} ${status.color}`}>
                                 <status.icon className="w-3.5 h-3.5" />
                                 {status.label}
                              </span>
                              <span className="text-[10px] text-slate-600 font-black bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">{exam.category || t('exams.general')}</span>
                              {exam.password && (
                                <span className="text-[10px] text-amber-600 font-black bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                                  <Lock className="w-3 h-3" />
                                  {t('exams.protected')}
                                </span>
                              )}
                           </div>
                           
                           <h3 className="font-black text-slate-900 text-xl md:text-2xl lg:text-3xl group-hover:text-indigo-600 transition-colors mb-5 line-clamp-2 leading-tight tracking-tight">
                              {exam.title}
                           </h3>

                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 border-t border-slate-50 pt-5">
                             <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                               <Clock className="w-4 h-4 text-indigo-400" />
                               {exam.duration} {t('exams.minutes')}
                             </div>
                             <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                               <Timer className="w-4 h-4 text-fuchsia-400" />
                               {(exam.attemptsAllowed || 1) === 999 ? t('exams.unlimitedAttempts') : `${t('exams.attemptsLeft')} ${Math.max(0, attemptsLeft)}`}
                             </div>
                             {exam.startDate && (
                               <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                 <CalendarClock className="w-4 h-4 text-emerald-400" />
                                 {new Date(exam.startDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                               </div>
                             )}
                           </div>
                        </div>

                        <div className="w-full md:w-auto shrink-0 flex flex-col gap-3 mt-2 md:mt-0">
                           {userSubs.length > 0 && (
                             <Link
                               href={`/exams/result/${userSubs[0].id}`}
                               className="w-full md:w-40 py-3.5 rounded-2xl bg-emerald-50 text-emerald-700 text-center font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-200 shadow-sm"
                             >
                               {t('exams.lastResult')}: {Math.round(userSubs[0].percentage)}%
                             </Link>
                           )}

                           {status.type === 'AVAILABLE' ? (
                             <Link
                               href={`/exams/${exam.id}`}
                               className={`w-full md:w-40 py-4 md:py-5 rounded-2xl bg-indigo-600 text-white text-center font-black text-sm md:text-base shadow-lg shadow-indigo-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-300 flex items-center justify-center gap-2 ${language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}
                             >
                               {t('exams.startNow')}
                               <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? '' : 'rotate-180'}`} />
                             </Link>
                           ) : status.type === 'COMPLETED' ? (
                             <Link
                               href={`/exams/result/${userSubs[0].id}`}
                               className={`w-full md:w-40 py-4 md:py-5 rounded-2xl bg-emerald-600 text-white text-center font-black text-sm md:text-base shadow-lg shadow-emerald-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-300 flex items-center justify-center gap-2`}
                             >
                               {t('exams.viewResult')}
                               <Eye className="w-5 h-5" />
                             </Link>
                           ) : status.type === 'UPCOMING' ? (
                             <div className="w-full md:w-40 py-4 md:py-5 rounded-2xl bg-slate-50 text-slate-400 text-center font-black text-sm md:text-base border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed">
                               {t('exams.unavailable')}
                               <Lock className="w-4 h-4" />
                             </div>
                           ) : (
                             <div className="w-full md:w-40 py-4 md:py-5 rounded-2xl bg-slate-50 text-slate-400 text-center font-black text-sm md:text-base border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed">
                               {t('exams.closed')}
                               <EyeOff className="w-4 h-4" />
                             </div>
                           )}
                        </div>
                     </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* ── SIDEBAR: RESULTS & PERFORMANCE ── */}
          <div className="lg:col-span-4 space-y-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight px-2">{t('exams.recentResults')}</h3>
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              {submissions.length === 0 ? (
                <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                    <Award className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold">{t('exams.noResultsYet')}</p>
                </div>
              ) : (
                submissions.slice(0, 5).map((sub: any) => {
                  const getGrade = (pct: number) => {
                    if (pct >= 90) return { label: t('exams.grade.excellent'), color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
                    if (pct >= 80) return { label: t('exams.grade.veryGood'), color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" };
                    if (pct >= 70) return { label: t('exams.grade.good'), color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
                    return { label: t('exams.grade.acceptable'), color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" };
                  };
                  const grade = getGrade(sub.percentage);
                  return (
                    <Link key={sub.id} href={`/exams/result/${sub.id}`} className="flex gap-4 md:gap-5 items-center group cursor-pointer p-3 md:p-4 rounded-[24px] hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 border ${grade.bg} ${grade.color} ${grade.border}`}>
                        <Award className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <h4 className="font-black text-slate-900 text-xs md:text-sm truncate mb-1 group-hover:text-indigo-600 transition-colors">{sub.exam.title}</h4>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                           <Calendar className="w-3 h-3" />
                           {new Date(sub.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      </div>
                      <div className={`shrink-0 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                        <p className={`text-lg md:text-xl font-black ${grade.color} group-hover:scale-110 transition-transform origin-right`}>
                          {Math.round(sub.percentage)}%
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{grade.label}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Premium Performance Card */}
            <div className="bg-gradient-to-br from-[#200547] via-[#310c73] to-[#4514a3] p-8 md:p-10 rounded-[32px] md:rounded-[40px] text-white border border-indigo-400/20 shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <h4 className="font-black text-xl md:text-2xl mb-2 text-white flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-amber-300" />
                       {t('exams.performanceAnalysis')}
                    </h4>
                    <p className="text-[10px] md:text-xs text-indigo-200 font-black uppercase tracking-widest">{t('exams.basedOnRecent')}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all backdrop-blur-md">
                    <ArrowUpRight className={`w-5 h-5 md:w-6 md:h-6 text-amber-300 ${language === 'ar' ? '' : 'rotate-90'}`} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6 md:mb-8">
                  <div className="text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-md">{averagePerformance}</div>
                  <div className="text-2xl md:text-3xl font-black text-amber-300">%</div>
                </div>

                <div className="space-y-4 md:space-y-5">
                  <div className="w-full bg-white/5 h-3 md:h-4 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
                    <div className="bg-gradient-to-l from-amber-300 via-emerald-400 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(52,211,153,0.5)]" style={{ width: `${averagePerformance}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] md:text-xs text-indigo-100 font-black">{performanceText}</p>
                    <p className="text-[10px] md:text-xs text-amber-300 font-black tracking-widest uppercase bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/30">{performanceLevel}</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative background blurs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-fuchsia-400/20 transition-colors duration-1000"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] -ml-32 -mb-32 pointer-events-none group-hover:bg-blue-400/20 transition-colors duration-1000"></div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
