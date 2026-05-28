"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Plus, Search, ChevronRight,
  Trash2, Shield, X, Sparkles,
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

        {/* Schools List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {schools.length > 0 ? schools.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((school: any) => (
              <div key={school.id} className="bg-white rounded-[32px] border border-slate-100 p-6 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <button 
                      onClick={() => handleDeleteSchool(school.id)}
                      className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-900">{school.name}</h3>
                    <Link 
                      href={`/super-admin/schools/${school.id}`}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <span>{t('superAdmin.schoolsPage.manage')}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${language === 'ar' ? '' : 'rotate-180'}`} />
                    </Link>
                  </div>
                  
                  <div className="space-y-4 mb-6 text-start" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl">
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                        <span>{t('superAdmin.schoolsPage.studentsCount')}: {school.stats?.students || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span>{t('superAdmin.schoolsPage.teachersCount')}: {school.stats?.teachers || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <span>{t('superAdmin.schoolsPage.classesCount')}: {school.stats?.classrooms || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span>{t('superAdmin.schoolsPage.parentsCount')}: {school.stats?.parents || 0}</span>
                      </div>
                    </div>

                    {/* Admin Credentials Display */}
                    {school.users?.[0] && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">{t('superAdmin.schoolsPage.adminLoginInfo')}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">{t('superAdmin.schoolsPage.adminUsername')}</label>
                            <input 
                              readOnly
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none font-mono"
                              value={school.users?.[0]?.username || "N/A"}
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">{t('superAdmin.schoolsPage.adminPassword')}</label>
                            <input 
                              readOnly
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-amber-600 outline-none font-bold"
                              value={school.users?.[0]?.plainPassword || "123456"}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col gap-3 mt-auto">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col text-start">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">School ID</span>
                      <span className="text-[10px] text-slate-400 font-mono">{school.id.slice(0, 8)}</span>
                    </div>
                    <button 
                      onClick={() => handleImpersonate(school)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/10 active:scale-95 group/btn cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 group-hover/btn:animate-pulse" />
                      <span>{t('superAdmin.schoolsPage.directLogin')}</span>
                    </button>
                  </div>
                  <Link 
                    href={`/super-admin/schools/${school.id}`}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-xl text-center text-xs font-bold border border-slate-100 transition-all"
                  >
                    {t('superAdmin.schoolsPage.openFullDashboard')}
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400">{t('superAdmin.schoolsPage.noSchools')}</h3>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold mt-4 hover:bg-indigo-700 transition-all cursor-pointer">{t('superAdmin.schoolsPage.addSchool')}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
