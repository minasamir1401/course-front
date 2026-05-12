"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  BarChart2, TrendingUp, Star, BookOpen, ClipboardList, 
  Clock, CheckCircle2, Award, Download, Filter, Search,
  Calendar, ArrowUpRight, ArrowDownRight, MoreVertical
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";

export default function ReportsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<'OVERVIEW' | 'EXAMS' | 'COURSES'>('OVERVIEW');

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

      const res = await fetch(API_URL + "/student/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-3">
              <BarChart2 className="w-7 h-7 text-primary" />
              التقارير والإحصائيات الحقيقية
            </h1>
            <p className="text-sm text-slate-500 font-bold">تحليل دقيق لمستوى أدائك في الاختبارات والدروس</p>
          </div>
          <div className="flex items-center gap-3 no-print">
            <button onClick={handleExportPDF} className="btn-outline text-xs">
              <Download className="w-4 h-4" />
              تصدير PDF
            </button>
            <button onClick={fetchStats} className="btn-primary text-xs px-6 py-3">
              تحديث البيانات
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit no-print">
          <button 
            onClick={() => setActiveReportTab('OVERVIEW')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeReportTab === 'OVERVIEW' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            نظرة عامة
          </button>
          <button 
            onClick={() => setActiveReportTab('EXAMS')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeReportTab === 'EXAMS' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            الاختبارات
          </button>
          <button 
            onClick={() => setActiveReportTab('COURSES')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeReportTab === 'COURSES' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            الكورسات والدروس
          </button>
        </div>

        {activeReportTab === 'OVERVIEW' && (
          <>
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-6 flex items-center gap-4 border-b-4 border-b-blue-500">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">متوسط الدرجات</p>
                  <h3 className="text-2xl font-black text-slate-800">{stats?.avgScore || 0}%</h3>
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 border-b-4 border-b-emerald-500">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">الدروس المكتملة</p>
                  <h3 className="text-2xl font-black text-slate-800">{stats?.lessonProgresses?.filter((p:any)=>p.isCompleted).length || 0}</h3>
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 border-b-4 border-b-indigo-500">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">إنجاز الكورسات</p>
                  <h3 className="text-2xl font-black text-slate-800">{stats?.overallCourseProgress || 0}%</h3>
                </div>
              </div>
              <div className="card p-6 flex items-center gap-4 border-b-4 border-b-orange-500">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">وقت المذاكرة (دقائق)</p>
                  <h3 className="text-2xl font-black text-slate-800">
                    {Math.round((stats?.lessonProgresses?.reduce((acc:any, p:any) => acc + p.watchedSeconds, 0) || 0) / 60)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  منحنى الأداء في الاختبارات
                </h3>
                <div className="h-[300px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.submissions?.slice().reverse().map((s:any) => ({ name: new Date(s.createdAt).toLocaleDateString('ar-EG', {day:'numeric', month:'short'}), score: s.percentage }))}>
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
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  توزيع التقدم في الكورسات
                </h3>
                <div className="h-[300px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.courseProgresses}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip />
                      <Bar dataKey="progressPercent" radius={[4, 4, 0, 0]}>
                        {stats?.courseProgresses?.map((entry:any, index:number) => (
                          <Cell key={`cell-${index}`} fill={['#4361EE', '#3F37C9', '#4CC9F0', '#4895EF'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {activeReportTab === 'EXAMS' && (
          <div className="card overflow-hidden border-none shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800">تاريخ المحاولات والنتائج</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <input type="text" placeholder="بحث عن اختبار..." className="text-xs bg-slate-50 border-none rounded-lg px-8 py-2 w-48 outline-none" />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">الاختبار</th>
                    <th className="px-6 py-4 text-center">التاريخ</th>
                    <th className="px-6 py-4 text-center">الدرجة</th>
                    <th className="px-6 py-4 text-center">الحالة</th>
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
                        {new Date(sub.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-black ${sub.percentage >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {Math.round(sub.percentage)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${sub.percentage >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {sub.percentage >= 50 ? 'ناجح' : 'راسب'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
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
                <div key={course.id} className="card p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black bg-slate-50 px-2 py-1 rounded-lg text-slate-400 uppercase">
                      {course.totalLessons} دروس
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">{course.title}</h4>
                    <p className="text-xs text-slate-500">{course.subject}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black">
                      <span className="text-slate-400">التقدم الفعلي</span>
                      <span className="text-indigo-600">{course.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${course.progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-black text-slate-800">سجل مشاهدة الدروس</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">الدرس</th>
                      <th className="px-6 py-4">الكورس</th>
                      <th className="px-6 py-4 text-center">مدة المشاهدة</th>
                      <th className="px-6 py-4 text-center">النسبة</th>
                      <th className="px-6 py-4 text-center">الحالة</th>
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
                                مكتمل
                              </span>
                            ) : (
                              <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center justify-center gap-1 w-fit mx-auto">
                                <Clock className="w-3 h-3" />
                                قيد المشاهدة
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

      </div>
    </DashboardLayout>
  );
}
