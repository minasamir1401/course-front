"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { User, Award, BookOpen, TrendingUp, Sparkles, LayoutGrid, FileText, CheckCircle2, Trophy, Flame } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { API_URL } from "@/lib/api";

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [xpSummary, setXpSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("lms_token") || 
                      localStorage.getItem("super_admin_token") || 
                      localStorage.getItem("school_admin_token");
        if (!token) return;

        const [statsRes, xpRes] = await Promise.all([
          fetch(`${API_URL}/student/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/student/xp-summary`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (xpRes.ok) {
          const xpData = await xpRes.json();
          setXpSummary(xpData);
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-100"></div>
        </div>
      </DashboardLayout>
    );
  }

  const overallProgress = stats?.overallCourseProgress || 0;
  const totalXP = xpSummary?.totalXP || stats?.xp || 0;

  return (
    <DashboardLayout>
      <div className={`flex flex-col gap-8 max-w-7xl mx-auto pb-24 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] premium-gradient-primary p-8 md:p-12 group shadow-2xl shadow-indigo-500/20 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 blur-[100px] rounded-full animate-pulse" />
          <div className="relative z-10 space-y-3 text-center md:text-start">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-1">
               <span className="text-amber-300">🏆</span>
               <span className="text-white text-[10px] font-black uppercase tracking-widest">{t('profile.home')} / {language === 'ar' ? 'ملف الطالب الإنجازي' : 'Student Portfolio'}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight flex flex-col md:flex-row items-center gap-3">
              <span>{stats?.name || "طالب كليفر"}</span>
            </h1>
            <p className="text-indigo-200 font-bold text-sm md:text-base">
              {stats?.schoolName || "مدرسة كليفر الأكاديمية"} • {stats?.grade || "الصف الدراسي"}
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[28px] shadow-2xl">
            <div className="text-amber-400 text-3xl">⭐</div>
            <div className="text-right">
              <p className="text-[10px] text-indigo-200 font-black uppercase leading-none">{language === 'ar' ? 'مجموع نقاط XP' : 'Total XP Points'}</p>
              <p className="text-2xl font-black text-white leading-tight mt-1">{totalXP} XP</p>
            </div>
          </div>
        </div>

        {/* Portfolio Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Stats Overview */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* User Info details */}
            <div className="premium-card rounded-[35px] p-8 border border-slate-100/60 shadow-md space-y-6">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2.5">
                <User className="w-5 h-5 text-indigo-500" />
                {language === 'ar' ? 'البيانات الشخصية والصفية' : 'Personal & Classroom Details'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400">{language === 'ar' ? 'المستوى الدراسي' : 'Grade'}</span>
                  <span className="text-slate-800">{stats?.grade || '--'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400">{language === 'ar' ? 'الفصل الدراسي' : 'Classroom'}</span>
                  <span className="text-slate-800">{stats?.classroomName || '--'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400">{language === 'ar' ? 'المعلم المشرف' : 'Teacher'}</span>
                  <span className="text-slate-800">{stats?.teacherName || '--'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400">{language === 'ar' ? 'المدرسة' : 'School'}</span>
                  <span className="text-slate-800">{stats?.schoolName || '--'}</span>
                </div>
              </div>
            </div>

            {/* Academic stats cards */}
            <div className="premium-card rounded-[35px] p-8 border border-slate-100/60 shadow-md space-y-6">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                {language === 'ar' ? 'مؤشرات الأداء الأكاديمي' : 'Academic Performance'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {language === 'ar' ? 'معدل الدرجات' : 'Average Score'}
                  </span>
                  <span className="text-2xl font-black text-indigo-600">
                    {stats?.avgScore || 0}%
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {language === 'ar' ? 'الاختبارات المحلولة' : 'Exams Solved'}
                  </span>
                  <span className="text-2xl font-black text-slate-800">
                    {stats?.totalExams || 0}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {language === 'ar' ? 'التقدم الدراسي العام' : 'Overall Course Progress'}
                  </span>
                  <div className="flex items-center gap-3 justify-center mt-1">
                    <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${overallProgress}%` }} />
                    </div>
                    <span className="text-lg font-black text-slate-800">{overallProgress}%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - XP breakdown by course */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Gamification Portfolio breakdown */}
            <div className="premium-card rounded-[35px] p-8 border border-slate-100/60 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                  <Trophy className="w-6 h-6 text-amber-500 animate-bounce" />
                  {language === 'ar' ? 'توزيع نقاط الـ XP والتقدم' : 'XP Distribution & Breakdown'}
                </h3>
                <span className="px-4.5 py-1.5 bg-amber-50 text-amber-700 text-xs font-black rounded-xl border border-amber-200">
                  {language === 'ar' ? 'مجموع النقاط' : 'XP Earned'}
                </span>
              </div>

              {/* Skills Hub XP Display */}
              {xpSummary?.skillsXP && (
                <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center text-xl shrink-0">
                      ⚡
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">{xpSummary.skillsXP.title}</h4>
                      <p className="text-xs text-slate-500 font-bold">{language === 'ar' ? 'الأنشطة والمهارات التفاعلية المسلمة' : 'Interactive activities and skills submitted'}</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-white text-amber-700 border border-amber-200 rounded-2xl font-black text-base shadow-sm">
                    +{xpSummary.skillsXP.xp} XP
                  </span>
                </div>
              )}

              {/* Courses XP List */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'النقاط المكتسبة حسب الكورسات' : 'XP Earned by Course'}</h4>
                
                {stats?.courseProgresses && stats.courseProgresses.length > 0 ? (
                  stats.courseProgresses.map((cp: any) => {
                    const courseXPItem = xpSummary?.courses?.find((cx: any) => cx.courseId === cp.id);
                    const courseXPVal = courseXPItem?.xp || 0;
                    
                    return (
                      <div key={cp.id} className="p-5 bg-white border border-slate-100 rounded-3xl hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                              {cp.title}
                            </h4>
                            <p className="text-xs text-slate-400 font-bold">{cp.subject || "عام"} • {cp.completedLessonsCount} / {cp.totalLessons} {language === 'ar' ? 'دروس منجزة' : 'lessons completed'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 justify-between md:justify-end">
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">{language === 'ar' ? 'التقدم' : 'Progress'}</span>
                            <span className="text-sm font-black text-slate-800">{cp.progressPercent}%</span>
                          </div>
                          <div className="w-px h-8 bg-slate-100" />
                          <div className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl font-black text-sm shrink-0">
                            ⭐ {courseXPVal} XP
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold text-sm">{language === 'ar' ? 'لم تنضم لأي كورسات دراسية حتى الآن' : 'No courses enrolled yet'}</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }
        .premium-gradient-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
        }
        .glass {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
        }
        `
      }} />
    </DashboardLayout>
  );
}
