"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { collectQuestionsIntoSubExam } from "@/lib/examQuestionCollection";

export default function StandaloneQuestionsToNewExam({ state, language, role }: any) {
  const { showToast } = useNotification();
  const [moduleId, setModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const questions = Array.isArray(state.standaloneQuestions) ? state.standaloneQuestions : [];

  if (questions.length === 0) return null;

  const createAndMove = async () => {
    if (!moduleId || !title.trim()) {
      showToast(language === "ar" ? "اختر الموديول واكتب اسم الاختبار أولًا" : "Choose a module and enter the exam name first", "error");
      return;
    }
    const parentExamId = state.createdIdRef?.current || state.createdId;
    if (!parentExamId) {
      showToast(language === "ar" ? "احفظ التقييم أولًا ثم أعد المحاولة" : "Save the assessment before trying again", "error");
      return;
    }

    setIsCreating(true);
    try {
      const tokenKey = role === "SCHOOL_ADMIN" ? "school_admin_token" : "super_admin_token";
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` };
      const createdResponse = await fetch(`${API_URL}/exams/${parentExamId}/modules/${moduleId}/exams`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!createdResponse.ok) {
        const payload = await createdResponse.json().catch(() => null);
        throw new Error(payload?.error || "could not create exam");
      }
      const createdExam = await createdResponse.json();

      const movedResponse = await fetch(`${API_URL}/exams/${parentExamId}/modules/${moduleId}/exams/${createdExam.id}/collect-questions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ includeStandalone: true, includeModuleQuestions: false }),
      });
      if (!movedResponse.ok) {
        const payload = await movedResponse.json().catch(() => null);
        throw new Error(payload?.error || "could not move questions");
      }

      const targetModule = (state.modules || []).find((module: any) => String(module.id) === String(moduleId));
      if (!targetModule) throw new Error("target module not found");
      const moduleWithCreatedExam = { ...targetModule, subExams: [...(targetModule.subExams || []), createdExam] };
      const result = collectQuestionsIntoSubExam({
        module: moduleWithCreatedExam,
        subExamId: createdExam.id,
        standaloneQuestions: questions,
      });
      state.setModules((modules: any[]) => modules.map((module: any) => String(module.id) === String(moduleId) ? result.module : module));
      if (String(state.currentModule?.id) === String(moduleId)) state.setCurrentModule(result.module);
      state.setStandaloneQuestions([]);
      setTitle("");
      showToast(language === "ar" ? `تم إنشاء الاختبار ونقل ${questions.length} سؤال إليه` : `Exam created and ${questions.length} questions moved`, "success");
    } catch (error) {
      console.warn("Standalone question collection request failed:", error);
      showToast(language === "ar" ? `تعذر إنشاء الاختبار أو نقل الأسئلة: ${error instanceof Error ? error.message : ""}` : "Could not create the exam or move the questions", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm" dir={language === "ar" ? "rtl" : "ltr"}>
      <h2 className="text-lg font-black text-amber-950">{language === "ar" ? "تجميع الأسئلة المنفردة في اختبار جديد" : "Collect standalone questions into a new exam"}</h2>
      <p className="mt-1 font-bold text-amber-800">{language === "ar" ? `${questions.length} سؤالًا سيتم نقلها كلها إلى الاختبار الجديد.` : `All ${questions.length} questions will be moved to the new exam.`}</p>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row">
        <select value={moduleId} onChange={(event) => setModuleId(event.target.value)} className="rounded-2xl border border-amber-200 bg-white px-4 py-3 font-bold outline-none focus:border-amber-500">
          <option value="">{language === "ar" ? "اختر الموديول" : "Choose module"}</option>
          {(state.modules || []).map((module: any) => <option key={module.id} value={module.id}>{module.title || (language === "ar" ? "موديول بدون عنوان" : "Untitled module")}</option>)}
        </select>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={language === "ar" ? "اسم الاختبار الجديد" : "New exam name"} className="min-w-0 flex-1 rounded-2xl border border-amber-200 bg-white px-4 py-3 font-bold outline-none focus:border-amber-500" />
        <button type="button" onClick={createAndMove} disabled={isCreating || !moduleId || !title.trim()} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-amber-500 px-5 py-3 font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
          <FolderPlus className="h-5 w-5" />
          {isCreating ? (language === "ar" ? "جارٍ الإنشاء والنقل..." : "Creating and moving...") : (language === "ar" ? "إنشاء اختبار ونقل الأسئلة" : "Create exam and move questions")}
        </button>
      </div>
    </section>
  );
}
