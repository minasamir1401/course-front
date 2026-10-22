"use client";
import { studentContentText, studentGradeLabel } from '@/lib/studentLocale';
import { questionMetadata, metadataLabel } from "@/lib/bilingualMetadata";

import React, { useEffect, useState, useRef } from "react";
import { useModalFocus } from "@/hooks/useModalFocus";
import DashboardLayout from "@/components/DashboardLayout";
import LearningBackdrop from '@/components/student/LearningBackdrop';
import frame from '@/components/student/LearningPage.module.css';
import ActivitiesOverview, {hasActivityAttempt} from './ActivitiesOverview';
import styles from './ActivitiesPage.module.css';
import { Trophy, Sparkles, CheckCircle2, HelpCircle, Info, BookOpen, Clock, Target, X, RefreshCw, BrainCircuit, ArrowUpRight, ArrowLeft, ArrowRight, Layers, GraduationCap, Zap } from 'lucide-react';
import { API_URL, apiFetch } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import InteractiveQuestionRenderer from "@/components/InteractiveQuestionRenderer";
import AnimatedFeedback from "@/components/AnimatedFeedback";
import { createPortal } from "react-dom";
import HtmlRenderer from "@/components/HtmlRenderer";

export default function ActivitiesPage() {
  const { language } = useLanguage();
  
  const getGradeLabel = (grade:string) => studentGradeLabel(grade,language);
  const [sessionReady, setSessionReady] = useState(false);
  const progressRequest = useRef(0);
  const [userGrade, setUserGrade] = useState<string>("");
  
  // Data States
  const [subject, setSubject] = useState<string>(""); // Default subject
  const [loadError, setLoadError] = useState("");
  const [progressData, setProgressData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  

  // Game Play States
  const [activeActivity, setActiveActivity] = useState<any>(null);
  const [openingId,setOpeningId] = useState<string|null>(null);
  const activityOpener = useRef<HTMLElement|null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);
  const [submitError,setSubmitError] = useState("");
  const activityDialog = useRef<HTMLDivElement>(null);
  useModalFocus(!!activeActivity, activityDialog, () => {
    if (helperModal.type) setHelperModal({type:null,content:""}); else closePlayer();
  });

  useEffect(()=>{if (!activeActivity && activityOpener.current) { if (activityOpener.current.isConnected) activityOpener.current.focus(); activityOpener.current=null; }},[activeActivity]);

  const [startTime, setStartTime] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [completedLocal, setCompletedLocal] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showFeedbackAnim, setShowFeedbackAnim] = useState(false);
  const [showStreakMilestone, setShowStreakMilestone] = useState<{ show: boolean; count: number } | null>(null);
  const [toastFeedback, setToastFeedback] = useState<{ isCorrect: boolean; xp: number; streakCount?: number } | null>(null);
  

  useEffect(() => {
    if (attemptResult && attemptResult.isCorrect && attemptResult.currentStreak > 0 && attemptResult.currentStreak % 5 === 0) {
      setShowStreakMilestone({ show: true, count: attemptResult.currentStreak });
      setTimeout(() => setShowStreakMilestone(null), 4000);
    }
  }, [attemptResult]);

  useEffect(() => {
    if (!activeActivity || timeLeft === null || attemptResult !== null) return;
    if (timeLeft <= 0) {
      setAttemptResult({
        isCorrect: false,
        stars: 0,
        score: 0,
        timeExpired: true,
        explanation: language === 'ar' ? "انتهى الوقت المحدد للإجابة على هذا السؤال! ⏰" : "Time allocated for this question has expired! ⏰"
      });
      setShowFeedbackAnim(true);
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeActivity, timeLeft, attemptResult, language]);
  
  // Helper Modal States
  const [helperModal, setHelperModal] = useState<{ type: "hint" | "tip" | "keyInsight" | "explanation" | "meta" | null; content: string; title?:string }>({
    type: null,
    content: ""
  });

  const isStudentGrade123 = [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي"
  ].includes(userGrade || progressData?.grade || "");

  useEffect(() => {
    const storedUser = localStorage.getItem("lms_user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u && u.grade) {
          setUserGrade(u.grade);
        }
      } catch (e) {
        console.error("Error parsing user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (subject === "العلوم" && isStudentGrade123) {
      setSubject("الرياضيات");
      return;
    }
    // The API authenticates the httpOnly session cookie; no local token is required.
    setSessionReady(true);
    void fetchProgress(subject);
    return () => { progressRequest.current++; };
  }, [subject, isStudentGrade123]);

  const fetchProgress = async (currentSubject: string, silent = false) => {
    const requestId = ++progressRequest.current;
    if (!silent) setIsLoading(true);
    setLoadError("");
    try {
      const res = await apiFetch(`${API_URL}/skills-hub/progress?subject=${encodeURIComponent(currentSubject)}`);
      if (!res.ok) throw new Error("Failed to load activities");
      if (res.ok) {
        const data = await res.json();
        if (requestId !== progressRequest.current) return;
        setProgressData(data);
        
        // Auto-expand the first cluster if not already set
        if (data.clusters && data.clusters.length > 0) {
          setExpandedClusters(prev => {
            const hasActiveKeys = Object.keys(prev).length > 0;
            if (hasActiveKeys) return prev;
            return { [data.clusters[0].id]: true };
          });
        }
      }
    } catch (error) {
      if (requestId !== progressRequest.current) return;
      setLoadError('progress');
      console.error("Error fetching progress data:", error);
    } finally {
      if (requestId === progressRequest.current && !silent) setIsLoading(false);
    }
  };

  const toggleCluster = (id: string) => {
    setExpandedClusters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Start Playing Activity
  const startPlayActivity = async (activityId: string) => {
    if (!sessionReady || openingId) return;
    if (!activeActivity) activityOpener.current = document.activeElement as HTMLElement | null;
    setOpeningId(activityId);
    try {
      setSubmitError(""); setLoadError("");
      const res = await apiFetch(`${API_URL}/skills-hub/activities/${activityId}`);
      if (!res.ok) throw new Error("Activity unavailable");
      if (res.ok) {
        const activity = await res.json();
        setHelperModal({type:null,content:""});
        setActiveActivity(activity);
        setCurrentAnswer("");
        setStartTime(Date.now());
        setHintsUsed(0);
        setAttemptCount(1);
        setAttemptResult(null);
        setShowFeedbackAnim(false);
        setTimeLeft(activity.estimatedTime && Number(activity.estimatedTime) > 0 ? Number(activity.estimatedTime) : null);
      }
    } catch (err) {
      console.error("Error loading activity:", err);
      setLoadError('activity');
    } finally {
      setOpeningId(null);
    }
  };

  // Submit Answer
  const submitAnswer = async (overrideAnswer?: string) => {
    if (!sessionReady || !activeActivity || isSubmitting) return;
    setIsSubmitting(true); setSubmitError("");
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const answer = overrideAnswer !== undefined ? overrideAnswer : currentAnswer;
    
    try {
      const res = await apiFetch(`${API_URL}/skills-hub/activities/${activeActivity.id}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          selectedAnswer: answer,
          timeTaken,
          hintsUsed,
          attemptCount
        })
      });
      
      if (res.ok) {
        const result = await res.json();
        setAttemptResult(result);
        setShowFeedbackAnim(true);
        
        // Trigger AnimatedFeedback if there is XP earned or if it's correct
        if (result.isCorrect || result.earnedXP > 0) {
          setToastFeedback({
            isCorrect: result.isCorrect,
            xp: result.earnedXP || 0,
            streakCount: result.currentStreak || undefined
          });
          
        }
        
        // Refresh background progress data silently
        void fetchProgress(subject, true);
        // Force global stats (Sidebar, Header) to re-fetch on next navigation or instantly if context updates
        sessionStorage.removeItem("student_stats_cache_v1");
        
        // Show milestone if bonus is awarded
        if (result.bonusXP && result.bonusXP > 0 && result.currentStreak) {
          setShowStreakMilestone({ show: true, count: result.currentStreak });
        }
        setCompletedLocal(prev => new Set(prev).add(activeActivity.id));
      } else {
        setSubmitError(language === "ar" ? "تعذر إرسال إجابتك. أعد المحاولة دون إغلاق النشاط." : "Could not submit your answer. Retry without closing this activity.");
      }
    } catch (err) {
      console.error("Error submitting attempt:", err);
      setSubmitError(language === "ar" ? "انقطع الاتصال. إجابتك ما زالت موجودة؛ أعد الإرسال." : "Connection failed. Your answer is still here; please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle answer change
  const handleAnswerChange = (val: string) => {
    setCurrentAnswer(val);
  };

  // Close Game Player
  const closePlayer = () => {
    setHelperModal({type:null,content:""});
    setActiveActivity(null);
    setAttemptResult(null);
    setTimeLeft(null);
  };

  // Type Translations
  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      MCQ: { ar: "اختيار من متعدد", en: "Multiple Choice" },
      TRUE_FALSE: { ar: "صح أم خطأ", en: "True / False" },
      MULTI_SELECT: { ar: "اختيارات متعددة", en: "Multiple Select" },
      MATCHING: { ar: "توصيل العناصر", en: "Matching Elements" },
      DRAG_DROP_FILL: { ar: "سحب الفراغات", en: "Drag & Drop Fill" },
      GROUP_SORTING: { ar: "تصنيف المجموعات", en: "Group Sorting" },
      NUMBER_LINE: { ar: "خط الأعداد", en: "Number Line" },
      CLOCK: { ar: "الساعة التفاعلية", en: "Interactive Clock" },
      MIND_MAP: { ar: "خريطة ذهنية", en: "Mind Map" },
      VIDEO_CHECKPOINT: { ar: "فيديو تفاعلي", en: "Interactive Video" },
      SWIPE_SORT: { ar: "سحب سريع", en: "Swipe Sort" },
      MAZE: { ar: "متاهة تعليمية", en: "Educational Maze" },
      WORD_SEARCH: { ar: "البحث عن الكلمات", en: "Word Search" },
      GEOGEBRA: { ar: "تطبيق جيوجيبرا", en: "GeoGebra App" },
      FLASH_CARD: { ar: "البطاقات التعليمية", en: "Flash Cards" },
      MEMORY_GAME: { ar: "لعبة الذاكرة", en: "Memory Game" },
      WORD_SCRAMBLE: { ar: "ترتيب الحروف", en: "Word Scramble" },
      SENTENCE_REORDER: { ar: "ترتيب الجملة", en: "Sentence Reorder" },
      MATH_EQUATION: { ar: "معادلة حسابية", en: "Math Equation" },
      SEQUENCE_ORDER: { ar: "ترتيب التسلسل", en: "Sequence Order" },
      CROSSWORD: { ar: "الكلمات المتقاطعة", en: "Crossword" },
      COUNT_OBJECTS: { ar: "عد العناصر", en: "Count Objects" },
      IMAGE_LABEL: { ar: "تسمية الصورة", en: "Image Labeling" },
      COLOR_MATCH: { ar: "تطابق الألوان", en: "Color Match" }
    };
    const item = labels[type];
    if (!item) return type;
    return language === 'ar' ? item.ar : item.en;
  };

  const hasSavedAttempt = hasActivityAttempt;

  // Flatten all activities in the current subject
  const allActivities = progressData?.clusters?.flatMap((cluster: any) => 
    cluster.skills?.flatMap((lesson: any) => lesson.activities || []) || []
  ) || [];

  const currentIdx = allActivities.findIndex((act: any) => act.id === activeActivity?.id);
  const hasNext = currentIdx !== -1 && currentIdx < allActivities.length - 1;
  const hasPrev = currentIdx > 0;

  const handleNextActivity = () => {
    if (hasNext) {
      startPlayActivity(allActivities[currentIdx + 1].id);
    }
  };

  const handlePrevActivity = () => {
    if (hasPrev) {
      startPlayActivity(allActivities[currentIdx - 1].id);
    }
  };

  const translateText = (val: any) => {
    if (!val) return "";
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object") {
          return parsed[language] || parsed["ar"] || parsed["en"] || "";
        }
      } catch {}
      return val;
    }
    if (typeof val === "object" && val !== null) {
      return val[language] || val["ar"] || val["en"] || "";
    }
    return String(val);
  };

  const loadErrorMessage = !loadError ? '' : loadError === 'progress' ? (language === 'ar' ? 'تعذر تحميل الأنشطة. أعد المحاولة.' : 'Could not load activities. Please retry.') : (language === 'ar' ? 'تعذر فتح النشاط. أعد المحاولة.' : 'Could not open activity. Please retry.');

  return (
    <DashboardLayout mainClassName={frame.main}>
      {toastFeedback && (
        <AnimatedFeedback 
          isCorrect={toastFeedback.isCorrect === true} 
          xp={toastFeedback.xp} 
          streak={toastFeedback.streakCount} 
          onComplete={() => setToastFeedback(null)} 
        />
      )}
      <div className={styles.page} dir={language === 'ar' ? 'rtl' : 'ltr'} inert={activeActivity ? true : undefined}>
        <LearningBackdrop/>
        <ActivitiesOverview language={language} data={progressData} subject={subject} onSubject={setSubject} gradeLabel={getGradeLabel(progressData?.grade || userGrade || '—')} loading={isLoading && !activeActivity} openingId={openingId} error={loadErrorMessage} onRetry={()=>void fetchProgress(subject)} hideScience={isStudentGrade123} expanded={expandedClusters} onToggle={toggleCluster} onOpen={startPlayActivity} translate={translateText} typeLabel={getActivityTypeLabel}/>

        {/* ── IMMERSIVE FULL-PAGE STUDENT GAME PLAYER OVERLAY ── */}
        {activeActivity && createPortal((
          <div ref={activityDialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={language === "ar" ? "النشاط التفاعلي" : "Interactive activity"} className={styles.player} data-activity-player dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {submitError && <div role="alert" className="report-error m-3 flex flex-wrap items-center gap-3">{submitError}<button className="report-secondary" disabled={isSubmitting} onClick={() => submitAnswer()}>{language === 'ar' ? 'إعادة الإرسال' : 'Retry submission'}</button></div>}
            <header className={styles.playerHeader}>
              <div className={styles.playerTitle}><span><BrainCircuit size={24}/></span><div><small>{language === 'ar' ? 'الأنشطة والمهارات' : 'Activities & skills'}</small><h2>{studentContentText(activeActivity,'title',language)}</h2></div></div>
              <div className={styles.playerTools}><span className={styles.reward}><Sparkles size={14}/>{attemptResult ? (attemptResult.earnedXP ?? 0) : (activeActivity.xpPoints ?? 0)} XP</span><span className={styles.timer} data-urgent={timeLeft !== null && timeLeft <= 10}><Clock size={14}/>{timeLeft !== null ? Math.floor(timeLeft / 60)+':'+(timeLeft % 60).toString().padStart(2,'0') : (language === 'ar' ? 'بدون حد زمني' : 'No time limit')}</span><button onClick={closePlayer} className={styles.close} aria-label={language === 'ar' ? 'إغلاق' : 'Close'}><X size={19}/></button></div>
            </header>

            {/* Main Full Page Body */}
            <div className={styles.playerBody}>
              
              {/* Main Interactive Workspace */}
              <section className={styles.workspace}>
                <div className={styles.playerScroll}>
                
                {/* Top Metadata & Helpers Bar */}
                <div className={styles.metadata}>
                  <div>
                    {[
                      {label:language==='ar'?'المستوى':'Level',value:activeActivity.difficulty ? metadataLabel(activeActivity.difficulty,language) : '',Icon:Layers},
                      {label:language==='ar'?'عمق المعرفة':'DOK',value:activeActivity.dok,Icon:Zap},
                      {label:language==='ar'?'المعيار':'Standard',value:questionMetadata(activeActivity,'standard',language),Icon:Target},
                      {label:language==='ar'?'المؤشر':'Indicator',value:questionMetadata(activeActivity,'indicator',language),Icon:CheckCircle2},
                      {label:language==='ar'?'الهدف':'Outcome',value:questionMetadata(activeActivity,'learningOutcome',language),Icon:GraduationCap}
                    ].filter(item=>item.value).map(({label,value,Icon})=><button key={label} className={styles.metaButton} onClick={()=>setHelperModal({type:'meta',title:label,content:String(value)})}><Icon size={13}/>{label}</button>)}
                  </div>

                  {/* Helper Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {activeActivity.hint && <button className={styles.secondary} onClick={()=>{setHintsUsed(prev=>prev+1);setHelperModal({type:'hint',content:translateText(activeActivity.hint)});}}><HelpCircle size={14}/>{language === 'ar' ? 'تلميح' : 'Hint'}</button>}
                    {activeActivity.tip && <button className={styles.secondary} onClick={()=>setHelperModal({type:'tip',content:translateText(activeActivity.tip)})}><Info size={14}/>{language === 'ar' ? 'نصيحة' : 'Tip'}</button>}
                    {attemptResult && (activeActivity.explanation || attemptResult.explanation) && <button className={styles.secondary} onClick={()=>setHelperModal({type:'explanation',content:translateText(attemptResult.explanation || activeActivity.explanation)})}><BookOpen size={14}/>{language === 'ar' ? 'الشرح' : 'Explanation'}</button>}

                  </div>
                </div>


                
                <div className="space-y-6 flex-1 w-full min-w-0">
                  {helperModal.type && <aside className={styles.helper} aria-live="polite"><div><h3>{helperModal.title || (helperModal.type === 'hint' ? (language === 'ar' ? 'تلميح يساعدك' : 'A hint to help you') : helperModal.type === 'tip' ? (language === 'ar' ? 'نصيحة' : 'Tip') : (language === 'ar' ? 'شرح الإجابة' : 'Answer explanation'))}</h3><button aria-label={language === 'ar' ? 'إغلاق المساعدة' : 'Close help'} onClick={()=>setHelperModal({type:null,content:''})}><X size={16}/></button></div><div><HtmlRenderer html={helperModal.content}/></div></aside>}
                  <div className={styles.questionIntro}><span>{getActivityTypeLabel(activeActivity.type)}</span>{currentIdx >= 0 && <small dir="ltr">{currentIdx+1} / {allActivities.length}</small>}</div>

                  <div className={styles.question}>
                    <InteractiveQuestionRenderer
                      question={activeActivity}
                      value={currentAnswer}
                      onChange={handleAnswerChange}
                      language={language}
                    />
                  </div>
                </div>

                {/* Footer Bar & Answer Confirm Button */}
                </div>
<footer className={styles.playerFooter}>
                  <div className={styles.activityNav}><button className={styles.secondary} onClick={handlePrevActivity} disabled={!hasPrev}>{language === 'ar' ? <ArrowRight size={15}/> : <ArrowLeft size={15}/>} {language === 'ar' ? 'السابق' : 'Previous'}</button><button className={styles.secondary} onClick={handleNextActivity} disabled={!hasNext}>{language === 'ar' ? 'التالي' : 'Next'} {language === 'ar' ? <ArrowLeft size={15}/> : <ArrowRight size={15}/>}</button></div>
                  <div className={styles.submitActions}><button className={styles.secondary} onClick={closePlayer}>{attemptResult ? (hasNext ? (language === 'ar' ? 'إغلاق' : 'Close') : (language === 'ar' ? 'إنهاء التمارين' : 'Finish Exercises')) : (language === 'ar' ? 'تراجع' : 'Back')}</button>
                    {attemptResult ? (hasNext && <button className={styles.primary} onClick={()=>{setAttemptResult(null);handleNextActivity();}}>{language === 'ar' ? 'النشاط التالي' : 'Next activity'}<ArrowUpRight size={16}/></button>) : <button className={styles.primary} onClick={()=>submitAnswer()} disabled={(!currentAnswer && activeActivity.type !== 'GEOGEBRA') || isSubmitting || completedLocal.has(activeActivity.id) || hasSavedAttempt(allActivities.find((a:any)=>a.id===activeActivity.id))}>
                      {isSubmitting ? <><RefreshCw size={15}/>{language === 'ar' ? 'جارٍ التقييم…' : 'Evaluating…'}</> : completedLocal.has(activeActivity.id) || hasSavedAttempt(allActivities.find((a:any)=>a.id===activeActivity.id)) ? (language === 'ar' ? 'تم التقييم مسبقًا' : 'Already Evaluated') : <>{language === 'ar' ? 'تأكيد الإجابة' : 'Confirm Answer'}<CheckCircle2 size={16}/></>}
                    </button>}
                  </div>
                </footer>

              </section>

            </div>

            {/* Feedback Result */}
            {showFeedbackAnim && attemptResult && (
              <AnimatedFeedback 
                key={attemptResult.attemptId || "expired"}
                isCorrect={attemptResult.isCorrect === true} 
                xp={Number(attemptResult.earnedXP ?? 0)}
                streak={attemptCount === 1 ? (attemptResult.currentStreak || 0) : 0}
                onComplete={() => {
                  setShowFeedbackAnim(false);
                }} 
              />
            )}
            
            {showStreakMilestone && <div className={styles.milestone} role="status"><Trophy size={26}/><div><strong>{language === 'ar' ? 'تقدّم رائع!' : 'Keep it going!'}</strong><p>{showStreakMilestone.count} {language === 'ar' ? 'إجابات صحيحة متتالية' : 'correct answers in a row'}</p></div><button onClick={()=>setShowStreakMilestone(null)} aria-label={language === 'ar' ? 'إغلاق التنبيه' : 'Dismiss celebration'}><X size={17}/></button></div>}


          </div>
        ), document.body)}

      </div>
    </DashboardLayout>
  );
}
