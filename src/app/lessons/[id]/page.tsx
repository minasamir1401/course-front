"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
import { Play, Pause, ChevronLeft, ChevronRight, CheckCircle2, HelpCircle, BookOpen, Target, Layout, Monitor, MessageSquare, FileDown, Clock, Info, X, Maximize, Volume2, Settings, ArrowRight, ArrowLeft, Star, Award, RotateCcw, AlertCircle, Sparkles, Lock, Timer, ArrowUpRight, ListOrdered, TrendingUp, GraduationCap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });
const InteractiveQuestionRenderer = dynamic(() => import('@/components/InteractiveQuestionRenderer'), { ssr: false });
import HtmlRenderer from '@/components/HtmlRenderer';
import { getOptionLetter, cleanOptionText } from '@/lib/utils';
import AnimatedFeedback from "@/components/AnimatedFeedback";

import { 
  normalizeAnswerGlobal, 
  checkAdvancedCorrect, 
  isQuestionLike, 
  getQuestionOptions, 
  QuestionFeedback, 
  SectionAccordion, 
  WelcomeGadgetCard, 
  SlideSectionsToggle, 
  AssignmentSectionsToggle, 
  QuizSectionsToggle 
} from "@/components/LessonSubComponents";
import LessonSummaryView from "@/components/LessonSummaryView";

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
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  // Player State
  const [currentStage, setCurrentStage] = useState<'welcome' | 'slides' | 'assignments' | 'exercises' | 'summary'>('welcome');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [score, setScore] = useState(0);
  const [quizTimer, setQuizTimer] = useState(0);
  const [assignmentTimer, setAssignmentTimer] = useState(0);
  const [currentAssignmentIndex, setCurrentAssignmentIndex] = useState(0);

  const [slideAnswers, setSlideAnswers] = useState<Record<number, any>>({});
  const [slideSubmitted, setSlideSubmitted] = useState<Record<number, boolean>>({});
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<number, any>>({});
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<Record<number, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptedQuestionsCount, setAttemptedQuestionsCount] = useState(0);
  const [attemptedMaxScore, setAttemptedMaxScore] = useState(0);
  const [actualVideoDuration, setActualVideoDuration] = useState<number>(0);
  const [xpData, setXpData] = useState<any>(null);
  const [totalLessonXP, setTotalLessonXP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showStreakMilestone, setShowStreakMilestone] = useState<{ count: number; xp: number } | null>(null);
  const [highestStreak, setHighestStreak] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionBonusXP, setSessionBonusXP] = useState(0);
  const [toastFeedback, setToastFeedback] = useState<{
    type: 'success' | 'streak' | 'perfect' | 'incorrect';
    xp: number;
    streakCount?: number;
    bonusXP?: number;
    level?: 'Easy' | 'Medium' | 'Hard';
    isCorrect?: boolean;
  } | null>(null);

  const submitAnswerProgress = async (questionId: string, blockType: 'slides' | 'assignments' | 'questions', selectedAnswer: any) => {
    if (searchParams.get('preview') === 'true') return;

    try {
      const token = localStorage.getItem("lms_token") || 
                    localStorage.getItem("super_admin_token") || 
                    localStorage.getItem("school_admin_token");
      if (!token) return;

      const res = await fetch(`${API_URL}/progress/lesson/${lessonId}/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId,
          blockType,
          selectedAnswer: typeof selectedAnswer === 'object' ? JSON.stringify(selectedAnswer) : selectedAnswer
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTotalLessonXP(data.totalLessonXP);
        setCurrentStreak(data.currentStreak);
        
        let currentLevel = 'Medium';
        if (blockType === 'questions') {
          currentLevel = lesson?.questions?.[currentQuestionIndex]?.level || 'Medium';
        } else if (blockType === 'slides') {
          currentLevel = lesson?.slides?.[currentSlideIndex]?.level || 'Medium';
        } else if (blockType === 'assignments') {
          currentLevel = lesson?.assignments?.[currentAssignmentIndex]?.level || 'Medium';
        }

        if (data.isCorrect) {
          setSessionXP(prev => prev + (data.earnedXP || 0));
          setHighestStreak(prev => Math.max(prev, data.currentStreak || 0));
        }

        setToastFeedback({
          type: data.isCorrect ? 'success' : 'incorrect',
          xp: data.earnedXP || 0,
          level: currentLevel as any,
          streakCount: data.currentStreak,
          isCorrect: data.isCorrect
        });

        if (data.bonusXP > 0) {
          setSessionBonusXP(prev => prev + data.bonusXP);
          setShowStreakMilestone({ count: data.currentStreak, xp: data.bonusXP });
        }

        setXpData((prev: any) => {
          const prevStreaks = prev?.streaks || {};
          const setKey = blockType === 'questions' ? 'questions' : blockType;
          return {
            ...prev,
            totalLessonXP: data.totalLessonXP,
            streaks: {
              ...prevStreaks,
              [setKey]: data.currentStreak
            }
          };
        });
      }
    } catch (error) {
      console.error("Failed to submit answer progress:", error);
    }
  };

  const normalizeAnswer = (value: any) => normalizeAnswerGlobal(value);

  // Dynamic Score Calculation across Slides, Assignments, and Exercises
  useEffect(() => {
    if (!lesson) return;

    let totalScore = 0;
    let correctQ = 0;
    let totalQ = 0;
    let attemptedQ = 0;
    let attemptedScoreCap = 0;

    // 1. Slides questions
    lesson.slides?.forEach((slide: any, idx: number) => {
      if (isQuestionLike(slide)) {
        totalQ++;
        if (slideSubmitted[idx]) {
          const studentAnswers = slideAnswers[idx];
          const isCorrect = checkAdvancedCorrect(slide, studentAnswers);
          const isSkipped = !studentAnswers || (Array.isArray(studentAnswers) && studentAnswers.length === 0) || studentAnswers === '' || studentAnswers === '[]';
          
          if (!isSkipped) {
            attemptedQ++;
            attemptedScoreCap += (Number(slide.points) || 1);
            if (isCorrect) {
              totalScore += (Number(slide.points) || 1);
              correctQ++;
            }
          }
        }
      }
    });

    // 2. Assignment questions
    lesson.assignments?.forEach((as: any, idx: number) => {
      if (isQuestionLike(as)) {
        totalQ++;
        if (assignmentSubmitted[idx]) {
          const studentAnswers = assignmentAnswers[idx];
          const isCorrect = checkAdvancedCorrect(as, studentAnswers);
          const isSkipped = !studentAnswers || (Array.isArray(studentAnswers) && studentAnswers.length === 0) || studentAnswers === '' || studentAnswers === '[]';
          
          if (!isSkipped) {
            attemptedQ++;
            attemptedScoreCap += (Number(as.points) || 1);
            if (isCorrect) {
              totalScore += (Number(as.points) || 1);
              correctQ++;
            }
          }
        }
      }
    });

    // 3. Exercise questions
    lesson.questions?.forEach((q: any, idx: number) => {
      if (isQuestionLike(q) || !q.type) {
        totalQ++;
        if (quizSubmitted[idx]) {
          const studentAnswers = answers[idx];
          const isCorrect = checkAdvancedCorrect(q, studentAnswers);
          const isSkipped = !studentAnswers || (Array.isArray(studentAnswers) && studentAnswers.length === 0) || studentAnswers === '' || studentAnswers === '[]';
          
          if (!isSkipped) {
            attemptedQ++;
            attemptedScoreCap += (Number(q.points) || 1);
            if (isCorrect) {
              totalScore += (Number(q.points) || 1);
              correctQ++;
            }
          }
        }
      }
    });

    setScore(totalScore);
    setCorrectCount(correctQ);
    setAttemptedQuestionsCount(attemptedQ);
    setAttemptedMaxScore(Math.max(1, attemptedScoreCap));
  }, [slideAnswers, slideSubmitted, assignmentAnswers, assignmentSubmitted, answers, quizSubmitted, lesson]);

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
    let interval: any;
    if (currentStage === 'assignments') {
      interval = setInterval(() => {
        setAssignmentTimer(prev => prev + 1);
      }, 1000);
    } else {
      setAssignmentTimer(0);
    }
    return () => clearInterval(interval);
  }, [currentStage]);

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  useEffect(() => {
    if (!xpData) return;
    if (currentStage === 'slides') {
      setCurrentStreak(xpData.streaks?.slides || 0);
    } else if (currentStage === 'assignments') {
      setCurrentStreak(xpData.streaks?.assignments || 0);
    } else if (currentStage === 'exercises') {
      setCurrentStreak(xpData.streaks?.questions || 0);
    } else {
      setCurrentStreak(0);
    }
  }, [currentStage, xpData]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("lms_token") || 
                    localStorage.getItem("super_admin_token") || 
                    localStorage.getItem("school_admin_token");
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

        const sanitizedAssignments = Array.isArray(assignments) ? assignments.map(a => ({
          ...a,
          options: Array.isArray(a.options) ? a.options : []
        })) : [];

        const parsedSlides = Array.isArray(slides) && slides.length ? [...slides] : [{ title: t('lesson.lessonIntro'), content: data.summary || t('lesson.welcomeToLesson') }];
        if (data.videoUrl) {
          parsedSlides.unshift({
            id: 'intro-video-slide',
            title: language === 'ar' ? "فيديو مقدمة الدرس" : "Lesson Introduction Video",
            content: `<p>${language === 'ar' ? 'يرجى مشاهدة هذا الفيديو التمهيدي قبل البدء في تصفح الدرس الشرح.' : 'Please watch this introductory video before you start browsing the lesson explanation.'}</p>`,
            videoUrl: data.videoUrl
          });
        }

        setLesson({
          ...data,
          slides: parsedSlides,
          questions: sanitizedQuestions,
          assignments: sanitizedAssignments,
          attachments: Array.isArray(attachments) ? attachments : []
        });

        if (data.xpData) {
          setXpData(data.xpData);
          setTotalLessonXP(data.xpData.totalLessonXP || 0);
        }

        const finalCourseId = data.courseId || courseId;
        if (finalCourseId) {
          const cRes = await fetch(`${API_URL}/courses/${finalCourseId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (cRes.ok) {
            const courseData = await cRes.json();
            setCourse(courseData);
            if (Array.isArray(courseData.lessons)) {
              const sorted = [...courseData.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              setCourseLessons(sorted);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch lesson data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async (state: { playedSeconds: number }) => {
    if (searchParams.get('preview') === 'true') return; // Do not save progress in preview mode
    try {
      const token = localStorage.getItem("lms_token") || 
                    localStorage.getItem("super_admin_token") || 
                    localStorage.getItem("school_admin_token");
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
    if (quizSubmitted[currentQuestionIndex]) return;
    if (lesson.questions[currentQuestionIndex]?.type === 'MULTI_SELECT') {
      const currentArr = answers[currentQuestionIndex] || [];
      const newArr = currentArr.includes(option) ? currentArr.filter((a: string) => a !== option) : [...currentArr, option];
      setAnswers({ ...answers, [currentQuestionIndex]: newArr });
    } else {
      setAnswers({ ...answers, [currentQuestionIndex]: option });
    }
  };

  const handleNextQuestion = () => {
    const isPreviewMode = searchParams.get('preview') === 'true';
    if (!quizSubmitted[currentQuestionIndex]) {
      const q = lesson.questions[currentQuestionIndex];
      const qId = q.id ? String(q.id) : String(currentQuestionIndex);
      const ans = answers[currentQuestionIndex];
      
      if (!isQuestionLike(q) && !isPreviewMode) {
        submitAnswerProgress(qId, 'questions', 'read');
        setQuizSubmitted({ ...quizSubmitted, [currentQuestionIndex]: true });
      }
    }

    if (currentQuestionIndex < lesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Check if there are unanswered questions in the quiz
      const unanswered = [];
      for (let i = 0; i < lesson.questions.length; i++) {
        if (isQuestionLike(lesson.questions[i]) && !answers[i]) {
          unanswered.push(i + 1);
        }
      }

      if (unanswered.length > 0) {
        const confirmMsg = language === 'ar'
          ? `⚠️ لديك أسئلة لم تقم بالإجابة عليها (أرقام: ${unanswered.join(', ')}). هل أنت متأكد من رغبتك في الإنهاء؟`
          : `⚠️ You have unanswered questions (numbers: ${unanswered.join(', ')}). Are you sure you want to finish?`;
        if (!window.confirm(confirmMsg)) {
          return; // Stop submission
        }
      }

      // Mark all as submitted
      const nextSubmitted = { ...quizSubmitted };
      lesson.questions.forEach((q: any, idx: number) => {
        if (isQuestionLike(q)) {
          nextSubmitted[idx] = true;
        }
      });
      setQuizSubmitted(nextSubmitted);
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

  const currentLessonIdx = courseLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentLessonIdx > 0 ? courseLessons[currentLessonIdx - 1] : null;
  const nextLesson = currentLessonIdx >= 0 && currentLessonIdx < courseLessons.length - 1 ? courseLessons[currentLessonIdx + 1] : null;

  const goToLesson = (lsn: any) => {
    router.push(`/lessons/${lsn.id}?courseId=${lesson?.courseId || courseId}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-12 pb-24 overflow-x-hidden px-1 sm:px-0" dir={language === 'ar' ? 'rtl' : 'ltr'}>

        {/* Preview Banner */}
        {searchParams.get('preview') === 'true' && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between shadow-lg font-black text-sm gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 animate-pulse text-amber-200" />
              <span>{language === 'ar' ? 'وضع المعاينة النشط (لن يتم تسجيل المشاهدة أو نتائج التمارين في قاعدة البيانات)' : 'Active Preview Mode (Progress and exercise results will not be recorded in database)'}</span>
            </div>
            <button 
              onClick={() => window.close()} 
              className="bg-white/20 hover:bg-white text-white hover:text-orange-600 px-6 py-2.5 rounded-2xl transition-all text-xs font-black shadow-inner"
            >
              {language === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
            </button>
          </div>
        )}

        {/* ── IMMERSIVE LESSON HEADER ── */}
        <div className="relative w-full rounded-[32px] md:rounded-[40px] bg-[#0f172a] overflow-hidden p-6 md:p-10 shadow-2xl border border-slate-800 group">
          <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-600/30 transition-all duration-1000" />
          <div className="absolute bottom-[-50%] left-[-10%] w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
              {prevLesson ? (
                <button
                  onClick={() => goToLesson(prevLesson)}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-indigo-400/50 hover:bg-white/10 transition-all shadow-sm group/nav shrink-0 backdrop-blur-md"
                  title={prevLesson.title}
                >
                  <ChevronRight className={`w-6 h-6 text-slate-300 group-hover/nav:text-white transition-transform ${language === 'ar' ? 'group-hover/nav:translate-x-1' : 'group-hover/nav:-translate-x-1'}`} />
                </button>
              ) : (
                <button
                  onClick={() => router.back()}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shadow-sm shrink-0 backdrop-blur-md"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <ArrowRight className={`w-6 h-6 text-slate-300 ${language === 'en' && 'rotate-180'}`} />
                </button>
              )}
              <div className="flex-1">
                <p className="text-indigo-400 font-black text-[10px] md:text-xs flex items-center gap-2 mb-1.5 uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" />
                  {course?.title || t('lesson.educationalCourse')}
                </p>
                <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight leading-tight line-clamp-2">{lesson.title}</h1>
              </div>
              {nextLesson && (
                <button
                  onClick={() => goToLesson(nextLesson)}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-600 border border-indigo-500 flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 group/nav shrink-0"
                  title={nextLesson.title}
                >
                  <ChevronLeft className={`w-6 h-6 text-white transition-transform ${language === 'ar' ? 'group-hover/nav:-translate-x-1' : 'group-hover/nav:translate-x-1 rotate-180'}`} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-white/10 md:border-none pt-4 md:pt-0 mt-2 md:mt-0">
              <div className="hidden lg:flex gap-1.5 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                {['welcome', 'slides', 'assignments', 'exercises', 'summary'].map((s) => (
                  <div key={s} className={`h-2 rounded-full transition-all duration-500 ${currentStage === s ? 'w-12 bg-indigo-500 shadow-lg shadow-indigo-500/50' : 'w-4 bg-white/20'}`}></div>
                ))}
              </div>
              <div className="hidden lg:block h-10 w-px bg-white/10 mx-2"></div>
              
              {/* Streak Widget */}
              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-400 px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm animate-pulse shadow-sm">
                  <span className="text-sm">🔥</span>
                  <span>{currentStreak} {language === 'ar' ? 'متتالي' : 'Streak'}</span>
                </div>
              )}

              {/* XP Widget */}
              <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-400 px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm shadow-sm">
                <span className="text-sm">⭐</span>
                <span>{totalLessonXP} XP</span>
              </div>

              {/* Academic Score Widget */}
              <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-3 md:py-4 rounded-2xl text-sm md:text-base font-black flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:scale-105 transition-transform cursor-default border border-indigo-400/50">
                <Star className="w-5 h-5 fill-current text-indigo-100" />
                {score} {t('lesson.pointsEarned')}
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Next/Prev Lesson Switcher Bar (Placed directly below the header) */}
        {(prevLesson || nextLesson) && (
          <div className="bg-white/60 backdrop-blur-xl border border-slate-200/80 p-4 rounded-[30px] flex flex-col sm:flex-row items-center justify-between shadow-sm hover:shadow-md animate-in fade-in slide-in-from-top-2 duration-500 gap-4 transition-all relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 rounded-l-[30px]"></div>
            <div className="flex items-center gap-4 pl-4 rtl:pl-0 rtl:pr-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-[18px] flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100/50">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {language === 'ar' ? 'تنقل سريع بين الدروس' : 'Quick Lesson Navigation'}
                </p>
                <p className="text-sm md:text-base font-black text-slate-800 truncate max-w-[200px] md:max-w-[300px]">
                  {course?.title || (language === 'ar' ? "الكورس الدراسي" : "Educational Course")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {prevLesson && (
                <button
                  onClick={() => goToLesson(prevLesson)}
                  title={prevLesson.title}
                  className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-sm group cursor-pointer"
                >
                  <ChevronRight className={`w-5 h-5 transition-transform text-slate-400 group-hover:text-indigo-600 ${language === 'ar' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                  <div className="flex flex-col text-start hidden md:flex">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                      {language === 'ar' ? 'الدرس السابق' : 'Previous Lesson'}
                    </span>
                    <span className="truncate max-w-[140px] text-xs sm:text-sm font-black">{prevLesson.title}</span>
                  </div>
                </button>
              )}
               {nextLesson && (
                <button
                  onClick={() => goToLesson(nextLesson)}
                  title={nextLesson.title}
                  className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group cursor-pointer border border-indigo-500/20"
                >
                  <div className="flex flex-col text-start">
                    <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">
                      {language === 'ar' ? 'الدرس التالي' : 'Next Lesson'}
                    </span>
                    <span className="truncate max-w-[140px] text-xs sm:text-sm font-black">{nextLesson.title}</span>
                  </div>
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STAGE NAVIGATION TABS ── */}
        {currentStage !== 'summary' && (
          <div className="w-full bg-white/80 backdrop-blur-xl border border-slate-200/80 p-3 rounded-[24px] shadow-sm flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => {
                if (!slideSubmitted[currentSlideIndex] && lesson.slides?.[currentSlideIndex]) {
                  const q = lesson.slides[currentSlideIndex];
                  const qId = q.id ? String(q.id) : String(currentSlideIndex);
                  const ans = isQuestionLike(q) ? slideAnswers[currentSlideIndex] : 'read';
                  submitAnswerProgress(qId, 'slides', ans);
                  setSlideSubmitted({ ...slideSubmitted, [currentSlideIndex]: true });
                }
                setCurrentStage('slides');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer ${
                currentStage === 'slides' || currentStage === 'welcome'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'ar' ? 'الشرح والدرس' : 'Explanation Content'}</span>
            </button>

            <button
              onClick={() => {
                if (!assignmentSubmitted[currentAssignmentIndex] && lesson.assignments?.[currentAssignmentIndex]) {
                  const q = lesson.assignments[currentAssignmentIndex];
                  const qId = q.id ? String(q.id) : String(currentAssignmentIndex);
                  const ans = isQuestionLike(q) ? assignmentAnswers[currentAssignmentIndex] : 'read';
                  submitAnswerProgress(qId, 'assignments', ans);
                  setAssignmentSubmitted({ ...assignmentSubmitted, [currentAssignmentIndex]: true });
                }
                setCurrentStage('assignments');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer ${
                currentStage === 'assignments'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <FileDown className="w-4 h-4" />
              <span>{language === 'ar' ? 'الواجبات' : 'Assignment'}</span>
            </button>

            <button
              onClick={() => {
                if (!quizSubmitted[currentQuestionIndex] && lesson.questions?.[currentQuestionIndex]) {
                  const q = lesson.questions[currentQuestionIndex];
                  const qId = q.id ? String(q.id) : String(currentQuestionIndex);
                  const isPreviewMode = searchParams.get('preview') === 'true';
                  if (!isQuestionLike(q) && !isPreviewMode) {
                    submitAnswerProgress(qId, 'questions', 'read');
                    setQuizSubmitted({ ...quizSubmitted, [currentQuestionIndex]: true });
                  }
                }
                setCurrentStage('exercises');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer ${
                currentStage === 'exercises'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{language === 'ar' ? 'الاختبار' : 'Quiz'}</span>
            </button>
          </div>
        )}

        {/* ── MAIN CONTENT AREA ── */}
        <div className={`grid grid-cols-1 items-start ${currentStage === 'welcome' || currentStage === 'summary' ? 'xl:grid-cols-12' : 'xl:grid-cols-1'} gap-10`}>

          <div className={`${currentStage === 'welcome' || currentStage === 'summary' ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-10`}>



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
                    <WelcomeGadgetCard key={i} item={item} t={t} />
                  ))}
                </div>

                <div className="mt-12 text-center space-y-6">
                  <button
                    onClick={() => setCurrentStage('slides')}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 px-12 py-5 rounded-[25px] font-black text-lg hover:scale-105 transition-all shadow-xl shadow-indigo-100 flex items-center gap-4 mx-auto border border-indigo-500/20"
                  >
                    {t('lesson.showExplanation')}
                    <ArrowLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {currentStage === 'slides' && (
              <div className="premium-card rounded-3xl overflow-hidden flex flex-col group mx-auto w-full max-w-4xl">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
                  <div className="flex items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-widest">
                    <Layout className="w-4 h-4" />
                    {t('lesson.slides')}
                  </div>
                  <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">
                    {t('lesson.slide')} {currentSlideIndex + 1} / {lesson.slides.length}
                  </div>
                </div>

                <div className="p-5 md:p-8 flex flex-col items-center text-center w-full">
                  {lesson.slides[currentSlideIndex].id === 'intro-video-slide' && (
                    <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight animate-in fade-in slide-in-from-top-4 duration-500">
                      {language === 'ar' ? "فيديو مقدمة الدرس" : "Lesson Introduction Video"}
                    </h3>
                  )}
                  {lesson.slides[currentSlideIndex].videoUrl && (
                    <div className="w-full max-w-4xl mx-auto mb-8 rounded-[35px] overflow-hidden shadow-2xl border border-slate-100 relative aspect-video" style={{ aspectRatio: '16/9' }}>
                      <VideoPlayer
                        url={lesson.slides[currentSlideIndex].videoUrl}
                        onProgress={lesson.slides[currentSlideIndex].id === 'intro-video-slide' ? handleProgressUpdate : undefined}
                        onDuration={lesson.slides[currentSlideIndex].id === 'intro-video-slide' ? ((d) => setActualVideoDuration(d)) : undefined}
                      />
                    </div>
                  )}
                  <div className={`w-full max-w-5xl mb-8 ${isQuestionLike(lesson.slides[currentSlideIndex]) ? 'question-frame' : 'text-frame'}`}>
                    <HtmlRenderer
                      html={lesson.slides[currentSlideIndex].content}
                      className="text-base md:text-xl text-slate-600 leading-[1.8] font-bold prose prose-indigo break-words w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 text-start"
                    />
                  </div>
                  {isQuestionLike(lesson.slides[currentSlideIndex]) && lesson.slides[currentSlideIndex].dok && (
                    <div className="w-full max-w-4xl text-start mt-2">
                      <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {language === 'ar' ? `عمق المعرفة: ${lesson.slides[currentSlideIndex].dok}` : `DOK: ${lesson.slides[currentSlideIndex].dok}`}
                      </span>
                    </div>
                  )}



                  {/* Question Options for Slide */}
                  {isQuestionLike(lesson.slides[currentSlideIndex]) && (
                    <>
                      {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(lesson.slides[currentSlideIndex].label || lesson.slides[currentSlideIndex].type || 'MCQ') ? (
                        getQuestionOptions(lesson.slides[currentSlideIndex], language).length > 0 && (
                          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                            {getQuestionOptions(lesson.slides[currentSlideIndex], language).map((opt: string, oIdx: number) => {
                              const isMulti = lesson.slides[currentSlideIndex].label === 'MULTI_SELECT';
                              const isSelected = isMulti ? (slideAnswers[currentSlideIndex] || []).includes(opt) : slideAnswers[currentSlideIndex] === opt;
                              const isSubmitted = slideSubmitted[currentSlideIndex];
                              const isCorrect = isSubmitted && (isMulti ? (lesson.slides[currentSlideIndex].correctAnswers || []).includes(opt) : ((!lesson.slides[currentSlideIndex].correctAnswer && isSelected) || normalizeAnswerGlobal(opt) === normalizeAnswerGlobal(lesson.slides[currentSlideIndex].correctAnswer)));
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
                                  <div className="flex items-center gap-3.5 flex-1 text-start">
                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                                      isSelected
                                        ? (isCorrect ? "bg-emerald-600 text-white" : isWrong ? "bg-red-600 text-white" : "bg-indigo-600 text-white")
                                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                    }`}>
                                      {getOptionLetter(oIdx, language)}
                                    </span>
                                    <span className={`text-xl font-bold flex-1 ${isSelected ? (isCorrect ? 'text-emerald-700' : isWrong ? 'text-red-700' : 'text-indigo-700') : 'text-slate-700'}`}>
                                      <HtmlRenderer html={cleanOptionText(opt)} tag="span" />
                                    </span>
                                  </div>
                                  {isSelected && !isSubmitted && <CheckCircle2 className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-indigo-500" />}
                                  {isCorrect && <CheckCircle2 className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-emerald-500" />}
                                  {isWrong && <X className="absolute top-1/2 left-6 -translate-y-1/2 w-8 h-8 text-red-500" />}
                                </button>
                              );
                            })}
                          </div>
                        )
                      ) : (
                        <div className="mt-8 w-full max-w-4xl text-start bg-slate-50 p-6 rounded-3xl border border-slate-200">
                          <InteractiveQuestionRenderer
                            question={{
                              ...lesson.slides[currentSlideIndex],
                              type: lesson.slides[currentSlideIndex].label || lesson.slides[currentSlideIndex].type || 'MCQ'
                            }}
                            value={slideAnswers[currentSlideIndex] || ''}
                            onChange={(val: any) => {
                              if (!slideSubmitted[currentSlideIndex]) {
                                setSlideAnswers({ ...slideAnswers, [currentSlideIndex]: typeof val === 'string' ? val : JSON.stringify(val) });
                              }
                            }}
                            language={language}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {isQuestionLike(lesson.slides[currentSlideIndex]) && slideAnswers[currentSlideIndex] && !slideSubmitted[currentSlideIndex] && (
                    <button
                      onClick={() => {
                        const q = lesson.slides[currentSlideIndex];
                        const qId = q.id ? String(q.id) : String(currentSlideIndex);
                        const ans = slideAnswers[currentSlideIndex];
                        submitAnswerProgress(qId, 'slides', ans);
                        setSlideSubmitted({ ...slideSubmitted, [currentSlideIndex]: true });
                      }}
                      className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 border border-emerald-500/20"
                    >
                      {language === 'ar' ? 'تأكيد الإجابة ✓' : 'Confirm Answer ✓'}
                    </button>
                  )}


                  <SlideSectionsToggle 
                    slide={lesson.slides[currentSlideIndex]} 
                    slideIndex={currentSlideIndex}
                    slideSubmitted={slideSubmitted} 
                    slideAnswers={slideAnswers}
                    language={language}
                  />
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center gap-6 shrink-0" dir="rtl">
                  <button
                    onClick={() => {
                      if (currentSlideIndex > 0) {
                        setCurrentSlideIndex(prev => prev - 1);
                      } else {
                        setCurrentStage('welcome');
                      }
                    }}
                    className="w-12 h-12 rounded-2xl bg-slate-50/80 border-2 border-slate-200/60 flex items-center justify-center hover:bg-slate-100 transition-all shadow-sm"
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
                      onClick={() => {
                        const isPreviewMode = searchParams.get('preview') === 'true';
                        if (!slideSubmitted[currentSlideIndex]) {
                          const q = lesson.slides[currentSlideIndex];
                          const qId = q.id ? String(q.id) : String(currentSlideIndex);
                          const ans = slideAnswers[currentSlideIndex];
                          const hasAnswer = ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
                          if (hasAnswer || !isPreviewMode) {
                            const finalAns = isQuestionLike(q) ? (hasAnswer ? ans : '') : 'read';
                            submitAnswerProgress(qId, 'slides', finalAns);
                            setSlideSubmitted({ ...slideSubmitted, [currentSlideIndex]: true });
                          }
                        }
                        setCurrentSlideIndex(prev => prev + 1);
                      }}
                      className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all border border-indigo-500/20"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const isPreviewMode = searchParams.get('preview') === 'true';
                        if (!slideSubmitted[currentSlideIndex]) {
                          const q = lesson.slides[currentSlideIndex];
                          const qId = q.id ? String(q.id) : String(currentSlideIndex);
                          const ans = slideAnswers[currentSlideIndex];
                          const hasAnswer = ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
                          if (hasAnswer || !isPreviewMode) {
                            const finalAns = isQuestionLike(q) ? (hasAnswer ? ans : '') : 'read';
                            submitAnswerProgress(qId, 'slides', finalAns);
                            setSlideSubmitted({ ...slideSubmitted, [currentSlideIndex]: true });
                          }
                        }
                        setCurrentStage('assignments');
                      }}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-base hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center gap-3 shrink-0 border border-indigo-500/20"
                    >
                      {t('lesson.showAssignments')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentStage === 'assignments' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 flex flex-col items-center w-full">
                {/* 1. Header Navigation Bar for Assignment */}
                <div className="premium-card p-4 rounded-[30px] flex flex-col md:flex-row items-center justify-between border-b-4 border-indigo-600 w-full max-w-4xl mx-auto gap-4 shrink-0">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {lesson.assignments?.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          const isPreviewMode = searchParams.get('preview') === 'true';
                          if (!assignmentSubmitted[currentAssignmentIndex]) {
                            const q = lesson.assignments[currentAssignmentIndex];
                            const qId = q.id ? String(q.id) : String(currentAssignmentIndex);
                            const ans = assignmentAnswers[currentAssignmentIndex];
                            const hasAnswer = ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
                            if (hasAnswer || !isPreviewMode) {
                              const finalAns = isQuestionLike(q) ? (hasAnswer ? ans : '') : 'read';
                              submitAnswerProgress(qId, 'assignments', finalAns);
                              setAssignmentSubmitted({ ...assignmentSubmitted, [currentAssignmentIndex]: true });
                            }
                          }
                          setCurrentAssignmentIndex(i);
                        }}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-black transition-all border-2 flex items-center justify-center text-xs ${currentAssignmentIndex === i ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : assignmentAnswers[i] ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-mono font-bold text-sm shadow-sm shrink-0">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    {Math.floor(assignmentTimer / 60)}:{(assignmentTimer % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                {/* 2. Main Question Card for Assignment */}
                <div className="premium-card rounded-[40px] overflow-hidden shadow-2xl border-indigo-50 w-full max-w-5xl mx-auto flex flex-col">
                  {lesson.assignments?.length > 0 && lesson.assignments[currentAssignmentIndex] ? (
                    <>
                      <div className="p-8 md:p-10">
                        {/* Metadata Row */}
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex flex-wrap items-center gap-3 max-w-full w-full">
                            <span className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-black uppercase tracking-wider shadow-sm max-w-full break-words whitespace-normal text-right">
                              {language === 'ar' ? 'الواجب' : 'Assignment'} {currentAssignmentIndex + 1}
                            </span>
                            {lesson.assignments[currentAssignmentIndex].level && (
                              <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.level')}: {lesson.assignments[currentAssignmentIndex].level === 'Easy' || lesson.assignments[currentAssignmentIndex].level === 'Foundation' ? t('lesson.easy') : lesson.assignments[currentAssignmentIndex].level === 'Medium' || lesson.assignments[currentAssignmentIndex].level === 'On Level' ? t('lesson.medium') : t('lesson.hard')}
                              </span>
                            )}
                            {lesson.assignments[currentAssignmentIndex].dok && (
                              <span className="px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {language === 'ar' ? `عمق المعرفة: ${lesson.assignments[currentAssignmentIndex].dok}` : `DOK: ${lesson.assignments[currentAssignmentIndex].dok}`}
                              </span>
                            )}
                            {lesson.assignments[currentAssignmentIndex].skill && (
                              <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.skill')}: {lesson.assignments[currentAssignmentIndex].skill}
                              </span>
                            )}
                            {lesson.assignments[currentAssignmentIndex].standard && (
                              <span className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.standard')}: {lesson.assignments[currentAssignmentIndex].standard}
                              </span>
                            )}
                            {lesson.assignments[currentAssignmentIndex].indicator && (
                              <span className="px-3 py-2 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {t('lesson.indicator')}: {lesson.assignments[currentAssignmentIndex].indicator}
                              </span>
                            )}
                            {lesson.assignments[currentAssignmentIndex].learningOutcome && (
                              <span className="flex items-start gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{t('lesson.outcome')}: {lesson.assignments[currentAssignmentIndex].learningOutcome}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="question-frame mb-8 w-full">
                          <HtmlRenderer html={lesson.assignments[currentAssignmentIndex].text} tag="h3" className="text-lg md:text-2xl font-black text-slate-900 leading-relaxed tracking-tight break-words w-full text-start" />
                        </div>

                        {/* Question Input */}
                        {isQuestionLike(lesson.assignments[currentAssignmentIndex]) && (
                          <>
                            {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(lesson.assignments[currentAssignmentIndex].type || lesson.assignments[currentAssignmentIndex].label || 'MCQ') ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 mb-6">
                                {getQuestionOptions(lesson.assignments[currentAssignmentIndex], language).map((opt: string, oIdx: number) => {
                                  const isMulti = lesson.assignments[currentAssignmentIndex].type === 'MULTI_SELECT' || lesson.assignments[currentAssignmentIndex].label === 'MULTI_SELECT';
                                  const isSelected = isMulti ? (assignmentAnswers[currentAssignmentIndex] || []).includes(opt) : assignmentAnswers[currentAssignmentIndex] === opt;
                                  const isSubmitted = assignmentSubmitted[currentAssignmentIndex];
                                  const isCorrect = isSubmitted && (isMulti ? (lesson.assignments[currentAssignmentIndex].correctAnswers || []).includes(opt) : ((!lesson.assignments[currentAssignmentIndex].correctAnswer && isSelected) || normalizeAnswerGlobal(opt) === normalizeAnswerGlobal(lesson.assignments[currentAssignmentIndex].correctAnswer)));
                                  const isWrong = isSubmitted && isSelected && !isCorrect;

                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => {
                                        if (isSubmitted) return;
                                        if (isMulti) {
                                          const currentArr = assignmentAnswers[currentAssignmentIndex] || [];
                                          const newArr = currentArr.includes(opt) ? currentArr.filter((a: string) => a !== opt) : [...currentArr, opt];
                                          setAssignmentAnswers({ ...assignmentAnswers, [currentAssignmentIndex]: newArr });
                                        } else {
                                          setAssignmentAnswers({ ...assignmentAnswers, [currentAssignmentIndex]: opt });
                                        }
                                      }}
                                      disabled={isSubmitted}
                                      className={`p-5 md:p-6 rounded-[25px] border-4 text-start transition-all duration-300 font-black text-sm md:text-base relative break-words overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : isWrong ? 'border-red-500 bg-red-50 text-red-700' : 'bg-indigo-600 border-white text-white shadow-xl shadow-indigo-100') : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                                    >
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3.5 flex-1 text-start">
                                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                                            isSelected && !isSubmitted
                                              ? "bg-white/20 text-white"
                                              : isCorrect
                                                ? "bg-emerald-600 text-white"
                                                : isWrong
                                                  ? "bg-red-600 text-white"
                                                  : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                          }`}>
                                            {getOptionLetter(oIdx, language)}
                                          </span>
                                          <span className={`flex-1 break-words leading-relaxed ${isSelected && !isSubmitted ? 'text-white' : ''}`}>
                                            <HtmlRenderer html={cleanOptionText(opt)} tag="span" />
                                          </span>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected && !isSubmitted ? 'border-white bg-white/20' : isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : isWrong ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200'}`}>
                                          {isSelected && !isSubmitted && <CheckCircle2 className="w-4 h-4" />}
                                          {isCorrect && <CheckCircle2 className="w-4 h-4" />}
                                          {isWrong && <X className="w-4 h-4" />}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="w-full text-start bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-6">
                                <InteractiveQuestionRenderer
                                  question={{
                                    ...lesson.assignments[currentAssignmentIndex],
                                    type: lesson.assignments[currentAssignmentIndex].type || lesson.assignments[currentAssignmentIndex].label || 'MCQ'
                                  }}
                                  value={assignmentAnswers[currentAssignmentIndex] || ''}
                                  onChange={(val: any) => {
                                    if (!assignmentSubmitted[currentAssignmentIndex]) {
                                      setAssignmentAnswers({ ...assignmentAnswers, [currentAssignmentIndex]: typeof val === 'string' ? val : JSON.stringify(val) });
                                    }
                                  }}
                                  language={language}
                                />
                              </div>
                            )}
                          </>
                        )}

                        {assignmentAnswers[currentAssignmentIndex] && !assignmentSubmitted[currentAssignmentIndex] && (
                          <button
                            onClick={() => {
                              const q = lesson.assignments[currentAssignmentIndex];
                              const qId = q.id ? String(q.id) : String(currentAssignmentIndex);
                              const ans = assignmentAnswers[currentAssignmentIndex];
                              submitAnswerProgress(qId, 'assignments', ans);
                              setAssignmentSubmitted({ ...assignmentSubmitted, [currentAssignmentIndex]: true });
                            }}
                            className="mt-2 mb-6 bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 border border-emerald-500/20"
                          >
                            {language === 'ar' ? 'تأكيد الإجابة' : 'Confirm Answer'}
                          </button>
                        )}

                        {assignmentSubmitted[currentAssignmentIndex] && isQuestionLike(lesson.assignments[currentAssignmentIndex]) && (() => {
                          const isMulti = lesson.assignments[currentAssignmentIndex].type === 'MULTI_SELECT' || lesson.assignments[currentAssignmentIndex].label === 'MULTI_SELECT';
                          const isStandard = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(lesson.assignments[currentAssignmentIndex].type || lesson.assignments[currentAssignmentIndex].label || 'MCQ');
                          const studentAnswers = assignmentAnswers[currentAssignmentIndex] || (isMulti ? [] : '');
                          
                          const isCorrect = isStandard
                            ? (isMulti ? studentAnswers.length === (lesson.assignments[currentAssignmentIndex].correctAnswers || []).length && studentAnswers.every((a: string) => (lesson.assignments[currentAssignmentIndex].correctAnswers || []).includes(a)) : (!lesson.assignments[currentAssignmentIndex].correctAnswer || normalizeAnswerGlobal(assignmentAnswers[currentAssignmentIndex]) === normalizeAnswerGlobal(lesson.assignments[currentAssignmentIndex].correctAnswer)))
                            : checkAdvancedCorrect(lesson.assignments[currentAssignmentIndex], assignmentAnswers[currentAssignmentIndex]);

                          const isSkipped = !studentAnswers || (Array.isArray(studentAnswers) && studentAnswers.length === 0) || studentAnswers === '' || studentAnswers === '[]';
                          const isExplanation = lesson.assignments[currentAssignmentIndex].type === 'EXPLANATION' || lesson.assignments[currentAssignmentIndex].label === 'EXPLANATION';

                          if (isExplanation) return null;

                          return null;
                        })()}

                        <AssignmentSectionsToggle 
                          assignment={lesson.assignments[currentAssignmentIndex]} 
                          assignmentIndex={currentAssignmentIndex}
                          assignmentSubmitted={assignmentSubmitted} 
                          assignmentAnswers={assignmentAnswers}
                          language={language}
                        />
                      </div>

                      {/* Footer Actions for Assignment */}
                      <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
                        <button
                          onClick={() => setCurrentAssignmentIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentAssignmentIndex === 0}
                          className="bg-slate-50/80 border-2 border-slate-200/60 text-slate-900 px-6 py-3 rounded-xl font-black hover:bg-slate-100 disabled:opacity-20 text-sm"
                        >
                          {t('lesson.previous')}
                        </button>
                        <button
                          onClick={() => {
                            const isPreviewMode = searchParams.get('preview') === 'true';
                            if (!assignmentSubmitted[currentAssignmentIndex]) {
                              const q = lesson.assignments[currentAssignmentIndex];
                              const qId = q.id ? String(q.id) : String(currentAssignmentIndex);
                              const ans = assignmentAnswers[currentAssignmentIndex];
                              const hasAnswer = ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
                              if (hasAnswer || !isPreviewMode) {
                                const finalAns = isQuestionLike(q) ? (hasAnswer ? ans : '') : 'read';
                                submitAnswerProgress(qId, 'assignments', finalAns);
                                setAssignmentSubmitted({ ...assignmentSubmitted, [currentAssignmentIndex]: true });
                              }
                            }
                            if (currentAssignmentIndex < lesson.assignments.length - 1) {
                              setCurrentAssignmentIndex(prev => prev + 1);
                            } else {
                              // Checking for skipped assignment questions
                              const unanswered = [];
                              for (let i = 0; i < lesson.assignments.length; i++) {
                                if (isQuestionLike(lesson.assignments[i]) && !assignmentAnswers[i]) {
                                  unanswered.push(i + 1);
                                }
                              }

                              if (unanswered.length > 0) {
                                const confirmMsg = language === 'ar'
                                  ? `⚠️ لديك واجبات لم تقم بالإجابة عليها (أرقام: ${unanswered.join(', ')}). هل أنت متأكد من رغبتك في الانتقال للتمارين؟`
                                  : `⚠️ You have unanswered assignments (numbers: ${unanswered.join(', ')}). Are you sure you want to go to exercises?`;
                                if (!window.confirm(confirmMsg)) {
                                  return; // Stop transition
                                }
                              }

                              // Mark all as submitted
                              const nextSubmitted = { ...assignmentSubmitted };
                              lesson.assignments.forEach((as: any, idx: number) => {
                                if (isQuestionLike(as)) {
                                  nextSubmitted[idx] = true;
                                }
                              });
                              setAssignmentSubmitted(nextSubmitted);
                              setCurrentStage('exercises');
                            }
                          }}
                          className="px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-3 text-base shadow-xl border border-indigo-500/20 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                        >
                          {currentAssignmentIndex < lesson.assignments.length - 1 ? t('lesson.next') : (language === 'ar' ? 'بدء التمارين' : 'Start Exercises')}
                          <ChevronLeft className="w-5 h-5 transition-transform text-white" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20 space-y-6 flex-1 flex flex-col items-center justify-center">
                      <p className="text-slate-400 font-bold text-base">{language === 'ar' ? 'لا توجد واجبات لهذا الدرس' : 'No assignments for this lesson'}</p>
                      <button
                        onClick={() => setCurrentStage('exercises')}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black"
                      >
                        {language === 'ar' ? 'انتقل للتمارين' : 'Go to Exercises'}
                      </button>
                    </div>
                  )}
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
                        onClick={() => {
                          if (!quizSubmitted[currentQuestionIndex]) {
                            const q = lesson.questions[currentQuestionIndex];
                            const qId = q.id ? String(q.id) : String(currentQuestionIndex);
                            const isPreviewMode = searchParams.get('preview') === 'true';
                            if (!isQuestionLike(q) && !isPreviewMode) {
                              submitAnswerProgress(qId, 'questions', 'read');
                              setQuizSubmitted({ ...quizSubmitted, [currentQuestionIndex]: true });
                            }
                          }
                          setCurrentQuestionIndex(i);
                        }}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-black transition-all border-2 flex items-center justify-center text-xs ${currentQuestionIndex === i ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : answers[i] ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(t('lesson.quizModePrompt'))) {
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
                                {t('lesson.level')}: {lesson.questions[currentQuestionIndex].level === 'Easy' || lesson.questions[currentQuestionIndex].level === 'Foundation' ? t('lesson.easy') : lesson.questions[currentQuestionIndex].level === 'Medium' || lesson.questions[currentQuestionIndex].level === 'On Level' ? t('lesson.medium') : t('lesson.hard')}
                              </span>
                            )}
                            {lesson.questions[currentQuestionIndex].dok && (
                              <span className="px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider max-w-full break-words whitespace-normal text-right">
                                {language === 'ar' ? `عمق المعرفة: ${lesson.questions[currentQuestionIndex].dok}` : `DOK: ${lesson.questions[currentQuestionIndex].dok}`}
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

                        <div className="question-frame mb-8 w-full">
                          <HtmlRenderer html={lesson.questions[currentQuestionIndex].text} tag="h3" className="text-lg md:text-2xl font-black text-slate-900 leading-relaxed tracking-tight break-words w-full text-start" />
                        </div>

                        {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(lesson.questions[currentQuestionIndex].type || lesson.questions[currentQuestionIndex].label || 'MCQ') ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 mb-6">
                            {getQuestionOptions(lesson.questions[currentQuestionIndex], language).map((opt: string, oIdx: number) => {
                              const isMulti = lesson.questions[currentQuestionIndex].type === 'MULTI_SELECT';
                              const isSelected = isMulti ? (answers[currentQuestionIndex] || []).includes(opt) : answers[currentQuestionIndex] === opt;
                              const isSubmitted = quizSubmitted[currentQuestionIndex];
                              const isCorrect = isSubmitted && (isMulti ? (lesson.questions[currentQuestionIndex].correctAnswers || []).includes(opt) : ((!lesson.questions[currentQuestionIndex].correctAnswer && isSelected) || normalizeAnswerGlobal(opt) === normalizeAnswerGlobal(lesson.questions[currentQuestionIndex].correctAnswer)));
                              const isWrong = isSubmitted && isSelected && !isCorrect;

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleAnswerSelect(opt)}
                                  disabled={isSubmitted}
                                  className={`p-5 md:p-6 rounded-[25px] border-4 text-start transition-all duration-300 font-black text-sm md:text-base relative break-words overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : isWrong ? 'border-red-500 bg-red-50 text-red-700' : 'bg-indigo-600 border-white text-white shadow-xl shadow-indigo-100') : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5 flex-1 text-start">
                                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                                        isSelected && !isSubmitted
                                          ? "bg-white/20 text-white"
                                          : isCorrect
                                            ? "bg-emerald-600 text-white"
                                            : isWrong
                                              ? "bg-red-600 text-white"
                                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                                      }`}>
                                        {getOptionLetter(oIdx, language)}
                                      </span>
                                      <span className={`flex-1 break-words leading-relaxed ${isSelected && !isSubmitted ? 'text-white' : ''}`}>
                                        <HtmlRenderer html={cleanOptionText(opt)} tag="span" />
                                      </span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected && !isSubmitted ? 'border-white bg-white/20' : isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : isWrong ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200'}`}>
                                      {isSelected && !isSubmitted && <CheckCircle2 className="w-4 h-4" />}
                                      {isCorrect && <CheckCircle2 className="w-4 h-4" />}
                                      {isWrong && <X className="w-4 h-4" />}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="w-full text-start bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-6">
                            <InteractiveQuestionRenderer
                              question={{
                                ...lesson.questions[currentQuestionIndex],
                                type: lesson.questions[currentQuestionIndex].type || lesson.questions[currentQuestionIndex].label || 'MCQ'
                              }}
                              value={answers[currentQuestionIndex] || ''}
                              onChange={(val: any) => {
                                if (!quizSubmitted[currentQuestionIndex]) {
                                  setAnswers({ ...answers, [currentQuestionIndex]: typeof val === 'string' ? val : JSON.stringify(val) });
                                }
                              }}
                              language={language}
                            />
                          </div>
                        )}

                        {answers[currentQuestionIndex] && !quizSubmitted[currentQuestionIndex] && (
                          <button
                            onClick={() => {
                              const q = lesson.questions[currentQuestionIndex];
                              const qId = q.id ? String(q.id) : String(currentQuestionIndex);
                              const ans = answers[currentQuestionIndex];
                              submitAnswerProgress(qId, 'questions', ans);
                              setQuizSubmitted({ ...quizSubmitted, [currentQuestionIndex]: true });
                            }}
                            className="mt-2 mb-6 bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 border border-emerald-500/20"
                          >
                            {language === 'ar' ? 'تأكيد الإجابة' : 'Confirm Answer'}
                          </button>
                        )}

                        {quizSubmitted[currentQuestionIndex] && (() => {
                          const isMulti = lesson.questions[currentQuestionIndex].type === 'MULTI_SELECT' || lesson.questions[currentQuestionIndex].label === 'MULTI_SELECT';
                          const isStandard = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(lesson.questions[currentQuestionIndex].type || lesson.questions[currentQuestionIndex].label || 'MCQ');
                          const studentAnswers = answers[currentQuestionIndex] || (isMulti ? [] : '');
                          
                          const isCorrect = isStandard
                            ? (isMulti ? studentAnswers.length === (lesson.questions[currentQuestionIndex].correctAnswers || []).length && studentAnswers.every((a: string) => (lesson.questions[currentQuestionIndex].correctAnswers || []).includes(a)) : (!lesson.questions[currentQuestionIndex].correctAnswer || normalizeAnswerGlobal(answers[currentQuestionIndex]) === normalizeAnswerGlobal(lesson.questions[currentQuestionIndex].correctAnswer)))
                            : checkAdvancedCorrect(lesson.questions[currentQuestionIndex], answers[currentQuestionIndex]);

                          const isSkipped = !studentAnswers || (Array.isArray(studentAnswers) && studentAnswers.length === 0) || studentAnswers === '' || studentAnswers === '[]';
                          const isExplanation = lesson.questions[currentQuestionIndex].type === 'EXPLANATION' || lesson.questions[currentQuestionIndex].label === 'EXPLANATION';

                          if (isExplanation) return null;

                          return null;
                        })()}

                        <QuizSectionsToggle 
                          question={lesson.questions[currentQuestionIndex]} 
                          questionIndex={currentQuestionIndex}
                          quizSubmitted={quizSubmitted}
                          language={language}
                        />
                      </div>

                      <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="bg-slate-50/80 border-2 border-slate-200/60 text-slate-900 px-6 py-3 rounded-xl font-black hover:bg-slate-100 disabled:opacity-20 text-sm"
                        >
                          {t('lesson.previous')}
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          className="px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-3 text-base shadow-xl border border-indigo-500/20 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                        >
                          {currentQuestionIndex < lesson.questions.length - 1 ? t('lesson.next') : t('lesson.finishQuiz')}
                          <ChevronLeft className="w-5 h-5 transition-transform text-white" />
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

            {currentStage === 'summary' && (
              <LessonSummaryView
                pct={attemptedMaxScore > 0 ? Math.round((score / attemptedMaxScore) * 100) : 0}
                language={language}
                correctCount={correctCount}
                attemptedQuestionsCount={attemptedQuestionsCount}
                totalLessonXP={totalLessonXP}
                sessionXP={sessionXP}
                sessionBonusXP={sessionBonusXP}
                highestStreak={highestStreak}
                quizTimer={quizTimer}
                assignmentTimer={assignmentTimer}
                lesson={lesson}
                assignmentSubmitted={assignmentSubmitted}
                quizSubmitted={quizSubmitted}
                assignmentAnswers={assignmentAnswers}
                answers={answers}
                t={t}
                nextLesson={nextLesson}
                prevLesson={prevLesson}
                goToLesson={goToLesson}
                router={router}
                onReset={() => {
                  setAnswers({});
                  setSlideAnswers({});
                  setSlideSubmitted({});
                  setAssignmentAnswers({});
                  setAssignmentSubmitted({});
                  setQuizSubmitted({});
                  setScore(0);
                  setCorrectCount(0);
                  setAttemptedQuestionsCount(0);
                  setSessionXP(0);
                  setSessionBonusXP(0);
                  setHighestStreak(0);
                  setCurrentStage('welcome');
                  setCurrentSlideIndex(0);
                  setCurrentQuestionIndex(0);
                }}
              />
            )}
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
                        <span className="text-[11px] font-black text-slate-700 truncate">{att.name || `${t('lesson.attachment')} ${i + 1}`}</span>
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

      {/* ── Animated Feedback Overlay ── */}
      {toastFeedback && (
        <AnimatedFeedback 
          isCorrect={toastFeedback.isCorrect !== false} 
          xp={toastFeedback.xp} 
          streak={toastFeedback.streakCount} 
          onComplete={() => setToastFeedback(null)} 
        />
      )}

      {/* ── Streak Milestone Celebration Modal ── */}
      {showStreakMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="fixed inset-0 pointer-events-none z-[100]">
            <Confetti recycle={false} numberOfPieces={showStreakMilestone.count >= 10 ? 600 : 300} gravity={0.15} />
          </div>

          <div className={`relative p-8 md:p-12 rounded-[32px] max-w-md w-full mx-4 text-center shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center z-[101] border ${
            showStreakMilestone.count >= 10
              ? 'bg-gradient-to-b from-indigo-50 to-white border-indigo-200'
              : 'bg-white border-amber-200'
          }`}>
            {/* Icon */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce ${
              showStreakMilestone.count >= 10
                ? 'bg-indigo-100 border-2 border-indigo-200'
                : 'bg-amber-50 border border-amber-100'
            }`}>
              {showStreakMilestone.count >= 10 ? '🏆' : '🔥'}
            </div>
            
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
              {showStreakMilestone.count >= 10
                ? (language === 'ar' ? 'مجموعة مثالية! 🏆' : 'Perfect Set! 🏆')
                : showStreakMilestone.count >= 5
                  ? (language === 'ar' ? 'أداء ناري! 🔥' : 'On Fire! 🔥')
                  : (language === 'ar' ? 'سلسلة إجابات! 🎉' : 'Streak! 🎉')
              }
            </h3>
            
            <p className="text-slate-500 font-bold text-base mb-6 leading-relaxed">
              {language === 'ar' 
                ? `لقد أجبت على ${showStreakMilestone.count} أسئلة متتالية بشكل صحيح! حصلت على مكافأة إضافية:`
                : `You answered ${showStreakMilestone.count} questions correctly in a row! You earned a bonus of:`}
            </p>

            <div className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-xl mb-8 shadow-inner animate-pulse ${
              showStreakMilestone.count >= 10
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                : 'bg-amber-50 border border-amber-200 text-amber-600'
            }`}>
              {showStreakMilestone.count >= 10 ? '⭐' : '🎁'} +{showStreakMilestone.xp} XP
            </div>

            <button
              onClick={() => setShowStreakMilestone(null)}
              className={`w-full font-black py-4 rounded-2xl text-base shadow-lg transition-all border text-white ${
                showStreakMilestone.count >= 10
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-indigo-500/20 shadow-indigo-500/20'
                  : 'bg-amber-500 hover:bg-amber-600 border-amber-400 shadow-amber-500/20'
              }`}
            >
              {showStreakMilestone.count >= 10
                ? (language === 'ar' ? 'مذهل! ⭐' : 'Amazing! ⭐')
                : (language === 'ar' ? 'رائع! استمر' : 'Awesome! Keep going')
              }
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.2); }

      @keyframes bounce-slow {
        0 %, 100 % { transform: translateY(0); }
          50% {transform: translateY(-10px); }
        }
      .animate-bounce-slow {animation: bounce-slow 3s infinite ease-in-out; }

      /* ── Trophy float: gentle up/down with scale pulse ── */
      @keyframes float-trophy {
        0 % { transform: translateY(0px) scale(1); box- shadow: 0 0 40px rgba(16,185,129,0.6), 0 20px 40px rgba(5,150,105,0.4); }
      30%  {transform: translateY(-14px) scale(1.06); box-shadow: 0 0 70px rgba(16,185,129,0.9), 0 30px 60px rgba(5,150,105,0.6); }
      60%  {transform: translateY(-6px) scale(1.03); }
      100% {transform: translateY(0px) scale(1); box-shadow: 0 0 40px rgba(16,185,129,0.6), 0 20px 40px rgba(5,150,105,0.4); }
        }
      .animate-float-trophy {animation: float-trophy 2.4s infinite ease-in-out; }

      /* ── Star float: bouncy with glow pulse ── */
      @keyframes float-star {
        0 % { transform: translateY(0px) rotate(- 3deg) scale(1); }
      25%  {transform: translateY(-16px) rotate(4deg) scale(1.08); }
      50%  {transform: translateY(-8px) rotate(-2deg) scale(1.04); }
      75%  {transform: translateY(-18px) rotate(5deg) scale(1.1); }
      100% {transform: translateY(0px) rotate(-3deg) scale(1); }
        }
      .animate-float-star {animation: float-star 2.2s infinite ease-in-out; }

      /* ── Slow spin for conic ring & star icon ── */
      @keyframes spin-slow {
        from {transform: rotate(0deg); }
      to   {transform: rotate(360deg); }
        }
      .animate-spin-slow {animation: spin-slow 6s linear infinite; }

      /* ── Shake for retry icon ── */
      @keyframes shake {
        0 %, 100 % { transform: translateX(0) rotate(0deg); }
          15%      {transform: translateX(-8px) rotate(-6deg); }
      30%      {transform: translateX(8px) rotate(6deg); }
      45%      {transform: translateX(-5px) rotate(-3deg); }
      60%      {transform: translateX(5px) rotate(3deg); }
      75%      {transform: translateX(-3px) rotate(-1deg); }
      90%      {transform: translateX(3px) rotate(1deg); }
        }
      .animate-shake {animation: shake 1.8s infinite ease-in-out; }

      /* ── Slow ping for glow rings ── */
      @keyframes ping-slow {
        0 % { transform: scale(0.85); opacity: 0.8; }
          50%  {transform: scale(1.15); opacity: 0.3; }
      100% {transform: scale(0.85); opacity: 0.8; }
        }
      .animate-ping-slow {animation: ping-slow 2s infinite ease-in-out; }

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
        from {opacity: 0; transform: translateY(10px); }
      to {opacity: 1; transform: translateY(0); }
        }
      ` }} />

    </DashboardLayout>
  );
}
