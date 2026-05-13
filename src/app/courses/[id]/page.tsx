"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from '@/lib/api';
import {
  PlaySquare, FileText, HelpCircle, ChevronLeft, ChevronRight,
  BookOpen, Clock, CheckCircle, List,
  Bookmark, MessageSquare, Download, Share2, Paperclip, 
  Check, Lock, Play, Sparkles, Calendar, ArrowRight
} from "lucide-react";

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now] = useState(new Date());

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
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
          <h2 className="text-3xl font-black text-slate-800 mb-2">الكورس غير موجود</h2>
          <button onClick={() => router.push('/courses')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black mt-4 transition-all hover:bg-indigo-600 active:scale-95">
            العودة للمقررات
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const completedCount = course.lessons?.filter((l: any) => l.progresses?.[0]?.isCompleted).length || 0;
  const totalLessons = course.lessons?.length || 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10 pb-20" dir="rtl">
        
        {/* Course Folder Header */}
        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden group min-h-[300px] flex flex-col justify-end">
          {course.coverImage ? (
            <div className="absolute top-0 left-0 w-full h-full">
              <img src={course.coverImage} className="w-full h-full object-cover" alt={course.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            </div>
          ) : (
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600">
               <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
            </div>
          )}
          
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between gap-8 items-end">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-indigo-500 text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-widest">
                  {course.subject || "Course"}
                </span>
                <span className="text-white/60 font-bold text-xs flex items-center gap-1">
                  <List className="w-3.5 h-3.5" />
                  {totalLessons} دروس
                </span>
              </div>
              <h1 className="text-3xl md:text-6xl font-black text-white leading-tight">
                {course.title}
              </h1>
              <p className="text-white/70 font-bold text-lg max-w-2xl">
                {course.description || "مرحباً بك في هذا الكورس الشامل. ابدأ الآن بتطوير مهاراتك من خلال الدروس المرتبة أدناه."}
              </p>
            </div>

            {/* Overall Progress Circle/Card */}
            <div className="bg-white/10 backdrop-blur-md text-white p-8 rounded-[40px] border border-white/20 shadow-2xl flex flex-col items-center justify-center min-w-[200px] animate-in zoom-in duration-700">
               <div className="relative w-24 h-24 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="stroke-white/10 stroke-[3] fill-none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path 
                      className="stroke-indigo-400 stroke-[3] fill-none transition-all duration-1000 ease-out" 
                      strokeDasharray={`${progressPercent}, 100`} 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-xl">
                    {progressPercent}%
                  </div>
               </div>
               <p className="text-[10px] font-black uppercase tracking-[2px] text-white/50">إجمالي التقدم</p>
            </div>
          </div>
        </div>

        {/* Lessons List View (The Roadmap) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-400" />
              محتوى المجلد
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> مكتمل</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> متاح</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div> مجدول</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {course.lessons?.map((lesson: any, index: number) => {
              const isCompleted = lesson.progresses?.[0]?.isCompleted;
              const isLocked = lesson.isLocked;
              const isActive = !isLocked;

              return (
                <div 
                  key={lesson.id}
                  onClick={() => !isLocked && router.push(`/lessons/${lesson.id}?courseId=${course.id}`)}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className={`bg-white p-6 md:p-8 rounded-[32px] border transition-all duration-500 group animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${
                    isLocked 
                      ? 'opacity-70 grayscale cursor-not-allowed border-slate-100' 
                      : 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 border-slate-100'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Index & Icon */}
                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-2xl font-black text-slate-200 group-hover:text-indigo-100 transition-colors w-8">
                        {(index + 1).toString().padStart(2, '0')}
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
                    <div className="flex-1 text-center md:text-right space-y-1">
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-1">
                         {isCompleted && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg">تم الإنجاز ✅</span>}
                         {isLocked && (
                           <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black rounded-lg flex items-center gap-1">
                             <Calendar className="w-3 h-3" />
                             ينشر في {new Date(lesson.publishDate).toLocaleDateString('ar-EG')}
                           </span>
                         )}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center justify-center md:justify-start gap-3 text-slate-400 text-xs font-bold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(lesson.duration || 0)}
                        </span>
                        {lesson.questions?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            {JSON.parse(lesson.questions).length} أسئلة
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 w-full md:w-auto">
                      {isLocked ? (
                        <div className="px-6 py-4 rounded-2xl bg-slate-50 text-slate-400 text-xs font-black flex items-center justify-center gap-2 border border-slate-100">
                          <Lock className="w-4 h-4" />
                          محتوى مجدول
                        </div>
                      ) : (
                        <button className={`w-full md:w-auto px-10 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                          isCompleted 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
                            : 'bg-indigo-600 text-white hover:bg-slate-900 hover:shadow-indigo-200'
                        }`}>
                          {isCompleted ? 'مراجعة الدرس' : 'بدء التعلم الآن'}
                          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {(!course.lessons || course.lessons.length === 0) && (
              <div className="py-24 text-center bg-white rounded-[40px] border-2 border-slate-100 border-dashed">
                <PlaySquare className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                <p className="text-slate-400 text-xl font-black">لا توجد دروس مضافة لهذا المجلد بعد</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
