"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Plus, Search, Book, ArrowUpRight,
  BookOpen, Layers, Edit2,
  Trash2, Monitor, GraduationCap,
  Sparkles, Filter
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL, getFullImageUrl } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

export default function SuperAdminCoursesPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [apiStats, setApiStats] = useState({ totalCourses: 0, totalLessons: 0, totalSubjects: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCourses(page === 1);
  }, [debouncedSearch, page]);

  useEffect(() => {
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
      showToast("خطأ في تحميل الكورسات", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الكورس المركزي؟")) return;
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/super/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("تم حذف الكورس بنجاح", "success");
        setCourses(prev => prev.filter(c => c.id !== id));
        setApiStats(prev => ({ ...prev, totalCourses: prev.totalCourses - 1 }));
      }
    } catch (e) {
      showToast("حدث خطأ أثناء الحذف", "error");
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
      <div className="space-y-6 sm:space-y-10" dir="rtl">
          
          {/* Header Section */}
          <div className="relative bg-white rounded-[20px] sm:rounded-[50px] p-4 sm:p-12 overflow-hidden shadow-sm border border-slate-100">
             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 text-center sm:text-right">
                   <div className="w-12 h-12 sm:w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl sm:rounded-[35px] flex items-center justify-center shadow-xl sm:shadow-2xl shadow-indigo-500/20 transform -rotate-3 hover:rotate-0 transition-all duration-500 shrink-0">
                      <Sparkles className="w-6 h-6 sm:w-12 h-12 text-white" />
                   </div>
                   <div>
                      <h1 className="text-lg sm:text-4xl font-black text-slate-900 mb-1 sm:mb-3 tracking-tight">إدارة المناهج المركزية</h1>
                      <p className="text-slate-500 text-[10px] sm:text-lg font-medium max-w-xl leading-relaxed opacity-80">
                         نظام إدارة المحتوى المركزي لبناء وتوزيع المناهج التعليمية الموحدة.
                      </p>
                   </div>
                </div>

                <Link 
                  href="/super-admin/courses/create"
                  className="group bg-slate-900 text-white px-6 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-[22px] font-black text-xs sm:text-xl shadow-xl shadow-slate-900/10 hover:scale-105 transition-all flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4 sm:w-6 h-6 group-hover:rotate-90 transition-transform" />
                  إنشاء منهج جديد
                </Link>
             </div>
             
             {/* Decorative elements */}
             <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/5 blur-[120px] rounded-full -mr-20"></div>
          </div>

          {/* Stats & Filters */}
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 items-center justify-between">
             <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 w-full xl:w-auto">
                 {[
                   { label: "إجمالي المناهج", value: stats.total, icon: Layers, color: "blue" },
                   { label: "الدروس", value: stats.lessons, icon: Monitor, color: "indigo" },
                   { label: "المواد", value: stats.subjects, icon: Book, color: "emerald" }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-3 sm:p-5 px-4 sm:px-8 rounded-xl sm:rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-5">
                      <div className={`w-8 h-8 sm:w-12 h-12 rounded-lg sm:rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
                         <stat.icon className="w-4 h-4 sm:w-6 h-6" />
                      </div>
                      <div>
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
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="ابحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-9 sm:pr-12 pl-4 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 text-[10px] sm:text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                    />
                 </div>
                 <button className="w-full sm:w-14 h-10 sm:h-14 bg-white border border-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
                    <Filter className="w-4 h-4 sm:w-6 h-6" />
                 </button>
              </div>
          </div>

          {/* Main Grid */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {[1,2,3].map(i => (
                   <div key={i} className="bg-white h-72 rounded-[24px] sm:rounded-[40px] border border-slate-100 animate-pulse"></div>
                ))}
             </div>
          ) : filteredCourses.length === 0 ? (
              <div className="bg-white border-2 sm:border-4 border-dashed border-slate-100 rounded-[24px] sm:rounded-[60px] p-8 sm:p-32 text-center">
                 <div className="w-12 h-12 sm:w-24 h-24 bg-slate-50 rounded-xl sm:rounded-[40px] flex items-center justify-center mx-auto mb-4 sm:mb-8">
                    <BookOpen className="w-6 h-6 sm:w-12 h-12 text-slate-200" />
                 </div>
                 <h3 className="text-base sm:text-2xl font-black text-slate-900 mb-2">لا توجد مناهج</h3>
                 <p className="text-slate-500 font-bold max-w-sm mx-auto mb-6 sm:mb-10 opacity-70 text-[10px] sm:text-base">ابدأ بإضافة أول منهج تعليمي مركزي.</p>
                 <Link href="/super-admin/courses/create" className="bg-indigo-600 text-white px-6 sm:px-10 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-indigo-600/20 inline-block text-[10px] sm:text-base">
                    إضافة منهج
                 </Link>
              </div>
          ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 pb-10 sm:pb-20">
                   {filteredCourses.map((course) => (
                      <div key={course.id} className="group bg-white rounded-[20px] sm:rounded-[40px] border border-slate-100 p-4 sm:p-8 hover:shadow-3xl hover:shadow-indigo-600/10 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right"></div>
                        
                        <div className="flex justify-between items-start mb-4 sm:mb-8">
                           <div className="w-10 h-10 sm:w-16 h-16 bg-indigo-50 rounded-lg sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 overflow-hidden border border-slate-100 shrink-0">
                              {course.coverImage ? (
                                 <img src={getFullImageUrl(course.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
                              ) : (
                                 <Layers className="w-5 h-5 sm:w-8 h-8 text-indigo-600" />
                              )}
                           </div>
                           <div className="flex gap-1 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button 
                                onClick={() => router.push(`/super-admin/courses/edit?id=${course.id}`)}
                                className="w-7 h-7 sm:w-10 h-10 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              >
                                 <Edit2 className="w-3.5 h-3.5 sm:w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(course.id)}
                                className="w-7 h-7 sm:w-10 h-10 bg-red-50 text-red-600 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              >
                                 <Trash2 className="w-3.5 h-3.5 sm:w-5 h-5" />
                              </button>
                           </div>
                        </div>
  
                         <div className="mb-4 sm:mb-10">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-1.5 sm:mb-3">
                               <span className="text-[7px] sm:text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md uppercase tracking-widest shrink-0">{course.subject || "عام"}</span>
                               <span className="text-[7px] sm:text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md uppercase tracking-widest shrink-0">{course.grade || "عام"}</span>
                            </div>
                            <h3 className="text-sm sm:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1 sm:mb-3 truncate">{course.title}</h3>
                            <p className="text-slate-400 text-[9px] sm:text-sm font-bold line-clamp-2 leading-relaxed">{course.description || "منهج تعليمي مركزي."}</p>
                         </div>
  
                         <div className="pt-4 sm:pt-8 border-t border-slate-50 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-5 text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               <div className="flex items-center gap-1 sm:gap-2">
                                  <Monitor className="w-3 h-3 sm:w-4 h-4 text-indigo-400" />
                                  {course._count?.lessons || 0} د
                               </div>
                               <div className="flex items-center gap-1 sm:gap-2">
                                  <GraduationCap className="w-3 h-3 sm:w-4 h-4 text-blue-400" />
                                  {course._count?.enrollments || 0} ط
                               </div>
                            </div>
                            <button 
                              onClick={() => router.push(`/super-admin/courses/edit?id=${course.id}`)}
                              className="w-7 h-7 sm:w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shrink-0"
                            >
                               <ArrowUpRight className="w-3.5 h-3.5 sm:w-5 h-5" />
                            </button>
                         </div>
  
                         {/* Decoration */}
                         <div className="absolute -bottom-12 -right-12 w-32 h-32 text-slate-50 group-hover:text-indigo-50/50 transition-colors duration-500 -rotate-12">
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
                           <span>عرض المزيد من المناهج</span>
                           <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                         </>
                       )}
                     </button>
                  </div>
                )}
              </>
          )}

      </div>
    </DashboardLayout>
  );
}
