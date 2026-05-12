"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Plus, Search, Shield, 
  User, Mail, ChevronRight,
  MoreVertical, Edit2, Trash2, Key, X, Building2, GraduationCap, Sparkles
} from "lucide-react";
import Link from "next/link";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import { useNotification } from "@/context/NotificationContext";

export default function StudentsManagement() {
  const router = useRouter();
  const { showToast, confirm } = useNotification();
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    schoolId: "",
    role: "STUDENT",
    grade: ""
  });

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetch(API_URL + "/admin/users", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(API_URL + "/admin/schools", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      
      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        setStudents(allUsers.filter((u: any) => u.role === 'STUDENT'));
      }
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (student: any) => {
    setFormData({
      name: student.name,
      username: student.username,
      password: student.plainPassword || "",
      schoolId: student.schoolId || "",
      role: "STUDENT",
      grade: student.grade || ""
    });
    setEditingStudentId(student.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", username: "", password: "", schoolId: "", role: "STUDENT", grade: "" });
    setIsEditMode(false);
    setEditingStudentId(null);
  };
// ... (rest of helper functions unchanged)
  const generateCredentials = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newUsername = `STD${randomNum}`;
    
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setFormData({
      ...formData,
      username: newUsername,
      password: newPassword
    });
    showToast("تم توليد بيانات دخول جديدة", 'success');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username || !formData.password || !formData.schoolId) {
      showToast("يرجى ملء جميع الحقول المطلوبة", 'error');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      const url = isEditMode ? `${API_URL}/admin/users/${editingStudentId}` : `${API_URL}/admin/users`;
      const method = isEditMode ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchData();
        showToast(isEditMode ? "تم تحديث بيانات الطالب بنجاح" : "تم إضافة الطالب بنجاح", 'success');
      } else {
        const data = await res.json();
        showToast(data.error || (isEditMode ? "فشل تحديث بيانات الطالب" : "فشل إضافة الطالب"), 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالسيرفر", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const confirmed = await confirm(
      "تأكيد الحذف",
      "هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع بياناته ونتائجه بشكل نهائي."
    );
    if (!confirmed) return;

    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(API_URL + `/admin/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("تم حذف المستخدم بنجاح", 'success');
        fetchData();
      } else {
        showToast("فشل حذف المستخدم", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالسيرفر", 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-slate-200" dir="rtl">
      <SuperAdminSidebar />
      <main className="lg:mr-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            إدارة الطلاب
          </h2>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 sm:px-8 sm:py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 text-sm sm:text-base">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            إضافة طالب
          </button>
        </div>

        <div className="mb-6 sm:mb-10 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f0f1d] border border-white/5 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-blue-500 transition-all text-white font-medium"
          />
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f0f1d] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{isEditMode ? "تعديل بيانات الطالب" : "تسجيل طالب جديد"}</h3>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-500 hover:text-white"><X /></button>
              </div>
              
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">البيانات الأساسية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">اسم الطالب</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500" placeholder="الاسم الرباعي" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">المرحلة التعليمية</label>
                      <select required value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500 appearance-none">
                        <option value="" className="bg-[#0a0a14] text-white">اختر المرحلة</option>
                        {GRADES.map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">المدرسة</label>
                    <select required value={formData.schoolId} onChange={(e) => setFormData({...formData, schoolId: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500 appearance-none">
                      <option value="">اختر المدرسة</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-white/2 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">بيانات تسجيل الدخول</h4>
                    <button 
                      type="button"
                      onClick={generateCredentials}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/10"
                    >
                      <Sparkles className="w-3 h-3" />
                      توليد تلقائي
                    </button>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">اسم المستخدم</label>
                      <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500" placeholder="كود الطالب" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">كلمة المرور</label>
                      <input type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500" placeholder="Password@123" />
                    </div>
                  </div>
                </div>

                <button disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-900/20">
                  {isSubmitting ? "جاري الحفظ..." : (isEditMode ? "حفظ التغييرات" : "تأكيد التسجيل")}
                </button>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="bg-[#0f0f1d] rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[640px]">
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest bg-white/5">
                  <th className="px-8 py-5">الطالب</th>
                  <th className="px-8 py-5">اسم المستخدم</th>
                  <th className="px-8 py-5">كلمة المرور</th>
                  <th className="px-8 py-5">المدرسة / الرابط</th>
                  <th className="px-8 py-5">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.filter((u: any) => u.name.includes(searchTerm) || u.username.includes(searchTerm)).map((student: any) => (
                  <tr key={student.id} className="hover:bg-white/2 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold group-hover:scale-110 transition-all">
                          {student.name?.charAt(0) || "S"}
                        </div>
                        <p className="font-bold text-white">{student.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-400 font-mono" dir="ltr">{student.username}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Key className="w-3 h-3 text-amber-500" />
                        <span className="font-mono text-white bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 text-xs shadow-sm shadow-amber-900/10">
                          {student.plainPassword || "Password@123"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col gap-1">
                        <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300 text-xs w-fit">
                          {student.school?.name || "عام"}
                        </span>
                        {student.school?.subdomain && (
                          <span className="text-[10px] text-blue-400 font-mono" dir="ltr">
                            {student.school.subdomain}.lms.com
                          </span>
                        )}
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditClick(student)}
                          className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
