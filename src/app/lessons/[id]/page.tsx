"use client";
import { questionMetadata } from "@/lib/bilingualMetadata";
import { useSlideKeyboard } from "@/hooks/useSlideKeyboard";
import { useModalFocus } from "@/hooks/useModalFocus";
import StudentPageHeader from "@/components/student/StudentPageHeader";
import SubjectArtwork from "@/components/student/SubjectArtwork";
import headingStyles from "./LessonCourseHeading.module.css";
import LearningBackdrop from "@/components/student/LearningBackdrop";
import frame from "@/components/student/LearningPage.module.css";
import LessonSyllabus from "@/components/student/LessonSyllabus";
import ConfirmDialog from "@/components/student/ConfirmDialog";
import LessonSaveStatus from "@/components/LessonSaveStatus";
import LessonAccessState from "@/components/LessonAccessState";
import { useLessonPlayer } from './hooks/useLessonPlayer';
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
import InteractiveQuestionRenderer from '@/components/InteractiveQuestionRenderer';
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
export default function LessonPlayerPage() {
  const { t, language } = useLanguage();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');
  const lessonId = params.id as string;
  const { showToast } = useNotification();
  const player = useLessonPlayer();
  const {
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
    confirmFinishQuiz,
    previewStreakRef
  } = player;
  const [confirmation, setConfirmation] = useState<{ message: string; resolve: (value: boolean) => void } | null>(null);
  const requestConfirmation = (message: string) => new Promise<boolean>(resolve => setConfirmation({ message, resolve }));
  const milestoneDialog = useRef<HTMLDivElement>(null), warningDialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const slide = lesson?.slides?.[currentSlideIndex];
    const blocked = currentStage === 'assignments' || currentStage === 'exercises' || (currentStage === 'slides' && (slide?.type === 'QUESTION' || slide?.correctAnswer !== undefined));
    document.documentElement.dataset.aiAssessment = String(blocked);
    window.dispatchEvent(new Event('klevro:ai-context'));
    return () => { delete document.documentElement.dataset.aiAssessment; window.dispatchEvent(new Event('klevro:ai-context')); };
  }, [currentStage, currentSlideIndex, lesson]);
  useModalFocus(!!showStreakMilestone, milestoneDialog, () => setShowStreakMilestone(null));
  useModalFocus(!!unansweredWarning, warningDialog, () => setUnansweredWarning(null));
  const previousSlideButton = useRef<HTMLButtonElement>(null), nextSlideButton = useRef<HTMLButtonElement>(null);
  useSlideKeyboard({ enabled: !isLoading && !isExpired && currentStage === 'slides' && !confirmation && !showStreakMilestone && !unansweredWarning,
    language, index: currentSlideIndex, count: lesson?.slides?.length || 0,
    previous: () => previousSlideButton.current?.click(), next: () => nextSlideButton.current?.click() });
  if (isLoading || isExpired || !lesson) return <LessonAccessState {...{ isLoading, isExpired, lesson, language, t, router }} retry={player.retryLoad} />;
  const currentLessonIdx = courseLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentLessonIdx > 0 ? courseLessons[currentLessonIdx - 1] : null;
  const nextLesson = currentLessonIdx >= 0 && currentLessonIdx < courseLessons.length - 1 ? courseLessons[currentLessonIdx + 1] : null;
  const isLessonAvailable = (item: any) => (!item.publishDate || Date.parse(item.publishDate) <= Date.now()) && (!item.cutOffDate || Date.parse(item.cutOffDate) > Date.now());
  const goToLesson = async (lsn: any) => {
    if (!isLessonAvailable(lsn)) { showToast(language === 'ar' ? 'هذا الدرس غير متاح في الوقت الحالي. راجع موعد الإتاحة في المقرر.' : 'This lesson is not available now. Check its dates in your course.', 'info'); return; }
    if ((player.saveStatus === "error" || player.saveStatus === "saving") && !await requestConfirmation(language === "ar" ? "لم يتأكد حفظ تقدمك بعد. هل تريد الانتقال؟" : "Your progress save is not confirmed yet. Continue to another lesson?")) return;
    router.push(`/lessons/${lsn.id}?courseId=${lesson?.courseId || courseId}`);
  };
  return (
    <DashboardLayout mainClassName={frame.main}>
      <div className={frame.shell} dir={language === 'ar' ? 'rtl' : 'ltr'}><LearningBackdrop/>
      <div className={`${headingStyles.player} space-y-5 md:space-y-6 pb-12`}>

{confirmation && <ConfirmDialog message={confirmation.message} onCancel={() => { confirmation.resolve(false); setConfirmation(null); }} onConfirm={() => { confirmation.resolve(true); setConfirmation(null); }} />}

<LessonSaveStatus status={player.saveStatus} at={player.lastSavedAt} retry={player.retrySave} language={language} />
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
        <div className={headingStyles.heading}>
        <StudentPageHeader title={lesson.title} description={course?.title || t('lesson.educationalCourse')} back={{ href: `/courses/${lesson.courseId || courseId}`, label: language === 'ar' ? 'محتوى المقرر' : 'Course contents' }} action={<div className="flex flex-wrap gap-2"><span className="student-status bg-amber-50 text-amber-800">{language === 'ar' ? 'نقاط التشجيع:' : 'Reward points:'} {totalLessonXP} XP</span><span className="student-status">{language === 'ar' ? 'الدرجة:' : 'Score:'} {score}</span>{currentStreak > 0 && <span className="student-status">{currentStreak} {language === 'ar' ? 'إجابات صحيحة متتالية' : 'correct in a row'}</span>}</div>}/>
          <SubjectArtwork subject={course?.subject} title={course?.title || lesson.title} coverImage={course?.coverImage} className={headingStyles.art}/>
        </div>
        {courseLessons.length > 0 && <LessonSyllabus lessons={courseLessons} lessonId={lessonId} courseTitle={course?.title || ''} language={language} onNavigate={goToLesson} isAvailable={isLessonAvailable} />}
        {/* ── STAGE NAVIGATION TABS ── */}
        {currentStage !== 'summary' && (
          <div role="group" aria-label={language === "ar" ? "مراحل الدرس" : "Lesson stages"} className={`${headingStyles.stages} w-full bg-white/80 backdrop-blur-xl border border-slate-200/80 p-3 rounded-[24px] shadow-sm flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
            <button
              data-slide-nav="open" aria-pressed={currentStage === 'slides' || currentStage === 'welcome'}
              onClick={() => {
                if (!slideSubmitted[currentSlideIndex] && lesson.slides?.[currentSlideIndex]) {
                  const q = lesson.slides[currentSlideIndex];
                  if (!isQuestionLike(q)) {
                    const qId = q.id ? String(q.id) : String(currentSlideIndex);
                    const isPreviewMode = searchParams.get('preview') === 'true';
                    if (!isPreviewMode) {
                      submitAnswerProgress(qId, 'slides', 'read');
                      setSlideSubmitted(prev => ({ ...prev, [currentSlideIndex]: true }));
                    }
                  }
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
              <span><strong>{language === 'ar' ? 'الشرح والدرس' : 'Explanation Content'}</strong><small aria-hidden="true">{lesson.slides?.length || 0} {language === 'ar' ? 'شرائح للشرح' : 'learning slides'}</small></span>
            </button>
            <button
              aria-pressed={currentStage === 'assignments'}
              onClick={() => {
                if (!assignmentSubmitted[currentAssignmentIndex] && lesson.assignments?.[currentAssignmentIndex]) {
                  const q = lesson.assignments[currentAssignmentIndex];
                  if (!isQuestionLike(q)) {
                    const qId = q.id ? String(q.id) : String(currentAssignmentIndex);
                    const isPreviewMode = searchParams.get('preview') === 'true';
                    if (!isPreviewMode) {
                      submitAnswerProgress(qId, 'assignments', 'read');
                      setAssignmentSubmitted(prev => ({ ...prev, [currentAssignmentIndex]: true }));
                    }
                  }
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
              <span><strong>{language === 'ar' ? 'الواجبات' : 'Assignment'}</strong><small aria-hidden="true">{lesson.assignments?.length || 0} {language === 'ar' ? 'تدريبات للتطبيق' : 'practice items'}</small></span>
            </button>
            <button
              aria-pressed={currentStage === 'exercises'}
              onClick={() => {
                if (!quizSubmitted[currentQuestionIndex] && lesson.questions?.[currentQuestionIndex]) {
                  const q = lesson.questions[currentQuestionIndex];
                  if (!isQuestionLike(q)) {
                    const qId = q.id ? String(q.id) : String(currentQuestionIndex);
                    const isPreviewMode = searchParams.get('preview') === 'true';
                    if (!isPreviewMode) {
                      submitAnswerProgress(qId, 'questions', 'read');
                      setQuizSubmitted(prev => ({ ...prev, [currentQuestionIndex]: true }));
                    }
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
              <span><strong>{language === 'ar' ? 'الاختبار' : 'Quiz'}</strong><small aria-hidden="true">{lesson.questions?.length || 0} {language === 'ar' ? 'أسئلة للمراجعة' : 'review questions'}</small></span>
            </button>
          </div>
        )}
        {/* ── MAIN CONTENT AREA ── */}
        <div className="w-full flex flex-col items-center gap-6 md:gap-10">
          <div className={`${headingStyles.content} w-full space-y-10`} data-lesson-stage={currentStage}>            {currentStage === 'welcome' && (
              <div className="premium-card p-6 md:p-12 rounded-[48px] animate-in fade-in zoom-in duration-700 flex flex-col justify-center min-h-[400px]">
                {lesson.videoUrl && (
                  <div className="w-full max-w-4xl mx-auto mb-10 rounded-[35px] overflow-hidden shadow-2xl border border-slate-200 relative aspect-video" style={{ aspectRatio: '16/9' }}>
                    <VideoPlayer
                      url={lesson.videoUrl}
                      onProgress={handleProgressUpdate}
                      onDuration={(d) => setActualVideoDuration(d)}
                    />
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[30px] flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-100">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">{t('lesson.readyToStart')}</h2>
                  <p className="text-slate-500 text-base md:text-lg font-bold max-w-xl mx-auto leading-relaxed">
                    {lesson.videoUrl ? (language === 'ar' ? 'شاهد الفيديو أعلاه ثم ابدأ في استعراض الشرح والتمارين.' : 'Watch the video above, then start browsing the explanation and exercises.') : (language === 'ar' ? 'ابدأ بمحتوى الدرس، ثم طبّق ما تعلمته في التدريبات والتمارين.' : 'Start with the lesson content, then practise what you learned in the activities and exercises.')}
                  </p>
                </div>
                {(lesson.standards || lesson.indicators || lesson.learningOutcomes) && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                    {[
                      { title: t('lesson.standards'), icon: Target, content: questionMetadata(lesson, "standards", language), color: "text-blue-600", bg: "bg-blue-50" },
                      { title: t('lesson.indicators'), icon: TrendingUp, content: questionMetadata(lesson, "indicators", language), color: "text-purple-600", bg: "bg-purple-50" },
                      { title: t('lesson.outcomes'), icon: Award, content: questionMetadata(lesson, "learningOutcomes", language), color: "text-emerald-600", bg: "bg-emerald-50" },
                    ].filter(item => item.content && String(item.content).trim() !== '').map((item, i) => (
                      <WelcomeGadgetCard key={i} item={item} t={t} />
                    ))}
                  </div>
                )}
                <div className="mt-6 text-center space-y-4">
                  <button
                    onClick={() => {
                      setToastFeedback(null);
                      setCurrentStage('slides');
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 px-12 py-5 rounded-[25px] font-black text-lg hover:scale-105 transition-all shadow-xl shadow-indigo-100 flex items-center gap-4 mx-auto border border-indigo-500/20"
                  >
                    {t('lesson.showExplanation')}
                    <ArrowLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}
            {currentStage === 'slides' && (
              <div className={`${headingStyles.slideCard} premium-card flex flex-col group mx-auto w-full`}>
                <div className={headingStyles.slideToolbar}>
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
                      html={language === 'en' ? (lesson.slides[currentSlideIndex].contentEn || lesson.slides[currentSlideIndex].textEn || lesson.slides[currentSlideIndex].content || lesson.slides[currentSlideIndex].text) : (lesson.slides[currentSlideIndex].content || lesson.slides[currentSlideIndex].text)}
                      className="text-base md:text-xl text-slate-600 leading-[1.8] font-bold prose prose-indigo break-words w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 text-start"
                    />
                  </div>
                  <div className="w-full max-w-5xl flex flex-wrap gap-3 text-start mb-6 -mt-4 animate-in fade-in duration-500 delay-200">
                    {lesson.slides[currentSlideIndex].skill && (
                      <InteractiveTag 
                        label={t('lesson.skill') || 'Skill'} 
                        value={questionMetadata(lesson.slides[currentSlideIndex], "skill", language)} 
                        icon={Star} 
                        colorClass="bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100" 
                        bubbleTheme="border-amber-200 text-amber-900" 
                      />
                    )}
                    {lesson.slides[currentSlideIndex].standard && (
                      <InteractiveTag 
                        label={t('lesson.standards')} 
                        value={questionMetadata(lesson.slides[currentSlideIndex], "standard", language)} 
                        icon={Target} 
                        colorClass="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100" 
                        bubbleTheme="border-blue-200 text-blue-900" 
                      />
                    )}
                    {lesson.slides[currentSlideIndex].indicator && (
                      <InteractiveTag 
                        label={t('lesson.indicators')} 
                        value={questionMetadata(lesson.slides[currentSlideIndex], "indicator", language)} 
                        icon={TrendingUp} 
                        colorClass="bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100" 
                        bubbleTheme="border-purple-200 text-purple-900" 
                      />
                    )}
                    {lesson.slides[currentSlideIndex].learningOutcome && (
                      <InteractiveTag 
                        label={t('lesson.outcomes')} 
                        value={questionMetadata(lesson.slides[currentSlideIndex], "learningOutcome", language)} 
                        icon={Award} 
                        colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100" 
                        bubbleTheme="border-emerald-200 text-emerald-900" 
                      />
                    )}
                    {isQuestionLike(lesson.slides[currentSlideIndex]) && lesson.slides[currentSlideIndex].dok && (
                      <InteractiveTag 
                        label={language === 'ar' ? 'عمق المعرفة' : 'DOK'} 
                        value={questionMetadata(lesson.slides[currentSlideIndex], "dok", language)} 
                        icon={ListOrdered} 
                        colorClass="bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100" 
                        bubbleTheme="border-yellow-200 text-yellow-900" 
                      />
                    )}
                    {/* PRE_QUESTION_ONLY bubbles (e.g. WARNING) placed here, above the question content */}
                    <div className="w-full text-start mb-2">
                      <ItemSectionsBubbles 
                        item={lesson.slides[currentSlideIndex]} 
                        isSubmitted={false} 
                        language={language}
                        filterType="PRE_QUESTION_ONLY"
                      />
                    </div>
                  </div>
                  {/* Question Options for Slide */}
                  {isQuestionLike(lesson.slides[currentSlideIndex]) && (
                    <>
                      {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(
                        (lesson.slides[currentSlideIndex].type === 'QUESTION'
                          ? lesson.slides[currentSlideIndex].label
                          : lesson.slides[currentSlideIndex].type) || 'MCQ'
                      ) ? (
                        getQuestionOptions(lesson.slides[currentSlideIndex], language).length > 0 && (() => {
                          const slideOpts = getQuestionOptions(lesson.slides[currentSlideIndex], language);
                          const hasLongSlideOpts = slideOpts.some((opt: string) => {
                            const clean = cleanOptionText(opt).replace(/<[^>]+>/g, '').trim();
                            return clean.length > 25 || clean.includes('\\') || clean.includes('$') || clean.includes('=') || clean.includes('^') || opt.includes('<img');
                          });
                          return (
                            <div className={`mt-8 grid gap-4 w-full max-w-4xl ${hasLongSlideOpts ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                              {slideOpts.map((opt: string, oIdx: number) => {
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
                                  className={`relative p-4 md:p-6 rounded-3xl border-4 text-right transition-all group overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-red-500 bg-red-50' : 'border-indigo-500 bg-indigo-50') : 'border-slate-100 bg-white hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                                  aria-pressed={isSelected} data-lesson-option data-result={isCorrect ? "correct" : isWrong ? "incorrect" : undefined}
                                  disabled={isSubmitted}
                                >
                                  <div className="flex items-center gap-3.5 flex-1 text-start w-full overflow-hidden">
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
                        );
                      })()
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
                    <div className="flex flex-wrap gap-4 items-center justify-center mt-6">
                      <button
                        onClick={() => {
                          const q = lesson.slides[currentSlideIndex];
                          const qId = q.id ? String(q.id) : String(currentSlideIndex);
                          const ans = slideAnswers[currentSlideIndex];
                          submitAnswerProgress(qId, 'slides', ans, q);
                          setSlideSubmitted({ ...slideSubmitted, [currentSlideIndex]: true });
                        }}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 border border-emerald-500/20 shrink-0"
                      >
                        {language === 'ar' ? 'تأكيد الإجابة ✓' : 'Confirm Answer ✓'}
                      </button>
                      {/* HINT bubble next to confirm button */}
                      <ItemSectionsBubbles 
                        item={lesson.slides[currentSlideIndex]} 
                        isSubmitted={false} 
                        language={language}
                        filterType="HINT_ONLY"
                      />
                    </div>
                  )}
                  {/* POST_ANSWER bubbles container */}
                  <div className="flex w-full max-w-4xl flex-wrap gap-3 text-start mt-6 justify-start">
                    <ItemSectionsBubbles 
                      item={lesson.slides[currentSlideIndex]} 
                      isSubmitted={!isQuestionLike(lesson.slides[currentSlideIndex]) || slideSubmitted[currentSlideIndex]} 
                      language={language}
                      filterType="POST_ANSWER_ONLY"
                    />
                  </div>
                  {isQuestionLike(lesson.slides[currentSlideIndex]) && slideAnswers[currentSlideIndex] && (lesson.slides[currentSlideIndex].hint || lesson.slides[currentSlideIndex].hintEn) && (
                    <div className="w-full mt-6 p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-indigo-900 animate-in slide-in-from-top-4 fade-in duration-500 text-start shadow-sm hidden">
                      <div className="flex items-center gap-2 mb-2 font-black text-indigo-700">
                        <HelpCircle className="w-5 h-5 shrink-0" />
                        {language === 'ar' ? 'تلميح' : 'Hint'}
                      </div>
                      <div className="text-sm md:text-base leading-relaxed break-words">
                        <HtmlRenderer html={language === 'en' ? (lesson.slides[currentSlideIndex].hintEn || lesson.slides[currentSlideIndex].hint) : lesson.slides[currentSlideIndex].hint} />
                      </div>
                    </div>
                  )}
                  {isQuestionLike(lesson.slides[currentSlideIndex]) && slideSubmitted[currentSlideIndex] && (lesson.slides[currentSlideIndex].explanation || lesson.slides[currentSlideIndex].explanationEn) && (
                    <div className="w-full mt-4 p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl text-blue-900 animate-in slide-in-from-top-4 fade-in duration-700 delay-200 text-start shadow-sm">
                      <div className="flex items-center gap-2 mb-2 font-black text-blue-700">
                        <Info className="w-5 h-5 shrink-0" />
                        {language === 'ar' ? 'التفسير' : 'Explanation'}
                      </div>
                      <div className="text-sm md:text-base leading-relaxed break-words">
                        <HtmlRenderer html={language === 'en' ? (lesson.slides[currentSlideIndex].explanationEn || lesson.slides[currentSlideIndex].explanation) : lesson.slides[currentSlideIndex].explanation} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center gap-6 shrink-0" dir={language === "ar" ? "rtl" : "ltr"}>
                  <button ref={previousSlideButton} data-slide-nav="previous" aria-label={language === "ar" ? "الشريحة السابقة" : "Previous slide"}
                    onClick={() => {
                      setToastFeedback(null);
                      if (currentSlideIndex > 0) {
                        setCurrentSlideIndex(prev => prev - 1);
                      } else {
                        setCurrentStage('welcome');
                      }
                    }}
                    className="w-12 h-12 rounded-2xl bg-slate-50/80 border-2 border-slate-200/60 flex items-center justify-center hover:bg-slate-100 transition-all shadow-sm"
                  >
                    {language === "ar" ? <ChevronRight className="w-6 h-6 text-slate-900" /> : <ChevronLeft className="w-6 h-6 text-slate-900" />}
                  </button>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {lesson.slides.map((_: any, i: number) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${currentSlideIndex === i ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}></div>
                    ))}
                  </div>
                  {currentSlideIndex < lesson.slides.length - 1 ? (
                    <button ref={nextSlideButton} data-slide-nav="next" aria-label={language === "ar" ? "الشريحة التالية" : "Next slide"}
                      onClick={() => {
                        setToastFeedback(null);
                        const isPreviewMode = searchParams.get('preview') === 'true';
                        if (!slideSubmitted[currentSlideIndex]) {
                          const q = lesson.slides[currentSlideIndex];
                          const qId = q.id ? String(q.id) : String(currentSlideIndex);
                          const ans = slideAnswers[currentSlideIndex];
                          const hasAnswer = ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
                          if (hasAnswer && isQuestionLike(q)) {
                            submitAnswerProgress(qId, 'slides', ans, q, false);
                            setSlideSubmitted(prev => ({ ...prev, [currentSlideIndex]: true }));
                          }
                        }
                        setCurrentSlideIndex(prev => prev + 1);
                      }}
                      className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all border border-indigo-500/20"
                    >
                      {language === "ar" ? <ChevronLeft className="w-6 h-6 text-white" /> : <ChevronRight className="w-6 h-6 text-white" />}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setToastFeedback(null);
                        const isPreviewMode = searchParams.get('preview') === 'true';
                        if (!slideSubmitted[currentSlideIndex]) {
                          const q = lesson.slides[currentSlideIndex];
                          const qId = q.id ? String(q.id) : String(currentSlideIndex);
                          const ans = slideAnswers[currentSlideIndex];
                          const hasAnswer = ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
                          if (hasAnswer && isQuestionLike(q)) {
                            submitAnswerProgress(qId, 'slides', ans, q, false);
                            setSlideSubmitted(prev => ({ ...prev, [currentSlideIndex]: true }));
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
                <div className={`${headingStyles.questionNav} premium-card w-full mx-auto`}>
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
                <div className={`${headingStyles.questionCard} premium-card w-full mx-auto flex flex-col`}>
                  {lesson.assignments?.length > 0 && lesson.assignments[currentAssignmentIndex] ? (
                    <>
                      <div className={headingStyles.questionBody}>
                        {/* Metadata Row */}
                        <div className={headingStyles.metadata}>
                          <div className="flex flex-wrap items-center gap-3 max-w-full w-full">
                            <span className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-black uppercase tracking-wider shadow-sm max-w-full break-words whitespace-normal text-right">
                              {language === 'ar' ? 'الواجب' : 'Assignment'} {currentAssignmentIndex + 1}
                            </span>
                            {lesson.assignments[currentAssignmentIndex].level && (
                              <InteractiveTag 
                                label={t('lesson.level') || 'Level'}
                                value={lesson.assignments[currentAssignmentIndex].level === 'Easy' || lesson.assignments[currentAssignmentIndex].level === 'Foundation' ? t('lesson.easy') : lesson.assignments[currentAssignmentIndex].level === 'Medium' || lesson.assignments[currentAssignmentIndex].level === 'On Level' ? t('lesson.medium') : t('lesson.hard')}
                                colorClass="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                              />
                            )}
                            {lesson.assignments[currentAssignmentIndex].dok && (
                              <InteractiveTag 
                                label={language === 'ar' ? 'عمق المعرفة' : 'DOK'}
                                value={questionMetadata(lesson.assignments[currentAssignmentIndex], "dok", language)}
                                icon={ListOrdered}
                                colorClass="bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100"
                                bubbleTheme="border-yellow-200 text-yellow-900"
                              />
                            )}
                            {lesson.assignments[currentAssignmentIndex].skill && (
                              <InteractiveTag 
                                label={t('lesson.skill') || 'Skill'}
                                value={questionMetadata(lesson.assignments[currentAssignmentIndex], "skill", language)}
                                icon={Star}
                                colorClass="bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100"
                                bubbleTheme="border-amber-200 text-amber-900"
                              />
                            )}
                            {lesson.assignments[currentAssignmentIndex].standard && (
                              <InteractiveTag 
                                label={t('lesson.standard') || 'Standard'}
                                value={questionMetadata(lesson.assignments[currentAssignmentIndex], "standard", language)}
                                icon={Target}
                                colorClass="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
                                bubbleTheme="border-blue-200 text-blue-900"
                              />
                            )}
                            {lesson.assignments[currentAssignmentIndex].indicator && (
                              <InteractiveTag 
                                label={t('lesson.indicator') || 'Indicator'}
                                value={questionMetadata(lesson.assignments[currentAssignmentIndex], "indicator", language)}
                                icon={TrendingUp}
                                colorClass="bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100"
                                bubbleTheme="border-purple-200 text-purple-900"
                              />
                            )}
                            {lesson.assignments[currentAssignmentIndex].learningOutcome && (
                              <InteractiveTag 
                                label={t('lesson.outcome') || 'Outcome'}
                                value={questionMetadata(lesson.assignments[currentAssignmentIndex], "learningOutcome", language)}
                                icon={Award}
                                colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                                bubbleTheme="border-emerald-200 text-emerald-900"
                              />
                            )}
                          </div>
                        </div>
                        {/* Question Text */}
                        <div className="question-frame mb-8 w-full">
                          <HtmlRenderer html={lesson.assignments[currentAssignmentIndex].text} tag="div" className="text-lg md:text-2xl font-black text-slate-900 leading-relaxed tracking-tight break-words w-full text-start" />
                        </div>
                        {/* Question Input */}
                        {isQuestionLike(lesson.assignments[currentAssignmentIndex]) && (
                          <>
                            {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(
                              (lesson.assignments[currentAssignmentIndex].type === 'QUESTION'
                                ? lesson.assignments[currentAssignmentIndex].label
                                : lesson.assignments[currentAssignmentIndex].type) || 'MCQ'
                            ) ? (
                              (() => {
                                const assignOpts = getQuestionOptions(lesson.assignments[currentAssignmentIndex], language);
                                const hasLongAssignOpts = assignOpts.some((opt: string) => {
                                  const clean = cleanOptionText(opt).replace(/<[^>]+>/g, '').trim();
                                  return clean.length > 25 || clean.includes('\\') || clean.includes('$') || clean.includes('=') || clean.includes('^') || opt.includes('<img');
                                });
                                return (
                                  <div className={`grid gap-4 mb-6 w-full ${hasLongAssignOpts ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                                    {assignOpts.map((opt: string, oIdx: number) => {
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
                                      aria-pressed={isSelected} data-lesson-option data-result={isCorrect ? "correct" : isWrong ? "incorrect" : undefined}
                                      className={`p-5 md:p-6 rounded-[25px] border-4 text-start transition-all duration-300 font-black text-sm md:text-base relative break-words overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : isWrong ? 'border-red-500 bg-red-50 text-red-700' : 'bg-indigo-600 border-white text-white shadow-xl shadow-indigo-100') : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                                    >
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3.5 flex-1 text-start min-w-0">
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
                                          <span className={`flex-1 break-words whitespace-normal min-w-0 !leading-relaxed ${isSelected && !isSubmitted ? 'text-white' : ''}`}>
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
                            );
                          })()
                            ) : (
                              <div className="w-full text-start bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-6">
                                <InteractiveQuestionRenderer
                                  question={{
                                    ...lesson.assignments[currentAssignmentIndex],
                                    type: lesson.assignments[currentAssignmentIndex].type === 'QUESTION'
                                      ? (lesson.assignments[currentAssignmentIndex].label || lesson.assignments[currentAssignmentIndex].type)
                                      : (lesson.assignments[currentAssignmentIndex].type || lesson.assignments[currentAssignmentIndex].label || 'MCQ')
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
                          <div className="flex flex-wrap gap-4 items-center justify-center mt-2 mb-6">
                            <button
                              onClick={() => {
                                const q = lesson.assignments[currentAssignmentIndex];
                                const qId = q.id ? String(q.id) : String(currentAssignmentIndex);
                                const ans = assignmentAnswers[currentAssignmentIndex];
                                submitAnswerProgress(qId, 'assignments', ans, q);
                                setAssignmentSubmitted({ ...assignmentSubmitted, [currentAssignmentIndex]: true });
                              }}
                              className="bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 border border-emerald-500/20 shrink-0"
                            >
                              {language === 'ar' ? 'تأكيد الإجابة' : 'Confirm Answer'}
                            </button>
                            <ItemSectionsBubbles 
                              item={lesson.assignments[currentAssignmentIndex]} 
                              isSubmitted={false} 
                              language={language}
                              filterType="HINT_ONLY"
                            />
                          </div>
                        )}
                        <div className="flex w-full flex-wrap gap-3 text-start mt-4">
                          <ItemSectionsBubbles 
                            item={lesson.assignments[currentAssignmentIndex]} 
                            isSubmitted={!isQuestionLike(lesson.assignments[currentAssignmentIndex]) || assignmentSubmitted[currentAssignmentIndex]} 
                            language={language}
                            filterType="POST_ANSWER_ONLY"
                          />
                        </div>
                        {assignmentAnswers[currentAssignmentIndex] && (lesson.assignments[currentAssignmentIndex].hint || lesson.assignments[currentAssignmentIndex].hintEn) && (
                          <div className="w-full mb-6 mt-4 p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-indigo-900 animate-in slide-in-from-top-4 fade-in duration-500 text-start shadow-sm">
                            <div className="flex items-center gap-2 mb-2 font-black text-indigo-700">
                              <HelpCircle className="w-5 h-5 shrink-0" />
                              {language === 'ar' ? 'تلميح' : 'Hint'}
                            </div>
                            <div className="text-sm md:text-base leading-relaxed break-words">
                              <HtmlRenderer html={language === 'en' ? (lesson.assignments[currentAssignmentIndex].hintEn || lesson.assignments[currentAssignmentIndex].hint) : lesson.assignments[currentAssignmentIndex].hint} />
                            </div>
                          </div>
                        )}
                        {assignmentSubmitted[currentAssignmentIndex] && (lesson.assignments[currentAssignmentIndex].explanation || lesson.assignments[currentAssignmentIndex].explanationEn) && (
                          <div className="w-full mb-6 mt-2 p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl text-blue-900 animate-in slide-in-from-top-4 fade-in duration-700 delay-200 text-start shadow-sm">
                            <div className="flex items-center gap-2 mb-2 font-black text-blue-700">
                              <Info className="w-5 h-5 shrink-0" />
                              {language === 'ar' ? 'التفسير' : 'Explanation'}
                            </div>
                            <div className="text-sm md:text-base leading-relaxed break-words">
                              <HtmlRenderer html={language === 'en' ? (lesson.assignments[currentAssignmentIndex].explanationEn || lesson.assignments[currentAssignmentIndex].explanation) : lesson.assignments[currentAssignmentIndex].explanation} />
                            </div>
                          </div>
                        )}
                        {assignmentSubmitted[currentAssignmentIndex] && isQuestionLike(lesson.assignments[currentAssignmentIndex]) && (() => {
                          const isMulti = lesson.assignments[currentAssignmentIndex].type === 'MULTI_SELECT' || lesson.assignments[currentAssignmentIndex].label === 'MULTI_SELECT';
                          const effectiveAType = lesson.assignments[currentAssignmentIndex].type === 'QUESTION'
                            ? lesson.assignments[currentAssignmentIndex].label
                            : lesson.assignments[currentAssignmentIndex].type;
                          const isStandard = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(effectiveAType || 'MCQ');
                          const studentAnswers = assignmentAnswers[currentAssignmentIndex] || (isMulti ? [] : '');
                          const isCorrect = isStandard
                            ? (isMulti ? studentAnswers.length === (lesson.assignments[currentAssignmentIndex].correctAnswers || []).length && studentAnswers.every((a: string) => (lesson.assignments[currentAssignmentIndex].correctAnswers || []).includes(a)) : (!lesson.assignments[currentAssignmentIndex].correctAnswer || normalizeAnswerGlobal(assignmentAnswers[currentAssignmentIndex]) === normalizeAnswerGlobal(lesson.assignments[currentAssignmentIndex].correctAnswer)))
                            : checkAdvancedCorrect(lesson.assignments[currentAssignmentIndex], assignmentAnswers[currentAssignmentIndex]);
                          const isSkipped = !studentAnswers || (Array.isArray(studentAnswers) && studentAnswers.length === 0) || studentAnswers === '' || studentAnswers === '[]';
                          const isExplanation = lesson.assignments[currentAssignmentIndex].type === 'EXPLANATION' || lesson.assignments[currentAssignmentIndex].label === 'EXPLANATION';
                          if (isExplanation) return null;
                          return null;
                        })()}
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
                          onClick={async () => {
                            const isPreviewMode = searchParams.get('preview') === 'true';
                            if (!assignmentSubmitted[currentAssignmentIndex]) {
                              const q = lesson.assignments[currentAssignmentIndex];
                              const qId = q.id ? String(q.id) : String(currentAssignmentIndex);
                              const ans = assignmentAnswers[currentAssignmentIndex];
                              const hasAnswer = ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
                              if (hasAnswer || (!isPreviewMode && !isQuestionLike(q))) {
                                const finalAns = isQuestionLike(q) ? (hasAnswer ? ans : '') : 'read';
                                submitAnswerProgress(qId, 'assignments', finalAns);
                                setAssignmentSubmitted(prev => ({ ...prev, [currentAssignmentIndex]: true }));
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
                                if (!await requestConfirmation(confirmMsg)) {
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
                <div className={`${headingStyles.questionNav} premium-card w-full mx-auto`}>
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
                    onClick={async () => {
                      if (await requestConfirmation(t('lesson.quizModePrompt') || 'Enable Quiz Mode?')) {
                        showToast(t('lesson.quizModeEnabled') || 'Quiz Mode Enabled', "info");
                      }
                    }}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg"
                  >
                    <HelpCircle className="w-4 h-4" />
                    {language === "ar" ? "اختبر فهمي" : "Quiz me"}
                  </button>
                </div>
                <div className={`${headingStyles.questionCard} premium-card w-full mx-auto flex flex-col`}>
                  {lesson.questions.length > 0 && lesson.questions[currentQuestionIndex] ? (
                    <>
                      <div className={headingStyles.questionBody}>
                        <div className={headingStyles.metadata}>
                          <div className="flex flex-wrap items-center gap-3 max-w-full w-full">
                            <span className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-black uppercase tracking-wider shadow-sm max-w-full break-words whitespace-normal text-right">
                              {t('lesson.question')} {currentQuestionIndex + 1}
                            </span>
                            {lesson.questions[currentQuestionIndex].level && (
                              <InteractiveTag 
                                label={t('lesson.level') || 'Level'}
                                value={lesson.questions[currentQuestionIndex].level === 'Easy' || lesson.questions[currentQuestionIndex].level === 'Foundation' ? t('lesson.easy') : lesson.questions[currentQuestionIndex].level === 'Medium' || lesson.questions[currentQuestionIndex].level === 'On Level' ? t('lesson.medium') : t('lesson.hard')}
                                colorClass="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                              />
                            )}
                            {lesson.questions[currentQuestionIndex].dok && (
                              <InteractiveTag 
                                label={language === 'ar' ? 'عمق المعرفة' : 'DOK'}
                                value={questionMetadata(lesson.questions[currentQuestionIndex], "dok", language)}
                                icon={ListOrdered}
                                colorClass="bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100"
                                bubbleTheme="border-yellow-200 text-yellow-900"
                              />
                            )}
                            {lesson.questions[currentQuestionIndex].skill && (
                              <InteractiveTag 
                                label={t('lesson.skill') || 'Skill'}
                                value={questionMetadata(lesson.questions[currentQuestionIndex], "skill", language)}
                                icon={Star}
                                colorClass="bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100"
                                bubbleTheme="border-amber-200 text-amber-900"
                              />
                            )}
                            {lesson.questions[currentQuestionIndex].standard && (
                              <InteractiveTag 
                                label={t('lesson.standard') || 'Standard'}
                                value={questionMetadata(lesson.questions[currentQuestionIndex], "standard", language)}
                                icon={Target}
                                colorClass="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
                                bubbleTheme="border-blue-200 text-blue-900"
                              />
                            )}
                            {lesson.questions[currentQuestionIndex].indicator && (
                              <InteractiveTag 
                                label={t('lesson.indicator') || 'Indicator'}
                                value={questionMetadata(lesson.questions[currentQuestionIndex], "indicator", language)}
                                icon={TrendingUp}
                                colorClass="bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100"
                                bubbleTheme="border-purple-200 text-purple-900"
                              />
                            )}
                            {lesson.questions[currentQuestionIndex].learningOutcome && (
                              <InteractiveTag 
                                label={t('lesson.outcome') || 'Outcome'}
                                value={questionMetadata(lesson.questions[currentQuestionIndex], "learningOutcome", language)}
                                icon={Award}
                                colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                                bubbleTheme="border-emerald-200 text-emerald-900"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-mono font-bold text-sm shadow-sm shrink-0">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            {Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        <div className="question-frame mb-8 w-full">
                          <HtmlRenderer html={lesson.questions[currentQuestionIndex].text} tag="div" className="text-lg md:text-2xl font-black text-slate-900 leading-relaxed tracking-tight break-words w-full text-start" />
                        </div>
                        {/* Resolve effective type: if type='QUESTION', use label; otherwise use type */}
                        {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(
                          (lesson.questions[currentQuestionIndex].type === 'QUESTION'
                            ? lesson.questions[currentQuestionIndex].label
                            : lesson.questions[currentQuestionIndex].type) || 'MCQ'
                        ) ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                                  aria-pressed={isSelected} data-lesson-option data-result={isCorrect ? "correct" : isWrong ? "incorrect" : undefined}
                                      className={`p-5 md:p-6 rounded-[25px] border-4 text-start transition-all duration-300 font-black text-sm md:text-base relative break-words overflow-hidden ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : isWrong ? 'border-red-500 bg-red-50 text-red-700' : 'bg-indigo-600 border-white text-white shadow-xl shadow-indigo-100') : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-200'} ${isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5 flex-1 text-start min-w-0">
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
                                      <span className={`flex-1 break-words whitespace-normal min-w-0 !leading-relaxed ${isSelected && !isSubmitted ? 'text-white' : ''}`}>
                                        <HtmlRenderer html={cleanOptionText(opt)} tag="span" />
                                      </span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected && !isSubmitted ? 'border-white bg-white/20' : isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : isWrong ? 'border-red-500 bg-red-500 text-white' : 'border-slate-200'}`}>
                                      {isSelected && !isSubmitted && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
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
                                type: lesson.questions[currentQuestionIndex].type === 'QUESTION'
                                  ? (lesson.questions[currentQuestionIndex].label || lesson.questions[currentQuestionIndex].type)
                                  : (lesson.questions[currentQuestionIndex].type || lesson.questions[currentQuestionIndex].label || 'MCQ')
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
                          <div className="flex flex-wrap gap-4 items-center justify-center mt-2 mb-6">
                            <button
                              onClick={() => {
                                const q = lesson.questions[currentQuestionIndex];
                                const qId = q.id ? String(q.id) : String(currentQuestionIndex);
                                const ans = answers[currentQuestionIndex];
                                submitAnswerProgress(qId, 'questions', ans, q);
                                setQuizSubmitted({ ...quizSubmitted, [currentQuestionIndex]: true });
                              }}
                              className="bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 border border-emerald-500/20 shrink-0"
                            >
                              {language === 'ar' ? 'تأكيد الإجابة' : 'Confirm Answer'}
                            </button>
                            <ItemSectionsBubbles 
                              item={lesson.questions[currentQuestionIndex]} 
                              isSubmitted={false} 
                              language={language}
                              filterType="HINT_ONLY"
                            />
                          </div>
                        )}
                        <div className="flex w-full flex-wrap gap-3 text-start mt-4">
                          <ItemSectionsBubbles 
                            item={lesson.questions[currentQuestionIndex]} 
                            isSubmitted={quizSubmitted[currentQuestionIndex]} 
                            language={language}
                            filterType="POST_ANSWER_ONLY"
                          />
                        </div>
                        {answers[currentQuestionIndex] && (lesson.questions[currentQuestionIndex].hint || lesson.questions[currentQuestionIndex].hintEn) && (
                          <div className="w-full mb-6 mt-4 p-5 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-indigo-900 animate-in slide-in-from-top-4 fade-in duration-500 text-start shadow-sm">
                            <div className="flex items-center gap-2 mb-2 font-black text-indigo-700">
                              <HelpCircle className="w-5 h-5 shrink-0" />
                              {language === 'ar' ? 'تلميح' : 'Hint'}
                            </div>
                            <div className="text-sm md:text-base leading-relaxed break-words">
                              <HtmlRenderer html={language === 'en' ? (lesson.questions[currentQuestionIndex].hintEn || lesson.questions[currentQuestionIndex].hint) : lesson.questions[currentQuestionIndex].hint} />
                            </div>
                          </div>
                        )}
                        {quizSubmitted[currentQuestionIndex] && (lesson.questions[currentQuestionIndex].explanation || lesson.questions[currentQuestionIndex].explanationEn) && (
                          <div className="w-full mb-6 mt-2 p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl text-blue-900 animate-in slide-in-from-top-4 fade-in duration-700 delay-200 text-start shadow-sm">
                            <div className="flex items-center gap-2 mb-2 font-black text-blue-700">
                              <Info className="w-5 h-5 shrink-0" />
                              {language === 'ar' ? 'التفسير' : 'Explanation'}
                            </div>
                            <div className="text-sm md:text-base leading-relaxed break-words">
                              <HtmlRenderer html={language === 'en' ? (lesson.questions[currentQuestionIndex].explanationEn || lesson.questions[currentQuestionIndex].explanation) : lesson.questions[currentQuestionIndex].explanation} />
                            </div>
                          </div>
                        )}
                        {quizSubmitted[currentQuestionIndex] && (() => {
                          const isMulti = lesson.questions[currentQuestionIndex].type === 'MULTI_SELECT' || lesson.questions[currentQuestionIndex].label === 'MULTI_SELECT';
                          const effectiveQType = lesson.questions[currentQuestionIndex].type === 'QUESTION'
                            ? lesson.questions[currentQuestionIndex].label
                            : lesson.questions[currentQuestionIndex].type;
                          const isStandard = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(effectiveQType || 'MCQ');
                          const studentAnswers = answers[currentQuestionIndex] || (isMulti ? [] : '');
                          const isCorrect = isStandard
                            ? (isMulti ? studentAnswers.length === (lesson.questions[currentQuestionIndex].correctAnswers || []).length && studentAnswers.every((a: string) => (lesson.questions[currentQuestionIndex].correctAnswers || []).includes(a)) : (!lesson.questions[currentQuestionIndex].correctAnswer || normalizeAnswerGlobal(answers[currentQuestionIndex]) === normalizeAnswerGlobal(lesson.questions[currentQuestionIndex].correctAnswer)))
                            : checkAdvancedCorrect(lesson.questions[currentQuestionIndex], answers[currentQuestionIndex]);
                          const isSkipped = !studentAnswers || (Array.isArray(studentAnswers) && studentAnswers.length === 0) || studentAnswers === '' || studentAnswers === '[]';
                          const isExplanation = lesson.questions[currentQuestionIndex].type === 'EXPLANATION' || lesson.questions[currentQuestionIndex].label === 'EXPLANATION';
                          if (isExplanation) return null;
                          return null;
                        })()}
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
                  setQuizTimer(0);
                  setAssignmentTimer(0);
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
        </div>
      </div></div>      {/* ── Animated Feedback Overlay ── */}
      {toastFeedback && (
        <AnimatedFeedback 
          key={feedbackKey}
          isCorrect={toastFeedback.isCorrect === true} 
          xp={toastFeedback.xp} 
          streak={toastFeedback.streakCount} 
          onComplete={() => setToastFeedback(null)} 
        />
      )}
      {/* ── Streak Milestone Celebration Modal ── */}
      {showStreakMilestone && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="fixed inset-0 pointer-events-none z-[100]">
            <Confetti recycle={false} numberOfPieces={showStreakMilestone.count >= 10 ? 600 : 300} gravity={0.15} />
          </div>
          <div ref={milestoneDialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={language === "ar" ? "إنجاز جديد" : "New achievement"} className={`relative p-8 md:p-12 rounded-[32px] max-w-md w-full mx-4 text-center shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center z-[101] border ${
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
                ? (language === 'ar' ? 'إتقان رائع!' : 'Perfect set!')
                : showStreakMilestone.count >= 5
                  ? (language === 'ar' ? 'تقدم ممتاز!' : 'On fire!')
                  : (language === 'ar' ? 'إجابات صحيحة متتالية!' : 'Streak!')
              }
            </h3>
            <p className="text-slate-500 font-bold text-base mb-6 leading-relaxed">
              {language === 'ar' ? `أجبت عن ${showStreakMilestone.count} أسئلة صحيحة متتالية! حصلت على مكافأة:` : `You answered ${showStreakMilestone.count} questions correctly in a row! Your bonus:`}
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
                ? (language === 'ar' ? 'رائع، نكمل!' : 'Amazing!')
                : (language === 'ar' ? 'استمر في التقدم' : 'Keep going!')
              }
            </button>
          </div>
        </div>
      )}
      {/* ── Unanswered Questions Warning Modal ── */}
      {unansweredWarning && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div ref={warningDialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={language === "ar" ? "أسئلة غير مجابة" : "Unanswered questions"} className="relative p-8 rounded-[32px] max-w-md w-full mx-4 text-center shadow-2xl bg-white border border-slate-200 flex flex-col items-center z-[101]">
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {language === 'ar' ? 'أسئلة غير مجابة!' : 'Unanswered Questions!'}
            </h3>
            <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed">
              {language === 'ar' 
                ? `لقد تركت الأسئلة التالية بدون إجابة: (${unansweredWarning.join(', ')}). هل أنت تأكد من إنهاء الاختبار؟`
                : `You left the following question(s) unanswered: (${unansweredWarning.join(', ')}). Are you sure you want to finish the quiz?`
              }
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setUnansweredWarning(null)}
                className="flex-1 font-black py-3.5 rounded-2xl text-sm border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                {language === 'ar' ? 'العودة للاختبار' : 'Back to Quiz'}
              </button>
              <button
                onClick={() => confirmFinishQuiz()}
                className="flex-1 font-black py-3.5 rounded-2xl text-sm bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-lg shadow-amber-500/20"
              >
                {language === 'ar' ? 'إنهاء على أي حال' : 'Finish Anyway'}
              </button>
            </div>
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
