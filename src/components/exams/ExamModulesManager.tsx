"use client";

import React, { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { Plus, Trash2, Edit2, X, Folder, Layers, Save } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function ExamModulesManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [modules, setModules] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, confirm } = useNotification();
  const [editingModule, setEditingModule] = useState<any>(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  
  // Assign Exams state
  const [assigningSectionId, setAssigningSectionId] = useState<string | null>(null);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

  const fetchModulesAndExams = async () => {
    try {
      const token = localStorage.getItem('super_admin_token') || localStorage.getItem('lms_token') || localStorage.getItem('token');
      
      const [modulesRes, examsRes] = await Promise.all([
        fetch(`${API_URL}/exam-modules`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/exams`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const modulesData = await modulesRes.json();
      const examsData = await examsRes.json();
      
      setModules(Array.isArray(modulesData) ? modulesData : []);
      setAllExams(Array.isArray(examsData) ? examsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchModulesAndExams();
  }, [isOpen]);

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('super_admin_token') || localStorage.getItem('lms_token') || localStorage.getItem('token');
      const method = editingModule.id ? 'PUT' : 'POST';
      const url = editingModule.id ? `${API_URL}/admin/exam-modules/${editingModule.id}` : `${API_URL}/admin/exam-modules`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingModule)
      });
      if (res.ok) {
        showToast("تم حفظ الموديول بنجاح", "success");
        setEditingModule(null);
        fetchModulesAndExams();
      }
    } catch (err) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleSaveAssignments = async () => {
    if (!assigningSectionId) return;
    try {
      const token = localStorage.getItem('super_admin_token') || localStorage.getItem('lms_token') || localStorage.getItem('token');
      
      // Update the selected exams one by one (or you could create a bulk endpoint)
      await Promise.all(selectedExamIds.map(examId => 
        fetch(`${API_URL}/exams/${examId}`, {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sectionId: assigningSectionId })
        })
      ));
      
      showToast("تم تعيين الاختبارات للقسم بنجاح", "success");
      setAssigningSectionId(null);
      fetchModulesAndExams();
    } catch (err) {
      showToast("حدث خطأ أثناء التعيين", "error");
    }
  };

  const handleAddSection = async (moduleId: string) => {
    if (!newSectionTitle.trim()) return;
    try {
      const token = localStorage.getItem('super_admin_token') || localStorage.getItem('lms_token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/exam-sections`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ moduleId, title: newSectionTitle })
      });
      if (res.ok) {
        showToast("تم إضافة القسم", "success");
        setNewSectionTitle("");
        fetchModulesAndExams();
      }
    } catch (err) {
      showToast("حدث خطأ", "error");
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!await confirm("تأكيد", "هل أنت متأكد من حذف هذا الموديول؟")) return;
    const token = localStorage.getItem('super_admin_token') || localStorage.getItem('lms_token') || localStorage.getItem('token');
    await fetch(`${API_URL}/admin/exam-modules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchModulesAndExams();
  };

  const handleDeleteSection = async (id: string) => {
    if (!await confirm("تأكيد", "هل أنت متأكد من حذف هذا القسم؟")) return;
    const token = localStorage.getItem('super_admin_token') || localStorage.getItem('lms_token') || localStorage.getItem('token');
    await fetch(`${API_URL}/admin/exam-sections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchModulesAndExams();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" dir="rtl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Folder className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">إدارة موديولات الاختبارات</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 flex gap-6">
          <div className="w-1/3 flex flex-col gap-4 border-l pl-6">
            <button 
              onClick={() => setEditingModule({ title: "", description: "", isCentral: true })}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              موديول جديد
            </button>

            <div className="space-y-3 mt-4">
              {modules.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => setActiveModuleId(m.id)}
                  className={`p-4 rounded-xl cursor-pointer border-2 transition-all flex justify-between items-center ${activeModuleId === m.id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span className="font-semibold text-gray-800">{m.title}</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingModule(m); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(m.id); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-2/3">
            {editingModule ? (
              <form onSubmit={handleSaveModule} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-5">
                <h3 className="font-bold text-lg mb-4">{editingModule.id ? 'تعديل الموديول' : 'إضافة موديول جديد'}</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم الموديول</label>
                  <input type="text" value={editingModule.title} onChange={e => setEditingModule({...editingModule, title: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (اختياري)</label>
                  <textarea value={editingModule.description || ''} onChange={e => setEditingModule({...editingModule, description: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                    <Save className="w-5 h-5" /> حفظ الموديول
                  </button>
                  <button type="button" onClick={() => setEditingModule(null)} className="py-3 px-6 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors">
                    إلغاء
                  </button>
                </div>
              </form>
            ) : activeModuleId ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-xl text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  أقسام الموديول
                </h3>
                
                <div className="space-y-4">
                  {modules.find(m => m.id === activeModuleId)?.sections?.map((s: any) => (
                    <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <span className="font-medium text-gray-800">{s.title}</span>
                        <div className="text-xs text-gray-500 mt-1">{s.exams?.length || 0} اختبارات مسجلة</div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setAssigningSectionId(s.id);
                            setSelectedExamIds(s.exams?.map((e: any) => e.id) || []);
                          }} 
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          تعيين اختبارات
                        </button>
                        <button onClick={() => handleDeleteSection(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                    <input 
                      type="text" 
                      placeholder="اسم القسم الجديد..." 
                      value={newSectionTitle}
                      onChange={e => setNewSectionTitle(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button onClick={() => handleAddSection(activeModuleId)} className="py-3 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                      <Plus className="w-5 h-5" /> إضافة
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                <Folder className="w-16 h-16 opacity-20" />
                <p className="text-lg">اختر موديولاً لعرض أقسامه أو قم بإضافة واحد جديد</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {assigningSectionId && (
        <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" dir="rtl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">تحديد الاختبارات للقسم</h3>
              <button onClick={() => setAssigningSectionId(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-2">
              {allExams.map(exam => (
                <label key={exam.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedExamIds.includes(exam.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedExamIds([...selectedExamIds, exam.id]);
                      else setSelectedExamIds(selectedExamIds.filter(id => id !== exam.id));
                    }}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <div>
                    <div className="font-semibold">{exam.title}</div>
                    <div className="text-xs text-gray-500">{exam.grade}</div>
                  </div>
                </label>
              ))}
              {allExams.length === 0 && (
                <div className="text-center text-gray-500 py-10">لا يوجد اختبارات متاحة</div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={handleSaveAssignments} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700">
                حفظ التعيينات
              </button>
              <button onClick={() => setAssigningSectionId(null)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
