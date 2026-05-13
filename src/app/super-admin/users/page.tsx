"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users, Plus, Search, Shield,
  User, Mail, ChevronRight,
  MoreVertical, Edit2, Trash2, Key, X, LogIn, GraduationCap, School,
  UserCog, ArrowLeftCircle, Sparkles
} from "lucide-react";
import Link from "next/link";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import { useNotification } from "@/context/NotificationContext";
import { Suspense } from 'react';
import { startImpersonation } from '@/lib/auth';

type UserRole = 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN' | 'EXAM_SUPERVISOR';

export default function UsersManagement() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a14] flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>}>
      <UsersManagementContent />
    </Suspense>
  );
}

function UsersManagementContent() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<UserRole | 'ALL'>('ALL');
  const [selectedSchool, setSelectedSchool] = useState<string>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    schoolId: "",
    role: "SCHOOL_ADMIN" as UserRole,
    grade: ""
  });

  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    
    if (roleParam) {
      setActiveTab(roleParam as any);
    } else {
      setActiveTab('ALL');
    }

    fetchData();
  }, [router, roleParam]);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetch(API_URL + "/admin/users", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(API_URL + "/admin/schools", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : (data.users || []));
      }
      if (schoolsRes.ok) {
        const data = await schoolsRes.json();
        setSchools(Array.isArray(data) ? data : (data.schools || []));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolId && formData.role !== 'SUPER_ADMIN') {
      showToast("يرجى اختيار المدرسة", 'error');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(API_URL + "/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", username: "", password: "", schoolId: "", role: "SCHOOL_ADMIN", grade: "" });
        fetchData();
        showToast("تم إنشاء المستخدم بنجاح", 'success');
      } else {
        const data = await res.json();
        showToast(data.error || "فشل إنشاء المستخدم", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالسيرفر", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }

    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        showToast("تم حذف المستخدم بنجاح", 'success');
      } else {
        const data = await res.json();
        showToast(data.error || "فشل حذف المستخدم", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالسيرفر", 'error');
    }
  };

  const handleImpersonate = async (user: any) => {
    const token = localStorage.getItem("super_admin_token");
    
    try {
      const res = await fetch(`${API_URL}/admin/impersonate/${user.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.ok) {
        const data = await res.json();
        
        // Use the centralized helper to handle token switching
        startImpersonation(data.token, data.user, user.role);
        
        // Redirect
        if (user.role === 'STUDENT' || user.role === 'TEACHER') {
          router.push("/dashboard");
        } else if (user.role === 'SCHOOL_ADMIN') {
          router.push("/school-admin");
        }
      } else {
        showToast("فشل الدخول كمسخدم", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال", 'error');
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'ALL' || u.role === activeTab;
    const matchesSchool = selectedSchool === 'ALL' || u.schoolId === selectedSchool;
    const matchesGrade = selectedGrade === 'ALL' || u.grade === selectedGrade;
    
    return matchesSearch && matchesTab && matchesSchool && matchesGrade;
  });

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const tabs = [
    { id: 'ALL', label: 'الكل', icon: Users },
    { id: 'SCHOOL_ADMIN', label: 'مديري المدارس', icon: Shield },
    { id: 'TEACHER', label: 'المعلمون', icon: User },
    { id: 'STUDENT', label: 'الطلاب', icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-slate-200" dir="rtl">
      <SuperAdminSidebar />

      <main className="lg:mr-64 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-white">إدارة المستخدمين</h2>
            <p className="text-slate-500 mt-1">عرض وإدارة جميع مستخدمي المنصة</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-lg shadow-white/5"
          >
            <Plus className="w-5 h-5" />
            إضافة مستخدم جديد
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit border border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-white text-black shadow-xl" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
          <div className="md:col-span-6 relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="البحث عن مستخدم (الاسم أو الكود)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0f0f1d] border border-white/5 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-white/20 transition-all text-white font-medium shadow-inner"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full bg-[#0f0f1d] border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-white/20 transition-all text-white font-bold"
            >
              <option value="ALL">كل المدارس</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {(activeTab === 'STUDENT' || activeTab === 'ALL') && (
            <div className="md:col-span-3">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-[#0f0f1d] border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-white/20 transition-all text-white font-bold appearance-none"
              >
                <option value="ALL" className="bg-[#0a0a14] text-white">كل الصفوف الدراسية</option>
                <optgroup label="المرحلة الابتدائية" className="bg-[#0a0a14] text-white">
                  {GRADES.slice(0, 6).map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                </optgroup>
                <optgroup label="المرحلة الإعدادية" className="bg-[#0a0a14] text-white">
                  {GRADES.slice(6, 9).map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                </optgroup>
                <optgroup label="المرحلة الثانوية" className="bg-[#0a0a14] text-white">
                  {GRADES.slice(9, 12).map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f0f1d] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white">إضافة مستخدم جديد</h3>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"><X /></button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">الاسم الكامل</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/30 transition-all"
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">اسم المستخدم</label>
                    <input
                      type="text" required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/30 transition-all"
                      placeholder="username"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">كلمة المرور</label>
                    <input
                      type="text" required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/30 transition-all"
                      placeholder="Password@123"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">الصلاحية</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/30 transition-all"
                  >
                    <option value="SCHOOL_ADMIN">مدير مدرسة</option>
                    <option value="TEACHER">مدرس</option>
                    <option value="STUDENT">طالب</option>
                    <option value="EXAM_SUPERVISOR">مشرف امتحانات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">المدرسة</label>
                  <select
                    required={formData.role !== 'SUPER_ADMIN'}
                    value={formData.schoolId}
                    onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/30 transition-all"
                  >
                    <option value="">اختر المدرسة</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {formData.role === 'STUDENT' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">الصف الدراسي</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/30 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0a0a14] text-white">اختر الصف الدراسي</option>
                      <optgroup label="المرحلة الابتدائية" className="bg-[#0a0a14] text-white">
                        {GRADES.slice(0, 6).map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                      </optgroup>
                      <optgroup label="المرحلة الإعدادية" className="bg-[#0a0a14] text-white">
                        {GRADES.slice(6, 9).map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                      </optgroup>
                      <optgroup label="المرحلة الثانوية" className="bg-[#0a0a14] text-white">
                        {GRADES.slice(9, 12).map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                      </optgroup>
                    </select>
                  </div>
                )}
                <button
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-black py-4 rounded-xl mt-6 transition-all hover:bg-slate-100 disabled:opacity-50 shadow-xl shadow-white/5"
                >
                  {isSubmitting ? "جاري الحفظ..." : "إنشاء الحساب الجديد"}
                </button>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-white/10 border-t-white rounded-full"></div>
          </div>
        ) : (
          <div className="bg-[#0f0f1d] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-widest bg-white/2">
                    <th className="px-8 py-6">المستخدم</th>
                    <th className="px-8 py-6">بيانات الدخول</th>
                    <th className="px-8 py-6">الدور</th>
                    <th className="px-8 py-6">المدرسة / الصف</th>
                    <th className="px-8 py-6 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-white/[0.03] transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white font-black text-xl group-hover:scale-110 transition-all border border-white/10">
                            {user.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg">{user.name}</p>
                            <p className="text-xs text-slate-500 font-medium font-mono" dir="ltr">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-500/70" />
                          <span className="font-mono text-white bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/10 text-xs">
                            {user.plainPassword || "********"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border tracking-wider ${
                            user.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            user.role === 'SCHOOL_ADMIN' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                            user.role === 'TEACHER' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            user.role === 'STUDENT' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                            <School className="w-4 h-4 text-slate-500" />
                            {user.school?.name || "منصة عامة"}
                          </div>
                          {user.grade && (
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                              <GraduationCap className="w-4 h-4" />
                              {user.grade}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => handleImpersonate(user)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-900/20 active:scale-95 group/btn"
                            title="Login as User"
                          >
                            <Sparkles className="w-4 h-4 group-hover/btn:animate-pulse" />
                            <span>دخول مباشر</span>
                          </button>
                          {user.role !== 'SUPER_ADMIN' && (
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 transition-all border border-white/5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>لم يتم العثور على مستخدمين يطابقون بحثك</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

