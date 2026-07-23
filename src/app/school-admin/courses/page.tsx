"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Video, Plus, Search, Layers, Edit2, Trash2, Monitor, HelpCircle, FileText, ChevronLeft, Settings, Layout, Target, CheckCircle2, X, Save, ArrowRight, Activity, Calendar, Download, MoreVertical, GraduationCap, ArrowUpRight } from 'lucide-react';
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SchoolAdminCoursesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { showToast } = useNotification();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("school_admin_user");
    const token = localStorage.getItem("school_admin_token");
    
    if (userData && token) {
      const parsed = JSON.parse(userData);
      setSchoolId(parsed.schoolId);
      fetchCourses(token, parsed.schoolId);
    } else {
      router.push("/school-admin/login");
    }
  }, []);

  const fetchCourses = async (token: string, sId: string) => {
    try {
      const res = await fetch(`${API_URL}/courses?schoolId=${sId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : (data.courses || []));
      }
    } catch (error) {
      console.error("Failed to fetch courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm(t('schoolAdmin.classesPage.deleteConfirmMsg'))) return;
    const token = localStorage.getItem("school_admin_token");
    try {
      const res = await fetch(`${API_URL}/school/courses/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(t('schoolAdmin.teachersPage.deleteSuccess'), "success");
        setCourses(prev => prev.filter(c => c.id !== id));
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || t('schoolAdmin.teachersPage.connError'), "error");
      }
    } catch (error) {
      showToast(t('schoolAdmin.teachersPage.connError'), "error");
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subject && c.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8fafc] -mt-6 -mx-6 p-4 md:p-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <main className="max-w-[1600px] mx-auto">
          
          {/* Top Header Section */}
          <div className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2 text-sm">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                {t('schoolAdmin.sidebar.courses')}
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">{t('schoolAdmin.coursesPage.title')}</h1>
              <p className="text-slate-500 font-medium opacity-80">{t('schoolAdmin.coursesPage.subtitle')}</p>
            </div>
            
            <button 
              onClick={() => router.push('/school-admin/courses/create')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-6 h-6" />
              {t('schoolAdmin.coursesPage.createCourse')}
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                   <BookOpen className="w-8 h-8" />
                </div>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                   <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{t('schoolAdmin.coursesPage.totalCourses')}</p>
                   <h3 className="text-2xl font-black text-slate-900">{t('schoolAdmin.coursesPage.lessonsCount').replace('{n}', String(courses.length))}</h3>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                   <Monitor className="w-8 h-8" />
                </div>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                   <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{t('schoolAdmin.coursesPage.totalLessons')}</p>
                   <h3 className="text-2xl font-black text-slate-900">{t('schoolAdmin.coursesPage.lessonsCount').replace('{n}', String(courses.reduce((acc, c) => acc + (c._count?.lessons || 0), 0)))}</h3>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                   <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                   <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{t('schoolAdmin.coursesPage.activeContent')}</p>
                   <h3 className="text-2xl font-black text-slate-900">100%</h3>
                </div>
             </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:w-96">
                <input 
                  type="text" 
                  placeholder={t('schoolAdmin.coursesPage.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                  }`}
                />
                <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 ${
                  language === 'ar' ? 'right-4' : 'left-4'
                }`} />
             </div>
             <div className="flex gap-2">
                <button className="px-5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-black hover:bg-slate-100 transition-all">{t('schoolAdmin.coursesPage.latestFirst')}</button>
                <button className="px-5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-black hover:bg-slate-100 transition-all">{t('schoolAdmin.coursesPage.alphabetical')}</button>
             </div>
          </div>

          {/* Courses Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1,2,3].map(i => (
                 <div key={i} className="bg-white h-64 rounded-[40px] border border-slate-100 animate-pulse"></div>
               ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white border-4 border-dashed border-slate-100 rounded-[50px] p-24 text-center">
               <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                  <Layout className="w-12 h-12 text-slate-200" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-3">{t('schoolAdmin.coursesPage.noCourses')}</h3>
               <p className="text-slate-500 font-bold max-w-sm mx-auto mb-8 opacity-70">{t('schoolAdmin.coursesPage.noCoursesDesc')}</p>
               <button 
                 onClick={() => router.push('/school-admin/courses/create')}
                 className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20"
               >
                 {t('schoolAdmin.coursesPage.addFirstCourse')}
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {filteredCourses.map((course) => (
                 <div key={course.id} className="bg-white rounded-[40px] border border-slate-100 p-8 hover:border-indigo-500/50 transition-all group shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-all">
                          <BookOpen className="w-8 h-8" />
                       </div>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => router.push(`/school-admin/courses/edit?id=${course.id}`)}
                           className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-slate-100"
                         >
                           <Edit2 className="w-5 h-5" />
                         </button>
                         <button 
                           onClick={() => handleDeleteCourse(course.id)}
                           className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-slate-100"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                       </div>
                    </div>

                    <div className={`mb-8 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                       <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{course.subject || "عام"}</span>
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{course.grade || "مرحلة تعليمية"}</span>
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{course.title}</h3>
                       <p className="text-slate-500 text-sm font-bold mt-2 line-clamp-2 opacity-70">{course.description || "لا يوجد وصف متاح لهذا الكورس التعليمي."}</p>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-xl">
                           <GraduationCap className="w-4 h-4" />
                           {t('schoolAdmin.coursesPage.studentsEnrolled').replace('{n}', String(course._count?.enrollments || 0))}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-black text-slate-400">
                           <div className="flex items-center gap-1.5"><Monitor className="w-4 h-4" /> {t('schoolAdmin.coursesPage.lessonsCount').replace('{n}', String(course._count?.lessons || 0))}</div>
                        </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

        </main>
      </div>
    </DashboardLayout>
  );
}
