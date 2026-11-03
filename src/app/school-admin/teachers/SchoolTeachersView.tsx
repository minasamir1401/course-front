"use client";
import DirectoryPager from '@/components/DirectoryPager';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';


import { shouldSkipImageOptimization } from "@/lib/imageDisplay";
import { createPortal } from 'react-dom';
import { useModalFocus } from '@/hooks/useModalFocus';
import { startImpersonation } from '@/lib/auth';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Plus, Search, Trash2, X, Mail, GraduationCap, Pencil, LogIn } from 'lucide-react';
import { apiFetch, API_URL, getFullImageUrl } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SchoolTeachersView() {
  const { t, language } = useLanguage();
  const { showToast, confirm } = useNotification();
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("مدرستك");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [options, setOptions] = useState<{ subjects: string[]; grades: string[] }>({ subjects: [], grades: [] });
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const modalRef = React.useRef<HTMLDivElement>(null);
  useModalFocus(isModalOpen, modalRef, () => { if (!saving) setIsModalOpen(false); });
  const [searchTerm, setSearchTerm] = useState("");
  const search = useDebouncedValue(searchTerm);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const requestRef = React.useRef<AbortController | null>(null);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (schoolId) void fetchTeachers(schoolId); return () => requestRef.current?.abort(); }, [schoolId, page, search]);

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

        }
      }
    } catch (e) {
      showToast(language === 'ar' ? 'تعذر تحميل القائمة كاملة. أعد المحاولة.' : 'Could not load the full list. Please retry.', 'error');
      console.error(e);
    }
  }, []);

  const fetchTeachers = async (sId: string) => {
    setLoading(true);
    requestRef.current?.abort();
    const currentRequest = new AbortController(); requestRef.current = currentRequest;
    try {
      const token = localStorage.getItem("school_admin_token");
      const response = await apiFetch(`${API_URL}/admin/users?role=TEACHER&schoolId=${sId}&page=${page}&limit=25&search=${encodeURIComponent(search)}`, { headers: { Authorization: `Bearer ${token}` }, signal: currentRequest.signal });
      if (!response.ok) throw new Error('Could not load directory');
      const data = await response.json();
      if (currentRequest.signal.aborted) return;
      setTeachers(data.users || []); setPagination(data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      if (!currentRequest.signal.aborted) setLoading(false);
    }
  };

  const loadOptions = async () => {
    setOptionsLoading(true); setOptionsError('');
    try {
      const response = await apiFetch(`${API_URL}/admin/teacher-options?schoolId=${encodeURIComponent(schoolId)}`);
      if (!response.ok) throw new Error();
      setOptions(await response.json());
    } catch { setOptionsError(language === 'ar' ? 'تعذر تحميل المواد والصفوف. أعد المحاولة.' : 'Could not load subjects and grades. Please retry.'); }
    finally { setOptionsLoading(false); }
  };
  const openTeacher = (teacher?: any) => {
    setEditingId(teacher?.id || null);
    setFormData({ name: teacher?.name || '', username: teacher?.username || '', password: '', subject: teacher?.subject || teacher?.specialization || '', grade: teacher?.grade || '', phone: teacher?.phone || '' });
    setIsModalOpen(true);
    void loadOptions();
  };
  const enterTeacher = async (teacher: any) => {
    if (enteringId) return;
    setEnteringId(teacher.id);
    try {
      const response = await apiFetch(`${API_URL}/admin/impersonate/${encodeURIComponent(teacher.id)}`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (language === 'ar' ? 'تعذر الدخول لحساب المعلم' : 'Could not enter teacher account'));
      startImpersonation(data.user, 'TEACHER');
      window.location.assign('/school-admin');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Connection error', 'error'); setEnteringId(null); }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || optionsLoading || (!editingId && optionsError)) return;
    const token = localStorage.getItem("school_admin_token");
    
    if (!formData.name || (!editingId && (!formData.subject || !formData.grade))) {
      showToast(t('schoolAdmin.teachersPage.fillRequired'), "error");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/users${editingId ? `/${encodeURIComponent(editingId)}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          ...formData,
          password: formData.password || undefined,
          subject: formData.subject || undefined,
          grade: formData.grade || undefined,
          role: "TEACHER", 
          schoolId: schoolId 
        })
      });
      
      if (res.ok) {
        showToast(editingId ? (language === 'ar' ? 'تم تحديث بيانات المعلم' : 'Teacher updated') : t('schoolAdmin.teachersPage.addSuccess'), 'success');
        setIsModalOpen(false);
        setFormData({ name: "", username: "", password: "", subject: "", grade: "", phone: "" });
        fetchTeachers(schoolId);
      } else {
        const d = await res.json();
        showToast(d.error || t('schoolAdmin.teachersPage.addFail'), "error");
      }
    } catch (e) {
      showToast(t('schoolAdmin.teachersPage.connError'), "error");
    } finally { setSaving(false); }
  };

  const handleDeleteTeacher = async (id: string) => {
    const confirmed = await confirm(
      t('schoolAdmin.teachersPage.deleteConfirmTitle'),
      t('schoolAdmin.teachersPage.deleteConfirmMsg')
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await apiFetch(`${API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(t('schoolAdmin.teachersPage.deleteSuccess'), "success");
        fetchTeachers(schoolId);
      } else {
        showToast(t('schoolAdmin.teachersPage.deleteFail'), "error");
      }
    } catch (e) {
      showToast(t('schoolAdmin.teachersPage.connError'), "error");
    }
  };

  const filtered = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-sm">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">{t('schoolAdmin.teachersPage.title')}</h2>
              <p className="text-slate-500 font-medium opacity-80">{schoolName}</p>
            </div>
          </div>
          
          <button 
            onClick={() => openTeacher()}
            className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" /> 
            {t('schoolAdmin.teachersPage.addTeacher')}
          </button>
        </div>

        {/* Teachers Grid */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
           <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h3 className="text-xl font-black text-slate-800">{t('schoolAdmin.teachersPage.teachingStaffList')}</h3>
              <div className="relative w-full md:w-96">
                <input 
                  type="text" 
                  placeholder={t('schoolAdmin.teachersPage.searchPlaceholder')}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 outline-none focus:border-indigo-500 transition-all font-bold ${
                    language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className={`w-5 h-5 text-slate-400 absolute top-3.5 ${
                  language === 'ar' ? 'right-4' : 'left-4'
                }`} />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-10 text-center animate-pulse text-slate-400 font-bold">{t('schoolAdmin.teachersPage.loading')}</div>
              ) : filtered.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-[35px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="relative w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden border border-slate-100 shrink-0">
                         {teacher.avatar ? (
                           <Image
                             src={getFullImageUrl(teacher.avatar) || ""}
                             fill
                             sizes="56px"
                             className="object-cover"
                             alt={teacher.name || "Teacher Avatar"}
                             unoptimized={shouldSkipImageOptimization(getFullImageUrl(teacher.avatar) || "")}
                           />
                         ) : (
                           teacher.name?.charAt(0) || "T"
                         )}
                      </div>
                      <div>
                         <h4 className="font-black text-slate-800">{teacher.name}</h4>
                         <p className="text-xs text-indigo-600 font-bold">{teacher.subject}</p>
                      </div>
                   </div>
                   <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                         <GraduationCap className="w-3.5 h-3.5" /> {t('schoolAdmin.teachersPage.gradeLabel')} {teacher.grade}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                         <Mail className="w-3.5 h-3.5" /> {teacher.username}
                      </div>
                   </div>
                   <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-50">
                      <button onClick={() => openTeacher(teacher)} className="inline-flex items-center gap-1.5 text-indigo-700 text-xs font-bold" aria-label={`${language === 'ar' ? 'تعديل بيانات دخول' : 'Edit credentials for'} ${teacher.name}`}><Pencil className="w-4 h-4" />{language === 'ar' ? 'تعديل البيانات' : 'Edit details'}</button>
                      <button onClick={() => void enterTeacher(teacher)} disabled={!!enteringId || teacher.status !== 'ACTIVE'} className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold disabled:opacity-50" aria-label={`${language === 'ar' ? 'الدخول لحساب' : 'Enter account for'} ${teacher.name}`}><LogIn className="w-4 h-4" />{enteringId === teacher.id ? (language === 'ar' ? 'جارٍ الدخول…' : 'Entering…') : (language === 'ar' ? 'دخول لحساب المعلم' : 'Enter teacher account')}</button>
                      <button 
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title={t('schoolAdmin.teachersPage.deleteTooltip')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Modal */}
        {isModalOpen && createPortal(
          <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar">
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="teacher-dialog-title" tabIndex={-1} className="bg-white w-full max-w-lg rounded-[28px] sm:rounded-[40px] p-5 sm:p-10 shadow-2xl animate-in zoom-in-95 my-4 sm:my-8 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
               <div className="flex justify-between items-center mb-8">
                  <h3 id="teacher-dialog-title" className="text-2xl font-black text-slate-800">{editingId ? (language === 'ar' ? 'تعديل بيانات المعلم' : 'Edit teacher details') : t('schoolAdmin.teachersPage.modalTitle')}</h3>
                  <button disabled={saving} aria-label={language === 'ar' ? 'إغلاق' : 'Close'} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800"><X /></button>
               </div>
               
               {optionsLoading && <p role="status" className="mb-4 text-indigo-700">{language === 'ar' ? 'جارٍ تحميل المواد والصفوف…' : 'Loading subjects and grades…'}</p>}
               {optionsError && <p role="alert" className="mb-4 text-red-700">{optionsError} <button onClick={() => void loadOptions()} className="underline">{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></p>}
               <form onSubmit={handleAddTeacher} className="space-y-6">
                  <div className="space-y-2">
                     <label htmlFor="teacher-full-name" className="text-sm font-black text-slate-500 mr-2">{t('schoolAdmin.teachersPage.fullName')}</label>
                     <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold" id="teacher-full-name" placeholder={t('schoolAdmin.teachersPage.fullNamePlaceholder')} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">{t('schoolAdmin.teachersPage.subject')}</label>
                        <select aria-label={t('schoolAdmin.teachersPage.subject')} required={!editingId} disabled={optionsLoading || !!optionsError} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:border-indigo-500 font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                          <option value="">{language === 'ar' ? 'اختر المادة' : 'Choose subject'}</option>
                          {[...new Set([...options.subjects, ...(formData.subject ? [formData.subject] : [])])].map(subject => <option key={subject} value={subject}>{subject}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">{t('schoolAdmin.teachersPage.grade')}</label>
                        <select
                          required={!editingId}
                          aria-label={t('schoolAdmin.teachersPage.grade')}
                          disabled={optionsLoading || !!optionsError}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-black text-slate-900 transition-all"
                          value={formData.grade}
                          onChange={e => setFormData({ ...formData, grade: e.target.value })}
                        >
                          <option value="" className="bg-white text-slate-900">{t('schoolAdmin.teachersPage.selectGrade')}</option>
                          {[...new Set([...options.grades, ...(formData.grade ? [formData.grade] : [])])].map(g => (
                            <option key={g} value={g} className="bg-white text-slate-900">{g}</option>
                          ))}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label htmlFor="teacher-username" className="text-sm font-black text-slate-500 mr-2">{t('schoolAdmin.teachersPage.username')}</label>
                        <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold" id="teacher-username" placeholder="username" dir="ltr" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-black text-slate-500 mr-2">{t('schoolAdmin.teachersPage.password')}</label>
                        <input type="password" required={!editingId} autoComplete="new-password" aria-label={t('schoolAdmin.teachersPage.password')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold" placeholder={editingId ? (language === 'ar' ? 'اتركها فارغة للإبقاء على الحالية' : 'Leave blank to keep current password') : ''} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                     </div>
                  </div>

                  <button type="submit" disabled={saving || optionsLoading || (!editingId && !!optionsError)} className="w-full disabled:opacity-50 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-900/20 hover:scale-105 transition-all">{saving ? (language === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : editingId ? (language === 'ar' ? 'حفظ التعديلات' : 'Save changes') : t('schoolAdmin.teachersPage.submitBtn')}</button>
               </form>
            </div>
          </div>, document.body
        )}
      </div>
      <DirectoryPager page={page} total={pagination.total} pages={pagination.totalPages} onPage={setPage} loading={loading} />
    </DashboardLayout>
  );
}
