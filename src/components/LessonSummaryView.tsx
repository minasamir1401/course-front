"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Star, Award, Trophy, RotateCcw, BookOpen, FileDown, Clock, GraduationCap, ChevronRight, ChevronLeft } from "lucide-react";
import HtmlRenderer from "@/components/HtmlRenderer";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

interface LessonSummaryViewProps {
  pct: number;
  language: string;
  correctCount: number;
  attemptedQuestionsCount: number;
  totalLessonXP: number;
  sessionXP: number;
  sessionBonusXP: number;
  highestStreak: number;
  quizTimer: number;
  assignmentTimer: number;
  lesson: any;
  assignmentSubmitted: any;
  quizSubmitted: any;
  assignmentAnswers: any;
  answers: any;
  t: (key: string) => string;
  nextLesson: any;
  prevLesson: any;
  goToLesson: (lsn: any) => void;
  router: any;
  onReset: () => void;
}

export default function LessonSummaryView({
  pct,
  language,
  correctCount,
  attemptedQuestionsCount,
  totalLessonXP,
  sessionXP,
  sessionBonusXP,
  highestStreak,
  quizTimer,
  assignmentTimer,
  lesson,
  assignmentSubmitted,
  quizSubmitted,
  assignmentAnswers,
  answers,
  t,
  nextLesson,
  prevLesson,
  goToLesson,
  router,
  onReset
}: LessonSummaryViewProps) {
  let title = language === 'ar' ? "عمل رائع! 🎉" : "Great Job! 🎉";
  let message = language === 'ar' ? "لقد أكملت جميع متطلبات هذا الدرس بنجاح." : "You have successfully completed all requirements for this lesson.";
  let borderCol = "border-indigo-600";
  let iconEl: React.ReactNode;

  if (pct >= 85) {
    title = language === 'ar' ? "أداء ممتاز! 🏆" : "Excellent Performance! 🏆";
    message = language === 'ar' ? "رائع جداً! لقد تفوقت وأكملت الدرس بنسبة ممتازة تليق بذكائك." : "Awesome! You excelled and completed the lesson with an excellent score.";
    borderCol = "border-emerald-500";
    iconEl = (
      <div className="relative flex items-center justify-center w-[120px] h-[120px]">
        <div className="absolute inset-0 rounded-full animate-ping-slow" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)' }} />
        <div className="absolute inset-2 rounded-full animate-ping-slow" style={{ animationDelay: '0.4s', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' }} />
        <div className="w-24 h-24 rounded-[35px] flex items-center justify-center shadow-2xl animate-float-trophy bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400">
          <Trophy className="w-12 h-12 text-white" />
        </div>
      </div>
    );
  } else if (pct >= 50) {
    title = language === 'ar' ? "عمل جيد جداً! ⭐" : "Very Good Work! ⭐";
    message = language === 'ar' ? "أحسنت! لقد نجحت واجتزت الدرس بنشاط. استمر في التقدم!" : "Well done! You successfully passed the lesson. Keep moving forward!";
    borderCol = "border-amber-500";
    iconEl = (
      <div className="relative flex items-center justify-center w-[120px] h-[120px]">
        <div className="absolute inset-0 animate-spin-slow" style={{ background: 'conic-gradient(from 0deg, rgba(245,158,11,0.8), rgba(251,191,36,0.4), rgba(245,158,11,0.8))', borderRadius: '50%', filter: 'blur(8px)' }} />
        <div className="absolute inset-3 rounded-full bg-white" />
        <div className="w-24 h-24 rounded-[35px] flex items-center justify-center shadow-2xl animate-float-star bg-gradient-to-br from-amber-500 to-amber-600 relative border border-amber-400">
          <Star className="w-12 h-12 text-white fill-current animate-spin-slow" style={{ animationDuration: '4s' }} />
        </div>
      </div>
    );
  } else {
    title = language === 'ar' ? "تحتاج للمحاولة مجدداً 🔄" : "Need to Try Again 🔄";
    message = language === 'ar' ? "لم تحقق نسبة الاجتياز المطلوبة (50%). لا تقلق، التعلم يحتاج لبعض التدريب الإضافي!" : "You did not achieve the required passing score (50%). Don't worry, learning requires some extra practice!";
    borderCol = "border-rose-500";
    iconEl = (
      <div className="relative flex items-center justify-center w-[120px] h-[120px]">
        <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)' }} />
        <div className="w-24 h-24 rounded-[35px] flex items-center justify-center shadow-2xl animate-shake bg-gradient-to-br from-rose-500 to-rose-600 border border-rose-400">
          <RotateCcw className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '2s' }} />
        </div>
      </div>
    );
  }

  const checkAdvancedCorrectLocal = (q: any, ans: any) => {
    if (!ans) return false;
    const cleanStr = (s: any) => String(s ?? '').trim().replace(/"/g, '');
    try {
      const isJsonString = (str: any) => {
        if (typeof str !== 'string') return false;
        const trimmed = str.trim();
        return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
      };
      
      const corrAns = q.correctAnswer;
      const hasJson = isJsonString(corrAns) || isJsonString(ans) || typeof ans === 'object' || typeof corrAns === 'object';
      if (hasJson) {
        const correct = typeof corrAns === 'string' && (corrAns.startsWith('{') || corrAns.startsWith('[')) ? JSON.parse(corrAns) : corrAns;
        const student = typeof ans === 'string' && (ans.startsWith('{') || ans.startsWith('[')) ? JSON.parse(ans) : ans;
        if (Array.isArray(correct) && Array.isArray(student)) {
          return correct.length === student.length && correct.every((val: any, i: number) => cleanStr(val) === cleanStr(student[i]));
        }
        if (typeof correct === 'object' && typeof student === 'object' && correct !== null && student !== null) {
          const correctKeys = Object.keys(correct);
          const studentKeys = Object.keys(student);
          if (correctKeys.length !== studentKeys.length) return false;
          return correctKeys.every((k: string) => cleanStr(correct[k]) === cleanStr(student[k]));
        }
      }
    } catch (e) {}
    return cleanStr(ans) === cleanStr(q.correctAnswer);
  };

  let assignmentCorrectCount = 0;
  if (lesson?.assignments && lesson.assignments.length > 0) {
    lesson.assignments.forEach((as: any, asIdx: number) => {
      const isMulti = as.type === 'MULTI_SELECT' || as.label === 'MULTI_SELECT';
      const studentAns = assignmentAnswers[asIdx];
      const isSub = assignmentSubmitted[asIdx];
      const isStandard = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(as.label || as.type || 'MCQ');
      
      const isCorrect = isSub && (isStandard
        ? (isMulti
          ? Array.isArray(studentAns) && studentAns.length === (as.correctAnswers || []).length && studentAns.every((a: string) => (as.correctAnswers || []).includes(a))
          : studentAns === as.correctAnswer)
        : checkAdvancedCorrectLocal(as, studentAns));
        
      if (isCorrect) assignmentCorrectCount++;
    });
  }

  let quizCorrectCount = 0;
  if (lesson?.questions && lesson.questions.length > 0) {
    lesson.questions.forEach((q: any, qIdx: number) => {
      const isMulti = q.type === 'MULTI_SELECT' || q.label === 'MULTI_SELECT';
      const studentAns = answers[qIdx];
      const isSub = quizSubmitted[qIdx];
      const isStandard = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(q.label || q.type || 'MCQ');
      
      const isCorrect = isSub && (isStandard
        ? (isMulti
          ? Array.isArray(studentAns) && studentAns.length === (q.correctAnswers || []).length && studentAns.every((a: string) => (q.correctAnswers || []).includes(a))
          : studentAns === q.correctAnswer)
        : checkAdvancedCorrectLocal(q, studentAns));
        
      if (isCorrect) quizCorrectCount++;
    });
  }

  const totalAssignments = lesson?.assignments?.length || 0;
  const totalQuizzes = lesson?.questions?.length || 0;

  const assignmentScoreOf10 = totalAssignments > 0 ? parseFloat(((assignmentCorrectCount / totalAssignments) * 10).toFixed(1)) : 0;
  const quizScoreOf10 = totalQuizzes > 0 ? parseFloat(((quizCorrectCount / totalQuizzes) * 10).toFixed(1)) : 0;

  return (
    <div className="premium-card p-6 md:p-12 rounded-[40px] animate-in zoom-in duration-700 text-center relative max-w-4xl mx-auto border-2 border-indigo-50/50">
      {pct >= 50 && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <Confetti recycle={false} numberOfPieces={300} gravity={0.15} />
        </div>
      )}

      <div className="flex items-center justify-center mx-auto mb-6 relative z-10">
        {iconEl}
      </div>

      <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">{title}</h2>
      <p className="text-slate-500 text-sm md:text-base font-bold mb-8 max-w-lg mx-auto leading-relaxed">{message}</p>

      {/* ── Focused Sleek Summary Card Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className={`bg-slate-50/50 border border-slate-100 p-5 rounded-[24px] border-b-4 ${borderCol} flex flex-col items-center justify-center shadow-sm`}>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
            {language === 'ar' ? 'الدرجة' : 'Score'}
          </span>
          <span className="text-2xl md:text-3xl font-black text-slate-800">
            {correctCount} <span className="text-xs font-bold text-slate-400">/ {attemptedQuestionsCount}</span>
          </span>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[24px] border-b-4 border-emerald-500 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
            {language === 'ar' ? 'نقاط الـ XP' : 'XP Earned'}
          </span>
          <span className="text-2xl md:text-3xl font-black text-emerald-600">
            ⭐ +{sessionXP}
          </span>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[24px] border-b-4 border-amber-500 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
            {language === 'ar' ? 'أعلى متتالي' : 'Highest Streak'}
          </span>
          <span className="text-2xl md:text-3xl font-black text-amber-600 flex items-center gap-1">
            🔥 {highestStreak}
          </span>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[24px] border-b-4 border-violet-500 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
            {language === 'ar' ? 'مكافأة إضافية' : 'Bonus XP'}
          </span>
          <span className="text-2xl md:text-3xl font-black text-violet-600">
            🎁 +{sessionBonusXP}
          </span>
        </div>
      </div>

      {/* ── NEXT / RETRY BUTTONS ( Sleek Gradient Style) ── */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
        {nextLesson ? (
          <button
            onClick={() => goToLesson(nextLesson)}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 px-12 py-4 rounded-[20px] font-black text-lg transition-all shadow-xl shadow-indigo-100 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 border border-indigo-500/20"
          >
            <span>{language === 'ar' ? "الدرس التالي" : "Next Lesson"}</span>
            <ChevronLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <button
            onClick={() => router.push(`/courses/${lesson.courseId}`)}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 px-12 py-4 rounded-[20px] font-black text-lg transition-all shadow-xl shadow-indigo-100 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 border border-indigo-500/20"
          >
            <span>{language === 'ar' ? "التالي (العودة للمقرر)" : "Next (Back to Course)"}</span>
            <ChevronLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
          </button>
        )}

        {pct < 50 && (
          <button
            onClick={onReset}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-[20px] font-black text-lg hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-amber-100 border border-amber-500/20 flex items-center justify-center gap-2"
          >
            {language === 'ar' ? 'إعادة المحاولة 🔄' : 'Try Again 🔄'}
          </button>
        )}
      </div>

      {/* ── Portfolio Breakdown (Scrollable & Sleek) ── */}
      <div className="max-w-4xl mx-auto text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 justify-start">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
               <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-start">
              <h3 className="text-base font-black text-slate-900">
                {language === 'ar' ? 'ملف إنجاز الطالب والتقدم الدراسي' : 'Student Progress Portfolio'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">
                {language === 'ar' ? 'مؤشرات الأداء وتفاصيل التحصيل لهذا الدرس' : 'Performance indicators and achievement details for this lesson'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {language === 'ar' ? 'الوقت المستغرق' : 'Time Spent'}
              </span>
              <span className="text-base font-black text-slate-800">
                {Math.floor((quizTimer + assignmentTimer) / 60)} {language === 'ar' ? 'دقيقة' : 'min'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {language === 'ar' ? 'الشرائح المقروءة' : 'Slides Read'}
              </span>
              <span className="text-base font-black text-slate-800">
                {lesson.slides?.length || 0} / {lesson.slides?.length || 0}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {language === 'ar' ? 'درجة الواجبات' : 'Assignment Score'}
              </span>
              <span className="text-base font-black text-slate-800">
                {assignmentScoreOf10} <span className="text-xs font-bold text-slate-400">/ 10</span>
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {language === 'ar' ? 'درجة التمارين' : 'Quiz Score'}
              </span>
              <span className="text-base font-black text-slate-800">
                {quizScoreOf10} <span className="text-xs font-bold text-slate-400">/ 10</span>
              </span>
            </div>
          </div>

          {/* Detailed Breakdown for Assignments & Exercises */}
          <div className="space-y-4 pt-2 text-start">
            {lesson.assignments && lesson.assignments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-850 flex items-center gap-2 justify-start">
                  <FileDown className="w-4 h-4 text-indigo-500" />
                  <span>{language === 'ar' ? 'تقرير إجابات الواجب والتقييم الذاتي' : 'Assignments Report & Self-Evaluation'}</span>
                </h4>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                  {lesson.assignments.map((as: any, asIdx: number) => {
                    const isMulti = as.type === 'MULTI_SELECT' || as.label === 'MULTI_SELECT';
                    const studentAns = assignmentAnswers[asIdx];
                    const isSub = assignmentSubmitted[asIdx];
                    const isStandard = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(as.label || as.type || 'MCQ');
                    
                    const isCorrect = isSub && (isStandard
                      ? (isMulti
                        ? Array.isArray(studentAns) && studentAns.length === (as.correctAnswers || []).length && studentAns.every((a: string) => (as.correctAnswers || []).includes(a))
                        : studentAns === as.correctAnswer)
                      : checkAdvancedCorrectLocal(as, studentAns));

                    const isSkipped = !studentAns || (Array.isArray(studentAns) && studentAns.length === 0) || studentAns === '' || studentAns === '[]';

                    return (
                      <div key={asIdx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700 truncate max-w-[70%] text-right">
                          {language === 'ar' ? 'واجب' : 'Assignment'} {asIdx + 1}: <HtmlRenderer html={as.text} tag="span" className="font-normal text-slate-500" />
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg font-black shrink-0 ${
                          isCorrect 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : isSkipped 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {isCorrect 
                            ? (language === 'ar' ? 'صحيحة ✓' : 'Correct ✓') 
                            : isSkipped 
                              ? (language === 'ar' ? 'تم التخطي ↷' : 'Skipped ↷') 
                              : (language === 'ar' ? 'خاطئة ✗' : 'Wrong ✗')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {lesson.questions && lesson.questions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-850 flex items-center gap-2 justify-start">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>{language === 'ar' ? 'تقرير إجابات التمارين والتقييم الذاتي' : 'Exercises Report & Self-Evaluation'}</span>
                </h4>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                  {lesson.questions.map((q: any, qIdx: number) => {
                    const isMulti = q.type === 'MULTI_SELECT' || q.label === 'MULTI_SELECT';
                    const studentAns = answers[qIdx];
                    const isSub = quizSubmitted[qIdx];
                    const isStandard = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(q.label || q.type || 'MCQ');
                    
                    const isCorrect = isSub && (isStandard
                      ? (isMulti
                        ? Array.isArray(studentAns) && studentAns.length === (q.correctAnswers || []).length && studentAns.every((a: string) => (q.correctAnswers || []).includes(a))
                        : studentAns === q.correctAnswer)
                      : checkAdvancedCorrectLocal(q, studentAns));

                    const isSkipped = !studentAns || (Array.isArray(studentAns) && studentAns.length === 0) || studentAns === '' || studentAns === '[]';

                    return (
                      <div key={qIdx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700 truncate max-w-[70%] text-right">
                          {language === 'ar' ? 'سؤال' : 'Question'} {qIdx + 1}: <HtmlRenderer html={q.text} tag="span" className="font-normal text-slate-500" />
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg font-black shrink-0 ${
                          isCorrect 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : isSkipped 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {isCorrect 
                            ? (language === 'ar' ? 'صحيحة ✓' : 'Correct ✓') 
                            : isSkipped 
                              ? (language === 'ar' ? 'تم التخطي ↷' : 'Skipped ↷') 
                              : (language === 'ar' ? 'خاطئة ✗' : 'Wrong ✗')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
