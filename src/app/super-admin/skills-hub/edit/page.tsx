"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { ArrowLeft, ArrowRight, Save, BookOpen, Layers, Monitor, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Settings, ListOrdered, CheckCircle2, Sparkles, Upload, Download, Play, Clock, X, Info, BrainCircuit, Star, StarOff, RefreshCw, Target, GraduationCap, Award, Zap, HelpCircle } from 'lucide-react';
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";
import InteractiveQuestionRenderer from "@/components/InteractiveQuestionRenderer";
import { isAnswerCorrect } from "@/lib/answerEvaluation";
import RichTextEditor from "@/components/RichTextEditor";
import AnimatedFeedback from "@/components/AnimatedFeedback";
import { InteractiveTag } from "@/components/InteractiveTag";
import HtmlRenderer from "@/components/HtmlRenderer";


import { useClusterInfo } from './hooks/useClusterInfo';
import { useLessons } from './hooks/useLessons';
import { useActivities } from './hooks/useActivities';
import { useStudentPreview } from './hooks/useStudentPreview';
import { GRADE_LABELS, CANONICAL_GRADES, SUBJECTS, DEFAULT_SKILLS } from './constants';

export default function EditSkillClusterPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const clusterId = searchParams.get('id');


  const clusterInfo = useClusterInfo({ clusterId, language, showToast, router });
  const lessonsMgr = useLessons({ clusterId, language, showToast });
  const activitiesMgr = useActivities({ clusterId, language, showToast, fetchLessons: lessonsMgr.fetchLessons });
  const previewMgr = useStudentPreview({ language });

  useEffect(() => {
    clusterInfo.fetchClusterData();
    lessonsMgr.fetchLessons();
  }, [clusterId]);

  // EXCEL FILE INPUT REF
  const excelInputRef = React.useRef<HTMLInputElement>(null);

  // Destructure for JSX compatibility
  const { isLoading, isSaving, schools, isSuperAdmin, activeTab, setActiveTab, selectedGrades, setSelectedGrades, selectedSchoolIds, setSelectedSchoolIds, clusterData, setClusterData, handleUpdateCluster } = clusterInfo;
  const { lessons, setLessons, isLessonModalOpen, setIsLessonModalOpen, editingLesson, setEditingLesson, openAddLesson, openEditLesson, handleSaveLesson, handleDeleteLesson, uploadingLessonId } = lessonsMgr;
  
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadingLessonId) {
      lessonsMgr.handleExcelUpload(e, uploadingLessonId);
    }
  };

  const { expandedLessonId, setExpandedLessonId, activitiesData, setActivitiesData, toggleLessonExpand, isActivityModalOpen, setIsActivityModalOpen, editingActivity, setEditingActivity, openAddActivity, openEditActivity, handleSaveActivity, handleDeleteActivity } = activitiesMgr;
  const { previewActivity, setPreviewActivity, previewAnswer, setPreviewAnswer, previewIsSubmitting, setPreviewIsSubmitting, previewResult, setPreviewResult, previewToast, setPreviewToast, previewStartTime, setPreviewStartTime, previewHintsUsed, setPreviewHintsUsed, previewAttemptCount, setPreviewAttemptCount, previewHelperModal, setPreviewHelperModal, previewActivitiesList, setPreviewActivitiesList, previewTimeLeft, setPreviewTimeLeft, previewIsLoading, setPreviewIsLoading, openPreview, closePreview, handlePreviewNext, handlePreviewPrev, handlePreviewSubmit, handlePreviewRetry } = previewMgr;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const getCleanDescription = (desc: string | null) => {
    if (!desc) return "";
    const clean = desc.replace(/<[^>]*>?/gm, '');
    return clean.length > 50 ? clean.substring(0, 50) + '...' : clean;
  };

  const saveLessonMetadata = async (lesson: any, newMetadata: any) => {
    try {
      const token = localStorage.getItem('super_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ metadata: newMetadata })
      });
      lessonsMgr.fetchLessons();
    } catch (e) {
      console.error(e);
    }
  };

  const startPreviewLesson = (lessonId: string) => {
    const acts = activitiesData[lessonId] || [];
    if (acts.length > 0) openPreview(acts[0], acts);
  };

  const startPreviewActivity = (activity: any, lessonId: string) => {
    const acts = activitiesData[lessonId] || [];
    openPreview(activity, acts);
  };

  const translateText = (text: any, lang: any) => {
    if (!text) return "";
    if (typeof text === 'string') return text;
    return text[lang] || text['en'] || "";
  };

  const hasPreviewPrev = previewActivity && previewActivitiesList.length > 0 && previewActivitiesList.findIndex((a:any) => a.id === previewActivity.id) > 0;
  const hasPreviewNext = previewActivity && previewActivitiesList.length > 0 && previewActivitiesList.findIndex((a:any) => a.id === previewActivity.id) >= 0 && previewActivitiesList.findIndex((a:any) => a.id === previewActivity.id) < previewActivitiesList.length - 1;
  const submitPreviewAnswer = handlePreviewSubmit;
  const currentPreviewIdx = previewActivity ? previewActivitiesList.findIndex((a:any) => a.id === previewActivity.id) : 0;
  
  const downloadTemplate = () => {};

  const getGradeDisplay = (g: any) => (GRADE_LABELS as any)[g]?.[language === 'ar' ? 'ar' : 'en'] || g;
  
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const allExistingSkills = Array.from(new Set([
    ...DEFAULT_SKILLS,
    ...customSkills,
    ...Object.values(activitiesData).flatMap((acts: any) => acts.map((a: any) => a.skill).filter(Boolean))
  ]));

  const getLessonMetadata = (lesson: any) => {
    let md: any = {};
    if (typeof lesson.metadata === 'string') {
      try { md = JSON.parse(lesson.metadata); } catch (e) {}
    } else if (lesson.metadata && typeof lesson.metadata === 'object') {
      md = lesson.metadata;
    }
    return md;
  };
  
  const isGrade123 = (g: string) => ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي"].includes(g);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Hidden File Input for Excel */}
      <input 
        type="file" 
        ref={excelInputRef} 
        style={{ display: 'none' }} 
        accept=".xlsx,.xls" 
        onChange={handleExcelUpload} 
      />

      <div className="space-y-6 sm:space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header Section */}
        <div className="relative bg-white rounded-[20px] sm:rounded-[50px] p-4 sm:p-12 overflow-hidden shadow-sm border border-slate-100">
           <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
              <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-8 ${language === 'ar' ? 'text-right sm:items-start' : 'text-left sm:items-start'}`}>
                 <button 
                   onClick={() => router.push('/super-admin/skills-hub')}
                   className="w-10 h-10 sm:w-14 h-14 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-full flex items-center justify-center transition-all shrink-0 hover:bg-slate-100"
                 >
                   <ArrowLeft className={`w-5 h-5 sm:w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
                 </button>
                 <div className="w-12 h-12 sm:w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-[35px] flex items-center justify-center shadow-xl sm:shadow-2xl shadow-amber-500/20 transform -rotate-3 shrink-0">
                    <Edit2 className="w-6 h-6 sm:w-12 h-12 text-white" />
                 </div>
                 <div>
                    <h1 className="text-lg sm:text-4xl font-black text-slate-900 mb-1 sm:mb-3 tracking-tight">
                       {clusterData.name}
                    </h1>
                    <p className="text-slate-500 text-[10px] sm:text-lg font-bold max-w-xl">
                       {language === 'ar' ? "تعديل إعدادات المحور وإدارة الدروس والأنشطة المرتبطة به." : "Edit cluster settings and manage its lessons and activities."}
                    </p>
                 </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-500/5 blur-[120px] rounded-full -mr-20"></div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-4 p-2 bg-white rounded-2xl sm:rounded-full shadow-sm border border-slate-100">
           {[
             { id: 'info', icon: Settings, label: language === 'ar' ? "الإعدادات" : "Settings" },
             { id: 'lessons', icon: ListOrdered, label: language === 'ar' ? "الدروس (المهارات الفرعية)" : "Lessons" }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-full font-black text-xs sm:text-sm transition-all whitespace-nowrap ${
                 activeTab === tab.id 
                 ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" 
                 : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
               }`}
             >
               <tab.icon className="w-4 h-4 sm:w-5 h-5" />
               {tab.label}
             </button>
           ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-10 animate-in fade-in duration-300">
            <div className="space-y-8 max-w-4xl">
              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "اسم المحور المهاراتي" : "Cluster Name"} <span className="text-red-500">*</span>
                 </label>
                 <input 
                   type="text" value={clusterData.name} onChange={(e) => setClusterData({ ...clusterData, name: e.target.value })}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "الوصف" : "Description"}
                 </label>
                 <textarea 
                   value={clusterData.description} onChange={(e) => setClusterData({ ...clusterData, description: e.target.value })}
                   rows={3} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 resize-none"
                 />
              </div>

              {/* Subject Selection */}
              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "المادة" : "Subject"} <span className="text-red-500">*</span>
                 </label>
                 <select 
                   value={clusterData.subject} 
                   onChange={(e) => { 
                     const sub = e.target.value; 
                     if (sub === "العلوم" && selectedGrades.some(g => isGrade123(g))) { 
                       showToast(language === 'ar' ? "تنبيه: مادة العلوم غير مقرر للصفوف 1-3." : "Notice: Science is not applicable for Grades 1-3 Primary.", "error"); 
                       return; 
                     } 
                     setClusterData({ ...clusterData, subject: sub }); 
                   }} 
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none"
                 >
                    <option value="">{language === 'ar' ? "اختر المادة..." : "Select Subject..."}</option>
                    {SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                 </select>
              </div>

              {/* Grades Multi-Selection */}
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       {language === 'ar' ? "المراحل / الصفوف الدراسية (تحديد متعدد)" : "Grade Levels (Multi-Select)"}
                       <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedGrades.length === CANONICAL_GRADES.length) {
                          setSelectedGrades([]);
                        } else {
                          setSelectedGrades([...CANONICAL_GRADES]);
                        }
                      }}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                    >
                      {selectedGrades.length === CANONICAL_GRADES.length
                        ? (language === 'ar' ? "إلغاء تحديد الكل" : "Unselect All")
                        : (language === 'ar' ? "تحديد الكل" : "Select All")}
                    </button>
                 </div>

                 <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 max-h-[220px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                    {CANONICAL_GRADES.map(g => {
                      const isSelected = selectedGrades.includes(g);
                      return (
                        <label
                          key={g}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-amber-50 border-amber-400 text-amber-900 shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGrades([...selectedGrades, g]);
                              } else {
                                setSelectedGrades(selectedGrades.filter(item => item !== g));
                              }
                            }}
                          />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                          <span className="text-xs sm:text-sm font-bold">{getGradeDisplay(g)}</span>
                        </label>
                      );
                    })}
                 </div>
              </div>

              {isSuperAdmin && (
                <div className="pt-6 border-t border-slate-100 space-y-6">
                   <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <div>
                         <h4 className="font-black text-slate-900">{language === 'ar' ? "محور مركزي" : "Central Cluster"}</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={clusterData.isCentral} onChange={(e) => setClusterData({ ...clusterData, isCentral: e.target.checked, schoolId: e.target.checked ? "" : clusterData.schoolId })} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                   </div>
                   
                   {!clusterData.isCentral && (
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">{language === 'ar' ? "المدرسة" : "School"}</label>
                        <select 
                          value={clusterData.schoolId} onChange={(e) => setClusterData({ ...clusterData, schoolId: e.target.value })}
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                        >
                           <option value="">{language === 'ar' ? "اختر المدرسة..." : "Select School..."}</option>
                           {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                   )}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                 <button 
                   onClick={handleUpdateCluster} disabled={isSaving}
                   className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                 >
                   <Save className="w-5 h-5" />
                   {language === 'ar' ? "تحديث المحور" : "Update Cluster"}
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
               <div>
                  <h2 className="text-xl font-black text-slate-900">{language === 'ar' ? "الدروس (المهارات الفرعية)" : "Skill Lessons"}</h2>
                  <p className="text-slate-500 text-sm font-bold mt-1">{language === 'ar' ? "أضف ورتب الدروس التي تندرج تحت هذا المحور." : "Add and arrange lessons under this cluster."}</p>
               </div>
               <button 
                 onClick={openAddLesson}
                 className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
               >
                  <Plus className="w-5 h-5" />
                  {language === 'ar' ? "درس جديد" : "New Lesson"}
               </button>
            </div>

            <div className="space-y-4">
              {lessons.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-[32px] p-16 text-center shadow-sm max-w-lg mx-auto my-8 animate-in fade-in duration-300">
                     <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <BookOpen className="w-10 h-10 text-indigo-500" />
                     </div>
                     <h3 className="text-lg font-black text-slate-900 mb-2">{language === 'ar' ? "المحور خالي من الدروس" : "No Lessons Found"}</h3>
                     <p className="text-slate-500 text-sm font-bold max-w-sm mx-auto mb-6 leading-relaxed">
                        {language === 'ar' ? "لم يتم إنشاء أي دروس في هذا المحور حتى الآن. أضف أول درس للبدء في بناء الأنشطة التفاعلية." : "This cluster has no lessons yet. Add your first lesson to start building interactive activities."}
                     </p>
                     <button 
                       onClick={openAddLesson}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 mx-auto shadow-md shadow-indigo-600/10 transition-all"
                     >
                        <Plus className="w-4 h-4" />
                        {language === 'ar' ? "إنشاء أول درس" : "Create First Lesson"}
                     </button>
                  </div>
              ) : (
                lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                     {/* Lesson Header Row */}
                     <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50">
                        <div className="flex items-center gap-4 flex-1">
                           <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                              {lesson.order || 0}
                           </div>
                           <div>
                              <h3 className="text-lg font-black text-slate-900">{lesson.name}</h3>
                              <p className="text-slate-500 text-sm font-bold line-clamp-1">{getCleanDescription(lesson.description) || (language === 'ar' ? "لا يوجد وصف" : "No description")}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {(lesson._count?.activities || 0) > 0 && (
                              <button
                                onClick={() => startPreviewLesson(lesson.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 rounded-lg font-black text-[10px] transition-all shadow-sm"
                                title={language === 'ar' ? "معاينة الاختبار كامل" : "Preview Full Test"}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{language === 'ar' ? "معاينة" : "Preview"}</span>
                              </button>
                            )}
                           <button 
                             onClick={() => toggleLessonExpand(lesson.id)}
                             className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all"
                           >
                              {expandedLessonId === lesson.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {language === 'ar' ? "الأنشطة" : "Activities"} 
                              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">{lesson._count?.activities || 0}</span>
                           </button>
                           <button 
                             onClick={() => openEditLesson(lesson)}
                             className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-all"
                           >
                              <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteLesson(lesson.id)}
                             className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-100 transition-all"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>

                     {/* Expanded Activities Section */}
                     {expandedLessonId === lesson.id && (
                        <div className="bg-slate-50/50 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                              <h4 className="font-black text-slate-700 text-sm">{language === 'ar' ? "الأنشطة التفاعلية (أسئلة)" : "Interactive Activities (Questions)"}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // uploadingLessonId is handled by the hook, we can just trigger click
                                    excelInputRef.current?.click();
                                  }}
                                  disabled={uploadingLessonId === lesson.id}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  <Upload className="w-4 h-4" />
                                  {language === 'ar' ? 'استيراد' : 'Import'}
                                </button>
                                <button 
                                  onClick={downloadTemplate}
                                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  <Download className="w-4 h-4" />
                                  {language === 'ar' ? 'نموذج' : 'Template'}
                                </button>
                                <button 
                                  onClick={() => openAddActivity(lesson.id)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                  {language === 'ar' ? "إضافة نشاط" : "Add Activity"}
                                </button>
                              </div>
                           </div>

                           <div className="space-y-3">
                              {!activitiesData[lesson.id] ? (
                                <div className="text-center p-4 text-slate-400 font-bold text-sm animate-pulse">Loading...</div>
                              ) : activitiesData[lesson.id]?.length === 0 ? (
                                <div className="text-center p-8 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-500 font-bold text-sm max-w-md mx-auto my-4 w-full"> <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3 animate-pulse" /> <p className="text-slate-800 font-black mb-1">{language === 'ar' ? "الدرس فارغ حالياً" : "Lesson is Empty"}</p> <p className="text-slate-400 text-xs mb-4 font-bold">{language === 'ar' ? "لم تقم بإضافة أي أنشطة أو أسئلة تفاعلية بعد." : "You have not added any interactive activities or questions yet."}</p> <button onClick={() => openAddActivity(lesson.id)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 border border-indigo-100 rounded-xl font-black text-xs transition-all mx-auto block">{language === 'ar' ? "إضافة أول نشاط" : "Add First Activity"}</button> </div>
                              ) : (
                                activitiesData[lesson.id].map((activity, idx) => (
                                  <div key={activity.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-300 transition-all shadow-sm">
                                     <div className="flex items-center gap-3 w-full">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                                          {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                           <div className="flex items-center gap-2 mb-1">
                                             <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{activity.type}</span>
                                             <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded">{activity.points} pts</span>
                                           </div>
                                           <h5 className="font-black text-slate-800 text-sm truncate">{activity.title}</h5>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-2 shrink-0">
                                         <button 
                                           onClick={() => startPreviewActivity(activity, lesson.id)}
                                           className="text-slate-400 hover:text-sky-650 p-2 hover:bg-sky-50 rounded-lg transition-all"
                                           title={language === 'ar' ? "معاينة الطالب" : "Student Preview"}
                                         >
                                            <Play className="w-4 h-4 fill-current" />
                                         </button>
                                        <button 
                                          onClick={() => openEditActivity(activity)}
                                          className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                           <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteActivity(activity.id, lesson.id)}
                                          className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                           <Trash2 className="w-4 h-4" />
                                        </button>
                                     </div>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>
                     )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* Lesson Modal */}
      {mounted && isLessonModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">
                {editingLesson?.id ? (language === 'ar' ? 'تعديل الدرس' : 'Edit Lesson') : (language === 'ar' ? 'إضافة درس جديد' : 'Add New Lesson')}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">{language === 'ar' ? "اسم الدرس" : "Lesson Name"}</label>
                <input 
                  type="text" value={editingLesson?.name || ""} onChange={(e) => setEditingLesson({...editingLesson, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">{language === 'ar' ? "وصف مختصر (اختياري)" : "Description (Optional)"}</label>
                <textarea 
                  value={editingLesson?.description || ""} onChange={(e) => setEditingLesson({...editingLesson, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-amber-500 outline-none resize-none" rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">{language === 'ar' ? "الترتيب" : "Order"}</label>
                <input 
                  type="number" value={editingLesson?.order || 0} onChange={(e) => setEditingLesson({...editingLesson, order: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsLessonModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">{language === 'ar' ? "إلغاء" : "Cancel"}</button>
              <button onClick={handleSaveLesson} className="px-6 py-2.5 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-md transition-all">{language === 'ar' ? "حفظ الدرس" : "Save Lesson"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Activity Modal */}
      {mounted && isActivityModalOpen && editingActivity && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-[24px] w-full max-w-5xl max-h-full flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30 shrink-0">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {editingActivity.id ? (language === 'ar' ? 'تعديل النشاط التفاعلي' : 'Edit Interactive Activity') : (language === 'ar' ? 'إنشاء نشاط تفاعلي' : 'Create Interactive Activity')}
              </h3>
              <button onClick={() => setIsActivityModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                &times;
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-slate-50/20">
              
              {/* Top Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "عنوان السؤال (Question Title)" : "Question Title"} <span className="text-red-500">*</span></label>
                  <input 
                    type="text" value={editingActivity.title} onChange={(e) => setEditingActivity({...editingActivity, title: e.target.value})}
                    placeholder={language === 'ar' ? "مثال: سؤال جمع، توصيل..." : "e.g. Addition Question..."}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نوع النشاط التفاعلي" : "Activity Type"} <span className="text-red-500">*</span></label>
                  <select 
                    value={editingActivity.type} 
                    onChange={(e) => {
                      const newType = e.target.value;
                      const type = newType;
                      const defaultData: any = {
                        'interactive_drag_drop': { left: [], right: [] } as any,
                        'interactive_fill_blanks': { sentence: '', blanks: [] } as any,
                        'interactive_classification': { groups: [], items: [] } as any,
                        'interactive_clock': { time: '12:00', minuteStep: 5 } as any,
                        'interactive_graph': { nodes: [], edges: [] } as any,
                        'interactive_video': { videoUrl: '', bookmarks: [] } as any,
                        'mcq': { questionText: '', choices: [{id:'1',text:'',isCorrect:true}] } as any,
                      }[type] || {};

                      setEditingActivity({
                        ...editingActivity, 
                        type: newType,
                        options: defaultData,
                        correctAnswer: JSON.stringify(defaultData)
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 focus:border-indigo-500 focus:bg-white outline-none"
                  >
                     <option value="MCQ">{language === 'ar' ? 'اختيار من متعدد (MCQ)' : 'Multiple Choice (MCQ)'}</option>
                     <option value="TRUE_FALSE">{language === 'ar' ? 'صح / خطأ (T/F)' : 'True / False (T/F)'}</option>
                     <option value="MULTI_SELECT">{language === 'ar' ? 'اختيار متعدد (تحديد)' : 'Multi-select (Checkboxes)'}</option>
                     <option value="MATCHING">{language === 'ar' ? 'سؤال التوصيل (Matching)' : 'Matching Elements'}</option>
                     <option value="DRAG_DROP_FILL">{language === 'ar' ? 'سحب الفراغات (Drag & Drop)' : 'Drag & Drop Fill'}</option>
                     <option value="GROUP_SORTING">{language === 'ar' ? 'تصنيف المجموعات' : 'Group Sorting'}</option>
                     <option value="NUMBER_LINE">{language === 'ar' ? 'خط الأعداد' : 'Number Line'}</option>
                     <option value="CLOCK">{language === 'ar' ? 'عقارب الساعة' : 'Interactive Clock'}</option>
                     <option value="MIND_MAP">{language === 'ar' ? 'خريطة مفاهيم' : 'Concept Mind Map'}</option>
                     <option value="VIDEO_CHECKPOINT">{language === 'ar' ? 'فيديو تفاعلي' : 'Interactive Video'}</option>
                     <option value="SWIPE_SORT">{language === 'ar' ? 'سحب سريع (Swipe)' : 'Swipe Sort'}</option>
                     <option value="MAZE">{language === 'ar' ? 'المتاهة (Maze)' : 'Educational Maze'}</option>
                     <option value="WORD_SEARCH">{language === 'ar' ? 'البحث عن الكلمات' : 'Word Search'}</option>
                     <option value="GEOGEBRA">{language === 'ar' ? 'جيوجيبرا (GeoGebra)' : 'GeoGebra Widget'}</option>
                     <option value="FLASH_CARD">{language === 'ar' ? 'بطاقات (Flash Cards)' : 'Flash Cards'}</option>
                     <option value="MEMORY_GAME">{language === 'ar' ? 'لعبة الذاكرة' : 'Memory Game'}</option>
                     <option value="WORD_SCRAMBLE">{language === 'ar' ? 'ترتيب الحروف' : 'Word Scramble'}</option>
                     <option value="SENTENCE_REORDER">{language === 'ar' ? 'ترتيب الجملة' : 'Sentence Reorder'}</option>
                     <option value="MATH_EQUATION">{language === 'ar' ? 'معادلة رياضية' : 'Math Equation'}</option>
                     <option value="SEQUENCE_ORDER">{language === 'ar' ? 'ترتيب التسلسل' : 'Sequence Order'}</option>
                     <option value="COUNT_OBJECTS">{language === 'ar' ? 'عد العناصر' : 'Count Objects'}</option>
                     <option value="IMAGE_LABEL">{language === 'ar' ? 'تسمية الصورة' : 'Image Labeling'}</option>
                     <option value="COLOR_MATCH">{language === 'ar' ? 'تطابق الألوان' : 'Color Match'}</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المهارة" : "Skill"}</label>
                   <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow pr-10 appearance-none"
                      value={editingActivity?.skill || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, skill: e.target.value })}
                   />
                </div>

                {/* Question Rich Text */}
                <div className="space-y-2 md:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نص السؤال (Question Text)" : "Question Text"}</label>
                  <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden min-h-[200px] shadow-sm hover:border-indigo-300 transition-all duration-300">
                    <RichTextEditor 
                      value={editingActivity.questionText || ""} 
                      onChange={(val) => setEditingActivity({...editingActivity, questionText: val})} 
                    />
                  </div>
                </div>

                {/* Additional Metadata row */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "النقاط (الدرجة)" : "Points"}</label>
                  <input 
                    type="number" value={editingActivity.points} onChange={(e) => setEditingActivity({...editingActivity, points: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "⭐ نقاط XP" : "⭐ XP Points"}</label>
                  <input 
                    type="number" value={editingActivity.xpPoints !== undefined ? editingActivity.xpPoints : 10} onChange={(e) => setEditingActivity({...editingActivity, xpPoints: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "الصعوبة" : "Difficulty"}</label>
                  <select value={editingActivity.difficulty} onChange={(e) => setEditingActivity({...editingActivity, difficulty: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
                    <option value="Foundation">{language === 'ar' ? 'تأسيسي' : 'Foundation'}</option>
                    <option value="On Level">{language === 'ar' ? 'في المستوى' : 'On Level'}</option>
                    <option value="Advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "عمق المعرفة (DOK)" : "DOK"}</label>
                  <select value={editingActivity.dok || ""} onChange={(e) => setEditingActivity({...editingActivity, dok: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
                    <option value="">{language === 'ar' ? 'لا يوجد' : 'None'}</option>
                    <option value="DOK 1">DOK 1</option>
                    <option value="DOK 2">DOK 2</option>
                    <option value="DOK 3">DOK 3</option>
                    <option value="DOK 4">DOK 4</option>
                  </select>
                </div>
              </div>

              {/* Core Interactive Editor */}
              <div className="bg-white border border-indigo-100 rounded-[24px] shadow-sm p-6 overflow-hidden">
                 <InteractiveQuestionEditor 
                   question={editingActivity}
                   onChange={(updatedQ) => setEditingActivity(updatedQ)}
                   language={language}
                 />
              </div>

              {/* Explanation (Optional) */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">{language === 'ar' ? "التفسير (يظهر بعد الإجابة - اختياري)" : "Explanation (Shows after answering - Optional)"}</label>
                <textarea 
                  value={editingActivity.explanation || ""} onChange={(e) => setEditingActivity({...editingActivity, explanation: e.target.value})}
                  rows={3}
                  placeholder={language === 'ar' ? "اكتب شرحاً يوضح سبب الإجابة الصحيحة للطالب..." : "Explain why the answer is correct..."}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                />
              </div>

              {/* Educational Standards & Alignment */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  {language === 'ar' ? "المواءمة والمعايير التعليمية" : "Educational Standards & Alignment"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المعيار التعليمي" : "Educational Standard"}</label>
                    <select
                      value={editingActivity.standard || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const lesson = lessons.find(l => l.id === editingActivity.lessonId);
                        const lessonMetadata = getLessonMetadata(lesson);

                        if (val === "add_custom") {
                          const newVal = prompt(language === 'ar' ? "أدخل معيار مخصص جديد:" : "Enter custom standard:");
                          if (newVal && newVal.trim()) {
                            const trimmed = newVal.trim();
                            const updatedMetadata = {
                              ...lessonMetadata,
                              standards: Array.from(new Set([...lessonMetadata.standards, trimmed]))
                            };
                            await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                            setEditingActivity({ ...editingActivity, standard: trimmed });
                          }
                        } else {
                          setEditingActivity({ ...editingActivity, standard: val });
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="">{language === 'ar' ? '-- اختر المعيار --' : '-- Select Standard --'}</option>
                      {getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).standards.map((std: string) => (
                        <option key={std} value={std}>{std}</option>
                      ))}
                      {editingActivity.standard && !getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).standards.includes(editingActivity.standard) && (
                        <option value={editingActivity.standard}>{editingActivity.standard}</option>
                      )}
                      <option value="add_custom" className="text-indigo-600 font-bold">
                        {language === 'ar' ? '+ إضافة معيار مخصص...' : '+ Add Custom Standard...'}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{"Performance Indicator"}</label>
                    <select
                      value={editingActivity.indicator || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const lesson = lessons.find(l => l.id === editingActivity.lessonId);
                        const lessonMetadata = getLessonMetadata(lesson);

                        if (val === "add_custom") {
                          const newVal = prompt(language === 'ar' ? "أدخل مؤشر مخصص جديد:" : "Enter custom indicator:");
                          if (newVal && newVal.trim()) {
                            const trimmed = newVal.trim();
                            const updatedMetadata = {
                              ...lessonMetadata,
                              indicators: Array.from(new Set([...lessonMetadata.indicators, trimmed]))
                            };
                            await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                            setEditingActivity({ ...editingActivity, indicator: trimmed });
                          }
                        } else {
                          setEditingActivity({ ...editingActivity, indicator: val });
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="">{language === 'ar' ? '-- اختر المؤشر --' : '-- Select Indicator --'}</option>
                      {getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).indicators.map((ind: string) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                      {editingActivity.indicator && !getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).indicators.includes(editingActivity.indicator) && (
                        <option value={editingActivity.indicator}>{editingActivity.indicator}</option>
                      )}
                      <option value="add_custom" className="text-indigo-600 font-bold">
                        {language === 'ar' ? '+ إضافة مؤشر مخصص...' : '+ Add Custom Indicator...'}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "مخرج التعلم المستهدف" : "Learning Outcome"}</label>
                    <select
                      value={editingActivity.learningOutcome || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const lesson = lessons.find(l => l.id === editingActivity.lessonId);
                        const lessonMetadata = getLessonMetadata(lesson);

                        if (val === "add_custom") {
                          const newVal = prompt(language === 'ar' ? "أدخل مخرج تعلم مخصص جديد:" : "Enter custom learning outcome:");
                          if (newVal && newVal.trim()) {
                            const trimmed = newVal.trim();
                            const updatedMetadata = {
                              ...lessonMetadata,
                              outcomes: Array.from(new Set([...lessonMetadata.outcomes, trimmed]))
                            };
                            await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                            setEditingActivity({ ...editingActivity, learningOutcome: trimmed });
                          }
                        } else {
                          setEditingActivity({ ...editingActivity, learningOutcome: val });
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="">{language === 'ar' ? '-- اختر مخرج التعلم --' : '-- Select Learning Outcome --'}</option>
                      {getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).outcomes.map((out: string) => (
                        <option key={out} value={out}>{out}</option>
                      ))}
                      {editingActivity.learningOutcome && !getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).outcomes.includes(editingActivity.learningOutcome) && (
                        <option value={editingActivity.learningOutcome}>{editingActivity.learningOutcome}</option>
                      )}
                      <option value="add_custom" className="text-indigo-600 font-bold">
                        {language === 'ar' ? '+ إضافة مخرج مخصص...' : '+ Add Custom Outcome...'}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Learning Aids & Supports */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {language === 'ar' ? "مساعدات التعلم والتوجيه الذكي" : "Learning Supports & Intelligent Guidance"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "التلميح المساعد" : "Hint"}</label>
                    </div>
                    <textarea 
                      value={editingActivity.hint || ""} onChange={(e) => setEditingActivity({...editingActivity, hint: e.target.value})}
                      rows={2}
                      placeholder={language === 'ar' ? "تلميح بسيط لمساعدة الطالب على الحل..." : "Simple hint to help the student..."}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نصيحة تعليمية" : "Tip"}</label>
                    </div>
                    <textarea 
                      value={editingActivity.tip || ""} onChange={(e) => setEditingActivity({...editingActivity, tip: e.target.value})}
                      rows={2}
                      placeholder={language === 'ar' ? "نصيحة لتجنب الأخطاء الشائعة..." : "Tip to avoid common mistakes..."}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "الرؤية المعرفية / الخلاصة" : "Key Insight"}</label>
                    </div>
                    <textarea 
                      value={editingActivity.keyInsight || ""} onChange={(e) => setEditingActivity({...editingActivity, keyInsight: e.target.value})}
                      rows={2}
                      placeholder={language === 'ar' ? "الخلاصة أو الفكرة الكبرى من السؤال..." : "The big idea or summary behind the question..."}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={() => setIsActivityModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">{language === 'ar' ? "إلغاء" : "Cancel"}</button>
              <button onClick={handleSaveActivity} className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all">
                <CheckCircle2 className="w-5 h-5" />
                {language === 'ar' ? "حفظ النشاط" : "Save Activity"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Student Preview Play Modal - Full Page Unified Form */}
      {mounted && previewActivity && createPortal(
        <div className="fixed inset-0 z-[150] bg-slate-50 flex flex-col w-full h-full min-h-screen overflow-hidden text-slate-900 animate-in fade-in duration-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Header Bar */}
          <header className="bg-white px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-800 text-xs font-black">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>{language === 'ar' ? 'معاينة الطالب' : 'STUDENT PREVIEW'}</span>
              </div>
              
              {previewActivitiesList.length > 1 && (
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-xs font-black border border-indigo-100">
                  {currentPreviewIdx + 1} / {previewActivitiesList.length}
                </span>
              )}

              <h3 className="text-base md:text-lg font-black text-slate-800 truncate max-w-md hidden sm:block">
                {translateText(previewActivity.title, language)}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-700 text-xs font-black shadow-2xs">
                <Award className="w-4 h-4 text-amber-500" />
                <span>+{previewActivity.xpPoints || previewActivity.points || 10} XP</span>
              </div>

              <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all ${
                previewTimeLeft !== null && previewTimeLeft <= 10 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' 
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <Clock className={`w-4 h-4 ${previewTimeLeft !== null && previewTimeLeft <= 10 ? 'text-rose-500' : 'text-indigo-600'}`} />
                <span>
                  {previewTimeLeft !== null
                    ? `${language === 'ar' ? 'الوقت' : 'Time'}: ${Math.floor(previewTimeLeft / 60)}:${(previewTimeLeft % 60).toString().padStart(2, '0')}`
                    : `${previewActivity.estimatedTime || 60}s`}
                </span>
              </div>

              <button
                onClick={() => setPreviewActivity(null)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors border border-slate-200 cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                title={language === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">{language === 'ar' ? 'إغلاق' : 'Close'}</span>
              </button>
            </div>
          </header>

          {/* Main Full Page Body */}
          <main className="flex-1 flex flex-col gap-6 p-2 sm:p-4 md:p-6 overflow-hidden max-w-5xl w-full mx-auto">
            
            {/* Sidebar: Helpers & Metadata */}
            {/* Main Interactive Workspace */}
            <section className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 flex flex-col shadow-sm overflow-hidden min-h-0">
              
              {previewIsLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0 pe-2 pb-2 flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 mb-1">
                    {/* Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <InteractiveTag 
                        label={language === 'ar' ? 'المعيار' : 'Standard'} 
                        value={previewActivity.standard} 
                        icon={Target} 
                        colorClass="bg-rose-50 text-rose-700 border border-rose-100" 
                        bubbleTheme="border-rose-200 text-rose-800" 
                      />
                      <InteractiveTag 
                        label={language === 'ar' ? 'المؤشر' : 'Indicator'} 
                        value={previewActivity.indicator} 
                        icon={CheckCircle2} 
                        colorClass="bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        bubbleTheme="border-emerald-200 text-emerald-800" 
                      />
                      <InteractiveTag 
                        label={language === 'ar' ? 'الهدف' : 'Outcome'} 
                        value={previewActivity.learningOutcome} 
                        icon={GraduationCap} 
                        colorClass="bg-purple-50 text-purple-700 border border-purple-100" 
                        bubbleTheme="border-purple-200 text-purple-800" 
                      />
                      <InteractiveTag 
                        label={language === 'ar' ? 'DOK' : 'DOK'} 
                        value={previewActivity.dok} 
                        icon={BrainCircuit} 
                        colorClass="bg-amber-50 text-amber-700 border border-amber-100" 
                        bubbleTheme="border-amber-200 text-amber-800" 
                      />
                      <InteractiveTag 
                        label={language === 'ar' ? 'المستوى' : 'Level'} 
                        value={previewActivity.skillLevel} 
                        icon={Layers} 
                        colorClass="bg-sky-50 text-sky-700 border border-sky-100" 
                        bubbleTheme="border-sky-200 text-sky-800" 
                      />
                    </div>

                    {/* Helper Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {previewActivity.hint && (
                        <button
                          onClick={() => {
                            setPreviewHintsUsed(prev => prev + 1);
                            setPreviewHelperModal({ type: "hint", content: translateText(previewActivity.hint, language) });
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:scale-[1.02] text-amber-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تلميح' : 'Hint'}</span>
                        </button>
                      )}
                      {previewActivity.tip && (
                        <button
                          onClick={() => setPreviewHelperModal({ type: "tip", content: translateText(previewActivity.tip, language) })}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:scale-[1.02] text-emerald-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'نصيحة' : 'Tip'}</span>
                        </button>
                      )}
                      {previewActivity.keyInsight && (
                        <button
                          onClick={() => setPreviewHelperModal({ type: "keyInsight", content: translateText(previewActivity.keyInsight, language) })}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:scale-[1.02] text-indigo-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'فكرة' : 'Insight'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between hidden">
                    <h3 className="text-lg md:text-xl font-black text-slate-900">
                      {translateText(previewActivity.title, language)}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg border border-sky-100">
                      {previewActivity.type || "MCQ"}
                    </span>
                  </div>

                  <div className="w-full flex-1 min-w-0 overflow-y-auto py-2 pr-2">
                    <InteractiveQuestionRenderer
                      question={previewActivity}
                      value={previewAnswer}
                      onChange={setPreviewAnswer}
                      language={language}
                    />
                  </div>
                </div>
              )}

              {/* Action Bar & Answer Confirm Button */}
              <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setPreviewActivity(null)}
                  className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer w-full sm:w-auto"
                >
                  {language === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                  <button
                    type="button"
                    onClick={handlePreviewPrev}
                    disabled={!hasPreviewPrev}
                    className={`px-5 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-2 ${
                      hasPreviewPrev
                        ? "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 cursor-pointer"
                        : "bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePreviewNext}
                    disabled={!hasPreviewNext}
                    className={`px-5 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-2 ${
                      hasPreviewNext
                        ? "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 cursor-pointer"
                        : "bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
                    {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={submitPreviewAnswer}
                    disabled={!previewAnswer || previewIsSubmitting}
                    className={`px-10 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
                      !previewAnswer || previewIsSubmitting
                        ? "bg-sky-100 text-sky-400 cursor-not-allowed border border-sky-200/50 shadow-none"
                        : "bg-sky-500 text-white hover:bg-sky-600 shadow-xl shadow-sky-500/25 border border-sky-500/20"
                    }`}
                  >
                    {previewIsSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {language === 'ar' ? 'جاري التقييم...' : 'Evaluating...'}
                      </>
                    ) : (
                      <>
                        <span>{language === 'ar' ? 'أرسل الحل للتصحيح' : 'Submit for review'}</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </footer>

            </section>

          </main>

          {/* Feedback Popup Modal */}
          {previewToast && (
            <AnimatedFeedback
              isCorrect={previewToast.isCorrect}
              xp={previewToast.xp}
              streak={previewToast.streak}
              onComplete={() => setPreviewToast(null)}
            />
          )}



        </div>,
        document.body
      )}

      {/* Helper Modal Popup inside play preview */}
      {mounted && previewHelperModal.type && createPortal(
        <div className="fixed inset-0 z-[170] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-500" />
              {previewHelperModal.type === "hint" && (language === 'ar' ? "💡 فكرة للمساعدة (Hint)" : "💡 Hint")}
              {previewHelperModal.type === "tip" && (language === 'ar' ? "🧠 نصيحة ذكية (Tip)" : "🧠 Smart Tip")}
              {previewHelperModal.type === "keyInsight" && (language === 'ar' ? "📘 فكرة جوهرية (Key Insight)" : "📘 Key Insight")}
            </h4>
            <p className="text-slate-600 text-sm font-bold leading-relaxed">{previewHelperModal.content}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewHelperModal({ type: null, content: "" })}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                {language === 'ar' ? "حسناً" : "Close"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  );
}
