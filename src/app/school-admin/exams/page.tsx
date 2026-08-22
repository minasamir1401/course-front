"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ClipboardList, Plus, Search, Filter, Clock, BookOpen, CheckCircle2, Globe, Building2, GraduationCap, ChevronLeft, MoreVertical, FileEdit, BarChart3, Tag, Calendar, Lock, Trash2, RefreshCw, Hash, Eye, Layers, HelpCircle } from 'lucide-react';
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import ExamModulesManager from "@/components/exams/ExamModulesManager";
import { buildExamModuleViews } from "@/lib/examModuleView";

export default function ExamsListPage() {
  const { t, language } = useLanguage();
  const { showToast, confirm } = useNotification();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [assessmentType, setAssessmentType] = useState("all");
  const [isModulesManagerOpen, setIsModulesManagerOpen] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("school_admin_token");
      const user = JSON.parse(localStorage.getItem("school_admin_user") || "{}");
      
      let url = `${API_URL}/exams?schoolId=${user.schoolId}`;
      if (filterType !== "all") {
        url += `&grade=${filterType}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setExams(data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      t('schoolAdmin.examsPage.deleteConfirmTitle'),
      t('schoolAdmin.examsPage.deleteConfirmMsg')
    );
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/exams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(t('schoolAdmin.examsPage.deleteSuccess'), "success");
        setExams(exams.filter(e => e.id !== id));
      } else {
        showToast(t('schoolAdmin.examsPage.deleteFail'), "error");
      }
    } catch (error) {
      console.error(error);
      showToast(t('schoolAdmin.examsPage.unexpectedError'), "error");
    }
  };

  const handleUpdateAttempts = async (examId: string, currentAttempts: number) => {
    const nextAttempts = currentAttempts === 1 ? 2 : currentAttempts === 2 ? 3 : currentAttempts === 3 ? 999 : 1;
    try {
      const token = localStorage.getItem("school_admin_token");
      const exam = exams.find(e => e.id === examId);
      if (!exam) return;
      const res = await fetch(`${API_URL}/exams/${examId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...exam, attemptsAllowed: nextAttempts, questions: exam.questions || [] })
      });
      if (res.ok) {
        setExams(exams.map(e => e.id === examId ? { ...e, attemptsAllowed: nextAttempts } : e));
        showToast(
          t('schoolAdmin.examsPage.attemptsUpdated').replace(
            '{n}',
            nextAttempts === 999 ? t('schoolAdmin.examsPage.unlimited') : String(nextAttempts)
          ),
          'success'
        );
      } else {
        showToast(t('schoolAdmin.examsPage.attemptsUpdateFail'), 'error');
      }
    } catch {
      showToast(t('schoolAdmin.examsPage.connError'), 'error');
    }
  };

  const formatAttempts = (n: number) => n >= 999 ? '∞' : String(n);

  useEffect(() => {
    fetchExams();
  }, [filterType]);

  const filteredExams = exams.filter((exam: any) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = assessmentType === "all" 
      || exam.type?.toUpperCase() === assessmentType.toUpperCase()
      // If filtering for Exams, also include items without a type since default is Quiz/Exam
      || (assessmentType === "Exam" && !exam.type);
    return matchesSearch && matchesType;
  });
  const moduleViews = buildExamModuleViews(filteredExams);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 gap-6 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-sm">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
            </div>
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">{t('schoolAdmin.examsPage.title')}</h2>
              <p className="text-slate-500 font-medium opacity-80">{t('schoolAdmin.examsPage.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">

              <Link
                href="/school-admin/exams/new?mode=module"
                className="group bg-white text-[#0f0f1d] px-6 py-4 md:px-10 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-white/10 hover:scale-105 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
              >
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center group-hover:rotate-90 transition-transform">
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                {language === 'ar' ? 'إنشاء Module اختبار جديد' : 'Create New Exam Module'}
              </Link>
            </div>


          {/* Background Decorative Element */}
          <div className={`absolute top-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-64 h-64 bg-indigo-50/50 blur-[100px] ${language === 'ar' ? '-mr-32' : '-ml-32'} -mt-32`}></div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder={t('schoolAdmin.examsPage.searchPlaceholder')}
              className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all text-lg font-medium ${
                language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className={`w-6 h-6 text-slate-300 absolute top-4.5 ${language === 'ar' ? 'right-4' : 'left-4'}`} />
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 min-w-[180px]">
              {language === 'ar' ? 'النوع: امتحان' : 'Type: Exam'}
            </div>
            <select 
              className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-700 min-w-[200px]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">{t('schoolAdmin.examsPage.allStages')}</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Exams Table/Grid Layout */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-400 animate-pulse text-lg">{t('schoolAdmin.examsPage.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {moduleViews.map((moduleView: any) => {
              const exam = exams.find((candidate: any) => candidate.id === moduleView.parentExamId) || {};
              return (
              <div key={moduleView.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6 flex flex-col gap-5 group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" />
                
                {/* Icon & Status */}
                <div className="flex items-start justify-between gap-4 shrink-0">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${exam.isCentral ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Tag className="w-7 h-7" />
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    exam.status === 'DRAFT' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {exam.status === 'DRAFT' ? t('schoolAdmin.examsPage.draft') : t('schoolAdmin.examsPage.published')}
                  </div>
                  <Link href={`/school-admin/exams/edit/${moduleView.parentExamId}?moduleId=${encodeURIComponent(moduleView.id)}`} className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title={language === 'ar' ? 'تعديل إعدادات الـ Module' : 'Edit module settings'}>
                    <FileEdit className="w-5 h-5" />
                  </Link>
                </div>

                {/* Main Info */}
                <div className={`flex-1 min-w-0 flex flex-col w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                      {exam.category || (exam.isCentral ? t('schoolAdmin.examsPage.central') : t('schoolAdmin.examsPage.school'))}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {language === 'ar' ? 'اختبار' : 'Exam'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                      {exam.grade || "عام"}
                    </span>
                    {exam.password && (
                      <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">
                        <Lock className="w-3 h-3" /> محمي
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 truncate mb-1 group-hover:text-indigo-600 transition-colors">{moduleView.title}</h3>
                  <p className="text-slate-500 text-sm truncate">{moduleView.description || 'لا يوجد وصف متاح لهذا الموديول.'}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      {t('schoolAdmin.examsPage.mins').replace('{n}', String(exam.duration))}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100" title={language === 'ar' ? 'عدد الموديولات' : 'Modules count'}>
                      <Layers className="w-4 h-4 text-indigo-500" />
                      1 {language === 'ar' ? 'موديول' : 'Module'}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100" title={language === 'ar' ? 'عدد الدروس' : 'Lessons count'}>
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      {moduleView.examsCount} {language === 'ar' ? 'اختبار' : 'Exams'}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100" title={language === 'ar' ? 'إجمالي الأسئلة' : 'Total questions'}>
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      {moduleView.questionsCount} {language === 'ar' ? 'سؤال' : 'Questions'}
                    </div>
                    <button 
                      onClick={() => handleUpdateAttempts(exam.id, exam.attemptsAllowed || 1)} 
                      title={t('schoolAdmin.examsPage.attemptsTooltip')}
                      className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 text-xs font-bold cursor-pointer transition-colors bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100"
                    >
                      <Hash className="w-4 h-4 text-amber-500" />
                      {formatAttempts(exam.attemptsAllowed || 1)} محاولات
                    </button>
                    <div className={`flex items-center gap-1.5 text-slate-400 text-xs font-medium border-slate-200 ${language === 'ar' ? 'border-r pr-4 mr-2' : 'border-l pl-4 ml-2'}`}>
                      <Calendar className="w-4 h-4" />
                      {new Date(exam.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full mt-2 justify-end border-t border-slate-100 pt-4">
                  <Link href={`/exams/${exam.id}/details`} target="_blank" className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-600 hover:text-white transition-all shadow-sm" title={language === 'ar' ? 'عرض الموديول والاختبارات' : 'Preview Module and Exams'}>
                    <Eye className="w-5 h-5" />
                  </Link>
                  <Link href={`/school-admin/exams/edit/${moduleView.parentExamId}?moduleId=${encodeURIComponent(moduleView.id)}`} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm" title={t('schoolAdmin.examsPage.edit')}>
                    <FileEdit className="w-5 h-5" />
                  </Link>
                  <button onClick={() => handleDelete(exam.id)} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm" title={t('schoolAdmin.teachersPage.deleteTooltip')}>
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <Link href={`/school-admin/exams/analytics/${exam.id}`} className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm border border-indigo-100 text-sm h-10" title={language === 'ar' ? "تحليلات" : "Analytics"}>
                    📊 <span className="hidden sm:inline">{language === 'ar' ? "تحليلات" : "Analytics"}</span>
                  </Link>
                  <Link href={`/school-admin/exams/results/${exam.id}`} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100 text-sm h-10">
                    <BarChart3 className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('schoolAdmin.examsPage.analysis')}</span>
                  </Link>
                </div>
              </div>
              );
            })}
            
            {moduleViews.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ClipboardList className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{t('schoolAdmin.examsPage.noExams')}</h3>
                <p className="text-slate-400 font-medium">{t('schoolAdmin.examsPage.noExamsDesc')}</p>
                <Link href="/school-admin/exams/new?mode=module" className="inline-flex items-center gap-2 text-indigo-600 font-black mt-8 hover:gap-3 transition-all">
                   {t('schoolAdmin.examsPage.createNow')}
                   <ChevronLeft className={`w-5 h-5 ${language === 'en' ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
