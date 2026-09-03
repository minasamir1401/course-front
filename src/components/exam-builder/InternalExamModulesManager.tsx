"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_URL } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function InternalExamModulesManager({
  examId,
  modules,
  onModulesChange
}: {
  examId: string;
  modules: any[];
  onModulesChange: (newModules: any[]) => void;
}) {
  const { t, language } = useLanguage();
  const { showToast } = useNotification();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    duration: '',
    passingScore: ''
  });

  const handleSave = async () => {
    if (!formData.title) {
      showToast(language === 'ar' ? "يرجى إدخال عنوان الموديول" : "Please enter a module title", "error");
      return;
    }

    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("lms_token") || localStorage.getItem("token");
      const url = editingId 
        ? `${API_URL}/exams/${examId}/modules/${editingId}`
        : `${API_URL}/exams/${examId}/modules`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
          passingScore: formData.passingScore ? parseInt(formData.passingScore) : null,
          order: formData.order
        })
      });

      if (!res.ok) throw new Error("Failed to save module");
      
      const savedModule = await res.json();
      
      if (editingId) {
        onModulesChange(modules.map(m => m.id === editingId ? savedModule : m));
      } else {
        onModulesChange([...modules, savedModule]);
      }
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', description: '', order: 0, duration: '', passingScore: '' });
      showToast(language === 'ar' ? "تم الحفظ بنجاح" : "Saved successfully", "success");
    } catch (error) {
      console.error(error);
      showToast(language === 'ar' ? "حدث خطأ أثناء الحفظ" : "Error saving module", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا الموديول؟" : "Are you sure you want to delete this module?")) return;
    
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("lms_token") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/exams/${examId}/modules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to delete module");
      
      onModulesChange(modules.filter(m => m.id !== id));
      showToast(language === 'ar' ? "تم الحذف بنجاح" : "Deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showToast(language === 'ar' ? "حدث خطأ أثناء الحذف" : "Error deleting module", "error");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            {language === 'ar' ? "إدارة الموديولات (الأقسام)" : "Manage Modules (Sections)"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {language === 'ar' 
              ? "يمكنك تقسيم الامتحان إلى عدة موديولات، وتحديد وقت ودرجة نجاح لكل موديول." 
              : "You can divide the exam into multiple modules, and set duration/passing score for each."}
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ title: '', description: '', order: modules.length, duration: '', passingScore: '' });
            setIsAdding(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? "إضافة موديول جديد" : "Add New Module"}
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {language === 'ar' ? "عنوان الموديول" : "Module Title"}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600"
                placeholder={language === 'ar' ? "مثال: موديول القراءة" : "e.g., Reading Module"}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {language === 'ar' ? "الوصف (اختياري)" : "Description (Optional)"}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {language === 'ar' ? "المدة بالدقائق (اختياري)" : "Duration in minutes (Optional)"}
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {language === 'ar' ? "درجة النجاح (اختياري)" : "Passing Score (Optional)"}
              </label>
              <input
                type="number"
                value={formData.passingScore}
                onChange={e => setFormData({ ...formData, passingScore: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {language === 'ar' ? "الترتيب" : "Order"}
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all"
            >
              {language === 'ar' ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {language === 'ar' ? "حفظ" : "Save"}
            </button>
          </div>
        </div>
      )}

      {modules.length > 0 ? (
        <div className="space-y-3">
          {modules.sort((a, b) => (a.order || 0) - (b.order || 0)).map((module, index) => (
            <div key={module.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{module.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {module.duration && <span>🕒 {module.duration} {language === 'ar' ? "دقيقة" : "mins"}</span>}
                    {module.passingScore && <span>🏆 {language === 'ar' ? "نجاح:" : "Pass:"} {module.passingScore}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFormData({
                      title: module.title,
                      description: module.description || '',
                      order: module.order || 0,
                      duration: module.duration?.toString() || '',
                      passingScore: module.passingScore?.toString() || ''
                    });
                    setEditingId(module.id);
                    setIsAdding(false);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(module.id)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-slate-600 font-bold mb-1">
            {language === 'ar' ? "لا يوجد موديولات" : "No modules yet"}
          </h3>
          <p className="text-slate-400 text-sm">
            {language === 'ar' 
              ? "انقر على زر الإضافة أعلاه لإضافة موديولات للامتحان" 
              : "Click the add button above to add modules to this exam"}
          </p>
        </div>
      )}
    </div>
  );
}
