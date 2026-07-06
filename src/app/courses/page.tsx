"use client";

import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BookOpen, Play, Clock, CheckCircle2, Sparkles, Search,
  Target, ArrowUpRight, Filter, ChevronRight, Layers, Flame, Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL, getFullImageUrl } from "@/lib/api";
import { readCachedStudentStats, fetchStudentStats } from "@/lib/student-stats";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("lms_token") ||
                      localStorage.getItem("school_admin_token") ||
                      localStorage.getItem("super_admin_token") ||
                      localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const cached = readCachedStudentStats();
        if (cached?.courseProgresses) {
          setCourses(cached.courseProgresses || []);
          setIsLoading(false);
        }

        const statsData = await fetchStudentStats(token);
        setCourses(statsData.courseProgresses || []);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [router]);

  const toNumber = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatDuration = (course: any): string => {
    const seconds = toNumber(course.totalDurationSeconds);
    if (seconds > 0) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0 && minutes > 0) return language === 'ar' ? `${hours}س ${minutes}د` : `${hours}h ${minutes}m`;
      if (hours > 0) return language === 'ar' ? `${hours} س` : `${hours}h`;
      if (minutes > 0) return language === 'ar' ? `${minutes} د` : `${minutes}m`;
      return language === 'ar' ? '< 1د' : '< 1m';
    }
    const fallbackHours = (() => {
      const fromMinutes = toNumber(course.totalDurationMinutes || course.durationMinutes);
      if (fromMinutes > 0) return Math.max(1, Math.round(fromMinutes / 60));
      const fromHours = toNumber(course.totalDurationHours || course.durationHours);
      if (fromHours > 0) return Math.max(1, Math.round(fromHours));
      return 0;
    })();
    if (fallbackHours > 0) return language === 'ar' ? `${fallbackHours} س` : `${fallbackHours}h`;
    return language === 'ar' ? 'غير محدد' : 'Unknown';
  };

  // Extract unique categories (subjects)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach(c => {
      if (c.subject) cats.add(c.subject);
    });
    return ["ALL", ...Array.from(cats)];
  }, [courses]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (course.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || course.subject === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCompleted = courses.filter(c => c.progressPercent === 100).length;
  const inProgress = courses.filter(c => c.progressPercent > 0 && c.progressPercent < 100).length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-200"></div>
            <p className="text-indigo-600 font-black tracking-widest uppercase animate-pulse">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={`w-full max-w-[1400px] mx-auto space-y-8 md:space-y-12 pb-24 px-4 sm:px-6 md:px-8 bg-slate-50/50 min-h-screen overflow-x-hidden ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>
        
        {/* ── IMMERSIVE PREMIUM HERO ── */}
        <div className="relative w-full rounded-[40px] bg-[#0f172a] overflow-hidden p-8 md:p-14 shadow-2xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-10 group">
          {/* Animated Background Ornaments */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-1000" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          
          <div className="relative z-10 flex-1 space-y-6 text-center lg:text-start w-full">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-indigo-200 text-xs font-black uppercase tracking-widest mx-auto ${language === 'ar' ? 'lg:mx-0 lg:ml-auto' : 'lg:mx-0 lg:mr-auto'}`}>
               <Flame className="w-4 h-4 text-amber-400" />
               {language === 'ar' ? 'مسارك التعليمي' : 'YOUR LEARNING PATH'}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              {language === 'ar' ? 'اكتشف' : 'Explore'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{language === 'ar' ? 'كورساتك' : 'Your Courses'}</span>
            </h1>
            <p className="text-slate-400 font-bold text-base md:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {language === 'ar' ? 'أكمل مسيرتك التعليمية وحقق أهدافك من خلال مجموعة متنوعة من الكورسات المصممة خصيصاً لك.' : 'Continue your educational journey and achieve your goals through a variety of courses tailored for you.'}
            </p>

            {/* Stats Overview within Hero */}
            <div className={`flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4`}>
               <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 px-5 py-3 rounded-2xl">
                  <Target className="w-6 h-6 text-indigo-400" />
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{language === 'ar' ? 'قيد الدراسة' : 'IN PROGRESS'}</p>
                     <p className="text-xl font-black text-white">{inProgress}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 px-5 py-3 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{language === 'ar' ? 'مكتملة' : 'COMPLETED'}</p>
                     <p className="text-xl font-black text-white">{totalCompleted}</p>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="relative z-10 shrink-0 w-full lg:w-[400px]">
             {/* Glowing Search Box */}
             <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl relative group/search">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-[32px] opacity-0 group-hover/search:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                   <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 block">{language === 'ar' ? 'ابحث عن كورس' : 'SEARCH COURSE'}</label>
                   <div className="relative">
                      <input
                        type="text"
                        placeholder={t('courses.searchPlaceholder') || "Enter course name..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white font-bold outline-none transition-all placeholder:text-slate-500 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                      />
                      <Search className={`w-5 h-5 text-slate-500 absolute top-1/2 -translate-y-1/2 ${language === 'ar' ? 'right-4' : 'left-4'}`} />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ── FILTER & CATEGORY NAVIGATION ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
           <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Layers className="w-7 h-7 text-indigo-600" />
              {language === 'ar' ? 'المكتبة التعليمية' : 'Learning Library'}
           </h2>

           {/* Category Pills */}
           <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
             {categories.map((cat, i) => {
               const isSelected = selectedCategory === cat;
               return (
                 <button
                   key={i}
                   onClick={() => setSelectedCategory(cat)}
                   className={`shrink-0 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all border ${
                     isSelected 
                       ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200' 
                       : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                   }`}
                 >
                   {cat === "ALL" ? (language === 'ar' ? 'الكل' : 'All') : cat}
                 </button>
               )
             })}
           </div>
        </div>

        {/* ── MASONRY POSTER GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredCourses.length > 0 ? filteredCourses.map((course, index) => {
            const isFinished = course.progressPercent === 100;
            const hasStarted = course.progressPercent > 0;
            const totalLessons = Number(course.totalLessons || course.lessonsCount || course.course?.totalLessons || 0);
            const durationLabel = formatDuration(course);
            const totalQuestions = Number(course.totalQuestions || 0);
            
            const imageSrc = (course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage)
              ? getFullImageUrl(course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage)
              : null;

            return (
              <div
                key={course.id}
                onClick={() => router.push(`/courses/${course.id}`)}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-200 transition-all duration-500 group cursor-pointer flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image Section (Poster) */}
                <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden shrink-0">
                  {imageSrc ? (
                    <img src={imageSrc} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={course.title} />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-110 ${isFinished ? 'bg-emerald-50' : 'bg-gradient-to-br from-indigo-50 to-violet-100'}`}>
                      <BookOpen className={`w-16 h-16 ${isFinished ? 'text-emerald-200' : 'text-indigo-200'}`} />
                    </div>
                  )}
                  
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                  
                  {/* Badges */}
                  <div className="absolute top-4 flex justify-between items-start w-full px-4">
                     <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg border ${
                        isFinished 
                          ? 'bg-emerald-500/90 text-white border-emerald-400' 
                          : 'bg-white/90 text-slate-800 border-white/50'
                     }`}>
                        {course.subject}
                     </span>
                     {isFinished && (
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border border-emerald-400">
                           <CheckCircle2 className="w-5 h-5" />
                        </div>
                     )}
                  </div>

                  {/* Progress Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 space-y-2">
                     <div className="flex justify-between items-center">
                        <span className="text-white font-bold text-xs">{hasStarted ? (isFinished ? (language === 'ar' ? 'مكتمل' : 'Completed') : (language === 'ar' ? 'قيد الدراسة' : 'In Progress')) : (language === 'ar' ? 'لم يبدأ بعد' : 'Not Started')}</span>
                        <span className="text-amber-300 font-black text-sm">{course.progressPercent}%</span>
                     </div>
                     <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                           className={`h-full rounded-full transition-all duration-1000 ${isFinished ? 'bg-emerald-400' : 'bg-amber-400'}`}
                           style={{ width: `${course.progressPercent}%` }}
                        ></div>
                     </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-4 line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg text-[10px] font-bold">
                       <Play className="w-3.5 h-3.5 text-indigo-500" />
                       {totalLessons} {language === 'ar' ? 'دروس' : 'Lessons'}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg text-[10px] font-bold">
                       <Clock className="w-3.5 h-3.5 text-violet-500" />
                       {durationLabel}
                    </span>
                    {totalQuestions > 0 && (
                      <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg text-[10px] font-bold">
                         <Target className="w-3.5 h-3.5 text-rose-500" />
                         {totalQuestions} {language === 'ar' ? 'أسئلة' : 'Q'}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] shadow-sm ${
                     isFinished 
                       ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200 border border-emerald-100'
                       : hasStarted
                         ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200 border border-indigo-100'
                         : 'bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white border border-slate-200'
                  }`}>
                     {isFinished ? (language === 'ar' ? 'مراجعة الكورس' : 'Review Course') : hasStarted ? (language === 'ar' ? 'متابعة التعلم' : 'Continue Learning') : (language === 'ar' ? 'ابدأ الآن' : 'Start Now')}
                     <ArrowUpRight className={`w-4 h-4 transition-transform ${language === 'ar' ? 'group-hover:-translate-y-1 group-hover:translate-x-[-4px]' : 'group-hover:-translate-y-1 group-hover:translate-x-[4px] rotate-90'}`} />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-24 md:py-32 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 bg-slate-50 border-2 border-slate-100 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-slate-900 text-2xl font-black mb-2">{t('courses.noResults') || 'No Courses Found'}</h3>
              <p className="text-slate-500 font-bold max-w-sm mx-auto px-6">{language === 'ar' ? 'حاول استخدام كلمات مفتاحية أخرى أو تغيير الفلتر.' : 'Try using different keywords or changing the filter.'}</p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

