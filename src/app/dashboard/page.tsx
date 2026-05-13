"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BookOpen, Clock, CheckCircle, TrendingUp, Award,
  ChevronRight, Play, BarChart3, ArrowUpRight, FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function StudentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("lms_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${API_URL}/student/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12" dir="rtl">
        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-gradient-to-l from-indigo-600 to-violet-700 rounded-[32px] p-8 md:p-12 text-white shadow-xl shadow-indigo-200 animate-in fade-in slide-in-from-top duration-700">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">أهلاً بك، {stats?.name || "طالبنا"} 👋</h1>
            <p className="text-indigo-100 text-lg font-medium max-w-2xl">
              أنت الآن في {stats?.grade || "مسار التعلم"}. لديك {stats?.upcomingExams || 0} امتحانات قادمة.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <button
                onClick={() => router.push('/courses')}
                className="bg-white text-indigo-600 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                متابعة التعلم
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "المقررات الدراسية", value: stats?.coursesCount || 0, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", desc: "مقرر متاح" },
            { label: "التقدم الفعلي", value: `${stats?.overallCourseProgress || 0}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", desc: "إجمالي الإنجاز" },
            { label: "متوسط الدرجات", value: `${Math.round(stats?.avgScore || 0)}%`, icon: Award, color: "text-amber-600", bg: "bg-amber-50", desc: "أداؤك العام" },
            { label: "الامتحانات المكتملة", value: stats?.totalExams || 0, icon: FileText, color: "text-violet-600", bg: "bg-violet-50", desc: "امتحان تم تسليمه" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all group animate-in zoom-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">{stat.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Courses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Play className="w-6 h-6 text-indigo-600" />
                مقرراتي الحالية
              </h2>
              <button onClick={() => router.push('/courses')} className="text-indigo-600 font-bold text-sm hover:underline">عرض الكل</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats?.courseProgresses?.length > 0 ? stats.courseProgresses.map((course: any, i: number) => (
                <div key={course.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">{course.subject}</span>
                    <BarChart3 className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-1">{course.title}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black">
                      <span className="text-slate-400 uppercase tracking-wider">التقدم</span>
                      <span className="text-indigo-600">{course.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${course.progressPercent}%` }}></div>
                    </div>
                    <button
                      onClick={() => router.push(`/courses/${course.id}`)}
                      className="w-full mt-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      مواصلة التعلم
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 py-12 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">لم تظهر مقررات بعد</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recent Activity & Exams */}
          <div className="space-y-8">
            {/* Recent Exams Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-500" />
                نتائج الامتحانات
              </h2>
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                {stats?.recentExams?.length > 0 ? stats.recentExams.map((submission: any, i: number) => (
                  <div key={i} className="flex gap-4 items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black leading-none uppercase tracking-tighter">الدرجة</span>
                      <span className="text-base font-black">{Math.round(submission.percentage || 0)}%</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{submission.examTitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-slate-400 font-bold">{new Date(submission.date).toLocaleDateString('ar-EG')}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <p className="text-[10px] text-emerald-600 font-black">ناجح ✅</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-xs font-bold">لا توجد امتحانات مكتملة</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-600" />
                نشاطك الأخير
              </h2>
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                {stats?.lessonProgresses?.length > 0 ? stats.lessonProgresses.slice(0, 4).map((lp: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${lp.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600 shadow-blue-100'} shadow-sm`}>
                      {lp.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{lp.lesson.title}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{lp.lesson.course.title}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-8 text-slate-400 text-xs font-bold">لا توجد دروس مشاهدة مؤخراً</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
