"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BookOpen,
  Play,
  Clock,
  CheckCircle2,
  Sparkles,
  Search,
  Target,
  ArrowUpRight,
  MoreVertical,
  Filter
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
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("lms_token");
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

  // Format course total duration from seconds to human-readable string
  const formatDuration = (course: any): string => {
    // Primary: use totalDurationSeconds returned by the new backend stats endpoint
    const seconds = toNumber(course.totalDurationSeconds);
    if (seconds > 0) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0 && minutes > 0) {
        return language === 'ar' ? `${hours}س ${minutes}د` : `${hours}h ${minutes}m`;
      }
      if (hours > 0) {
        return language === 'ar' ? `${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}` : `${hours}h`;
      }
      if (minutes > 0) {
        return language === 'ar' ? `${minutes} دقيقة` : `${minutes}m`;
      }
      return language === 'ar' ? 'أقل من دقيقة' : '< 1m';
    }
    // Fallback for legacy fields
    const fallbackHours = (() => {
      const fromMinutes = toNumber(course.totalDurationMinutes || course.durationMinutes);
      if (fromMinutes > 0) return Math.max(1, Math.round(fromMinutes / 60));
      const fromHours = toNumber(course.totalDurationHours || course.durationHours);
      if (fromHours > 0) return Math.max(1, Math.round(fromHours));
      return 0;
    })();
    if (fallbackHours > 0) {
      return language === 'ar' ? `${fallbackHours} ساعة` : `${fallbackHours}h`;
    }
    return language === 'ar' ? 'غير محدد' : 'Unknown';
  };

  const filteredCourses = courses.filter(course =>
    (course.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.subject || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-100"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-24 px-1 sm:px-2 md:px-4 overflow-x-hidden" dir={language === 'ar' ? "rtl" : "ltr"}>
        
        {/* ── PREMIUM HEADER ── */}
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] premium-gradient-primary p-8 md:p-16 group shadow-2xl shadow-indigo-500/20">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
           <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 blur-[100px] rounded-full animate-pulse" />
           
           <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8 md:gap-10">
               <div className={`space-y-4 md:space-y-6 w-full lg:w-auto ${language === 'ar' ? 'text-center lg:text-right' : 'text-center lg:text-left'}`}>
                 <div className="inline-flex items-center gap-3 px-5 py-2 glass rounded-full border-white/20">
                    <Sparkles className="w-4 h-4 text-amber-300 floating" />
                    <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest">{t('courses.customPath')}</span>
                 </div>
                 <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
                    {t('courses.explore')} <span className="text-indigo-200">{t('courses.yourCourses')}</span>
                 </h1>
                 <p className="text-indigo-50/80 font-medium text-base md:text-lg max-w-xl leading-relaxed">
                    {t('courses.subtitle')}
                 </p>
              </div>

              <div className="w-full lg:w-[450px]">
                 <div className="relative group">
                    <input
                      type="text"
                      placeholder={t('courses.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full glass rounded-2xl md:rounded-[32px] py-4 md:py-6 pr-12 md:pr-14 pl-6 md:pl-8 text-white font-bold outline-none border-white/20 focus:border-white/40 focus:bg-white/10 transition-all placeholder:text-indigo-200 text-sm md:text-base ${language === 'en' ? 'pr-6 pl-12 md:pl-14' : ''}`}
                    />
                    <Search className={`w-5 h-5 md:w-6 md:h-6 text-indigo-200 absolute top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors ${language === 'ar' ? 'right-5 md:right-6' : 'left-5 md:left-6'}`} />
                 </div>
              </div>
           </div>
        </div>

        {/* ── COURSE LIST VIEW ── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 md:px-8">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                   <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{t('courses.allCourses')} ({filteredCourses.length})</h2>
             </div>
             <div className="flex items-center gap-3">
                <button className="p-2.5 md:p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-600 transition-all">
                   <Filter className="w-5 h-5" />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredCourses.length > 0 ? filteredCourses.map((course, index) => {
              const isFinished = course.progressPercent === 100;
              const hasStarted = course.progressPercent > 0;
              const totalLessons = Number(course.totalLessons || course.lessonsCount || course.course?.totalLessons || 0);
              const durationLabel = formatDuration(course);
              const totalQuestions = Number(course.totalQuestions || 0);

              return (
                <div
                  key={course.id}
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="premium-card rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-3 sm:p-4 md:p-6 group cursor-pointer animate-in fade-in slide-in-from-bottom-6"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8">
                    
                    {/* Thumbnail & Info */}
                    <div className="flex flex-1 items-center gap-3 sm:gap-4 md:gap-6 w-full lg:w-auto">
                      <div className={`relative w-20 h-20 md:w-40 md:h-28 rounded-2xl md:rounded-[28px] overflow-hidden shrink-0 shadow-2xl transition-transform duration-500 group-hover:scale-105 border border-slate-100 ${
                        isFinished ? 'shadow-emerald-100' : 'shadow-indigo-100'
                      }`}>
                        {(course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage) ? (
                          <img src={getFullImageUrl(course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage) || ""} className="w-full h-full object-cover" alt={course.title || course.course?.title} />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isFinished ? 'bg-emerald-50 text-emerald-500' : 'premium-gradient-primary text-white/40'
                          }`}>
                            <BookOpen className="w-8 h-8 md:w-10 md:h-10" />
                          </div>
                        )}
                        {isFinished && (
                           <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
                           </div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
                         <div className="flex items-center gap-3">
                            <span className={`text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 rounded-lg uppercase tracking-widest border ${
                               isFinished ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                               {course.subject}
                            </span>
                             {hasStarted && !isFinished && (
                               <span className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-indigo-500 animate-pulse">
                                  <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                  {t('courses.inProgress')}
                               </span>
                            )}
                         </div>
                        <h3 className="text-base sm:text-lg md:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate tracking-tight">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-3 md:gap-4 text-slate-400 font-bold text-[10px] md:text-xs flex-wrap">
                           <span className="flex items-center gap-1"><Clock className="w-3 md:w-3.5 h-3 md:h-3.5" /> {durationLabel}</span>
                           <span className="flex items-center gap-1"><Play className="w-3 md:w-3.5 h-3 md:h-3.5" /> {totalLessons} {t('courses.lessons')}</span>
                           {totalQuestions > 0 && (
                             <span className="flex items-center gap-1">
                               <svg xmlns="http://www.w3.org/2000/svg" className="w-3 md:w-3.5 h-3 md:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                               {totalQuestions} {language === 'ar' ? 'سؤال' : 'Q'}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Metrics */}
                    <div className="w-full lg:w-72 flex flex-col gap-3 md:gap-4 md:px-4">
                      <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black">
                        <span className="text-slate-400 uppercase tracking-widest">{t('courses.totalProgress')}</span>
                        <span className={`px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs ${isFinished ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {course.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 md:h-2.5 bg-slate-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                            isFinished ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${course.progressPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-bold text-center">
                         {isFinished ? t('courses.wellDone') : course.lastAccessedAt ? `${t('courses.lastActivity')}: ${new Date(course.lastAccessedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}` : t('courses.startStudyNow')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="w-full lg:w-auto flex items-center gap-3">
                       <button className={`flex-1 lg:flex-none px-6 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${
                          isFinished 
                          ? 'bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white' 
                          : 'bg-indigo-600 text-white hover:bg-slate-900 hover:shadow-indigo-200'
                       }`}>
                         {isFinished ? t('courses.reviewCourse') : hasStarted ? t('courses.continueLearning') : t('courses.startNow')}
                         <ArrowUpRight className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${language === 'ar' ? 'group-hover:-translate-y-1 group-hover:translate-x-[-4px]' : 'group-hover:-translate-y-1 group-hover:translate-x-[4px] rotate-90'}`} />
                       </button>
                       <button className="p-4 md:p-5 rounded-xl md:rounded-[24px] border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all shrink-0">
                          <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                       </button>
                    </div>

                  </div>
                </div>
              );
            }) : (
              <div className="py-24 md:py-40 text-center bg-white rounded-[40px] md:rounded-[60px] border-4 border-dashed border-slate-100 animate-in fade-in zoom-in duration-700 mx-4">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                  <Search className="w-10 h-10 md:w-12 md:h-12 text-slate-200" />
                </div>
                <h3 className="text-slate-900 text-2xl md:text-3xl font-black mb-3 tracking-tight">{t('courses.noResults')}</h3>
                <p className="text-slate-400 font-bold text-base md:text-lg max-w-md mx-auto px-6">{t('courses.tryOtherKeywords')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
