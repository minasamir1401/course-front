"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCourseEditor } from "./CourseEditorContext";
import { Layers, Plus, BookOpen, Eye, Clock, Monitor, Edit2, Trash2, X, DownloadCloud, FileSpreadsheet, FileCode, Upload, ArrowUp, ArrowDown, Copy, BarChart3, Users, CheckCircle2, HelpCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, API_URL } from "@/lib/api";
import { formatEgyptDateTime } from "@/lib/egyptTime";
import { useNotification } from "@/context/NotificationContext";
import ImportExcelModal from "@/components/modals/ImportExcelModal";
import CopyLessonModal from "@/components/modals/CopyLessonModal";

export const LessonList: React.FC = () => {
  const router = useRouter();
  const { language } = useLanguage();
  const { showToast } = useNotification();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [lessonToCopy, setLessonToCopy] = useState<{id: string, title: string} | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const {
    role,
    courseId,
    lessons,
    activeContentTab,
    openAddLessonModal,
    openEditLessonModal,
    handleRemoveLesson,
    fetchCourseData,
    handleSubmit,
    isSettingsHidden,
    setIsSettingsHidden,
    setLessons,
    hasUnsavedChanges,
  } = useCourseEditor();

  // Bulk operations visible to SUPER_ADMIN only
  const isSuperAdmin = role === "SUPER_ADMIN";
  const ar = language === "ar";
  const [courseLessonStats, setCourseLessonStats] = useState<Record<string, any>>({});
  const [expandedLessonKey, setExpandedLessonKey] = useState<string | null>(null);
  const [lessonDashboards, setLessonDashboards] = useState<Record<string, any>>({});
  const [loadingLessonId, setLoadingLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    apiFetch(`${API_URL}/teaching/overview?courseId=${encodeURIComponent(courseId)}&limit=100`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data?.lessons)) return;
        const map: Record<string, any> = {};
        for (const item of data.lessons) {
          if (item?.id) map[item.id] = item;
        }
        setCourseLessonStats(map);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [courseId, lessons.length]);

  const toggleLessonDashboard = async (lesson: any, index: number) => {
    const key = lesson.id ? String(lesson.id) : `idx-${index}`;
    if (expandedLessonKey === key) {
      setExpandedLessonKey(null);
      return;
    }
    setExpandedLessonKey(key);
    if (lesson.id && !lessonDashboards[lesson.id]) {
      setLoadingLessonId(lesson.id);
      try {
        const res = await apiFetch(`${API_URL}/teaching/lessons/${encodeURIComponent(lesson.id)}?limit=50`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLessonDashboards((prev) => ({ ...prev, [lesson.id]: data }));
        }
      } catch {
      } finally {
        setLoadingLessonId(null);
      }
    }
  };

  const countArrayItems = (raw: any, explicitCount?: number) => {
    if (typeof explicitCount === "number") return explicitCount;
    if (!raw) return 0;
    if (Array.isArray(raw)) return raw.length;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const handleExportCourse = async () => {
    if (!courseId) {
      showToast(language === 'ar' ? "يجب حفظ الكورس أولاً" : "Please save the course first", "error");
      return;
    }
    try {
      showToast(language === 'ar' ? "جاري حفظ التعديلات وتصدير الكورس..." : "Saving changes & exporting course...", "info");
      if (handleSubmit) await handleSubmit(undefined, false);
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await apiFetch(`${API_URL}/school/export/course/${courseId}`, {
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
      const res = await apiFetch(`${API_URL}/school/export/lesson/${lessonId}`, {
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
      const res = await apiFetch(`${API_URL}/school/export/json/course/${courseId}`, {
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
      const res = await apiFetch(`${API_URL}/school/import/json/course`, {
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

  const moveLessonUp = (index: number) => {
    if (index === 0) return;
    const newLessons = [...lessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[index - 1];
    newLessons[index - 1] = temp;
    setLessons(newLessons);
  };

  const moveLessonDown = (index: number) => {
    if (index === lessons.length - 1) return;
    const newLessons = [...lessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[index + 1];
    newLessons[index + 1] = temp;
    setLessons(newLessons);
  };

  const sortLessonsByDate = () => {
    const sorted = [...lessons].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    setLessons(sorted);
    showToast(language === "ar" ? "تم ترتيب الدروس من الأقدم للأحدث" : "Lessons sorted from oldest to newest", "success");
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
        <button type="button" className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
          <Layers className="w-5 h-5" />
          {language === "ar" ? "الدروس والمحاضرات" : "Lessons & Lectures"}
        </button>
      </div>

      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
            <Layers className="w-8 h-8 text-indigo-600" /> {language === "ar" ? "الدروس والمحاضرات" : "Lessons & Lectures"}
          </h3>
          {isSettingsHidden && (
            <button type="button"
              onClick={() => setIsSettingsHidden(false)}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 w-fit bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <Eye className="w-3 h-3" />
              {language === "ar" ? "إظهار إعدادات الكورس" : "Show Course Settings"}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <>
              <button type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-indigo-100 text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 bg-white text-xs sm:text-base"
              >
                <FileSpreadsheet size={20} />
                <span className="hidden sm:inline">{language === "ar" ? "استيراد Excel" : "Import Excel"}</span>
              </button>
              <button type="button"
                onClick={handleExportCourse}
                className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50 bg-white text-xs sm:text-base"
              >
                <DownloadCloud size={20} />
                <span className="hidden sm:inline">{language === "ar" ? "تصدير Excel" : "Export Excel"}</span>
              </button>
              <button type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-emerald-100 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 bg-white text-xs sm:text-base"
              >
                <Upload size={20} />
                <span className="hidden sm:inline">{language === "ar" ? "استعادة JSON" : "Restore JSON"}</span>
              </button>
              <button type="button"
                onClick={handleExportJson}
                className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 bg-white text-xs sm:text-base"
              >
                <FileCode size={20} />
                <span className="hidden sm:inline">{language === "ar" ? "تصدير JSON" : "Export JSON"}</span>
              </button>
            </>
          )}
          <button type="button"
            onClick={sortLessonsByDate}
            className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black flex items-center gap-2 sm:gap-3 transition-all border-2 border-orange-100 text-orange-600 hover:border-orange-600 hover:bg-orange-50 bg-white text-xs sm:text-base"
          >
            <Clock size={20} />
            <span className="hidden sm:inline">{language === "ar" ? "ترتيب بالتاريخ" : "Sort by Date"}</span>
          </button>
          <button type="button"
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
              <button type="button" onClick={openAddLessonModal} className="text-indigo-600 font-bold hover:underline">
                {language === "ar" ? "أضف درسك الأول الآن" : "Add your first lesson now"}
              </button>
            </div>
          ) : (
            lessons.map((lesson, index) => {
              const lessonKey = lesson.id ? String(lesson.id) : `idx-${index}`;
              const isExpanded = expandedLessonKey === lessonKey;
              const stat = lesson.id ? courseLessonStats[lesson.id] : null;
              const dash = lesson.id ? lessonDashboards[lesson.id] : null;
              const slidesTotal = countArrayItems(lesson.slides, lesson.slidesCount);
              const questionsTotal = countArrayItems(lesson.questions, (lesson as any).questionsCount);
              const assignmentsTotal = countArrayItems(lesson.assignments, (lesson as any).assignmentsCount);

              return (
                <div
                  key={lessonKey}
                  className="bg-white border border-slate-100 rounded-[30px] p-5 flex flex-col gap-5 hover:border-indigo-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                    <div className="flex items-center gap-6 flex-1 w-full md:w-auto min-w-0">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100 shadow-inner group-hover:scale-105 transition-all shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <button
                          type="button"
                          onClick={() => void toggleLessonDashboard(lesson, index)}
                          className="text-start font-black text-slate-900 text-xl group-hover:text-indigo-600 transition-colors leading-snug break-words line-clamp-2"
                        >
                          {lesson.title}
                        </button>
                        <div className="flex flex-wrap items-center gap-2.5 mt-2">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                              lesson.isVisible ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"
                            }`}
                            title={lesson.isVisible ? (ar ? "مرئي للطلاب" : "Visible to students") : (ar ? "مخفي عن الطلاب" : "Hidden")}
                          >
                            <span className={`w-2 h-2 rounded-full ${lesson.isVisible ? "bg-emerald-500" : "bg-red-500"}`} />
                            <span>{lesson.isVisible ? (ar ? "مرئي" : "Visible") : (ar ? "مخفي" : "Hidden")}</span>
                          </div>
                          {lesson.createdAt && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-black uppercase">
                              <Clock className="w-3 h-3" />
                              {new Date(lesson.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric", timeZone: 'Africa/Cairo' })}
                            </div>
                          )}
                          {lesson.publishDate && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                              <Clock className="w-3 h-3" />
                              {ar
                                ? `مجدول: ${new Date(lesson.publishDate).toLocaleDateString("ar-EG", { timeZone: 'Africa/Cairo' })}`
                                : `Scheduled: ${new Date(lesson.publishDate).toLocaleDateString("en-US", { timeZone: 'Africa/Cairo' })}`}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-black uppercase">
                            <Monitor className="w-3 h-3" />
                            {slidesTotal} {ar ? "شرائح" : "slides"}
                          </div>
                          {stat && (
                            <>
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black">
                                <Users className="w-3 h-3" />
                                {ar ? `بدأ ${stat.started ?? 0} · أكمل ${stat.completed ?? 0} · لم يبدأ ${stat.notStarted ?? 0}` : `Started ${stat.started ?? 0} · Done ${stat.completed ?? 0} · Not started ${stat.notStarted ?? 0}`}
                              </div>
                              {stat.quizAverage != null && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">
                                  <BarChart3 className="w-3 h-3" />
                                  {ar ? `كويز: ${stat.quizAverage}%` : `Quiz: ${stat.quizAverage}%`}
                                </div>
                              )}
                              {stat.assignmentAverage != null && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black">
                                  <FileText className="w-3 h-3" />
                                  {ar ? `واجب: ${stat.assignmentAverage}%` : `Assignment: ${stat.assignmentAverage}%`}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => void toggleLessonDashboard(lesson, index)}
                        className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm border ${
                          isExpanded
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-indigo-50/80 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white"
                        }`}
                        title={ar ? "تفاصيل وداشبورد الدرس" : "Lesson Details & Dashboard"}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>{ar ? "التفاصيل والداشبورد" : "Details & Dashboard"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden md:block"></div>
                      <div className="flex flex-col gap-1 items-center justify-center me-1">
                        <button type="button"
                          onClick={() => moveLessonUp(index)}
                          disabled={index === 0}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                          title={ar ? "تحريك لأعلى" : "Move Up"}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button type="button"
                          onClick={() => moveLessonDown(index)}
                          disabled={index === lessons.length - 1}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                          title={ar ? "تحريك لأسفل" : "Move Down"}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                      {lesson.id && (
                        <>
                          <button type="button"
                            onClick={() => handleExportLesson(lesson.id as string)}
                            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            title={ar ? "تصدير الدرس" : "Export Lesson"}
                          >
                            <DownloadCloud className="w-5 h-5" />
                          </button>
                          <button type="button"
                            onClick={() => window.open(`/lessons/${lesson.id}?preview=true`, "_blank")}
                            className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-600 hover:text-white transition-all shadow-sm"
                            title={ar ? "معاينة الدرس" : "Preview Lesson"}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {lesson.id && isSuperAdmin && (
                        <button type="button"
                          onClick={() => {
                            setLessonToCopy({ id: lesson.id as string, title: lesson.title });
                            setIsCopyModalOpen(true);
                          }}
                          className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          title={ar ? "نسخ الدرس" : "Copy Lesson"}
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      )}
                      <button type="button"
                        onClick={() => void openEditLessonModal(index)}
                        className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title={ar ? "تعديل محتوى وإعدادات الدرس" : "Edit Lesson"}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button type="button"
                        onClick={() => handleRemoveLesson(index)}
                        className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title={ar ? "حذف" : "Delete"}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 pt-5 mt-1 space-y-5 animate-in fade-in duration-200">
                      {/* Lesson Details & Metadata Summary */}
                      <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            {ar ? "تفاصيل ومكونات الدرس" : "Lesson Details & Structure"}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void openEditLessonModal(index)}
                              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              {ar ? "فتح محرر الدرس الكامل" : "Open Full Lesson Editor"}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="bg-white rounded-xl p-3.5 border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 block">{ar ? "شرائح الشرح" : "Slides"}</span>
                            <strong className="text-xl font-black text-slate-900 mt-1 block">{slidesTotal}</strong>
                          </div>
                          <div className="bg-white rounded-xl p-3.5 border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 block">{ar ? "التدريبات والكويز" : "Quiz Questions"}</span>
                            <strong className="text-xl font-black text-slate-900 mt-1 block">{questionsTotal}</strong>
                          </div>
                          <div className="bg-white rounded-xl p-3.5 border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 block">{ar ? "أسئلة الواجب" : "Assignments"}</span>
                            <strong className="text-xl font-black text-slate-900 mt-1 block">{assignmentsTotal}</strong>
                          </div>
                          <div className="bg-white rounded-xl p-3.5 border border-slate-100">
                            <span className="text-xs font-bold text-slate-500 block">{ar ? "حالة النشر" : "Visibility"}</span>
                            <strong className="text-sm font-black text-slate-900 mt-1.5 block">
                              {lesson.isVisible ? (ar ? "متاح للطلاب" : "Visible") : (ar ? "مخفي" : "Hidden")}
                            </strong>
                          </div>
                        </div>

                        {(lesson.domain || lesson.summary || lesson.publishDate || lesson.cutOffDate) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 bg-white rounded-xl p-4 border border-slate-100">
                            {lesson.domain && (
                              <div>
                                <span className="font-black text-slate-500">{ar ? "المجال: " : "Domain: "}</span>
                                <span className="font-bold">{lesson.domain}</span>
                              </div>
                            )}
                            {lesson.summary && (
                              <div>
                                <span className="font-black text-slate-500">{ar ? "الملخص: " : "Summary: "}</span>
                                <span className="font-bold">{lesson.summary}</span>
                              </div>
                            )}
                            {lesson.publishDate && (
                              <div>
                                <span className="font-black text-slate-500">{ar ? "موعد الإتاحة: " : "Opens: "}</span>
                                <span className="font-bold">{formatEgyptDateTime(lesson.publishDate, language)}</span>
                              </div>
                            )}
                            {lesson.cutOffDate && (
                              <div>
                                <span className="font-black text-slate-500">{ar ? "موعد الإغلاق: " : "Closes: "}</span>
                                <span className="font-bold">{formatEgyptDateTime(lesson.cutOffDate, language)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline Lesson Follow-up Dashboard */}
                      {lesson.id ? (
                        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                {ar ? "داشبورد متابعة الطلاب في هذا الدرس" : "Lesson Student Follow-up Dashboard"}
                              </h4>
                              <p className="text-xs text-slate-500 font-bold mt-0.5">
                                {ar ? "إحصائيات التقدم، الدرجات، وحالة كل طالب داخل الدرس مباشرة" : "Live student progress, scores, and skill mastery for this lesson"}
                              </p>
                            </div>
                          </div>

                          {loadingLessonId === lesson.id ? (
                            <div className="py-8 text-center text-sm font-black text-indigo-600">
                              {ar ? "جارٍ تحميل إحصائيات وداشبورد الدرس..." : "Loading lesson dashboard..."}
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white rounded-xl p-4 border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500 block">{ar ? "بدأ الدرس" : "Started"}</span>
                                  <strong className="text-2xl font-black text-indigo-600 mt-1 block">{stat?.started ?? dash?.lessons?.[0]?.started ?? 0}</strong>
                                  <small className="text-[11px] text-slate-400 font-bold">{ar ? "طالب بدأ الدراسة" : "students started"}</small>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500 block">{ar ? "أكمل الدرس" : "Completed"}</span>
                                  <strong className="text-2xl font-black text-emerald-600 mt-1 block">{stat?.completed ?? dash?.lessons?.[0]?.completed ?? 0}</strong>
                                  <small className="text-[11px] text-slate-400 font-bold">{ar ? "طالب أتم الدرس" : "students completed"}</small>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500 block">{ar ? "لم يبدأ بعد" : "Not Started"}</span>
                                  <strong className="text-2xl font-black text-amber-600 mt-1 block">{stat?.notStarted ?? dash?.lessons?.[0]?.notStarted ?? 0}</strong>
                                  <small className="text-[11px] text-slate-400 font-bold">{ar ? "بحاجة لمتابعة" : "need follow-up"}</small>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500 block">{ar ? "متوسط الكويز / الواجب" : "Quiz / Assignment Avg"}</span>
                                  <strong className="text-lg font-black text-slate-900 mt-1 block">
                                    {stat?.quizAverage != null ? `${stat.quizAverage}%` : "—"} / {stat?.assignmentAverage != null ? `${stat.assignmentAverage}%` : "—"}
                                  </strong>
                                  <small className="text-[11px] text-slate-400 font-bold">
                                    {ar ? `تسليمات: ${stat?.quizSubmitted ?? 0} كويز · ${stat?.assignmentSubmitted ?? 0} واجب` : `Submitted: ${stat?.quizSubmitted ?? 0} quiz · ${stat?.assignmentSubmitted ?? 0} hw`}
                                  </small>
                                </div>
                              </div>

                              {dash?.lessonStudents?.length ? (
                                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                                  <table className="w-full text-sm border-collapse">
                                    <thead>
                                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs font-black">
                                        <th className="p-3 text-start">{ar ? "الطالب" : "Student"}</th>
                                        <th className="p-3 text-start">{ar ? "حالة الدرس" : "Lesson Status"}</th>
                                        <th className="p-3 text-start">{ar ? "وقت الدراسة" : "Study Time"}</th>
                                        <th className="p-3 text-start">{ar ? "المستوى والدرجة" : "Score & Tier"}</th>
                                        <th className="p-3 text-start">{ar ? "التقييمات داخل الدرس" : "Lesson Assessments"}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {dash.lessonStudents.map((row: any) => (
                                        <tr key={row.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                                          <td className="p-3 font-bold text-slate-900">
                                            <Link href={`/school-admin/follow-up/students/${row.id}`} className="text-indigo-600 hover:underline font-black block">
                                              {row.name}
                                            </Link>
                                            <span className="text-xs text-slate-400">{row.grade || "—"} · {row.classroom?.name || row.username}</span>
                                          </td>
                                          <td className="p-3">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black ${
                                              row.progress?.isCompleted
                                                ? "bg-emerald-50 text-emerald-700"
                                                : row.progress || row.assessments?.length
                                                  ? "bg-indigo-50 text-indigo-700"
                                                  : "bg-amber-50 text-amber-700"
                                            }`}>
                                              {row.progress?.isCompleted
                                                ? (ar ? "أكمل الدرس" : "Completed")
                                                : row.progress || row.assessments?.length
                                                  ? (ar ? "بدأ ولم يكمل" : "In progress")
                                                  : (ar ? "لم يبدأ" : "Not started")}
                                            </span>
                                          </td>
                                          <td className="p-3 font-bold text-slate-700 text-xs">
                                            {Math.round(((row.progress?.activeStudySeconds ?? row.activeStudySeconds) || 0) / 60)} {ar ? "دقيقة" : "min"}
                                          </td>
                                          <td className="p-3 font-black text-slate-800 text-xs">
                                            {row.averageScore != null ? `${row.averageScore}%` : (ar ? "لم يُقيّم" : "Unassessed")}
                                          </td>
                                          <td className="p-3 text-xs">
                                            {row.assessments?.length ? (
                                              <div className="flex flex-wrap gap-1.5">
                                                {row.assessments.map((ass: any) => (
                                                  <span key={ass.kind} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold">
                                                    {ass.kind === "questions" ? (ar ? "كويز" : "Quiz") : ass.kind === "assignments" ? (ar ? "واجب" : "HW") : (ar ? "تدريب" : "Practice")}: {ass.completed ? `${ass.score}%` : `${ass.answered}/${ass.expected}`}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-slate-400 font-bold">{ar ? "لا توجد محاولات بعد" : "No attempts yet"}</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs font-bold text-slate-500 bg-white rounded-xl p-4 border border-slate-100 text-center">
                                  {ar ? "لا يوجد طلاب مسجلون في نطاق هذا الدرس بعد." : "No students recorded in scope for this lesson yet."}
                                </p>
                              )}

                              {dash?.skills?.length > 0 && (
                                <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2.5">
                                  <h5 className="text-xs font-black text-slate-700">{ar ? "إتقان المهارات في هذا الدرس" : "Skills Mastery in this Lesson"}</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {dash.skills.map((skill: any) => {
                                      const total = Math.max(1, skill.correct + skill.incorrect);
                                      const pct = Math.round((skill.correct / total) * 100);
                                      return (
                                        <div key={skill.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                          <div className="flex justify-between text-xs font-black text-slate-800 mb-1.5">
                                            <span>{skill.name}</span>
                                            <span className="text-indigo-600">{pct}%</span>
                                          </div>
                                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                                          </div>
                                          <p className="text-[11px] text-slate-500 font-bold mt-1.5">
                                            {ar ? `صحيح: ${skill.correct} · خطأ: ${skill.incorrect} · عدد الطلاب: ${skill.students}` : `Correct: ${skill.correct} · Incorrect: ${skill.incorrect} · Students: ${skill.students}`}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                          {ar ? "احفظ الكورس أولاً لتفعيل داشبورد متابعة الطلاب لهذا الدرس." : "Save the course first to enable student follow-up analytics for this lesson."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
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

      {lessonToCopy && (
        <CopyLessonModal
          isOpen={isCopyModalOpen}
          onClose={() => {
            setIsCopyModalOpen(false);
            setLessonToCopy(null);
          }}
          lessonId={lessonToCopy.id}
          lessonTitle={lessonToCopy.title}
          onSuccess={() => {
            // Optional: anything else to do after copy?
          }}
        />
      )}
    </div>
  );
};
