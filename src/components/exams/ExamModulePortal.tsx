"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, Download, Edit2, Eye, FileCode, HelpCircle, Plus, Trash2, Upload } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import * as XLSX from "xlsx";
import { buildQuestionExportRows } from "@/lib/examExcelTemplates";
import { buildModuleEditHref, buildSubExamEditorHref, getModulePortalQuestions, getStandaloneQuestions } from "@/lib/examModuleView";
import { collectQuestionsIntoSubExam, getQuestionCollectionTargets } from "@/lib/examQuestionCollection";
import { getCreatedAtLabel, getUpdatedAtLabel } from "@/lib/examModulePresentation";
import HtmlRenderer from "@/components/HtmlRenderer";

export default function ExamModulePortal({ state, moduleId, language, role }: any) {
  const router = useRouter();
  const { showToast } = useNotification();
  const normalizedModuleId = String(moduleId || "");
  const normalizeId = (value: unknown) => String(value ?? "");
  const examModule = (state.modules || []).find((item: any) => String(item.id || "") === normalizedModuleId)
    || (String(state.currentModule?.id || "") === normalizedModuleId ? state.currentModule : null);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [collectingSubExamId, setCollectingSubExamId] = useState<string | null>(null);
  const [selectedTargetExamId, setSelectedTargetExamId] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const moduleEditHref = buildModuleEditHref(role, state.createdIdRef.current || state.createdId || "", normalizedModuleId);

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
  const directQuestions = getModulePortalQuestions(examModule);
  const standaloneQuestions = getStandaloneQuestions(state);
  const collectionTargets = getQuestionCollectionTargets(examModule);
  const questions = directQuestions.length + exams.reduce((total: number, exam: any) => total + (exam.questions?.length || exam.questionsCount || exam._count?.questions || 0), 0);

  const exportExamData = (exam: any) => {
    const exportRows = buildQuestionExportRows(exam.questions || [], language);
    const ws = XLSX.utils.aoa_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    const examTitleSlug = String(exam.title || 'exam').trim().replace(/[\\/:*?"<>|]+/g, '-');
    XLSX.writeFile(wb, `${examTitleSlug}_export.xlsx`);
    showToast(language === "ar" ? "تم تصدير بيانات الاختبار" : "Exam data exported successfully", "success");
  };

  const exportExamJson = async (subExamId: string) => {
    try {
      const res = await fetch(`${API_URL}/exams/${state.createdIdRef.current}/modules/${moduleId}/exams/${subExamId}/export-json`, {
        headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` },
      });
      if (!res.ok) throw new Error("export json failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `module_exam_${subExamId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast(language === "ar" ? "تم تصدير نسخة JSON للاختبار" : "Exam JSON exported successfully", "success");
    } catch (error) {
      console.warn("Question collection request failed:", error);
      showToast(language === "ar" ? "تعذر تصدير نسخة JSON" : "Failed to export exam JSON", "error");
    }
  };

  const importExamJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("exportData", await file.text());

      const res = await fetch(`${API_URL}/exams/${state.createdIdRef.current}/modules/${moduleId}/exams/import-json`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` },
        body: formData,
      });
      if (!res.ok) throw new Error("import json failed");
      const created = await res.json();
      state.setModules((currentModules: any[]) => currentModules.map((currentModule: any) =>
        currentModule.id === moduleId
          ? { ...currentModule, subExams: [...(currentModule.subExams || []), created] }
          : currentModule,
      ));
      if (String(state.currentModule?.id || "") === String(moduleId)) {
        state.setCurrentModule((currentModule: any) => ({
          ...currentModule,
          subExams: [...(currentModule.subExams || []), created],
        }));
      }
      showToast(language === "ar" ? "تمت استعادة الاختبار داخل هذا الموديول" : "Exam restored into this module", "success");
    } catch (error) {
      console.error(error);
      showToast(language === "ar" ? "تعذر استعادة الاختبار من JSON" : "Failed to restore exam JSON", "error");
    } finally {
      event.target.value = "";
    }
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

  const collectQuestions = async (subExamId: string) => {
    const sourceCount = directQuestions.length + standaloneQuestions.length;
    if (sourceCount === 0) return;

    const parentExamId = state.createdIdRef.current || state.createdId;
    if (!parentExamId) {
      showToast(language === "ar" ? "تعذر تحديد التقييم. حدّث الصفحة ثم حاول مرة أخرى." : "The assessment could not be identified. Refresh and try again.", "error");
      return;
    }

    setCollectingSubExamId(subExamId);
    try {
      const res = await fetch(`${API_URL}/exams/${parentExamId}/modules/${moduleId}/exams/${subExamId}/collect-questions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `collect questions failed (${res.status})`);
      }

      const result = collectQuestionsIntoSubExam({
        module: examModule,
        subExamId,
        standaloneQuestions,
      });
      state.setModules((currentModules: any[]) => currentModules.map((currentModule: any) =>
        normalizeId(currentModule.id) === normalizedModuleId ? result.module : currentModule,
      ));
      if (normalizeId(state.currentModule?.id) === normalizedModuleId) {
        state.setCurrentModule(result.module);
      }
      state.setStandaloneQuestions(result.standaloneQuestions);
      showToast(
        language === "ar"
          ? `تمت إضافة ${result.movedQuestionIds.length} سؤال إلى الاختبار`
          : `${result.movedQuestionIds.length} questions added to the exam`,
        "success",
      );
    } catch (error) {
      console.error(error);
      const reason = error instanceof Error ? error.message : "";
      showToast(
        language === "ar" ? `تعذر جمع الأسئلة داخل الاختبار${reason ? `: ${reason}` : ""}` : `Failed to collect questions into the exam${reason ? `: ${reason}` : ""}`,
        "error",
      );
    } finally {
      setCollectingSubExamId(null);
    }
  };

  return <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500">←</button>
        <div><div className="text-xs font-black text-indigo-600 uppercase tracking-widest">{language === "ar" ? "بوابة Module الاختبارات" : "Exam Module Portal"}</div><h1 className="text-3xl font-black text-slate-900 mt-1">{examModule.title}</h1><p className="text-slate-400 font-bold mt-1">{examModule.description || (language === "ar" ? "أنشئ الاختبارات داخل هذا الموديول فقط" : "Create exams inside this module only")}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-black text-slate-400"><span>{getCreatedAtLabel(examModule.createdAt, language)}</span><span>{getUpdatedAtLabel(examModule.updatedAt, language)}</span></div></div>
      </div>
      {moduleEditHref && <Link href={moduleEditHref} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-all hover:border-indigo-200 hover:text-indigo-600">
        <Edit2 className="w-4 h-4" />
        {language === "ar" ? "إعدادات الموديول" : "Module Settings"}
      </Link>}
    </div>

    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <input ref={jsonInputRef} type="file" accept=".json,application/json" onChange={importExamJson} className="hidden" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"><div><h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "الاختبارات" : "Exams"}</h2><p className="text-slate-400 font-bold mt-1">{exams.length} {language === "ar" ? "اختبارات" : "exams"} · {questions} {language === "ar" ? "سؤال" : "questions"}</p></div><div className="flex flex-wrap gap-2 w-full md:w-auto">{role === "SUPER_ADMIN" && <button onClick={() => jsonInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition-all hover:bg-emerald-100"><Upload className="w-4 h-4" />{language === "ar" ? "استعادة JSON" : "Restore JSON"}</button>}<input ref={titleInputRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") createExam(); }} placeholder={language === "ar" ? "اسم الاختبار الجديد" : "New exam name"} className="min-w-0 flex-1 md:w-56 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-indigo-500" /><button disabled={creating} onClick={createExam} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-black disabled:opacity-50"><Plus className="w-5 h-5" />{language === "ar" ? "إنشاء اختبار" : "Create Exam"}</button></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exams.map((exam: any, index: number) => {
          const editHref = buildSubExamEditorHref(
            role,
            state.createdIdRef.current || state.createdId || "",
            normalizedModuleId,
            exam.id,
          );
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
                  <button onClick={() => exportExamJson(exam.id)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-emerald-600 flex items-center justify-center">
                    <FileCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (editHref) {
                        router.push(editHref);
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-indigo-600 flex items-center justify-center"
                  >
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

              {(directQuestions.length > 0 || standaloneQuestions.length > 0) && (
                <button
                  type="button"
                  onClick={() => collectQuestions(exam.id)}
                  disabled={collectingSubExamId !== null}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  <HelpCircle className="h-4 w-4" />
                  {collectingSubExamId === exam.id
                    ? (language === "ar" ? "جارٍ إضافة الأسئلة..." : "Adding questions...")
                    : (language === "ar" ? "إضافة كل أسئلة الموديول" : "Add all module questions")}
                </button>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  {getCreatedAtLabel(exam.createdAt, language)}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {getUpdatedAtLabel(exam.updatedAt, language)}
                </div>
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

    {directQuestions.length > 0 && <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "أسئلة الموديول" : "Module Questions"}</h2>
        <p className="mt-1 text-slate-400 font-bold">{directQuestions.length} {language === "ar" ? "سؤال محفوظ مباشرة داخل الموديول" : "questions saved directly in this module"}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {directQuestions.map((question: any, index: number) => (
          <div key={question.id || index} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black text-indigo-600">
              <HelpCircle className="h-4 w-4" />
              {language === "ar" ? `سؤال ${index + 1}` : `Question ${index + 1}`}
            </div>
            <HtmlRenderer html={question.text || ""} className="font-bold text-slate-800" />
          </div>
        ))}
      </div>
    </div>}

    {standaloneQuestions.length > 0 && <div className="rounded-[36px] border border-amber-200 bg-amber-50/50 shadow-sm p-7">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "أسئلة منفردة غير مسندة" : "Unassigned Standalone Questions"}</h2>
        <p className="mt-1 text-amber-700 font-bold">
          {language === "ar"
            ? `${standaloneQuestions.length} سؤال منفرد جاهز للإضافة إلى اختبار.`
            : `${standaloneQuestions.length} standalone questions are ready to add to an exam.`}
        </p>
      </div>
      {collectionTargets.length > 0 ? (
        <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-amber-200 bg-white p-4 md:flex-row md:items-center">
          <select
            value={selectedTargetExamId}
            onChange={(event) => setSelectedTargetExamId(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-amber-500"
          >
            <option value="">{language === "ar" ? "اختر الاختبار المستهدف" : "Choose the target exam"}</option>
            {collectionTargets.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
          </select>
          <button
            type="button"
            onClick={() => collectQuestions(selectedTargetExamId)}
            disabled={!selectedTargetExamId || collectingSubExamId !== null}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HelpCircle className="h-5 w-5" />
            {collectingSubExamId
              ? (language === "ar" ? "جارٍ تجميع الأسئلة..." : "Collecting questions...")
              : (language === "ar" ? "تجميع الأسئلة في الاختبار" : "Collect questions into exam")}
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-amber-300 bg-white p-4 font-bold text-amber-800">
          {language === "ar" ? "أنشئ اختبارًا داخل هذا الموديول أولًا، ثم اختره لتجميع الأسئلة." : "Create an exam inside this module first, then choose it to collect the questions."}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standaloneQuestions.map((question: any, index: number) => (
          <div key={question.id || index} className="rounded-3xl border border-amber-100 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black text-amber-700">
              <HelpCircle className="h-4 w-4" />
              {language === "ar" ? `سؤال منفرد ${index + 1}` : `Standalone Question ${index + 1}`}
            </div>
            <HtmlRenderer html={question.text || ""} className="font-bold text-slate-800" />
          </div>
        ))}
      </div>
    </div>}
  </div>;
}
