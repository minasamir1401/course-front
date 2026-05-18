"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText, Clock, AlertCircle, CheckCircle2,
  ChevronRight, ChevronLeft, Calendar, ArrowUpRight, Filter, Search,
  PlayCircle, Timer, Award, Lock, Eye, EyeOff, Hourglass, CalendarClock
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
      <div className={`max-w-7xl mx-auto space-y-6 md:space-y-8 pb-20 px-1 sm:px-0 overflow-x-hidden ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className={language === 'ar' ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2">{t('exams.title')}</h1>
            <p className="text-slate-500 font-bold text-sm sm:text-lg">{t('exams.subtitle')}</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              {t('exams.resultsRecord')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content: Upcoming Exams */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <FileText className="w-7 h-7 text-indigo-600" />
                {t('exams.availableExams')}
              </h3>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-black text-xl">{t('exams.loading')}</p>
                </div>
              ) : error ? (
                <div className="py-20 text-center bg-rose-50 rounded-[40px] border-2 border-rose-100">
                  <p className="text-rose-500 font-black text-xl">{error}</p>
                </div>
              ) : exams.length === 0 ? (
                <div className="py-24 text-center bg-slate-50 rounded-[50px] border-4 border-dashed border-slate-100">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <FileText className="w-10 h-10" />
                  </div>
                  <p className="text-slate-400 font-black text-2xl">{t('exams.noAvailableExams')}</p>
                </div>
              ) : (
                exams.map((exam: any) => {
                  const status = getExamStatus(exam);
                  const userSubs = getSubmissionsForExam(exam.id);
                  const attemptsLeft = (exam.attemptsAllowed || 1) - userSubs.length;

                  return (
                    <div key={exam.id} className="bg-white rounded-[24px] sm:rounded-[35px] p-4 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden">
                      {exam.isCentral && (
                        <div className={`absolute top-0 px-6 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest ${language === 'ar' ? 'right-0 rounded-bl-3xl' : 'left-0 rounded-br-3xl'}`}>
                          {t('exams.centralExam')}
                        </div>
                      )}

                      <div className="flex flex-col gap-4 sm:gap-8">
                        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-lg ${status.type === 'AVAILABLE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <FileText className="w-7 h-7 sm:w-10 sm:h-10" />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl flex items-center gap-2 ${status.color}`}>
                              <status.icon className="w-3 h-3" />
                              {status.label}
                            </span>
                            <span className="text-xs text-slate-400 font-black bg-slate-50 px-3 py-1.5 rounded-xl">{exam.category || t('exams.general')}</span>
                            {exam.password && (
                              <span className="text-xs text-amber-600 font-black bg-amber-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <Lock className="w-3 h-3" />
                                {t('exams.protected')}
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-slate-900 text-lg sm:text-2xl group-hover:text-indigo-600 transition-colors mb-2 sm:mb-4">{exam.title}</h4>

                          <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                              <Clock className="w-4 h-4 text-slate-300" />
                              {exam.duration} {t('exams.minutes')}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                              <Timer className="w-4 h-4 text-slate-300" />
                              {(exam.attemptsAllowed || 1) === 999 ? t('exams.unlimitedAttempts') : `${t('exams.attemptsLeft')} ${Math.max(0, attemptsLeft)}`}
                            </div>
                            {exam.startDate && (
                              <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                                <Calendar className="w-4 h-4 text-slate-300" />
                                {t('exams.startsAt')}: {new Date(exam.startDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full sm:min-w-[160px]">
                          {userSubs.length > 0 && (
                            <Link
                              href={`/exams/result/${userSubs[0].id}`}
                              className="w-full py-4 rounded-2xl bg-emerald-50 text-emerald-700 text-center font-black text-sm hover:bg-emerald-100 transition-all border border-emerald-100"
                            >
                              {t('exams.lastResult')}: {Math.round(userSubs[0].percentage)}%
                            </Link>
                          )}

                          {status.type === 'AVAILABLE' ? (
                            <Link
                              href={`/exams/${exam.id}`}
                              className={`w-full py-5 rounded-2xl bg-indigo-600 text-white text-center font-black text-lg shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center justify-center gap-3 ${language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}
                            >
                              {t('exams.startNow')}
                              <ChevronLeft className={`w-6 h-6 ${language === 'ar' ? '' : 'rotate-180'}`} />
                            </Link>
                          ) : status.type === 'COMPLETED' ? (
                            <Link
                              href={`/exams/result/${userSubs[0].id}`}
                              className={`w-full py-5 rounded-2xl bg-emerald-600 text-white text-center font-black text-lg shadow-xl shadow-emerald-100 hover:scale-105 transition-all flex items-center justify-center gap-3`}
                            >
                              {t('exams.viewResult')}
                              <Eye className="w-6 h-6" />
                            </Link>
                          ) : status.type === 'UPCOMING' ? (
                            <div className="w-full py-5 rounded-2xl bg-slate-100 text-slate-400 text-center font-black text-lg border border-slate-200 flex items-center justify-center gap-3 cursor-not-allowed">
                              {t('exams.unavailable')}
                              <Lock className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-full py-5 rounded-2xl bg-slate-50 text-slate-300 text-center font-black text-lg border border-slate-100 flex items-center justify-center gap-3 cursor-not-allowed">
                              {t('exams.closed')}
                              <EyeOff className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar: Results & Performance */}
          <div className="lg:col-span-4 space-y-8">
            <h3 className="text-2xl font-black text-slate-800 mb-2">{t('exams.recentResults')}</h3>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
              {submissions.length === 0 ? (
                <div className="text-center text-slate-400 py-10 flex flex-col gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200">
                    <Award className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold">{t('exams.noResultsYet')}</p>
                </div>
              ) : (
                submissions.slice(0, 5).map((sub: any) => {
                  const getGrade = (pct: number) => {
                    if (pct >= 90) return { label: t('exams.grade.excellent'), color: "text-emerald-600", bg: "bg-emerald-50" };
                    if (pct >= 80) return { label: t('exams.grade.veryGood'), color: "text-indigo-600", bg: "bg-indigo-50" };
                    if (pct >= 70) return { label: t('exams.grade.good'), color: "text-amber-600", bg: "bg-amber-50" };
                    return { label: t('exams.grade.acceptable'), color: "text-rose-600", bg: "bg-rose-50" };
                  };
                  const grade = getGrade(sub.percentage);
                  return (
                    <Link key={sub.id} href={`/exams/result/${sub.id}`} className="flex gap-5 items-center group cursor-pointer transition-all hover:translate-x-[-8px]">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${grade.bg} ${grade.color}`}>
                        <Award className="w-7 h-7" />
                      </div>
                      <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <h4 className="font-black text-slate-800 text-sm truncate mb-1 group-hover:text-indigo-600 transition-colors">{sub.exam.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(sub.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')} • {sub.exam.type}
                        </p>
                      </div>
                      <div className={`shrink-0 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                        <p className={`text-xl font-black ${grade.color}`}>
                          {Math.round(sub.percentage)}%
                        </p>
                        <p className="text-[10px] font-black text-slate-400">{grade.label}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Performance Card */}
            <div className="bg-[#1a1a2e] p-10 rounded-[40px] text-white border border-white/5 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <h4 className="font-black text-xl mb-1 text-indigo-200">{t('exams.performanceAnalysis')}</h4>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{t('exams.basedOnRecent')}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <ArrowUpRight className={`w-6 h-6 text-indigo-400 ${language === 'ar' ? '' : 'rotate-90'}`} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <div className="text-6xl font-black tracking-tighter">{averagePerformance}</div>
                  <div className="text-2xl font-black text-indigo-400">%</div>
                </div>

                <div className="space-y-4">
                  <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <div className="bg-gradient-to-l from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${averagePerformance}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-indigo-200/60 font-black">{performanceText}</p>
                    <p className="text-[10px] text-indigo-200 font-black tracking-widest uppercase">{performanceLevel}</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32"></div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
