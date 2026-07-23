"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart2, TrendingUp, Star, BookOpen, ClipboardList, Clock, CheckCircle2, Award, Download, Filter, Search, Calendar, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ReportsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [xpSummary, setXpSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'OVERVIEW' | 'EXAMS' | 'COURSES' | 'GAMIFICATION'>('OVERVIEW');

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("lms_token") || 
                    localStorage.getItem("school_admin_token") || 
                    localStorage.getItem("super_admin_token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch both stats and XP summary in parallel
      const [res, xpRes] = await Promise.all([
        fetch(API_URL + "/student/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(API_URL + "/student/xp-summary", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
      if (xpRes.ok) {
        const xpData = await xpRes.json();
        setXpSummary(xpData);
      }
    } catch (error) {
      console.error("Failed to fetch reports data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    setMounted(true);
  }, [router]);

  const handleExportPDF = () => {
    window.print();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={`max-w-7xl mx-auto space-y-6 overflow-x-hidden px-1 sm:px-0 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] premium-gradient-primary p-8 md:p-12 group shadow-2xl shadow-indigo-500/20 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 blur-[100px] rounded-full animate-pulse" />
          <div className={`relative z-10 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/20 mb-3">
               <span className="text-amber-300">✨</span>
               <span className="text-white text-[10px] font-black uppercase tracking-widest">{t('reports.title')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight flex items-center gap-3">
              <BarChart2 className="w-8 h-8 md:w-10 md:h-10 text-indigo-200" />
              {t('reports.title')}
            </h1>
            <p className="text-indigo-100 font-medium text-sm md:text-base mt-2 max-w-xl">{t('reports.subtitle')}</p>
          </div>
          <div className="relative z-10 flex items-center gap-3 no-print w-full md:w-auto">
            <button onClick={handleExportPDF} className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl glass border border-white/20 text-white font-black text-xs md:text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              <Download className="w-4 h-4" />
              {t('reports.exportPdf')}
            </button>
            <button onClick={fetchStats} className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-white text-indigo-900 font-black text-xs md:text-sm hover:bg-indigo-50 transition-all shadow-xl active:scale-95 cursor-pointer">
              {t('reports.refresh')}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto no-print border border-slate-200/60">
          <button 
            onClick={() => setActiveReportTab('OVERVIEW')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${activeReportTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
          >
            {t('reports.tabs.overview')}
          </button>
          <button 
            onClick={() => setActiveReportTab('EXAMS')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${activeReportTab === 'EXAMS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
          >
            {t('reports.tabs.exams')}
          </button>
          <button 
            onClick={() => setActiveReportTab('COURSES')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${activeReportTab === 'COURSES' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
          >
            {t('reports.tabs.courses')}
          </button>
          <button 
            onClick={() => setActiveReportTab('GAMIFICATION')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer ${activeReportTab === 'GAMIFICATION' ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
          >
            ⭐ {language === 'ar' ? 'XP والإنجازات' : 'XP & Achievements'}
          </button>
        </div>

        {activeReportTab === 'OVERVIEW' && (
          <>
            {/* Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              <div className={`premium-card p-6 md:p-8 rounded-[30px] flex items-center gap-4 border-b-4 border-b-amber-500 group hover:scale-[1.02] transition-all ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-inner text-xl">
                  ⭐
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? 'نقاط الـ XP المحرزة' : 'Earned XP Points'}</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">{stats?.xp || 0} XP</h3>
                </div>
              </div>
              <div className={`premium-card p-6 md:p-8 rounded-[30px] flex items-center gap-4 border-b-4 border-b-blue-500 group hover:scale-[1.02] transition-all ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-inner">
                  <Star className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('reports.avgScore')}</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">{stats?.avgScore || 0}%</h3>
                </div>
              </div>
              <div className={`premium-card p-6 md:p-8 rounded-[30px] flex items-center gap-4 border-b-4 border-b-emerald-500 group hover:scale-[1.02] transition-all ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-inner">
                  <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('reports.completedLessons')}</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">{stats?.lessonProgresses?.filter((p:any)=>p.isCompleted).length || 0}</h3>
                </div>
              </div>
              <div className={`premium-card p-6 md:p-8 rounded-[30px] flex items-center gap-4 border-b-4 border-b-indigo-500 group hover:scale-[1.02] transition-all ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-inner">
                  <BookOpen className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('reports.courseProgress')}</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">{stats?.overallCourseProgress || 0}%</h3>
                </div>
              </div>
              <div className={`premium-card p-6 md:p-8 rounded-[30px] flex items-center gap-4 border-b-4 border-b-amber-500 group hover:scale-[1.02] transition-all ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-inner">
                  <Clock className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('reports.studyTime')}</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">
                    {Math.round((stats?.lessonProgresses?.reduce((acc:any, p:any) => acc + p.watchedSeconds, 0) || 0) / 60)} <span className="text-xs text-slate-400">{language === 'ar' ? 'دقيقة' : 'm'}</span>
                  </h3>
                </div>
              </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="premium-card p-6 md:p-8 rounded-[35px] shadow-lg">
                <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  {t('reports.examCurve')}
                </h3>
                <div className="h-[300px] w-full" dir="ltr">
                  {mounted && (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={stats?.submissions?.slice().reverse().map((s:any) => ({ name: new Date(s.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {day:'numeric', month:'short'}), score: s.percentage }))}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="premium-card p-6 md:p-8 rounded-[35px] shadow-lg">
                <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  {t('reports.courseProgressDist')}
                </h3>
                <div className="h-[300px] w-full" dir="ltr">
                  {mounted && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats?.courseProgresses}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <Tooltip />
                        <Bar dataKey="progressPercent" radius={[4, 4, 0, 0]}>
                          {stats?.courseProgresses?.map((entry:any, index:number) => (
                            <Cell key={`cell-${index}`} fill={['#6366F1', '#4F46E5', '#3B82F6', '#10B981'][index % 4]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeReportTab === 'EXAMS' && (
          <div className="premium-card overflow-hidden rounded-[35px] shadow-xl border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800">{t('reports.attemptsHistory')}</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <input type="text" placeholder={t('reports.searchExam')} className={`text-xs bg-slate-50 border-none rounded-lg py-2 w-48 outline-none ${language === 'ar' ? 'pr-8 pl-2' : 'pl-8 pr-2'}`} />
                  <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${language === 'ar' ? 'right-2.5' : 'left-2.5'}`} />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">{t('reports.table.exam')}</th>
                    <th className="px-6 py-4 text-center">{t('reports.table.date')}</th>
                    <th className="px-6 py-4 text-center">{t('reports.table.score')}</th>
                    <th className="px-6 py-4 text-center">{t('reports.table.status')}</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.submissions?.map((sub:any) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-slate-800">{sub.exam.title}</p>
                        <p className="text-[10px] text-slate-400">{sub.exam.type}</p>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-slate-500 font-bold">
                        {new Date(sub.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-black ${sub.percentage >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {Math.round(sub.percentage)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${sub.percentage >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {sub.percentage >= 50 ? t('reports.table.passed') : t('reports.table.failed')}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                        <button onClick={() => router.push(`/exams/result/${sub.id}`)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReportTab === 'COURSES' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats?.courseProgresses?.map((course:any) => (
                <div key={course.id} className="premium-card p-6 rounded-[30px] space-y-4 group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black bg-slate-50 px-2 py-1 rounded-lg text-slate-400 uppercase">
                      {course.totalLessons} {t('reports.lessons')}
                    </span>
                  </div>
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <h4 className="font-black text-slate-900 mb-1 text-lg group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                    <p className="text-xs text-slate-400 font-bold">{course.subject}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black">
                      <span className="text-slate-400 uppercase tracking-wider">{t('reports.actualProgress')}</span>
                      <span className="text-indigo-600">{course.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${course.progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="premium-card overflow-hidden rounded-[35px] shadow-xl border border-slate-100">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-black text-slate-800">{t('reports.watchHistory')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">{t('reports.watchTable.lesson')}</th>
                      <th className="px-6 py-4">{t('reports.watchTable.course')}</th>
                      <th className="px-6 py-4 text-center">{t('reports.watchTable.watchTime')}</th>
                      <th className="px-6 py-4 text-center">{t('reports.watchTable.percentage')}</th>
                      <th className="px-6 py-4 text-center">{t('reports.watchTable.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.lessonProgresses?.map((prog:any) => {
                      const percent = prog.lesson.duration > 0 ? Math.round((prog.watchedSeconds / prog.lesson.duration) * 100) : 0;
                      return (
                        <tr key={prog.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-slate-800">{prog.lesson.title}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                            {prog.lesson.course.title}
                          </td>
                          <td className="px-6 py-4 text-center text-xs text-slate-600 font-bold">
                            {formatDuration(prog.watchedSeconds)} / {formatDuration(prog.lesson.duration)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                              </div>
                              <span className="text-[10px] font-black text-slate-600">{percent}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {prog.isCompleted ? (
                              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center justify-center gap-1 w-fit mx-auto">
                                <CheckCircle2 className="w-3 h-3" />
                                {t('reports.watchTable.completed')}
                              </span>
                            ) : (
                              <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center justify-center gap-1 w-fit mx-auto">
                                <Clock className="w-3 h-3" />
                                {t('reports.watchTable.inProgress')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeReportTab === 'GAMIFICATION' && (
          <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* XP Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {/* Total XP */}
              <div className="relative overflow-hidden premium-card p-6 md:p-8 rounded-[30px] flex flex-col items-start gap-3 border-b-4 border-amber-400 group hover:scale-[1.02] transition-all col-span-2 md:col-span-1">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50 rounded-full blur-3xl opacity-50" />
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">⭐</div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{language === 'ar' ? 'إجمالي نقاط XP' : 'Total XP Points'}</p>
                  <p className="text-3xl md:text-4xl font-black text-amber-600">{xpSummary?.totalXP || stats?.xp || 0}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">XP</p>
                </div>
              </div>

              {/* Skills Hub XP */}
              <div className="premium-card p-6 rounded-[30px] flex flex-col items-start gap-3 border-b-4 border-violet-400 group hover:scale-[1.02] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">🧠</div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{language === 'ar' ? 'مهارات Skills Hub' : 'Skills Hub XP'}</p>
                  <p className="text-2xl font-black text-violet-600">{xpSummary?.skillsXP?.xp || 0}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">XP</p>
                </div>
              </div>

              {/* Completed Lessons */}
              <div className="premium-card p-6 rounded-[30px] flex flex-col items-start gap-3 border-b-4 border-emerald-400 group hover:scale-[1.02] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">📚</div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{language === 'ar' ? 'الدروس المكتملة' : 'Completed Lessons'}</p>
                  <p className="text-2xl font-black text-emerald-600">{stats?.lessonProgresses?.filter((p: any) => p.isCompleted).length || 0}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{language === 'ar' ? 'درس' : 'lessons'}</p>
                </div>
              </div>
            </div>

            {/* XP by Course */}
            {xpSummary?.courseXP && xpSummary.courseXP.length > 0 && (
              <div className="premium-card p-6 md:p-8 rounded-[35px]">
                <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <span className="text-amber-500">⭐</span>
                  {language === 'ar' ? 'توزيع نقاط XP على الكورسات' : 'XP Distribution by Course'}
                </h3>
                <div className="space-y-4">
                  {xpSummary.courseXP.sort((a: any, b: any) => b.xp - a.xp).map((course: any, idx: number) => {
                    const maxXP = Math.max(...xpSummary.courseXP.map((c: any) => c.xp), 1);
                    const pct = Math.round((course.xp / maxXP) * 100);
                    const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                    return (
                      <div key={course.courseId || idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-black">
                          <span className="text-slate-700 truncate max-w-[70%]">{course.title}</span>
                          <span className="text-amber-600 shrink-0">⭐ {course.xp} XP</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-1000`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Achievement Badges */}
            <div className="premium-card p-6 md:p-8 rounded-[35px]">
              <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-lg">
                <span>🏆</span>
                {language === 'ar' ? 'شارات الإنجاز' : 'Achievement Badges'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { emoji: '🎓', label: language === 'ar' ? 'متعلم نشط' : 'Active Learner', desc: language === 'ar' ? 'أكمل أول درس' : 'Complete 1st lesson', earned: (stats?.lessonProgresses?.filter((p: any) => p.isCompleted).length || 0) >= 1 },
                  { emoji: '🔥', label: language === 'ar' ? 'تسلسل رائع' : 'Hot Streak', desc: language === 'ar' ? '5 إجابات صح متتالية' : '5 correct in a row', earned: (xpSummary?.totalXP || 0) >= 20 },
                  { emoji: '⭐', label: language === 'ar' ? 'جامع XP' : 'XP Collector', desc: language === 'ar' ? '100 نقطة XP' : '100 XP earned', earned: (xpSummary?.totalXP || stats?.xp || 0) >= 100 },
                  { emoji: '🏆', label: language === 'ar' ? 'بطل المسابقات' : 'Exam Champion', desc: language === 'ar' ? 'اجتاز 3 اختبارات' : 'Pass 3 exams', earned: (stats?.submissions?.filter((s: any) => s.percentage >= 50).length || 0) >= 3 },
                ].map((badge, idx) => (
                  <div
                    key={idx}
                    className={`relative p-5 rounded-3xl text-center border-2 transition-all ${
                      badge.earned
                        ? 'border-amber-200 bg-amber-50 shadow-lg shadow-amber-100'
                        : 'border-slate-100 bg-slate-50 opacity-40 grayscale'
                    }`}
                  >
                    <div className="text-4xl mb-2">{badge.emoji}</div>
                    <p className="font-black text-sm text-slate-800">{badge.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{badge.desc}</p>
                    {badge.earned && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
