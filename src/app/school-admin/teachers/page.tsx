"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, Plus, Search, Trash2, Edit2, Shield, X, Mail, Phone, BookOpen, GraduationCap
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

export default function SchoolAdminTeachersPage() {
  const { showToast, confirm } = useNotification();
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("مدرستك");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    subject: "", 
    grade: "",   
    phone: "",
  });

  useEffect(() => {
    try {
      const userData = localStorage.getItem("school_admin_user");
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.schoolName) setSchoolName(parsed.schoolName);
        if (parsed.schoolId) {
          setSchoolId(parsed.schoolId);
          fetchTeachers(parsed.schoolId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchTeachers = async (sId: string) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("school_admin_token");
    
    if (!formData.name || !formData.subject || !formData.grade) {
      showToast("يرجى إدخال اسم المدرس وتخصصه وصفه", "error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          ...formData, 
          role: "TEACHER", 
          schoolId: schoolId 
        })
      });
      
      if (res.ok) {
        showToast("تم إضافة المدرس بنجاح", "success");
        setIsModalOpen(false);
        setFormData({ name: "", username: "", password: "", subject: "", grade: "", phone: "" });
        fetchTeachers(schoolId);
      } else {
        const d = await res.json();
        showToast(d.error || "فشل إضافة المدرس", "error");
      }
    } catch (e) {
      showToast("خطأ في الاتصال", "error");
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    const confirmed = await confirm(
      "تأكيد الحذف",
      "هل أنت متأكد من حذف هذا المدرس؟ سيتم سحب صلاحيات الدخول الخاصة به."
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("تم حذف المدرس بنجاح", "success");
        fetchTeachers(schoolId);
      } else {
        showToast("فشل حذف المدرس", "error");
      }
    } catch (e) {
      showToast("خطأ في الاتصال", "error");
    }
  };

  const filtered = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 rtl" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-sm">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">إدارة المدرسين</h2>
              <p className="text-slate-500 font-medium opacity-80">{schoolName}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" /> 
            إضافة مدرس جديد
          </button>
        </div>



        {/* Teachers Grid */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
           <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h3 className="text-xl font-black text-slate-800">قائمة الكادر التعليمي</h3>
              <div className="relative w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="ابحث عن مدرس..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-indigo-500 transition-all font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-10 text-center animate-pulse text-slate-400 font-bold">جاري التحميل...</div>
              ) : filtered.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-[35px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">
                         {teacher.name.charAt(0)}
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800">{teacher.name}</h4>
                         <p className="text-xs text-indigo-600 font-bold">{teacher.subject}</p>
                      </div>
                   </div>
                   <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                         <GraduationCap className="w-3.5 h-3.5" /> الصف: {teacher.grade}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                         <Mail className="w-3.5 h-3.5" /> {teacher.username}
                      </div>
                   </div>
                   <div className="flex justify-end pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-800">تسجيل مدرس جديد</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800"><X /></button>
               </div>
               
               <form onSubmit={handleAddTeacher} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-sm font-black text-slate-500 mr-2">الاسم الكامل</label>
                     <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold" placeholder="أ. أحمد محمد" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">تخصص المدرس</label>
                        <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold" placeholder="مثال: SAT Math" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">الصف الخاص به</label>
                        <select
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-black text-slate-900 transition-all appearance-none"
                          value={formData.grade}
                          onChange={e => setFormData({ ...formData, grade: e.target.value })}
                        >
                          <option value="" className="bg-white text-slate-900">اختر الصف</option>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">اسم المستخدم</label>
                        <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold" placeholder="username" dir="ltr" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">كلمة المرور</label>
                        <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold" placeholder="Pass@123" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                     </div>
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-900/20 hover:scale-105 transition-all">إضافة المدرس</button>
               </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
