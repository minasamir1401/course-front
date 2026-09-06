"use client";
import { buildQuestionWorkbook, importModuleQuestions } from '@/lib/questionExcelWorkbook';

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCourseEditor } from "./CourseEditorContext";
import { 
  X, Target, Clock, Layout, FileText, HelpCircle, FileJson, 
  Edit2, CheckCircle2
} from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotification } from "@/context/NotificationContext";
import { LessonInfoTab } from "./lesson-builder/LessonInfoTab";
import { LessonSlidesBuilder } from "./lesson-builder/LessonSlidesBuilder";
import { LessonQuestionsBuilder } from "./lesson-builder/LessonQuestionsBuilder";
import { LessonSchedulingTab } from "./lesson-builder/LessonSchedulingTab";
import { LessonAttachmentsTab } from "./lesson-builder/LessonAttachmentsTab";
import ExportLessonDataModal from "@/components/modals/ExportLessonDataModal";
import { Copy } from "lucide-react";

export const LessonBuilderModal: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { language } = useLanguage();
  const { showToast } = useNotification();
  const {
    role,
    currentLesson,
    setCurrentLesson,
    activeTab,
    setActiveTab,
    isLessonModalOpen,
    isLessonContentLoading,
    setIsLessonModalOpen,
    editingLessonIndex,
    metadataExcelRef,
    questionsExcelRef,
    assignmentsExcelRef,
    saveLesson,
    showQuestionForm,
    setShowQuestionForm,
    editingQuestionIndex,
    setEditingQuestionIndex,
    tempQuestion,
    setTempQuestion,
    openDropdownId,
    setOpenDropdownId,
  } = useCourseEditor();

  const handleExcelUpload = (type: 'questions' | 'metadata' | 'assignments') => {
    if (type === 'metadata' && metadataExcelRef.current) metadataExcelRef.current.click();
    else if (type === 'questions' && questionsExcelRef.current) questionsExcelRef.current.click();
    else if (type === 'assignments' && assignmentsExcelRef.current) assignmentsExcelRef.current.click();
  };

  const excelContext = useRef<any>(null);
  excelContext.current = { currentModule: currentLesson, setCurrentModule: setCurrentLesson, language, showToast, isLoadingQuestions: isLessonContentLoading };
  const handleQuestionsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    importModuleQuestions(e, null, 'questions', () => excelContext.current, role === 'SUPER_ADMIN');
  const handleAssignmentsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    importModuleQuestions(e, null, 'assignments', () => excelContext.current, role === 'SUPER_ADMIN');

  const downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    XLSX.writeFile(buildQuestionWorkbook(null, language), type === 'assignments' ? 'assignments_template.xlsx' : 'questions_template.xlsx');
  };
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  if (!isLessonModalOpen || !mounted || !currentLesson) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <div className="max-w-6xl mx-auto w-full h-[100dvh] sm:h-[calc(100dvh-3rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative bg-white border border-slate-200 w-full h-full rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
          {isLessonContentLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/90 text-slate-700">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <p className="font-black text-sm">{language === "ar" ? "جارٍ تحميل محتوى الدرس..." : "Loading lesson content..."}</p>
            </div>
          )}
          {/* Header */}
          <div className="flex justify-between items-center gap-2 p-3 sm:p-4 shrink-0 bg-white border-b border-slate-100">
            <div>
              {/* Optional: Add a subtle title here if needed */}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <button 
                onClick={() => setIsExportModalOpen(true)}
                className="min-w-0 px-3 sm:px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-indigo-100 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span className="truncate">{language === 'ar' ? 'تصدير بيانات الدرس' : 'Export Lesson Data'}</span>
              </button>
              <button 
                onClick={() => setIsLessonModalOpen(false)} 
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto shrink-0 custom-scrollbar">
            {[
              { id: 'info', label: language === 'ar' ? 'الأهداف والبيانات' : 'Goals & Info', icon: Target },
              { id: 'scheduling', label: language === 'ar' ? 'الجدولة والظهور' : 'Scheduling & Visibility', icon: Clock },
              { id: 'slides', label: language === 'ar' ? 'محتوى الشرح' : 'Explanation Content', icon: Layout },
              { id: 'assignments', label: language === 'ar' ? "واجبات وتكليفات الدرس (Assignments)" : "Assignments", icon: FileText },
              { id: 'exercises', label: language === 'ar' ? "تدريبات وتقييمات الدرس (Quiz Me)" : "Quiz Me", icon: HelpCircle },
              { id: 'attachments', label: language === 'ar' ? 'المرفقات' : 'Attachments', icon: FileJson },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-[0_4px_20px_-10px_rgba(79,70,229,0.4)]' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Body Content */}
          <div className="p-3 sm:p-8 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar overscroll-contain">
            {activeTab === 'info' && (
              <LessonInfoTab 
                currentLesson={currentLesson}
                setCurrentLesson={setCurrentLesson}
                language={language}
                showToast={showToast}
                metadataExcelRef={metadataExcelRef}
                handleExcelUpload={handleExcelUpload}
              />
            )}

            {activeTab === 'scheduling' && (
              <LessonSchedulingTab 
                currentLesson={currentLesson}
                setCurrentLesson={setCurrentLesson}
                language={language}
              />
            )}

            {activeTab === 'slides' && (
              <LessonSlidesBuilder 
                source="slides"
                currentLesson={currentLesson}
                setCurrentLesson={setCurrentLesson}
                language={language}
                assignmentsExcelRef={assignmentsExcelRef}
                questionsExcelRef={questionsExcelRef}
                handleAssignmentsExcelChange={handleAssignmentsExcelChange}
                handleQuestionsExcelChange={handleQuestionsExcelChange}
                handleExcelUpload={handleExcelUpload}
                downloadQuestionsTemplate={downloadQuestionsTemplate}
              />
            )}

            {activeTab === 'assignments' && (
              <LessonQuestionsBuilder 
                source="assignments"
                currentLesson={currentLesson}
                setCurrentLesson={setCurrentLesson}
                language={language}
                assignmentsExcelRef={assignmentsExcelRef}
                questionsExcelRef={questionsExcelRef}
                handleAssignmentsExcelChange={handleAssignmentsExcelChange}
                handleQuestionsExcelChange={handleQuestionsExcelChange}
                handleExcelUpload={handleExcelUpload}
                downloadQuestionsTemplate={downloadQuestionsTemplate}
                showQuestionForm={showQuestionForm}
                setShowQuestionForm={setShowQuestionForm}
                editingQuestionIndex={editingQuestionIndex}
                setEditingQuestionIndex={setEditingQuestionIndex}
                tempQuestion={tempQuestion}
                setTempQuestion={setTempQuestion}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />
            )}

            {activeTab === 'exercises' && (
              <LessonQuestionsBuilder 
                source="questions"
                currentLesson={currentLesson}
                setCurrentLesson={setCurrentLesson}
                language={language}
                assignmentsExcelRef={assignmentsExcelRef}
                questionsExcelRef={questionsExcelRef}
                handleAssignmentsExcelChange={handleAssignmentsExcelChange}
                handleQuestionsExcelChange={handleQuestionsExcelChange}
                handleExcelUpload={handleExcelUpload}
                downloadQuestionsTemplate={downloadQuestionsTemplate}
                showQuestionForm={showQuestionForm}
                setShowQuestionForm={setShowQuestionForm}
                editingQuestionIndex={editingQuestionIndex}
                setEditingQuestionIndex={setEditingQuestionIndex}
                tempQuestion={tempQuestion}
                setTempQuestion={setTempQuestion}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />
            )}

            {activeTab === 'attachments' && (
              <LessonAttachmentsTab 
                currentLesson={currentLesson}
                setCurrentLesson={setCurrentLesson}
                language={language}
                showToast={showToast}
              />
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] sm:flex sm:justify-end gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={() => setIsLessonModalOpen(false)} 
              className="min-w-0 px-3 sm:px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              {language === 'ar' ? "إلغاء" : "Cancel"}
            </button>
            <button 
              onClick={saveLesson} 
              className="min-w-0 px-3 sm:px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {language === 'ar' ? "تحديث وحفظ" : "Update & Save"} 
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <ExportLessonDataModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sourceLesson={currentLesson}
        onSuccess={() => setIsExportModalOpen(false)}
      />
    </div>,
    document.body
  );
};
