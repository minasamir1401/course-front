"use client";

import React, { useState, useEffect } from "react";
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

export const LessonBuilderModal: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { language } = useLanguage();
  const { showToast } = useNotification();
  const {
    currentLesson,
    setCurrentLesson,
    activeTab,
    setActiveTab,
    isLessonModalOpen,
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

  const handleQuestionsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (rows.length < 2) {
          showToast(language === 'ar' ? "الملف فارغ أو لا يحتوي على أسئلة" : "File is empty or does not contain questions", "error");
          return;
        }

        const newQuestions: any[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;

          const text = String(row[0]);
          const typeRaw = String(row[1] || "MCQ").toUpperCase();
          const type = ["MCQ", "TRUE_FALSE", "MULTI_SELECT", "TEXT"].includes(typeRaw) ? typeRaw : "MCQ";
          
          let options: string[] = ["", "", "", ""];
          let correctAnswer: any = "";

          if (type === "TRUE_FALSE") {
            options = ["صحيح", "خطأ", "", ""];
            const ansRaw = String(row[2] || "صحيح").trim();
            correctAnswer = (ansRaw === "صح" || ansRaw === "صحيح" || ansRaw === "true" || ansRaw === "1") ? "صحيح" : "خطأ";
          } else if (type === "MULTI_SELECT") {
            options = [
              String(row[2] || ""),
              String(row[3] || ""),
              String(row[4] || ""),
              String(row[5] || "")
            ];
            const ansRaw = String(row[6] || "");
            const indices = ansRaw.split(/[,\-]/).map(x => parseInt(x.trim()) - 1).filter(idx => idx >= 0 && idx < 4);
            correctAnswer = indices.map(idx => options[idx]).filter(Boolean);
          } else if (type === "MCQ") {
            options = [
              String(row[2] || ""),
              String(row[3] || ""),
              String(row[4] || ""),
              String(row[5] || "")
            ];
            const ansIdx = parseInt(String(row[6] || "1")) - 1;
            correctAnswer = options[ansIdx >= 0 && ansIdx < 4 ? ansIdx : 0] || options[0];
          } else {
            correctAnswer = String(row[2] || "");
          }

          const explanationText = String(row[7] || "");
          const sections = explanationText ? [{
            id: Date.now() + i,
            type: "EXPLANATION",
            content: explanationText
          }] : [];

          const points = parseInt(String(row[8] || "1")) || 1;
          const level = String(row[9] || "Medium");

          newQuestions.push({
            id: Date.now() + i + Math.random(),
            type,
            text,
            options,
            correctAnswer,
            correctAnswers: Array.isArray(correctAnswer) ? correctAnswer : [],
            sections,
            points,
            level,
            label: type
          });
        }

        const updatedQuestions = [...(currentLesson.questions || []), ...newQuestions];
        setCurrentLesson({ ...currentLesson, questions: updatedQuestions });
        showToast(language === 'ar' ? `تم استيراد ${newQuestions.length} أسئلة بنجاح` : `Successfully imported ${newQuestions.length} questions`, "success");
      } catch (err) {
        console.error("Error reading questions excel:", err);
        showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف الأسئلة" : "Error reading questions file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = "";
  };

  const handleAssignmentsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (rows.length < 2) {
          showToast(language === 'ar' ? "الملف فارغ أو لا يحتوي على واجبات" : "File is empty or does not contain assignments", "error");
          return;
        }

        const newAssignments: any[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;

          const text = String(row[0]);
          const typeRaw = String(row[1] || "TEXT").toUpperCase();
          const type = ["MCQ", "TRUE_FALSE", "MULTI_SELECT", "TEXT"].includes(typeRaw) ? typeRaw : "TEXT";
          
          let options: string[] = ["", "", "", ""];
          let correctAnswer: any = "";

          if (type === "TRUE_FALSE") {
            options = ["صحيح", "خطأ", "", ""];
            const ansRaw = String(row[2] || "صحيح").trim();
            correctAnswer = (ansRaw === "صح" || ansRaw === "صحيح" || ansRaw === "true" || ansRaw === "1") ? "صحيح" : "خطأ";
          } else if (type === "MULTI_SELECT" || type === "MCQ") {
            options = [
              String(row[2] || ""),
              String(row[3] || ""),
              String(row[4] || ""),
              String(row[5] || "")
            ];
            correctAnswer = String(row[6] || "");
          } else {
            correctAnswer = String(row[2] || "");
          }

          const explanationText = String(row[7] || "");
          const sections = explanationText ? [{
            id: Date.now() + i,
            type: "EXPLANATION",
            content: explanationText
          }] : [];

          const points = parseInt(String(row[8] || "5")) || 5;
          const level = String(row[9] || "Medium");

          newAssignments.push({
            id: Date.now() + i + Math.random(),
            type,
            text,
            options,
            correctAnswer,
            sections,
            points,
            level,
            label: type
          });
        }

        const updatedAssignments = [...(currentLesson.assignments || []), ...newAssignments];
        setCurrentLesson({ ...currentLesson, assignments: updatedAssignments });
        showToast(language === 'ar' ? `تم استيراد ${newAssignments.length} واجبات بنجاح` : `Successfully imported ${newAssignments.length} assignments`, "success");
      } catch (err) {
        console.error("Error reading assignments excel:", err);
        showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف الواجبات" : "Error reading assignments file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = "";
  };

  const downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    const isQuestions = type === 'questions';
    const wsData = [
      [
        isQuestions ? "Question Prompt (نص السؤال)" : "Assignment Prompt (نص التكليف)", 
        "Type (MCQ/TRUE_FALSE/TEXT/MULTI_SELECT)", 
        "Option 1 / Answer", 
        "Option 2", 
        "Option 3", 
        "Option 4", 
        "Correct Answer (1-4 or comma separated for MULTI)", 
        "Explanation / Tip / Solution Note", 
        "Points", 
        "Difficulty Level (Easy/Medium/Hard)"
      ],
      [
        isQuestions ? "ما هو وحدة قياس القوة في النظام الدولي؟" : "قم بإعداد تقرير مبسط عن تطبيقات قوانين نيوتن في الحياة اليومية",
        isQuestions ? "MCQ" : "TEXT",
        isQuestions ? "النيوتن" : "",
        isQuestions ? "الجول" : "",
        isQuestions ? "الواط" : "",
        isQuestions ? "الباسكال" : "",
        isQuestions ? "1" : "",
        isQuestions ? "القوة تقاس بالنيوتن نسبة للعالم إسحاق نيوتن." : "تأكد من شمول التقرير لأمثلة حية من واقع الميكانيكا.",
        isQuestions ? "2" : "10",
        "Medium"
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isQuestions ? "Questions Template" : "Assignments Template");
    XLSX.writeFile(wb, isQuestions ? "questions_template.xlsx" : "assignments_template.xlsx");
    showToast(language === 'ar' ? "تم تحميل النموذج بنجاح" : "Template downloaded successfully", "success");
  };

  if (!isLessonModalOpen || !mounted || !currentLesson) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white border border-slate-200 w-full h-full rounded-[28px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
          {/* Minimal Header (Close Button Only) */}
          <div className="flex justify-end p-2 shrink-0 bg-white border-b border-slate-100">
            <button 
              onClick={() => setIsLessonModalOpen(false)} 
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
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
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
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
          <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button 
              onClick={() => setIsLessonModalOpen(false)} 
              className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              {language === 'ar' ? "إلغاء" : "Cancel"}
            </button>
            <button 
              onClick={saveLesson} 
              className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {language === 'ar' ? "تحديث وحفظ" : "Update & Save"} 
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
