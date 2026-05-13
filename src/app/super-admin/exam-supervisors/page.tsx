"use client";

import React, { useState, useEffect } from "react";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { 
  Users, Search, Shield, UserCheck, 
  Trash2, Edit2, Star, CheckCircle, 
  X, ShieldCheck, Mail, Building2, Layout
} from "lucide-react";

export default function ExamSupervisorsManagement() {
  const { showToast, confirm } = useNotification();
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(`${API_URL}/admin/users?role=EXAM_SUPERVISOR`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSupervisors(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const confirmed = await confirm(
      "سحب الصلاحية",
      "هل أنت متأكد من سحب صلاحية الإشراف عن هذا المستخدم؟ سيتحول إلى مدرس عادي."
    );
    if (!confirmed) return;

    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ role: "TEACHER" }),
      });
      if (res.ok) {
        showToast("تم سحب صلاحية الإشراف بنجاح", 'success');
        fetchSupervisors();
      }
    } catch {
      showToast("خطأ في الاتصال", 'error');
    }
  };

  const filtered = supervisors.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.username?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#070710] text-slate-200" dir="rtl">
      <SuperAdminSidebar />
      <main className="lg:mr-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#1a1a3a] to-[#0d0d1e] rounded-[40px] p-8 sm:p-12 overflow-hidden border border-white/5 mb-10 shadow-2xl">
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-2xl shadow-amber-900/40">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">مشرفو الامتحانات المركزية</h1>
                <p className="text-slate-400 font-medium text-lg">المستخدمون المعتمدون لمراقبة وإدارة الامتحانات على مستوى المنصة.</p>
              </div>
            </div>
            
            <div className="flex bg-white/5 rounded-2xl p-4 items-center gap-4 border border-white/10">
               <div className="text-center px-4 border-l border-white/10">
                  <p className="text-2xl font-black text-white">{supervisors.length}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">إجمالي المشرفين</p>
               </div>
               <div className="text-center px-4">
                  <p className="text-2xl font-black text-emerald-400">نشط</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">حالة الصلاحية</p>
               </div>
            </div>
          </div>
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-600/10 blur-[100px] rounded-full pointer-events-none" />
        </div>

        {/* Search */}
        <div className="mb-8 relative max-w-2xl">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="البحث باسم المشرف أو الكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f0f1e] border border-white/10 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-amber-500/50 text-white font-medium transition-all shadow-inner"
          />
        </div>

        {/* Supervisors Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((supervisor) => (
              <div key={supervisor.id} className="bg-[#0f0f1e] rounded-[35px] border border-white/5 p-8 relative overflow-hidden group hover:border-amber-500/20 transition-all shadow-xl">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-500/40 group-hover:bg-amber-500 transition-colors" />
                
                <div className="flex justify-between items-start mb-6">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl font-black text-amber-500 shadow-lg group-hover:scale-110 transition-transform">
                      {supervisor.name?.charAt(0)}
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/10">EXAM SUPERVISOR</span>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono" dir="ltr">{supervisor.username}</p>
                   </div>
                </div>

                <h3 className="text-xl font-black text-white mb-6">{supervisor.name}</h3>

                <div className="space-y-4 mb-8">
                   <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <span>{supervisor.school?.name || "الإدارة المركزية"}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>صلاحية الوصول للامتحانات المركزية</span>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-3">
                   <button 
                     onClick={() => handleRevoke(supervisor.id)}
                     className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                   >
                     <Trash2 className="w-3.5 h-3.5" /> سحب الصلاحية
                   </button>
                   <button className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all">
                      <Edit2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white/2 rounded-[40px] border-2 border-dashed border-white/5">
                 <UserCheck className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                 <h4 className="text-xl font-black text-slate-500">لا يوجد مشرفو امتحانات حالياً</h4>
                 <p className="text-slate-600 mt-2">يمكنك تعيين المشرفين من صفحة "المستخدمون"</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
