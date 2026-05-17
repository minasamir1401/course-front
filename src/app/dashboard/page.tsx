"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BookOpen, Clock, TrendingUp, Award,
  Play, ArrowUpRight, FileText, Sparkles,
  Zap, ListOrdered, GraduationCap, Target, Calendar,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL, getFullImageUrl } from "@/lib/api";
import { readCachedStudentStats, fetchStudentStats } from "@/lib/student-stats";

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

        const cached = readCachedStudentStats();
        if (cached) {
          setStats(cached);
          setIsLoading(false);
        }

        const statsData = await fetchStudentStats(token);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 border-[6px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-200 mx-auto"></div>
            <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] animate-pulse">جاري تحضير تجربتك المميزة...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-[1600px] mx-auto space-y-6 md:space-y-12 pb-24 px-2 md:px-4" dir="rtl">

        {/* ── PREMIUM WELCOME HERO ── */}
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] premium-gradient-primary shadow-2xl shadow-indigo-500/20 group">
          {/* Animated Background Elements */}
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-400/20 blur-[100px] rounded-full" />
          
          <div className="relative z-10 px-4 py-10 md:px-20 md:py-24 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-right space-y-6 md:space-y-8 w-full">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                <Sparkles className="w-4 h-4 text-amber-300 floating" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">مرحباً بك في مستقبلك الواعد</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
                أهلاً بك، <span className="text-transparent bg-clip-text bg-gradient-to-l from-white via-indigo-100 to-blue-100">{stats?.name?.split(' ')[0] || "طالبنا"}</span>
              </h1>
              
              <p className="text-indigo-50 text-lg md:text-2xl font-medium max-w-2xl leading-relaxed opacity-90">
                أنت تحرز تقدماً مذهلاً! لديك <span className="font-black text-white underline decoration-indigo-300 decoration-4 underline-offset-8">{stats?.upcomingExams || 0} اختبارات</span> هامة تنتظرك هذا الأسبوع.
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 pt-4">
                <button
                  onClick={() => router.push('/courses')}
                  className="group px-8 md:px-12 py-4 md:py-5 bg-white text-indigo-600 rounded-2xl md:rounded-3xl font-black text-base md:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all duration-500 active:scale-95 flex items-center gap-3 md:gap-4"
                >
                  متابعة التعلم
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-[-8px] transition-transform" />
                </button>
                
                <div className="glass px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl flex items-center gap-4 md:gap-5 border-white/10">
                   <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                      <GraduationCap className="w-5 h-5 md:w-7 md:h-7 text-white" />
                   </div>
                   <div className="text-right">
                      <p className="text-indigo-100 text-[8px] md:text-[10px] font-black uppercase tracking-[1px] md:tracking-[2px]">المستوى الحالي</p>
                      <p className="text-white font-black text-lg md:text-xl">{stats?.grade || "مسار التعلم"}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* 3D Progress Widget */}
            <div className="relative group w-full max-w-[320px]">
               <div className="absolute inset-0 bg-white/20 blur-[80px] rounded-full group-hover:bg-white/30 transition-all duration-700" />
               <div className="relative glass p-6 md:p-10 rounded-[40px] md:rounded-[60px] border-white/20 shadow-2xl flex flex-col items-center justify-center w-full floating">
                  <div className="relative w-32 h-32 md:w-48 md:h-48 mb-6 md:mb-8">
                     <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle className="stroke-white/10 stroke-[3] fill-none" cx="18" cy="18" r="15.9155" />
                        <circle
                           className="stroke-white stroke-[3.5] fill-none transition-all duration-1000 ease-out shadow-lg shadow-white/50"
                           strokeDasharray={`${stats?.overallCourseProgress || 0}, 100`}
                           strokeLinecap="round"
                           cx="18" cy="18" r="15.9155"
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <span className="font-black text-4xl md:text-6xl tracking-tighter">{stats?.overallCourseProgress || 0}%</span>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">التقدم الكلي</span>
                     </div>
                  </div>
                  <div className="flex gap-3 md:gap-4">
                     <div className="px-4 md:px-5 py-2 md:py-3 bg-white/10 rounded-xl md:rounded-2xl border border-white/10 text-center">
                        <p className="text-white font-black text-base md:text-lg">{stats?.coursesCount || 0}</p>
                        <p className="text-[8px] md:text-[9px] text-white/60 font-black uppercase tracking-widest">كورسات</p>
                     </div>
                     <div className="px-4 md:px-5 py-2 md:py-3 bg-white/10 rounded-xl md:rounded-2xl border border-white/10 text-center">
                        <p className="text-white font-black text-base md:text-lg">{stats?.totalExams || 0}</p>
                        <p className="text-[8px] md:text-[9px] text-white/60 font-black uppercase tracking-widest">اختبارات</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* ── PREMIUM STATS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
          {[
            { label: "المقررات الدراسية", value: stats?.coursesCount || 0, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50", trend: "4 مقررات نشطة" },
            { label: "المعدل التراكمي", value: `${Math.round(stats?.avgScore || 0)}%`, icon: Award, color: "text-amber-500", bg: "bg-amber-50", trend: "أداء ممتاز جداً" },
            { label: "الاختبارات المكتملة", value: stats?.totalExams || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-50", trend: "بانتظار النتائج" },
            { label: "ساعات التعلم", value: "24.5", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-50", trend: "زيادة 12% هذا الأسبوع" },
          ].map((stat, i) => (
            <div key={i} className="premium-card p-6 md:p-10 rounded-[30px] md:rounded-[40px] group hover:scale-[1.02] transition-all">
              <div className="flex flex-col gap-6 md:gap-8">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl ${stat.bg} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6`}>
                  <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.color}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-[1px] md:tracking-[2px]">{stat.label}</p>
                  <div className="flex items-baseline gap-2 md:gap-3">
                    <span className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-slate-500 font-bold mt-1 md:mt-2 flex items-center gap-2">
                    <TrendingUp className="w-3 md:w-3.5 h-3 md:h-3.5 text-emerald-500" />
                    {stat.trend}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          
          {/* Active Courses Column */}
          <div className="xl:col-span-8 space-y-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-2">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center">
                    <Play className="w-6 h-6 md:w-7 md:h-7 text-white fill-current" />
                 </div>
                 <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">مقرراتك الدراسية</h2>
                    <p className="text-slate-400 font-bold text-xs md:text-sm">واصل رحلة تفوقك من حيث توقفت</p>
                 </div>
              </div>
              <button
                onClick={() => router.push('/courses')}
                className="group flex items-center gap-3 text-indigo-600 font-black text-sm hover:translate-x-[-5px] transition-all"
              >
                استكشاف الكل
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              {stats?.courseProgresses?.length > 0 ? stats.courseProgresses.slice(0, 4).map((course: any, i: number) => (
                <div
                  key={course.id}
                  className="premium-card rounded-[35px] md:rounded-[48px] overflow-hidden group cursor-pointer"
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  <div className="relative h-48 md:h-60 w-full overflow-hidden">
                    { (course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage) ? (
                      <img src={getFullImageUrl(course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage) || ""} alt={course.title || course.course?.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                    ) : (
                      <div className="w-full h-full premium-gradient-primary flex items-center justify-center">
                        <BookOpen className="w-16 md:w-24 h-16 md:h-24 text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                    
                    <div className="absolute top-4 md:top-6 right-4 md:right-6">
                      <div className="px-3 py-1.5 md:px-4 md:py-2 glass rounded-xl md:rounded-2xl text-[9px] md:text-[10px] text-white font-black uppercase tracking-widest border-white/20">
                        {course.subject || "عام"}
                      </div>
                    </div>

                    <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 left-4 md:left-6 flex justify-between items-end">
                       <div className="space-y-1">
                          <p className="text-white/60 text-[9px] md:text-[10px] font-black uppercase tracking-widest">المستوى</p>
                          <p className="text-white font-black text-sm md:text-base">مستوى {i + 1}</p>
                       </div>
                       <div className="flex flex-col items-end">
                          <div className="w-12 h-12 md:w-14 md:h-14 glass rounded-full flex items-center justify-center border-white/30 text-white font-black text-xs md:text-sm mb-2">
                             {course.progressPercent}%
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                    <div className="space-y-2 md:space-y-3">
                       <h3 className="text-xl md:text-2xl font-black text-slate-900 line-clamp-1 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                         {course.title}
                       </h3>
                       <div className="flex items-center gap-4 md:gap-6">
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] md:text-xs">
                             <ListOrdered className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                             {course.totalLessons || 0} دروس
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] md:text-xs">
                             <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                             {Math.ceil((course.totalLessons || 0) * 0.2)} اختبارات
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                       <div className="w-full h-2.5 md:h-3 bg-slate-50 rounded-full overflow-hidden shadow-inner relative">
                          <div
                            className="h-full bg-gradient-to-l from-indigo-600 to-blue-400 transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${course.progressPercent}%` }}
                          />
                       </div>
                       <button
                         onClick={(e) => { e.stopPropagation(); router.push(`/courses/${course.id}`); }}
                         className="w-full py-4 md:py-5 rounded-2xl md:rounded-3xl bg-slate-950 text-white font-black text-xs md:text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 md:gap-4 shadow-xl active:scale-95"
                       >
                         متابعة التعلم الآن
                         <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                       </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-32 text-center bg-white rounded-[60px] border-4 border-dashed border-slate-100">
                  <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-8" />
                  <p className="text-slate-900 text-2xl font-black mb-2">رحلتك تبدأ من هنا!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="xl:col-span-4 space-y-12">
            
            {/* Recent Results Widget */}
            <div className="premium-card p-6 md:p-10 rounded-[35px] md:rounded-[55px] space-y-8 md:space-y-10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 blur-3xl -ml-16 -mt-16" />
               <div className="flex items-center justify-between relative z-10">
                 <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3 md:gap-4">
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
                     <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                   </div>
                   آخر النتائج
                 </h2>
               </div>

               <div className="space-y-5 relative z-10">
                 {stats?.recentExams?.length > 0 ? stats.recentExams.map((submission: any, i: number) => (
                   <div key={i} className="flex gap-4 md:gap-5 items-center p-4 md:p-5 rounded-[25px] md:rounded-[35px] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group/item">
                     <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-[24px] bg-white border border-slate-100 flex flex-col items-center justify-center shrink-0 shadow-sm group-hover/item:border-indigo-200 transition-all">
                       <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">SCORE</span>
                       <span className="text-xl md:text-2xl font-black text-slate-900 group-hover/item:text-indigo-600 transition-colors">
                          {Math.round(submission.percentage || 0)}%
                       </span>
                     </div>
                     <div className="min-w-0 flex-1 text-right">
                       <p className="text-xs md:text-sm font-black text-slate-900 truncate mb-1 md:mb-1.5 tracking-tight group-hover/item:text-indigo-600 transition-colors">{submission.examTitle}</p>
                       <div className="flex items-center justify-end gap-2 md:gap-3">
                         <div className="px-2 md:px-3 py-1 bg-emerald-50 text-emerald-600 text-[7px] md:text-[8px] font-black rounded-lg uppercase tracking-widest border border-emerald-100">ناجح ✅</div>
                         <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[8px] md:text-[9px]">
                            <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            {new Date(submission.date).toLocaleDateString('ar-EG')}
                         </div>
                       </div>
                     </div>
                   </div>
                 )) : (
                   <div className="py-20 text-center space-y-4">
                     <p className="text-slate-400 text-sm font-bold">لا توجد نتائج اختبارات حالية</p>
                   </div>
                 )}
               </div>
            </div>

            {/* Performance Widget */}
            <div className="bg-slate-950 p-6 md:p-10 rounded-[35px] md:rounded-[55px] text-white space-y-8 md:space-y-10 relative overflow-hidden group">
               <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-600/30 blur-[100px] -mr-20 -mb-20" />
               <div className="flex items-center justify-between relative z-10">
                 <h3 className="text-lg md:text-xl font-black flex items-center gap-3 md:gap-4">
                   <div className="w-10 h-10 md:w-12 md:h-12 glass-dark rounded-xl md:rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 animate-pulse" />
                   </div>
                   إحصائيات الإنجاز
                 </h3>
               </div>

               <div className="space-y-6 relative z-10">
                  <div className="glass-dark p-6 md:p-8 rounded-[30px] md:rounded-[40px] flex items-center justify-between group/card hover:bg-white/10 transition-all cursor-pointer">
                     <div className="space-y-1">
                        <p className="text-indigo-300 text-[8px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[3px]">أيام متتالية</p>
                        <p className="text-2xl md:text-4xl font-black text-white">08 <span className="text-sm md:text-lg opacity-60">أيام</span></p>
                     </div>
                     <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover/card:scale-110 transition-all duration-500">
                        <Zap className="w-6 h-6 md:w-8 md:h-8 text-white fill-current" />
                     </div>
                  </div>

                  <div className="glass-dark p-6 md:p-8 rounded-[30px] md:rounded-[40px] space-y-6">
                     <div className="flex justify-between items-center">
                        <p className="text-indigo-300 text-[8px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[3px]">الهدف الأسبوعي</p>
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] md:text-[10px] font-black">75% مكتمل</span>
                     </div>
                     <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[75%] rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                     </div>
                     <p className="text-[10px] md:text-[11px] text-white/60 font-bold leading-relaxed">
                        باقي لك <span className="text-white">2.5 ساعة</span> لتحقيق هدفك لهذا الأسبوع. واصل العمل الجاد! 🚀
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
