"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useRouter } from "next/navigation";
import { API_URL, getFullImageUrl } from '@/lib/api';
import { fetchStudentStats, readCachedStudentStats } from "@/lib/student-stats";
import {
  PlaySquare, FileText, HelpCircle, ChevronLeft, ChevronRight,
  BookOpen, Clock, CheckCircle, List,
  Bookmark, MessageSquare, Download, Share2, Paperclip,
  Check, Lock, Play, Sparkles, Calendar, ArrowRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { t, language } = useLanguage();

  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now] = useState(new Date());
  const [courseProgressPercent, setCourseProgressPercent] = useState<number | null>(null);
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem("lms_token") ||
          localStorage.getItem("school_admin_token") ||
          localStorage.getItem("super_admin_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${API_URL}/courses/${courseId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          // Filter lessons based on visibility and publish date
          if (data.lessons) {
            data.lessons = data.lessons
              .filter((lesson: any) => {
                const isVisible = lesson.isVisible !== false;
                const isPublished = !lesson.publishDate || new Date(lesson.publishDate) <= now;
                return isVisible; // We show scheduled lessons but with a "Scheduled" state
              })
              .map((lesson: any) => {
                const isPublished = !lesson.publishDate || new Date(lesson.publishDate) <= now;
                return { ...lesson, isLocked: !isPublished };
              })
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          }
          setCourse(data);

          try {
            const cached = readCachedStudentStats();
            const token = localStorage.getItem("lms_token") ||
                          localStorage.getItem("school_admin_token") ||
                          localStorage.getItem("super_admin_token") ||
                          localStorage.getItem("token");
            const stats = cached || (token ? await fetchStudentStats(token) : null);
            const progresses = stats?.courseProgresses || [];
            const progressItem = progresses.find((p: any) =>
              String(p.id) === String(courseId) || String(p.courseId) === String(courseId)
            );
            if (progressItem && typeof progressItem.progressPercent === "number") {
              setCourseProgressPercent(progressItem.progressPercent);
            }
          } catch (e) {
            // keep fallback calculation from lesson progresses
          }
        }
      } catch (error) {
        console.error("Failed to fetch course details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, router, now]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toNumber = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const lessonDurationSeconds = (lesson: any) => {
    const directSec = toNumber(lesson.durationSeconds || lesson.videoDurationSeconds);
    if (directSec > 0) return directSec;
    const minutes = toNumber(lesson.durationMinutes || lesson.videoDurationMinutes);
    if (minutes > 0) return Math.round(minutes * 60);
    const legacy = toNumber(lesson.duration);
    return legacy > 0 ? legacy : 0;
  };

  const lessonQuestionsCount = (lesson: any) => {
    const q = lesson?.questions;
    if (Array.isArray(q)) return q.length;
    if (typeof q === "string") {
      try {
        const parsed = JSON.parse(q);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-100"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <BookOpen className="w-12 h-12 text-slate-200" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">{t('courseDetails.notFound')}</h2>
          <button onClick={() => router.push('/courses')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black mt-4 transition-all hover:bg-indigo-600 active:scale-95">
            {t('courseDetails.backToCourses')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const completedCount = course.lessons?.filter((l: any) => l.progresses?.[0]?.isCompleted).length || 0;
  const totalLessons = course.lessons?.length || 0;
  const fallbackProgressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const progressPercent = courseProgressPercent ?? fallbackProgressPercent;

  return (
    <DashboardLayout>
      <div className={`w-full max-w-[1400px] mx-auto space-y-8 md:space-y-12 pb-24 px-4 sm:px-6 md:px-8 bg-slate-50/50 min-h-screen overflow-x-hidden ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>

        {/* ── IMMERSIVE COURSE HERO ── */}
        <div className="relative w-full rounded-[40px] bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 overflow-hidden p-8 md:p-14 shadow-2xl border border-indigo-500/20 flex flex-col lg:flex-row items-center justify-between gap-10 group">
          {/* Animated Background Ornaments */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-1000" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-violet-600/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-10 w-full">
            {/* Cover Image (Poster Style) */}
            {course.coverImage && getFullImageUrl(course.coverImage) ? (
              <div className="relative w-full md:w-[280px] lg:w-[340px] aspect-[4/5] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl shrink-0 transition-transform duration-700 group-hover:scale-105 group-hover:shadow-indigo-500/50">
                <img src={getFullImageUrl(course.coverImage)!} className="w-full h-full object-cover" alt={course.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
              </div>
            ) : (
              <div className="relative w-full md:w-[280px] lg:w-[340px] aspect-[4/5] rounded-[32px] overflow-hidden bg-white/5 backdrop-blur-md shrink-0 border border-white/10 shadow-2xl flex items-center justify-center text-white/50 transition-transform duration-700 group-hover:scale-105">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]"></div>
                <BookOpen className="w-24 h-24 opacity-30 animate-pulse" />
              </div>
            )}

            {/* Course Information */}
            <div className="flex-1 flex flex-col justify-center space-y-6 text-center md:text-start w-full">
              <div className={`flex flex-wrap items-center justify-center md:justify-start gap-3`}>
                <span className="px-4 py-2 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/10 text-indigo-100 border border-white/20 backdrop-blur-md flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{course.subject || (language === 'ar' ? "كورس تعليمي" : "Course")}</span>
                </span>
                <span className="px-4 py-2 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/5 text-white/70 border border-white/10 backdrop-blur-md flex items-center gap-2">
                  <List className="w-4 h-4 text-white/50" />
                  <span>{totalLessons} {t('courseDetails.lessons')}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                {course.title}
              </h1>
              
              <p className="text-indigo-100/80 font-bold text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl whitespace-pre-line">
                {course.description || t('courseDetails.defaultDescription')}
              </p>

              {/* Progress & Quick Stats */}
              <div className="pt-6 flex items-center justify-center md:justify-start gap-6 border-t border-white/10 mt-auto">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-[24px]">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle className="stroke-white/10 stroke-[4] fill-none" cx="18" cy="18" r="15.9155" />
                      <circle
                        className="stroke-emerald-400 stroke-[4] stroke-linecap-round fill-none transition-all duration-1000 ease-out"
                        strokeDasharray={`${progressPercent}, 100`}
                        cx="18"
                        cy="18"
                        r="15.9155"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-white">
                      {progressPercent}%
                    </div>
                  </div>
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-indigo-200">{t('courseDetails.totalProgress')}</p>
                    <p className="text-sm font-bold text-white">
                      {progressPercent === 100 ? (language === 'ar' ? 'اكتمل الكورس بالكامل! 🎉' : 'Course fully completed! 🎉') : (language === 'ar' ? 'استمر في التعلم برافو' : 'Keep up the good work')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List View (The Roadmap) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-400" />
              {t('courseDetails.folderContent')}
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {t('courseDetails.completed')}</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> {t('courseDetails.available')}</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div> {t('courseDetails.scheduled')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(() => {
              if (!course.lessons || course.lessons.length === 0) {
                return (
                  <div className="py-24 text-center bg-white rounded-[40px] border-2 border-slate-100 border-dashed animate-in fade-in duration-500">
                    <PlaySquare className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                    <p className="text-slate-400 text-xl font-black">{t('courseDetails.noLessonsAdded')}</p>
                  </div>
                );
              }

              // Group lessons by domain while preserving their original sorted order
              const groupedByDomain: { domainName: string; lessons: any[] }[] = [];
              course.lessons.forEach((lesson: any) => {
                const domainName = lesson.domain?.trim() || "";
                let existingGroup = groupedByDomain.find(g => g.domainName === domainName);
                if (!existingGroup) {
                  existingGroup = { domainName, lessons: [] };
                  groupedByDomain.push(existingGroup);
                }
                existingGroup.lessons.push(lesson);
              });

              let globalIndexCounter = 0;

              return groupedByDomain.map((group, groupIdx) => {
                const isDomainless = !group.domainName;
                
                return (
                  <div key={group.domainName || `domainless-${groupIdx}`} className="space-y-6">
                    {!isDomainless && (
                      <div className="bg-indigo-50/50 border border-indigo-100/50 p-6 rounded-[28px] flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 my-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">
                              {language === 'ar' ? 'المجال الأكاديمي' : 'Academic Domain'}
                            </span>
                            <h3 className="text-xl font-black text-slate-800 leading-none">
                              {group.domainName}
                            </h3>
                          </div>
                        </div>
                        <span className="px-4 py-2 bg-white rounded-full text-xs font-black text-indigo-700 border border-indigo-100 shadow-sm shrink-0">
                          {group.lessons.length} {language === 'ar' ? 'دروس' : 'Lessons'}
                        </span>
                      </div>
                    )}
                    
                    <div className={`grid grid-cols-1 gap-4 ${!isDomainless ? 'pl-0 md:pr-4 rtl:md:pl-4' : ''}`}>
                      {group.lessons.map((lesson: any) => {
                        const isCompleted = lesson.progresses?.[0]?.isCompleted;
                        const isLocked = lesson.isLocked;
                        const lessonIdx = globalIndexCounter++;
                        
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => !isLocked && router.push(`/lessons/${lesson.id}?courseId=${course.id}`)}
                            style={{ animationDelay: `${lessonIdx * 100}ms` }}
                            className={`bg-white p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[32px] border transition-all duration-500 group animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${
                              isLocked
                                ? 'opacity-70 grayscale cursor-not-allowed border-slate-100'
                                : 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 border-slate-100'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                              {/* Index & Icon */}
                              <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                                <span className="text-2xl font-black text-slate-200 group-hover:text-indigo-100 transition-colors w-8">
                                  {(lessonIdx + 1).toString().padStart(2, '0')}
                                </span>
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 ${
                                  isCompleted
                                    ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100'
                                    : isLocked
                                      ? 'bg-slate-100 text-slate-400 shadow-none'
                                      : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'
                                  }`}>
                                  {isCompleted ? <CheckCircle className="w-8 h-8" /> : isLocked ? <Lock className="w-7 h-7" /> : <Play className="w-7 h-7 fill-current" />}
                                </div>
                              </div>

                              {/* Lesson Info */}
                              <div className="flex-1 text-center md:text-start space-y-1">
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-1">
                                  {isCompleted && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg">{t('courseDetails.done')}</span>}
                                  {isLocked && (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black rounded-lg flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {t('courseDetails.publishedOn')} {new Date(lesson.publishDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                  {lesson.title}
                                </h3>
                                <div className="flex items-center justify-center md:justify-start gap-3 text-slate-400 text-xs font-bold">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDuration(lessonDurationSeconds(lesson))}
                                  </span>
                                  {lessonQuestionsCount(lesson) > 0 && (
                                    <span className="flex items-center gap-1">
                                      <HelpCircle className="w-3.5 h-3.5" />
                                      {lessonQuestionsCount(lesson)} {t('courseDetails.questions')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action */}
                              <div className="shrink-0 w-full md:w-auto">
                                {isLocked ? (
                                  <div className="px-6 py-4 rounded-2xl bg-slate-50 text-slate-400 text-xs font-black flex items-center justify-center gap-2 border border-slate-100">
                                    <Lock className="w-4 h-4" />
                                    {t('courseDetails.scheduledContent')}
                                  </div>
                                ) : (
                                  <button className={`w-full md:w-auto px-10 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                                    isCompleted
                                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                      : 'bg-indigo-600 text-white hover:bg-slate-900 hover:shadow-indigo-200'
                                  }`}>
                                    {isCompleted ? t('courseDetails.reviewLesson') : t('courseDetails.startLearningNow')}
                                    <ChevronLeft className={`w-4 h-4 transition-transform ${language === 'ar' ? 'group-hover:-translate-x-2' : 'group-hover:translate-x-2 rotate-180'}`} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
