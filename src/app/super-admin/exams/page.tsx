"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { API_URL } from "@/lib/api";
import { Plus, Search, Filter, BookOpen, Clock, Building2, Globe, GraduationCap, ArrowUpRight, TrendingUp, BarChart3, Settings, Shield, ChevronLeft, Trash2, Hash, Eye, FolderOutput, X, FileText, Layers, HelpCircle } from 'lucide-react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ExamModulesManager from "@/components/exams/ExamModulesManager";
import { buildExamModuleViews } from "@/lib/examModuleView";

export default function SuperAdminExamsPage() {
  const router = useRouter();
  const { showToast, confirm } = useNotification();
  const { t, language } = useLanguage();
  const [exams, setExams] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [assessmentType] = useState("Exam");
  const [isModulesManagerOpen, setIsModulesManagerOpen] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [examToMove, setExamToMove] = useState<any>(null);
  const [targetExamId, setTargetExamId] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterSchool, filterType]);

  const fetchData = async () => {
    try {
      const isSuper = !!localStorage.getItem("super_admin_token");
      setIsSuperAdmin(isSuper);
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("lms_token") || localStorage.getItem("token");

      // Fetch Schools for filter
      const schoolsRes = await fetch(`${API_URL}/admin/schools`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(Array.isArray(schoolsData) ? schoolsData : (schoolsData.schools || []));
      } else {
        console.warn('Failed to fetch schools:', schoolsRes.status);
        setSchools([]);
      }

      // Fetch Exams with filters
      let url = `${API_URL}/exams?`;
      if (filterSchool !== "all") {
        if (filterSchool === "central") url += "isCentral=true";
        else url += `schoolId=${filterSchool}`;
      }
      if (filterType !== "all") {
        url += (url.includes("?") ? "&" : "") + `grade=${filterType}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setExams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      t('examsPage.deleteConfirmTitle'),
      t('examsPage.deleteConfirmMsg')
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/exams/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(t('examsPage.deleteSuccess'), "success");
        setExams(exams.filter(e => e.id !== id));
      } else {
        showToast(t('examsPage.deleteFail'), "error");
      }
    } catch (error) {
      console.error(error);
      showToast(t('examsPage.unexpectedError'), "error");
    }
  };

  const handleMoveToModule = async (id?: string, moduleId?: string, subExamId?: string | null) => {
    const finalTargetId = typeof id === 'string' ? id : targetExamId;
    if (!finalTargetId) {
      showToast(language === 'ar' ? 'الرجاء اختيار الامتحان الهدف' : 'Please select a target exam', 'error');
      return;
    }
    setTargetExamId(finalTargetId);
    setIsMoving(true);
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("lms_token") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/exams/${examToMove.id}/move-to-module`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetExamId: finalTargetId,
          targetModuleId: moduleId,
          targetSubExamId: subExamId
        })
      });
      if (res.ok) {
        showToast(language === 'ar' ? 'تم نقل المحتوى بنجاح' : 'Content moved successfully', 'success');
        setExams(exams.filter(e => e.id !== examToMove.id));
        setShowMoveModal(false);
      } else {
        const err = await res.json();
        showToast(err.error || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'), 'error');
      }
    } catch (e) {
      showToast(language === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
      setIsMoving(false);
    }
  };

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

  const handleUpdateAttempts = async (examId: string, currentAttempts: number) => {
    const nextAttempts = currentAttempts === 1 ? 2 : currentAttempts === 2 ? 3 : currentAttempts === 3 ? 999 : 1;
    try {
      const token = localStorage.getItem("super_admin_token");
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
          language === 'ar'
            ? `تم تغيير المحاولات إلى ${nextAttempts >= 999 ? 'غير محدود' : nextAttempts}`
            : `Attempts updated to ${nextAttempts >= 999 ? 'unlimited' : nextAttempts}`,
          'success'
        );
      } else {
        showToast(t('examsPage.attemptsUpdateFail') || 'Failed to update attempts', 'error');
      }
    } catch {
      showToast(t('examsPage.connError'), 'error');
    }
  };

  const filteredExams = exams.filter((exam: any) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = assessmentType === "Exam"
      && (!exam.type || exam.type.toUpperCase() === "EXAM" || exam.type.toUpperCase() === "QUIZ");
    return matchesSearch && matchesType;
  });
  const moduleViews = buildExamModuleViews(filteredExams);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Premium Command Center Header */}
        <div className="relative bg-[#0f0f1d] rounded-3xl md:rounded-[40px] p-6 md:p-12 overflow-hidden shadow-2xl border border-white/5">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className={`flex flex-col md:flex-row items-center gap-4 md:gap-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[28px] bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 transform -rotate-6 group-hover:rotate-0 transition-transform">
                <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">{t('examsPage.title')}</h2>
                <p className="text-slate-400 text-sm md:text-lg font-medium max-w-md leading-relaxed">{t('examsPage.subtitle')}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">

              <Link
                href="/super-admin/exams/new?mode=module"
                className="group bg-white text-[#0f0f1d] px-6 py-4 md:px-10 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-white/10 hover:scale-105 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
              >
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center group-hover:rotate-90 transition-transform">
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                {language === 'ar' ? 'إنشاء Module اختبار جديد' : 'Create New Exam Module'}
              </Link>
            </div>
          </div>


          {/* Decorative Glowing Elements */}
          <div className="absolute -top-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-purple-600/20 blur-[80px] md:blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-64 md:w-96 h-64 md:h-96 bg-indigo-600/20 blur-[80px] md:blur-[120px] rounded-full"></div>
        </div>

        {/* Analytical Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 bg-white p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className={`text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
              <Filter className="w-4 h-4" />
              {t('examsPage.smartFilters')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <label className={`text-xs font-bold text-slate-500 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{t('examsPage.searchLabel')}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('examsPage.searchPlaceholder')}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl ${language === 'ar' ? 'pl-4 pr-12' : 'pr-4 pl-12'} py-3 md:py-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className={`w-5 h-5 text-slate-400 absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-3 md:top-4`} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={`text-xs font-bold text-slate-500 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{language === 'ar' ? "النوع" : "Type"}</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 md:py-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-slate-700 text-sm md:text-base"
                  value={assessmentType}
                  disabled
                >
                  <option value="Exam">{language === 'ar' ? "اختبار" : "Exam"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className={`text-xs font-bold text-slate-500 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{t('examsPage.filterStage')}</label>
                <select
                  className="w-full bg-[#0a0a14] border border-white/10 rounded-2xl px-5 py-3 md:py-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-white text-sm md:text-base appearance-none"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all" className="bg-[#0a0a14] text-white">{t('examsPage.allStages')}</option>
                  {GRADES.map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{getGradeName(g)}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className={`text-xs font-bold text-slate-500 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{t('examsPage.filterSchool')}</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 md:py-4 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-slate-700 text-sm md:text-base"
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                >
                  <option value="all">{t('examsPage.allSchools')}</option>
                  <option value="central">{t('examsPage.centralExams')}</option>
                  {schools.map((school: any) => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 md:p-8 rounded-3xl md:rounded-[32px] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between">
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 opacity-50" />
            <div>
              <h4 className="text-3xl md:text-4xl font-black mb-1">{moduleViews.length}</h4>
              <p className="text-indigo-100 text-[10px] md:text-sm font-bold opacity-80 uppercase tracking-wider">{language === 'ar' ? 'إجمالي Modules الاختبار' : 'Total Exam Modules'}</p>
            </div>
          </div>
        </div>

        {/* Exam Modules / Courses-style cards */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {moduleViews.map((module: any) => {
              const exam = exams.find((candidate: any) => candidate.id === module.parentExamId) || {};
              return (
                <div key={module.id} className="group bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" />
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <Link href={`/super-admin/exams/edit/${module.parentExamId}?moduleId=${encodeURIComponent(module.id)}`} className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title={language === 'ar' ? 'تعديل إعدادات الـ Module' : 'Edit module settings'}>
                      <Settings className="w-5 h-5" />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">{language === 'ar' ? 'Module اختبار' : 'Exam Module'}</span>
                    <span className="px-3 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black">{getGradeName(module.grade) || (language === 'ar' ? 'عام' : 'General')}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 truncate mb-2">{module.title}</h3>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-10">{module.description || (language === 'ar' ? 'بوابة اختبارات جديدة' : 'Exam module portal')}</p>
                  <div className="grid grid-cols-2 gap-3 mt-7">
                    <div className="rounded-2xl bg-slate-50 p-4 text-center"><BookOpen className="w-5 h-5 text-indigo-500 mx-auto mb-2" /><p className="text-xl font-black text-slate-900">{module.examsCount}</p><p className="text-[10px] font-bold text-slate-400">{language === 'ar' ? 'اختبارات' : 'Exams'}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-center"><HelpCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" /><p className="text-xl font-black text-slate-900">{module.questionsCount}</p><p className="text-[10px] font-bold text-slate-400">{language === 'ar' ? 'أسئلة' : 'Questions'}</p></div>
                  </div>
                  <Link href={`/exams/${exam.id}/details`} target="_blank" className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-colors">
                    {language === 'ar' ? 'فتح بوابة الـ Module' : 'Open Module Portal'} <Eye className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}

            {moduleViews.length === 0 && (
              <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Search className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">{t('examsPage.noResults')}</h3>
                <p className="text-slate-500 mt-2">{t('examsPage.tryOtherCriteria')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Move to Module Modal */}
      {showMoveModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${language === 'ar' ? 'lg:pr-72' : 'lg:pl-72'}`}>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMoveModal(false)}></div>
          <div className="relative bg-slate-50/95 backdrop-blur-xl rounded-[40px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200/50">
            <div className="px-8 py-6 border-b border-slate-200/50 flex items-center justify-between bg-white/50 sticky top-0 z-20">
              <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
                <FolderOutput className="w-6 h-6 text-indigo-600" />
                {language === 'ar' ? 'نقل الامتحان إلى الموديولات - اختر الوجهة' : 'Move Exam to Modules - Select Destination'}
              </h3>
              <button
                onClick={() => setShowMoveModal(false)}
                className="w-10 h-10 bg-white hover:bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-5 rounded-3xl text-sm font-bold flex gap-4 mb-8 shadow-sm">
                <span className="text-2xl shrink-0">⚠️</span>
                <div>
                  <p className="text-base">{language === 'ar' ? 'تنبيه: سيتم نقل جميع محتويات هذا الامتحان كـ موديول جديد داخل الامتحان الذي ستختاره أدناه.' : 'Warning: All contents of this exam will be moved as a new module inside the exam you select below.'}</p>
                  <p className="mt-1 text-amber-600">{language === 'ar' ? 'بعد النقل، سيتم حذف هذا الامتحان من القائمة.' : 'After moving, this exam will be removed from the list.'}</p>
                </div>
              </div>

              <div className="space-y-6 w-full max-w-full">
                {(() => {
                  const allModules = exams
                    .filter(e => e.id !== examToMove?.id)
                    .flatMap(e => (e.modules || []).map((m: any) => ({ ...m, examId: e.id, examTitle: e.title })));

                  if (allModules.length === 0) {
                    return (
                      <div className="p-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl text-lg bg-white/50">
                        {language === 'ar' ? 'لا توجد موديولات متوفرة للنقل إليها.' : 'No modules available to move into.'}
                      </div>
                    );
                  }

                  return allModules.map(mod => (
                    <div key={mod.id} className="flex flex-col gap-2">
                      <div className="bg-white border border-slate-100 rounded-[24px] p-4 hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-md flex items-center gap-4 flex-col sm:flex-row">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                        <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                          <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-indigo-100">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-900 text-lg truncate group-hover:text-indigo-600 transition-colors">{mod.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-400">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              {language === 'ar' ? 'داخل امتحان:' : 'Inside Exam:'} {mod.examTitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                          <button
                            disabled={isMoving}
                            onClick={() => handleMoveToModule(mod.examId, mod.id)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200 cursor-pointer"
                          >
                            <FolderOutput className="w-4 h-4" />
                            {isMoving && targetExamId === mod.examId ? (language === 'ar' ? 'جاري النقل...' : 'Moving...') : (language === 'ar' ? 'نقل إلى هذا الموديول' : 'Move to this module')}
                          </button>
                        </div>
                      </div>
                      
                      {mod.subExams && mod.subExams.length > 0 && (
                        <div className="mt-2 pt-2 space-y-3 pl-14">
                          {mod.subExams.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((subExam: any) => (
                            <div key={subExam.id} className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-bold text-sm text-slate-700 truncate">{subExam.title}</span>
                              </div>
                              <button
                                disabled={isMoving}
                                onClick={() => handleMoveToModule(mod.examId, mod.id, subExam.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                <FolderOutput className="w-3.5 h-3.5" />
                                {language === 'ar' ? 'نقل إلى هنا' : 'Move here'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
