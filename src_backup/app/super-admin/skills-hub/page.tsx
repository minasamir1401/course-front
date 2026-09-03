"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Search, Book, ArrowUpRight, BookOpen, Layers, Edit2, Trash2, Monitor, GraduationCap, Sparkles, Filter, BrainCircuit } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL, getFullImageUrl } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SuperAdminSkillsHubPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Stats
  const [apiStats, setApiStats] = useState({ totalClusters: 0, totalLessons: 0, totalSubjects: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchClusters();
  }, [debouncedSearch]);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("super_admin_token");
      const url = new URL(`${API_URL}/skills-hub/clusters`);
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 400 || res.status === 401) {
        localStorage.removeItem("super_admin_token");
        router.push("/super-admin/login");
        return;
      }

      const data = await res.json();
      let filtered = Array.isArray(data) ? data : [];
      if (debouncedSearch) {
        filtered = filtered.filter((c: any) => 
          c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
          c.subject?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }

      setClusters(filtered);

      // Calculate stats locally since API returns all
      const uniqueSubjects = new Set(filtered.map((c: any) => c.subject)).size;
      const totalLessons = filtered.reduce((acc: number, c: any) => acc + (c._count?.skills || 0), 0);
      
      setApiStats({
        totalClusters: filtered.length,
        totalLessons,
        totalSubjects: uniqueSubjects
      });

    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "فشل تحميل المحاور المهاراتية" : "Error loading skill clusters", "error");
    } finally {
      setLoading(false);
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
    if (!window.confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا المحور بالكامل؟" : "Are you sure you want to delete this cluster?")) return;
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/clusters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast(language === 'ar' ? "تم الحذف بنجاح" : "Deleted successfully", "success");
        setClusters(prev => prev.filter(c => c.id !== id));
        fetchClusters();
      } else {
        showToast(language === 'ar' ? "فشل الحذف" : "Delete failed", "error");
      }
    } catch (e) {
      showToast(language === 'ar' ? "فشل الحذف" : "Delete failed", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Header Section */}
          <div className="relative bg-white rounded-[20px] sm:rounded-[50px] p-4 sm:p-12 overflow-hidden shadow-sm border border-slate-100">
             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
                <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-8 ${language === 'ar' ? 'text-right sm:items-start' : 'text-left sm:items-start'}`}>
                   <div className="w-12 h-12 sm:w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-[35px] flex items-center justify-center shadow-xl sm:shadow-2xl shadow-amber-500/20 transform -rotate-3 hover:rotate-0 transition-all duration-500 shrink-0">
                      <BrainCircuit className="w-6 h-6 sm:w-12 h-12 text-white" />
                   </div>
                   <div>
                      <h1 className="text-lg sm:text-4xl font-black text-slate-900 mb-1 sm:mb-3 tracking-tight">
                         {language === 'ar' ? "المهارات التفاعلية" : "Interactive Skills Hub"}
                      </h1>
                      <p className="text-slate-500 text-[10px] sm:text-lg font-medium max-w-xl leading-relaxed opacity-80">
                         {language === 'ar' ? "إدارة المحاور المهاراتية، الدروس، والأنشطة التفاعلية." : "Manage skill clusters, lessons, and interactive activities."}
                      </p>
                   </div>
                </div>

                <Link 
                  href="/super-admin/skills-hub/create"
                  className="group bg-slate-900 text-white px-6 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-[22px] font-black text-xs sm:text-xl shadow-xl shadow-slate-900/10 hover:scale-105 transition-all flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4 sm:w-6 h-6 group-hover:rotate-90 transition-transform" />
                  {language === 'ar' ? "إنشاء محور مهاراتي" : "Create Skill Cluster"}
                </Link>
             </div>
             
             {/* Decorative elements */}
             <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-500/5 blur-[120px] rounded-full -mr-20"></div>
          </div>

          {/* Stats & Filters */}
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 items-center justify-between">
             <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 w-full xl:w-auto">
                 {[
                   { label: language === 'ar' ? "المحاور المهاراتية" : "Skill Clusters", value: apiStats.totalClusters, icon: Layers, color: "orange" },
                   { label: language === 'ar' ? "المهارات الفرعية" : "Skill Lessons", value: apiStats.totalLessons, icon: Monitor, color: "amber" },
                   { label: language === 'ar' ? "المواد الدراسية" : "Subjects", value: apiStats.totalSubjects, icon: Book, color: "emerald" }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-3 sm:p-5 px-4 sm:px-8 rounded-xl sm:rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-5">
                      <div className={`w-8 h-8 sm:w-12 h-12 rounded-lg sm:rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
                         <stat.icon className="w-4 h-4 sm:w-6 h-6" />
                      </div>
                      <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                         <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                         <p className="text-sm sm:text-xl font-black text-slate-900 leading-tight">
                            {loading ? (
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
                      placeholder={language === 'ar' ? "ابحث عن محور مهاراتي..." : "Search clusters..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full ${language === 'ar' ? 'pr-9 sm:pr-12 pl-4' : 'pl-9 sm:pl-12 pr-4'} py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 text-[10px] sm:text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-600/5 transition-all`}
                    />
                 </div>
                 <button className="w-full sm:w-14 h-10 sm:h-14 bg-white border border-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
                    <Filter className="w-4 h-4 sm:w-6 h-6" />
                 </button>
              </div>
          </div>

          {/* Main Grid */}
          {loading ? (
             <div className="flex flex-col gap-4 sm:gap-6">
                {[1, 2, 3].map((n) => (
                   <div key={n} className="bg-slate-100 animate-pulse rounded-2xl h-32 w-full"></div>
                ))}
             </div>
          ) : clusters.length === 0 ? (
              <div className="bg-white border-2 sm:border-4 border-dashed border-slate-100 rounded-[24px] sm:rounded-[60px] p-8 sm:p-32 text-center">
                 <div className="w-12 h-12 sm:w-24 h-24 bg-slate-50 rounded-xl sm:rounded-[40px] flex items-center justify-center mx-auto mb-4 sm:mb-8">
                    <BrainCircuit className="w-6 h-6 sm:w-12 h-12 text-slate-200" />
                 </div>
                 <h3 className="text-base sm:text-2xl font-black text-slate-900 mb-2">
                   {language === 'ar' ? "لا يوجد محاور مهاراتية" : "No Skill Clusters Found"}
                 </h3>
                 <p className="text-slate-500 font-bold max-w-sm mx-auto mb-6 sm:mb-10 opacity-70 text-[10px] sm:text-base">
                   {language === 'ar' ? "ابدأ بإضافة أول محور مهاراتي لربط الدروس والأنشطة التفاعلية." : "Start by creating a skill cluster to organize lessons and activities."}
                 </p>
                 <Link href="/super-admin/skills-hub/create" className="bg-amber-500 text-white px-6 sm:px-10 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-amber-500/20 inline-block text-[10px] sm:text-base">
                    {language === 'ar' ? "إنشاء محور مهاراتي" : "Create Skill Cluster"}
                 </Link>
              </div>
          ) : (
              <>
                <div className="flex flex-col gap-4 sm:gap-6 pb-10 sm:pb-20">
                   {clusters.map((cluster) => (
                      <div key={cluster.id} className="group bg-white rounded-[20px] sm:rounded-[30px] border border-slate-100 p-4 sm:p-6 hover:shadow-3xl hover:shadow-amber-500/10 transition-all duration-500 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
                        
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-lg sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 overflow-hidden border border-slate-100 shrink-0">
                            <Layers className="w-8 h-8 text-amber-500" />
                        </div>
 
                        <div className={`flex-1 min-w-0 w-full md:w-auto text-center ${language === 'ar' ? 'md:text-right' : 'md:text-left'}`}>
                           <div className={`flex flex-wrap items-center justify-center ${language === 'ar' ? 'md:justify-start' : 'md:justify-end'} gap-2 mb-2`}>
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-widest shrink-0">{cluster.subject || (language === 'ar' ? "عام" : "General")}</span>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-widest shrink-0">{getGradeName(cluster.grade) || (language === 'ar' ? "عام" : "General")}</span>
                           </div>
                           <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-500 transition-colors leading-tight mb-1.5 truncate">{cluster.name}</h3>
                           <p className="text-slate-400 text-xs sm:text-sm font-bold line-clamp-1">{cluster.description || (language === 'ar' ? "محور مهاراتي." : "Skill Cluster.")}</p>
                        </div>
 
                        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t border-slate-50 md:border-none pt-4 md:pt-0">
                           <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                 <Monitor className="w-4 h-4 text-amber-400" />
                                 <span className="hidden sm:inline">{language === 'ar' ? "درس" : "lesson(s)"}</span> {cluster._count?.skills || 0}
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => router.push(`/super-admin/skills-hub/edit?id=${cluster.id}`)}
                                className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              >
                                 <Edit2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(cluster.id)}
                                className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
 
                         {/* Decoration */}
                         <div className="absolute -bottom-12 -left-12 w-32 h-32 text-slate-50 group-hover:text-amber-50/50 transition-colors duration-500 -rotate-12 pointer-events-none">
                            <BrainCircuit className="w-full h-full" />
                         </div>
                      </div>
                   ))}
                </div>
              </>
          )}
      </div>
    </DashboardLayout>
  );
}
