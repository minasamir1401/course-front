// @ts-nocheck
"use client";

import React, { useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Save, ArrowLeft, Plus, Settings } from 'lucide-react';
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
import ExamModulePortal from "@/components/exams/ExamModulePortal";
import SubExamEditorScreen from "@/components/exams/SubExamEditorScreen";
import { buildSubExamEditorHref, getExamWorkflowView } from "@/lib/examModuleView";
import { selectEditableModule, selectEditableSubExamIndex } from "@/lib/examEditorSelection";

export default function SchoolAdminEditExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const examId = params?.id as string;
  const schoolIdParam = searchParams.get("schoolId");
  const moduleId = searchParams.get("moduleId");
  const subExamId = searchParams.get("subExamId");
  const createModule = searchParams.get("createModule");
  
  const { showToast } = useNotification();
  const { language, t } = useLanguage();

  const state = useExamState(schoolIdParam, examId, subExamId);
  const {
    examData, setExamData, schools, modules, isModuleModalOpen,
    currentModule, editingModuleIndex, standaloneQuestions,
    showSettings, visibleStandaloneCount, 
    createdId, isLoading, isAutoSaveEnabled,
    manualSubmitRef, lastAutoSaveSnapshotRef, autoSaveGenerationRef,
    createdIdRef, setCreatedId, setCurrentModule, setModules,
    setEditingModuleIndex, setLastAutoSave, autoSaveWriteQueueRef,
    autoSaveTimerRef, activeTab, setActiveTab, setAvailableMetadata,
    setIsModuleModalOpen, setStandaloneQuestions, tempQuestion, setTempQuestion, setShowSettings,
    setQuestionSource, setShowQuestionForm, openDropdownId, setOpenDropdownId,
    customSkills, setCustomSkills, allExistingSkills, availableMetadata
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
  
  const { handleSubmit } = useExamSubmit({ ...state, showToast, language, router, t });

  const workflowView = getExamWorkflowView(moduleId, subExamId);
  const didAutoOpenModuleModalRef = useRef(false);
  const hasMatchingModule = Boolean(
    moduleId && (modules || []).some((module: any) => String(module?.id || "") === String(moduleId))
  );
  const shouldFallbackToFullEditor = Boolean(
    workflowView === "module-portal" &&
    moduleId &&
    !isLoading &&
    (String(moduleId) === String(examId) || !hasMatchingModule)
  );
  const effectiveWorkflowView = shouldFallbackToFullEditor ? "full-editor" : workflowView;

  const resolvedModule = effectiveWorkflowView === "sub-exam-editor" && moduleId
    ? (modules || []).find((module: any) => String(module?.id || "") === String(moduleId))
      || (String(currentModule?.id || "") === String(moduleId) ? currentModule : null)
    : null;
  const resolvedSubExamIndex = effectiveWorkflowView === "sub-exam-editor" && resolvedModule && subExamId
    ? (resolvedModule.subExams || []).findIndex((subExam: any) => String(subExam?.id || "") === String(subExamId))
    : -1;
  const editableModule = selectEditableModule(moduleId, resolvedModule, currentModule);
  const editableSubExamIndex = selectEditableSubExamIndex(resolvedSubExamIndex, state.activeSubExamIndex);

  const renderSlidesBuilderProps = () => (
    <SlidesBuilder  
      {...state}
      {...lessonBuilder}
      language={language}
    />
  );

  const renderQuestionsBuilderProps = (source: 'questions' | 'assignments') => (
    <QuestionsBuilder  
      source={source}  
      {...state}
      currentModule={effectiveWorkflowView === "sub-exam-editor" ? editableModule : state.currentModule}
      activeSubExamIndex={effectiveWorkflowView === "sub-exam-editor" ? editableSubExamIndex : state.activeSubExamIndex}
      {...questionLogic}
      {...moduleManagement}
      language={language}
      assignmentsExcelRef={moduleManagement.assignmentsExcelRef}
      questionsExcelRef={moduleManagement.questionsExcelRef}
      handleQuestionsExcelChange={(e) => moduleManagement.handleQuestionsExcelChange(e, effectiveWorkflowView === "sub-exam-editor" ? editableSubExamIndex : state.activeSubExamIndex)}
      handleAssignmentsExcelChange={(e) => moduleManagement.handleAssignmentsExcelChange(e, effectiveWorkflowView === "sub-exam-editor" ? editableSubExamIndex : state.activeSubExamIndex)}
      advancedMetadataExcelRef={moduleManagement.advancedMetadataExcelRef}
      handleAdvancedMetadataExcelChange={async (e) => {
        const activeIndex = effectiveWorkflowView === "sub-exam-editor" ? editableSubExamIndex : state.activeSubExamIndex;
        const updatedList = await moduleManagement.handleAdvancedMetadataExcelChange(e, activeIndex, source);
        if (updatedList && updatedList.length > 0 && state.editingQuestionIndex !== null && state.showQuestionForm) {
          state.setTempQuestion(updatedList[state.editingQuestionIndex]);
        }
      }}
      downloadAdvancedMetadataTemplate={() => moduleManagement.downloadAdvancedMetadataTemplate(effectiveWorkflowView === "sub-exam-editor" ? editableSubExamIndex : state.activeSubExamIndex, source)}
    />
  );

  const openSubExamEditor = (moduleRefId?: string | null, subExamRefId?: string | null) => {
    const href = buildSubExamEditorHref("SCHOOL_ADMIN", examId, moduleRefId, subExamRefId);
    if (href) {
      router.push(href);
    }
  };

  React.useEffect(() => {
    if (effectiveWorkflowView !== "full-editor" || createModule !== "1") {
      didAutoOpenModuleModalRef.current = false;
      return;
    }
    if (didAutoOpenModuleModalRef.current) return;
    didAutoOpenModuleModalRef.current = true;
    setEditingModuleIndex(null);
    setCurrentModule({
      title: "",
      domain: "",
      content: "",
      videoUrl: "",
      summary: "",
      notes: "",
      standards: "",
      indicators: "",
      learningOutcomes: "",
      isVisible: true,
      publishDate: "",
      cutOffDate: "",
      slides: [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", videoUrl: "", sections: [] }],
      questions: [],
      assignments: [],
      attachments: []
    });
    setActiveTab('info');
    setIsModuleModalOpen(true);
    router.replace(`/school-admin/exams/edit/${examId}`);
  }, [createModule, effectiveWorkflowView, examId, language, router, setActiveTab, setCurrentModule, setEditingModuleIndex, setIsModuleModalOpen]);

  if (effectiveWorkflowView === "module-portal") {
    return <DashboardLayout><ExamModulePortal state={state} moduleId={moduleId} language={language} role="SCHOOL_ADMIN" /></DashboardLayout>;
  }

  if (effectiveWorkflowView === "sub-exam-editor" && moduleId && subExamId) {
    return (
      <DashboardLayout>
        <SubExamEditorScreen
          backHref={`/school-admin/exams/edit/${examId}?moduleId=${encodeURIComponent(moduleId)}`}
          examHref={`/exams/${examId}?preview=true&subExamId=${encodeURIComponent(subExamId)}`}
          currentModule={editableModule}
          activeSubExamIndex={editableSubExamIndex}
          setCurrentModule={setCurrentModule}
          renderQuestionsBuilder={renderQuestionsBuilderProps}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          isResolving={isLoading && (!editableModule || editableSubExamIndex < 0)}
          language={language}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        
        <ModuleModal 
          {...state}
          {...moduleManagement}
          moduleMode={true}
          openSubExamEditor={openSubExamEditor}
          language={language}
          t={t}
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
                <h1 className="text-3xl md:text-4xl font-black text-slate-900">{language === 'ar' ? 'تعديل الموديول' : 'Edit Module'}</h1>
                <p className="text-slate-400 text-lg mt-1 font-bold">{language === 'ar' ? 'صمم تجربة تقييم متكاملة لطلابك' : 'Design a complete assessment experience for your students'}</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={moduleManagement.openAddModuleModal}
              className="bg-white text-indigo-600 px-8 py-5 rounded-[22px] font-black flex items-center gap-3 border border-indigo-100 hover:bg-indigo-50 transition-all"
            >
              {language === 'ar' ? 'إضافة موديول' : 'Add Module'}
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-12 py-5 rounded-[22px] font-black flex items-center gap-3 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ ونشر التقييم' : 'Save & Publish Exam')}
              <Save className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {showSettings ? (
              <SettingsPanel 
                {...state}
                {...moduleManagement}
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
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
