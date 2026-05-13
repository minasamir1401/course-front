"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ClipboardList, Plus, Search, Filter, Clock, BookOpen, CheckCircle2, Globe, Building2, GraduationCap, ChevronLeft, MoreVertical, FileEdit, BarChart3, Tag, Calendar, Lock, Trash2, RefreshCw, Hash } from "lucide-react";
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";
import { API_URL } from "@/lib/api";

export default function ExamsListPage() {
  const { showToast, confirm } = useNotification();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchExams();
  }, []);

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("school_admin_token");
      const user = JSON.parse(localStorage.getItem("school_admin_user") || "{}");
      
      let url = `${API_URL}/exams?schoolId=${user.schoolId}`;
      if (filterType !== "all") {
        url += `&grade=${filterType}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setExams(data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      "تأكيد الحذف",
      "هل أنت متأكد من حذف هذا الامتحان؟ سيتم حذف جميع النتائج المرتبطة به نهائياً."
    );
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/exams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("تم حذف الامتحان بنجاح", "success");
        setExams(exams.filter(e => e.id !== id));
      } else {
        showToast("خطأ في حذف الامتحان", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("حدث خطأ غير متوقع", "error");
    }
  };

  const handleUpdateAttempts = async (examId: string, currentAttempts: number) => {
    const nextAttempts = currentAttempts === 1 ? 2 : currentAttempts === 2 ? 3 : currentAttempts === 3 ? 999 : 1;
    try {
      const token = localStorage.getItem("school_admin_token");
      const exam = exams.find(e => e.id === examId);
      if (!exam) return;
      const res = await fetch(`${API_URL}/exams/${examId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...exam, attemptsAllowed: nextAttempts, questions: exam.questions || [] })
      });
      if (res.ok) {
        setExams(exams.map(e => e.id === examId ? { ...e, attemptsAllowed: nextAttempts } : e));
        showToast(`تم تغيير المحاولات إلى ${nextAttempts === 999 ? 'غير محدود' : nextAttempts}`, 'success');
      } else {
        showToast('فشل تحديث المحاولات', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال', 'error');
    }
  };

  const formatAttempts = (n: number) => n >= 999 ? '∞' : String(n);

  useEffect(() => {
    fetchExams();
  }, [filterType]);

  const filteredExams = exams.filter((exam: any) => {
    return exam.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 rtl" dir="rtl">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 gap-6 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-sm">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">إدارة الامتحانات</h2>
              <p className="text-slate-500 font-medium opacity-80">تحكم في التقييمات، تابع النتائج، وطوّر مستوى طلابك.</p>
            </div>
          </div>
          
          <Link href="/school-admin/exams/new" className="relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3">
            <Plus className="w-6 h-6" />
            إضافة امتحان جديد
          </Link>

          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[100px] -mr-32 -mt-32"></div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="ابحث في قائمة الامتحانات..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-4 pr-12 py-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-6 h-6 text-slate-300 absolute right-4 top-4" />
          </div>
          
          <div className="flex gap-4">
            <select 
              className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-700 min-w-[200px]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">جميع المراحل</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Exams Table/Grid Layout */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-400 animate-pulse text-lg">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExams.map((exam: any) => (
              <div key={exam.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all group flex flex-col relative overflow-hidden">
                {/* Status Badge */}
                <div className="absolute top-6 left-6 z-10">
                   <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                     exam.status === 'DRAFT' 
                     ? 'bg-amber-50 text-amber-600 border-amber-100' 
                     : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                   }`}>
                     {exam.status === 'DRAFT' ? 'مسودة' : 'منشور'}
                   </div>
                </div>

                <div className="p-8 pt-12 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${exam.isCentral ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      <Tag className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                         {exam.category || (exam.isCentral ? 'مركزي' : 'مدرسي')}
                       </span>
                       <span className="text-xs font-bold text-slate-600 leading-none">
                         {exam.grade || "عام"}
                       </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">{exam.title}</h3>
                  <p className="text-slate-500 font-medium text-sm mb-8 line-clamp-2 leading-relaxed">{exam.description || 'لا يوجد وصف متاح لهذا الامتحان.'}</p>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm font-black text-slate-700">{exam.duration} د</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm font-black text-slate-700">{exam._count?.questions || 0} سؤال</span>
                    </div>
                    <button
                      onClick={() => handleUpdateAttempts(exam.id, exam.attemptsAllowed || 1)}
                      title="اضغط لتغيير عدد المحاولات المسموحة"
                      className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-2 hover:bg-amber-100 transition-all cursor-pointer group/attempts"
                    >
                      <Hash className="w-4 h-4 text-amber-500 group-hover/attempts:rotate-12 transition-transform" />
                      <span className="text-sm font-black text-amber-700">{formatAttempts(exam.attemptsAllowed || 1)}</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 mt-auto">
                    <Link 
                      href={`/school-admin/exams/edit/${exam.id}`}
                      className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      <FileEdit className="w-5 h-5" />
                      تعديل
                    </Link>
                    <button 
                      onClick={() => handleDelete(exam.id)}
                      className="w-14 bg-rose-50 text-rose-600 py-4 rounded-2xl font-black flex items-center justify-center hover:bg-rose-100 transition-all border border-rose-100"
                      title="حذف الامتحان"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                    <Link 
                      href={`/school-admin/exams/results/${exam.id}`}
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                    >
                      <BarChart3 className="w-5 h-5" />
                      تحليل النتائج
                    </Link>
                  </div>
                </div>

                {/* Date/Password Indicators */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                   <div className="flex items-center gap-2 text-slate-400">
                     <Calendar className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold">{new Date(exam.createdAt).toLocaleDateString('ar-EG')}</span>
                   </div>
                   {exam.password && (
                     <div className="flex items-center gap-1.5 text-indigo-600">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase">محمي</span>
                     </div>
                   )}
                </div>
              </div>
            ))}
            
            {filteredExams.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ClipboardList className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">لا توجد امتحانات متاحة</h3>
                <p className="text-slate-400 font-medium">ابدأ بتنظيم أول تقييم دراسي لمدرستك اليوم.</p>
                <Link href="/school-admin/exams/new" className="inline-flex items-center gap-2 text-indigo-600 font-black mt-8 hover:gap-3 transition-all">
                   إنشاء امتحان الآن
                   <ChevronLeft className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
