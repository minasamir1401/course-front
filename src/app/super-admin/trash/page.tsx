"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Trash2, RefreshCw, BookOpen, Layers, CheckCircle2, AlertTriangle, ArrowLeft, ChevronRight, ChevronLeft, Trash, Users } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { API_URL } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import DeduplicatorModal from "@/components/DeduplicatorModal";

interface TrashedItem {
  id: string;
  title: string;
  deletedAt: string;
  subject?: string;
  course?: { title: string };
  type: 'course' | 'lesson' | 'exam' | 'question' | 'user';
  text?: string;
  exam?: { title: string };
}

type TabType = 'all' | 'course' | 'lesson' | 'exam' | 'question' | 'user';

export default function TrashPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [keysPressed, setKeysPressed] = useState<string[]>([]);
  const [showDeduplicator, setShowDeduplicator] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Pagination & Bulk Actions
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItems, setSelectedItems] = useState<{ id: string, type: 'course' | 'lesson' | 'exam' | 'question' | 'user' }[]>([]);
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  const LIMIT = 50;

  useEffect(() => {
    setToken(localStorage.getItem("super_admin_token"));
    fetchTrash(1);
  }, []);

  useEffect(() => {
    fetchTrash(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed((prev) => {
        const newKeys = [...prev, e.key.toLowerCase()].slice(-4);
        if (newKeys.join('') === 'mina') {
          setShowDeduplicator(true);
          return [];
        }
        return newKeys;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchTrash = async (page: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("super_admin_token");
      if (!token) return router.push("/super-admin/login");

      const res = await fetch(`${API_URL}/admin/trash?page=${page}&limit=${LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Since backend already formats and slices:
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
        setCurrentPage(data.currentPage || 1);
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "حدث خطأ أثناء جلب سلة المهملات" : "Error fetching trash", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string, type: 'course' | 'lesson' | 'exam' | 'question' | 'user') => {
    setRestoringId(id);
    try {
      const token = localStorage.getItem("super_admin_token");
      let url = `${API_URL}/school/courses/${id}/restore`;
      if (type === 'lesson') url = `${API_URL}/lessons/${id}/restore`;
      else if (type === 'exam') url = `${API_URL}/admin/exams/${id}/restore`;
      else if (type === 'question') url = `${API_URL}/admin/questions/${id}/restore`;
      else if (type === 'user') {
        // We can use bulk restore API to restore a single user since there's no specific route
        const res = await fetch(`${API_URL}/admin/trash/bulk-restore`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: [{ id, type }] })
        });
        if (res.ok) {
          showToast(language === 'ar' ? 'تم استرجاع العنصر بنجاح' : 'Item restored successfully', 'success');
          fetchTrash(currentPage);
        } else {
          showToast(language === 'ar' ? 'فشل استرجاع العنصر' : 'Failed to restore item', 'error');
        }
        return;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        showToast(language === 'ar' ? "تمت الاستعادة بنجاح" : "Restored successfully", "success");
        fetchTrash(currentPage);
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


  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;
    setIsBulkRestoring(true);
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/admin/trash/bulk-restore`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items: selectedItems })
      });

      if (res.ok) {
        showToast(language === 'ar' ? "تمت استعادة العناصر المحددة بنجاح" : "Selected items restored successfully", "success");
        setSelectedItems([]);
        fetchTrash(currentPage);
      } else {
        showToast(language === 'ar' ? "فشل الاستعادة الجماعية" : "Bulk restore failed", "error");
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "حدث خطأ" : "An error occurred", "error");
    } finally {
      setIsBulkRestoring(false);
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const token = localStorage.getItem("super_admin_token");
      const url = activeTab === 'all' 
        ? `${API_URL}/admin/trash/empty` 
        : `${API_URL}/admin/trash/empty?type=${activeTab}`;
        
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        showToast(language === 'ar' ? "تم إفراغ السلة بنجاح" : "Trash emptied successfully", "success");
        setShowEmptyModal(false);
        fetchTrash(1);
      } else {
        showToast(language === 'ar' ? "فشل إفراغ السلة" : "Failed to empty trash", "error");
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "حدث خطأ أثناء الاتصال بالخادم" : "An error occurred", "error");
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  const toggleSelection = (id: string, type: 'course' | 'lesson' | 'exam' | 'question' | 'user') => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === id);
      if (exists) return prev.filter(item => item.id !== id);
      return [...prev, { id, type }];
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => ({ id: item.id, type: item.type })));
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
                ? "إدارة واستعادة الكورسات والدروس والاختبارات المحذوفة مؤقتاً."
                : "Manage and restore soft-deleted courses, lessons, and exams."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedItems.length > 0 && (
              <button 
                onClick={handleBulkRestore}
                disabled={isBulkRestoring}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-sm text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isBulkRestoring ? 'animate-spin' : ''}`} />
                <span>{language === 'ar' ? `استعادة المحدد (${selectedItems.length})` : `Restore Selected (${selectedItems.length})`}</span>
              </button>
            )}
            
            <button 
              onClick={() => setShowEmptyModal(true)}
              disabled={loading || items.length === 0}
              className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 font-bold px-6 py-4 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-sm text-sm disabled:opacity-50"
            >
              <Trash className="w-5 h-5" />
              <span>{language === 'ar' ? "إفراغ السلة" : "Empty Trash"}</span>
            </button>
            <button 
              onClick={() => fetchTrash(currentPage)}
              disabled={loading}
              className="bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold px-6 py-4 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-sm text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? "تحديث" : "Refresh"}</span>
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto pb-4 gap-3 snap-x hide-scrollbar">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: <Layers className="w-4 h-4" /> },
            { id: 'course', labelAr: 'الكورسات', labelEn: 'Courses', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'lesson', labelAr: 'الدروس', labelEn: 'Lessons', icon: <Layers className="w-4 h-4" /> },
            { id: 'exam', labelAr: 'الامتحانات', labelEn: 'Exams', icon: <AlertTriangle className="w-4 h-4" /> },
            { id: 'question', labelAr: 'الأسئلة', labelEn: 'Questions', icon: <AlertTriangle className="w-4 h-4" /> },
            { id: 'user', labelAr: 'المستخدمين', labelEn: 'Users', icon: <Users className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`snap-start shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
              }`}
            >
              {tab.icon}
              {language === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          ))}
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
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm px-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={items.length > 0 && selectedItems.length === items.length}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
                <span className="font-bold text-slate-700 text-sm">
                  {language === 'ar' ? "تحديد الكل في هذه الصفحة" : "Select all on this page"}
                </span>
              </label>
              <span className="text-sm font-bold text-slate-500">
                {language === 'ar' ? `إجمالي العناصر المحذوفة: ${totalItems}` : `Total deleted items: ${totalItems}`}
              </span>
            </div>

            {(activeTab === 'all' ? items : items.filter(i => i.type === activeTab)).map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.some(s => s.id === item.id)}
                    onChange={() => toggleSelection(item.id, item.type)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer shrink-0"
                  />
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 ${item.type === 'course' ? 'bg-indigo-50 text-indigo-600' : item.type === 'lesson' ? 'bg-emerald-50 text-emerald-600' : item.type === 'exam' ? 'bg-amber-50 text-amber-600' : item.type === 'user' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {item.type === 'course' ? <BookOpen className="w-7 h-7" /> : item.type === 'lesson' ? <Layers className="w-7 h-7" /> : item.type === 'user' ? <Users className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${item.type === 'course' ? 'bg-indigo-100 text-indigo-700' : item.type === 'lesson' ? 'bg-emerald-100 text-emerald-700' : item.type === 'exam' ? 'bg-amber-100 text-amber-700' : item.type === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {item.type === 'course' ? (language === 'ar' ? 'كورس' : 'Course') : item.type === 'lesson' ? (language === 'ar' ? 'درس' : 'Lesson') : item.type === 'exam' ? (language === 'ar' ? 'اختبار' : 'Exam') : item.type === 'user' ? (language === 'ar' ? 'مستخدم' : 'User') : (language === 'ar' ? 'سؤال' : 'Question')}
                      </span>
                      {item.type === 'lesson' && item.course && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[150px]">
                          {item.course.title}
                        </span>
                      )}
                      {item.type === 'question' && item.exam && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[150px]">
                          {item.exam.title}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-black text-slate-800 truncate max-w-[300px] md:max-w-md lg:max-w-xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.title || "") }} />
                    <p className="text-slate-400 font-bold text-xs mt-1">{formatDate(item.deletedAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(item.id, item.type)}
                  disabled={restoringId === item.id}
                  className="bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 font-black px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm disabled:opacity-50 shrink-0"
                >
                  {restoringId === item.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {language === 'ar' ? "استعادة" : "Restore"}
                </button>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm w-fit mx-auto">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-all"
                >
                  {language === 'ar' ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                </button>
                <div className="flex items-center gap-2 font-black text-sm">
                  <span className="text-slate-800">{currentPage}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-400">{totalPages}</span>
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-all"
                >
                  {language === 'ar' ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showDeduplicator && token && (
        <DeduplicatorModal onClose={() => setShowDeduplicator(false)} token={token} />
      )}

      {/* Empty Trash Confirmation Modal */}
      {showEmptyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-rose-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 text-center mb-4">
              {language === 'ar' ? "هل أنت متأكد من إفراغ السلة؟" : "Are you sure you want to empty the trash?"}
            </h3>
            <p className="text-slate-500 text-center font-bold mb-8 leading-relaxed">
              {language === 'ar' 
                ? `سيتم حذف جميع العناصر${activeTab !== 'all' ? ' في هذا القسم' : ''} نهائياً ولن تتمكن من استعادتها أبداً.`
                : `All items${activeTab !== 'all' ? ' in this section' : ''} will be permanently deleted and cannot be recovered.`}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowEmptyModal(false)}
                disabled={isEmptyingTrash}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                {language === 'ar' ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={isEmptyingTrash}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {isEmptyingTrash ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash className="w-5 h-5" />}
                {language === 'ar' ? "نعم، حذف نهائي" : "Yes, Empty"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
