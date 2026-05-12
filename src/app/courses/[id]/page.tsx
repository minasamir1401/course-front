"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from '@/lib/api';
import dynamic from 'next/dynamic';
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });
import { 
  PlaySquare, FileText, HelpCircle, ChevronLeft, ChevronRight,
  ChevronDown, ArrowLeft, BookOpen, Clock, CheckCircle, List,
  Bookmark, MessageSquare, Download, Share2, Paperclip, BarChart, Calendar,
  Check, Lock, Play
} from "lucide-react";

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('نظرة عامة');
  const lastProgressSyncRef = React.useRef(0);

  const handleProgress = async (state: { playedSeconds: number }) => {
    const activeLesson = course?.lessons?.[activeLessonIndex];
    if (!activeLesson) return;

    // VideoPlayer already throttles updates to every 5 seconds, no need to double throttle here.
    const token = localStorage.getItem("lms_token") || 
                  localStorage.getItem("school_admin_token") || 
                  localStorage.getItem("super_admin_token");

    if (token) {
      try {
        const res = await fetch(`${API_URL}/progress/lesson/${activeLesson.id}`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ watchedSeconds: Math.floor(state.playedSeconds) })
        });
        
        if (res.ok) {
          const data = await res.json();
          // Always update the lesson's progress in state so we can show real-time progress
          if (data.progress) {
            setCourse((prev: any) => {
              if (!prev) return prev;
              const newLessons = [...prev.lessons];
              newLessons[activeLessonIndex] = {
                ...newLessons[activeLessonIndex],
                progresses: [data.progress]
              };
              return { ...prev, lessons: newLessons };
            });
          }
        }
      } catch (e) {
        console.error("Failed to sync progress");
      }
    }
  };

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
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.lessons) {
            data.lessons = data.lessons.map((lesson: any) => {
              let parsedQuestions = [];
              let parsedAttachments = [];
              
              try {
                parsedQuestions = typeof lesson.questions === 'string' ? JSON.parse(lesson.questions) : (lesson.questions || []);
              } catch (e) {
                console.error("Failed to parse questions", e);
              }
              
              try {
                parsedAttachments = typeof lesson.attachments === 'string' ? JSON.parse(lesson.attachments) : (lesson.attachments || []);
              } catch (e) {
                console.error("Failed to parse attachments", e);
              }

              return {
                ...lesson,
                questions: Array.isArray(parsedQuestions) ? parsedQuestions : [],
                attachments: Array.isArray(parsedAttachments) ? parsedAttachments : []
              };
            });

            // Auto-select first incomplete lesson
            const firstIncompleteIdx = data.lessons.findIndex((l: any) => 
              !(l.progresses && l.progresses.length > 0 && l.progresses[0].isCompleted)
            );
            if (firstIncompleteIdx !== -1) {
              setActiveLessonIndex(firstIncompleteIdx);
            }
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
  }, [courseId, router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <BookOpen className="w-20 h-20 text-slate-300 mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-2">الكورس غير موجود</h2>
          <button onClick={() => router.push('/courses')} className="btn-primary mt-6">
            العودة للمقررات
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const activeLesson = course.lessons && course.lessons.length > 0 ? course.lessons[activeLessonIndex] : null;

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
      if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
      return url;
    } catch {
      return url;
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div className="bg-[#f8fafc] min-h-[calc(100vh-80px)] -mt-6 -mx-6 p-4 md:p-8">
        <div className="max-w-[1700px] mx-auto space-y-6">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold mb-6 overflow-x-auto whitespace-nowrap no-scrollbar pb-2">
             <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => router.push('/dashboard')}>الرئيسية</span> 
             <ChevronLeft className="w-4 h-4 shrink-0" />
             <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => router.push('/courses')}>الكورسات</span> 
             <ChevronLeft className="w-4 h-4 shrink-0" />
             <span className="text-indigo-600 cursor-pointer transition-colors">{course.subject || "المادة"}</span> 
             <ChevronLeft className="w-4 h-4 shrink-0" />
             <span className="text-slate-800">{activeLesson?.title || "تفاصيل الدرس"}</span>
          </div>

          {/* Header Title */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight">{activeLesson?.title || "عنوان الدرس"}</h1>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500 font-bold">{course.title}</p>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <p className="text-xs font-bold text-indigo-600">
                    تم {course.lessons?.filter((l: any) => l.progresses?.[0]?.isCompleted).length || 0} فيديو ومتبقي {(course.lessons?.length || 0) - (course.lessons?.filter((l: any) => l.progresses?.[0]?.isCompleted).length || 0)}
                  </p>
                </div>
                {/* Progress Mini Bar */}
                <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-500" 
                    style={{ width: `${(course.lessons?.reduce((acc: number, l: any) => {
                      if (l.progresses?.[0]?.isCompleted) return acc + 100;
                      if (l.progresses?.[0]?.watchedSeconds && l.duration) {
                        return acc + Math.min(100, (l.progresses[0].watchedSeconds / l.duration) * 100);
                      }
                      return acc;
                    }, 0) || 0) / (course.lessons?.length || 1)}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <button 
                  onClick={() => router.push(`/lessons/${activeLesson?.id}?courseId=${course.id}`)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white text-sm font-black transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-600/20`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  دخول الدرس الآن
                </button>
               <button className="w-12 h-12 shrink-0 rounded-xl border border-indigo-100 bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors">
                 <Bookmark className="w-5 h-5" />
               </button>
             </div>
          </div>

          {/* MAIN 3-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
             
            {/* ---------------- RIGHT SIDEBAR (3 columns) ---------------- */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6 order-2 xl:order-1">
               <button onClick={() => router.push('/courses')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4 w-fit">
                 <ChevronRight className="w-5 h-5" />
                 العودة إلى الكورس
               </button>
               <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-5 border-b border-slate-100">
                     <h3 className="font-bold text-slate-900">محتوى الكورس</h3>
                  </div>
                  <div className="border-b border-slate-50">
                     <button className="w-full p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                        <div className="text-right">
                           <h4 className="font-bold text-sm text-slate-800">دروس الكورس المتاحة</h4>
                           <p className="text-[10px] text-slate-400 font-medium mt-1">{course.lessons?.length || 0} دروس</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                     </button>
                     <div className="p-2 space-y-1 bg-slate-50/50">
                        {course.lessons?.map((lesson: any, idx: number) => {
                           const isActive = idx === activeLessonIndex;
                           const isCompleted = lesson.progresses && lesson.progresses.length > 0 && lesson.progresses[0].isCompleted;
                           return (
                             <button 
                               key={lesson.id} 
                               onClick={() => router.push(`/lessons/${lesson.id}?courseId=${course.id}`)}
                               className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 shadow-sm border border-indigo-100' : 'hover:bg-slate-100/50 border border-transparent'}`}
                             >
                                <div className="flex-1 overflow-hidden pr-2">
                                  <div className="flex items-center gap-3 text-right">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : isCompleted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-slate-200 text-slate-400'}`}>
                                         {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[4]" /> : isActive ? <Play className="w-2.5 h-2.5 fill-current ml-0.5" /> : <Lock className="w-3 h-3" />}
                                      </div>
                                     <span className={`text-xs font-bold leading-tight line-clamp-1 text-right ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        الدرس {idx + 1}: {lesson.title}
                                     </span>
                                  </div>
                                  {lesson.progresses?.[0] && !isCompleted && (
                                    <div className="w-full h-1 bg-slate-200 rounded-full mt-2 ml-2 overflow-hidden flex-1">
                                      <div 
                                        className="h-full bg-indigo-500 transition-all duration-300" 
                                        style={{ width: `${Math.min(100, (lesson.progresses[0].watchedSeconds / (lesson.duration > 0 ? lesson.duration : 10)) * 100)}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                                   {lesson.duration ? formatDuration(lesson.duration) : '00:00'}
                                </span>
                             </button>
                           )
                        })}
                     </div>
                  </div>

               </div>
               <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
                  <h3 className="font-black text-slate-900 mb-5 text-lg">الموارد المرتبطة</h3>
                  <div className="space-y-3">
                     {activeLesson?.attachments && activeLesson.attachments.length > 0 ? (
                       activeLesson.attachments.map((res: any, i: number) => {
                         const getColors = (type: string) => {
                           switch(type) {
                             case 'PDF': return { color: "text-rose-500", bg: "bg-rose-50" };
                             case 'PPT': return { color: "text-amber-500", bg: "bg-amber-50" };
                             case 'DOC': return { color: "text-blue-500", bg: "bg-blue-50" };
                             case 'XLS': return { color: "text-emerald-500", bg: "bg-emerald-50" };
                             case 'IMAGE': return { color: "text-purple-500", bg: "bg-purple-50" };
                             default: return { color: "text-slate-500", bg: "bg-slate-50" };
                           }
                         };
                         const styles = getColors(res.type);
                         return (
                           <a href={res.url || '#'} target={res.url ? "_blank" : "_self"} rel="noopener noreferrer" key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-slate-50 hover:border-indigo-100 transition-all group cursor-pointer shadow-sm hover:shadow-md">
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-xl ${styles.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm`}>
                                   <FileText className={`w-5 h-5 ${styles.color}`} />
                                 </div>
                                 <div className="text-right">
                                   <h4 className="text-[11px] font-bold text-slate-800 mb-0.5 group-hover:text-indigo-600 transition-colors">{res.name}</h4>
                                   <p className="text-[10px] text-slate-400 font-bold">{res.type} Document</p>
                                 </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors shrink-0">
                                 <Download className="w-4 h-4" />
                              </div>
                           </a>
                         );
                       })
                     ) : (
                       <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                         <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                         <p className="text-[10px] font-bold text-slate-500">لا توجد موارد إضافية لهذا الدرس</p>
                       </div>
                     )}
                  </div>
               </div>
            </div>

            {/* ---------------- CENTER CONTENT (9 columns) ---------------- */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6 order-1 xl:order-2">
               
               {/* Header Title REMOVED AND MOVED ABOVE GRID */}

               {/* Video Player */}
               <div className="bg-[#0b1120] rounded-3xl overflow-hidden aspect-video relative shadow-2xl border-[6px] border-white ring-1 ring-slate-100 w-full">
                  {activeLesson?.videoUrl ? (
                     <VideoPlayer
                       url={activeLesson.videoUrl}
                       onProgress={handleProgress}
                     />
                  ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                       <PlaySquare className="w-16 h-16 mb-4 opacity-50" />
                       <p className="font-bold">لا يوجد فيديو متاح لهذا الدرس</p>
                     </div>
                  )}
               </div>

               {/* Tabs and Content */}
               <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
                     {['نظرة عامة', 'الملاحظات', 'المرفقات', 'أسئلة الطلاب'].map((tab) => (
                       <button 
                         key={tab}
                         onClick={() => setActiveTab(tab)}
                         className={`px-6 py-5 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors flex-1 text-center ${activeTab === tab ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                       >
                         {tab}
                       </button>
                     ))}
                  </div>

                  <div className="p-6 md:p-8 space-y-8">
                     {activeTab === 'نظرة عامة' && (
                        <>
                           <div 
                             className="text-slate-600 leading-relaxed text-sm md:text-base font-medium"
                             dangerouslySetInnerHTML={{ __html: activeLesson?.summary || "في هذا الدرس سنتعلم المفاهيم الأساسية، ونقوم بتطبيق ذلك على مسائل عملية مبنية من الحياة الواقعية لتحقيق فهم أعمق للمادة." }}
                           />

                           <div>
                              <h3 className="text-lg font-black text-slate-900 mb-5">أهداف الدرس</h3>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {[
                                   "أن يتعرف الطالب على المفاهيم الأساسية للدرس.",
                                   "أن يحدد النقاط الرئيسية والتفاصيل المهمة.",
                                   "أن يستخدم القواعد لحل المسائل بكفاءة.",
                                   "أن يطبق المفاهيم على مسائل عملية واقعية."
                                 ].map((obj, i) => (
                                   <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                      <span className="leading-snug">{obj}</span>
                                   </li>
                                 ))}
                              </ul>
                           </div>

                           <div className="flex justify-center pt-6 border-t border-slate-100">
                              <div className="flex flex-col items-center justify-center text-center gap-2 bg-[#f8fafc] p-4 px-8 rounded-2xl border border-slate-100">
                                 <Clock className="w-6 h-6 text-indigo-500 mb-1" />
                                 <p className="text-[11px] font-bold text-slate-400">مدة الفيديو</p>
                                 <p className="text-sm font-black text-slate-800">{activeLesson?.duration ? formatDuration(activeLesson.duration) : '00:00'} دقيقة</p>
                              </div>
                           </div>
                        </>
                     )}
                     {activeTab === 'الملاحظات' && (
                        <div 
                          className="bg-amber-50 border border-amber-100 p-6 rounded-2xl text-amber-900 leading-relaxed font-medium"
                          dangerouslySetInnerHTML={{ __html: activeLesson?.notes || "لا توجد ملاحظات إضافية لهذا الدرس." }}
                        />
                     )}
                     {activeTab === 'المرفقات' && (
                        <div className="space-y-4">
                          {activeLesson?.attachments && activeLesson.attachments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {activeLesson.attachments.map((res: any, i: number) => {
                                const getColors = (type: string) => {
                                  switch(type) {
                                    case 'PDF': return { color: "text-rose-500", bg: "bg-rose-50" };
                                    case 'PPT': return { color: "text-amber-500", bg: "bg-amber-50" };
                                    case 'DOC': return { color: "text-blue-500", bg: "bg-blue-50" };
                                    case 'XLS': return { color: "text-emerald-500", bg: "bg-emerald-50" };
                                    case 'IMAGE': return { color: "text-purple-500", bg: "bg-purple-50" };
                                    default: return { color: "text-slate-500", bg: "bg-slate-50" };
                                  }
                                };
                                const styles = getColors(res.type);
                                return (
                                  <a 
                                    href={res.url || '#'} 
                                    target={res.url ? "_blank" : "_self"} 
                                    rel="noopener noreferrer"
                                    key={i} 
                                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group bg-white"
                                  >
                                    <div className={`w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                      <FileText className={`w-6 h-6 ${styles.color}`} />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{res.name || "ملف بدون اسم"}</h4>
                                      <p className="text-xs text-slate-400 font-bold mt-0.5">{res.type} Document</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                      <Download className="w-5 h-5" />
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                              <Paperclip className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                              <p className="font-bold text-slate-700">لا توجد مرفقات</p>
                              <p className="text-sm text-slate-500">لم يقم المعلم برفع أي ملفات لهذا الدرس.</p>
                            </div>
                          )}
                        </div>
                     )}
                     {activeTab === 'أسئلة الطلاب' && (
                        <div className="space-y-4">
                          {activeLesson?.questions?.map((q: any, i: number) => (
                             <div key={i} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                               <p className="font-bold text-slate-900 mb-3">{q.question}</p>
                               <div 
                                 className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium leading-relaxed"
                                 dangerouslySetInnerHTML={{ __html: q.answer }}
                               />
                             </div>
                          )) || (
                            <div className="text-center py-8">
                              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-slate-500 font-bold">لا توجد أسئلة حالياً.</p>
                            </div>
                          )}
                        </div>
                     )}
                  </div>
               </div>
               
               <div className="flex justify-between items-center">
                 <button 
                   onClick={() => setActiveLessonIndex(prev => Math.max(0, prev - 1))}
                   disabled={activeLessonIndex === 0}
                   className={`flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold transition-colors shadow-sm ${activeLessonIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                 >
                   <ChevronRight className="w-5 h-5" />
                   الدرس السابق
                 </button>
                 <button 
                   onClick={() => setActiveLessonIndex(prev => Math.min((course.lessons?.length || 1) - 1, prev + 1))}
                   disabled={activeLessonIndex === (course.lessons?.length || 1) - 1}
                   className={`flex items-center gap-2 bg-[#4F46E5] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md shadow-indigo-200 ${activeLessonIndex === (course.lessons?.length || 1) - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4338CA]'}`}
                 >
                   الدرس التالي
                   <ChevronLeft className="w-5 h-5" />
                 </button>
               </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
