// @ts-nocheck
"use client";

import React, { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Save, ArrowLeft } from 'lucide-react';
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

export default function SchoolAdminNewExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolIdParam = searchParams.get("schoolId");
  
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
    setIsModuleModalOpen, setStandaloneQuestions, tempQuestion, setTempQuestion,
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12">
        
        <ModuleModal 
          {...state}
          {...moduleManagement}
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
                <h1 className="text-3xl md:text-4xl font-black text-slate-900">{language === 'ar' ? 'إنشاء اختبار جديد' : 'Create New Exam'}</h1>
                <p className="text-slate-400 text-lg mt-1 font-bold">{language === 'ar' ? 'صمم تجربة تقييم متكاملة لطلابك' : 'Design a complete assessment experience for your students'}</p>
              </div>
            </div>
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
            {showSettings && (
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
            )}

            <div className={`space-y-8 ${showSettings ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
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
