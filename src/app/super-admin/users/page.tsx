"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users, Plus, Search, Shield,
  User, ChevronRight,
  Trash2, Key, X, GraduationCap, School,
  Sparkles, Edit
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/context/NotificationContext";
import { Suspense } from 'react';
import { startImpersonation } from '@/lib/auth';
import { useLanguage } from "@/contexts/LanguageContext";

type UserRole = 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN' | 'EXAM_SUPERVISOR';

export default function UsersManagement() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <UsersManagementContent />
    </Suspense>
  );
}

function UsersManagementContent() {
  const router = useRouter();
  const { showToast, confirm } = useNotification();
  const { t, language } = useLanguage();
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
      showToast(t('usersPage.selectSchoolError') || 'Please select a school', 'error');
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
        showToast(t('usersPage.createSuccess') || 'User created successfully', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || t('usersPage.createFail') || 'Failed to create user', 'error');
      }
    } catch (error) {
      showToast(t('usersPage.connError') || 'Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: "", // Leave empty unless changing
      schoolId: user.schoolId || "",
      role: user.role,
      grade: user.grade || ""
    });
    setEditModalOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formData.schoolId && formData.role !== 'SUPER_ADMIN') {
      showToast(t('usersPage.selectSchoolError') || 'Please select a school', 'error');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");
    try {
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password

      const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditModalOpen(false);
        fetchData();
        showToast(language === 'ar' ? 'تم تحديث المستخدم بنجاح' : 'User updated successfully', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || (language === 'ar' ? 'فشل تحديث المستخدم' : 'Failed to update user'), 'error');
      }
    } catch (error) {
      showToast(t('usersPage.connError') || 'Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const confirmed = await confirm(
      language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
      t('usersPage.deleteConfirm') || 'Are you sure you want to delete this user?'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        showToast(t('usersPage.deleteSuccess') || 'Deleted successfully', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || t('usersPage.deleteFail') || 'Failed to delete', 'error');
      }
    } catch (error) {
      showToast(t('usersPage.connError') || 'Connection error', 'error');
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
        
        // Show success toast with dynamic template
        showToast(
          language === 'ar' 
            ? `تم تسجيل الدخول بنجاح كـ ${user.name}` 
            : `Successfully logged in as ${user.name}`, 
          'success'
        );

        // Redirect
        if (user.role === 'STUDENT') {
          router.push("/dashboard");
        } else if (user.role === 'SCHOOL_ADMIN' || user.role === 'TEACHER') {
          router.push("/school-admin");
        }
      } else {
        showToast(t('usersPage.impersonateFail') || 'Login failed', 'error');
      }
    } catch (error) {
      showToast(t('usersPage.connError') || 'Connection error', 'error');
    }
  };

  const filteredUsers = users.filter((u: any) => {
    if (u.role === 'SUPER_ADMIN') return false;
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

  const getGradeName = (grade: string) => {
    if (language === 'ar') return grade;
    const translations: { [key: string]: string } = {
      "الصف الأول الابتدائي": "1st Elementary",
      "الصف الثاني الابتدائي": "2nd Elementary",
      "الصف الثالث الابتدائي": "3rd Elementary",
      "الصف الرابع الابتدائي": "4th Elementary",
      "الصف الخامس الابتدائي": "5th Elementary",
      "الصف السادس الابتدائي": "6th Elementary",
      "الصف الأول الإعدادي": "1st Middle School",
      "الصف الثاني الإعدادي": "2nd Middle School",
      "الصف الثالث الإعدادي": "3rd Middle School",
      "الصف الأول الثانوي": "1st High School",
      "الصف الثاني الثانوي": "2nd High School",
      "الصف الثالث الثانوي": "3rd High School"
    };
    return translations[grade] || grade;
  };

  const tabs = [
    { id: 'ALL', label: t('usersPage.all'), icon: Users },
    { id: 'SCHOOL_ADMIN', label: t('usersPage.schoolAdmins'), icon: Shield },
    { id: 'TEACHER', label: t('usersPage.teachers'), icon: User },
    { id: 'STUDENT', label: t('usersPage.students'), icon: GraduationCap },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 text-slate-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-sm p-8 sm:p-12">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-600/10">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3.5xl font-black text-slate-900 tracking-tight mb-2">{t('usersPage.title')}</h1>
                <p className="text-slate-400 text-sm sm:text-base font-medium">{t('usersPage.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/10 hover:scale-105 active:scale-95 text-sm sm:text-base cursor-pointer w-full md:w-auto"
            >
              <Plus className="w-5 h-5" />
              {t('usersPage.addUser')}
            </button>
          </div>

          {/* Decorative Glowing Elements */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[60%] bg-purple-600 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[50%] bg-blue-600 blur-[100px] rounded-full"></div>
          </div>
        </div>



        {/* Tabs & Filters */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? "bg-white text-slate-950 shadow-sm" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 relative group">
              <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors`} />
              <input
                type="text"
                placeholder={t('usersPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-white border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm`}
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-800 font-bold shadow-sm"
              >
                <option value="ALL">{t('usersPage.allSchools')}</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {(activeTab === 'STUDENT' || activeTab === 'ALL') && (
              <div className="md:col-span-3">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-800 font-bold shadow-sm"
                >
                  <option value="ALL">{language === 'ar' ? 'جميع الصفوف الدراسية' : 'All Grades'}</option>
                  <optgroup label={language === 'ar' ? "المرحلة الابتدائية" : "Elementary Stage"}>
                    {GRADES.slice(0, 6).map(g => <option key={g} value={g}>{getGradeName(g)}</option>)}
                  </optgroup>
                  <optgroup label={language === 'ar' ? "المرحلة الإعدادية" : "Middle School Stage"}>
                    {GRADES.slice(6, 9).map(g => <option key={g} value={g}>{getGradeName(g)}</option>)}
                  </optgroup>
                  <optgroup label={language === 'ar' ? "المرحلة الثانوية" : "High School Stage"}>
                    {GRADES.slice(9, 12).map(g => <option key={g} value={g}>{getGradeName(g)}</option>)}
                  </optgroup>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Add User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">{t('usersPage.addModalTitle')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-5" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.fullName')}</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    placeholder={language === 'ar' ? "مثال: أحمد محمد" : "e.g. John Doe"}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.username')}</label>
                    <input
                      type="text" required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                      placeholder="username"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.password')}</label>
                    <input
                      type="text" required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                      placeholder="Password@123"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.role')}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  >
                    <option value="SCHOOL_ADMIN">{t('usersPage.schoolAdmin')}</option>
                    <option value="TEACHER">{t('usersPage.teacher')}</option>
                    <option value="STUDENT">{t('usersPage.student')}</option>
                    <option value="EXAM_SUPERVISOR">{t('usersPage.examSupervisor')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.school')}</label>
                  <select
                    required={formData.role !== 'SUPER_ADMIN'}
                    value={formData.schoolId}
                    onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  >
                    <option value="">{t('usersPage.selectSchool')}</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {formData.role === 'STUDENT' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.grade')}</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    >
                      <option value="">{t('usersPage.selectGrade')}</option>
                      <optgroup label={language === 'ar' ? "المرحلة الابتدائية" : "Elementary Stage"}>
                        {GRADES.slice(0, 6).map(g => <option key={g} value={g}>{getGradeName(g)}</option>)}
                      </optgroup>
                      <optgroup label={language === 'ar' ? "المرحلة الإعدادية" : "Middle School Stage"}>
                        {GRADES.slice(6, 9).map(g => <option key={g} value={g}>{getGradeName(g)}</option>)}
                      </optgroup>
                      <optgroup label={language === 'ar' ? "المرحلة الثانوية" : "High School Stage"}>
                        {GRADES.slice(9, 12).map(g => <option key={g} value={g}>{getGradeName(g)}</option>)}
                      </optgroup>
                    </select>
                  </div>
                )}
                <button
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl mt-6 transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-600/10 active:scale-95"
                >
                  {isSubmitting ? t('usersPage.creatingBtn') : t('usersPage.createBtn')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Users Table / Grid (Highly Responsive) */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5">{t('usersPage.userHeader')}</th>
                      <th className="px-8 py-5">{t('usersPage.loginCredentials')}</th>
                      <th className="px-8 py-5">{t('usersPage.roleHeader')}</th>
                      <th className="px-8 py-5">{t('usersPage.schoolGrade')}</th>
                      <th className="px-8 py-5 text-center">{t('usersPage.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user: any) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:scale-105 transition-all">
                              {user.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base">{user.name}</p>
                              <p className="text-xs text-slate-400 font-medium font-mono" dir="ltr">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-amber-500/70" />
                            <span className="font-mono text-slate-700 bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/10 text-xs">
                              {user.plainPassword || "********"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border tracking-wider ${
                              user.role === 'SUPER_ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              user.role === 'SCHOOL_ADMIN' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                              user.role === 'TEACHER' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              user.role === 'STUDENT' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-700 text-sm font-bold">
                              <School className="w-4 h-4 text-slate-400" />
                              {user.school?.name || t('usersPage.publicPlatform')}
                            </div>
                            {user.grade && (
                              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                                <GraduationCap className="w-4 h-4 text-slate-400" />
                                {getGradeName(user.grade)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleImpersonate(user)}
                              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-600/10 active:scale-95 group/btn cursor-pointer"
                              title="Login as User"
                            >
                              <Sparkles className="w-4 h-4 group-hover/btn:animate-pulse" />
                              <span>{t('usersPage.directLogin')}</span>
                            </button>
                            <button 
                              onClick={() => openEditModal(user)}
                              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 cursor-pointer"
                              title={language === 'ar' ? 'تعديل' : 'Edit'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {user.role !== 'SUPER_ADMIN' && (
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all border border-slate-100 cursor-pointer"
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
            </div>

            {/* Mobile / Tablet Responsive Cards View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredUsers.map((user: any) => (
                <div key={user.id} className="bg-white p-5 sm:p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{user.name}</h4>
                        <p className="text-xs text-slate-400 font-mono" dir="ltr">@{user.username}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border tracking-wider ${
                        user.role === 'SUPER_ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        user.role === 'SCHOOL_ADMIN' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        user.role === 'TEACHER' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        user.role === 'STUDENT' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                      {user.role}
                    </span>
                  </div>

                  <div className="space-y-3 py-3 border-y border-slate-50 text-start" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold">{language === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                      <span className="font-mono text-slate-700 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 font-bold">
                        {user.plainPassword || "********"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold">{language === 'ar' ? 'المدرسة' : 'School'}</span>
                      <span className="font-bold text-slate-700">{user.school?.name || t('usersPage.publicPlatform')}</span>
                    </div>
                    {user.grade && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold">{language === 'ar' ? 'الصف' : 'Grade'}</span>
                        <span className="font-bold text-slate-700">{getGradeName(user.grade)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer"
                      title={language === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleImpersonate(user)}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>{t('usersPage.directLogin')}</span>
                    </button>
                    {user.role !== 'SUPER_ADMIN' && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">{t('usersPage.noUsersFound')}</p>
              </div>
            )}
          </>
        )}

        {/* Edit User Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">{language === 'ar' ? 'تعديل بيانات المستخدم' : 'Edit User Data'}</h3>
                <button onClick={() => setEditModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditUser} className="space-y-5" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.fullName')}</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.username')}</label>
                    <input
                      type="text" required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">
                      {t('usersPage.password')}
                      <span className="text-[10px] text-slate-400 font-normal ml-2 mr-2">
                        ({language === 'ar' ? 'اختياري' : 'Optional'})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                      placeholder="********"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.role')}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  >
                    <option value="SCHOOL_ADMIN">{t('usersPage.schoolAdmin')}</option>
                    <option value="TEACHER">{t('usersPage.teacher')}</option>
                    <option value="STUDENT">{t('usersPage.student')}</option>
                    <option value="EXAM_SUPERVISOR">{t('usersPage.examSupervisor')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.school')}</label>
                  <select
                    required={formData.role !== 'SUPER_ADMIN'}
                    value={formData.schoolId}
                    onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  >
                    <option value="">{t('usersPage.selectSchool')}</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {formData.role === 'STUDENT' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">{t('usersPage.grade')}</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    >
                      <option value="">{t('usersPage.selectGrade')}</option>
                      {GRADES.map(g => <option key={g} value={g}>{getGradeName(g)}</option>)}
                    </select>
                  </div>
                )}
                <button
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl mt-6 transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-600/10 active:scale-95"
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
