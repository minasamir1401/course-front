"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
import {
  Play, Pause, ChevronLeft, ChevronRight, CheckCircle,
  HelpCircle, BookOpen, Target, Layout, Monitor,
  MessageSquare, FileDown, Clock, Info, X, Maximize,
  Volume2, Settings, ArrowRight, ArrowLeft, Star, Award, RotateCcw,
  CheckCircle2, AlertCircle, Sparkles, Lock, Timer,
  ArrowUpRight, ListOrdered, TrendingUp, GraduationCap, FileText
} from "lucide-react";
import dynamic from 'next/dynamic';
import { useNotification } from "@/context/NotificationContext";

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });

export default function LessonPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = searchParams.get('courseId');
  const lessonId = params.id as string;
  const { showToast } = useNotification();

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  // Player State
  const [currentStage, setCurrentStage] = useState<'welcome' | 'slides' | 'assignments' | 'exercises' | 'summary'>('welcome');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("lms_token") || localStorage.getItem("super_admin_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/lessons/${lessonId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();

        // Check Cut-off Date
        if (data.cutOffDate) {
          const now = new Date();
          const cutOff = new Date(data.cutOffDate);
          if (now > cutOff) {
            setIsExpired(true);
            setIsLoading(false);
            return;
          }
        }

        // Parse metadata
        let slides = [];
        let questions = [];
        let assignments = [];
        let attachments = [];

        try { slides = typeof data.slides === 'string' ? JSON.parse(data.slides) : (data.slides || []); } catch (e) { }
        try { questions = typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || []); } catch (e) { }
        try { assignments = typeof data.assignments === 'string' ? JSON.parse(data.assignments) : (data.assignments || []); } catch (e) { }
        try { attachments = typeof data.attachments === 'string' ? JSON.parse(data.attachments) : (data.attachments || []); } catch (e) { }

        const sanitizedQuestions = Array.isArray(questions) ? questions.map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        })) : [];

        setLesson({
          ...data,
          slides: Array.isArray(slides) && slides.length ? slides : [{ title: "مقدمة الدرس", content: data.summary || "أهلاً بك في هذا الدرس." }],
          questions: sanitizedQuestions,
          assignments: Array.isArray(assignments) ? assignments : [],
          attachments: Array.isArray(attachments) ? attachments : []
        });

        if (data.courseId) {
          const cRes = await fetch(`${API_URL}/courses/${data.courseId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (cRes.ok) setCourse(await cRes.json());
        }
      }
    } catch (error) {
      console.error("Failed to fetch lesson data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async (state: { playedSeconds: number }) => {
    try {
      const token = localStorage.getItem("lms_token") || localStorage.getItem("super_admin_token");
      if (!token) return;

      await fetch(`${API_URL}/progress/lesson/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ watchedSeconds: Math.floor(state.playedSeconds) })
      });
    } catch (error) {
      console.error("Progress save failed", error);
    }
  };

  const handleAnswerSelect = (option: string) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: option };
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < lesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      let finalScore = 0;
      lesson.questions.forEach((q: any, index: number) => {
        if (answers[index] === q.correctAnswer) {
          finalScore += (q.points || 1);
        }
      });
      setScore(finalScore);
      setCurrentStage('summary');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 border-[6px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-200 mx-auto"></div>
            <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] animate-pulse">جاري تحضير الدرس...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isExpired) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
          <div className="w-24 h-24 bg-red-500/10 rounded-[40px] flex items-center justify-center mb-8 border border-red-500/20 animate-bounce">
            <Timer className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">انتهت صلاحية الوصول!</h2>
          <p className="text-slate-500 text-lg font-bold max-w-md mb-12 leading-relaxed">
            نأسف، لقد تجاوز هذا الدرس تاريخ الانتهاء المحدد له ({new Date(lesson?.cutOffDate).toLocaleDateString('ar-EG')}). يرجى التواصل مع الإدارة إذا كنت تعتقد أن هناك خطأ.
          </p>
          <button 
            onClick={() => router.push('/courses')}
            className="bg-indigo-600 text-white px-12 py-5 rounded-[22px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-100"
          >
            العودة للمقررات
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
           <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
              <p className="text-slate-400 font-black text-xl">المحتوى غير متاح حالياً</p>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-12 pb-24" dir="rtl">
        
        {/* ── TOP HEADER BAR ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.back()} 
                className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
              >
                <ArrowRight className="w-6 h-6 text-slate-900" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">{lesson.title}</h1>
                <p className="text-indigo-600 font-bold text-sm flex items-center gap-2">
                   <BookOpen className="w-4 h-4" />
                   {course?.title || "كورس تعليمي"}
                </p>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-1.5 p-2 bg-slate-100/50 rounded-2xl">
                {['welcome', 'slides', 'assignments', 'exercises', 'summary'].map((s) => (
                  <div key={s} className={`h-2 rounded-full transition-all duration-500 ${currentStage === s ? 'w-10 bg-indigo-600 shadow-lg shadow-indigo-100' : 'w-4 bg-slate-200'}`}></div>
                ))}
              </div>
              <div className="h-10 w-px bg-slate-100 mx-2"></div>
              <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 shadow-xl shadow-indigo-100">
                <Star className="w-5 h-5 fill-current text-amber-300" />
                {score} نقطة مكتسبة
              </div>
           </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div className={`grid grid-cols-1 items-start ${currentStage === 'welcome' || currentStage === 'summary' ? 'xl:grid-cols-12' : 'xl:grid-cols-1'} gap-10`}>
          
          <div className={`${currentStage === 'welcome' || currentStage === 'summary' ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-10`}>
            
            {/* ── VIDEO PLAYER (VISIBLE ONLY IN WELCOME/SUMMARY) ── */}
            {(currentStage === 'welcome' || currentStage === 'summary') && (
              <div className="premium-card rounded-[40px] md:rounded-[55px] p-4 md:p-6 relative overflow-hidden shadow-2xl shadow-indigo-50/50">
                 <div className="aspect-video bg-slate-950 rounded-[35px] overflow-hidden relative ring-4 ring-slate-50 group">
                    {lesson.videoUrl ? (
                      <VideoPlayer url={lesson.videoUrl} onProgress={handleProgressUpdate} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 font-black p-8 gap-4">
                         <Lock className="w-12 h-12 opacity-20" />
                         <span className="opacity-40">لا يوجد فيديو متوفر حالياً لهذا الدرس</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none group-hover:opacity-0 transition-opacity" />
                 </div>
                 
                 <div className="mt-6 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                          <Monitor className="w-5 h-5" />
                       </div>
                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">فيديو الشرح التفاعلي</h4>
                    </div>
                    {lesson.duration && (
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                         <Clock className="w-4 h-4" />
                         <span>{Math.floor(lesson.duration / 60)} دقيقة</span>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {currentStage === 'welcome' && (
              <div className="premium-card p-8 md:p-16 rounded-[48px] animate-in fade-in zoom-in duration-700 flex flex-col justify-center min-h-[400px]">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-100 animate-bounce-slow">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">جاهز للبدء؟</h2>
                  <p className="text-slate-500 text-base md:text-lg font-bold max-w-xl mx-auto leading-relaxed">شاهد الفيديو أعلاه ثم ابدأ في استعراض الشرح والتمارين.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "المعايير", icon: Target, content: lesson.standards, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "المؤشرات", icon: TrendingUp, content: lesson.indicators, color: "text-purple-600", bg: "bg-purple-50" },
                    { title: "النواتج", icon: Award, content: lesson.learningOutcomes, color: "text-emerald-600", bg: "bg-emerald-50" },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[35px] hover:bg-white hover:shadow-xl transition-all duration-500 group">
                      <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">{item.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-bold">{item.content || "أهداف مخططة بدقة."}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <button
                    onClick={() => setCurrentStage('slides')}
                    className="premium-gradient-primary text-white px-12 py-5 rounded-[25px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-4 mx-auto"
                  >
                    عرض شرح الدرس
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {currentStage === 'slides' && (
              <div className="premium-card rounded-[48px] overflow-hidden flex flex-col group mx-auto w-full max-w-5xl">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
                   <div className="flex items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-widest">
                      <Layout className="w-4 h-4" />
                      شرائح الشرح
                   </div>
                   <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">
                      الشريحة {currentSlideIndex + 1} / {lesson.slides.length}
                   </div>
                </div>

                <div className="p-8 md:p-12 flex flex-col items-center text-center w-full">
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight animate-in fade-in slide-in-from-top-4 duration-500">{lesson.slides[currentSlideIndex].title}</h3>
                  <div
                    className="text-base md:text-xl text-slate-600 leading-[1.8] max-w-5xl font-bold prose prose-indigo break-words whitespace-pre-wrap w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150"
                    dangerouslySetInnerHTML={{ __html: lesson.slides[currentSlideIndex].content }}
                  />
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center gap-6 shrink-0">
                  <button
                    onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentSlideIndex === 0}
                    className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 disabled:opacity-20 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-6 h-6 text-slate-900" />
                  </button>
                  
                  <div className="flex gap-2">
                    {lesson.slides.map((_: any, i: number) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${currentSlideIndex === i ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}></div>
                    ))}
                  </div>

                  {currentSlideIndex < lesson.slides.length - 1 ? (
                    <button
                      onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                      className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentStage('assignments')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-base hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center gap-3"
                    >
                      عرض التكاليف
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentStage === 'assignments' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">تكاليف الدرس (Assignments)</h2>
                  <p className="text-slate-400 font-bold">يرجى قراءة التكليف بعناية وتنفيذه</p>
                </div>

                <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                   {lesson.assignments?.length > 0 ? lesson.assignments.map((as: any, idx: number) => (
                     <div key={idx} className="premium-card p-8 rounded-[40px] border-r-8 border-indigo-600">
                        <div className="flex items-center gap-4 mb-6">
                           <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                              {idx + 1}
                           </span>
                           <h3 className="font-black text-slate-900 text-lg">التكليف المطلوب</h3>
                        </div>
                        <div className="text-slate-600 text-lg leading-relaxed prose prose-indigo" dangerouslySetInnerHTML={{ __html: as.text }} />
                     </div>
                   )) : (
                     <div className="premium-card p-12 rounded-[40px] text-center text-slate-400 font-bold">
                        لا توجد تكاليف محددة لهذا الدرس. يمكنك الانتقال للتمارين.
                     </div>
                   )}
                </div>

                <div className="flex justify-center pt-8">
                   <button 
                    onClick={() => setCurrentStage('exercises')}
                    className="bg-emerald-600 text-white px-12 py-5 rounded-[25px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-emerald-100 flex items-center gap-4"
                   >
                    بدء التمارين والأسئلة
                    <ArrowLeft className="w-5 h-5" />
                   </button>
                </div>
              </div>
            )}

            {currentStage === 'exercises' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 flex flex-col items-center w-full">
                <div className="premium-card p-4 rounded-[30px] flex flex-col md:flex-row items-center justify-between border-b-4 border-indigo-600 w-full max-w-4xl mx-auto gap-4 shrink-0">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {lesson.questions.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setCurrentQuestionIndex(i)}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-black transition-all border-2 flex items-center justify-center text-xs ${currentQuestionIndex === i ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : answers[i] ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      if(confirm("هل تريد بدء وضع الاختبار السريع؟ سيتم إخفاء التفسيرات حتى النهاية.")) {
                        showToast("وضع الاختبار السريع مفعل", "info");
                      }
                    }}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Quiz Me!
                  </button>
                </div>

                <div className="premium-card rounded-[40px] overflow-hidden shadow-2xl border-indigo-50 w-full max-w-5xl mx-auto flex flex-col">
                  {lesson.questions.length > 0 && lesson.questions[currentQuestionIndex] ? (
                    <>
                      <div className="p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">سؤال {currentQuestionIndex + 1}</span>
                        </div>
                        
                        <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-8 leading-relaxed tracking-tight break-words w-full" dangerouslySetInnerHTML={{ __html: lesson.questions[currentQuestionIndex].text }} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 mb-6">
                          {(lesson.questions[currentQuestionIndex].options || []).map((opt: string, oIdx: number) => (
                            <button 
                              key={oIdx} 
                              onClick={() => handleAnswerSelect(opt)} 
                              className={`p-5 md:p-6 rounded-[25px] border-4 text-right transition-all duration-300 font-black text-sm md:text-base relative break-words overflow-hidden ${answers[currentQuestionIndex] === opt ? 'bg-indigo-600 border-white text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-200'}`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex-1 break-words">{opt}</span>
                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${answers[currentQuestionIndex] === opt ? 'border-white bg-white/20' : 'border-slate-100'}`}>
                                    {answers[currentQuestionIndex] === opt && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
                        <button 
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} 
                          disabled={currentQuestionIndex === 0} 
                          className="text-slate-400 px-6 py-3 rounded-xl font-black hover:text-slate-600 disabled:opacity-20 text-sm"
                        >
                          السابق
                        </button>
                        <button 
                          onClick={handleNextQuestion} 
                          className={`px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-3 text-base shadow-xl ${currentQuestionIndex < lesson.questions.length - 1 ? 'bg-slate-950 text-white hover:bg-indigo-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {currentQuestionIndex < lesson.questions.length - 1 ? "التالي" : "إنهاء الاختيار"}
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20 space-y-6 flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <HelpCircle className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold text-base">لا توجد تمارين متاحة لهذا الدرس حالياً.</p>
                      <button 
                        onClick={() => setCurrentStage('summary')}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black"
                      >
                        تجاوز التمارين
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStage === 'summary' && (
              <div className="premium-card p-10 md:p-20 rounded-[50px] animate-in zoom-in duration-700 text-center">
                <div className="w-24 h-24 bg-emerald-500 rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-100 animate-bounce-slow">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">عمل رائع!</h2>
                <p className="text-slate-500 text-lg font-bold mb-12">لقد أكملت جميع متطلبات هذا الدرس بنجاح.</p>
                
                <div className="flex justify-center gap-6 md:gap-10 mb-16">
                  <div className="premium-card p-8 rounded-[35px] min-w-[180px] border-b-8 border-indigo-600">
                    <p className="text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest">الدرجة</p>
                    <p className="text-4xl md:text-6xl font-black text-slate-900">{score}</p>
                  </div>
                  <div className="premium-card p-8 rounded-[35px] min-w-[180px] border-b-8 border-amber-500">
                    <p className="text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest">النسبة</p>
                    <p className="text-4xl md:text-6xl font-black text-amber-500">
                       {Math.round((score / Math.max(1, lesson.questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0))) * 100)}%
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/courses/${lesson.courseId}`)} 
                  className="premium-gradient-primary text-white px-16 py-5 rounded-[25px] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-indigo-200 mx-auto"
                >
                  العودة للكورس
                </button>
              </div>
            )}
          </div>

          {/* ── SIDEBAR AREA (VISIBLE ONLY IN WELCOME/SUMMARY) ── */}
          {(currentStage === 'welcome' || currentStage === 'summary') && (
            <div className="xl:col-span-4 space-y-10">
              
              {/* Summary Widget */}
              <div className="premium-card rounded-[40px] p-8 md:p-10 space-y-6">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-3">
                    <Info className="w-4 h-4 text-indigo-600" />
                    ملخص الدرس
                 </h4>
                 <p className="text-sm text-slate-600 font-bold leading-relaxed">{lesson.summary || "لا يوجد ملخص متاح حالياً لهذا الدرس."}</p>
                 <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">التمارين</p>
                       <p className="text-xl font-black text-slate-900">{lesson.questions?.length || 0}</p>
                    </div>
                    <div className="text-center border-r border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المرفقات</p>
                       <p className="text-xl font-black text-slate-900">{lesson.attachments?.length || 0}</p>
                    </div>
                 </div>
              </div>

              {/* Resources Widget */}
              <div className="premium-card rounded-[40px] p-8 md:p-10 space-y-6">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-3">
                    <FileDown className="w-4 h-4 text-indigo-600" />
                    المرفقات
                 </h4>
                 <div className="space-y-3">
                    {lesson.attachments?.length > 0 ? lesson.attachments.map((att: any, i: number) => (
                      <a 
                        key={i} 
                        href={att.url} 
                        target="_blank" 
                        className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <FileDown className="w-5 h-5" />
                           </div>
                           <span className="text-[11px] font-black text-slate-700 truncate">{att.name || `مرفق ${i+1}`}</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300" />
                      </a>
                    )) : (
                      <p className="text-[11px] text-slate-400 font-bold text-center py-4">لا توجد مرفقات.</p>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.2); }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        
        .premium-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.02);
        }

        .premium-gradient-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
        }
        
        .animate-in {
          animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />

    </DashboardLayout>
  );
}
