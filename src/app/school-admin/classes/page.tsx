"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Layout, Plus, Search, Trash2, Users, GraduationCap, 
  BookOpen, X, ChevronDown, CheckCircle, Edit2
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  subject: string;
  teacherName: string;
  studentsCount: number;
}

export default function SchoolAdminClassesPage() {
  const { showToast, confirm } = useNotification();
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("مدرستك");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      // Show mock data if endpoint doesn't exist yet
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
        setTeachers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.grade) {
      showToast("يرجى ملء اسم الفصل والمرحلة الدراسية", "error");
      return;
    }

    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, schoolId })
      });

      if (res.ok) {
        showToast("تم إنشاء الفصل بنجاح", "success");
        setIsModalOpen(false);
        setFormData({ name: "", grade: "", subject: "", teacherName: "" });
        fetchClasses(schoolId);
      } else {
        showToast("فشل إنشاء الفصل", "error");
      }
    } catch (e) {
      showToast("خطأ في الاتصال", "error");
    }
  };

  const handleDeleteClass = async (id: string) => {
    const confirmed = await confirm("تأكيد الحذف", "هل أنت متأكد من حذف هذا الفصل؟");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("تم حذف الفصل بنجاح", "success");
        fetchClasses(schoolId);
      } else {
        showToast("فشل حذف الفصل", "error");
      }
    } catch (e) {
      showToast("خطأ في الاتصال", "error");
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
      <div className="flex flex-col gap-8 rtl" dir="rtl">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center shadow-sm">
              <Layout className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">إدارة الفصول الدراسية</h2>
              <p className="text-slate-500 font-medium opacity-80">{schoolName}</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-orange-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" /> 
            إنشاء فصل جديد
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "الأول الثانوي", count: classes.filter(c => c.grade === "الصف الأول الثانوي").length, color: "blue" },
            { label: "الثاني الثانوي", count: classes.filter(c => c.grade === "الصف الثاني الثانوي").length, color: "purple" },
            { label: "الثالث الثانوي", count: classes.filter(c => c.grade === "الصف الثالث الثانوي").length, color: "emerald" },
            { label: "الإجمالي", count: classes.length, color: "orange" },
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
            <h3 className="text-xl font-black text-slate-800">قائمة الفصول ({filtered.length})</h3>
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="ابحث عن فصل..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-orange-500 transition-all font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3" />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 font-bold">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[30px]">
              <Layout className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h4 className="text-xl font-black text-slate-400">لا توجد فصول دراسية</h4>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all"
              >
                أنشئ أول فصل الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(cls => (
                <div key={cls.id} className="bg-white border border-slate-100 rounded-[30px] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 group-hover:bg-orange-100 transition-colors" />
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
                        <Users className="w-3.5 h-3.5" /> {cls.studentsCount || 0} طالب
                      </div>
                      {cls.teacherName && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <BookOpen className="w-3.5 h-3.5" /> {cls.teacherName}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-50 mt-4">
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">إنشاء فصل دراسي جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800"><X /></button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-500">اسم الفصل</label>
                <input
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold transition-all"
                  placeholder="مثال: الفصل A"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-500">المرحلة الدراسية</label>
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-black text-slate-900 transition-all appearance-none"
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  >
                    <option value="" className="bg-white text-slate-900">اختر المرحلة</option>
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
                  <label className="text-sm font-black text-slate-500">المادة</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold transition-all"
                    placeholder="مثال: SAT Math"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-500">اسم المدرس المسؤول</label>
                {teachers.length > 0 ? (
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold appearance-none transition-all"
                    value={formData.teacherName}
                    onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                  >
                    <option value="">اختر مدرساً (اختياري)</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name} - {t.subject}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 font-bold transition-all"
                    placeholder="اكتب اسم المدرس"
                    value={formData.teacherName}
                    onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-orange-600 hover:scale-105 transition-all"
              >
                إنشاء الفصل الآن
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
