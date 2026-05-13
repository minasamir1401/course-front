"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Plus, Search, Book, Clock, 
  Building2, Globe, ArrowUpRight,
  Shield, BookOpen, Layers, Edit2,
  Trash2, Monitor, GraduationCap,
  Layout, Sparkles, Filter
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const coursesList = Array.isArray(data) ? data : (data.courses || []);
      setCourses(coursesList);
    } catch (e) {
      console.error(e);
      showToast("خطأ في تحميل الكورسات", "error");
    } finally {
      setLoading(false);
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
      }
    } catch (e) {
      showToast("حدث خطأ أثناء الحذف", "error");
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subject && c.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-10" dir="rtl">
          
          {/* Header Section */}
          <div className="relative bg-white rounded-[50px] p-12 overflow-hidden shadow-sm border border-slate-100">
             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-8">
                   <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-[35px] flex items-center justify-center shadow-2xl shadow-indigo-500/20 transform -rotate-3 hover:rotate-0 transition-all duration-500">
                      <Sparkles className="w-12 h-12 text-white" />
                   </div>
                   <div>
                      <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">إدارة المناهج المركزية</h1>
                      <p className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed opacity-80">
                         نظام إدارة المحتوى المركزي لبناء وتوزيع المناهج التعليمية الموحدة على مستوى المنصة والمدارس التابعة.
                      </p>
                   </div>
                </div>

                <Link 
                  href="/super-admin/courses/create"
                  className="group bg-slate-900 text-white px-12 py-5 rounded-[22px] font-black text-xl shadow-2xl shadow-slate-900/10 hover:scale-105 transition-all flex items-center gap-4"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  إنشاء منهج جديد
                </Link>
             </div>
             
             {/* Decorative elements */}
             <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/5 blur-[120px] rounded-full -mr-20"></div>
             <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-blue-500/5 blur-[100px] rounded-full -ml-10"></div>
          </div>

          {/* Stats & Filters */}
          <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
             <div className="flex gap-4 w-full xl:w-auto overflow-x-auto no-scrollbar pb-2">
                {[
                  { label: "إجمالي المناهج", value: courses.length, icon: Layers, color: "blue" },
                  { label: "الدروس المنشورة", value: courses.reduce((acc, c) => acc + (c.lessons?.length || 0), 0), icon: Monitor, color: "indigo" },
                  { label: "المواد الدراسية", value: [...new Set(courses.map(c => c.subject))].length, icon: Book, color: "emerald" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 px-8 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-5 min-w-[240px]">
                     <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                        <p className="text-xl font-black text-slate-900">{stat.value}</p>
                     </div>
                  </div>
                ))}
             </div>

             <div className="flex gap-4 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-96">
                   <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input 
                     type="text" 
                     placeholder="ابحث عن منهج، مادة، أو مرحلة..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pr-12 pl-6 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                   />
                </div>
                <button className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
                   <Filter className="w-6 h-6" />
                </button>
             </div>
          </div>

          {/* Main Grid */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white h-72 rounded-[40px] border border-slate-100 animate-pulse"></div>
                ))}
             </div>
          ) : filteredCourses.length === 0 ? (
             <div className="bg-white border-4 border-dashed border-slate-100 rounded-[60px] p-32 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                   <BookOpen className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">لا توجد مناهج حتى الآن</h3>
                <p className="text-slate-500 font-bold max-w-sm mx-auto mb-10 opacity-70">المناهج المركزية تساعدك على توحيد جودة التعليم عبر جميع المدارس المشتركة.</p>
                <Link href="/super-admin/courses/create" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 inline-block">
                   ابدأ بإضافة أول منهج
                </Link>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {filteredCourses.map((course) => (
                   <div key={course.id} className="group bg-white rounded-[40px] border border-slate-100 p-8 hover:shadow-3xl hover:shadow-indigo-600/10 transition-all duration-500 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right"></div>
                      
                      <div className="flex justify-between items-start mb-8">
                         <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 overflow-hidden border border-slate-100">
                            {course.coverImage ? (
                               <img src={getFullImageUrl(course.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
                            ) : (
                               <Layers className="w-8 h-8 text-indigo-600" />
                            )}
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
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

                      <div className="mb-10">
                         <div className="flex items-center gap-3 mb-3">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{course.subject || "عام"}</span>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest">{course.grade || "كل المراحل"}</span>
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-3">{course.title}</h3>
                         <p className="text-slate-400 text-sm font-bold line-clamp-2 leading-relaxed">{course.description || "منهج تعليمي مركزي مصمم لتحقيق أعلى معايير الجودة التعليمية."}</p>
                      </div>

                      <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                               <Monitor className="w-4 h-4 text-indigo-400" />
                               {course._count?.lessons || 0} درس
                            </div>
                            <div className="flex items-center gap-2">
                               <GraduationCap className="w-4 h-4 text-blue-400" />
                               {course._count?.enrollments || 0} طالب
                            </div>
                         </div>
                         <button 
                           onClick={() => router.push(`/super-admin/courses/edit?id=${course.id}`)}
                           className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shadow-sm"
                         >
                            <ArrowUpRight className="w-5 h-5" />
                         </button>
                      </div>

                      {/* Decoration */}
                      <div className="absolute -bottom-12 -right-12 w-32 h-32 text-slate-50 group-hover:text-indigo-50/50 transition-colors duration-500 -rotate-12">
                         <Book className="w-full h-full" />
                      </div>
                   </div>
                ))}
             </div>
          )}

      </div>
    </DashboardLayout>
  );
}
