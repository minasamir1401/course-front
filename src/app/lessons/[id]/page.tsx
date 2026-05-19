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
  ArrowUpRight, ListOrdered, TrendingUp, GraduationCap, FileText, ChevronDown
} from "lucide-react";
import dynamic from 'next/dynamic';
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });

const CollapsibleSection = ({ section, isCorrect, isWrong, language }: { section: any, isCorrect?: boolean, isWrong?: boolean, language: string }) => {
   const [isOpen, setIsOpen] = useState(false);
   
   const SECTION_STYLE_PRESETS: Record<string, any> = {
     HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "تلميح" },
     TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "نصيحة" },
     WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "تحذير" },
     KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "نقطة هامة" },
     FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "ملاحظات" },
     EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "شرح مفصل" }
   };

   const preset = SECTION_STYLE_PRESETS[section.type] || SECTION_STYLE_PRESETS.HINT;
   const Icon = preset.icon;
   
   return (
      <div className={`rounded-3xl border-2 ${preset.bg} ${preset.border} overflow-hidden mb-4 transition-all duration-300 w-full`}>
         <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full p-4 md:p-6 flex items-center justify-between ${language === 'ar' ? 'text-right' : 'text-left'} outline-none hover:bg-white/40 transition-colors`}
         >
            <div className={`flex items-center gap-3 ${preset.text}`}>
               <Icon className="w-6 h-6 md:w-7 md:h-7" />
               <span className="font-black text-lg md:text-xl">{preset.label}</span>
            </div>
            
            <div className="flex items-center gap-4">
               {section.type === 'FEEDBACK' && isCorrect && (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                     <CheckCircle2 className="w-6 h-6" />
                  </div>
               )}
               {section.type === 'FEEDBACK' && isWrong && (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
                     <RotateCcw className="w-6 h-6" />
                  </div>
               )}
               <ChevronDown className={`w-6 h-6 md:w-7 md:h-7 ${preset.text} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
         </button>
         
         <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
               <div className={`p-6 pt-0 border-t border-transparent prose prose-sm md:prose-base max-w-none ${preset.text} font-bold leading-relaxed break-words`} dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
         </div>
      </div>
   );
};

export default function LessonPlayerPage() {
  const { t, language } = useLanguage();
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
  const [quizTimer, setQuizTimer] = useState(0);

  const [slideAnswers, setSlideAnswers] = useState<Record<number, any>>({});
  const [slideSubmitted, setSlideSubmitted] = useState<Record<number, boolean>>({});
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<number, any>>({});
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<Record<number, boolean>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  // Dynamic Score Calculation across Slides, Assignments, and Exercises
  useEffect(() => {
    if (!lesson) return;
    
    let totalScore = 0;
    let correctQ = 0;
    let totalQ = 0;
    
    // 1. Slides questions
    lesson.slides?.forEach((slide: any, idx: number) => {
      if (slide.type === 'QUESTION') {
        totalQ++;
        if (slideSubmitted[idx]) {
          const isMulti = slide.label === 'MULTI_SELECT';
          const studentAnswers = slideAnswers[idx] || (isMulti ? [] : '');
          const isCorrect = isMulti ? studentAnswers.length === (slide.correctAnswers || []).length && studentAnswers.every((a: string) => (slide.correctAnswers || []).includes(a)) : (!slide.correctAnswer || slideAnswers[idx] === slide.correctAnswer);
          if (isCorrect && studentAnswers.length > 0) {
            totalScore += (Number(slide.points) || 1);
            correctQ++;
          }
        }
      }
    });
    
    // 2. Assignment questions
    lesson.assignments?.forEach((as: any, idx: number) => {
      if (as.type === 'QUESTION') {
        totalQ++;
        if (assignmentSubmitted[idx]) {
          const isMulti = as.type === 'MULTI_SELECT';
          const studentAnswers = assignmentAnswers[idx] || (isMulti ? [] : '');
          const isCorrect = isMulti ? studentAnswers.length === (as.correctAnswers || []).length && studentAnswers.every((a: string) => (as.correctAnswers || []).includes(a)) : (!as.correctAnswer || assignmentAnswers[idx] === as.correctAnswer);
          if (isCorrect && studentAnswers.length > 0) {
            totalScore += (Number(as.points) || 1);
            correctQ++;
          }
        }
      }
    });
    
    // 3. Exercise questions
    lesson.questions?.forEach((q: any, idx: number) => {
      totalQ++;
      const isMulti = q.type === 'MULTI_SELECT';
      const studentAnswers = answers[idx] || (isMulti ? [] : '');
      const isCorrect = isMulti ? studentAnswers.length === (q.correctAnswers || []).length && studentAnswers.every((a: string) => (q.correctAnswers || []).includes(a)) : (!q.correctAnswer || answers[idx] === q.correctAnswer);
      if (isCorrect && studentAnswers.length > 0) {
        totalScore += (Number(q.points) || 1);
        correctQ++;
      }
    });
    
    setScore(totalScore);
    setCorrectCount(correctQ);
    setTotalQuestionsCount(totalQ);
  }, [slideAnswers, slideSubmitted, assignmentAnswers, assignmentSubmitted, answers, lesson]);

  const getMaxPossibleScore = () => {
    if (!lesson) return 1;
    let maxScore = 0;
    lesson.slides?.forEach((slide: any) => {
      if (slide.type === 'QUESTION') maxScore += (Number(slide.points) || 1);
    });
    lesson.assignments?.forEach((as: any) => {
      if (as.type === 'QUESTION') maxScore += (Number(as.points) || 1);
    });
    lesson.questions?.forEach((q: any) => {
      maxScore += (Number(q.points) || 1);
    });
    return Math.max(1, maxScore);
  };

  const SECTION_STYLE_PRESETS: Record<string, any> = {
    HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "تلميح" },
    TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "نصيحة" },
    WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "تحذير" },
    KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "نقطة هامة" },
    FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "ملاحظات" },
    EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "شرح مفصل" }
  };

  useEffect(() => {
    let interval: any;
    if (currentStage === 'exercises') {
      interval = setInterval(() => {
        setQuizTimer(prev => prev + 1);
      }, 1000);
    } else {
      setQuizTimer(0);
    }
    return () => clearInterval(interval);
  }, [currentStage]);

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
          slides: Array.isArray(slides) && slides.length ? slides : [{ title: t('lesson.lessonIntro'), content: data.summary || t('lesson.welcomeToLesson') }],
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
    if (lesson.questions[currentQuestionIndex]?.type === 'MULTI_SELECT') {
      const currentArr = answers[currentQuestionIndex] || [];
      const newArr = currentArr.includes(option) ? currentArr.filter((a: string) => a !== option) : [...currentArr, option];
      setAnswers({ ...answers, [currentQuestionIndex]: newArr });
    } else {
      setAnswers({ ...answers, [currentQuestionIndex]: option });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < lesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStage('summary');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 border-[6px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-200 mx-auto"></div>
            <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] animate-pulse">{t('lesson.preparing')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isExpired) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-24 h-24 bg-red-500/10 rounded-[40px] flex items-center justify-center mb-8 border border-red-500/20 animate-bounce">
            <Timer className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{t('lesson.expiredAccess')}</h2>
          <p className="text-slate-500 text-lg font-bold max-w-md mb-12 leading-relaxed">
            {t('lesson.expiredMessage')} ({new Date(lesson?.cutOffDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}). {t('lesson.contactAdmin')}
          </p>
          <button 
            onClick={() => router.push('/courses')}
            className="bg-indigo-600 text-white px-12 py-5 rounded-[22px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-100"
          >
            {t('lesson.backToCourses')}
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
              <p className="text-slate-400 font-black text-xl">{t('lesson.contentNotAvailable')}</p>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-12 pb-24 overflow-x-hidden px-1 sm:px-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* ── TOP HEADER BAR ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 px-1 sm:px-2">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => router.back()} 
                className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
              >
                <ArrowRight className="w-6 h-6 text-slate-900" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">{lesson.title}</h1>
                <p className="text-indigo-600 font-bold text-sm flex items-center gap-2">
                   <BookOpen className="w-4 h-4" />
                   {course?.title || t('lesson.educationalCourse')}
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
                {score} {t('lesson.pointsEarned')}
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
                         <span className="opacity-40">{t('lesson.noVideo')}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none group-hover:opacity-0 transition-opacity" />
                 </div>
                 
                 <div className="mt-6 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                          <Monitor className="w-5 h-5" />
                       </div>
                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('lesson.interactiveVideo')}</h4>
                    </div>
                    {lesson.duration && (
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                         <Clock className="w-4 h-4" />
                         <span>{Math.floor(lesson.duration / 60)} {t('lesson.minutes')}</span>
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
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">{t('lesson.readyToStart')}</h2>
                  <p className="text-slate-500 text-base md:text-lg font-bold max-w-xl mx-auto leading-relaxed">{t('lesson.readyMessage')}</p>
                </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                  {[
                    { title: t('lesson.standards'), icon: Target, content: lesson.standards, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: t('lesson.indicators'), icon: TrendingUp, content: lesson.indicators, color: "text-purple-600", bg: "bg-purple-50" },
                    { title: t('lesson.outcomes'), icon: Award, content: lesson.learningOutcomes, color: "text-emerald-600", bg: "bg-emerald-50" },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50/50 border border-slate-100 p-6 md:p-8 rounded-[35px] hover:bg-white hover:shadow-xl transition-all duration-500 group">
                      <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform shadow-sm`}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{item.title}</h3>
                      <p className="text-sm md:text-base text-slate-600 leading-relaxed font-bold">{item.content || t('lesson.plannedGoals')}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <button
                    onClick={() => setCurrentStage('slides')}
                    className="premium-gradient-primary text-white px-12 py-5 rounded-[25px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-4 mx-auto"
                  >
                    {t('lesson.showExplanation')}
                    <ArrowLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {currentStage === 'slides' && (
              <div className="premium-card rounded-[48px] overflow-hidden flex flex-col group mx-auto w-full max-w-5xl">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
                   <div className="flex items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-widest">
                      <Layout className="w-4 h-4" />
                      {t('lesson.slides')}
                   </div>
                   <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">
                      {t('lesson.slide')} {currentSlideIndex + 1} / {lesson.slides.length}
                   </div>
                </div>

                <div className="p-8 md:p-12 flex flex-col items-center text-center w-full">
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight animate-in fade-in slide-in-from-top-4 duration-500">{lesson.slides[currentSlideIndex].title}</h3>
                  {lesson.slides[currentSlideIndex].videoUrl && (
                    <div className="w-full max-w-4xl mx-auto mb-8 rounded-[35px] overflow-hidden shadow-2xl border border-slate-100">
                      <VideoPlayer url={lesson.slides[currentSlideIndex].videoUrl} />
                    </div>
                  )}
                  <div
                    className="text-base md:text-xl text-slate-600 leading-[1.8] max-w-5xl font-bold prose prose-indigo break-words whitespace-pre-wrap w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150"
                    dangerouslySetInnerHTML={{ __html: lesson.slides[currentSlideIndex].content }}
                  />

                  {/* Question Options for Slide */}
                  {lesson.slides[currentSlideIndex].type === 'QUESTION' && lesson.slides[currentSlideIndex].options?.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                      {lesson.slides[currentSlideIndex].options.map((opt: string, oIdx: number) => {
                         const isMulti = lesson.slides[currentSlideIndex].label === 'MULTI_SELECT';
                         const isSelected = isMulti ? (slideAnswers[currentSlideIndex] || []).includes(opt) : slideAnswers[currentSlideIndex] === opt;
                         const isSubmitted = slideSubmitted[currentSlideIndex];
                         const isCorrect = isSubmitted && (isMulti ? (lesson.slides[currentSlideIndex].correctAnswers || []).includes(opt) : ((!lesson.slides[currentSlideIndex].correctAnswer && isSelected) || opt === lesson.slides[currentSlideIndex].correctAnswer));
                         const isWrong = isSubmitted && isSelected && !isCorrect;
                         
                         return (
                          <button
                            key={oIdx}
                            onClick={() => {
                                if (!isSubmitted) {
                                    if (isMulti) {
                                        const currentArr = slideAnswers[currentSlideIndex] || [];
                                        const newArr = currentArr.includes(opt) ? currentArr.filter((a: string) => a !== opt) : [...currentArr, opt];
                                        setSlideAnswers({ ...slideAnswers, [currentSlideIndex]: newArr });
                                    } else {
                                        setSlideAnswers({ ...slideAnswers, [currentSlideIndex]: opt });
                                    }
                                }
                            }}
                            className={`relative p-6 rounded-3xl border-4 text-right transition-all group overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-red-500 bg-red-50' : 'border-indigo-500 bg-indigo-50') : 'border-slate-100 bg-white hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                            disabled={isSubmitted}
                          >
                            <span className={`text-xl font-bold ${isSelected ? (isCorrect ? 'text-emerald-700' : isWrong ? 'text-red-700' : 'text-indigo-700') : 'text-slate-700'}`}>{opt}</span>
                            {isSelected && !isSubmitted && <CheckCircle2 className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-indigo-500" />}
                            {isCorrect && <CheckCircle2 className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-emerald-500" />}
                            {isWrong && <X className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-red-500" />}
                          </button>
                         );
                      })}
                    </div>
                  )}
                  {lesson.slides[currentSlideIndex].type === 'QUESTION' && slideAnswers[currentSlideIndex] && !slideSubmitted[currentSlideIndex] && (
                     <button 
                       onClick={() => setSlideSubmitted({ ...slideSubmitted, [currentSlideIndex]: true })}
                       className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl"
                     >
                       تأكيد الإجابة
                     </button>
                  )}

                  {lesson.slides[currentSlideIndex].sections?.length > 0 && (lesson.slides[currentSlideIndex].type !== 'QUESTION' || slideSubmitted[currentSlideIndex]) && (
                     <div className="mt-8 w-full max-w-4xl space-y-4">
                        {lesson.slides[currentSlideIndex].sections.map((sec: any, sIdx: number) => {
                           const isSubmitted = slideSubmitted[currentSlideIndex];
                           const isMulti = lesson.slides[currentSlideIndex].label === 'MULTI_SELECT';
                           const studentAnswers = slideAnswers[currentSlideIndex] || (isMulti ? [] : '');
                           const isCorrect = isSubmitted && (isMulti ? studentAnswers.length === (lesson.slides[currentSlideIndex].correctAnswers || []).length && studentAnswers.every((a: string) => (lesson.slides[currentSlideIndex].correctAnswers || []).includes(a)) : slideAnswers[currentSlideIndex] === lesson.slides[currentSlideIndex].correctAnswer);
                           const isWrong = isSubmitted && !isCorrect;
                           return (
                             <CollapsibleSection key={sIdx} section={sec} isCorrect={isCorrect} isWrong={isWrong} language={language} />
                           );
                        })}
                     </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center gap-6 shrink-0">
                  <button
                    onClick={() => {
                      if (currentSlideIndex > 0) {
                         setCurrentSlideIndex(prev => prev - 1);
                      } else {
                         setCurrentStage('welcome');
                      }
                    }}
                    className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-6 h-6 text-slate-900" />
                  </button>
                  
                  <div className="flex gap-2 flex-wrap justify-center">
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
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-base hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center gap-3 shrink-0"
                    >
                      {t('lesson.showAssignments')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentStage === 'assignments' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{t('lesson.assignments')}</h2>
                  <p className="text-slate-400 font-bold">{t('lesson.assignmentsMsg')}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto w-full">
                   {lesson.assignments?.length > 0 ? lesson.assignments.map((as: any, idx: number) => {
                     const isSubmitted = assignmentSubmitted[idx];
                     return (
                     <div key={idx} className="premium-card p-8 rounded-[40px] border-r-8 border-indigo-600">
                        <div className="flex items-center gap-4 mb-6">
                           <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                              {idx + 1}
                           </span>
                           <h3 className="font-black text-slate-900 text-lg">{as.type === 'QUESTION' ? t('lesson.requiredAssignment') : t('lesson.requiredAssignment')}</h3>
                        </div>
                        <div className="text-slate-600 text-lg leading-relaxed prose prose-indigo mb-6" dangerouslySetInnerHTML={{ __html: as.text }} />
                        
                        {as.type === 'QUESTION' && as.options?.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {as.options.map((opt: string, oIdx: number) => {
                               const isMulti = as.type === 'MULTI_SELECT';
                               const isSelected = isMulti ? (assignmentAnswers[idx] || []).includes(opt) : assignmentAnswers[idx] === opt;
                               const isCorrect = isSubmitted && (isMulti ? (as.correctAnswers || []).includes(opt) : ((!as.correctAnswer && isSelected) || opt === as.correctAnswer));
                               const isWrong = isSubmitted && isSelected && !isCorrect;
                               return (
                                <button
                                  key={oIdx}
                                  onClick={() => {
                                      if (!isSubmitted) {
                                          if (isMulti) {
                                              const currentArr = assignmentAnswers[idx] || [];
                                              const newArr = currentArr.includes(opt) ? currentArr.filter((a: string) => a !== opt) : [...currentArr, opt];
                                              setAssignmentAnswers({ ...assignmentAnswers, [idx]: newArr });
                                          } else {
                                              setAssignmentAnswers({ ...assignmentAnswers, [idx]: opt });
                                          }
                                      }
                                  }}
                                  className={`relative p-5 rounded-3xl border-4 text-right transition-all group overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-red-500 bg-red-50' : 'border-indigo-500 bg-indigo-50') : 'border-slate-100 bg-white hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                                  disabled={isSubmitted}
                                >
                                  <span className={`text-lg font-bold ${isSelected ? (isCorrect ? 'text-emerald-700' : isWrong ? 'text-red-700' : 'text-indigo-700') : 'text-slate-700'}`}>{opt}</span>
                                  {isSelected && !isSubmitted && <CheckCircle2 className="absolute top-1/2 left-4 -translate-y-1/2 w-6 h-6 text-indigo-500" />}
                                  {isCorrect && <CheckCircle2 className="absolute top-1/2 left-4 -translate-y-1/2 w-6 h-6 text-emerald-500" />}
                                  {isWrong && <X className="absolute top-1/2 left-4 -translate-y-1/2 w-6 h-6 text-red-500" />}
                                </button>
                               );
                            })}
                          </div>
                        )}
                        {as.type === 'QUESTION' && assignmentAnswers[idx] && !isSubmitted && (
                           <button 
                             onClick={() => setAssignmentSubmitted({ ...assignmentSubmitted, [idx]: true })}
                             className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl"
                           >
                             تأكيد الإجابة
                           </button>
                        )}
                        {/* Assignment Sections (Hints, Explanations, etc.) */}
                        {isSubmitted && as.sections?.length > 0 && (
                           <div className="mt-8 space-y-4">
                              {as.sections.map((sec: any, sIdx: number) => {
                                 const isMulti = as.type === 'MULTI_SELECT';
                                 const studentAnswers = assignmentAnswers[idx] || (isMulti ? [] : '');
                                 const isCorrect = isMulti ? studentAnswers.length === (as.correctAnswers || []).length && studentAnswers.every((a: string) => (as.correctAnswers || []).includes(a)) : (!as.correctAnswer || assignmentAnswers[idx] === as.correctAnswer);
                                 const isWrong = !isCorrect;
                                 return (
                                   <CollapsibleSection key={sIdx} section={sec} isCorrect={isCorrect} isWrong={isWrong} language={language} />
                                 );
                              })}
                           </div>
                        )}
                     </div>
                     );
                   }) : (
                     <div className="premium-card p-12 rounded-[40px] text-center text-slate-400 font-bold">
                        {t('lesson.noAssignments')}
                     </div>
                   )}
                </div>

                <div className="flex justify-center pt-8 gap-4 flex-wrap">
                   <button 
                    onClick={() => setCurrentStage('slides')}
                    className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-5 rounded-[25px] font-black text-lg hover:bg-slate-50 transition-all flex items-center gap-4"
                   >
                    <ArrowRight className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                    {t('lesson.previous')}
                   </button>
                   <button 
                    onClick={() => setCurrentStage('exercises')}
                    className="bg-emerald-600 text-white px-12 py-5 rounded-[25px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-emerald-100 flex items-center gap-4"
                   >
                    {t('lesson.startExercises')}
                    <ArrowLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
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
                      if(confirm(t('lesson.quizModePrompt'))) {
                        showToast(t('lesson.quizModeEnabled'), "info");
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
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex flex-wrap items-center gap-3 max-w-full w-full">
                            <span className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-black uppercase tracking-wider shadow-sm max-w-full break-words whitespace-normal text-right">
                              {t('lesson.question')} {currentQuestionIndex + 1}
                            </span>
                            {lesson.questions[currentQuestionIndex].level && (
                              <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.level')}: {lesson.questions[currentQuestionIndex].level === 'Easy' ? t('lesson.easy') : lesson.questions[currentQuestionIndex].level === 'Medium' ? t('lesson.medium') : t('lesson.hard')}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].skill && (
                              <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.skill')}: {lesson.questions[currentQuestionIndex].skill}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].standard && (
                              <span className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.standard')}: {lesson.questions[currentQuestionIndex].standard}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].indicator && (
                              <span className="px-3 py-2 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.indicator')}: {lesson.questions[currentQuestionIndex].indicator}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].learningOutcome && (
                              <span className="flex items-start gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{t('lesson.outcome')}: {lesson.questions[currentQuestionIndex].learningOutcome}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-mono font-bold text-sm shadow-sm shrink-0">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            {Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        
                        <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-8 leading-relaxed tracking-tight break-words w-full" dangerouslySetInnerHTML={{ __html: lesson.questions[currentQuestionIndex].text }} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 mb-6">
                          {(lesson.questions[currentQuestionIndex].options || []).map((opt: string, oIdx: number) => {
                            const isSelected = lesson.questions[currentQuestionIndex].type === 'MULTI_SELECT' ? (answers[currentQuestionIndex] || []).includes(opt) : answers[currentQuestionIndex] === opt;
                            return (
                            <button 
                              key={oIdx} 
                              onClick={() => handleAnswerSelect(opt)} 
                              className={`p-5 md:p-6 rounded-[25px] border-4 text-start transition-all duration-300 font-black text-sm md:text-base relative break-words overflow-hidden ${isSelected ? 'bg-indigo-600 border-white text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-200'}`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex-1 break-words leading-relaxed">{opt}</span>
                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-white bg-white/20' : 'border-slate-100'}`}>
                                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                              </div>
                            </button>
                            );
                          })}
                        </div>
                        
                        {/* Question Sections (Hints, Explanations, Feedback) */}
                        {answers[currentQuestionIndex] && lesson.questions[currentQuestionIndex].sections?.length > 0 && (
                           <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-2">
                              {lesson.questions[currentQuestionIndex].sections.map((sec: any, sIdx: number) => {
                                 const isMulti = lesson.questions[currentQuestionIndex].type === 'MULTI_SELECT';
                                 const studentAnswers = answers[currentQuestionIndex] || (isMulti ? [] : '');
                                 const isCorrect = isMulti ? studentAnswers.length === (lesson.questions[currentQuestionIndex].correctAnswers || []).length && studentAnswers.every((a: string) => (lesson.questions[currentQuestionIndex].correctAnswers || []).includes(a)) : (!lesson.questions[currentQuestionIndex].correctAnswer || answers[currentQuestionIndex] === lesson.questions[currentQuestionIndex].correctAnswer);
                                 const isWrong = !isCorrect;
                                 return (
                                   <CollapsibleSection key={sIdx} section={sec} isCorrect={isCorrect} isWrong={isWrong} language={language} />
                                 );
                              })}
                           </div>
                        )}
                      </div>

                      <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
                        <button 
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} 
                          disabled={currentQuestionIndex === 0} 
                          className="text-slate-400 px-6 py-3 rounded-xl font-black hover:text-slate-600 disabled:opacity-20 text-sm"
                        >
                          {t('lesson.previous')}
                        </button>
                        <button 
                          onClick={handleNextQuestion} 
                          className={`px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-3 text-base shadow-xl ${currentQuestionIndex < lesson.questions.length - 1 ? 'bg-slate-950 text-white hover:bg-indigo-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {currentQuestionIndex < lesson.questions.length - 1 ? t('lesson.next') : t('lesson.finishQuiz')}
                          <ChevronLeft className={`w-5 h-5 transition-transform ${language === 'ar' ? 'group-hover:-translate-x-2' : 'group-hover:translate-x-2 rotate-180'}`} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20 space-y-6 flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <HelpCircle className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold text-base">{t('lesson.noExercises')}</p>
                      <button 
                        onClick={() => setCurrentStage('summary')}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black"
                      >
                        {t('lesson.skipExercises')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStage === 'summary' && (() => {
              const maxPossible = getMaxPossibleScore();
              const pct = Math.round((score / maxPossible) * 100);
              
              let title = t('lesson.greatJob') || "عمل رائع!";
              let message = t('lesson.completedMessage') || "لقد أكملت جميع متطلبات هذا الدرس بنجاح.";
              let iconBg = "bg-emerald-500 shadow-emerald-100";
              let borderCol = "border-indigo-600";
              let icon = <CheckCircle className="w-12 h-12 text-white" />;
              
              if (pct >= 85) {
                title = "أداء ممتاز! 🏆";
                message = "رائع جداً! لقد تفوقت وأكملت الدرس بنسبة ممتازة تليق بذكائك.";
                iconBg = "bg-emerald-500 shadow-emerald-100 animate-bounce-slow";
                icon = (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big w-12 h-12 text-white" aria-hidden="true">
                    <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                );
              } else if (pct >= 50) {
                title = "عمل جيد جداً! ⭐";
                message = "أحسنت! لقد نجحت واجتزت الدرس بنجاح. استمر في التقدم!";
                iconBg = "bg-amber-500 shadow-amber-100 animate-pulse";
                borderCol = "border-amber-500";
                icon = <Star className="w-12 h-12 text-white fill-current" />;
              } else {
                title = "تحتاج للمحاولة مجدداً 🔄";
                message = "لم تحقق نسبة الاجتياز المطلوبة (50%). لا تقلق، التعلم يحتاج لبعض التدريب الإضافي!";
                iconBg = "bg-rose-500 shadow-rose-100 animate-pulse";
                borderCol = "border-rose-500";
                icon = <RotateCcw className="w-12 h-12 text-white" />;
              }
              
              return (
                <div className="premium-card p-10 md:p-20 rounded-[50px] animate-in zoom-in duration-700 text-center">
                  <div className={`w-24 h-24 ${iconBg} rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-2xl`}>
                    {icon}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">{title}</h2>
                  <p className="text-slate-500 text-lg font-bold mb-12">{message}</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 md:gap-10 mb-10 md:mb-16">
                    <div className={`premium-card p-8 rounded-[35px] min-w-[180px] border-b-8 ${borderCol}`}>
                      <p className="text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest">{t('lesson.score') || 'الدرجة'}</p>
                      <p className="text-4xl md:text-6xl font-black text-slate-900">{correctCount} <span className="text-2xl text-slate-400">/ {totalQuestionsCount}</span></p>
                    </div>
                    <div className={`premium-card p-8 rounded-[35px] min-w-[180px] border-b-8 ${pct >= 50 ? 'border-amber-500' : 'border-rose-500'}`}>
                      <p className="text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest">{t('lesson.percentage') || 'النسبة'}</p>
                      <p className={`text-4xl md:text-6xl font-black ${pct >= 85 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{pct}%</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {pct < 50 && (
                      <button 
                        onClick={() => {
                          setAnswers({});
                          setSlideAnswers({});
                          setSlideSubmitted({});
                          setAssignmentAnswers({});
                          setAssignmentSubmitted({});
                          setScore(0);
                          setCurrentStage('welcome');
                          setCurrentSlideIndex(0);
                          setCurrentQuestionIndex(0);
                        }} 
                        className="bg-slate-950 text-white px-10 py-5 rounded-[25px] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-slate-200"
                      >
                        إعادة المحاولة 🔄
                      </button>
                    )}
                    <button 
                      onClick={() => router.push(`/courses/${lesson.courseId}`)} 
                      className="premium-gradient-primary text-white px-16 py-5 rounded-[25px] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-indigo-200"
                    >
                      {t('lesson.backToCourse')}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── SIDEBAR AREA (VISIBLE ONLY IN WELCOME/SUMMARY) ── */}
          {(currentStage === 'welcome' || currentStage === 'summary') && (
            <div className="xl:col-span-4 space-y-10">
              
              {/* Summary Widget */}
              <div className="premium-card rounded-[40px] p-8 md:p-10 space-y-6">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-3">
                    <Info className="w-4 h-4 text-indigo-600" />
                    {t('lesson.lessonSummary')}
                 </h4>
                 <p className="text-sm text-slate-600 font-bold leading-relaxed">{lesson.summary || t('lesson.noSummary')}</p>
                 <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t('lesson.exercises')}</p>
                       <p className="text-xl font-black text-slate-900">{lesson.questions?.length || 0}</p>
                    </div>
                    <div className="text-center border-r border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t('lesson.attachments')}</p>
                       <p className="text-xl font-black text-slate-900">{lesson.attachments?.length || 0}</p>
                    </div>
                 </div>
              </div>

              {/* Resources Widget */}
              <div className="premium-card rounded-[40px] p-8 md:p-10 space-y-6">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-3">
                    <FileDown className="w-4 h-4 text-indigo-600" />
                    {t('lesson.attachments')}
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
                           <span className="text-[11px] font-black text-slate-700 truncate">{att.name || `${t('lesson.attachment')} ${i+1}`}</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300" />
                      </a>
                    )) : (
                      <p className="text-[11px] text-slate-400 font-bold text-center py-4">{t('lesson.noAttachments')}</p>
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
