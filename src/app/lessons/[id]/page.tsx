"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import {
  Play, Pause, ChevronLeft, ChevronRight, CheckCircle,
  HelpCircle, BookOpen, Target, Layout, Monitor,
  MessageSquare, FileDown, Clock, Info, X, Maximize,
  Volume2, Settings, ArrowRight, Star, Award, RotateCcw,
  CheckCircle2, AlertCircle, Sparkles, Lock, Timer
} from "lucide-react";
import dynamic from 'next/dynamic';
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });

export default function LessonPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = searchParams.get('courseId');
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  // Player State
  const [currentStage, setCurrentStage] = useState<'welcome' | 'slides' | 'exercises' | 'summary'>('welcome');
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

        // Check Publish Date (Security fallback)
        if (data.publishDate) {
           const now = new Date();
           const publish = new Date(data.publishDate);
           if (now < publish) {
             router.push(`/courses/${data.courseId}`);
             return;
           }
        }

        // Parse metadata
        let slides = [];
        let questions = [];
        let attachments = [];

        try { slides = typeof data.slides === 'string' ? JSON.parse(data.slides) : (data.slides || []); } catch (e) { }
        try { questions = typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || []); } catch (e) { }
        try { attachments = typeof data.attachments === 'string' ? JSON.parse(data.attachments) : (data.attachments || []); } catch (e) { }

        setLesson({
          ...data,
          slides: Array.isArray(slides) && slides.length ? slides : [{ title: "مقدمة الدرس", content: data.summary || "أهلاً بك في هذا الدرس." }],
          questions: Array.isArray(questions) ? questions : [],
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
      console.error("Failed to fetch lesson data");
    } finally {
      setIsLoading(false);
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
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          <div className="mt-8 text-indigo-400 font-black animate-pulse text-center">جاري تحميل المحتوى...</div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="w-24 h-24 bg-red-500/10 rounded-[40px] flex items-center justify-center mb-8 border border-red-500/20 animate-bounce">
          <Timer className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4">انتهت صلاحية الوصول!</h2>
        <p className="text-slate-500 text-lg font-bold max-w-md mb-12 leading-relaxed">
          نأسف، لقد تجاوز هذا الدرس تاريخ الانتهاء المحدد له ({new Date(lesson?.cutOffDate).toLocaleDateString('ar-EG')}). يرجى التواصل مع الإدارة إذا كنت تعتقد أن هناك خطأ.
        </p>
        <button 
          onClick={() => router.push('/courses')}
          className="bg-white text-black px-12 py-5 rounded-3xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-white/10"
        >
          العودة للمقررات
        </button>
      </div>
    );
  }

  if (!lesson) return <div className="text-white p-20 text-center font-black">المحتوى غير متاح حالياً</div>;

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-200 overflow-hidden flex flex-col" dir="rtl">
      {/* Header Bar */}
      <header className="h-20 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-8 shrink-0 relative z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-black text-white truncate max-w-[200px] md:max-w-md">{lesson.title}</h1>
            <p className="text-xs text-slate-500 font-bold">{course?.title || "كورس تعليمي"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            {['welcome', 'slides', 'exercises', 'summary'].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${currentStage === s ? 'w-8 bg-indigo-500' : 'w-2 bg-white/10'}`}></div>
            ))}
          </div>
          <div className="h-10 w-px bg-white/5 mx-2"></div>
          <button className="flex items-center gap-2 bg-indigo-600/10 text-indigo-400 px-4 py-2 rounded-xl text-xs font-black border border-indigo-500/20">
            <Star className="w-4 h-4 fill-current" />
            {score} نقطة
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {currentStage === 'welcome' && (
          <div className="max-w-4xl w-full p-8 animate-in fade-in zoom-in duration-700">
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-indigo-600 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-600/20">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4">أهلاً بك في رحلة التعلم!</h2>
              <p className="text-slate-500 text-lg font-bold">لنكتشف ما سنتعلمه اليوم في هذا الدرس الشيق</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "المعايير", icon: Target, content: lesson.standards, color: "text-blue-400" },
                { title: "المؤشرات", icon: Monitor, content: lesson.indicators, color: "text-purple-400" },
                { title: "نواتج التعلم", icon: Award, content: lesson.learningOutcomes, color: "text-emerald-400" },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-[35px] hover:bg-white/[0.04] transition-all group">
                  <item.icon className={`w-10 h-10 ${item.color} mb-4 group-hover:scale-110 transition-all`} />
                  <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-bold">{item.content || "سيتم تحقيق الأهداف المخطط لها بدقة."}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={() => setCurrentStage('slides')}
                className="bg-white text-black px-12 py-5 rounded-[22px] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-white/10 flex items-center gap-4 mx-auto"
              >
                ابدأ شرح الدرس
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {currentStage === 'slides' && (
          <div className="w-full h-full flex flex-col md:flex-row p-6 gap-6">
            <div className="flex-1 bg-[#0f0f1d] border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl relative">
              <div className="absolute top-8 right-8 flex gap-4 z-10">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl text-xs font-black text-indigo-400">
                  الشريحة {currentSlideIndex + 1} من {lesson.slides.length}
                </div>
              </div>
              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center text-center">
                <h3 className="text-3xl font-black text-white mb-8 leading-tight max-w-3xl">{lesson.slides[currentSlideIndex].title}</h3>
                <div
                  className="text-xl text-slate-300 leading-relaxed max-w-4xl font-medium prose prose-invert prose-indigo"
                  dangerouslySetInnerHTML={{ __html: lesson.slides[currentSlideIndex].content }}
                />
              </div>
              <div className="p-8 border-t border-white/5 bg-black/20 flex justify-between items-center">
                <button
                  onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                  className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
                <div className="flex gap-2">
                  {lesson.slides.map((_: any, i: number) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${currentSlideIndex === i ? 'w-10 bg-indigo-500' : 'w-2 bg-white/10'}`}></div>
                  ))}
                </div>
                {currentSlideIndex < lesson.slides.length - 1 ? (
                  <button
                    onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                    className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStage('exercises')}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3"
                  >
                    انتقل للتمارين
                    <HelpCircle className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
            <div className="w-full md:w-96 space-y-6">
              <div className="bg-[#0f0f1d] border border-white/5 rounded-[40px] p-8 shadow-2xl overflow-hidden relative group">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">فيديو الشرح</h4>
                <div className="aspect-video bg-black rounded-2xl overflow-hidden relative ring-1 ring-white/10">
                  {lesson.videoUrl ? (
                    <VideoPlayer url={lesson.videoUrl} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 font-black">لا يوجد فيديو</div>
                  )}
                </div>
              </div>
              <div className="bg-[#0f0f1d] border border-white/5 rounded-[40px] p-8 shadow-2xl">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">ملخص الدرس</h4>
                <p className="text-sm text-slate-400 font-bold leading-relaxed">{lesson.summary || "تابع الشرح بعناية لتحقيق أقصى استفادة."}</p>
              </div>
            </div>
          </div>
        )}

        {currentStage === 'exercises' && (
          <div className="max-w-4xl w-full p-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-between items-center mb-10 bg-white/[0.02] p-6 rounded-[30px] border border-white/5">
              <div className="flex gap-3">
                {lesson.questions.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`w-12 h-12 rounded-xl font-black transition-all border-2 ${currentQuestionIndex === i ? 'bg-indigo-600 border-white text-white' : answers[i] ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-transparent text-slate-500'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#0f0f1d] border border-white/5 rounded-[50px] p-12 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-10 leading-relaxed" dangerouslySetInnerHTML={{ __html: lesson.questions[currentQuestionIndex].text }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  {lesson.questions[currentQuestionIndex].options.map((opt: string, oIdx: number) => (
                    <button key={oIdx} onClick={() => handleAnswerSelect(opt)} className={`p-6 rounded-[30px] border-2 text-right transition-all duration-300 font-black ${answers[currentQuestionIndex] === opt ? 'bg-indigo-600 border-white text-white shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/[0.08]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-12">
                  <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="bg-white/5 text-white px-8 py-4 rounded-2xl font-black hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-30">
                    السؤال السابق
                  </button>
                  <button onClick={handleNextQuestion} className={`px-10 py-4 rounded-2xl font-black transition-all flex items-center gap-3 ${currentQuestionIndex < lesson.questions.length - 1 ? 'bg-white text-black' : 'bg-emerald-600 text-white'}`}>
                    {currentQuestionIndex < lesson.questions.length - 1 ? "السؤال التالي" : "تسليم الامتحان"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStage === 'summary' && (
          <div className="max-w-4xl w-full p-8 animate-in zoom-in duration-700 text-center">
            <div className="w-32 h-32 bg-emerald-500 rounded-[50px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-5xl font-black text-white mb-4">أحسنت صنعاً!</h2>
            <p className="text-slate-500 text-xl font-bold mb-12">لقد أتممت الدرس والتدريبات بنجاح.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px]">
                <p className="text-slate-500 text-sm font-black mb-2 uppercase">النتيجة</p>
                <p className="text-4xl font-black text-white">{score} / {lesson.questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0)}</p>
              </div>
            </div>
            <button onClick={() => router.push(`/courses/${lesson.courseId}`)} className="bg-indigo-600 text-white px-12 py-5 rounded-[22px] font-black text-lg hover:scale-105 transition-all flex items-center gap-3 mx-auto">
              العودة للكورس
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        )}
      </main>

      <aside className="fixed left-0 top-20 bottom-0 w-80 bg-[#0a0a14] border-r border-white/5 transform -translate-x-full lg:translate-x-0 transition-transform duration-500 z-40 p-8 flex flex-col gap-8 shadow-2xl shadow-black">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
          <FileDown className="w-4 h-4 text-indigo-400" />
          المرفقات والموارد
        </h4>
        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {lesson.attachments?.map((att: any, i: number) => (
            <a key={i} href={att.url} target="_blank" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
              <span className="text-xs font-black text-slate-300 group-hover:text-white truncate max-w-[150px]">{att.name || "ملف"}</span>
              <FileDown className="w-4 h-4 text-slate-500" />
            </a>
          ))}
          {!lesson.attachments?.length && <p className="text-xs text-slate-600 font-bold italic">لا توجد مرفقات.</p>}
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
}
