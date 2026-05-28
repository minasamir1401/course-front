"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { API_URL } from "@/lib/api";
import {
  Plus, Search, Filter, BookOpen, Clock,
  Building2, Globe, GraduationCap, ArrowUpRight,
  TrendingUp, BarChart3, Settings, Shield, ChevronLeft, Trash2, Hash
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

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

  useEffect(() => {
    fetchData();
  }, [filterSchool, filterType]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("super_admin_token");

      // Fetch Schools for filter
      const schoolsRes = await fetch(`${API_URL}/admin/schools`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const schoolsData = await schoolsRes.json();
      setSchools(Array.isArray(schoolsData) ? schoolsData : (schoolsData.schools || []));

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

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const getGradeName = (grade: string) => {
    if (language === 'ar') return grade;
    const translations: { [key: string]: string } = {
      "الصف الأول الابتدائي": "1st Primary",
      "الصف الثاني الابتدائي": "2nd Primary",
      "الصف الثالث الابتدائي": "3rd Primary",
      "الصف الرابع الابتدائي": "4th Primary",
      "الصف الخامس الابتدائي": "5th Primary",
      "الصف السادس الابتدائي": "6th Primary",
      "الصف الأول الإعدادي": "1st Prep",
      "الصف الثاني الإعدادي": "2nd Prep",
      "الصف الثالث الإعدادي": "3rd Prep",
      "الصف الأول الثانوي": "1st Secondary",
      "الصف الثاني الثانوي": "2nd Secondary",
      "الصف الثالث الثانوي": "3rd Secondary"
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

  const filteredExams = exams.filter((exam: any) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

            <Link
              href="/super-admin/exams/new"
              className="group bg-white text-[#0f0f1d] px-6 py-4 md:px-10 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-white/10 hover:scale-105 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
            >
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center group-hover:rotate-90 transition-transform">
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              {t('examsPage.createExam')}
            </Link>
          </div>

          {/* Decorative Glowing Elements */}
          <div className="absolute -top-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-purple-600/20 blur-[80px] md:blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-64 md:w-96 h-64 md:h-96 bg-indigo-600/20 blur-[80px] md:blur-[120px] rounded-full"></div>
        </div>

        {/* Analytical Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className={`text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
                <Filter className="w-4 h-4" />
                {t('examsPage.smartFilters')}
              </h3>

              <div className="space-y-6">
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

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 md:p-8 rounded-3xl md:rounded-[32px] text-white shadow-xl shadow-indigo-200">
              <TrendingUp className="w-8 h-8 md:w-10 md:h-10 mb-4 opacity-50" />
              <h4 className="text-2xl md:text-3xl font-black mb-1">{exams.length}</h4>
              <p className="text-indigo-100 text-[10px] md:text-sm font-bold opacity-80 uppercase tracking-wider">{t('examsPage.totalExams')}</p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredExams.map((exam: any) => (
                <div key={exam.id} className="group bg-white rounded-3xl md:rounded-[40px] border border-slate-100 p-6 md:p-10 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 md:gap-0">
                      <div className="flex gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                          <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                          <h3 className="text-lg md:text-2xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors leading-tight">{exam.title}</h3>
                          <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] md:text-sm">
                            <span className="bg-slate-100 px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[10px] uppercase tracking-wider">{exam.type}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-[8px] md:text-[9px]">
                              <GraduationCap className="w-3 h-3" />
                              {getGradeName(exam.grade) || (language === 'ar' ? "عام" : "General")}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`flex md:flex-col items-center ${language === 'ar' ? 'md:items-end' : 'md:items-start'} gap-2 w-full md:w-auto justify-between md:justify-start`}>
                        <span className={`px-3 md:px-4 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider ${exam.isCentral ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {exam.isCentral ? t('examsPage.central') : t('examsPage.school')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-bold text-slate-400">
                            <Clock className="w-3 h-3" />
                            {exam.duration} {language === 'ar' ? 'دقيقة' : 'mins'}
                          </div>
                          <button
                            onClick={() => handleUpdateAttempts(exam.id, exam.attemptsAllowed || 1)}
                            title={language === 'ar' ? "اضغط لتغيير عدد المحاولات" : "Click to change attempts count"}
                            className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black border border-amber-100 hover:bg-amber-100 transition-all"
                          >
                            <Hash className="w-3 h-3" />
                            {(exam.attemptsAllowed || 1) >= 999 ? '∞' : exam.attemptsAllowed || 1} {language === 'ar' ? 'محاولة' : 'attempt(s)'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className={`text-slate-500 text-xs md:text-sm mb-10 line-clamp-2 leading-relaxed h-10 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{exam.description || (language === 'ar' ? "لا يوجد وصف متاح لهذا الامتحان." : "No description available for this exam.")}</p>

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-50 gap-6 sm:gap-0">
                      <div className="flex items-center gap-3 text-slate-500 font-bold w-full sm:w-auto">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        <span className="text-[10px] md:text-[11px] max-w-[150px] truncate">
                          {exam.isCentral 
                            ? t('examsPage.allSchoolsTarget') 
                            : (exam.schools?.length > 1 
                                ? (language === 'ar' ? `${exam.schools.length} مدارس` : `${exam.schools.length} schools`) 
                                : (exam.schools?.[0]?.name || (language === 'ar' ? "مدرسة واحدة" : "One school")))}
                        </span>
                      </div>

                      <div className="flex gap-3 w-full sm:w-auto justify-end">
                        <Link
                          href={`/super-admin/exams/results/${exam.id}`}
                          className="flex-1 sm:flex-none text-center bg-[#0f0f1d] text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl text-[10px] md:text-[11px] font-black hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-900/10 whitespace-nowrap"
                        >
                          {t('examsPage.reports')}
                        </Link>
                        <Link
                          href={`/super-admin/exams/edit/${exam.id}`}
                          className="p-3 md:p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                        >
                          <Settings className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="p-3 md:p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-100 hover:text-rose-600 transition-all border border-rose-100"
                          title={t('examsPage.deleteExam')}
                        >
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Decorative faint background icon */}
                  <Shield className="absolute -bottom-10 -right-10 w-32 md:w-40 h-32 md:h-40 text-slate-50/50 group-hover:text-indigo-50/50 transition-colors" />
                </div>
              ))}

              {filteredExams.length === 0 && (
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
      </div>
    </DashboardLayout>
  );
}
