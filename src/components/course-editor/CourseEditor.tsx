"use client";

import React, { useEffect } from "react";
import { CourseEditorProvider, useCourseEditor } from "./CourseEditorContext";
import { CourseSettingsForm } from "./CourseSettingsForm";
import { LessonList } from "./LessonList";
import { LessonBuilderModal } from "./LessonBuilderModal";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface CourseEditorProps {
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN";
}

const InnerCourseEditor: React.FC = () => {
  const router = useRouter();
  const { language } = useLanguage();
  const {
    isLoading,
    isSubmitting,
    isAutoSaveEnabled,
    setIsAutoSaveEnabled,
    lastAutoSave,
    hasUnsavedChanges,
    handleSubmit,
    handleDeleteCourse,
    courseData,
    lessons,
    currentLesson,
    isLessonModalOpen,
    editingLessonIndex
  } = useCourseEditor();

  // Periodic autosave listener
  useEffect(() => {
    if (!hasUnsavedChanges || isSubmitting || isLoading || !isAutoSaveEnabled) return;
    if (isLessonModalOpen) return;

    const timer = setTimeout(() => {
      handleSubmit(undefined, true);
    }, 60000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, isSubmitting, isLoading, courseData, lessons, isAutoSaveEnabled, isLessonModalOpen, currentLesson, editingLessonIndex]);

  // Prevent closing page if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          <div className="animate-in fade-in duration-500">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.back()}
                  className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 transition-all"
                >
                  <ArrowLeft className={`w-7 h-7 ${language === "en" ? "rotate-180" : ""}`} />
                </button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    {language === "ar" ? "تعديل الكورس" : "Edit Course"}
                  </h1>
                  <p className="text-slate-400 text-lg mt-1 font-bold">
                    {language === "ar" ? "تحديث محتوى وهيكل الكورس التعليمي" : "Update educational course content and structure"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 items-center shrink-0">
                <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 ml-4 shrink-0">
                  <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{language === "ar" ? "الحفظ التلقائي" : "Auto-Save"}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isAutoSaveEnabled}
                      onChange={(e) => {
                        setIsAutoSaveEnabled(e.target.checked);
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shrink-0"></div>
                  </label>
                </div>

                {lastAutoSave && (
                  <span className="text-xs text-slate-400 font-bold hidden xl:inline-block font-sans whitespace-nowrap">
                    {language === "ar" ? "آخر حفظ تلقائي:" : "Last auto-save:"} {lastAutoSave.toLocaleTimeString()}
                  </span>
                )}

                <button
                  onClick={(e) => handleSubmit(e)}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all whitespace-nowrap shrink-0"
                >
                  {isSubmitting ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : language === "ar" ? "حفظ التعديلات" : "Save Changes"}
                  <Save className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Settings and Danger Zone */}
              <div className="lg:col-span-4 space-y-8">
                <CourseSettingsForm />

                {/* Danger Zone */}
                <div className="bg-red-50/50 rounded-[28px] border border-red-100 p-6 flex flex-col items-center justify-center gap-3">
                  <p className="text-xs font-bold text-red-500 text-center">{language === "ar" ? "منطقة الخطر" : "Danger Zone"}</p>
                  <button
                    type="button"
                    onClick={handleDeleteCourse}
                    className="w-full bg-red-100 text-red-600 px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-650 hover:text-white transition-all border border-red-200"
                  >
                    <Trash2 size={20} /> {language === "ar" ? "حذف الكورس بالكامل" : "Delete Course"}
                  </button>
                </div>
              </div>

              {/* Right Column: Lessons Builder */}
              <div className="lg:col-span-8 space-y-8">
                <LessonList />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Lesson Modal Portal */}
        <LessonBuilderModal />
      </div>
    </DashboardLayout>
  );
};

export const CourseEditor: React.FC<CourseEditorProps> = ({ role }) => {
  return (
    <CourseEditorProvider role={role}>
      <InnerCourseEditor />
    </CourseEditorProvider>
  );
};
export default CourseEditor;
