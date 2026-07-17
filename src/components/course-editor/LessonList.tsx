"use client";

import React, { useState, useRef } from "react";
import { useCourseEditor } from "./CourseEditorContext";
import { Layers, Plus, BookOpen, Eye, Clock, Monitor, Edit2, Trash2, X, DownloadCloud, FileSpreadsheet, FileCode, Upload } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import ImportExcelModal from "@/components/modals/ImportExcelModal";

export const LessonList: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useNotification();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const {
    courseId,
    lessons,
    activeContentTab,
    openAddLessonModal,
    openEditLessonModal,
    handleRemoveLesson,
    fetchCourseData,
    handleSubmit
  } = useCourseEditor();

  const handleExportCourse = async () => {
    if (!courseId) {
      showToast(language === 'ar' ? "يجب حفظ الكورس أولاً" : "Please save the course first", "error");
      return;
    }
    try {
      showToast(language === 'ar' ? "جاري حفظ التعديلات وتصدير الكورس..." : "Saving changes & exporting course...", "info");
      if (handleSubmit) await handleSubmit(undefined, false);
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/school/export/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `course_${courseId}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast(language === 'ar' ? "تم التصدير بنجاح" : "Exported successfully", "success");
    } catch (err) {
      showToast(language === 'ar' ? "فشل التصدير" : "Export failed", "error");
    }
  };

  const handleExportLesson = async (lessonId: string) => {
    if (!lessonId) return;
    try {
      if (handleSubmit) await handleSubmit(undefined, false);
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/school/export/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lesson_${lessonId}_export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showToast(language === 'ar' ? "فشل التصدير" : "Export failed", "error");
    }
  };

  const handleExportJson = async () => {
    if (!courseId) {
      showToast(language === 'ar' ? "يجب حفظ الكورس أولاً" : "Please save the course first", "error");
      return;
    }
    try {
      showToast(language === 'ar' ? "جاري حفظ التعديلات وتصدير نسخة JSON..." : "Saving & exporting JSON backup...", "info");
      if (handleSubmit) await handleSubmit(undefined, false);
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/school/export/json/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export JSON failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `course_${courseId}_backup.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast(language === 'ar' ? "تم تصدير نسخة JSON بنجاح" : "JSON backup exported successfully", "success");
    } catch (err) {
      showToast(language === 'ar' ? "فشل تصدير نسخة JSON" : "Failed to export JSON backup", "error");
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const formData = new FormData();
      formData.append("file", file);

      showToast(language === "ar" ? "جاري استعادة الكورس من ملف JSON..." : "Restoring course from JSON...", "info");
      const res = await fetch(`${API_URL}/school/import/json/course`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import JSON");

      showToast(data.message || (language === "ar" ? "تمت استعادة الكورس بنجاح" : "Course restored successfully"), "success");
      if (token && courseId) {
        await fetchCourseData(token, courseId);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      showToast(err.message || (language === "ar" ? "فشل استعادة الكورس من ملف JSON" : "Failed to restore course"), "error");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden file input for JSON restore */}
      <input
        type="file"
        ref={jsonInputRef}
        onChange={handleImportJson}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Content Navigation Tabs */}
      <div className="bg-white p-2 rounded-[30px] border border-slate-100 shadow-sm flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
          <Layers className="w-5 h-5" />
          {language === "ar" ? "الدروس والمحاضرات" : "Lessons & Lectures"}
        </button>
      </div>

      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
          <Layers className="w-8 h-8 text-indigo-600" /> {language === "ar" ? "الدروس والمحاضرات" : "Lessons & Lectures"}
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-indigo-100 text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 bg-white text-xs sm:text-base"
          >
            <FileSpreadsheet size={20} />
            <span className="hidden sm:inline">{language === "ar" ? "استيراد Excel" : "Import Excel"}</span>
          </button>
          <button
            onClick={handleExportCourse}
            className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 bg-white text-xs sm:text-base"
          >
            <DownloadCloud size={20} />
            <span className="hidden sm:inline">{language === "ar" ? "تصدير Excel" : "Export Excel"}</span>
          </button>
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-emerald-100 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 bg-white text-xs sm:text-base"
          >
            <Upload size={20} />
            <span className="hidden sm:inline">{language === "ar" ? "استعادة JSON" : "Restore JSON"}</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 bg-white text-xs sm:text-base"
          >
            <FileCode size={20} />
            <span className="hidden sm:inline">{language === "ar" ? "تصدير JSON" : "Export JSON"}</span>
          </button>
          <button
            onClick={openAddLessonModal}
            className="px-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all shadow-xl bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 text-white text-xs sm:text-base"
          >
            <Plus size={24} />
            {language === "ar" ? "إضافة درس" : "Add Lesson"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {activeContentTab === "lessons" ? (
          lessons.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <BookOpen className="w-10 h-10" />
              </div>
              <p className="font-black text-xl">{language === "ar" ? "لا يوجد دروس في هذا الكورس بعد" : "No lessons in this course yet"}</p>
              <button onClick={openAddLessonModal} className="text-indigo-600 font-bold hover:underline">
                {language === "ar" ? "أضف درسك الأول الآن" : "Add your first lesson now"}
              </button>
            </div>
          ) : (
            lessons.map((lesson, index) => (
              <div
                key={index}
                className="bg-white border border-slate-100 rounded-[30px] p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>

                <div className="flex items-center gap-6 flex-1 w-full md:w-auto min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100 shadow-inner group-hover:scale-105 transition-all shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-black text-slate-900 text-xl truncate group-hover:text-indigo-600 transition-colors">{lesson.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          lesson.isVisible ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                        }`}
                      >
                        {lesson.isVisible ? <Eye className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {lesson.isVisible
                          ? language === "ar"
                            ? "مرئي للطلاب"
                            : "Visible to students"
                          : language === "ar"
                          ? "مخفي عن الطلاب"
                          : "Hidden from students"}
                      </div>
                      {lesson.publishDate && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                          <Clock className="w-3 h-3" />
                          {language === "ar"
                            ? `مجدول: ${new Date(lesson.publishDate).toLocaleDateString("ar-EG")}`
                            : `Scheduled: ${new Date(lesson.publishDate).toLocaleDateString("en-US")}`}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                        <Monitor className="w-3 h-3" />
                        {lesson.slides?.length || 0} {language === "ar" ? "شرائح" : "slides"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
                  <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block"></div>
                  {lesson.id && (
                    <>
                      <button
                        onClick={() => handleExportLesson(lesson.id as string)}
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                        title={language === "ar" ? "تصدير الدرس" : "Export Lesson"}
                      >
                        <DownloadCloud size={18} />
                      </button>
                      <button
                        onClick={() => window.open(`/lessons/${lesson.id}?preview=true`, "_blank")}
                        className="flex items-center gap-2 bg-slate-50 text-slate-400 px-5 py-3 rounded-2xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all border border-slate-100"
                        title={language === "ar" ? "معاينة الدرس" : "Preview Lesson"}
                      >
                        <Eye size={18} />
                        {language === "ar" ? "معاينة" : "Preview"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openEditLessonModal(index)}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                  >
                    <Edit2 size={18} />
                    {language === "ar" ? "تعديل" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleRemoveLesson(index)}
                    className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-50"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )
        ) : null}
      </div>

      <ImportExcelModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => {
          if (courseId) {
            const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
            if (token) {
              fetchCourseData(token, courseId);
            }
          } else {
            window.location.reload();
          }
        }} 
      />
    </div>
  );
};
