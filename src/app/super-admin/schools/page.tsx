"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Plus, Search, MapPin, 
  User, Phone, Mail, ChevronRight,
  MoreVertical, Edit2, Trash2, Shield, X, Lock, LogIn, Sparkles,
  GraduationCap, Users, Heart
} from "lucide-react";
import Link from "next/link";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import { useNotification } from "@/context/NotificationContext";
import { startImpersonation } from '@/lib/auth';

export default function SchoolsManagement() {
  const router = useRouter();
  const { showToast, confirm } = useNotification();
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    adminName: "",
    adminUsername: "",
    adminPassword: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchSchools();
  }, [router]);

  const fetchSchools = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(API_URL + "/admin/schools", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const schoolsList = Array.isArray(data) ? data : (data.schools || []);
        setSchools(schoolsList);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("اسم المدرسة مطلوب", 'error');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(API_URL + "/admin/schools", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setFormData({ name: "", subdomain: "", adminName: "", adminUsername: "", adminPassword: "" });
        setIsModalOpen(false);
        fetchSchools();
      } else {
        const data = await res.json();
        showToast(data.error || "فشل إنشاء المدرسة", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالسيرفر", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    const confirmed = await confirm(
      "تأكيد الحذف",
      "هل أنت متأكد من حذف هذه المدرسة؟ سيتم حذف جميع البيانات المرتبطة بها (الطلاب، المدرسين، الامتحانات)."
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(API_URL + `/admin/schools/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("تم حذف المدرسة بنجاح", 'success');
        fetchSchools();
      } else {
        showToast("فشل حذف المدرسة", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالسيرفر", 'error');
    }
  };

  const handleImpersonate = async (school: any) => {
    const admin = school.users?.[0];
    if (!admin) {
      showToast("لا يوجد مدير مدرسة مسجل لهذه المدرسة", 'error');
      return;
    }

    const token = localStorage.getItem("super_admin_token");
    
    try {
      const res = await fetch(`${API_URL}/admin/impersonate/${admin.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.ok) {
        const data = await res.json();
        
        // Use the centralized helper
        startImpersonation(data.token, data.user, 'SCHOOL_ADMIN');
        
        router.push("/school-admin");
        showToast(`تم الدخول بنجاح كمدير لـ ${school.name}`, 'success');
      } else {
        showToast("فشل الدخول كمسخدم", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال", 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-slate-200" dir="rtl">
      <SuperAdminSidebar />

      <main className="lg:mr-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {/* Navbar-like Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white">إدارة المدارس</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 sm:px-8 sm:py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            إضافة مدرسة
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 sm:mb-10 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="البحث عن مدرسة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f0f1d] border border-white/5 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-purple-500/50 transition-all text-white font-medium"
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f0f1d] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">إضافة مدرسة ومدير جديد</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
              </div>
              <form onSubmit={handleAddSchool} className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">بيانات المدرسة</h4>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">اسم المدرسة</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all"
                      placeholder="مدرسة النيل الحديثة"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-4">
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3" /> بيانات مدير المدرسة
                  </h4>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">اسم المدير</label>
                    <input 
                      type="text" required
                      value={formData.adminName}
                      onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all"
                      placeholder="أحمد محمد"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">اسم المستخدم</label>
                      <input 
                        type="text" required
                        value={formData.adminUsername}
                        onChange={(e) => setFormData({...formData, adminUsername: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all"
                        placeholder="username" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">كلمة المرور</label>
                      <input 
                        type="text" required
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-purple-500 transition-all"
                        placeholder="Password@123"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? "جاري الإنشاء..." : "إنشاء المدرسة والمدير"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Schools List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {schools.length > 0 ? schools.filter((s: any) => s.name.includes(searchTerm)).map((school: any) => (
              <div key={school.id} className="bg-[#0f0f1d] rounded-3xl border border-white/5 p-6 hover:border-purple-500/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <button 
                    onClick={() => handleDeleteSchool(school.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">{school.name}</h3>
                  <Link 
                    href={`/super-admin/schools/${school.id}`}
                    className="text-xs font-black text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    إدارة <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white/5 p-2 rounded-lg">
                      <GraduationCap className="w-3 h-3 text-blue-400" />
                      <span>الطلاب: {school.stats?.students || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white/5 p-2 rounded-lg">
                      <Users className="w-3 h-3 text-purple-400" />
                      <span>المدرسين: {school.stats?.teachers || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white/5 p-2 rounded-lg">
                      <Building2 className="w-3 h-3 text-emerald-400" />
                      <span>الفصول: {school.stats?.classrooms || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white/5 p-2 rounded-lg">
                      <Heart className="w-3 h-3 text-pink-400" />
                      <span>أولياء الأمور: {school.stats?.parents || 0}</span>
                    </div>
                  </div>

                  {/* Admin Credentials Display */}
                  {school.users?.[0] && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">بيانات دخول المدير</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">اسم المستخدم</label>
                          <input 
                            readOnly
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 px-3 text-xs text-white outline-none font-mono"
                            value={school.users?.[0]?.username || "N/A"}
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">كلمة المرور</label>
                          <input 
                            readOnly
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 px-3 text-xs text-amber-400 outline-none font-bold"
                            value={school.users?.[0]?.plainPassword || "123456"}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">School ID</span>
                      <span className="text-[10px] text-slate-500 font-mono">{school.id.slice(0, 8)}</span>
                    </div>
                    <button 
                      onClick={() => handleImpersonate(school)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-indigo-900/20 active:scale-95 group/btn"
                    >
                      <Sparkles className="w-3 h-3 group-hover/btn:animate-pulse" />
                      <span>دخول مباشر</span>
                    </button>
                  </div>
                  <Link 
                    href={`/super-admin/schools/${school.id}`}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl text-center text-xs font-bold border border-white/5 transition-all"
                  >
                    فتح لوحة إدارة المدرسة الكاملة
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-20 bg-[#0f0f1d] rounded-3xl border border-white/5">
                <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-500">لا توجد مدارس مسجلة</h3>
                <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-8 py-3 rounded-2xl font-bold mt-4">إضافة مدرسة</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
