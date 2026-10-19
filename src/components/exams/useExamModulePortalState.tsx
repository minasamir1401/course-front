"use client";
import { toEgyptInput, parseEgyptDate } from '@/lib/egyptTime';


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

export function useExamModulePortalState({ state, moduleId, language, role }: any) {

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

  const tokenKey: "school_admin_token" | "super_admin_token" = role === "SCHOOL_ADMIN" ? "school_admin_token" : "super_admin_token";
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
        startDate: moduleSettingsStartDate ? parseEgyptDate(moduleSettingsStartDate).toISOString() : null,
        endDate: moduleSettingsEndDate ? parseEgyptDate(moduleSettingsEndDate).toISOString() : null,
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
        publishDate: moduleSettingsStartDate ? parseEgyptDate(moduleSettingsStartDate).toISOString() : null,
        cutOffDate: moduleSettingsEndDate ? parseEgyptDate(moduleSettingsEndDate).toISOString() : null,
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

  
return { state, moduleId, language, role, router, showToast, normalizedModuleId, normalizeId, findModuleRecursive, examModule, findParentModule, parentModule, title, setTitle, creating, setCreating, collectingSubExamId, setCollectingSubExamId, selectedTargetExamId, setSelectedTargetExamId, movingSubExam, setMovingSubExam, moveMode, setMoveMode, targetMoveModuleId, setTargetMoveModuleId, newModuleTitle, setNewModuleTitle, isMovingSubExam, setIsMovingSubExam, destinationModules, setDestinationModules, isLoadingDestinations, setIsLoadingDestinations, allExamsList, setAllExamsList, targetExamIdForNew, setTargetExamIdForNew, isMoveAllModalOpen, setIsMoveAllModalOpen, isMovingAllSubExams, setIsMovingAllSubExams, subModuleTitle, setSubModuleTitle, creatingSubModule, setCreatingSubModule, subModuleToMove, setSubModuleToMove, isMoveCurrentModuleModalOpen, setIsMoveCurrentModuleModalOpen, isModuleSettingsOpen, setIsModuleSettingsOpen, moduleSettingsTitle, setModuleSettingsTitle, moduleSettingsDescription, setModuleSettingsDescription, moduleSettingsCoverImage, setModuleSettingsCoverImage, moduleSettingsGrades, setModuleSettingsGrades, moduleSettingsSubjects, setModuleSettingsSubjects, moduleSettingsIsCentral, setModuleSettingsIsCentral, moduleSettingsSchoolIds, setModuleSettingsSchoolIds, moduleSettingsDuration, setModuleSettingsDuration, moduleSettingsPassingScore, setModuleSettingsPassingScore, moduleSettingsAttempts, setModuleSettingsAttempts, moduleSettingsPassword, setModuleSettingsPassword, moduleSettingsStartDate, setModuleSettingsStartDate, moduleSettingsEndDate, setModuleSettingsEndDate, moduleSettingsResultVisibility, setModuleSettingsResultVisibility, isSavingModuleSettings, setIsSavingModuleSettings, toggleSettingsGrade, toggleSettingsSubject, toggleSettingsSchool, selectAllSettingsSchools, titleInputRef, jsonInputRef, moduleEditHref, tokenKey, exams, directQuestions, standaloneQuestions, collectionTargets, questions, exportExamData, exportExamJson, importExamJson, createExam, createSubModule, deleteSubModule, deleteExam, collectQuestions, getAuthToken, fetchAvailableDestinations, openMoveModal, handleConfirmMove, openMoveAllModal, handleConfirmMoveAll, handleOpenModuleSettings, handleSaveModuleSettings };
}
