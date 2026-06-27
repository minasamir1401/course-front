"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Sparkles, Award, Trophy, Play, CheckCircle2, AlertCircle,
  HelpCircle, Info, ChevronDown, ChevronUp, BookOpen, Clock,
  Target, X, Lock, RefreshCw, Star, StarOff, BrainCircuit, ArrowLeft, ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import InteractiveQuestionRenderer from "@/components/InteractiveQuestionRenderer";

export default function ActivitiesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  
  const getGradeLabel = (g: string) => {
    if (language === "ar") return g;
    const map: Record<string, string> = {
      "الصف الأول الابتدائي": "Grade 1 Primary",
      "الصف الثاني الابتدائي": "Grade 2 Primary",
      "الصف الثالث الابتدائي": "Grade 3 Primary",
      "الصف الرابع الابتدائي": "Grade 4 Primary",
      "الصف الخامس الابتدائي": "Grade 5 Primary",
      "الصف السادس الابتدائي": "Grade 6 Primary",
      "الصف الأول الإعدادي": "Grade 7 Preparatory",
      "الصف الثاني الإعدادي": "Grade 8 Preparatory",
      "الصف الثالث الإعدادي": "Grade 9 Preparatory",
      "الصف الأول الثانوي": "Grade 10 Secondary",
      "الصف الثاني الثانوي": "Grade 11 Secondary",
      "الصف الثالث الثانوي": "Grade 12 Secondary"
    };
    return map[g] || g;
  };
  const [token, setToken] = useState<string | null>(null);
  
  // Data States
  const [subject, setSubject] = useState<string>("الرياضيات"); // Default subject
  const [progressData, setProgressData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  
  // Game Play States
  const [activeActivity, setActiveActivity] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(1);
  
  // Helper Modal States
  const [helperModal, setHelperModal] = useState<{ type: "hint" | "tip" | "keyInsight" | null; content: string }>({
    type: null,
    content: ""
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("lms_token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);
    fetchProgress(storedToken, subject);
  }, [router, subject]);

  const fetchProgress = async (authToken: string, currentSubject: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/skills-hub/progress?subject=${encodeURIComponent(currentSubject)}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
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
      console.error("Error fetching progress data:", error);
    } finally {
      setIsLoading(false);
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
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/skills-hub/activities/${activityId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const activity = await res.json();
        setActiveActivity(activity);
        setCurrentAnswer("");
        setStartTime(Date.now());
        setHintsUsed(0);
        setAttemptCount(1);
        setAttemptResult(null);
      }
    } catch (err) {
      console.error("Error loading activity:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Answer
  const submitAnswer = async () => {
    if (!token || !activeActivity || isSubmitting) return;
    setIsSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    
    try {
      const res = await fetch(`${API_URL}/skills-hub/activities/${activeActivity.id}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          selectedAnswer: currentAnswer,
          timeTaken,
          hintsUsed,
          attemptCount
        })
      });
      
      if (res.ok) {
        const result = await res.json();
        setAttemptResult(result);
        
        // Refresh background progress data silently
        fetchProgress(token, subject);
      } else {
        const errData = await res.json();
        alert(errData.error || (language === 'ar' ? "خطأ في الإرسال" : "Submission failed"));
      }
    } catch (err) {
      console.error("Error submitting attempt:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Retry
  const handleRetry = () => {
    setAttemptResult(null);
    setCurrentAnswer("");
    setStartTime(Date.now());
    setAttemptCount(prev => prev + 1);
  };

  // Close Game Player
  const closePlayer = () => {
    setActiveActivity(null);
    setAttemptResult(null);
  };

  // Render Stars
  const renderStarIcons = (count: number) => {
    return (
      <div className="flex gap-1 items-center justify-center">
        {[1, 2, 3].map(index => {
          const isFilled = index <= count;
          return isFilled ? (
            <Star key={index} className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
          ) : (
            <StarOff key={index} className="w-5 h-5 text-slate-300" />
          );
        })}
      </div>
    );
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

  // Calculate overall metrics
  const totalStars = progressData?.clusters?.reduce((sum: number, c: any) => sum + (c.stats.totalStarsEarned || 0), 0) || 0;
  const maxPossibleStars = progressData?.clusters?.reduce((sum: number, c: any) => sum + (c.stats.maxPossibleStars || 0), 0) || 0;
  const totalXP = progressData?.clusters?.reduce((sum: number, c: any) => sum + (c.stats.totalXPEarned || 0), 0) || 0;
  const averageMastery = progressData?.clusters?.length > 0 
    ? Math.round(progressData.clusters.reduce((sum: number, c: any) => sum + (c.stats.masteryPercent || 0), 0) / progressData.clusters.length) 
    : 0;

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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Style block for customized 3D animation, confetti, etc. */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes floating-bubble {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(3deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .animate-float {
            animation: floating-bubble 4s ease-in-out infinite;
          }
          .game-card-3d {
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 8px 0 #cbd5e1, 0 12px 15px rgba(0,0,0,0.05);
            border-bottom: 2px solid #e2e8f0;
          }
          .game-card-3d:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 0 #94a3b8, 0 16px 20px rgba(0,0,0,0.08);
          }
          .game-card-3d:active {
            transform: translateY(6px);
            box-shadow: 0 2px 0 #94a3b8, 0 4px 6px rgba(0,0,0,0.1);
          }
          .game-btn-3d-violet {
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            box-shadow: 0 6px 0 #4c1d95, 0 10px 15px rgba(139, 92, 246, 0.3);
            transition: all 0.15s ease;
          }
          .game-btn-3d-violet:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 0 #4c1d95, 0 12px 18px rgba(139, 92, 246, 0.4);
          }
          .game-btn-3d-violet:active {
            transform: translateY(6px);
            box-shadow: 0 0px 0 #4c1d95, 0 4px 6px rgba(139, 92, 246, 0.2);
          }
          .game-btn-3d-emerald {
            background: linear-gradient(135deg, #10b981, #047857);
            box-shadow: 0 6px 0 #064e3b, 0 10px 15px rgba(16, 185, 129, 0.3);
            transition: all 0.15s ease;
          }
          .game-btn-3d-emerald:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 0 #064e3b, 0 12px 18px rgba(16, 185, 129, 0.4);
          }
          .game-btn-3d-emerald:active {
            transform: translateY(6px);
            box-shadow: 0 0px 0 #064e3b, 0 4px 6px rgba(16, 185, 129, 0.2);
          }
          .glass-modal {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.4);
          }
          .star-pop {
            animation: pop-star-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.5) both;
          }
          @keyframes pop-star-in {
            0% { transform: scale(0) rotate(-45deg); opacity: 0; }
            70% { transform: scale(1.2) rotate(15deg); }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
        ` }} />

        {/* ── PREMIUM HEADER ── */}
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-indigo-750 via-violet-850 to-purple-900 p-8 md:p-12 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-15" />
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-violet-400/20 blur-[80px] rounded-full animate-pulse" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-4 text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/20">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-[11px] font-black tracking-widest uppercase">KLEVRO Skills Hub</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                {language === 'ar' ? (
                  <>مركز <span className="text-amber-300">المهارات والأنشطة التفاعلية</span></>
                ) : (
                  <>Interactive <span className="text-amber-300">Skills & Activities Hub</span></>
                )}
              </h1>
              <p className="text-indigo-100/90 text-sm md:text-base max-w-xl font-bold leading-relaxed">
                {language === 'ar' 
                  ? 'طوّر مهاراتك من خلال أنشطة تفاعلية وألعاب ذكية ثلاثية الأبعاد مصممة خصيصاً لتنمية التفكير الإبداعي والتحليلي.' 
                  : 'Develop your skills through interactive activities and smart 3D games tailored to foster creative and analytical thinking.'}
              </p>
            </div>
            
            {/* Subject Tabs */}
            <div className="flex gap-3 bg-black/15 p-2 rounded-2xl border border-white/10 shrink-0">
              {["الرياضيات", "القراءة", "العلوم"].map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSubject(subj)}
                  className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${
                    subject === subj
                      ? "bg-white text-indigo-900 shadow-md scale-105"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {subj === "الرياضيات" 
                    ? (language === 'ar' ? "📐 الرياضيات" : "📐 Mathematics") 
                    : subj === "القراءة"
                    ? (language === 'ar' ? "📚 القراءة" : "📚 Reading")
                    : (language === 'ar' ? "🔬 العلوم" : "🔬 Science")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── METRICS SUMMARY BAR ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Total Stars */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner shrink-0">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <span className="text-xs font-black text-slate-400 block uppercase">{language === 'ar' ? 'النجوم المكتسبة' : 'Stars Earned'}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-800">{totalStars}</span>
                <span className="text-sm font-bold text-slate-400">/ {maxPossibleStars}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total XP */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner shrink-0">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <span className="text-xs font-black text-slate-400 block uppercase">{language === 'ar' ? 'نقاط الخبرة XP' : 'XP Points'}</span>
              <span className="text-2xl font-black text-slate-800">{totalXP} XP</span>
            </div>
          </div>

          {/* Card 3: Mastery Level */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner shrink-0">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <span className="text-xs font-black text-slate-400 block uppercase">{language === 'ar' ? 'متوسط مستوى الإتقان' : 'Average Mastery'}</span>
              <span className="text-2xl font-black text-slate-850">{averageMastery}%</span>
            </div>
          </div>

          {/* Card 4: Subject Information */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <span className="text-xs font-black text-slate-400 block uppercase">{language === 'ar' ? 'الصف الدراسي الحالي' : 'Current Grade'}</span>
              <span className="text-lg font-black text-slate-800 truncate">{getGradeLabel(progressData?.grade || "الصف الثالث الابتدائي")}</span>
            </div>
          </div>
        </div>

        {/* ── SKILLS MAP & CLUSTERS ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">{language === 'ar' ? 'مخطط الأنشطة التفاعلية' : 'Interactive Activities Map'}</h2>
          </div>

          {isLoading && !activeActivity ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[300px]">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 font-bold">{language === 'ar' ? 'جاري تحميل خريطة المهارات...' : 'Loading skills map...'}</p>
            </div>
          ) : progressData?.clusters?.length > 0 ? (
            <div className="space-y-6">
              {progressData.clusters.map((cluster: any, cIdx: number) => {
                const isExpanded = !!expandedClusters[cluster.id];
                const stats = cluster.stats;
                return (
                  <div
                    key={cluster.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all"
                  >
                    
                    {/* Cluster Header */}
                    <div
                      onClick={() => toggleCluster(cluster.id)}
                      className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors border-b ${
                        isExpanded ? "border-slate-100" : "border-transparent"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            {language === 'ar' ? `المحور المهاراتي ${cIdx + 1}` : `Skill Cluster ${cIdx + 1}`}
                          </span>
                          {cluster.isCentral && (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-black rounded">
                              {language === 'ar' ? 'منهج مركزي عام' : 'General Central Curriculum'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-black text-slate-800">{translateText(cluster.name)}</h3>
                        {cluster.description && (
                          <p className="text-slate-400 font-medium text-sm">{translateText(cluster.description)}</p>
                        )}
                      </div>
                      
                      {/* Cluster Stats & Toggle */}
                      <div className="flex items-center gap-6 w-full md:w-auto self-stretch md:self-auto justify-between md:justify-end">
                        <div className="flex items-center gap-8 shrink-0">
                          {/* Progress Circle or Label */}
                          <div className="text-right space-y-1">
                            <span className="text-slate-400 font-black text-[10px] uppercase block">{language === 'ar' ? 'مستوى الإتقان' : 'Mastery Level'}</span>
                            <span className="text-lg font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                              {stats.masteryPercent}%
                            </span>
                          </div>
                          
                          {/* Stars count */}
                          <div className="text-right space-y-1">
                            <span className="text-slate-400 font-black text-[10px] uppercase block">{language === 'ar' ? 'النجوم المحققة' : 'Stars Earned'}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-black text-slate-700">{stats.totalStarsEarned} / {stats.maxPossibleStars}</span>
                            </div>
                          </div>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Cluster Body (Lessons & Activities) */}
                    {isExpanded && (
                      <div className="p-6 bg-slate-50/20 space-y-6">
                        {cluster.skills?.length > 0 ? (
                          cluster.skills.map((lesson: any, lIdx: number) => (
                            <div
                              key={lesson.id}
                              className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-sm border border-indigo-100">
                                  {lIdx + 1}
                                </div>
                                <h4 className="text-lg font-black text-slate-800">{translateText(lesson.name)}</h4>
                                {lesson.description && (
                                  <span className="text-slate-400 text-xs font-bold">— {translateText(lesson.description)}</span>
                                )}
                              </div>

                              {/* Activities grid */}
                              {lesson.activities?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                                  {lesson.activities.map((activity: any) => (
                                    <div
                                      key={activity.id}
                                      className="bg-white rounded-[28px] border border-slate-200/80 p-5 flex flex-col justify-between min-h-[190px] game-card-3d"
                                    >
                                      {/* Top: Metadata */}
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-black rounded-lg text-[9px] uppercase tracking-wider">
                                            {getActivityTypeLabel(activity.type)}
                                          </span>
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                            activity.difficulty === "Easy"
                                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                              : activity.difficulty === "Hard"
                                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                                              : "bg-amber-50 text-amber-600 border border-amber-100"
                                          }`}>
                                            {activity.difficulty === "Easy" ? (language === 'ar' ? "سهل" : "Easy") : activity.difficulty === "Hard" ? (language === 'ar' ? "صعب" : "Hard") : (language === 'ar' ? "متوسط" : "Medium")}
                                          </span>
                                        </div>
                                        <h5 className="font-black text-slate-800 text-base line-clamp-2">{translateText(activity.title)}</h5>
                                        {activity.learningOutcome && (
                                          <p className="text-[10px] text-slate-400 font-bold truncate">
                                            {language === 'ar' ? 'مخرجات التعلم: ' : 'Learning Outcome: '}{translateText(activity.learningOutcome)}
                                          </p>
                                        )}
                                      </div>

                                      {/* Bottom: Stars & Play Button */}
                                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                                        {/* Stars earned */}
                                        <div className="flex gap-0.5">
                                          {renderStarIcons(activity.bestAttemptStars || 0)}
                                        </div>
                                        
                                        <button
                                          onClick={() => startPlayActivity(activity.id)}
                                          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0"
                                        >
                                          <Play className="w-4 h-4 fill-white pr-0.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-400 font-bold text-xs py-2">
                                  {language === 'ar' ? 'لا توجد أنشطة مسجلة في هذه المهارة الفرعية.' : 'No activities registered in this sub-skill.'}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 font-bold text-center py-4">
                            {language === 'ar' ? 'لا توجد مهارات فرعية في هذا المحور بعد.' : 'No sub-skills in this cluster yet.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Award className="w-16 h-16 text-slate-350 mx-auto mb-4" />
              <p className="text-slate-400 font-black">
                {language === 'ar' ? 'لا توجد محاور أو أنشطة مهارات مسجلة لهذه المادة بعد.' : 'No clusters or activities registered for this subject yet.'}
              </p>
            </div>
          )}
        </div>

         {/* ── IMMERSIVE FULL-SCREEN 3D GAME PLAYER OVERLAY ── */}
        {activeActivity && (
          <div className="fixed inset-0 z-[100] bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 w-full max-w-5xl md:rounded-[40px] shadow-2xl flex flex-col min-h-screen md:min-h-[85vh] md:max-h-[90vh] overflow-y-auto md:overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
              
              {/* Game Player Header */}
              <div className="bg-gradient-to-r from-indigo-700 to-violet-850 p-6 text-white flex justify-between items-center shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 floating" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Klevro Skills Play</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black truncate max-w-xl">{translateText(activeActivity.title)}</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-black">
                    <Clock className="w-4 h-4 text-indigo-200" />
                    <span>{language === 'ar' ? `الزمن المقدر: ${activeActivity.estimatedTime} ثانية` : `Estimated: ${activeActivity.estimatedTime}s`}</span>
                  </div>
                  <button
                    onClick={closePlayer}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors border border-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Game Player Body */}
              <div className="flex-1 md:overflow-y-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
                
                {/* Right: Helpers Panel (1/4 width on desktop) */}
                <div className="w-full lg:w-64 space-y-4 shrink-0">
                  <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-indigo-500" />
                      {language === 'ar' ? 'تلميحات ومساعدات التعلم' : 'Hints & Learning Aids'}
                    </h4>
                    
                    {/* Hint Button */}
                    <button
                      onClick={() => {
                        setHintsUsed(prev => prev + 1);
                        setHelperModal({ type: "hint", content: translateText(activeActivity.hint) || (language === 'ar' ? "لا يوجد تلميح مسجل لهذا النشاط." : "No hint recorded for this activity.") });
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:scale-[1.02] text-amber-800 font-black text-sm transition-all"
                    >
                      <span className="flex items-center gap-2">{language === 'ar' ? '💡 فكرة للمساعدة' : '💡 Help Hint'}</span>
                      {language === 'ar' ? <ArrowLeft className="w-4 h-4 text-amber-500" /> : <ArrowRight className="w-4 h-4 text-amber-500" />}
                    </button>

                    {/* Tip Button */}
                    <button
                      onClick={() => {
                        setHelperModal({ type: "tip", content: translateText(activeActivity.tip) || (language === 'ar' ? "لا توجد نصيحة ذكية مسجلة." : "No smart tip recorded.") });
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:scale-[1.02] text-emerald-800 font-black text-sm transition-all"
                    >
                      <span className="flex items-center gap-2">{language === 'ar' ? '🧠 نصيحة ذكية' : '🧠 Smart Tip'}</span>
                      {language === 'ar' ? <ArrowLeft className="w-4 h-4 text-emerald-500" /> : <ArrowRight className="w-4 h-4 text-emerald-500" />}
                    </button>

                    {/* Key Insight Button */}
                    <button
                      onClick={() => {
                        setHelperModal({ type: "keyInsight", content: translateText(activeActivity.keyInsight) || (language === 'ar' ? "لا توجد فكرة جوهرية مسجلة." : "No key insight recorded.") });
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:scale-[1.02] text-indigo-800 font-black text-sm transition-all"
                    >
                      <span className="flex items-center gap-2">{language === 'ar' ? '📘 فكرة جوهرية' : '📘 Key Insight'}</span>
                      {language === 'ar' ? <ArrowLeft className="w-4 h-4 text-indigo-500" /> : <ArrowRight className="w-4 h-4 text-indigo-500" />}
                    </button>
                  </div>
                  
                  {/* Metadata display */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3 text-xs font-bold text-slate-500">
                    {activeActivity.standard && <p>{language === 'ar' ? '🔍 المعيار: ' : '🔍 Standard: '}<span className="text-slate-800 font-black">{activeActivity.standard}</span></p>}
                    {activeActivity.indicator && <p>{language === 'ar' ? '🎯 المؤشر: ' : '🎯 Indicator: '}<span className="text-slate-800 font-black">{activeActivity.indicator}</span></p>}
                    <p>{language === 'ar' ? '🏆 النقاط: ' : '🏆 Points: '}<span className="text-indigo-650 font-black">{activeActivity.points} {language === 'ar' ? 'نقطة' : 'XP'}</span></p>
                  </div>
                </div>

                {/* Left: Interactive Workspace */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-150 p-6 md:p-8 flex flex-col justify-between shadow-sm min-h-[400px]">
                  
                  {/* Renderer */}
                  <div className="space-y-6 flex-1">
                    <InteractiveQuestionRenderer
                      question={activeActivity}
                      value={currentAnswer}
                      onChange={setCurrentAnswer}
                      language={language}
                    />
                  </div>

                  {/* Submission Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                    <button
                      onClick={closePlayer}
                      className="px-6 py-3.5 rounded-2xl bg-slate-50/80 border-2 border-slate-200/60 text-slate-900 hover:bg-slate-100 font-black text-sm transition-all active:scale-95 w-full sm:w-auto"
                    >
                      {language === 'ar' ? 'تراجع' : 'Back'}
                    </button>
                    
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center">
                      <button
                        type="button"
                        onClick={handlePrevActivity}
                        disabled={!hasPrev}
                        className={`px-5 py-3.5 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center ${
                          hasPrev
                            ? "bg-slate-50/80 border-2 border-slate-200/60 text-slate-900 hover:bg-slate-100 cursor-pointer"
                            : "bg-slate-50/30 border-2 border-slate-200/20 text-slate-300 cursor-not-allowed"
                        }`}
                      >
                        {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextActivity}
                        disabled={!hasNext}
                        className={`px-5 py-3.5 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center ${
                          hasNext
                            ? "bg-slate-50/80 border-2 border-slate-200/60 text-slate-900 hover:bg-slate-100 cursor-pointer"
                            : "bg-slate-50/30 border-2 border-slate-200/20 text-slate-300 cursor-not-allowed"
                        }`}
                      >
                        <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
                        {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      onClick={submitAnswer}
                      disabled={!currentAnswer || isSubmitting}
                      className={`px-10 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center ${
                        !currentAnswer || isSubmitting
                          ? "bg-sky-200/40 text-slate-400 cursor-not-allowed border border-sky-300/10 shadow-none"
                          : "bg-sky-400 text-slate-950 hover:bg-sky-500 shadow-xl shadow-sky-200/40 border border-sky-500/20"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          {language === 'ar' ? 'جاري التقييم...' : 'Evaluating...'}
                        </>
                      ) : (
                        <>
                          <span>{language === 'ar' ? 'أرسل الحل للتصحيح' : 'Submit for review'}</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── ATTEMPT RESULT POPUP MODAL (Inside Player) ── */}
              {attemptResult && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] overflow-y-auto">
                  <div className="bg-white w-full max-w-lg rounded-[36px] shadow-2xl p-8 border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-200">
                    
                    {/* Stars animation */}
                    <div className="space-y-4">
                      <div className="flex justify-center gap-3 star-pop">
                        {[1, 2, 3].map(index => {
                          const isFilled = index <= attemptResult.stars;
                          return isFilled ? (
                            <Star key={index} className="w-16 h-16 fill-amber-400 text-amber-400 drop-shadow-md scale-[1.1] animate-pulse" />
                          ) : (
                            <StarOff key={index} className="w-16 h-16 text-slate-200" />
                          );
                        })}
                      </div>
                      
                      <h4 className={`text-2xl font-black ${
                        attemptResult.isCorrect ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {attemptResult.isCorrect ? (
                          attemptResult.stars === 3 
                            ? (language === 'ar' ? "ممتاز! حل مثالي ورائع 🏆" : "Excellent! Perfect solution 🏆") 
                            : (language === 'ar' ? "أحسنت! إجابة صحيحة 🌟" : "Good job! Correct answer 🌟")
                        ) : (
                          language === 'ar' ? "حاول مجدداً للوصول للحل الصحيح!" : "Try again to find the correct solution!"
                        )}
                      </h4>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-500 font-bold text-sm">
                      <div>
                        <span>{language === 'ar' ? 'النقاط المكتسبة:' : 'Points Earned:'}</span>
                        <p className="text-slate-800 text-xl font-black mt-1">+{attemptResult.score} XP</p>
                      </div>
                      <div>
                        <span>{language === 'ar' ? 'النتيجة:' : 'Result:'}</span>
                        <p className="text-slate-800 text-xl font-black mt-1">
                          {attemptResult.isCorrect 
                            ? (language === 'ar' ? "إجابة صحيحة" : "Correct") 
                            : (language === 'ar' ? "غير مكتمل" : "Incomplete")}
                        </p>
                      </div>
                    </div>

                    {/* Explanation */}
                    {attemptResult.explanation && (
                      <div className={`space-y-2 bg-indigo-50/40 p-5 rounded-2xl border border-indigo-50 text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <h5 className="font-black text-indigo-950 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-indigo-650" />
                          {language === 'ar' ? 'شرح الحل والخطوات العلمية:' : 'Solution Explanation:'}
                        </h5>
                        <p className="text-indigo-900 leading-relaxed font-medium">{translateText(attemptResult.explanation)}</p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-sm transition-all active:scale-95"
                      >
                        {language === 'ar' ? 'أعد المحاولة' : 'Try Again'}
                      </button>
                      <button
                        onClick={closePlayer}
                        className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white font-black text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        {language === 'ar' ? 'إغلاق ومتابعة' : 'Close & Continue'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── helper MODALS (Hint, Tip, Key Insight) ── */}
              {helperModal.type !== null && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[120]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <div className={`bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} animate-in zoom-in-95 duration-200`}>
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="font-black text-lg text-slate-800 flex items-center gap-2">
                        {helperModal.type === "hint" 
                          ? (language === 'ar' ? "💡 تلميح ومساعدة" : "💡 Hint & Assistance") 
                          : helperModal.type === "tip" 
                          ? (language === 'ar' ? "🧠 نصيحة ذكية" : "🧠 Smart Tip") 
                          : (language === 'ar' ? "📘 فكرة جوهرية" : "📘 Key Insight")}
                      </h4>
                      <button
                        onClick={() => setHelperModal({ type: null, content: "" })}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-slate-600 font-medium leading-relaxed">{helperModal.content}</p>
                    
                    <div className="pt-2">
                      <button
                        onClick={() => setHelperModal({ type: null, content: "" })}
                        className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-sm transition-colors"
                      >
                        {language === 'ar' ? "حسناً، فهمت" : "OK, Got it"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
