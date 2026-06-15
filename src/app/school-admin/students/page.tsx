"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, Search, CheckCircle, GraduationCap, Shield, Info, RefreshCw, Key, Edit, X
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotification } from "@/context/NotificationContext";

export default function SchoolAdminStudentsPage() {
  const { t, language } = useLanguage();
  const { showToast } = useNotification();
  const [schoolName, setSchoolName] = useState("مدرستك");
  const [schoolId, setSchoolId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    grade: ""
  });

  useEffect(() => {
    try {
      const userData = localStorage.getItem("school_admin_user");
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.schoolName) setSchoolName(parsed.schoolName);
        if (parsed.schoolId) {
          setSchoolId(parsed.schoolId);
          fetchStudents(parsed.schoolId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchStudents = async (sId: string) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("school_admin_token");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(
        `${API_URL}/admin/users?schoolId=${sId}&role=STUDENT`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : (data.users || []));
      } else {
        setError(t('schoolAdmin.studentsPage.fetchFail') || 'Failed to fetch students');
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      setError(t('schoolAdmin.studentsPage.connError') || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    setIsSubmitting(true);
    const token = localStorage.getItem("school_admin_token");
    
    try {
      const payload: any = {
        name: formData.name,
        username: formData.username,
        grade: formData.grade
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(`${API_URL}/admin/users/${selectedStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(language === 'ar' ? 'تم تحديث بيانات الطالب بنجاح' : 'Student updated successfully', 'success');
        setEditModalOpen(false);
        fetchStudents(schoolId);
      } else {
        const data = await res.json();
        showToast(data.error || (language === 'ar' ? 'فشل تحديث البيانات' : 'Failed to update student'), 'error');
      }
    } catch (error) {
      showToast(language === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      username: student.username,
      password: "", // leave empty to not change unless typed
      grade: student.grade || ""
    });
    setEditModalOpen(true);
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="hidden md:flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-3xl md:rounded-[32px] shadow-sm border border-slate-100 gap-6 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-center text-center md:text-right gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-tight">{t('schoolAdmin.studentsPage.title')}</h2>
              <p className="text-slate-500 text-xs md:text-lg font-medium opacity-80">
                {t('schoolAdmin.studentsPage.subtitle')?.replace('{schoolName}', schoolName)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={() => fetchStudents(schoolId)}
              className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4 md:gap-6">
            <div className="flex justify-between items-center w-full md:w-auto">
              <h3 className="text-base md:text-xl font-black text-slate-900 flex items-center gap-2 md:gap-3">
                 {t('schoolAdmin.studentsPage.registeredStudents')}
                 <span className="text-[10px] md:text-xs bg-blue-50 text-blue-600 px-2 md:px-3 py-1 rounded-full font-bold">{filteredStudents.length}</span>
              </h3>
              <div className="flex md:hidden gap-2">
                <button onClick={() => fetchStudents(schoolId)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder={t('schoolAdmin.studentsPage.searchPlaceholder')}
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 outline-none focus:border-blue-500 transition-all font-bold text-xs md:text-sm ${
                  language === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className={`w-4 h-4 md:w-5 md:h-5 text-slate-300 absolute top-1/2 -translate-y-1/2 ${
                language === 'ar' ? 'right-4' : 'left-4'
              }`} />
            </div>
          </div>

          <div className="overflow-x-auto">
             <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <thead>
                   <tr className="text-slate-400 text-[11px] font-black uppercase tracking-widest bg-slate-50/50">
                      <th className={`px-6 py-5 ${language === 'ar' ? 'rounded-r-2xl' : 'rounded-l-2xl'}`}>{t('schoolAdmin.studentsPage.table.student')}</th>
                      <th className="px-6 py-5">{language === 'ar' ? 'بيانات الدخول' : 'Login Credentials'}</th>
                      <th className="px-6 py-5">{t('schoolAdmin.studentsPage.table.grade')}</th>
                      <th className="px-6 py-5">{t('schoolAdmin.studentsPage.table.joinDate')}</th>
                      <th className={`px-6 py-5 ${language === 'ar' ? 'rounded-l-2xl' : 'rounded-r-2xl'} text-center`}>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {loading ? (
                     <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">{error || t('schoolAdmin.studentsPage.loading')}</td></tr>
                   ) : filteredStudents.length === 0 ? (
                     <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">{t('schoolAdmin.studentsPage.noStudents')}</td></tr>
                   ) : filteredStudents.map((student) => (
                     <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                 {student.name?.charAt(0) || "S"}
                              </div>
                              <span className="font-bold text-slate-700">{student.name}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex flex-col gap-1 text-xs">
                             <div className="flex items-center gap-2">
                               <span className="text-slate-400 w-16">{language === 'ar' ? 'المستخدم:' : 'User:'}</span>
                               <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded" dir="ltr">{student.username}</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-slate-400 w-16">{language === 'ar' ? 'المرور:' : 'Pass:'}</span>
                               <span className="font-mono text-slate-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-amber-700 border border-amber-100" dir="ltr">{student.plainPassword || "********"}</span>
                             </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black">{student.grade || "غير محدد"}</span>
                        </td>
                        <td className="px-6 py-5 text-slate-500 text-xs font-bold">
                           {student.createdAt ? new Date(student.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : "—"}
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center justify-center">
                             <button 
                               onClick={() => openEditModal(student)}
                               className="bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                               title={language === 'ar' ? 'تعديل بيانات الطالب' : 'Edit Student'}
                             >
                               <Edit className="w-4 h-4" />
                             </button>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">{language === 'ar' ? 'تعديل بيانات الطالب' : 'Edit Student Data'}</h3>
                <button onClick={() => setEditModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleEditStudent} className="space-y-5" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
                  <input
                    type="text" required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">
                    {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                    <span className="text-xs text-slate-400 font-normal ml-2 mr-2">
                      ({language === 'ar' ? 'اتركها فارغة إذا لم ترد تغييرها' : 'Leave empty to keep unchanged'})
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                    dir="ltr"
                    placeholder="********"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{language === 'ar' ? 'الصف الدراسي' : 'Grade'}</label>
                  <select
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                  >
                    <option value="">{language === 'ar' ? 'اختر الصف' : 'Select Grade'}</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <button
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-xl mt-6 transition-all hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-600/10 active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
