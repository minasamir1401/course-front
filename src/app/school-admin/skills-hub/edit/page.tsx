"use client";
import { translateMetadataFields } from "@/lib/questionMetadataTranslation";
import { questionMetadata } from "@/lib/bilingualMetadata";
import ActivityEditorModal from "./ActivityEditorModal";
import { downloadSkillTemplate, downloadSkillMetadataTemplate, readSkillMetadata } from '@/lib/skillExcel';

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { ArrowLeft, ArrowRight, Save, BookOpen, Layers, Monitor, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Settings, ListOrdered, CheckCircle2, Sparkles, Upload, Download, Play, Clock, X, Info, BrainCircuit, Star, StarOff, RefreshCw, Target, GraduationCap, Award, Zap, HelpCircle, Globe, Languages, Loader2 } from 'lucide-react';
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";
import InteractiveQuestionRenderer from "@/components/InteractiveQuestionRenderer";
import AnimatedFeedback from "@/components/AnimatedFeedback";
import { InteractiveTag } from "@/components/InteractiveTag";
import HtmlRenderer from "@/components/HtmlRenderer";
import VideoPlayer from "@/components/VideoPlayer";
import RichTextEditor from "@/components/RichTextEditor";
import QuestionImageGallery from "@/components/QuestionImageGallery";
import { extractImageUrls } from "@/lib/image-utils";
import { translateBatch } from "@/lib/translationService";


import { useClusterInfo } from './hooks/useClusterInfo';
import { useLessons } from './hooks/useLessons';
import { useActivities } from './hooks/useActivities';
import { useStudentPreview } from './hooks/useStudentPreview';
import { GRADE_LABELS, CANONICAL_GRADES, SUBJECTS, DEFAULT_SKILLS } from './constants';

export default function EditSchoolSkillClusterPage() {
  const { language } = useLanguage();
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

  
  const importLessonRef = React.useRef<string | null>(null);
  const metadataLessonRef = React.useRef<string | null>(null);
  const excelInputRef = React.useRef<HTMLInputElement>(null);
  const metadataExcelRef = React.useRef<HTMLInputElement>(null);
  const downloadMetadataTemplate = downloadSkillMetadataTemplate;


  const { isLoading, isSaving, schools, isSuperAdmin, activeTab, setActiveTab, selectedGrades, setSelectedGrades, selectedSchoolIds, setSelectedSchoolIds, clusterData, setClusterData, handleUpdateCluster } = clusterInfo;
  const schoolId = clusterData?.schoolId || '';
  const { lessons, setLessons, isLessonModalOpen, setIsLessonModalOpen, editingLesson, setEditingLesson, openAddLesson, openEditLesson, handleSaveLesson, handleDeleteLesson, uploadingLessonId } = lessonsMgr;
  
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (importLessonRef.current) {
      void lessonsMgr.handleExcelUpload(e, importLessonRef.current).then(() => activitiesMgr.fetchActivities(importLessonRef.current!));
    }
  };

  const { expandedLessonId, setExpandedLessonId, activitiesData, setActivitiesData, toggleLessonExpand, isActivityModalOpen, setIsActivityModalOpen, editingActivity, setEditingActivity, openAddActivity, openEditActivity, handleSaveActivity, handleDeleteActivity } = activitiesMgr;
  const { previewActivity, setPreviewActivity, previewAnswer, setPreviewAnswer, previewIsSubmitting, setPreviewIsSubmitting, previewResult, setPreviewResult, previewToast, setPreviewToast, previewStartTime, setPreviewStartTime, previewHintsUsed, setPreviewHintsUsed, previewAttemptCount, setPreviewAttemptCount, previewHelperModal, setPreviewHelperModal, previewActivitiesList, setPreviewActivitiesList, previewTimeLeft, setPreviewTimeLeft, previewIsLoading, setPreviewIsLoading, openPreview, closePreview, handlePreviewNext, handlePreviewPrev, handlePreviewSubmit, handlePreviewRetry } = previewMgr;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const [activityActiveLang, setActivityActiveLang] = useState<'ar' | 'en'>('ar');
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');
  const [isTranslatingActivity, setIsTranslatingActivity] = useState(false);

  useEffect(() => {
    if (!isActivityModalOpen || !editingActivity) return;
    const clean = (str?: string) => String(str || '').replace(/<[^>]*>/g, '').trim();
    const hasAr = (str?: string) => /[\u0600-\u06FF]/.test(clean(str));
    const hasEn = (str?: string) => /[a-zA-Z]/.test(clean(str));

    const qClean = clean(editingActivity.questionText);
    const qEnClean = clean(editingActivity.questionTextEn);
    const titleClean = clean(editingActivity.title);
    const titleEnClean = clean(editingActivity.titleEn);

    const allAr = `${qClean} ${titleClean}`;
    const allEn = `${qEnClean} ${titleEnClean}`;

    const hasArContent = hasAr(allAr);
    const hasEnContent = hasEn(allEn) || (hasEn(allAr) && !hasArContent);

    if (hasEnContent && !hasArContent) {
      setActivityActiveLang('en');
    } else if (hasArContent && !hasEnContent) {
      setActivityActiveLang('ar');
    } else if (hasAr(qClean) || hasAr(titleClean)) {
      setActivityActiveLang('ar');
    } else if (hasEn(qClean) || hasEn(titleClean)) {
      setActivityActiveLang('en');
    } else if (language === 'en') {
      setActivityActiveLang('en');
    } else {
      setActivityActiveLang('ar');
    }
  }, [isActivityModalOpen, editingActivity?.id]);

  const handleAutoTranslateActivity = async () => {
    if (!editingActivity) return;
    setIsTranslatingActivity(true);
    try {
      const from = activityActiveLang;
      const to = from === 'ar' ? 'en' : 'ar';
      
      const srcTitle = from === 'ar' ? editingActivity.title : (editingActivity.titleEn || editingActivity.title);
      const srcPrompt = from === 'ar' ? editingActivity.questionText : (editingActivity.questionTextEn || editingActivity.questionText);
      const srcExplanation = from === 'ar' ? editingActivity.explanation : (editingActivity.explanationEn || editingActivity.explanation);
      const srcHint = from === 'ar' ? editingActivity.hint : (editingActivity.hintEn || editingActivity.hint);
      const srcTip = from === 'ar' ? editingActivity.tip : (editingActivity.tipEn || editingActivity.tip);
      const srcKeyInsight = from === 'ar' ? editingActivity.keyInsight : (editingActivity.keyInsightEn || editingActivity.keyInsight);

      const baseTexts = [
        srcTitle || '',
        srcPrompt || '',
        srcExplanation || '',
        srcHint || '',
        srcTip || '',
        srcKeyInsight || '',
      ];

      let rawOpts: any = null;
      const srcOpts = from === 'ar' ? editingActivity.options : (editingActivity.optionsEn || editingActivity.options);
      try {
        rawOpts = typeof srcOpts === 'string' ? JSON.parse(srcOpts) : srcOpts;
      } catch {
        rawOpts = null;
      }

      let choiceTexts: string[] = [];
      if (rawOpts && Array.isArray(rawOpts.choices)) {
        choiceTexts = rawOpts.choices.map((c: any) => (typeof c === 'object' && c ? c.text || '' : String(c || '')));
      }

      const allTexts = [...baseTexts, ...choiceTexts];
      const translations = await translateBatch(allTexts, from, to);

      const [trTitle, trPrompt, trExplanation, trHint, trTip, trKeyInsight] = translations.slice(0, 6);
      const trChoices = translations.slice(6, 6 + choiceTexts.length);

      const updated = { ...editingActivity };
      if (to === 'en') {
        if (trTitle) updated.titleEn = trTitle;
        if (trPrompt) updated.questionTextEn = trPrompt;
        if (trExplanation) updated.explanationEn = trExplanation;
        if (trHint) updated.hintEn = trHint;
        if (trTip) updated.tipEn = trTip;
        if (trKeyInsight) updated.keyInsightEn = trKeyInsight;

        if (rawOpts && Array.isArray(rawOpts.choices)) {
          const translatedOpts = {
            ...rawOpts,
            choices: rawOpts.choices.map((c: any, i: number) => {
              if (typeof c === 'object' && c) {
                return { ...c, text: trChoices[i] || c.text };
              }
              return trChoices[i] || c;
            })
          };
          updated.optionsEn = JSON.stringify(translatedOpts);
        }
        setActivityActiveLang('en');
      } else {
        if (!updated.titleEn && editingActivity.title && !/[\u0600-\u06FF]/.test(editingActivity.title)) updated.titleEn = editingActivity.title;
        if (!updated.questionTextEn && editingActivity.questionText && !/[\u0600-\u06FF]/.test(editingActivity.questionText)) updated.questionTextEn = editingActivity.questionText;
        if (!updated.optionsEn && editingActivity.options && !/[\u0600-\u06FF]/.test(typeof editingActivity.options === 'string' ? editingActivity.options : JSON.stringify(editingActivity.options))) {
          updated.optionsEn = typeof editingActivity.options === 'string' ? editingActivity.options : JSON.stringify(editingActivity.options);
        }

        if (trTitle) updated.title = trTitle;
        if (trPrompt) updated.questionText = trPrompt;
        if (trExplanation) updated.explanation = trExplanation;
        if (trHint) updated.hint = trHint;
        if (trTip) updated.tip = trTip;
        if (trKeyInsight) updated.keyInsight = trKeyInsight;

        if (rawOpts && Array.isArray(rawOpts.choices)) {
          const translatedOpts = {
            ...rawOpts,
            choices: rawOpts.choices.map((c: any, i: number) => {
              if (typeof c === 'object' && c) {
                return { ...c, text: trChoices[i] || c.text };
              }
              return trChoices[i] || c;
            })
          };
          updated.options = JSON.stringify(translatedOpts);
        }
        setActivityActiveLang('ar');
      }
      Object.assign(updated, await translateMetadataFields(editingActivity, to, ['standard', 'indicator', 'learningOutcome', 'skill']));
      setEditingActivity(updated);
      showToast(language === 'ar' ? 'تمت الترجمة الفورية بنجاح' : 'Content translated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || (language === 'ar' ? 'حدث خطأ أثناء الترجمة' : 'Translation failed'), 'error');
    } finally {
      setIsTranslatingActivity(false);
    }
  };

  const getCleanDescription = (desc: string | null) => {
    if (!desc) return "";
    const clean = desc.replace(/<[^>]*>?/gm, '');
    return clean.length > 50 ? clean.substring(0, 50) + '...' : clean;
  };

  const saveLessonMetadata = async (lessonId: string, updatedMetadata: any) => {
    const token = localStorage.getItem("school_admin_token");
    if (!token) return;
    
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const updatedDescription = JSON.stringify(updatedMetadata);
    try {
      const res = await apiFetch(`${API_URL}/skills-hub/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: lesson.name, description: updatedDescription, order: lesson.order })
      });
      if (res.ok) {
        const data = await res.json();
        setLessons(prev => prev.map(l => l.id === lessonId ? data.lesson : l));
        return data.lesson;
      }
    } catch (err) {}
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
  
  const downloadTemplate = downloadSkillTemplate;

  const getGradeDisplay = (g: any) => (GRADE_LABELS as any)[g]?.[language === 'ar' ? 'ar' : 'en'] || g;
  
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const allExistingSkills = Array.from(new Set([
    ...DEFAULT_SKILLS,
    ...customSkills,
    ...Object.values(activitiesData).flatMap((acts: any) => acts.map((a: any) => a.skill).filter(Boolean))
  ]));

  const getLessonMetadata = (lesson: any) => {
    let md: any = { standards: [], indicators: [], outcomes: [] };
    if (!lesson) return md;

    if (typeof lesson.metadata === 'string') {
      try { 
        const parsed = JSON.parse(lesson.metadata); 
        if (parsed && typeof parsed === 'object') md = { ...md, ...parsed };
      } catch (e) {}
    } else if (lesson.metadata && typeof lesson.metadata === 'object') {
      md = { ...md, ...lesson.metadata };
    }

    if ((!md.standards?.length && !md.indicators?.length && !md.outcomes?.length) && typeof lesson.description === 'string' && lesson.description.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(lesson.description);
        if (parsed && typeof parsed === 'object') md = { ...md, ...parsed };
      } catch (e) {}
    }

    return {
      ...md,
      standards: Array.isArray(md.standards) ? md.standards : [],
      indicators: Array.isArray(md.indicators) ? md.indicators : [],
      outcomes: Array.isArray(md.outcomes) ? md.outcomes : []
    };
  };

  const isGrade123 = (g: any) => ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي"].includes(g);

  const handleDeleteStandard = async (stdValue: string) => {
    if (!editingActivity || !editingActivity.lessonId) return;
    if (!window.confirm(language === 'ar' ? `هل أنت متأكد من حذف المعيار "${stdValue}"؟` : `Are you sure you want to delete standard "${stdValue}"?`)) return;
    const lesson = lessons.find(l => l.id === editingActivity.lessonId);
    if (!lesson) return;
    const lessonMetadata = getLessonMetadata(lesson);
    const updatedMetadata = { ...lessonMetadata, standards: lessonMetadata.standards?.filter((s: string) => s !== stdValue) || [] };
    const updated = await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
    if (updated) { setEditingActivity({ ...editingActivity, standard: "" }); showToast(language === 'ar' ? "تم حذف المعيار بنجاح" : "Standard deleted successfully", "success"); }
  };

  const handleDeleteIndicator = async (indValue: string) => {
    if (!editingActivity || !editingActivity.lessonId) return;
    if (!window.confirm(language === 'ar' ? `هل أنت متأكد من حذف المؤشر "${indValue}"؟` : `Are you sure you want to delete indicator "${indValue}"?`)) return;
    const lesson = lessons.find(l => l.id === editingActivity.lessonId);
    if (!lesson) return;
    const lessonMetadata = getLessonMetadata(lesson);
    const updatedMetadata = { ...lessonMetadata, indicators: lessonMetadata.indicators?.filter((s: string) => s !== indValue) || [] };
    const updated = await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
    if (updated) { setEditingActivity({ ...editingActivity, indicator: "" }); showToast(language === 'ar' ? "تم حذف المؤشر بنجاح" : "Indicator deleted successfully", "success"); }
  };

  const handleDeleteOutcome = async (outValue: string) => {
    if (!editingActivity || !editingActivity.lessonId) return;
    if (!window.confirm(language === 'ar' ? `هل أنت متأكد من حذف مخرج التعلم "${outValue}"؟` : `Are you sure you want to delete learning outcome "${outValue}"?`)) return;
    const lesson = lessons.find(l => l.id === editingActivity.lessonId);
    if (!lesson) return;
    const lessonMetadata = getLessonMetadata(lesson);
    const updatedMetadata = { ...lessonMetadata, outcomes: lessonMetadata.outcomes?.filter((s: string) => s !== outValue) || [] };
    const updated = await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
    if (updated) { setEditingActivity({ ...editingActivity, learningOutcome: "" }); showToast(language === 'ar' ? "تم حذف مخرج التعلم بنجاح" : "Learning outcome deleted successfully", "success"); }
  };

  const handleDeleteSkill = (skillValue: string) => {
    if (skillValue === "General") return;
    if (!window.confirm(language === 'ar' ? `هل أنت متأكد من حذف المهارة "${skillValue}"؟` : `Are you sure you want to delete skill "${skillValue}"?`)) return;
    setCustomSkills(prev => prev.filter(s => s !== skillValue));
    setEditingActivity({ ...editingActivity, skill: "General" });
    showToast(language === 'ar' ? "تم حذف المهارة بنجاح" : "Skill deleted successfully", "success");
  };

  const handleMetadataExcelChange = async (e: React.ChangeEvent<HTMLInputElement>, lesson: any) => {
    const file = e.target.files?.[0]; if (!file || !lesson) return;
    try {
      const metadata = { ...getLessonMetadata(lesson), ...await readSkillMetadata(file) };
      const res = await apiFetch(`${API_URL}/skills-hub/lessons/${lesson.id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({metadata})});
      if (!res.ok) throw new Error((await res.json()).error || 'Import failed');
      await lessonsMgr.fetchLessons();
      showToast(language === 'ar' ? 'تم استيراد المعايير' : 'Standards imported', 'success');
    } catch (error: any) { showToast(error.message, 'error'); } finally { e.target.value = ''; }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  const canModify = !clusterData.isCentral && (clusterData.schoolId === schoolId || !clusterData.schoolId);

  return (
    <DashboardLayout>
      {/* Hidden File Input for Excel Upload of Activities */}
      <input 
        type="file" 
        ref={excelInputRef} 
        style={{ display: 'none' }} 
        accept=".xlsx,.xls" 
        onChange={handleExcelUpload} 
      />

      {/* Hidden File Input for Excel Import of Lesson Metadata */}
      <input
        type="file"
        ref={metadataExcelRef}
        style={{ display: "none" }}
        accept=".xlsx,.xls"
        onChange={(e) => {
          const lesson = lessons.find(l => l.id === metadataLessonRef.current);
          handleMetadataExcelChange(e, lesson);
        }}
      />

      <div className="space-y-6 sm:space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header Section */}
        <div className="relative bg-white rounded-[20px] sm:rounded-[50px] p-4 sm:p-12 overflow-hidden shadow-sm border border-slate-100">
           <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
              <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-8 ${language === 'ar' ? 'text-right sm:items-start' : 'text-left sm:items-start'}`}>
                 <button 
                   onClick={() => router.push('/school-admin/skills-hub')}
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
                    <p className="text-slate-500 text-[10px] sm:text-lg font-medium max-w-xl">
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
                   disabled={!canModify}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 disabled:opacity-60"
                 />
              </div>

              {/* Subject Selection */}
              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "المادة" : "Subject"} <span className="text-red-500">*</span>
                 </label>
                 <select 
                   value={clusterData.subject} onChange={(e) => setClusterData({ ...clusterData, subject: e.target.value })}
                   disabled={!canModify}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none disabled:opacity-60"
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
                    {canModify && (
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
                    )}
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
                          } ${!canModify ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            disabled={!canModify}
                            checked={isSelected}
                            onChange={(e) => {
                              if (!canModify) return;
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

              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "الوصف" : "Description"}
                 </label>
                 <textarea 
                   value={clusterData.description} onChange={(e) => setClusterData({ ...clusterData, description: e.target.value })}
                   disabled={!canModify}
                   rows={3} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 resize-none disabled:opacity-60"
                 />
              </div>



              {canModify && (
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                   <button 
                     onClick={handleUpdateCluster} disabled={isSaving}
                     className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                   >
                     <Save className="w-5 h-5" />
                     {language === 'ar' ? "تحديث المحور" : "Update Cluster"}
                   </button>
                </div>
              )}
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
               {canModify && (
                 <button 
                   onClick={openAddLesson}
                   className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                 >
                    <Plus className="w-5 h-5" />
                    {language === 'ar' ? "درس جديد" : "New Lesson"}
                 </button>
               )}
            </div>

            <div className="space-y-4">
              {lessons.length === 0 ? (
                 <div className="bg-white border-2 border-dashed border-slate-200 rounded-[24px] p-12 text-center">
                    <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">{language === 'ar' ? "لا يوجد دروس بعد. ابدأ بإضافة درس جديد." : "No lessons yet. Start by adding one."}</p>
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
                               className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm transition-all"
                               title={language === 'ar' ? "معاينة الاختبار كامل" : "Preview Full Test"}
                             >
                               <Play className="w-4 h-4 fill-current text-white" />
                               <span className="hidden md:inline">{language === 'ar' ? "معاينة الاختبار كامل" : "Preview Full Test"}</span>
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
                           {canModify && (
                             <>
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
                             </>
                           )}
                        </div>
                     </div>

                     {/* Expanded Activities Section */}
                     {expandedLessonId === lesson.id && (
                        <div className="bg-slate-50/50 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                              <h4 className="font-black text-slate-700 text-sm">{language === 'ar' ? "الأنشطة التفاعلية (أسئلة)" : "Interactive Activities (Questions)"}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                {canModify && (
                                  <>
                                    <button 
                                      onClick={() => {
                                        
                                        importLessonRef.current = lesson.id;
                                    excelInputRef.current?.click();
                                      }}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Upload className="w-4 h-4" />
                                      {language === 'ar' ? 'استيراد الأنشطة' : 'Import Activities'}
                                    </button>
                                    <button 
                                      onClick={downloadTemplate}
                                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Download className="w-4 h-4" />
                                      {language === 'ar' ? 'نموذج الأنشطة' : 'Activities Template'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        
                                        metadataLessonRef.current = lesson.id;
                                        metadataExcelRef.current?.click();
                                      }}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Upload className="w-4 h-4" />
                                      {language === 'ar' ? 'استيراد معايير Excel' : 'Import Standards'}
                                    </button>
                                    <button
                                      onClick={downloadMetadataTemplate}
                                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Download className="w-4 h-4" />
                                      {language === 'ar' ? 'نموذج المعايير' : 'Standards Template'}
                                    </button>
                                    <button 
                                      onClick={() => openAddActivity(lesson.id)}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Plus className="w-4 h-4" />
                                      {language === 'ar' ? "إضافة نشاط" : "Add Activity"}
                                    </button>
                                  </>
                                )}
                              </div>
                           </div>

                           <div className="space-y-3">
                              {!activitiesData[lesson.id] ? (
                                <div className="text-center p-4 text-slate-400 font-bold text-sm animate-pulse">Loading...</div>
                              ) : activitiesData[lesson.id]?.length === 0 ? (
                                <div className="text-center p-6 bg-white border border-slate-200 rounded-xl text-slate-400 font-bold text-sm">
                                  {language === 'ar' ? "لا توجد أنشطة في هذا الدرس." : "No activities in this lesson."}
                                </div>
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
                                             <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded">{activity.points} XP</span>
                                             <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-2 py-0.5 rounded">DOK {activity.dok || "2"}</span>
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
                                        {canModify && (
                                          <>
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
                                          </>
                                        )}
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
      <ActivityEditorModal {...{ language, showToast, lessons, expandedLessonId, activitiesData, isActivityModalOpen, setIsActivityModalOpen, editingActivity, setEditingActivity, handleSaveActivity, mounted, activityActiveLang, setActivityActiveLang, isTranslatingActivity, handleAutoTranslateActivity, saveLessonMetadata, setCustomSkills, allExistingSkills, getLessonMetadata, handleDeleteStandard, handleDeleteIndicator, handleDeleteOutcome, handleDeleteSkill }} />

      {mounted && previewActivity && createPortal(
        <div data-slide-preview role="dialog" aria-modal="true" tabIndex={-1} className="fixed inset-0 z-[150] bg-slate-50 flex flex-col w-full h-full min-h-screen overflow-hidden text-slate-900 animate-in fade-in duration-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          
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
                {previewLang === 'en' ? (previewActivity.titleEn || previewActivity.title) : previewActivity.title}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Preview Language Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewLang('ar')}
                  className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                    previewLang === 'ar'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang('en')}
                  className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                    previewLang === 'en'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>

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
                    ? `${previewLang === 'ar' ? 'الوقت' : 'Time'}: ${Math.floor(previewTimeLeft / 60)}:${(previewTimeLeft % 60).toString().padStart(2, '0')}`
                    : `${previewActivity.estimatedTime || 60}s`}
                </span>
              </div>

              <button
                onClick={() => setPreviewActivity(null)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors border border-slate-200 cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                title={previewLang === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">{previewLang === 'ar' ? 'إغلاق' : 'Close'}</span>
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
                        label={previewLang === 'ar' ? 'المعيار' : 'Standard'} 
                        value={previewLang === 'en' ? (previewActivity.standardEn || previewActivity.standard) : previewActivity.standard} 
                        icon={Target} 
                        colorClass="bg-rose-50 text-rose-700 border border-rose-100" 
                        bubbleTheme="border-rose-200 text-rose-800" 
                      />
                      <InteractiveTag 
                        label={previewLang === 'ar' ? 'المؤشر' : 'Indicator'} 
                        value={previewLang === 'en' ? (previewActivity.indicatorEn || previewActivity.indicator) : previewActivity.indicator} 
                        icon={CheckCircle2} 
                        colorClass="bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        bubbleTheme="border-emerald-200 text-emerald-800" 
                      />
                      <InteractiveTag 
                        label={previewLang === 'ar' ? 'الهدف' : 'Outcome'} 
                        value={previewLang === 'en' ? (previewActivity.learningOutcomeEn || previewActivity.learningOutcome) : previewActivity.learningOutcome} 
                        icon={GraduationCap} 
                        colorClass="bg-purple-50 text-purple-700 border border-purple-100" 
                        bubbleTheme="border-purple-200 text-purple-800" 
                      />
                      <InteractiveTag 
                        label={previewLang === 'ar' ? 'DOK' : 'DOK'} 
                        value={previewActivity.dok} 
                        icon={BrainCircuit} 
                        colorClass="bg-amber-50 text-amber-700 border border-amber-100" 
                        bubbleTheme="border-amber-200 text-amber-800" 
                      />
                      <InteractiveTag 
                        label={previewLang === 'ar' ? 'المستوى' : 'Level'} 
                        value={previewActivity.skillLevel} 
                        icon={Layers} 
                        colorClass="bg-sky-50 text-sky-700 border border-sky-100" 
                        bubbleTheme="border-sky-200 text-sky-800" 
                      />
                    </div>

                    {/* Helper Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(previewActivity.hint || previewActivity.hintEn) && (
                        <button
                          onClick={() => {
                            setPreviewHintsUsed(prev => prev + 1);
                            const hintText = previewLang === 'en' 
                              ? (previewActivity.hintEn || previewActivity.hint) 
                              : (previewActivity.hint || previewActivity.hintEn);
                            setPreviewHelperModal({ type: "hint", content: hintText });
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:scale-[1.02] text-amber-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{previewLang === 'ar' ? 'تلميح' : 'Hint'}</span>
                        </button>
                      )}
                      {(previewActivity.tip || previewActivity.tipEn) && (
                        <button
                          onClick={() => {
                            const tipText = previewLang === 'en' 
                              ? (previewActivity.tipEn || previewActivity.tip) 
                              : (previewActivity.tip || previewActivity.tipEn);
                            setPreviewHelperModal({ type: "tip", content: tipText });
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:scale-[1.02] text-emerald-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{previewLang === 'ar' ? 'نصيحة' : 'Tip'}</span>
                        </button>
                      )}
                      {(previewActivity.keyInsight || previewActivity.keyInsightEn) && (
                        <button
                          onClick={() => {
                            const insightText = previewLang === 'en' 
                              ? (previewActivity.keyInsightEn || previewActivity.keyInsight) 
                              : (previewActivity.keyInsight || previewActivity.keyInsightEn);
                            setPreviewHelperModal({ type: "keyInsight", content: insightText });
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:scale-[1.02] text-indigo-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{previewLang === 'ar' ? 'فكرة' : 'Insight'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between hidden">
                    <h3 className="text-lg md:text-xl font-black text-slate-900">
                      {previewLang === 'en' ? (previewActivity.titleEn || previewActivity.title) : previewActivity.title}
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
                      language={previewLang}
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
                  {previewLang === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
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
                    {previewLang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    <span>{previewLang === 'ar' ? 'السابق' : 'Previous'}</span>
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
                    <span>{previewLang === 'ar' ? 'التالي' : 'Next'}</span>
                    {previewLang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {previewResult && (
                    <InteractiveTag 
                      label={previewLang === 'ar' ? 'التفسير (Explanation)' : 'Explanation'}
                      value={
                        <div className="p-2 min-w-[280px] max-w-md">
                           {previewResult.explanation ? (
                              <div className="text-slate-700 text-sm leading-relaxed">
                                <HtmlRenderer html={translateText(previewResult.explanation, previewLang)} />
                              </div>
                           ) : (
                              <div className="text-slate-500 font-bold text-sm text-center">
                                {previewLang === 'ar' ? 'لا يوجد شرح إضافي لهذا النشاط.' : 'No explanation available for this activity.'}
                              </div>
                           )}
                        </div>
                      }
                      icon={Info}
                      colorClass="bg-purple-100 text-purple-700 border border-purple-200"
                      bubbleTheme="border-purple-300 text-purple-900"
                    />
                  )}
                  <button
                    onClick={submitPreviewAnswer}
                    disabled={(!previewAnswer && previewActivity?.type !== 'GEOGEBRA') || previewIsSubmitting || previewResult !== null}
                    className={`px-10 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
                      (!previewAnswer && previewActivity?.type !== 'GEOGEBRA') || previewIsSubmitting || previewResult !== null
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                        : "bg-sky-500 text-white hover:bg-sky-600 shadow-xl shadow-sky-500/25 border border-sky-500/20"
                    }`}
                  >
                    {previewIsSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {previewLang === 'ar' ? 'جاري التقييم...' : 'Evaluating...'}
                      </>
                    ) : previewResult !== null ? (
                      <span>{previewLang === 'ar' ? 'تم التقييم مسبقاً' : 'Already Evaluated'}</span>
                    ) : (
                      <>
                        <span>{previewLang === 'ar' ? 'أرسل الحل للتصحيح' : 'Submit for review'}</span>
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
