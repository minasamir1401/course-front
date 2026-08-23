"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, Download, Edit2, Eye, HelpCircle, Plus, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import * as XLSX from "xlsx";
import { buildQuestionExportRows } from "@/lib/examExcelTemplates";

export default function ExamModulePortal({ state, moduleId, language, role }: any) {
  const router = useRouter();
  const { showToast } = useNotification();
  const normalizedModuleId = String(moduleId || "");
  const normalizeId = (value: unknown) => String(value ?? "");
  const examModule = (state.modules || []).find((item: any) => String(item.id || "") === normalizedModuleId)
    || (String(state.currentModule?.id || "") === normalizedModuleId ? state.currentModule : null);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const baseEditHref = `${role === "SCHOOL_ADMIN" ? "/school-admin" : "/super-admin"}/exams/edit/${encodeURIComponent(state.createdIdRef.current || state.createdId || "")}`;

  if (state.isInitialLoad || state.isLoading) {
    return (
      <div className="rounded-[32px] bg-white p-12 text-center font-black text-slate-500">
        {language === "ar" ? "جارٍ تحميل بيانات الموديول..." : "Loading module data..."}
      </div>
    );
  }

  if (!examModule) {
    return (
      <div className="rounded-[32px] bg-white p-12 text-center font-black text-slate-500">
        {language === "ar" ? "الموديول غير موجود أو لم يتم تحميله" : "Module not found or failed to load"}
      </div>
    );
  }

  const tokenKey = role === "SCHOOL_ADMIN" ? "school_admin_token" : "super_admin_token";
  const exams = examModule.subExams || [];
  const questions = exams.reduce((total: number, exam: any) => total + (exam.questions?.length || exam.questionsCount || exam._count?.questions || 0), 0);

  const exportExamData = (exam: any) => {
    const exportRows = buildQuestionExportRows(exam.questions || [], language);
    const ws = XLSX.utils.aoa_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    const examTitleSlug = String(exam.title || 'exam').trim().replace(/[\\/:*?"<>|]+/g, '-');
    XLSX.writeFile(wb, `${examTitleSlug}_export.xlsx`);
    showToast(language === "ar" ? "تم تصدير بيانات الاختبار" : "Exam data exported successfully", "success");
  };

  const createExam = async () => {
    if (!title.trim()) {
      showToast(language === "ar" ? "اكتب اسم الاختبار أولًا" : "Enter the exam name first", "error");
      titleInputRef.current?.focus();
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/exams/${state.createdIdRef.current}/modules/${moduleId}/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` },
        body: JSON.stringify({ title: title.trim() })
      });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      state.setModules((currentModules: any[]) => currentModules.map((currentModule: any) =>
        currentModule.id === moduleId
          ? { ...currentModule, subExams: [...(currentModule.subExams || []), created] }
          : currentModule,
      ));
      setTitle("");
      showToast(language === "ar" ? "تم إنشاء الاختبار" : "Exam created successfully", "success");
    } catch (error) {
      console.error(error);
      showToast(language === "ar" ? "تعذر إنشاء الاختبار" : "Failed to create exam", "error");
    } finally {
      setCreating(false);
    }
  };

  const deleteExam = async (subExamId: string) => {
    const confirmed = window.confirm(language === "ar" ? "هل تريد حذف هذا الاختبار؟" : "Delete this exam?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/exams/${state.createdIdRef.current}/modules/${moduleId}/exams/${subExamId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` },
      });
      if (!res.ok) throw new Error("delete failed");

      const normalizedSubExamId = normalizeId(subExamId);
      state.setModules((currentModules: any[]) =>
        currentModules.map((currentModule: any) =>
          normalizeId(currentModule.id) === normalizedModuleId
            ? {
                ...currentModule,
                subExams: (currentModule.subExams || []).filter(
                  (subExam: any) => normalizeId(subExam.id) !== normalizedSubExamId,
                ),
              }
            : currentModule,
        ),
      );
      if (normalizeId(state.currentModule?.id) === normalizedModuleId) {
        state.setCurrentModule((currentModule: any) => ({
          ...currentModule,
          subExams: (currentModule.subExams || []).filter(
            (subExam: any) => normalizeId(subExam.id) !== normalizedSubExamId,
          ),
        }));
      }

      showToast(language === "ar" ? "تم حذف الاختبار" : "Exam deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showToast(language === "ar" ? "تعذر حذف الاختبار" : "Failed to delete exam", "error");
    }
  };

  return <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500">←</button>
        <div><div className="text-xs font-black text-indigo-600 uppercase tracking-widest">{language === "ar" ? "بوابة Module الاختبارات" : "Exam Module Portal"}</div><h1 className="text-3xl font-black text-slate-900 mt-1">{examModule.title}</h1><p className="text-slate-400 font-bold mt-1">{examModule.description || (language === "ar" ? "أنشئ الاختبارات داخل هذا الموديول فقط" : "Create exams inside this module only")}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`${baseEditHref}?createModule=1`}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          {language === "ar" ? "إضافة موديول" : "Add Module"}
        </Link>
      </div>
    </div>

    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"><div><h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "الاختبارات" : "Exams"}</h2><p className="text-slate-400 font-bold mt-1">{exams.length} {language === "ar" ? "اختبارات" : "exams"} · {questions} {language === "ar" ? "سؤال" : "questions"}</p></div><div className="flex gap-2 w-full md:w-auto"><input ref={titleInputRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") createExam(); }} placeholder={language === "ar" ? "اسم الاختبار الجديد" : "New exam name"} className="min-w-0 flex-1 md:w-56 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-indigo-500" /><button disabled={creating} onClick={createExam} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-black disabled:opacity-50"><Plus className="w-5 h-5" />{language === "ar" ? "إنشاء اختبار" : "Create Exam"}</button></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exams.map((exam: any, index: number) => {
          const editHref = `${role === "SCHOOL_ADMIN" ? "/school-admin" : "/super-admin"}/exams/edit/${state.createdIdRef.current}?moduleId=${encodeURIComponent(moduleId)}&subExamId=${encodeURIComponent(exam.id)}`;
          const previewHref = `/exams/${state.createdIdRef.current}?preview=true&subExamId=${encodeURIComponent(exam.id)}`;
          const questionCount = exam.questions?.length || exam.questionsCount || exam._count?.questions || 0;
          const examTitle = exam.title || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam");

          return (
            <div key={exam.id || index} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <Link href={previewHref} target="_blank" className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-emerald-600 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button onClick={() => exportExamData(exam)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-sky-600 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => router.push(editHref)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-indigo-600 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteExam(exam.id)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-red-600 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-900 truncate">{examTitle}</h3>

              <div className="mt-3 flex items-center gap-2 text-xs font-black text-slate-400">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                {questionCount} {language === "ar" ? "سؤال" : "questions"}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {exam.publishDate
                    ? `${language === "ar" ? "نشر" : "Publish"}: ${new Date(exam.publishDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}`
                    : (language === "ar" ? "بدون تاريخ نشر" : "No publish date")}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  {exam.cutOffDate
                    ? `${language === "ar" ? "إغلاق" : "Cut-off"}: ${new Date(exam.cutOffDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}`
                    : (language === "ar" ? "بدون تاريخ إغلاق" : "No cut-off date")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {exams.length === 0 && <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400 font-black">{language === "ar" ? "لا توجد اختبارات بعد. أنشئ أول اختبار من هنا." : "No exams yet. Create the first exam here."}</div>}
    </div>
  </div>;
}
