// @ts-nocheck
"use client";

import React, { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Save, ArrowLeft, Settings, Trash2, CalendarDays, ListChecks } from 'lucide-react';
import * as XLSX from "xlsx";

import { useExamState } from "./hooks/useExamState";
import { useModuleManagement } from "./hooks/useModuleManagement";
import { useLessonBuilder } from "./hooks/useLessonBuilder";
import { useQuestionLogic } from "./hooks/useQuestionLogic";
import { useExamAutosave } from "./hooks/useExamAutosave";
import { useExamSubmit } from "./hooks/useExamSubmit";

import { SettingsPanel } from "./components/SettingsPanel";
import { ModulesList } from "./components/ModulesList";
import { ModuleModal } from "./components/ModuleModal";
import { StandaloneQuestions } from "./components/StandaloneQuestions";
import { SlidesBuilder } from "./components/SlidesBuilder";
import { QuestionsBuilder } from "./components/QuestionsBuilder";
import { getGradeName, getSubjectName, parseJson } from "./utils/examUtils";
import { getModuleCreationView } from "@/lib/moduleCreationWorkflow";
import { API_URL } from "@/lib/api";
import { Edit2, PlusCircle } from "lucide-react";

export default function SuperAdminNewExamPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const schoolIdParam = searchParams.get("schoolId");
  const requestedMode = searchParams.get("mode");
  const moduleMode = requestedMode === "module" || (!requestedMode && pathname === "/super-admin/exams/new");
  
  const { showToast } = useNotification();
  const { language, t } = useLanguage();

  const state = useExamState(schoolIdParam);
  const {
    examData, setExamData, schools, modules, isModuleModalOpen,
    currentModule, editingModuleIndex, standaloneQuestions,
    showSettings, visibleStandaloneCount, 
    createdId, isLoading, isAutoSaveEnabled,
    manualSubmitRef, lastAutoSaveSnapshotRef, autoSaveGenerationRef,
    createdIdRef, setCreatedId, setCurrentModule, setModules,
    setEditingModuleIndex, setLastAutoSave, autoSaveWriteQueueRef,
    autoSaveTimerRef, activeTab, setActiveTab, setAvailableMetadata,
    setIsLoading, setIsModuleModalOpen, setStandaloneQuestions, tempQuestion, setTempQuestion, setShowSettings,
    setQuestionSource, setShowQuestionForm, openDropdownId, setOpenDropdownId,
    customSkills, setCustomSkills, allExistingSkills, availableMetadata,
    activeSubExamIndex, setActiveSubExamIndex
  } = state;

  const toggleCourseSubject = (cat: string) => {
    const isSelected = examData.subjects.includes(cat);
    if (isSelected) setExamData({ ...examData, subjects: examData.subjects.filter(c => c !== cat) });
    else setExamData({ ...examData, subjects: [...examData.subjects, cat] });
  };

  const toggleCourseSchool = (sId: string, checked?: boolean) => {
    const isSelected = (examData.schoolIds || []).includes(sId);
    if (isSelected) setExamData({ ...examData, schoolIds: (examData.schoolIds || []).filter(s => s !== sId) });
    else setExamData({ ...examData, schoolIds: [...(examData.schoolIds || []), sId] });
  };

  const selectAllSchools = () => {
    if ((examData.schoolIds || []).length === schools.length) {
      setExamData({ ...examData, schoolIds: [] });
    } else {
      setExamData({ ...examData, schoolIds: schools.map((s: any) => s.id) });
    }
  };

  const moduleManagement = useModuleManagement({ ...state, showToast, language, t });
  const lessonBuilder = useLessonBuilder({ ...state, showToast, language, t });
  const questionLogic = useQuestionLogic({ ...state, showToast, language, t });

  useExamAutosave({ ...state, showToast, language });
  
  const { handleSubmit } = useExamSubmit({ ...state, showToast, language, router, t, moduleMode });

  const moduleCreationView = getModuleCreationView(moduleMode, modules.length);
  const hasConfiguredModule = modules.length > 0;
  const primaryModule = modules[0] || null;
  const [newSubExamTitle, setNewSubExamTitle] = React.useState("");
  const [editingDraftExamIndex, setEditingDraftExamIndex] = React.useState<number | null>(null);
  const [editingDraftExamTitle, setEditingDraftExamTitle] = React.useState("");

  

  const renderSlidesBuilderProps = () => (
    <SlidesBuilder  
      {...state}
      {...lessonBuilder}
      language={language}
    />
  );

  const renderQuestionsBuilderProps = (source: 'assignments' | 'questions') => (
    <QuestionsBuilder  
      source={source}  
      {...state}
      {...questionLogic}
      {...moduleManagement}
      language={language}
      assignmentsExcelRef={moduleManagement.assignmentsExcelRef}
      questionsExcelRef={moduleManagement.questionsExcelRef}
      handleQuestionsExcelChange={(e) => moduleManagement.handleQuestionsExcelChange(e, state.activeSubExamIndex)}
      handleAssignmentsExcelChange={(e) => moduleManagement.handleAssignmentsExcelChange(e, state.activeSubExamIndex)}
      advancedMetadataExcelRef={moduleManagement.advancedMetadataExcelRef}
      handleAdvancedMetadataExcelChange={async (e) => {
        const updatedList = await moduleManagement.handleAdvancedMetadataExcelChange(e, state.activeSubExamIndex, source);
        if (updatedList && updatedList.length > 0 && state.editingQuestionIndex !== null && state.showQuestionForm) {
          state.setTempQuestion(updatedList[state.editingQuestionIndex]);
        }
      }}
      downloadAdvancedMetadataTemplate={() => moduleManagement.downloadAdvancedMetadataTemplate(state.activeSubExamIndex, source)}
    />
  );

  const updatePrimaryModule = (updater: (module: any) => any) => {
    if (!primaryModule) return;

    const nextModule = updater(primaryModule);
    setModules((currentModules: any[]) => {
      if (!currentModules.length) return currentModules;
      const nextModules = [...currentModules];
      nextModules[0] = nextModule;
      return nextModules;
    });

    if (editingModuleIndex === 0 || String(currentModule?.id || "") === String(primaryModule?.id || "")) {
      setCurrentModule(nextModule);
    }
  };

  const addDraftExam = () => {
    if (!newSubExamTitle.trim()) {
      showToast(language === 'ar' ? 'اكتب اسم الاختبار أولًا' : 'Enter the exam name first', 'error');
      return;
    }

    updatePrimaryModule((module) => ({
      ...module,
      subExams: [
        ...(module.subExams || []),
        {
          id: String(Date.now()),
          title: newSubExamTitle.trim(),
          questions: [],
          publishDate: "",
          cutOffDate: "",
        },
      ],
    }));
    setNewSubExamTitle("");
  };

  const removeDraftExam = (index: number) => {
    updatePrimaryModule((module) => ({
      ...module,
      subExams: (module.subExams || []).filter((_: any, currentIndex: number) => currentIndex !== index),
    }));
    if (editingDraftExamIndex === index) {
      setEditingDraftExamIndex(null);
      setEditingDraftExamTitle("");
    }
  };

  const commitDraftExamTitle = (index: number) => {
    const resolvedTitle = editingDraftExamTitle.trim();
    if (!resolvedTitle) {
      setEditingDraftExamIndex(null);
      setEditingDraftExamTitle("");
      return;
    }

    updatePrimaryModule((module) => ({
      ...module,
      subExams: (module.subExams || []).map((subExam: any, currentIndex: number) =>
        currentIndex === index ? { ...subExam, title: resolvedTitle } : subExam
      ),
    }));
    setEditingDraftExamIndex(null);
    setEditingDraftExamTitle("");
  };

  const openDraftExamEditor = (index: number) => {
    if (!primaryModule) return;
    const persistDraftAndOpen = async () => {
      const localSubExam = (primaryModule.subExams || [])[index];
      if (!localSubExam) return;

      if ((createdIdRef.current || createdId) && primaryModule.id && localSubExam.id) {
        router.push(
          `/super-admin/exams/edit/${createdIdRef.current || createdId}?moduleId=${encodeURIComponent(primaryModule.id)}&subExamId=${encodeURIComponent(localSubExam.id)}`
        );
        return;
      }

      setIsLoading(true);
      manualSubmitRef.current = true;
      autoSaveGenerationRef.current += 1;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      try {
        await autoSaveWriteQueueRef.current;

        const finalModules = [...modules];
        if (isModuleModalOpen && currentModule.title) {
          if (editingModuleIndex !== null) {
            finalModules[editingModuleIndex] = currentModule;
          } else {
            finalModules.push(currentModule);
          }
        }

        const targetSchoolIds = (examData.schoolIds || []).filter(Boolean);
        const isCentral = targetSchoolIds.length === 0;

        const allQuestions: any[] = [];
        const modulesPayload = finalModules.map((m, moduleIndex) => {
          const mId = m.id || String(Date.now() + moduleIndex);
          const mSubExams = (m.subExams || []).map((s: any, subExamIndex: number) => {
            const sId = s.id || String(Date.now() + moduleIndex * 1000 + subExamIndex);
            const sQuestions = (s.questions || []).map((q: any) => ({
              ...q,
              moduleId: mId,
              subExamId: sId
            }));
            allQuestions.push(...sQuestions);
            return {
              id: sId,
              title: s.title,
              duration: s.duration || null,
              passingScore: s.passingScore || null,
              attemptsAllowed: s.attemptsAllowed || 1,
              publishDate: s.publishDate || null,
              cutOffDate: s.cutOffDate || null,
              order: subExamIndex
            };
          });

          const mQuestions = (m.questions || []).map((q: any) => ({
            ...q,
            moduleId: mId
          }));
          allQuestions.push(...mQuestions);

          return {
            id: mId,
            title: m.title,
            description: m.content || null,
            duration: m.duration || null,
            passingScore: m.passingScore || null,
            publishDate: m.publishDate || null,
            cutOffDate: m.cutOffDate || null,
            order: moduleIndex,
            subExams: mSubExams
          };
        });

        allQuestions.push(...(standaloneQuestions || []).map((q: any) => ({ ...q, moduleId: null })));

        const token = localStorage.getItem("super_admin_token");
        const activeExamId = createdIdRef.current;
        const res = await fetch(
          activeExamId ? `${API_URL}/exams/${activeExamId}` : `${API_URL}/exams`,
          {
            method: activeExamId ? "PUT" : "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: examData.title || primaryModule.title || (language === 'ar' ? "مسودة موديول بدون عنوان" : "Untitled Module Draft"),
              description: examData.description,
              coverImage: examData.coverImage || null,
              grades: examData.grades,
              subjects: examData.subjects || [],
              country: examData.country,
              isCentral,
              schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
              schoolIds: targetSchoolIds,
              duration: examData.duration || 60,
              passingScore: examData.passingScore || 50,
              password: examData.password || null,
              resultVisibility: examData.resultVisibility || "SHOW_SCORE",
              attemptsAllowed: examData.attemptsAllowed || 1,
              startDate: examData.startDate || null,
              endDate: examData.endDate || null,
              status: "DRAFT",
              modules: modulesPayload,
              questions: allQuestions
            })
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.details || data.error || "Failed to save draft");
        }

        const data = await res.json().catch(() => ({}));
        const savedExam = data?.exam || null;
        const savedExamId = String(savedExam?.id || activeExamId || "").trim();

        let resolvedExamDetails = savedExam;
        if (!Array.isArray(resolvedExamDetails?.modules) || !resolvedExamDetails.modules[0]?.subExams) {
          const detailRes = await fetch(`${API_URL}/exams/${savedExamId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (detailRes.ok) {
            resolvedExamDetails = await detailRes.json().catch(() => resolvedExamDetails);
          }
        }

        const resolvedModules = Array.isArray(resolvedExamDetails?.modules) ? resolvedExamDetails.modules : [];
        const savedModule = resolvedModules[0] || null;
        const savedSubExam = Array.isArray(savedModule?.subExams) ? savedModule.subExams[index] : null;

        if (!savedExamId || !savedModule?.id || !savedSubExam?.id) {
          throw new Error(language === 'ar' ? 'تعذر تجهيز رابط الاختبار بعد الحفظ.' : 'Could not prepare the exam editor link after saving.');
        }

        createdIdRef.current = savedExamId;
        setCreatedId(savedExamId);
        if (resolvedModules.length > 0) {
          setModules(resolvedModules);
        }

        router.push(
          `/super-admin/exams/edit/${savedExamId}?moduleId=${encodeURIComponent(savedModule.id)}&subExamId=${encodeURIComponent(savedSubExam.id)}`
        );
      } catch (error: any) {
        showToast(error.message || (language === 'ar' ? 'فشل فتح محرر الاختبار.' : 'Failed to open the exam editor.'), 'error');
      } finally {
        manualSubmitRef.current = false;
        setIsLoading(false);
      }
    };

    void persistDraftAndOpen();
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        
        <ModuleModal 
          {...state}
          {...moduleManagement}
          language={language}
          t={t}
          moduleMode={moduleMode}
          hideStandaloneQuestions={moduleMode}
          metadataExcelRef={moduleManagement.metadataExcelRef}
          renderSlidesBuilder={renderSlidesBuilderProps}
          renderQuestionsBuilder={renderQuestionsBuilderProps}
        />

        <div className="animate-in fade-in duration-500">
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-6">
              <button onClick={() => router.back()} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100">
                <ArrowLeft className="w-7 h-7" />
              </button>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900">{moduleMode ? (language === 'ar' ? 'إنشاء Module اختبار جديد' : 'Create New Exam Module') : (language === 'ar' ? 'إنشاء اختبار جديد' : 'Create New Exam')}</h1>
                <p className="text-slate-400 text-lg mt-1 font-bold">{moduleMode ? (language === 'ar' ? 'أنشئ بوابة الاختبارات وإعداداتها الأساسية' : 'Create the exam module portal and its core settings') : (language === 'ar' ? 'صمم تجربة تقييم متكاملة لطلابك' : 'Design a complete assessment experience for your students')}</p>
              </div>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-12 py-5 rounded-[22px] font-black flex items-center gap-3 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (moduleMode ? (language === 'ar' ? 'حفظ الموديول والانتقال للاختبارات' : 'Save Module & Continue') : (language === 'ar' ? 'حفظ ونشر التقييم' : 'Save & Publish Exam'))}
              <Save className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {showSettings ? (
              <SettingsPanel 
                {...state}
                {...moduleManagement}
                showToast={showToast}
                metadataExcelRef={moduleManagement.metadataExcelRef}
                language={language}
                t={t}
                toggleCourseSubject={toggleCourseSubject}
                toggleCourseSchool={toggleCourseSchool}
                selectAllSchools={selectAllSchools}
              />
            ) : (
              <div className="lg:col-span-12 flex justify-end">
                <button type="button" onClick={() => setShowSettings(true)} className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black shadow-sm transition-all">
                  <Settings className="w-4 h-4" />
                  {language === 'ar' ? 'تعديل إعدادات الموديول' : 'Edit Module Settings'}
                </button>
              </div>
            )}

            <div className={`min-w-0 space-y-8 ${showSettings ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              {moduleMode ? (
                <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
                  {moduleCreationView === 'module-setup' ? (
                    <div className="rounded-[28px] border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-10 text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-indigo-600 shadow-sm">
                        <PlusCircle className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">
                        {language === 'ar' ? 'ابدأ بإعداد الموديول' : 'Start by configuring the module'}
                      </h3>
                      <p className="mt-3 text-base font-bold text-slate-500">
                        {language === 'ar'
                          ? 'أكمل تفاصيل الموديول من النافذة، ثم احفظ لينتقل بك النظام مباشرة إلى قائمة الاختبارات الخاصة به.'
                          : 'Complete the module details in the modal, then save to go directly to its exams portal.'}
                      </p>
                      <button
                        type="button"
                        onClick={moduleManagement.openAddModuleModal}
                        className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-black text-white transition-all hover:bg-indigo-700"
                      >
                        <PlusCircle className="h-5 w-5" />
                        {language === 'ar' ? 'إعداد تفاصيل الموديول' : 'Configure Module Details'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded-[30px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600">
                              {language === 'ar' ? 'الموديول' : 'Module'}
                            </div>
                            <h3 className="mt-2 truncate text-2xl font-black text-slate-900">
                              {primaryModule?.title || (language === 'ar' ? 'موديول بدون عنوان' : 'Untitled Module')}
                            </h3>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                                {language === 'ar' ? `النشر: ${primaryModule?.publishDate || 'غير محدد'}` : `Publish: ${primaryModule?.publishDate || 'Not set'}`}
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-rose-600" />
                                {language === 'ar' ? `الإغلاق: ${primaryModule?.cutOffDate || 'غير محدد'}` : `Cut-off: ${primaryModule?.cutOffDate || 'Not set'}`}
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                                <ListChecks className="h-3.5 w-3.5 text-indigo-600" />
                                {(primaryModule?.subExams || []).length} {language === 'ar' ? 'اختبارات' : 'exams'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => moduleManagement.openEditModuleModal(0)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-700 transition-all hover:bg-indigo-100"
                          >
                            <Edit2 className="h-4 w-4" />
                            {language === 'ar' ? 'تعديل بيانات الموديول' : 'Edit Module Details'}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h4 className="text-2xl font-black text-slate-900">{language === 'ar' ? 'الاختبارات' : 'Exams'}</h4>
                            <p className="mt-1 text-sm font-bold text-slate-400">
                              {(primaryModule?.subExams || []).length} {language === 'ar' ? 'اختبارات حالية داخل هذا الموديول' : 'draft exams inside this module'}
                            </p>
                          </div>
                          <div className="flex w-full gap-2 md:w-auto">
                            <input
                              type="text"
                              value={newSubExamTitle}
                              onChange={(e) => setNewSubExamTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addDraftExam();
                              }}
                              placeholder={language === 'ar' ? 'اسم الاختبار الجديد' : 'New exam name'}
                              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-indigo-500 md:w-64"
                            />
                            <button
                              type="button"
                              onClick={addDraftExam}
                              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-indigo-700"
                            >
                              <PlusCircle className="h-5 w-5" />
                              {language === 'ar' ? 'إضافة اختبار' : 'Add Exam'}
                            </button>
                          </div>
                        </div>

                        {(primaryModule?.subExams || []).length === 0 ? (
                          <div className="rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-400 font-black">
                            {language === 'ar' ? 'ابدأ بإضافة الاختبارات من هنا مباشرة.' : 'Start adding exams from here directly.'}
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-[28px] border border-slate-100">
                            <div className="hidden grid-cols-[minmax(0,1.5fr)_160px_180px] gap-4 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400 md:grid">
                              <div>{language === 'ar' ? 'الاختبار' : 'Exam'}</div>
                              <div>{language === 'ar' ? 'الأسئلة' : 'Questions'}</div>
                              <div>{language === 'ar' ? 'الإجراءات' : 'Actions'}</div>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {(primaryModule?.subExams || []).map((subExam: any, index: number) => (
                                <div key={subExam.id || index} className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.5fr)_160px_180px] md:items-center">
                                  <div className="min-w-0">
                                    {editingDraftExamIndex === index ? (
                                      <input
                                        autoFocus
                                        value={editingDraftExamTitle}
                                        onChange={(e) => setEditingDraftExamTitle(e.target.value)}
                                        onBlur={() => commitDraftExamTitle(index)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') commitDraftExamTitle(index);
                                        }}
                                        className="w-full rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-lg font-black text-slate-900 outline-none focus:border-indigo-500"
                                      />
                                    ) : (
                                      <>
                                        <div className="truncate text-lg font-black text-slate-900">
                                          {subExam.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam')}
                                        </div>
                                        <div className="mt-1 text-xs font-bold text-slate-400">
                                          {language === 'ar'
                                            ? 'افتح إعدادات الاختبار لإضافة الأسئلة والتواريخ'
                                            : 'Open the exam editor to add questions and dates'}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-sm font-black text-slate-500">
                                    {(subExam.questions?.length || 0)} {language === 'ar' ? 'سؤال' : 'questions'}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openDraftExamEditor(index)}
                                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-700 transition-all hover:bg-indigo-100"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                      {language === 'ar' ? 'تعديل' : 'Edit'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeDraftExam(index)}
                                      className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 transition-all hover:bg-red-100"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {language === 'ar' ? 'حذف' : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <ModulesList 
                    {...state}
                    {...moduleManagement}
                    language={language}
                  />

                  <StandaloneQuestions 
                    {...state}
                    {...questionLogic}
                    language={language}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


