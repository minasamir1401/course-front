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
import { InteractiveTag } from "@/components/InteractiveTag";

import { 
  normalizeAnswerGlobal, 
  checkAdvancedCorrect, 
  isQuestionLike, 
  getQuestionOptions, 
  QuestionFeedback, 
  WelcomeGadgetCard, 
  ItemSectionsBubbles
} from "@/components/LessonSubComponents";
import LessonSummaryView from "@/components/LessonSummaryView";

export function useLessonPlayer() {
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
  // Preview mode local counters (not persisted)
  const previewStreakRef = React.useRef(0);
  const [toastFeedback, setToastFeedback] = useState<{
    type: 'success' | 'streak' | 'perfect' | 'incorrect';
    xp: number;
    streakCount?: number;
    bonusXP?: number;
    level?: 'Easy' | 'Medium' | 'Hard';
    isCorrect?: boolean;
  } | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [unansweredWarning, setUnansweredWarning] = useState<number[] | null>(null);

  const submitAnswerProgress = async (questionId: string, blockType: 'slides' | 'assignments' | 'questions', selectedAnswer: any, questionBlock?: any, isExplicitConfirmation = true) => {
    const isPreviewMode = searchParams.get('preview') === 'true';
    if (isPreviewMode) {
      // In preview mode: evaluate answer locally and show correct/incorrect feedback ONLY on explicit confirmation
      let isCorrect = true;
      const isRealQuestion = questionBlock && isQuestionLike(questionBlock) && selectedAnswer !== 'read';
      if (isRealQuestion) {
        isCorrect = checkAdvancedCorrect(questionBlock, selectedAnswer);
      }

      // Calculate simulated XP based on question level
      let simulatedXP = 0;
      if (isRealQuestion && isCorrect) {
        const lvl = String(questionBlock?.level || '').toLowerCase();
        if (lvl === 'easy' || lvl === 'foundation') simulatedXP = 2;
        else if (lvl === 'medium' || lvl === 'on level') simulatedXP = 4;
        else simulatedXP = 10;
        if (questionBlock?.xpPoints !== undefined) simulatedXP = Number(questionBlock.xpPoints) || simulatedXP;
      }

      // Update local streak in preview
      if (isRealQuestion && isExplicitConfirmation) {
        if (isCorrect) {
          previewStreakRef.current += 1;
        } else {
          previewStreakRef.current = 0;
        }
      }
      const localStreak = previewStreakRef.current;

      // Update local XP display
      if (simulatedXP > 0 && isExplicitConfirmation) {
        setTotalLessonXP((prev: any) => prev + simulatedXP);
        setSessionXP((prev: any) => prev + simulatedXP);
        setHighestStreak((prev: any) => Math.max(prev, localStreak));
      }
      setCurrentStreak(localStreak);

      // Preview streak milestone
      let bonusXP = 0;
      if (isRealQuestion && isCorrect && isExplicitConfirmation && (localStreak === 5 || localStreak === 10)) {
        bonusXP = localStreak === 5 ? 10 : 30;
        setTotalLessonXP((prev: any) => prev + bonusXP);
        setSessionBonusXP((prev: any) => prev + bonusXP);
        setShowStreakMilestone({ count: localStreak, xp: bonusXP });
      }

      if (isRealQuestion && isExplicitConfirmation) {
        setFeedbackKey(k => k + 1);
        setToastFeedback({ 
          type: isCorrect ? 'success' : 'incorrect', 
          xp: simulatedXP, 
          isCorrect, 
          streakCount: localStreak,
          bonusXP: bonusXP > 0 ? bonusXP : undefined
        });
      } else {
        setToastFeedback(null);
      }
      return;
    }

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
          selectedAnswer,
          isCompleted: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        let currentLevel = 'Medium';
        if (blockType === 'questions') {
          currentLevel = lesson?.questions?.[currentQuestionIndex]?.level || 'Medium';
        } else if (blockType === 'slides') {
          currentLevel = lesson?.slides?.[currentSlideIndex]?.level || 'Medium';
        } else if (blockType === 'assignments') {
          currentLevel = lesson?.assignments?.[currentAssignmentIndex]?.level || 'Medium';
        }

        const isRealQuestion = selectedAnswer !== 'read' && selectedAnswer !== undefined && selectedAnswer !== null && selectedAnswer !== '' && (
          (blockType === 'questions' && isQuestionLike(lesson?.questions?.[currentQuestionIndex])) ||
          (blockType === 'slides' && isQuestionLike(lesson?.slides?.[currentSlideIndex])) ||
          (blockType === 'assignments' && isQuestionLike(lesson?.assignments?.[currentAssignmentIndex]))
        );

        if (data.isCorrect && isRealQuestion && isExplicitConfirmation) {
          setSessionXP((prev: any) => prev + (data.earnedXP || 0));
          setHighestStreak((prev: any) => Math.max(prev, data.currentStreak || 0));
        }

        if (isRealQuestion && isExplicitConfirmation) {
          setFeedbackKey(k => k + 1);
          setToastFeedback({
            type: data.isCorrect ? 'success' : 'incorrect',
            xp: data.earnedXP || 0,
            level: currentLevel as any,
            streakCount: data.currentStreak,
            isCorrect: data.isCorrect
          });
        } else {
          setToastFeedback(null);
        }

        if (data.bonusXP > 0 && isRealQuestion && isExplicitConfirmation) {
          setSessionBonusXP((prev: any) => prev + data.bonusXP);
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
        setQuizTimer((prev: any) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStage]);

  useEffect(() => {
    let interval: any;
    if (currentStage === 'assignments') {
      interval = setInterval(() => {
        setAssignmentTimer((prev: any) => prev + 1);
      }, 1000);
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

        // Check user role from token
        let userRole = "";
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userRole = payload.role || "";
        } catch (e) {}

        const isStaff = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(userRole);

        // Check Cut-off Date (only for students with a valid past date)
        if (!isStaff && data.cutOffDate) {
          const now = new Date();
          const cutOff = new Date(data.cutOffDate);
          if (!isNaN(cutOff.getTime()) && now > cutOff) {
            setLesson(data);
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

  const confirmFinishQuiz = () => {
    const nextSubmitted = { ...quizSubmitted };
    lesson.questions.forEach((q: any, idx: number) => {
      if (isQuestionLike(q)) {
        nextSubmitted[idx] = true;
      }
    });
    setQuizSubmitted(nextSubmitted);
    setCurrentStage('summary');
    setUnansweredWarning(null);
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
      setCurrentQuestionIndex((prev: any) => prev + 1);
    } else {
      // Check if there are unanswered questions in the quiz
      const unanswered = [];
      for (let i = 0; i < lesson.questions.length; i++) {
        if (isQuestionLike(lesson.questions[i]) && !answers[i]) {
          unanswered.push(i + 1);
        }
      }

      if (unanswered.length > 0) {
        setUnansweredWarning(unanswered);
        return; // Stop submission, show modal
      }

      confirmFinishQuiz();
    }
  };


  return {
    lesson, course, courseLessons, isLoading, isExpired,
    currentStage, setCurrentStage, currentSlideIndex, setCurrentSlideIndex,
    currentQuestionIndex, setCurrentQuestionIndex, answers, setAnswers,
    score, setScore, quizTimer, setQuizTimer, assignmentTimer, setAssignmentTimer,
    currentAssignmentIndex, setCurrentAssignmentIndex,
    slideAnswers, setSlideAnswers, slideSubmitted, setSlideSubmitted,
    assignmentAnswers, setAssignmentAnswers, assignmentSubmitted, setAssignmentSubmitted,
    quizSubmitted, setQuizSubmitted, correctCount, setCorrectCount,
    attemptedQuestionsCount, setAttemptedQuestionsCount, attemptedMaxScore, setAttemptedMaxScore,
    actualVideoDuration, setActualVideoDuration, xpData, setXpData,
    totalLessonXP, setTotalLessonXP, currentStreak, setCurrentStreak,
    showStreakMilestone, setShowStreakMilestone, highestStreak, setHighestStreak,
    sessionXP, setSessionXP, sessionBonusXP, setSessionBonusXP,
    toastFeedback, setToastFeedback, feedbackKey, setFeedbackKey,
    unansweredWarning, setUnansweredWarning,
    submitAnswerProgress, handleProgressUpdate, handleAnswerSelect, handleNextQuestion,
    t, language, router, searchParams, courseId, lessonId, showToast, confirmFinishQuiz,
    previewStreakRef
  };
}
