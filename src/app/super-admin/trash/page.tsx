"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Trash2, RefreshCw, BookOpen, Layers, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { API_URL } from "@/lib/api";

interface TrashedItem {
  id: string;
  title: string;
  deletedAt: string;
  subject?: string;
  course?: { title: string };
  type: 'course' | 'lesson';
}

export default function TrashPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("super_admin_token");
      if (!token) return router.push("/super-admin/login");

      const res = await fetch(`${API_URL}/admin/trash`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const courses = (data.courses || []).map((c: any) => ({ ...c, type: 'course' }));
        const lessons = (data.lessons || []).map((l: any) => ({ ...l, type: 'lesson' }));
        setItems([...courses, ...lessons].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()));
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "حدث خطأ أثناء جلب سلة المهملات" : "Error fetching trash", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string, type: 'course' | 'lesson') => {
    setRestoringId(id);
    try {
      const token = localStorage.getItem("super_admin_token");
      const url = type === 'course' 
        ? `${API_URL}/school/courses/${id}/restore`
        : `${API_URL}/lessons/${id}/restore`;

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        showToast(language === 'ar' ? "تمت الاستعادة بنجاح" : "Restored successfully", "success");
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || (language === 'ar' ? "فشل الاستعادة" : "Restore failed"), "error");
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "حدث خطأ" : "An error occurred", "error");
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-rose-50 p-8 md:p-12 rounded-[40px] shadow-sm border border-rose-100">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black text-rose-600 flex items-center gap-4">
              <Trash2 className="w-10 h-10" />
              <span>{language === 'ar' ? "سلة المهملات" : "Trash Bin"}</span>
            </h1>
            <p className="text-rose-600/70 font-bold max-w-xl text-sm leading-relaxed">
              {language === 'ar' 
                ? "إدارة واستعادة الكورسات والدروس المحذوفة مؤقتاً."
                : "Manage and restore soft-deleted courses and lessons."}
            </p>
          </div>
          <button 
            onClick={fetchTrash}
            className="bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold px-6 py-4 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-sm text-sm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'ar' ? "تحديث" : "Refresh"}</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-[35px] border border-slate-100 p-24 flex justify-center items-center">
            <RefreshCw className="w-10 h-10 text-rose-600 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[35px] border-4 border-dashed border-slate-100 p-24 flex flex-col justify-center items-center text-center gap-6">
            <div className="w-20 h-20 bg-slate-50 rounded-[25px] flex items-center justify-center text-slate-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-slate-800">{language === 'ar' ? "سلة المهملات فارغة" : "Trash is empty"}</h4>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 ${item.type === 'course' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.type === 'course' ? <BookOpen className="w-7 h-7" /> : <Layers className="w-7 h-7" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${item.type === 'course' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.type === 'course' ? (language === 'ar' ? 'كورس' : 'Course') : (language === 'ar' ? 'درس' : 'Lesson')}
                      </span>
                      {item.type === 'lesson' && item.course && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[150px]">
                          {item.course.title}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-black text-slate-800">{item.title}</h4>
                    <p className="text-slate-400 font-bold text-xs mt-1">{formatDate(item.deletedAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(item.id, item.type)}
                  disabled={restoringId === item.id}
                  className="bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 font-black px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {restoringId === item.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {language === 'ar' ? "استعادة" : "Restore"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
