"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Plus, Search, ChevronRight,
  Trash2, Shield, X, Sparkles, Edit,
  GraduationCap, Users, Heart
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/context/NotificationContext";
import { startImpersonation } from '@/lib/auth';
import { useLanguage } from "@/contexts/LanguageContext";

export default function SchoolsManagement() {
  const router = useRouter();
  const { showToast, confirm } = useNotification();
  const { t, language } = useLanguage();
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
      showToast(t('superAdmin.schoolsPage.requiredName') || 'School name is required', 'error');
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
        showToast(t('superAdmin.schoolsPage.createSuccess') || 'School created successfully', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || t('superAdmin.schoolsPage.createFail') || 'Failed to create school', 'error');
      }
    } catch (error) {
      showToast(t('superAdmin.schoolsPage.connError') || 'Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    adminName: "",
    adminUsername: "",
    adminPassword: "",
    adminId: ""
  });

  const openEditModal = (school: any) => {
    const admin = school.users?.[0];
    setSelectedSchool(school);
    setEditFormData({
      name: school.name,
      adminName: admin ? admin.name : "",
      adminUsername: admin ? admin.username : "",
      adminPassword: "", // Empty to keep same
      adminId: admin ? admin.id : ""
    });
    setEditModalOpen(true);
  };

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");
    let hasError = false;

    try {
      // 1. Update School Name
      const schoolRes = await fetch(`${API_URL}/admin/schools/${selectedSchool.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: editFormData.name })
      });

      if (!schoolRes.ok) {
        hasError = true;
      }

      // 2. Update Admin User if adminId exists
      if (editFormData.adminId) {
        const payload: any = {
          name: editFormData.adminName,
          username: editFormData.adminUsername
        };
        if (editFormData.adminPassword) {
          payload.password = editFormData.adminPassword;
        }

        const userRes = await fetch(`${API_URL}/admin/users/${editFormData.adminId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!userRes.ok) {
          hasError = true;
        }
      }

      if (!hasError) {
        showToast(language === 'ar' ? 'تم تحديث بيانات المدرسة بنجاح' : 'School updated successfully', 'success');
        setEditModalOpen(false);
        fetchSchools();
      } else {
        showToast(language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Error updating school or admin', 'error');
        fetchSchools();
      }
    } catch (error) {
      showToast(t('superAdmin.schoolsPage.connError') || 'Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    const confirmed = await confirm(
      t('superAdmin.schoolsPage.deleteConfirmTitle') || 'Confirm Delete',
      t('superAdmin.schoolsPage.deleteConfirmMsg') || 'Are you sure you want to delete this school?'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(API_URL + `/admin/schools/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast(t('superAdmin.schoolsPage.deleteSuccess') || 'Deleted successfully', 'success');
        fetchSchools();
      } else {
        showToast(t('superAdmin.schoolsPage.deleteFail') || 'Failed to delete', 'error');
      }
    } catch (error) {
      showToast(t('superAdmin.schoolsPage.connError') || 'Connection error', 'error');
    }
  };

  const handleImpersonate = async (school: any) => {
    const admin = school.users?.[0];
    if (!admin) {
      showToast(t('superAdmin.schoolsPage.impersonateFail') || 'Admin not found', 'error');
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
        showToast((t('superAdmin.schoolsPage.impersonateSuccess') || 'Logged in as school admin').replace('{name}', school.name), 'success');
      } else {
        showToast(t('superAdmin.schoolsPage.impersonateError') || 'Login failed', 'error');
      }
    } catch (error) {
      showToast(t('superAdmin.schoolsPage.connError') || 'Connection error', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 text-slate-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Premium Command Center Header */}
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-sm p-8 sm:p-12">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-600/10">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3.5xl font-black text-slate-900 tracking-tight mb-2">{t('superAdmin.schoolsPage.title')}</h1>
                <p className="text-slate-400 text-sm sm:text-base font-medium">
                  {language === 'ar' ? 'إدارة وتخصيص المدارس والمنصات التابعة للجهة' : 'Manage and configure schools under your organization'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/10 hover:scale-105 active:scale-95 text-sm sm:text-base cursor-pointer w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              {t('superAdmin.schoolsPage.addSchool')}
            </button>
          </div>
          
          {/* Decorative Glowing Elements */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[60%] bg-purple-600 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[50%] bg-blue-600 blur-[100px] rounded-full"></div>
          </div>
        </div>

        {/* Search */}
        <div className="relative bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <Search className={`absolute ${language === 'ar' ? 'right-8' : 'left-8'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
          <input 
            type="text" 
            placeholder={t('superAdmin.schoolsPage.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-900 font-medium`}
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">{t('superAdmin.schoolsPage.modalTitle')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddSchool} className="space-y-6 text-start" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">{t('superAdmin.schoolsPage.schoolDetailsGroup')}</h4>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolsPage.schoolName')}</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                      placeholder={t('superAdmin.schoolsPage.schoolNamePlaceholder')}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 space-y-4">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {t('superAdmin.schoolsPage.adminDetailsGroup')}
                  </h4>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolsPage.adminName')}</label>
                    <input 
                      type="text" required
                      value={formData.adminName}
                      onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                      placeholder={t('superAdmin.schoolsPage.adminNamePlaceholder')}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolsPage.adminUsername')}</label>
                      <input 
                        type="text" required
                        value={formData.adminUsername}
                        onChange={(e) => setFormData({...formData, adminUsername: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                        placeholder="username" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolsPage.adminPassword')}</label>
                      <input 
                        type="text" required
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                        placeholder="Password@123"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/10 active:scale-95"
                >
                  {isSubmitting ? t('superAdmin.schoolsPage.creatingBtn') : t('superAdmin.schoolsPage.createBtn')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Schools List - converted from cards to a beautiful row list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 overflow-x-auto w-full max-w-[100vw] shadow-sm">
            <div className="overflow-x-auto">
              <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
                <thead>
                  <tr className="bg-slate-50/75 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">{language === 'ar' ? "المدرسة" : "School"}</th>
                    <th className="px-6 py-4">{language === 'ar' ? "الإحصائيات" : "Statistics"}</th>
                    <th className="px-6 py-4">{language === 'ar' ? "بيانات الدخول (المدير)" : "Principal Account"}</th>
                    <th className="px-6 py-4 text-center">{language === 'ar' ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schools.length > 0 ? schools.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((school: any) => (
                    <tr key={school.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* School Name & Info */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Building2 className="w-6.5 h-6.5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-black text-slate-900 leading-tight">{school.name}</h3>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md" dir="ltr">
                                {language === 'ar' ? "معرف: " : "ID: "}{school.id.slice(0, 8)}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-mono mt-1 block" dir="ltr">
                              Subdomain: {school.subdomain || `${school.id.slice(0, 8)}.klevro.tech`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Statistics Badges */}
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                            <span>{t('superAdmin.schoolsPage.studentsCount')}: {school.stats?.students || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                            <Users className="w-3.5 h-3.5 text-purple-500" />
                            <span>{t('superAdmin.schoolsPage.teachersCount')}: {school.stats?.teachers || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{t('superAdmin.schoolsPage.classesCount')}: {school.stats?.classrooms || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                            <Heart className="w-3.5 h-3.5 text-pink-500" />
                            <span>{t('superAdmin.schoolsPage.parentsCount')}: {school.stats?.parents || 0}</span>
                          </div>
                        </div>
                      </td>

                      {/* Principal Credentials */}
                      <td className="px-6 py-5">
                        {school.users?.[0] ? (
                          <div className="flex items-center gap-2 max-w-[240px]">
                            <div className="w-1/2">
                              <label className="block text-[9px] font-bold text-slate-400 mb-0.5">{t('superAdmin.schoolsPage.adminUsername')}</label>
                              <input 
                                readOnly
                                onClick={(e) => { (e.target as HTMLInputElement).select(); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10px] text-slate-700 outline-none font-mono text-center cursor-pointer"
                                value={school.users[0].username || "N/A"}
                                dir="ltr"
                              />
                            </div>
                            <div className="w-1/2">
                              <label className="block text-[9px] font-bold text-slate-400 mb-0.5">{t('superAdmin.schoolsPage.adminPassword')}</label>
                              <input 
                                readOnly
                                onClick={(e) => { (e.target as HTMLInputElement).select(); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10px] text-amber-600 outline-none font-bold text-center cursor-pointer"
                                value={school.users[0].plainPassword || "123456"}
                                dir="ltr"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">{language === 'ar' ? "لا يوجد مسؤول" : "No Principal Account"}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleImpersonate(school)}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-indigo-600/10 active:scale-95 group/btn cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 group-hover/btn:animate-pulse" />
                            <span>{t('superAdmin.schoolsPage.directLogin')}</span>
                          </button>
                          
                          <Link 
                            href={`/super-admin/schools/${school.id}`}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-[10px] font-bold border border-slate-200/50 transition-all text-center"
                          >
                            {language === 'ar' ? "لوحة التحكم" : "Dashboard"}
                          </Link>

                          <button 
                            onClick={() => openEditModal(school)}
                            className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer border border-slate-100"
                            title={language === 'ar' ? "تعديل المدرسة" : "Edit School"}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleDeleteSchool(school.id)}
                            className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-500 hover:text-white transition-all cursor-pointer border border-rose-100"
                            title={language === 'ar' ? "حذف المدرسة" : "Delete School"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="text-center py-20 bg-white">
                        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">{t('superAdmin.schoolsPage.noSchools')}</h3>
                        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold mt-4 hover:bg-indigo-700 transition-all cursor-pointer">{t('superAdmin.schoolsPage.addSchool')}</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit School Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">{language === 'ar' ? 'تعديل بيانات المدرسة' : 'Edit School'}</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleEditSchool} className="space-y-6 text-start" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">{t('superAdmin.schoolsPage.schoolDetailsGroup')}</h4>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolsPage.schoolName')}</label>
                    <input 
                      type="text" required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    />
                  </div>
                </div>

                {editFormData.adminId && (
                  <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 space-y-4">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-4 h-4" /> {t('superAdmin.schoolsPage.adminDetailsGroup')}
                    </h4>
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolsPage.adminName')}</label>
                      <input 
                        type="text" required
                        value={editFormData.adminName}
                        onChange={(e) => setEditFormData({...editFormData, adminName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-500 mb-1">{t('superAdmin.schoolsPage.adminUsername')}</label>
                        <input 
                          type="text" required
                          value={editFormData.adminUsername}
                          onChange={(e) => setEditFormData({...editFormData, adminUsername: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-500 mb-1">
                          {t('superAdmin.schoolsPage.adminPassword')}
                          <span className="text-[10px] text-slate-400 font-normal ml-1 mr-1">
                            ({language === 'ar' ? 'اختياري' : 'Optional'})
                          </span>
                        </label>
                        <input 
                          type="text"
                          value={editFormData.adminPassword}
                          onChange={(e) => setEditFormData({...editFormData, adminPassword: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                          placeholder="********"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/10 active:scale-95 cursor-pointer"
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
