"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Plus, Search, Shield, 
  User, Mail, ChevronRight,
  MoreVertical, Edit2, Trash2, Key, X, Building2, GraduationCap, Sparkles, FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import BulkStudentImport from "@/components/BulkStudentImport";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StudentsManagement() {
  const router = useRouter();
  const { showToast, confirm } = useNotification();
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
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
        const allUsersData = await usersRes.json();
        const allUsers = Array.isArray(allUsersData) ? allUsersData : (allUsersData.users || []);
        setStudents(allUsers.filter((u: any) => u.role === 'STUDENT'));
      }
      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(Array.isArray(schoolsData) ? schoolsData : (schoolsData.schools || []));
      }
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
    showToast(t('superAdmin.studentsPage.credentialsGenerated'), 'success');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username || !formData.password || !formData.schoolId) {
      showToast(t('superAdmin.studentsPage.fillRequired'), 'error');
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
        showToast(isEditMode ? t('superAdmin.studentsPage.updateSuccess') : t('superAdmin.studentsPage.addSuccess'), 'success');
      } else {
        const data = await res.json();
        showToast(data.error || (isEditMode ? t('superAdmin.studentsPage.deleteFail') : t('superAdmin.studentsPage.fillRequired')), 'error');
      }
    } catch (error) {
      showToast(t('superAdmin.studentsPage.connError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const confirmed = await confirm(
      t('superAdmin.studentsPage.deleteConfirmTitle'),
      t('superAdmin.studentsPage.deleteConfirmMsg')
    );
    if (!confirmed) return;

    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(API_URL + `/admin/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast(t('superAdmin.studentsPage.deleteSuccess'), 'success');
        fetchData();
      } else {
        showToast(t('superAdmin.studentsPage.deleteFail'), 'error');
      }
    } catch (error) {
      showToast(t('superAdmin.studentsPage.connError'), 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0a14] text-slate-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            {t('superAdmin.studentsPage.title')}
          </h2>
          <div className="flex items-center gap-3">
            {/* Bulk Import Button */}
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-2 border border-blue-500/30 text-blue-400 px-4 py-2.5 rounded-2xl font-bold hover:bg-blue-500/10 transition-all text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('superAdmin.studentsPage.bulkImport')}
            </button>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 sm:px-8 sm:py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 text-sm sm:text-base">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('superAdmin.studentsPage.addStudent')}
            </button>
          </div>
        </div>

        {/* Bulk Import Modal */}
        {isBulkImportOpen && (
          <BulkStudentImport
            onClose={() => setIsBulkImportOpen(false)}
            onSuccess={(count) => {
              showToast(`${t('superAdmin.bulkImport.importSuccess').replace('{n}', String(count))}`, 'success');
              fetchData();
            }}
          />
        )}

        <div className="mb-6 sm:mb-10 relative">
          <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500`} />
          <input 
            type="text" 
            placeholder={t('superAdmin.studentsPage.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-[#0f0f1d] border border-white/5 rounded-2xl py-4 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} outline-none focus:border-blue-500 transition-all text-white font-medium`}
          />
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0f0f1d] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{isEditMode ? t('superAdmin.studentsPage.editModal') : t('superAdmin.studentsPage.addModal')}</h3>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-500 hover:text-white"><X /></button>
              </div>
              
              <form onSubmit={handleAddStudent} className="space-y-4 text-start" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('superAdmin.studentsPage.basicInfo')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t('superAdmin.studentsPage.studentName')}</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500" placeholder={t('superAdmin.studentsPage.fullName')} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t('superAdmin.studentsPage.grade')}</label>
                      <select required value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500 appearance-none">
                        <option value="" className="bg-[#0a0a14] text-white">{t('superAdmin.studentsPage.selectGrade')}</option>
                        {GRADES.map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">{t('superAdmin.studentsPage.school')}</label>
                    <select required value={formData.schoolId} onChange={(e) => setFormData({...formData, schoolId: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500 appearance-none">
                      <option value="">{t('superAdmin.studentsPage.selectSchool')}</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-white/2 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('superAdmin.studentsPage.loginInfo')}</h4>
                    <button 
                      type="button"
                      onClick={generateCredentials}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/10"
                    >
                      <Sparkles className="w-3 h-3" />
                      {t('superAdmin.studentsPage.autoGenerate')}
                    </button>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t('superAdmin.studentsPage.username')}</label>
                      <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500" placeholder={t('superAdmin.studentsPage.studentCode')} dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t('superAdmin.studentsPage.password')}</label>
                      <input type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-blue-500" placeholder="Password@123" />
                    </div>
                  </div>
                </div>

                <button disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-900/20">
                  {isSubmitting ? t('superAdmin.studentsPage.saving') : (isEditMode ? t('superAdmin.studentsPage.saveChanges') : t('superAdmin.studentsPage.confirmRegister'))}
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
            <table className="w-full min-w-[640px]" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest bg-white/5">
                  <th className="px-8 py-5">{t('superAdmin.studentsPage.tableStudent')}</th>
                  <th className="px-8 py-5">{t('superAdmin.studentsPage.tableUsername')}</th>
                  <th className="px-8 py-5">{t('superAdmin.studentsPage.tablePassword')}</th>
                  <th className="px-8 py-5">{t('superAdmin.studentsPage.tableSchool')}</th>
                  <th className="px-8 py-5">{t('superAdmin.tableActions')}</th>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
