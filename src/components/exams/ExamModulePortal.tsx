"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, Download, Edit2, Eye, FileCode, HelpCircle, Plus, Trash2, Upload, ArrowRightLeft, FolderInput, X, Loader2, FolderTree, Layers, ArrowUpRight, Settings, CheckCircle2, AlertCircle, Clock, Target } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import * as XLSX from "xlsx";
import { buildQuestionWorkbook } from "@/lib/questionExcelWorkbook";
import { buildModuleEditHref, buildSubExamEditorHref, buildModulePortalHref, getModulePortalQuestions, getStandaloneQuestions } from "@/lib/examModuleView";
import { collectQuestionsIntoSubExam, getQuestionCollectionTargets } from "@/lib/examQuestionCollection";
import { getCreatedAtLabel, getUpdatedAtLabel } from "@/lib/examModulePresentation";
import HtmlRenderer from "@/components/HtmlRenderer";
import MoveModuleModal from "@/components/exams/MoveModuleModal";
import FileUpload from "@/components/FileUpload";

const SETTINGS_CATEGORIES = [
  "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
  "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
  "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
  "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
  "SAT Math", "SAT English"
];

const SETTINGS_STAGES = [
  {
    stage: "Elementary",
    titleAr: "المرحلة الابتدائية (Primary)",
    titleEn: "Elementary School (Primary)",
    grades: [
      "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
      "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"
    ]
  },
  {
    stage: "Middle School",
    titleAr: "المرحلة الإعدادية (Prep)",
    titleEn: "Middle School (Prep)",
    grades: [
      "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"
    ]
  },
  {
    stage: "High School",
    titleAr: "المرحلة الثانوية (Secondary)",
    titleEn: "High School (Secondary)",
    grades: [
      "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
    ]
  }
];

const SETTINGS_GRADE_NAMES: { [key: string]: { ar: string; en: string } } = {
  "الصف الأول الابتدائي": { ar: "الأول الابتدائي", en: "1st Primary" },
  "الصف الثاني الابتدائي": { ar: "الثاني الابتدائي", en: "2nd Primary" },
  "الصف الثالث الابتدائي": { ar: "الثالث الابتدائي", en: "3rd Primary" },
  "الصف الرابع الابتدائي": { ar: "الرابع الابتدائي", en: "4th Primary" },
  "الصف الخامس الابتدائي": { ar: "الخامس الابتدائي", en: "5th Primary" },
  "الصف السادس الابتدائي": { ar: "السادس الابتدائي", en: "6th Primary" },
  "الصف الأول الإعدادي": { ar: "الأول الإعدادي", en: "1st Prep" },
  "الصف الثاني الإعدادي": { ar: "الثاني الإعدادي", en: "2nd Prep" },
  "الصف الثالث الإعدادي": { ar: "الثالث الإعدادي", en: "3rd Prep" },
  "الصف الأول الثانوي": { ar: "الأول الثانوي", en: "1st Secondary" },
  "الصف الثاني الثانوي": { ar: "الثاني الثانوي", en: "2nd Secondary" },
  "الصف الثالث الثانوي": { ar: "الثالث الثانوي", en: "3rd Secondary" }
};

const SETTINGS_SUBJECT_NAMES: { [key: string]: string } = {
  "اللغة العربية": "Arabic",
  "اللغة الإنجليزية": "English",
  "اللغة الفرنسية": "French",
  "اللغة الألمانية": "German",
  "اللغة الإيطالية": "Italian",
  "الرياضيات": "Mathematics",
  "الفيزياء": "Physics",
  "الكيمياء": "Chemistry",
  "الأحياء": "Biology",
  "الجيولوجيا": "Geology",
  "الميكانيكا": "Mechanics",
  "التاريخ": "History",
  "الجغرافيا": "Geography",
  "الفلسفة": "Philosophy",
  "علم النفس": "Psychology",
  "الاقتصاد": "Economics",
  "الإحصاء": "Statistics",
  "التربية الدينية": "Religious Education",
  "التربية الوطنية": "National Education",
  "الحاسب الآلي": "Computer Science",
  "SAT Math": "SAT Math",
  "SAT English": "SAT English"
};

const getGradeName = (grade: string, lang: string = "ar") => {
  if (SETTINGS_GRADE_NAMES[grade]) {
    return lang === "ar" ? SETTINGS_GRADE_NAMES[grade].ar : SETTINGS_GRADE_NAMES[grade].en;
  }
  return grade;
};

const getSubjectName = (cat: string, lang: string = "ar") => {
  if (SETTINGS_SUBJECT_NAMES[cat]) {
    return lang === "ar" ? cat : SETTINGS_SUBJECT_NAMES[cat];
  }
  return cat;
};

export default function ExamModulePortal({ state, moduleId, language, role }: any) {
  const router = useRouter();
  const { showToast } = useNotification();
  const normalizedModuleId = String(moduleId || "");
  const normalizeId = (value: unknown) => String(value ?? "");

  const findModuleRecursive = (mods: any[], id: string): any => {
    for (const m of mods || []) {
      if (String(m.id || "") === id) return m;
      if (Array.isArray(m.subModules) && m.subModules.length > 0) {
        const found = findModuleRecursive(m.subModules, id);
        if (found) return found;
      }
    }
    return null;
  };

  const examModule = findModuleRecursive(state.modules || [], normalizedModuleId)
    || (String(state.currentModule?.id || "") === normalizedModuleId ? state.currentModule : null);

  const findParentModule = (mods: any[], childId: string): any => {
    for (const m of mods || []) {
      if (Array.isArray(m.subModules)) {
        if (m.subModules.some((sm: any) => String(sm.id || "") === childId)) {
          return m;
        }
        const deep = findParentModule(m.subModules, childId);
        if (deep) return deep;
      }
    }
    return null;
  };
  const parentModule = findParentModule(state.modules || [], normalizedModuleId) || examModule?.parentModule || null;

  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [collectingSubExamId, setCollectingSubExamId] = useState<string | null>(null);
  const [selectedTargetExamId, setSelectedTargetExamId] = useState("");
  const [movingSubExam, setMovingSubExam] = useState<any | null>(null);
  const [moveMode, setMoveMode] = useState<"existing" | "new">("existing");
  const [targetMoveModuleId, setTargetMoveModuleId] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isMovingSubExam, setIsMovingSubExam] = useState(false);
  const [destinationModules, setDestinationModules] = useState<any[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [allExamsList, setAllExamsList] = useState<any[]>([]);
  const [targetExamIdForNew, setTargetExamIdForNew] = useState("");
  const [isMoveAllModalOpen, setIsMoveAllModalOpen] = useState(false);
  const [isMovingAllSubExams, setIsMovingAllSubExams] = useState(false);

  // Sub-modules state and module move modal
  const [subModuleTitle, setSubModuleTitle] = useState("");
  const [creatingSubModule, setCreatingSubModule] = useState(false);
  const [subModuleToMove, setSubModuleToMove] = useState<any>(null);
  const [isMoveCurrentModuleModalOpen, setIsMoveCurrentModuleModalOpen] = useState(false);

  // Full Module Settings Modal state
  const [isModuleSettingsOpen, setIsModuleSettingsOpen] = useState(false);
  const [moduleSettingsTitle, setModuleSettingsTitle] = useState("");
  const [moduleSettingsDescription, setModuleSettingsDescription] = useState("");
  const [moduleSettingsCoverImage, setModuleSettingsCoverImage] = useState("");
  const [moduleSettingsGrades, setModuleSettingsGrades] = useState<string[]>([]);
  const [moduleSettingsSubjects, setModuleSettingsSubjects] = useState<string[]>([]);
  const [moduleSettingsIsCentral, setModuleSettingsIsCentral] = useState(true);
  const [moduleSettingsSchoolIds, setModuleSettingsSchoolIds] = useState<string[]>([]);
  const [moduleSettingsDuration, setModuleSettingsDuration] = useState<string | number>("");
  const [moduleSettingsPassingScore, setModuleSettingsPassingScore] = useState<string | number>("");
  const [moduleSettingsAttempts, setModuleSettingsAttempts] = useState<string | number>("");
  const [moduleSettingsPassword, setModuleSettingsPassword] = useState("");
  const [moduleSettingsStartDate, setModuleSettingsStartDate] = useState("");
  const [moduleSettingsEndDate, setModuleSettingsEndDate] = useState("");
  const [moduleSettingsResultVisibility, setModuleSettingsResultVisibility] = useState("SHOW_SCORE");
  const [isSavingModuleSettings, setIsSavingModuleSettings] = useState(false);

  const toggleSettingsGrade = (grade: string) => {
    if (moduleSettingsGrades.includes(grade)) {
      setModuleSettingsGrades(moduleSettingsGrades.filter((g) => g !== grade));
    } else {
      setModuleSettingsGrades([...moduleSettingsGrades, grade]);
    }
  };

  const toggleSettingsSubject = (cat: string) => {
    if (moduleSettingsSubjects.includes(cat)) {
      setModuleSettingsSubjects(moduleSettingsSubjects.filter((c) => c !== cat));
    } else {
      setModuleSettingsSubjects([...moduleSettingsSubjects, cat]);
    }
  };

  const toggleSettingsSchool = (sId: string) => {
    if (moduleSettingsSchoolIds.includes(sId)) {
      setModuleSettingsSchoolIds(moduleSettingsSchoolIds.filter((s) => s !== sId));
    } else {
      setModuleSettingsSchoolIds([...moduleSettingsSchoolIds, sId]);
    }
  };

  const selectAllSettingsSchools = () => {
    const currentSchools = state.schools || [];
    if (moduleSettingsSchoolIds.length === currentSchools.length) {
      setModuleSettingsSchoolIds([]);
    } else {
      setModuleSettingsSchoolIds(currentSchools.map((s: any) => s.id));
    }
  };

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
    if (state.isLoadingQuestions) {
      showToast(language === "ar" ? "جارٍ استكمال تحميل الأسئلة في الخلفية، يرجى المحاولة بعد قليل..." : "Questions are still loading in the background, please try shortly...", "info");
      return;
    }
    let wb: XLSX.WorkBook;
    try { wb = buildQuestionWorkbook(exam.questions || [], language); }
    catch (error) {
      showToast(error instanceof Error ? error.message : String(error), 'error');
      return;
    }
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

  const createSubModule = async () => {
    if (!subModuleTitle.trim()) {
      showToast(language === "ar" ? "اكتب اسم الموديول الفرعي أولًا" : "Enter sub-module name first", "error");
      return;
    }
    setCreatingSubModule(true);
    try {
      const parentExamId = state.createdIdRef.current || state.createdId;
      const res = await fetch(`${API_URL}/exams/${parentExamId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` },
        body: JSON.stringify({ title: subModuleTitle.trim(), parentModuleId: examModule.id })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create sub-module");
      }
      const created = await res.json();

      state.setModules((prev: any[]) => {
        const updateRecursive = (list: any[]): any[] => list.map((m: any) => {
          if (String(m.id) === String(examModule.id)) {
            return { ...m, subModules: [...(m.subModules || []), created] };
          }
          if (Array.isArray(m.subModules)) {
            return { ...m, subModules: updateRecursive(m.subModules) };
          }
          return m;
        });
        return updateRecursive(prev);
      });

      if (String(state.currentModule?.id || "") === String(examModule.id)) {
        state.setCurrentModule((prev: any) => ({
          ...prev,
          subModules: [...(prev.subModules || []), created]
        }));
      }

      setSubModuleTitle("");
      showToast(language === "ar" ? "تم إنشاء الموديول الفرعي بنجاح" : "Sub-module created successfully", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.message || (language === "ar" ? "تعذر إنشاء الموديول الفرعي" : "Failed to create sub-module"), "error");
    } finally {
      setCreatingSubModule(false);
    }
  };

  const deleteSubModule = async (subModId: string) => {
    const confirmed = window.confirm(language === "ar" ? "هل تريد حذف هذا الموديول الفرعي بكل ما يحتويه؟" : "Delete this sub-module and all its contents?");
    if (!confirmed) return;

    try {
      const parentExamId = state.createdIdRef.current || state.createdId;
      const res = await fetch(`${API_URL}/exams/${parentExamId}/modules/${subModId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` },
      });
      if (!res.ok) throw new Error("Delete failed");

      state.setModules((prev: any[]) => {
        const removeRecursive = (list: any[]): any[] => list.map((m: any) => {
          if (Array.isArray(m.subModules)) {
            return {
              ...m,
              subModules: removeRecursive(m.subModules.filter((sm: any) => String(sm.id) !== String(subModId)))
            };
          }
          return m;
        });
        return removeRecursive(prev);
      });

      if (String(state.currentModule?.id || "") === String(examModule.id)) {
        state.setCurrentModule((prev: any) => ({
          ...prev,
          subModules: (prev.subModules || []).filter((sm: any) => String(sm.id) !== String(subModId))
        }));
      }

      showToast(language === "ar" ? "تم حذف الموديول الفرعي" : "Sub-module deleted successfully", "success");
    } catch (e) {
      showToast(language === "ar" ? "تعذر حذف الموديول الفرعي" : "Failed to delete sub-module", "error");
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
    if (state.isLoadingQuestions) {
      showToast(language === "ar" ? "جارٍ استكمال تحميل الأسئلة في الخلفية، يرجى المحاولة بعد قليل..." : "Questions are still loading in the background, please try shortly...", "info");
      return;
    }
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

  const getAuthToken = () => {
    return (
      localStorage.getItem(tokenKey) ||
      localStorage.getItem("super_admin_token") ||
      localStorage.getItem("school_admin_token") ||
      ""
    );
  };

  const fetchAvailableDestinations = async (currentExamId: string) => {
    setIsLoadingDestinations(true);
    try {
      const res = await fetch(`${API_URL}/exams`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const examsList: any[] = Array.isArray(data) ? data : (data.exams || data.data || []);
        setAllExamsList(examsList);

        const currentExamApi = examsList.find((e: any) => normalizeId(e.id) === normalizeId(currentExamId));
        const currentExamTitle = state.examData?.title || currentExamApi?.title || (language === "ar" ? "الاختبار الحالي" : "Current Exam");

        const collected: any[] = [];

        // 1. Current exam's other modules (prefer state.modules if available)
        const currentModules = (state.modules && state.modules.length > 0) ? state.modules : (currentExamApi?.modules || []);
        currentModules.forEach((m: any) => {
          if (normalizeId(m.id) !== normalizedModuleId) {
            collected.push({
              id: normalizeId(m.id),
              title: m.title || (language === "ar" ? "موديول بدون عنوان" : "Untitled Module"),
              examId: normalizeId(currentExamId),
              examTitle: currentExamTitle,
              isCurrentExam: true,
            });
          }
        });

        // 2. Modules from all other accessible exams
        examsList.forEach((exam: any) => {
          const examId = normalizeId(exam.id);
          if (examId !== normalizeId(currentExamId)) {
            const eTitle = exam.title || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam");
            (exam.modules || []).forEach((m: any) => {
              if (normalizeId(m.id) !== normalizedModuleId) {
                collected.push({
                  id: normalizeId(m.id),
                  title: m.title || (language === "ar" ? "موديول بدون عنوان" : "Untitled Module"),
                  examId: examId,
                  examTitle: eTitle,
                  isCurrentExam: false,
                });
              }
            });
          }
        });

        setDestinationModules(collected);

        if (collected.length > 0) {
          setTargetMoveModuleId((prev) => {
            if (prev && collected.some((item) => item.id === prev)) return prev;
            return collected[0].id;
          });
          setMoveMode("existing");
        } else {
          setMoveMode("new");
        }
      }
    } catch (err) {
      console.error("Failed to load destination modules:", err);
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  const openMoveModal = (exam: any) => {
    setMovingSubExam(exam);
    setNewModuleTitle("");
    const currentExamId = normalizeId(state.createdIdRef?.current || state.createdId || "");
    setTargetExamIdForNew(currentExamId);

    // Populate immediately with any local other modules from current exam
    const localOther = (state.modules || [])
      .filter((m: any) => normalizeId(m.id) !== normalizedModuleId)
      .map((m: any) => ({
        id: normalizeId(m.id),
        title: m.title || (language === "ar" ? "موديول بدون عنوان" : "Untitled Module"),
        examId: currentExamId,
        examTitle: state.examData?.title || (language === "ar" ? "الاختبار الحالي" : "Current Exam"),
        isCurrentExam: true,
      }));

    setDestinationModules(localOther);
    if (localOther.length > 0) {
      setMoveMode("existing");
      setTargetMoveModuleId(localOther[0].id);
    } else {
      setMoveMode("new");
      setTargetMoveModuleId("");
    }

    fetchAvailableDestinations(currentExamId);
  };

  const handleConfirmMove = async () => {
    if (!movingSubExam) return;

    if (moveMode === "existing" && !targetMoveModuleId) {
      showToast(language === "ar" ? "يرجى اختيار الموديول المستهدف" : "Please select the target module", "error");
      return;
    }
    if (moveMode === "new" && !newModuleTitle.trim()) {
      showToast(language === "ar" ? "يرجى إدخال اسم الموديول الجديد" : "Please enter the new module name", "error");
      return;
    }

    const parentExamId = state.createdIdRef?.current || state.createdId;
    if (!parentExamId) {
      showToast(language === "ar" ? "تعذر تحديد الاختبار الرئيسي" : "Main exam not found", "error");
      return;
    }

    setIsMovingSubExam(true);
    try {
      const payload = moveMode === "new"
        ? {
            newModuleTitle: newModuleTitle.trim(),
            targetExamId: targetExamIdForNew || parentExamId,
          }
        : {
            targetModuleId: targetMoveModuleId,
          };

      const res = await fetch(
        `${API_URL}/exams/${parentExamId}/modules/${normalizedModuleId}/exams/${movingSubExam.id}/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to move exam");
      }

      const movedSubExamId = normalizeId(movingSubExam.id);
      const destModId = normalizeId(data.destinationModule?.id || (moveMode === "existing" ? targetMoveModuleId : ""));

      state.setModules((currentModules: any[]) => {
        let next = currentModules.map((mod: any) => {
          if (normalizeId(mod.id) === normalizedModuleId) {
            return {
              ...mod,
              subExams: (mod.subExams || []).filter(
                (se: any) => normalizeId(se.id) !== movedSubExamId
              ),
            };
          }
          if (normalizeId(mod.id) === destModId) {
            const existingSubExams = mod.subExams || [];
            const exists = existingSubExams.some((se: any) => normalizeId(se.id) === movedSubExamId);
            return {
              ...mod,
              subExams: exists
                ? existingSubExams.map((se: any) => normalizeId(se.id) === movedSubExamId ? (data.subExam || movingSubExam) : se)
                : [...existingSubExams, (data.subExam || movingSubExam)],
            };
          }
          return mod;
        });

        if (data.isNewModule && data.destinationModule && (!data.isCrossExam || normalizeId(data.destinationExamId) === normalizeId(parentExamId))) {
          const alreadyInList = next.some((mod: any) => normalizeId(mod.id) === destModId);
          if (!alreadyInList) {
            next = [
              ...next,
              {
                ...data.destinationModule,
                subExams: [data.subExam || movingSubExam],
              },
            ];
          }
        }

        return next;
      });

      if (normalizeId(state.currentModule?.id) === normalizedModuleId) {
        state.setCurrentModule((currentModule: any) => ({
          ...currentModule,
          subExams: (currentModule.subExams || []).filter(
            (se: any) => normalizeId(se.id) !== movedSubExamId
          ),
        }));
      }

      const chosenDestination = destinationModules.find((m) => m.id === targetMoveModuleId);
      const destExamTitle = moveMode === "new"
        ? (allExamsList.find((e: any) => normalizeId(e.id) === normalizeId(targetExamIdForNew))?.title || state.examData?.title)
        : (chosenDestination?.examTitle || state.examData?.title);

      const destModuleTitle = moveMode === "new"
        ? newModuleTitle.trim()
        : (chosenDestination?.title || data.destinationModule?.title || "");

      const isCross = data.isCrossExam || (chosenDestination && !chosenDestination.isCurrentExam);

      showToast(
        language === "ar"
          ? `تم نقل الاختبار "${movingSubExam.title}" بنجاح${isCross ? ` إلى ${destExamTitle} (${destModuleTitle})` : ` إلى موديول "${destModuleTitle}"`}!`
          : `Exam "${movingSubExam.title}" moved successfully${isCross ? ` to ${destExamTitle} (${destModuleTitle})` : ` to module "${destModuleTitle}"`}!`,
        "success"
      );
      setMovingSubExam(null);
    } catch (error: any) {
      console.error("Failed to move subExam:", error);
      showToast(
        language === "ar"
          ? `فشل نقل الاختبار: ${error?.message || ""}`
          : `Failed to move exam: ${error?.message || ""}`,
        "error"
      );
    } finally {
      setIsMovingSubExam(false);
    }
  };

  const openMoveAllModal = () => {
    setMovingSubExam(null);
    setIsMoveAllModalOpen(true);
    setNewModuleTitle("");
    const currentExamId = normalizeId(state.createdIdRef?.current || state.createdId || "");
    setTargetExamIdForNew(currentExamId);

    const localOther = (state.modules || [])
      .filter((m: any) => normalizeId(m.id) !== normalizedModuleId)
      .map((m: any) => ({
        id: normalizeId(m.id),
        title: m.title || (language === "ar" ? "موديول بدون عنوان" : "Untitled Module"),
        examId: currentExamId,
        examTitle: state.examData?.title || (language === "ar" ? "الاختبار الحالي" : "Current Exam"),
        isCurrentExam: true,
      }));

    setDestinationModules(localOther);
    if (localOther.length > 0) {
      setMoveMode("existing");
      setTargetMoveModuleId(localOther[0].id);
    } else {
      setMoveMode("new");
      setTargetMoveModuleId("");
    }

    fetchAvailableDestinations(currentExamId);
  };

  const handleConfirmMoveAll = async () => {
    if (exams.length === 0) return;

    if (moveMode === "existing" && !targetMoveModuleId) {
      showToast(language === "ar" ? "يرجى اختيار الموديول المستهدف" : "Please select the target module", "error");
      return;
    }
    if (moveMode === "new" && !newModuleTitle.trim()) {
      showToast(language === "ar" ? "يرجى إدخال اسم الموديول الجديد" : "Please enter the new module name", "error");
      return;
    }

    const parentExamId = state.createdIdRef?.current || state.createdId;
    if (!parentExamId) {
      showToast(language === "ar" ? "تعذر تحديد الاختبار الرئيسي" : "Main exam not found", "error");
      return;
    }

    setIsMovingAllSubExams(true);
    try {
      const payload = moveMode === "new"
        ? {
            newModuleTitle: newModuleTitle.trim(),
            targetExamId: targetExamIdForNew || parentExamId,
          }
        : {
            targetModuleId: targetMoveModuleId,
          };

      const res = await fetch(
        `${API_URL}/exams/${parentExamId}/modules/${normalizedModuleId}/exams/move-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to move all sub-exams");
      }

      const movedCount = exams.length;
      const movedExams = [...exams];
      const destModId = normalizeId(data.destinationModule?.id || (moveMode === "existing" ? targetMoveModuleId : ""));

      state.setModules((currentModules: any[]) => {
        let next = currentModules.map((mod: any) => {
          if (normalizeId(mod.id) === normalizedModuleId) {
            return {
              ...mod,
              subExams: [],
            };
          }
          if (normalizeId(mod.id) === destModId) {
            const existingSubExams = mod.subExams || [];
            return {
              ...mod,
              subExams: data.destinationModule?.subExams || [...existingSubExams, ...movedExams],
            };
          }
          return mod;
        });

        if (data.isNewModule && data.destinationModule && (!data.isCrossExam || normalizeId(data.destinationExamId) === normalizeId(parentExamId))) {
          const alreadyInList = next.some((mod: any) => normalizeId(mod.id) === destModId);
          if (!alreadyInList) {
            next = [
              ...next,
              {
                ...data.destinationModule,
                subExams: movedExams,
              },
            ];
          }
        }

        return next;
      });

      if (normalizeId(state.currentModule?.id) === normalizedModuleId) {
        state.setCurrentModule((currentModule: any) => ({
          ...currentModule,
          subExams: [],
        }));
      }

      const chosenDestination = destinationModules.find((m) => m.id === targetMoveModuleId);
      const destExamTitle = moveMode === "new"
        ? (allExamsList.find((e: any) => normalizeId(e.id) === normalizeId(targetExamIdForNew))?.title || state.examData?.title)
        : (chosenDestination?.examTitle || state.examData?.title);

      const destModuleTitle = moveMode === "new"
        ? newModuleTitle.trim()
        : (chosenDestination?.title || data.destinationModule?.title || "");

      const isCross = data.isCrossExam || (chosenDestination && !chosenDestination.isCurrentExam);

      showToast(
        language === "ar"
          ? `تم نقل جميع الاختبارات (${movedCount} اختبار) بنجاح${isCross ? ` إلى ${destExamTitle} (${destModuleTitle})` : ` إلى موديول "${destModuleTitle}"`}!`
          : `All exams (${movedCount}) moved successfully${isCross ? ` to ${destExamTitle} (${destModuleTitle})` : ` to module "${destModuleTitle}"`}!`,
        "success"
      );
      setIsMoveAllModalOpen(false);
    } catch (error: any) {
      console.error("Failed to move all subExams:", error);
      showToast(
        language === "ar"
          ? `فشل نقل الاختبارات: ${error?.message || ""}`
          : `Failed to move all exams: ${error?.message || ""}`,
        "error"
      );
    } finally {
      setIsMovingAllSubExams(false);
    }
  };

  const handleOpenModuleSettings = () => {
    if (!examModule) return;
    setModuleSettingsTitle(examModule.title || "");
    setModuleSettingsDescription(examModule.description || state.examData?.description || "");
    setModuleSettingsCoverImage(state.examData?.coverImage || "");
    setModuleSettingsDuration(examModule.duration ?? state.examData?.duration ?? 60);
    setModuleSettingsPassingScore(examModule.passingScore ?? state.examData?.passingScore ?? 50);
    setModuleSettingsAttempts(state.examData?.attemptsAllowed ?? "");
    setModuleSettingsPassword(state.examData?.password || "");
    setModuleSettingsResultVisibility(state.examData?.resultVisibility || "SHOW_SCORE");
    // Resolve schools properly from examData (handling schools array, schoolIds array, or schoolId)
    const existingSchoolIds: string[] = Array.isArray(state.examData?.schoolIds) && state.examData.schoolIds.length > 0
      ? state.examData.schoolIds
      : Array.isArray(state.examData?.schools) && state.examData.schools.length > 0
        ? state.examData.schools.map((s: any) => (typeof s === "object" ? s?.id : s)).filter(Boolean)
        : state.examData?.schoolId ? [state.examData.schoolId] : [];

    const isCentralSetting = existingSchoolIds.length > 0
      ? false
      : (state.examData?.isCentral !== undefined ? Boolean(state.examData.isCentral) : true);

    setModuleSettingsIsCentral(isCentralSetting);
    setModuleSettingsSchoolIds(existingSchoolIds);

    let currentGrades: string[] = [];
    if (Array.isArray(state.examData?.grades) && state.examData.grades.length > 0) {
      currentGrades = [...state.examData.grades];
    } else if (examModule.gradeTarget) {
      currentGrades = String(examModule.gradeTarget).split(",").map((g: string) => g.trim()).filter(Boolean);
    }
    setModuleSettingsGrades(currentGrades);

    const currentSubjects = Array.isArray(state.examData?.subjects) ? [...state.examData.subjects] : [];
    setModuleSettingsSubjects(currentSubjects);

    const toInputDate = (d: any) => {
      if (!d) return "";
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      } catch {
        return "";
      }
    };
    setModuleSettingsStartDate(toInputDate(examModule.publishDate || state.examData?.startDate));
    setModuleSettingsEndDate(toInputDate(examModule.cutOffDate || state.examData?.endDate));
    setIsModuleSettingsOpen(true);
  };

  const handleSaveModuleSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!moduleSettingsTitle.trim()) {
      showToast(language === "ar" ? "يرجى إدخال اسم الموديول" : "Module title is required", "error");
      return;
    }
    setIsSavingModuleSettings(true);
    // Drain older autosaves before writing settings so they cannot restore an
    // outdated school selection or module title after this explicit save.
    if (state.manualSubmitRef) state.manualSubmitRef.current = true;
    if (state.autoSaveGenerationRef) state.autoSaveGenerationRef.current += 1;
    if (state.autoSaveTimerRef?.current) clearTimeout(state.autoSaveTimerRef.current);
    try {
      await state.autoSaveWriteQueueRef?.current;
      const parentExamId = state.createdIdRef.current || state.createdId;
      const token = localStorage.getItem(tokenKey) || "";
      const targetSchoolIds = moduleSettingsIsCentral ? [] : (moduleSettingsSchoolIds || []).filter(Boolean);

      // Keep a single root module's assessment title in sync; preserve multi-module titles.
      const examPayload: any = {
        title: !examModule.parentModuleId && (state.modules || []).filter((m: any) => !m.parentModuleId).length === 1
          ? moduleSettingsTitle.trim()
          : state.examData?.title || examModule.title || moduleSettingsTitle.trim(),
        description: state.examData?.description || moduleSettingsDescription.trim(),
        coverImage: moduleSettingsCoverImage || null,
        grades: moduleSettingsGrades,
        subjects: moduleSettingsSubjects,
        isCentral: moduleSettingsIsCentral,
        schoolIds: targetSchoolIds,
        schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
        duration: moduleSettingsDuration !== "" ? Number(moduleSettingsDuration) : 60,
        passingScore: moduleSettingsPassingScore !== "" ? Number(moduleSettingsPassingScore) : 50,
        attemptsAllowed: moduleSettingsAttempts !== "" && moduleSettingsAttempts !== null ? Number(moduleSettingsAttempts) : 999,
        password: moduleSettingsPassword || null,
        startDate: moduleSettingsStartDate ? new Date(moduleSettingsStartDate).toISOString() : null,
        endDate: moduleSettingsEndDate ? new Date(moduleSettingsEndDate).toISOString() : null,
        resultVisibility: moduleSettingsResultVisibility,
        status: state.examData?.status || "PUBLISHED",
      };

      const examRes = await fetch(`${API_URL}/exams/${parentExamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(examPayload),
      });

      if (!examRes.ok) {
        const examErr = await examRes.json().catch(() => ({}));
        throw new Error(examErr.error || examErr.message || (language === "ar" ? "فشل تحديث إعدادات التقييم" : "Failed to update assessment settings"));
      }

      const updatedExamData = await examRes.json().catch(() => ({}));
      const resolvedExam = updatedExamData.exam || updatedExamData;
      if (typeof state.setExamData === "function") {
        state.setExamData((prev: any) => ({
          ...prev,
          ...examPayload,
          ...resolvedExam,
          isCentral: moduleSettingsIsCentral,
          schoolIds: targetSchoolIds,
          schools: (state.schools || []).filter((s: any) => targetSchoolIds.includes(s.id)),
        }));
      }

      // 2. Update the specific active module
      const modulePayload: any = {
        title: moduleSettingsTitle.trim(),
        description: moduleSettingsDescription.trim(),
        duration: moduleSettingsDuration !== "" ? Number(moduleSettingsDuration) : null,
        passingScore: moduleSettingsPassingScore !== "" ? Number(moduleSettingsPassingScore) : null,
        gradeTarget: moduleSettingsGrades.join(","),
        publishDate: moduleSettingsStartDate ? new Date(moduleSettingsStartDate).toISOString() : null,
        cutOffDate: moduleSettingsEndDate ? new Date(moduleSettingsEndDate).toISOString() : null,
      };

      const res = await fetch(`${API_URL}/exams/${parentExamId}/modules/${normalizedModuleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(modulePayload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update module settings");
      }

      const updated = await res.json();

      const updateRecursive = (list: any[]): any[] =>
        (list || []).map((m: any) => {
          if (String(m.id) === normalizedModuleId) {
            return { ...m, ...updated, ...modulePayload };
          }
          if (Array.isArray(m.subModules) && m.subModules.length > 0) {
            return { ...m, subModules: updateRecursive(m.subModules) };
          }
          return m;
        });

      state.setModules((prev: any[]) => updateRecursive(prev));

      if (String(state.currentModule?.id || "") === normalizedModuleId) {
        state.setCurrentModule((prev: any) => ({ ...prev, ...updated, ...modulePayload }));
      }

      showToast(
        language === "ar" ? "تم حفظ إعدادات الموديول بنجاح!" : "Module settings saved successfully!",
        "success"
      );
      setIsModuleSettingsOpen(false);
    } catch (error: any) {
      console.error("Save module error:", error);
      showToast(
        error?.message || (language === "ar" ? "تعذر حفظ إعدادات الموديول" : "Failed to save module settings"),
        "error"
      );
    } finally {
      if (state.manualSubmitRef) state.manualSubmitRef.current = false;
      setIsSavingModuleSettings(false);
    }
  };

  return (
    <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">←</button>
        <div>
          {parentModule && (
            <div className="flex items-center gap-2 text-xs font-black text-indigo-600 mb-1">
              <Link
                href={buildModulePortalHref(role, state.createdIdRef.current || state.createdId, parentModule.id) || "#"}
                className="hover:underline flex items-center gap-1"
              >
                <span>{parentModule.title || (language === "ar" ? "الموديول الرئيسي" : "Parent Module")}</span>
              </Link>
              <span>/</span>
              <span className="text-slate-500">{examModule.title}</span>
            </div>
          )}
          <div className="text-xs font-black text-indigo-600 uppercase tracking-widest">{language === "ar" ? "بوابة Module الاختبارات" : "Exam Module Portal"}</div>
          <h1 className="text-3xl font-black text-slate-900 mt-1">{examModule.title}</h1>
          <p className="text-slate-400 font-bold mt-1">{examModule.description || (language === "ar" ? "أنشئ الاختبارات والموديولات الفرعية داخل هذا الموديول" : "Create exams and sub-modules inside this module")}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-black text-slate-400">
            <span>{getCreatedAtLabel(examModule.createdAt, language)}</span>
            <span>{getUpdatedAtLabel(examModule.updatedAt, language)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            fetchAvailableDestinations(state.createdIdRef.current || state.createdId);
            setIsMoveCurrentModuleModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-black text-purple-700 transition-all hover:bg-purple-100 shadow-xs"
        >
          <ArrowRightLeft className="w-4 h-4" />
          {language === "ar" ? "نقل هذا الموديول" : "Move This Module"}
        </button>
        <button
          type="button"
          onClick={handleOpenModuleSettings}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-all hover:border-indigo-200 hover:text-indigo-600 shadow-xs"
        >
          <Settings className="w-4 h-4 text-indigo-600" />
          {language === "ar" ? "إعدادات الموديول" : "Module Settings"}
        </button>
      </div>
    </div>

    {/* Sub-Modules Section */}
    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-indigo-600" />
            {language === "ar" ? "الموديولات الفرعية" : "Sub-Modules"}
          </h2>
          <p className="text-slate-400 font-bold mt-1">
            {(examModule.subModules || []).length} {language === "ar" ? "موديول فرعي داخل هذا الموديول" : "sub-modules in this module"}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            value={subModuleTitle}
            onChange={(e) => setSubModuleTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createSubModule(); }}
            placeholder={language === "ar" ? "اسم الموديول الفرعي الجديد..." : "New sub-module name..."}
            className="min-w-0 flex-1 md:w-64 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-indigo-500 text-sm"
          />
          <button
            type="button"
            disabled={creatingSubModule}
            onClick={createSubModule}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-black text-sm disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            {creatingSubModule ? (language === "ar" ? "جارٍ الإنشاء..." : "Creating...") : (language === "ar" ? "إضافة موديول فرعي" : "Add Sub-Module")}
          </button>
        </div>
      </div>

      {(examModule.subModules || []).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-100 p-8 text-center text-slate-400 font-bold text-sm">
          {language === "ar" ? "لا توجد موديولات فرعية حتى الآن داخل هذا الموديول. يمكنك إضافة موديول فرعي لتنظيم الاختبارات." : "No sub-modules inside this module yet. You can add one to organize exams."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(examModule.subModules || []).map((sm: any) => {
            const smPortalHref = buildModulePortalHref(role, state.createdIdRef.current || state.createdId, sm.id);
            const smExamsCount = sm.examsCount ?? (sm.subExams || []).length;
            const smQuestionsCount = (sm.subExams || []).reduce(
              (tot: number, se: any) => tot + (se.questionsCount ?? se._count?.questions ?? (se.questions || []).length ?? 0),
              0
            );

            return (
              <div key={sm.id} className="rounded-3xl border border-indigo-50 bg-slate-50/70 p-5 shadow-xs hover:border-indigo-200 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center">
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        fetchAvailableDestinations(state.createdIdRef.current || state.createdId);
                        setSubModuleToMove(sm);
                      }}
                      className="w-9 h-9 rounded-xl bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center shadow-xs"
                      title={language === "ar" ? "نقل الموديول الفرعي" : "Move sub-module"}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSubModule(sm.id)}
                      className="w-9 h-9 rounded-xl bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center shadow-xs"
                      title={language === "ar" ? "حذف الموديول الفرعي" : "Delete sub-module"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-900 truncate">{sm.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-400">
                  <span>{smExamsCount} {language === "ar" ? "اختبارات" : "exams"}</span>
                  <span>·</span>
                  <span>{smQuestionsCount} {language === "ar" ? "سؤال" : "questions"}</span>
                </div>

                {smPortalHref && (
                  <Link
                    href={smPortalHref}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-indigo-100 px-4 py-2.5 text-xs font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-xs"
                  >
                    <span>{language === "ar" ? "دخول الموديول الفرعي" : "Open Sub-Module"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <input ref={jsonInputRef} type="file" accept=".json,application/json" onChange={importExamJson} className="hidden" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"><div><h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "الاختبارات" : "Exams"}</h2><p className="text-slate-400 font-bold mt-1 flex items-center flex-wrap gap-2"><span>{exams.length} {language === "ar" ? "اختبارات" : "exams"} · {questions} {language === "ar" ? "سؤال" : "questions"}</span>{state.isLoadingQuestions && (<span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 text-xs font-black text-indigo-600 animate-pulse"><Loader2 className="w-3 h-3 animate-spin text-indigo-600" /><span>{language === "ar" ? "جارٍ مزامنة الأسئلة في الخلفية..." : "Loading questions in background..."}</span></span>)}</p></div><div className="flex flex-wrap gap-2 w-full md:w-auto">{exams.length > 0 && <button type="button" onClick={openMoveAllModal} className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-black text-purple-700 transition-all hover:bg-purple-100 shadow-xs"><ArrowRightLeft className="w-4 h-4" /><span>{language === "ar" ? "نقل كل الاختبارات إلى موديول آخر" : "Move All Exams"}</span><span className="rounded-lg bg-purple-200/70 px-2 py-0.5 text-xs font-black text-purple-900">{exams.length}</span></button>}{role === "SUPER_ADMIN" && <button onClick={() => jsonInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition-all hover:bg-emerald-100"><Upload className="w-4 h-4" />{language === "ar" ? "استعادة JSON" : "Restore JSON"}</button>}<input ref={titleInputRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") createExam(); }} placeholder={language === "ar" ? "اسم الاختبار الجديد" : "New exam name"} className="min-w-0 flex-1 md:w-56 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-indigo-500" /><button disabled={creating} onClick={createExam} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-black disabled:opacity-50"><Plus className="w-5 h-5" />{language === "ar" ? "إنشاء اختبار" : "Create Exam"}</button></div></div>
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
                  <button onClick={() => exportExamJson(exam.id)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-emerald-600 flex items-center justify-center" title={language === "ar" ? "تصدير JSON" : "Export JSON"}>
                    <FileCode className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openMoveModal(exam)}
                    className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center shadow-xs"
                    title={language === "ar" ? "نقل الاختبار بأسئلته إلى موديول آخر" : "Move exam to another module"}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
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
                  {role === "SUPER_ADMIN" && (
                    <button onClick={() => deleteExam(exam.id)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-red-600 flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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

    {movingSubExam && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] max-w-lg w-full p-7 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {language === "ar" ? "نقل الاختبار إلى موديول آخر" : "Move Exam to Another Module"}
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  {language === "ar" ? "سيتم نقل الاختبار بجميع أسئلته المحفوظة" : "The exam and all its questions will be moved"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMovingSubExam(null)}
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
            <div className="text-xs font-bold text-purple-700">
              {language === "ar" ? "الاختبار المحدد:" : "Selected Exam:"}
            </div>
            <div className="text-sm font-black text-purple-900 flex items-center justify-between">
              <span>{movingSubExam.title}</span>
              <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg text-purple-700 shadow-xs">
                {movingSubExam.questions?.length || movingSubExam.questionsCount || movingSubExam._count?.questions || 0} {language === "ar" ? "سؤال" : "questions"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              {language === "ar" ? "اختر وجهة النقل:" : "Select Destination:"}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMoveMode("existing")}
                disabled={destinationModules.length === 0}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  moveMode === "existing"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <FolderInput className="w-5 h-5" />
                <span>{language === "ar" ? "موديول موجود" : "Existing Module"}</span>
                {isLoadingDestinations ? (
                  <span className="text-[10px] text-purple-500 animate-pulse">
                    {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
                  </span>
                ) : destinationModules.length === 0 ? (
                  <span className="text-[10px] text-slate-400">
                    ({language === "ar" ? "لا يوجد غيره" : "None available"})
                  </span>
                ) : (
                  <span className="text-[10px] text-purple-600 font-bold">
                    ({destinationModules.length} {language === "ar" ? "متاح" : "available"})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMoveMode("new")}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  moveMode === "new"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>{language === "ar" ? "إنشاء موديول جديد" : "Create New Module"}</span>
              </button>
            </div>

            {moveMode === "existing" ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "ar" ? "حدد الموديول المستهدف:" : "Target Module:"}
                  </label>
                  {isLoadingDestinations && (
                    <span className="text-xs text-purple-600 animate-pulse">
                      {language === "ar" ? "جارٍ التحديث..." : "Updating..."}
                    </span>
                  )}
                </div>
                <select
                  value={targetMoveModuleId}
                  onChange={(e) => setTargetMoveModuleId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                >
                  <option value="">
                    {language === "ar" ? "-- اختر الموديول المستهدف --" : "-- Select Target Module --"}
                  </option>
                  {destinationModules.filter((m) => m.isCurrentExam).length > 0 && (
                    <optgroup
                      label={
                        language === "ar"
                          ? `هذا الاختبار (${state.examData?.title || "الحالي"})`
                          : `Current Exam (${state.examData?.title || "Current"})`
                      }
                    >
                      {destinationModules
                        .filter((m) => m.isCurrentExam)
                        .map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {Array.from(new Set(destinationModules.filter((m) => !m.isCurrentExam).map((m) => m.examId))).map(
                    (examId) => {
                      const examItems = destinationModules.filter((m) => m.examId === examId);
                      const examTitle = examItems[0]?.examTitle || examId;
                      return (
                        <optgroup key={examId} label={examTitle}>
                          {examItems.map((mod) => (
                            <option key={mod.id} value={mod.id}>
                              {mod.title}
                            </option>
                          ))}
                        </optgroup>
                      );
                    }
                  )}
                </select>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {allExamsList.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      {language === "ar" ? "الاختبار التابع له الموديول الجديد:" : "Target Exam:"}
                    </label>
                    <select
                      value={targetExamIdForNew}
                      onChange={(e) => setTargetExamIdForNew(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    >
                      <option value={state.createdIdRef?.current || state.createdId}>
                        {language === "ar"
                          ? `هذا الاختبار (${state.examData?.title || "الحالي"})`
                          : `Current Exam (${state.examData?.title || "Current"})`}
                      </option>
                      {allExamsList
                        .filter((e: any) => normalizeId(e.id) !== normalizeId(state.createdIdRef?.current || state.createdId))
                        .map((e: any) => (
                          <option key={e.id} value={e.id}>
                            {e.title || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam")}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "ar" ? "اسم الموديول الجديد:" : "New Module Name:"}
                  </label>
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder={language === "ar" ? "مثال: موديول 3 - المراجعة النهائية" : "e.g., Module 3 - Final Review"}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMovingSubExam(null)}
              disabled={isMovingSubExam}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleConfirmMove}
              disabled={isMovingSubExam}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isMovingSubExam ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{language === "ar" ? "جارٍ النقل..." : "Moving..."}</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{language === "ar" ? "تأكيد النقل" : "Confirm Move"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    {isMoveAllModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {language === "ar" ? "نقل جميع الاختبارات الفرعية" : "Move All Sub-Exams"}
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  {language === "ar" ? "سيتم نقل كافة الاختبارات بأسئلتها بالكامل إلى الموديول المختار" : "All exams and their questions will be moved completely"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMoveAllModalOpen(false)}
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
            <div className="text-xs font-bold text-purple-700">
              {language === "ar" ? "الموديول المصدر الحالي:" : "Current Source Module:"}
            </div>
            <div className="text-sm font-black text-purple-900 flex items-center justify-between">
              <span>{examModule.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg text-purple-700 shadow-xs">
                  {exams.length} {language === "ar" ? "اختبار" : "exams"}
                </span>
                <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg text-purple-700 shadow-xs">
                  {questions} {language === "ar" ? "سؤال" : "questions"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              {language === "ar" ? "اختر وجهة النقل:" : "Select Destination:"}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMoveMode("existing")}
                disabled={destinationModules.length === 0}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  moveMode === "existing"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <FolderInput className="w-5 h-5" />
                <span>{language === "ar" ? "موديول موجود" : "Existing Module"}</span>
                {isLoadingDestinations ? (
                  <span className="text-[10px] text-purple-500 animate-pulse">
                    {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
                  </span>
                ) : destinationModules.length === 0 ? (
                  <span className="text-[10px] text-slate-400">
                    ({language === "ar" ? "لا يوجد غيره" : "None available"})
                  </span>
                ) : (
                  <span className="text-[10px] text-purple-600 font-bold">
                    ({destinationModules.length} {language === "ar" ? "متاح" : "available"})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMoveMode("new")}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  moveMode === "new"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>{language === "ar" ? "إنشاء موديول جديد" : "Create New Module"}</span>
              </button>
            </div>

            {moveMode === "existing" ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "ar" ? "حدد الموديول المستهدف لاستقبال جميع الاختبارات:" : "Target Module for all exams:"}
                  </label>
                  {isLoadingDestinations && (
                    <span className="text-xs text-purple-600 animate-pulse">
                      {language === "ar" ? "جارٍ التحديث..." : "Updating..."}
                    </span>
                  )}
                </div>
                <select
                  value={targetMoveModuleId}
                  onChange={(e) => setTargetMoveModuleId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                >
                  <option value="">
                    {language === "ar" ? "-- اختر الموديول المستهدف --" : "-- Select Target Module --"}
                  </option>
                  {destinationModules.filter((m) => m.isCurrentExam).length > 0 && (
                    <optgroup
                      label={
                        language === "ar"
                          ? `هذا الاختبار (${state.examData?.title || "الحالي"})`
                          : `Current Exam (${state.examData?.title || "Current"})`
                      }
                    >
                      {destinationModules
                        .filter((m) => m.isCurrentExam)
                        .map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {Array.from(new Set(destinationModules.filter((m) => !m.isCurrentExam).map((m) => m.examId))).map(
                    (examId) => {
                      const examItems = destinationModules.filter((m) => m.examId === examId);
                      const examTitle = examItems[0]?.examTitle || examId;
                      return (
                        <optgroup key={examId} label={examTitle}>
                          {examItems.map((mod) => (
                            <option key={mod.id} value={mod.id}>
                              {mod.title}
                            </option>
                          ))}
                        </optgroup>
                      );
                    }
                  )}
                </select>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {allExamsList.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      {language === "ar" ? "الاختبار التابع له الموديول الجديد:" : "Target Exam:"}
                    </label>
                    <select
                      value={targetExamIdForNew}
                      onChange={(e) => setTargetExamIdForNew(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    >
                      <option value={state.createdIdRef?.current || state.createdId}>
                        {language === "ar"
                          ? `هذا الاختبار (${state.examData?.title || "الحالي"})`
                          : `Current Exam (${state.examData?.title || "Current"})`}
                      </option>
                      {allExamsList
                        .filter((e: any) => normalizeId(e.id) !== normalizeId(state.createdIdRef?.current || state.createdId))
                        .map((e: any) => (
                          <option key={e.id} value={e.id}>
                            {e.title || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam")}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "ar" ? "اسم الموديول الجديد:" : "New Module Name:"}
                  </label>
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder={language === "ar" ? "مثال: موديول 3 - المراجعة النهائية" : "e.g., Module 3 - Final Review"}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMoveAllModalOpen(false)}
              disabled={isMovingAllSubExams}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleConfirmMoveAll}
              disabled={isMovingAllSubExams}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isMovingAllSubExams ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{language === "ar" ? "جارٍ النقل الجماعي..." : "Moving all..."}</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{language === "ar" ? `تأكيد نقل جميع الاختبارات (${exams.length})` : `Confirm Move All (${exams.length})`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

      {isMoveCurrentModuleModalOpen && examModule && (
        <MoveModuleModal
          isOpen={isMoveCurrentModuleModalOpen}
          onClose={() => setIsMoveCurrentModuleModalOpen(false)}
          onSuccess={async () => {
            setIsMoveCurrentModuleModalOpen(false);
            if (typeof state.refreshModules === "function") {
              await state.refreshModules();
            } else {
              window.location.reload();
            }
          }}
          moduleToMove={examModule}
          parentExam={{ id: state.createdIdRef.current || state.createdId, title: state.examData?.title || "" }}
          allExams={allExamsList.length > 0 ? allExamsList : [{ id: state.createdIdRef.current || state.createdId, title: state.examData?.title || "" }]}
          language={language}
          role={role}
        />
      )}

      {subModuleToMove && (
        <MoveModuleModal
          isOpen={Boolean(subModuleToMove)}
          onClose={() => setSubModuleToMove(null)}
          onSuccess={async () => {
            setSubModuleToMove(null);
            if (typeof state.refreshModules === "function") {
              await state.refreshModules();
            } else {
              window.location.reload();
            }
          }}
          moduleToMove={subModuleToMove}
          parentExam={{ id: state.createdIdRef.current || state.createdId, title: state.examData?.title || "" }}
          allExams={allExamsList.length > 0 ? allExamsList : [{ id: state.createdIdRef.current || state.createdId, title: state.examData?.title || "" }]}
          language={language}
          role={role}
        />
      )}

      {/* Dedicated In-Place Modal for Active Module Settings */}
      {isModuleSettingsOpen && examModule && (
        <div
          dir={language === "ar" ? "rtl" : "ltr"}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6 md:p-8 animate-in fade-in duration-300"
        >
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[92vh]">
            {/* Header */}
            <div className="bg-slate-900 p-6 sm:p-8 flex justify-between items-center gap-4 text-white shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                    {language === "ar" ? `إعدادات الموديول: ${examModule.title}` : `Module Settings: ${examModule.title}`}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-bold mt-1">
                    {language === "ar"
                      ? "تعديل جميع بيانات وإعدادات هذا الموديول والتقييم"
                      : "Edit all info and settings for this module and assessment"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModuleSettingsOpen(false)}
                className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSaveModuleSettings} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Cover Image Upload */}
              <div className="space-y-3">
                <FileUpload
                  label={language === "ar" ? "صورة غلاف التقييم" : "Assessment Cover Image"}
                  accept="image/*"
                  value={moduleSettingsCoverImage}
                  onUploadSuccess={(url) => setModuleSettingsCoverImage(url)}
                  tokenKey={tokenKey}
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "عنوان التقييم / اسم الموديول *" : "Assessment / Module Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={moduleSettingsTitle}
                  onChange={(e) => setModuleSettingsTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm text-sm sm:text-base"
                  placeholder={language === "ar" ? "مثال: تقييم الرياضيات المتقدمة" : "e.g. Advanced Mathematics Assessment"}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "وصف الموديول" : "Module Description"}
                </label>
                <textarea
                  rows={3}
                  value={moduleSettingsDescription}
                  onChange={(e) => setModuleSettingsDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm resize-none text-sm"
                  placeholder={language === "ar" ? "اكتب نبذة أو وصفاً للموديول..." : "Write a brief description..."}
                />
              </div>

              {/* Stages & Grades */}
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "المراحل الدراسية والصفوف المستهدفة" : "Educational Stages & Grades"}
                </label>
                <div className="space-y-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {SETTINGS_STAGES.map((group) => {
                    const allSelected = group.grades.every((g) => moduleSettingsGrades.includes(g));

                    return (
                      <div key={group.stage} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            {language === "ar" ? group.titleAr : group.titleEn}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              if (allSelected) {
                                setModuleSettingsGrades(moduleSettingsGrades.filter((g) => !group.grades.includes(g)));
                              } else {
                                const newGrades = [...moduleSettingsGrades];
                                group.grades.forEach((g) => {
                                  if (!newGrades.includes(g)) newGrades.push(g);
                                });
                                setModuleSettingsGrades(newGrades);
                              }
                            }}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                          >
                            {allSelected
                              ? (language === "ar" ? "إلغاء تحديد الكل" : "Deselect All")
                              : (language === "ar" ? "تحديد الكل" : "Select All")}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {group.grades.map((g) => {
                            const isSelected = moduleSettingsGrades.includes(g);
                            return (
                              <label
                                key={g}
                                className={`flex min-w-0 items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-indigo-50/50 border-indigo-400 text-indigo-900"
                                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${
                                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 border border-slate-200"
                                  }`}
                                >
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                                <span className="min-w-0 truncate text-[11px] sm:text-xs font-bold">
                                  {getGradeName(g, language)}
                                </span>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isSelected}
                                  onChange={() => toggleSettingsGrade(g)}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject / Specialization */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "المادة / التخصص" : "Subject / Specialization"} <span className="text-red-500">*</span>
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                  {SETTINGS_CATEGORIES.map((cat) => {
                    const isSelected = moduleSettingsSubjects.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => toggleSettingsSubject(cat)}
                        />
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-black">{getSubjectName(cat, language)}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-bold">
                  {language === "ar"
                    ? "يمكن اختيار أكثر من مجال وسيتم حفظها داخل نفس الموديول والتقييم."
                    : "Multiple domains can be selected and will be saved within the same module."}
                </p>
              </div>

              {/* Assessment Type */}
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "نوع التقييم" : "Assessment Type"}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moduleSettingsAssessmentType"
                      checked={moduleSettingsIsCentral}
                      onChange={() => {
                        setModuleSettingsIsCentral(true);
                        setModuleSettingsSchoolIds([]);
                      }}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {language === "ar" ? "مركزي (لجميع المدارس)" : "Centralized (All Schools)"}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moduleSettingsAssessmentType"
                      checked={!moduleSettingsIsCentral}
                      onChange={() => setModuleSettingsIsCentral(false)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {language === "ar" ? "مخصص لمدارس محددة" : "Specific Schools"}
                    </span>
                  </label>
                </div>

                {!moduleSettingsIsCentral && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                      {language === "ar" ? "إسناد التقييم للمدرسة" : "Assign Assessment to School"}
                    </label>
                    {(!state.schools || state.schools.length === 0) ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold text-sm">
                        {language === "ar" ? "لا توجد مدارس متاحة" : "No schools available"}
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center px-2 mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {language === "ar" ? "اختر المدارس (اختياري)" : "Select Schools (Optional)"}
                          </span>
                          <button
                            type="button"
                            onClick={selectAllSettingsSchools}
                            className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer"
                          >
                            {(moduleSettingsSchoolIds || []).length === (state.schools || []).length
                              ? (language === "ar" ? "إلغاء الكل" : "Deselect All")
                              : (language === "ar" ? "تحديد الكل" : "Select All")}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                          {(state.schools || []).map((s: any) => {
                            const isSelected = (moduleSettingsSchoolIds || []).includes(s.id);
                            return (
                              <label
                                key={s.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-indigo-50 border-indigo-500"
                                    : "bg-white border-transparent hover:border-slate-200"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isSelected}
                                  onChange={() => toggleSettingsSchool(s.id)}
                                />
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${
                                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 border border-slate-200"
                                  }`}
                                >
                                  {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {language === "ar"
                            ? "المحتوى متاح لطلاب المدارس المحددة فقط. إلغاء كل المدارس في الوضع المخصص يخفيه عن الطلاب؛ لإتاحته للجميع اختر التقييم المركزي."
                            : "Only students of the selected schools can access this content. No selected schools in this mode means no student access; choose Centralized to share with all schools."}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Duration, Passing Score, Attempts, Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    {language === "ar" ? "المدة (دقائق)" : "Duration (Mins)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={moduleSettingsDuration}
                    onChange={(e) => setModuleSettingsDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                    placeholder={language === "ar" ? "مثال: 60" : "e.g. 60"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    {language === "ar" ? "درجة النجاح (%)" : "Passing Score (%)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={moduleSettingsPassingScore}
                    onChange={(e) => setModuleSettingsPassingScore(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                    placeholder={language === "ar" ? "مثال: 50" : "e.g. 50"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                    {language === "ar" ? "المحاولات" : "Attempts"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={moduleSettingsAttempts}
                    onChange={(e) => setModuleSettingsAttempts(e.target.value)}
                    placeholder={language === "ar" ? "مفتوح (بدون حد)" : "Unlimited"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                    {language === "ar" ? "كلمة المرور" : "Password"}
                  </label>
                  <input
                    type="text"
                    value={moduleSettingsPassword}
                    onChange={(e) => setModuleSettingsPassword(e.target.value)}
                    placeholder={language === "ar" ? "اختياري" : "Optional"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {language === "ar" ? "تاريخ البدء" : "Start Date"}
                  </label>
                  <input
                    type="datetime-local"
                    value={moduleSettingsStartDate}
                    onChange={(e) => setModuleSettingsStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    {language === "ar" ? "تاريخ الانتهاء" : "End Date"}
                  </label>
                  <input
                    type="datetime-local"
                    value={moduleSettingsEndDate}
                    onChange={(e) => setModuleSettingsEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-red-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Result Policy */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "سياسة النتيجة" : "Result Policy"}
                </label>
                <select
                  value={moduleSettingsResultVisibility}
                  onChange={(e) => setModuleSettingsResultVisibility(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                >
                  <option value="SHOW_SCORE">{language === "ar" ? "إظهار النتيجة فقط" : "Show Score Only"}</option>
                  <option value="SHOW_SCORE_ANSWERS">{language === "ar" ? "إظهار النتيجة والإجابات" : "Show Score & Answers"}</option>
                  <option value="HIDDEN">{language === "ar" ? "إخفاء النتيجة" : "Hidden"}</option>
                </select>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setIsModuleSettingsOpen(false)}
                  disabled={isSavingModuleSettings}
                  className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSavingModuleSettings}
                  className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {isSavingModuleSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === "ar" ? "جارٍ الحفظ..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{language === "ar" ? "حفظ التغييرات" : "Save Changes"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
