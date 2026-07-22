"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Search, Book, ArrowUpRight, BookOpen, Layers, Edit2, Trash2, Monitor, GraduationCap, Sparkles, Filter, FileSpreadsheet, DownloadCloud, FileCode, Upload } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL, getFullImageUrl } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ImportExcelModal from "@/components/modals/ImportExcelModal";

export default function SuperAdminCoursesPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mergingCloud, setMergingCloud] = useState(false); // silent background cloud merge
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [apiStats, setApiStats] = useState({ totalCourses: 0, totalLessons: 0, totalSubjects: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Fetch courses and stats immediately on mount (no debounce delay on first load)
  useEffect(() => {
    fetchCourses(true);
    fetchStats();

    // ⚡ Silent background refresh after 3s — by then the Backup DB cache is warm
    // and the second fetch will include cloud-only courses + update 'local' badges to 'both'
    // This runs WITHOUT any loading spinner so the user sees local courses immediately
    const cloudRefreshTimer = setTimeout(() => {
      silentCloudMerge();
    }, 3000);

    return () => clearTimeout(cloudRefreshTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Skip the first render — already fetched via the mount effect above
    if (debouncedSearch === '' && page === 1) return;
    fetchCourses(page === 1);
  }, [debouncedSearch, page]);

  useEffect(() => {
    // Skip on initial mount (already called above)
    if (debouncedSearch === '') return;
    fetchStats();
  }, [debouncedSearch]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem("super_admin_token");
      const url = new URL(`${API_URL}/courses/stats`);
      if (debouncedSearch) {
        url.searchParams.append("search", debouncedSearch);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setApiStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCourses = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const token = localStorage.getItem("super_admin_token");
      const url = new URL(`${API_URL}/courses`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", "12");
      if (debouncedSearch) {
        url.searchParams.append("search", debouncedSearch);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      const newCourses = data.courses || [];
      if (reset) {
        setCourses(newCourses);
      } else {
        setCourses(prev => [...prev, ...newCourses]);
      }

      if (data.pagination) {
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (e) {
      console.error(e);
      showToast(t('coursesPage.errorLoading') || "Error loading courses", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ⚡ Silent background cloud merge — runs 3s after initial load
  // Fetches courses again (Backup DB cache is now warm) and merges cloud data
  // WITHOUT showing any loading spinner or removing existing courses
  const silentCloudMerge = async () => {
    try {
      setMergingCloud(true);
      const token = localStorage.getItem("super_admin_token");
      const url = new URL(`${API_URL}/courses`);
      url.searchParams.append("page", "1");
      url.searchParams.append("limit", "12");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const freshCourses: any[] = data.courses || [];

      // Merge: update existing badges + add any cloud-only courses
      setCourses(prev => {
        const existingMap = new Map(prev.map((c: any) => [c.id, c]));
        for (const fc of freshCourses) {
          if (fc?.id) {
            if (existingMap.has(fc.id)) {
              // Update _source badge (e.g. 'local' → 'both')
              const existing = existingMap.get(fc.id);
              if (existing._source !== fc._source) {
                existingMap.set(fc.id, { ...existing, _source: fc._source });
              }
            } else {
              // New cloud-only course — add it
              existingMap.set(fc.id, fc);
            }
          }
        }
        const mergedList = Array.from(existingMap.values());
        // Sort: local and 'both' first, 'cloud' only at the end
        return mergedList.sort((a: any, b: any) => {
          if (a._source === 'cloud' && b._source !== 'cloud') return 1;
          if (a._source !== 'cloud' && b._source === 'cloud') return -1;
          return 0; // maintain original order otherwise
        });
      });
    } catch (e) {
      // Silent fail — don't show error toast for background refresh
      console.warn('[Cloud Merge] Background refresh failed silently:', e);
    } finally {
      setMergingCloud(false);
    }
  };

  const getGradeName = (grade: string) => {
    if (language === 'ar') {
      const translations: { [key: string]: string } = {
        "Elementary": "المرحلة الابتدائية",
        "Middle School": "المرحلة الإعدادية",
        "High School": "المرحلة الثانوية",
        "الصف الأول الابتدائي": "المرحلة الابتدائية",
        "الصف الثاني الابتدائي": "المرحلة الابتدائية",
        "الصف الثالث الابتدائي": "المرحلة الابتدائية",
        "الصف الرابع الابتدائي": "المرحلة الابتدائية",
        "الصف الخامس الابتدائي": "المرحلة الابتدائية",
        "الصف السادس الابتدائي": "المرحلة الابتدائية",
        "الصف الأول الإعدادي": "المرحلة الإعدادية",
        "الصف الثاني الإعدادي": "المرحلة الإعدادية",
        "الصف الثالث الإعدادي": "المرحلة الإعدادية",
        "الصف الأول الثانوي": "المرحلة الثانوية",
        "الصف الثاني الثانوي": "المرحلة الثانوية",
        "الصف الثالث الثانوي": "المرحلة الثانوية"
      };
      return translations[grade] || grade;
    }
    const translations: { [key: string]: string } = {
      "Elementary": "Elementary",
      "Middle School": "Middle School",
      "High School": "High School",
      "الصف الأول الابتدائي": "Elementary",
      "الصف الثاني الابتدائي": "Elementary",
      "الصف الثالث الابتدائي": "Elementary",
      "الصف الرابع الابتدائي": "Elementary",
      "الصف الخامس الابتدائي": "Elementary",
      "الصف السادس الابتدائي": "Elementary",
      "الصف الأول الإعدادي": "Middle School",
      "الصف الثاني الإعدادي": "Middle School",
      "الصف الثالث الإعدادي": "Middle School",
      "الصف الأول الثانوي": "High School",
      "الصف الثاني الثانوي": "High School",
      "الصف الثالث الثانوي": "High School"
    };
    return translations[grade] || grade;
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('coursesPage.deleteConfirm'))) return;
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/school/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast(t('coursesPage.deleteSuccess'), "success");
        setCourses(prev => prev.filter(c => c.id !== id));
        setApiStats(prev => ({ ...prev, totalCourses: prev.totalCourses - 1 }));
      } else {
        showToast(t('coursesPage.deleteFail'), "error");
      }
    } catch (e) {
      showToast(t('coursesPage.deleteFail'), "error");
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const formData = new FormData();
      formData.append("file", file);

      showToast(language === "ar" ? "جاري استعادة الكورس من ملف JSON..." : "Restoring course from JSON...", "info");
      const res = await fetch(`${API_URL}/school/import/json/course`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import JSON");

      showToast(data.message || (language === "ar" ? "تمت استعادة الكورس بنجاح" : "Course restored successfully"), "success");
      fetchCourses(true);
      fetchStats();
    } catch (err: any) {
      showToast(err.message || (language === "ar" ? "فشل استعادة الكورس من ملف JSON" : "Failed to restore course"), "error");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const stats = React.useMemo(() => ({
    total: apiStats.totalCourses,
    lessons: apiStats.totalLessons,
    subjects: apiStats.totalSubjects
  }), [apiStats]);

  const filteredCourses = courses;

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Header Section */}
          <div className="relative bg-white rounded-[20px] sm:rounded-[50px] p-4 sm:p-12 overflow-hidden shadow-sm border border-slate-100">
             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
                <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-8 ${language === 'ar' ? 'text-right sm:items-start' : 'text-left sm:items-start'}`}>
                   <div className="w-12 h-12 sm:w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl sm:rounded-[35px] flex items-center justify-center shadow-xl sm:shadow-2xl shadow-indigo-500/20 transform -rotate-3 hover:rotate-0 transition-all duration-500 shrink-0">
                      <Sparkles className="w-6 h-6 sm:w-12 h-12 text-white" />
                   </div>
                   <div>
                      <h1 className="text-lg sm:text-4xl font-black text-slate-900 mb-1 sm:mb-3 tracking-tight">{t('coursesPage.title')}</h1>
                      <p className="text-slate-500 text-[10px] sm:text-lg font-medium max-w-xl leading-relaxed opacity-80">
                         {t('coursesPage.subtitle')}
                      </p>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={jsonInputRef}
                    onChange={handleImportJson}
                    accept=".json,application/json"
                    className="hidden"
                  />
                  <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="group bg-indigo-50 text-indigo-600 px-6 sm:px-8 py-3 sm:py-5 rounded-xl sm:rounded-[22px] font-black text-xs sm:text-xl shadow-sm hover:scale-105 transition-all flex items-center gap-2 sm:gap-4 justify-center"
                  >
                    <FileSpreadsheet className="w-4 h-4 sm:w-6 h-6" />
                    {language === 'ar' ? "استيراد Excel" : "Import Excel"}
                  </button>
                  <button 
                    onClick={() => jsonInputRef.current?.click()}
                    className="group bg-emerald-50 text-emerald-600 px-6 sm:px-8 py-3 sm:py-5 rounded-xl sm:rounded-[22px] font-black text-xs sm:text-xl shadow-sm hover:scale-105 transition-all flex items-center gap-2 sm:gap-4 justify-center"
                  >
                    <Upload className="w-4 h-4 sm:w-6 h-6" />
                    {language === 'ar' ? "استعادة JSON" : "Restore JSON"}
                  </button>
                  <Link 
                    href="/super-admin/courses/create"
                    className="group bg-slate-900 text-white px-6 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-[22px] font-black text-xs sm:text-xl shadow-xl shadow-slate-900/10 hover:scale-105 transition-all flex items-center gap-2 sm:gap-4 justify-center"
                  >
                    <Plus className="w-4 h-4 sm:w-6 h-6 group-hover:rotate-90 transition-transform" />
                    {t('coursesPage.createCurriculum')}
                  </Link>
                </div>
             </div>
             
             {/* Decorative elements */}
             <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/5 blur-[120px] rounded-full -mr-20"></div>
          </div>

          {/* Stats & Filters */}
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 items-center justify-between">
             <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 w-full xl:w-auto">
                 {[
                   { label: t('coursesPage.totalCurricula'), value: stats.total, icon: Layers, color: "blue" },
                   { label: t('coursesPage.lessons'), value: stats.lessons, icon: Monitor, color: "indigo" },
                   { label: t('coursesPage.subjects'), value: stats.subjects, icon: Book, color: "emerald" }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-3 sm:p-5 px-4 sm:px-8 rounded-xl sm:rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-5">
                      <div className={`w-8 h-8 sm:w-12 h-12 rounded-lg sm:rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
                         <stat.icon className="w-4 h-4 sm:w-6 h-6" />
                      </div>
                      <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                         <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                         <p className="text-sm sm:text-xl font-black text-slate-900 leading-tight">
                            {loadingStats ? (
                              <span className="inline-block w-8 h-4 bg-slate-100 animate-pulse rounded"></span>
                            ) : (
                              stat.value
                            )}
                          </p>
                      </div>
                   </div>
                 ))}
             </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                 <div className="relative flex-1 xl:w-96">
                    <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 h-5`} />
                    <input 
                      type="text" 
                      placeholder={language === 'ar' ? "ابحث..." : "Search..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full ${language === 'ar' ? 'pr-9 sm:pr-12 pl-4' : 'pl-9 sm:pl-12 pr-4'} py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 text-[10px] sm:text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all`}
                    />
                 </div>
                 <button className="w-full sm:w-14 h-10 sm:h-14 bg-white border border-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
                    <Filter className="w-4 h-4 sm:w-6 h-6" />
                 </button>
              </div>
          </div>

          {/* Main Grid */}

          {/* ☁️ Subtle cloud sync indicator — shows only during background 3s refresh */}
          {mergingCloud && (
            <div className="flex items-center gap-2 text-xs text-sky-500 font-bold bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-xl w-fit">
              <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              {language === 'ar' ? 'جاري تحديث البيانات السحابية...' : 'Syncing cloud data...'}
            </div>
          )}

          {loading ? (
             <div className="flex flex-col gap-4 sm:gap-6">
                {[1, 2, 3].map((n) => (
                   <div key={n} className="bg-slate-100 animate-pulse rounded-2xl h-32 w-full"></div>
                ))}
             </div>
          ) : filteredCourses.length === 0 ? (
              <div className="bg-white border-2 sm:border-4 border-dashed border-slate-100 rounded-[24px] sm:rounded-[60px] p-8 sm:p-32 text-center">
                 <div className="w-12 h-12 sm:w-24 h-24 bg-slate-50 rounded-xl sm:rounded-[40px] flex items-center justify-center mx-auto mb-4 sm:mb-8">
                    <BookOpen className="w-6 h-6 sm:w-12 h-12 text-slate-200" />
                 </div>
                 <h3 className="text-base sm:text-2xl font-black text-slate-900 mb-2">{t('coursesPage.noCurricula')}</h3>
                 <p className="text-slate-500 font-bold max-w-sm mx-auto mb-6 sm:mb-10 opacity-70 text-[10px] sm:text-base">{t('coursesPage.startByAdding')}</p>
                 <Link href="/super-admin/courses/create" className="bg-indigo-600 text-white px-6 sm:px-10 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-indigo-600/20 inline-block text-[10px] sm:text-base">
                    {t('coursesPage.addCurriculum')}
                 </Link>
              </div>
          ) : (
              <>
                <div className="flex flex-col gap-4 sm:gap-6 pb-10 sm:pb-20">
                   {filteredCourses.map((course) => (
                      <div key={course.id} className="group bg-white rounded-[20px] sm:rounded-[30px] border border-slate-100 p-4 sm:p-6 hover:shadow-3xl hover:shadow-indigo-600/10 transition-all duration-500 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
                        
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-lg sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 overflow-hidden border border-slate-100 shrink-0">
                           {course.coverImage ? (
                              <img src={getFullImageUrl(course.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
                           ) : (
                              <Layers className="w-8 h-8 text-indigo-600" />
                           )}
                        </div>
 
                        <div className={`flex-1 min-w-0 w-full md:w-auto text-center ${language === 'ar' ? 'md:text-right' : 'md:text-left'}`}>
                           <div className={`flex flex-wrap items-center justify-center ${language === 'ar' ? 'md:justify-start' : 'md:justify-end'} gap-2 mb-2`}>
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-widest shrink-0">{course.subject || (language === 'ar' ? "عام" : "General")}</span>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-widest shrink-0">{getGradeName(course.grade) || (language === 'ar' ? "عام" : "General")}</span>
                              {course._source === 'both' ? (
                                <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1 shadow-xs">
                                  ⚡ {language === 'ar' ? 'الاثنين (الأساسية + الاحتياطية)' : 'Both (Primary + Backup DB)'}
                                </span>
                              ) : course._source === 'cloud' ? (
                                <span className="text-[10px] font-black text-sky-700 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1 shadow-xs">
                                  ☁️ {language === 'ar' ? 'الاحتياطية فقط' : 'Backup DB Only'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1">
                                  🖥️ {language === 'ar' ? 'الأساسية فقط (PostgreSQL)' : 'Primary DB Only'}
                                </span>
                              )}
                           </div>
                           <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1.5 truncate">{course.title}</h3>
                           <p className="text-slate-400 text-xs sm:text-sm font-bold line-clamp-1">{course.description || (language === 'ar' ? "منهج تعليمي مركزي." : "Central curriculum.")}</p>
                        </div>
 
                        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t border-slate-50 md:border-none pt-4 md:pt-0">
                           <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                 <Monitor className="w-4 h-4 text-indigo-400" />
                                 <span className="hidden sm:inline">{language === 'ar' ? "درس" : "lesson(s)"}</span> {course._count?.lessons || 0}
                              </div>
                              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                 <GraduationCap className="w-4 h-4 text-blue-400" />
                                 <span className="hidden sm:inline">{language === 'ar' ? "طالب" : "student(s)"}</span> {course._count?.enrollments || 0}
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
                                    const res = await fetch(`${API_URL}/school/export/course/${course.id}`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (!res.ok) throw new Error("Failed to export course");
                                    
                                    const blob = await res.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `course_${course.id}_export.xlsx`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                  } catch (err) {
                                    showToast("Failed to export course", "error");
                                  }
                                }}
                                title={language === 'ar' ? 'تصدير الكورس كملف إكسيل' : 'Export Course to Excel'}
                                className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              >
                                 <DownloadCloud className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
                                    const res = await fetch(`${API_URL}/school/export/json/course/${course.id}`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (!res.ok) throw new Error("Failed to export JSON");
                                    
                                    const blob = await res.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `course_${course.id}_backup.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                    showToast(language === 'ar' ? "تم تصدير نسخة JSON بنجاح" : "Exported JSON successfully", "success");
                                  } catch (err) {
                                    showToast(language === 'ar' ? "فشل تصدير نسخة JSON" : "Failed to export JSON backup", "error");
                                  }
                                }}
                                title={language === 'ar' ? 'تصدير نسخة JSON احتياطية' : 'Export Course JSON Backup'}
                                className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              >
                                 <FileCode className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => router.push(`/super-admin/courses/edit?id=${course.id}`)}
                                className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              >
                                 <Edit2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(course.id)}
                                className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
 
                         {/* Decoration */}
                         <div className="absolute -bottom-12 -left-12 w-32 h-32 text-slate-50 group-hover:text-indigo-50/50 transition-colors duration-500 -rotate-12 pointer-events-none">
                            <Book className="w-full h-full" />
                         </div>
                      </div>
                   ))}
                </div>
   
                {hasMore && (
                  <div className="flex justify-center pb-10 sm:pb-20">
                     <button 
                       onClick={() => setPage(prev => prev + 1)}
                       disabled={loadingMore}
                       className="group bg-white border-2 border-slate-100 text-slate-600 px-10 py-4 rounded-[22px] font-black hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-3 shadow-sm disabled:opacity-50 hover:shadow-xl hover:shadow-indigo-600/10"
                     >
                       {loadingMore ? (
                          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <>
                           <span>{t('coursesPage.loadMore')}</span>
                           <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                         </>
                       )}
                     </button>
                  </div>
                )}
              </>
          )}

      </div>
      <ImportExcelModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => {
          fetchCourses(true);
          fetchStats();
        }} 
      />
    </DashboardLayout>
  );
}
