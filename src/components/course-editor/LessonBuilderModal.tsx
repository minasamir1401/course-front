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
import { Copy, Sparkles } from "lucide-react";
import AiGuidanceEditor from '@/components/ai/AiGuidanceEditor';
import workspace from './LessonWorkspace.module.css';
import { useRouter } from 'next/navigation';

export const LessonBuilderModal: React.FC<{ fullPage?: boolean }> = ({ fullPage = false }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { language } = useLanguage();
  const { showToast } = useNotification();
  const {
    role,
    courseId,
    courseData,
    allowContentDeletion,
    currentLesson,
    setCurrentLesson,
    activeTab: contextActiveTab,
    setActiveTab: setContextActiveTab,
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

  const [activeTab, setActiveTab] = useState<'info' | 'slides' | 'exercises' | 'assignments' | 'attachments' | 'scheduling' | 'ai'>(contextActiveTab || 'info');

  useEffect(() => {
    if (isLessonModalOpen) {
      setActiveTab('info');
    }
  }, [isLessonModalOpen, currentLesson?.id]);

  const handleExcelUpload = (type: 'questions' | 'metadata' | 'assignments') => {
    if (type === 'metadata' && metadataExcelRef.current) metadataExcelRef.current.click();
    else if (type === 'questions' && questionsExcelRef.current) questionsExcelRef.current.click();
    else if (type === 'assignments' && assignmentsExcelRef.current) assignmentsExcelRef.current.click();
  };

  const excelContext = useRef<any>(null);
  useEffect(() => {
    excelContext.current = { currentModule: currentLesson, setCurrentModule: setCurrentLesson, language, showToast, isLoadingQuestions: isLessonContentLoading };
  }, [currentLesson, setCurrentLesson, language, showToast, isLessonContentLoading]);
  const handleQuestionsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    importModuleQuestions(e, null, 'questions', () => excelContext.current, allowContentDeletion);
  const handleAssignmentsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    importModuleQuestions(e, null, 'assignments', () => excelContext.current, allowContentDeletion);

  const downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    const filename = language === 'ar'
      ? (type === 'assignments' ? 'قالب_التكليفات_ثنائي_اللغة.xlsx' : 'قالب_الأسئلة_ثنائي_اللغة.xlsx')
      : (type === 'assignments' ? 'assignments_bilingual_template.xlsx' : 'bilingual_questions_template.xlsx');
    XLSX.writeFile(buildQuestionWorkbook(null, language), filename);
    showToast(language === 'ar' ? 'تم تحميل القالب ثنائي اللغة بنجاح' : 'Bilingual template downloaded successfully', 'success');
  };
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  if (!isLessonModalOpen || !mounted || !currentLesson) return null;

  const closeEditor = () => {
    setIsLessonModalOpen(false);
    if (fullPage) router.push(`/${role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin'}/courses/edit?id=${courseId}`);
  };
  const tabTitles: Record<string, string[]> = {
    info: ['الأهداف والبيانات', 'Goals & information'], scheduling: ['الجدولة والظهور', 'Scheduling & visibility'],
    slides: ['محتوى الشرح', 'Explanation content'], assignments: ['الواجبات والتكليفات', 'Assignments'],
    exercises: ['التدريبات والتقييمات', 'Practice & assessments'], attachments: ['المرفقات والمراجع', 'Attachments & resources'],
    ai: ['توجيهات المساعد التعليمي', 'Learning assistant guidance'],
  };
  const content = (
    <div className={`${workspace.shell} ${fullPage ? workspace.inline : ''}`} role={fullPage ? undefined : 'dialog'} aria-modal={fullPage ? undefined : true} aria-label={language === 'ar' ? 'مساحة تعديل الدرس' : 'Lesson editing workspace'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className={workspace.frame}>
        <div className={`relative ${workspace.surface}`}>
          {isLessonContentLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/90 text-slate-700">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <p className="font-black text-sm">{language === "ar" ? "جارٍ تحميل محتوى الدرس..." : "Loading lesson content..."}</p>
            </div>
          )}
          {/* Header */}
          <div className={workspace.header}>
            <div>
              <small>{language === 'ar' ? 'مساحة إعداد الدرس' : 'LESSON WORKSPACE'} / {courseData.title}</small>
              <h1>{currentLesson.title || (language === 'ar' ? 'درس جديد' : 'New lesson')}</h1>
              <p>{language === 'ar' ? 'رتّب المحتوى والتدريبات ووجّه المساعد في تجربة واحدة.' : 'Organise content, practice and assistant guidance in one place.'}</p>
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
                onClick={closeEditor}
                className={workspace.close} aria-label={language === 'ar' ? 'العودة للمقرر' : 'Back to course'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={workspace.layout}>
          <nav className={workspace.navigation} role="tablist" aria-label={language === 'ar' ? 'أقسام إعداد الدرس' : 'Lesson sections'}>
            <p className={workspace.navIntro}>{language === 'ar' ? 'محتوى الدرس وإعداداته' : 'CONTENT & SETTINGS'}</p>
            {[
              { id: 'info', label: language === 'ar' ? 'الأهداف والبيانات' : 'Goals & Info', icon: Target },
              { id: 'scheduling', label: language === 'ar' ? 'الجدولة والظهور' : 'Scheduling & Visibility', icon: Clock },
              { id: 'slides', label: language === 'ar' ? 'محتوى الشرح' : 'Explanation Content', icon: Layout },
              { id: 'assignments', label: language === 'ar' ? "واجبات وتكليفات الدرس (Assignments)" : "Assignments", icon: FileText },
              { id: 'exercises', label: language === 'ar' ? "تدريبات وتقييمات الدرس (Quiz Me)" : "Quiz Me", icon: HelpCircle },
              { id: 'ai', label: language === 'ar' ? 'المساعد التعليمي' : 'AI assistant', icon: Sparkles },
              { id: 'attachments', label: language === 'ar' ? 'المرفقات' : 'Attachments', icon: FileJson },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={workspace.tab}
                role="tab" aria-selected={activeTab === tab.id} aria-controls={`lesson-tab-${tab.id}`} id={`lesson-nav-${tab.id}`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Tab Body Content */}
          <div className={workspace.content} role="tabpanel" id={`lesson-tab-${activeTab}`} aria-labelledby={`lesson-nav-${activeTab}`}>
            <div className={workspace.topic}><h2>{tabTitles[activeTab][language === 'ar' ? 0 : 1]}</h2><p>{language === 'ar' ? 'تعديلات المحتوى تُحفظ مع الدرس. توجيهات المساعد لها زر حفظ مستقل.' : 'Content is saved with the lesson. Assistant guidance has its own save action.'}</p></div>
            <div hidden={activeTab !== 'ai'}><AiGuidanceEditor scope="lesson" id={currentLesson.id} language={language}/></div>
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

          </div>

          {/* Workspace Footer */}
          <div className={workspace.footer}>
            <p>{language === 'ar' ? 'مساحة أوسع لدرس أوضح.' : 'More room for a clearer lesson.'}</p>
            <div className={workspace.footerActions}>
            <button 
              onClick={closeEditor}
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
      </div>
      
      <ExportLessonDataModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sourceLesson={currentLesson}
        onSuccess={() => setIsExportModalOpen(false)}
      />
    </div>
  );
  return fullPage ? content : createPortal(content, document.body);
};
