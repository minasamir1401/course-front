"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { collectQuestionsIntoSubExam, getQuestionCollectionTargets } from "@/lib/examQuestionCollection";

export default function ModuleQuestionCollectionAction({ module, modules, setModules, currentModule, setCurrentModule, createdIdRef, createdId, language, role }: any) {
  const { showToast } = useNotification();
  const [selectedSubExamId, setSelectedSubExamId] = useState("");
  const [isCollecting, setIsCollecting] = useState(false);
  const directQuestions = Array.isArray(module.questions) ? module.questions : [];
  const targets = getQuestionCollectionTargets(module);

  if (directQuestions.length === 0) return null;

  const collectQuestions = async () => {
    if (!selectedSubExamId) return;
    const parentExamId = createdIdRef?.current || createdId;
    if (!parentExamId) {
      showToast(language === "ar" ? "احفظ التقييم أولًا قبل تجميع الأسئلة" : "Save the assessment before collecting questions", "error");
      return;
    }

    setIsCollecting(true);
    try {
      const tokenKey = role === "SCHOOL_ADMIN" ? "school_admin_token" : "super_admin_token";
      const response = await fetch(
        `${API_URL}/exams/${parentExamId}/modules/${module.id}/exams/${selectedSubExamId}/collect-questions`,
        { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` } },
      );
      if (!response.ok) throw new Error("collect questions failed");

      const result = collectQuestionsIntoSubExam({ module, subExamId: selectedSubExamId });
      setModules((currentModules: any[]) => currentModules.map((currentModule: any) =>
        String(currentModule.id) === String(module.id) ? result.module : currentModule,
      ));
      if (String(currentModule?.id) === String(module.id)) setCurrentModule(result.module);
      setSelectedSubExamId("");
      showToast(
        language === "ar"
          ? `تمت إضافة ${result.movedQuestionIds.length} سؤال من هذا الموديول إلى الاختبار`
          : `${result.movedQuestionIds.length} questions from this module were added to the exam`,
        "success",
      );
    } catch (error) {
      console.warn("Module question collection request failed:", error);
      showToast(language === "ar" ? "تعذر جمع أسئلة هذا الموديول" : "Failed to collect this module's questions", "error");
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:flex-row" onClick={(event) => event.stopPropagation()}>
      <select value={selectedSubExamId} onChange={(event) => setSelectedSubExamId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-amber-500">
        <option value="">{language === "ar" ? "اختر اختبارًا من هذا الموديول" : "Choose an exam in this module"}</option>
        {targets.map((target) => <option key={target.id} value={target.id}>{target.title}</option>)}
      </select>
      <button type="button" onClick={collectQuestions} disabled={!selectedSubExamId || isCollecting || targets.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
        <HelpCircle className="h-4 w-4" />
        {isCollecting ? (language === "ar" ? "جارٍ التجميع..." : "Collecting...") : (language === "ar" ? "تجميع أسئلة هذا الموديول" : "Collect module questions")}
      </button>
    </div>
  );
}
