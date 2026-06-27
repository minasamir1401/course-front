"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Layout, Plus, Search, Trash2, Users, GraduationCap, 
  BookOpen, X, ChevronDown, CheckCircle, Edit2
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  subject: string;
  teacherName: string;
  studentsCount: number;
}

export default function SchoolAdminClassesPage() {
  const { t, language } = useLanguage();
  const { showToast, confirm } = useNotification();
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("مدرستك");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    subject: "",
    teacherName: "",
  });

  useEffect(() => {
    try {
      const userData = localStorage.getItem("school_admin_user");
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.schoolName) setSchoolName(parsed.schoolName);
        if (parsed.schoolId) {
          setSchoolId(parsed.schoolId);
          fetchClasses(parsed.schoolId);
          fetchTeachers(parsed.schoolId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchClasses = async (sId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/classes?schoolId=${sId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async (sId: string) => {
    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/admin/users?schoolId=${sId}&role=TEACHER`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers(Array.isArray(data) ? data : (data.users || []));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.grade) {
      showToast(t('schoolAdmin.classesPage.fillRequired'), "error");
      return;
    }

    try {
      const token = localStorage.getItem("school_admin_token");
      const url = isEditMode ? `${API_URL}/classes/${editingClassId}` : `${API_URL}/classes`;
      const method = isEditMode ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, schoolId })
      });

      if (res.ok) {
        showToast(
          isEditMode 
            ? (language === 'ar' ? "تم تحديث الفصل بنجاح" : "Classroom updated successfully") 
            : t('schoolAdmin.classesPage.createSuccess'), 
          "success"
        );
        setIsModalOpen(false);
        setFormData({ name: "", grade: "", subject: "", teacherName: "" });
        fetchClasses(schoolId);
      } else {
        showToast(
          isEditMode 
            ? (language === 'ar' ? "فشل تحديث الفصل" : "Failed to update classroom") 
            : t('schoolAdmin.classesPage.createFail'), 
          "error"
        );
      }
    } catch (e) {
      showToast(t('schoolAdmin.classesPage.connError'), "error");
    }
  };

  const handleDeleteClass = async (id: string) => {
    const confirmed = await confirm(
      t('schoolAdmin.classesPage.deleteConfirmTitle'),
      t('schoolAdmin.classesPage.deleteConfirmMsg')
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(t('schoolAdmin.classesPage.deleteSuccess'), "success");
        fetchClasses(schoolId);
      } else {
        showToast(t('schoolAdmin.classesPage.deleteFail'), "error");
      }
    } catch (e) {
      showToast(t('schoolAdmin.classesPage.connError'), "error");
    }
  };

  const filtered = classes.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.grade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const gradeColors: Record<string, string> = {
    "الصف الأول الثانوي": "bg-blue-50 text-blue-600",
    "الصف الثاني الثانوي": "bg-purple-50 text-purple-600",
    "الصف الثالث الثانوي": "bg-emerald-50 text-emerald-600",
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center shadow-sm">
              <Layout className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">{t('schoolAdmin.classesPage.title')}</h2>
              <p className="text-slate-500 font-medium opacity-80">{schoolName}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditMode(false);
              setEditingClassId(null);
              setFormData({ name: "", grade: "", subject: "", teacherName: "" });
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto bg-orange-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" /> 
            {t('schoolAdmin.classesPage.createClass')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t('schoolAdmin.classesPage.firstSecondary'), count: classes.filter(c => c.grade === "الصف الأول الثانوي").length },
            { label: t('schoolAdmin.classesPage.secondSecondary'), count: classes.filter(c => c.grade === "الصف الثاني الثانوي").length },
            { label: t('schoolAdmin.classesPage.thirdSecondary'), count: classes.filter(c => c.grade === "الصف الثالث الثانوي").length },
            { label: t('schoolAdmin.classesPage.total'), count: classes.length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-[25px] border border-slate-100 p-6 text-center shadow-sm">
              <p className="text-3xl font-black text-slate-800">{s.count}</p>
              <p className="text-xs font-bold text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Classes Grid */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h3 className="text-xl font-black text-slate-800">
              {t('schoolAdmin.classesPage.classesList').replace('{count}', String(filtered.length))}
            </h3>
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder={t('schoolAdmin.classesPage.searchPlaceholder')}
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 outline-none focus:border-orange-500 transition-all font-bold ${
                  language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                }`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search className={`w-5 h-5 text-slate-400 absolute top-3.5 ${
                language === 'ar' ? 'right-4' : 'left-4'
              }`} />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 font-bold">{t('schoolAdmin.teachersPage.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[30px]">
              <Layout className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h4 className="text-xl font-black text-slate-400">{t('schoolAdmin.classesPage.noClasses')}</h4>
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setEditingClassId(null);
                  setFormData({ name: "", grade: "", subject: "", teacherName: "" });
                  setIsModalOpen(true);
                }}
                className="mt-4 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all"
              >
                {t('schoolAdmin.classesPage.createFirstClass')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(cls => (
                <div key={cls.id} className="bg-white border border-slate-100 rounded-[30px] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className={`absolute top-0 ${language === 'ar' ? 'right-0 -mr-12' : 'left-0 -ml-12'} w-24 h-24 bg-orange-50 rounded-full -mt-12 group-hover:bg-orange-100 transition-colors`} />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-black text-lg">
                        {cls.name?.charAt(0) || "F"}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${gradeColors[cls.grade] || "bg-slate-50 text-slate-600"}`}>
                        {cls.grade}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-800 text-lg mb-1">{cls.name}</h4>
                    <p className="text-xs text-slate-400 font-bold mb-4">{cls.subject}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5" /> {t('schoolAdmin.classesPage.studentsCount').replace('{count}', String(cls.studentsCount || 0))}
                      </div>
                      {cls.teacherName && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <BookOpen className="w-3.5 h-3.5" /> {cls.teacherName}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-4">
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setEditingClassId(cls.id);
                          setFormData({
                            name: cls.name,
                            grade: cls.grade,
                            subject: cls.subject || "",
                            teacherName: cls.teacherName || ""
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-slate-300 hover:text-blue-500 transition-colors cursor-pointer"
                        title={language === 'ar' ? "تعديل" : "Edit"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                        title={t('schoolAdmin.teachersPage.deleteTooltip')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-white w-full max-w-lg rounded-[28px] sm:rounded-[40px] p-5 sm:p-10 shadow-2xl animate-in zoom-in-95 my-4 sm:my-8 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">
                {isEditMode 
                  ? (language === 'ar' ? "تعديل الفصل الدراسي" : "Edit Classroom") 
                  : t('schoolAdmin.classesPage.modalTitle')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800"><X /></button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-500">{t('schoolAdmin.classesPage.className')}</label>
                <input
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold transition-all"
                  placeholder={t('schoolAdmin.classesPage.classPlaceholder')}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-500">{t('schoolAdmin.classesPage.grade')}</label>
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-black text-slate-900 transition-all appearance-none"
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  >
                    <option value="" className="bg-white text-slate-900">{t('schoolAdmin.classesPage.selectGrade')}</option>
                    {[
                      "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
                      "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
                      "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
                      "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
                    ].map(g => (
                      <option key={g} value={g} className="bg-white text-slate-900">{g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-500">{t('schoolAdmin.classesPage.subject')}</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold transition-all"
                    placeholder={t('schoolAdmin.classesPage.subjectPlaceholder')}
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-500">{t('schoolAdmin.classesPage.teacherName')}</label>
                {teachers.length > 0 ? (
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold appearance-none transition-all"
                    value={formData.teacherName}
                    onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                  >
                    <option value="">{t('schoolAdmin.classesPage.selectTeacherOptional')}</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name} - {t.subject}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold transition-all"
                    placeholder={t('schoolAdmin.classesPage.writeTeacherPlaceholder')}
                    value={formData.teacherName}
                    onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-orange-600 hover:scale-105 transition-all"
              >
                {isEditMode 
                  ? (language === 'ar' ? "حفظ التغييرات" : "Save Changes") 
                  : t('schoolAdmin.classesPage.submitBtn')}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
