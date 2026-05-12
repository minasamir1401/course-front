"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, Search, CheckCircle, GraduationCap, Shield, Info, RefreshCw
} from "lucide-react";
import { API_URL } from "@/lib/api";

export default function SchoolAdminStudentsPage() {
  const [schoolName, setSchoolName] = useState("مدرستك");
  const [schoolId, setSchoolId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    grade: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password || !formData.grade) {
      alert("يرجى ملء جميع الحقول");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("school_admin_token");
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          role: "STUDENT",
          schoolId: schoolId
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", username: "", password: "", grade: "" });
        fetchStudents(schoolId);
      } else {
        const data = await res.json();
        alert(data.error || "فشل إضافة الطالب");
      }
    } catch (e) {
      alert("خطأ في الاتصال");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchStudents = async (sId: string) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("school_admin_token");

    // Use AbortController to enforce 8s timeout
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
        setStudents(Array.isArray(data) ? data : []);
      } else {
        setError("فشل جلب البيانات.");
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      setError("خطأ في الاتصال.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans rtl" dir="rtl">
        
        {/* Header */}
        <div className="hidden md:flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-3xl md:rounded-[32px] shadow-sm border border-slate-100 gap-6 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-center text-center md:text-right gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-tight">سجل الطلاب</h2>
              <p className="text-slate-500 text-xs md:text-lg font-medium opacity-80">إدارة الطلاب المسجلين في {schoolName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
             <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 md:px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-sm md:text-base"
            >
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              إضافة طالب
            </button>
            <button
              onClick={() => fetchStudents(schoolId)}
              className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-slate-900">تسجيل طالب جديد</h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <Shield className="w-6 h-6" />
                   </button>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-5">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسم الطالب</label>
                      <input 
                        type="text" 
                        required 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 transition-all"
                        placeholder="الاسم الكامل"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم (الكود)</label>
                        <input 
                          type="text" 
                          required 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 transition-all text-center font-mono"
                          placeholder="STD001"
                          value={formData.username}
                          onChange={e => setFormData({...formData, username: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
                        <input 
                          type="text" 
                          required 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 transition-all text-center"
                          placeholder="******"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                   </div>
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">المرحلة التعليمية</label>
                      <select 
                        required 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none text-slate-900 focus:border-blue-500 transition-all appearance-none font-bold"
                        value={formData.grade}
                        onChange={e => setFormData({...formData, grade: e.target.value})}
                      >
                        <option value="" className="bg-white text-slate-900">اختر المرحلة</option>
                        {GRADES.map(g => <option key={g} value={g} className="bg-white text-slate-900">{g}</option>)}
                      </select>
                   </div>

                   <button 
                     disabled={isSubmitting}
                     className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl mt-4 hover:bg-slate-800 transition-all disabled:opacity-50"
                   >
                     {isSubmitting ? "جاري الحفظ..." : "تأكيد التسجيل"}
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* Search and Table */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4 md:gap-6">
            <div className="flex justify-between items-center w-full md:w-auto">
              <h3 className="text-base md:text-xl font-black text-slate-900 flex items-center gap-2 md:gap-3">
                 الطلاب المسجلين
                 <span className="text-[10px] md:text-xs bg-blue-50 text-blue-600 px-2 md:px-3 py-1 rounded-full font-bold">{filteredStudents.length}</span>
              </h3>
              <div className="flex md:hidden gap-2">
                <button onClick={() => setIsModalOpen(true)} className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                  <Users className="w-4 h-4" />
                </button>
                <button onClick={() => fetchStudents(schoolId)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="بحث..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-11 pl-4 outline-none focus:border-blue-500 transition-all font-bold text-xs md:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-right">
                <thead>
                   <tr className="text-slate-400 text-[11px] font-black uppercase tracking-widest bg-slate-50/50">
                      <th className="px-6 py-5 rounded-r-2xl">الطالب</th>
                      <th className="px-6 py-5">اسم المستخدم</th>
                      <th className="px-6 py-5">المرحلة</th>
                      <th className="px-6 py-5">تاريخ الانضمام</th>
                      <th className="px-6 py-5 rounded-l-2xl">الحالة</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {loading ? (
                     <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">جاري التحميل...</td></tr>
                   ) : filteredStudents.length === 0 ? (
                     <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">لا يوجد طلاب</td></tr>
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
                        <td className="px-6 py-5 text-xs font-mono text-slate-500" dir="ltr">{student.username}</td>
                        <td className="px-6 py-5">
                           <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black">{student.grade || "غير محدد"}</span>
                        </td>
                        <td className="px-6 py-5 text-slate-500 text-xs font-bold">
                           {student.createdAt ? new Date(student.createdAt).toLocaleDateString('ar-EG') : "—"}
                        </td>
                        <td className="px-6 py-5">
                           <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px]">
                              <CheckCircle className="w-3 h-3" /> نشط
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
