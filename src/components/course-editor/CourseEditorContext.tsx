"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, apiFetch } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { offlineSync } from "@/lib/offlineSync";
import { buildCourseLessonSummary } from "@/lib/courseLessonSummary";

export interface CourseData {
  title: string;
  description: string;
  coverImage: string;
  grades: string[];
  subject: string;
  country: string;
  isCentral: boolean;
  schoolId: string;
  schoolIds: string[];
}

export interface Lesson {
  id?: string;
  title: string;
  domain: string;
  videoUrl: string;
  summary: string;
  notes: string;
  standards: string;
  indicators: string;
  learningOutcomes: string;
  isVisible: boolean;
  publishDate: string;
  cutOffDate: string;
  slides: any[];
  questions: any[];
  assignments: any[];
  attachments: any[];
  createdAt?: string | Date;
  slidesCount?: number;
  isContentLoaded?: boolean;
}

interface CourseEditorContextType {
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN";
  courseId: string | null;
  schoolIdParam: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  schools: any[];
  isAutoSaveEnabled: boolean;
  setIsAutoSaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  lastAutoSave: Date | null;
  setLastAutoSave: React.Dispatch<React.SetStateAction<Date | null>>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  courseData: CourseData;
  setCourseData: React.Dispatch<React.SetStateAction<CourseData>>;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  exams: any[];
  setExams: React.Dispatch<React.SetStateAction<any[]>>;
  activeContentTab: "lessons";
  isLessonModalOpen: boolean;
  isLessonContentLoading: boolean;
  availableMetadata: { domains: string[]; standards: string[]; indicators: string[]; outcomes: string[] };
  setAvailableMetadata: React.Dispatch<React.SetStateAction<{ domains: string[]; standards: string[]; indicators: string[]; outcomes: string[] }>>;
  setIsLessonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBankModalOpen: boolean;
  setIsBankModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isQuestionBankModalOpen: boolean;
  setIsQuestionBankModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bankItems: any[];
  setBankItems: React.Dispatch<React.SetStateAction<any[]>>;
  bankQuestions: any[];
  setBankQuestions: React.Dispatch<React.SetStateAction<any[]>>;
  editingLessonIndex: number | null;
  setEditingLessonIndex: React.Dispatch<React.SetStateAction<number | null>>;
  currentLesson: Lesson;
  setCurrentLesson: React.Dispatch<React.SetStateAction<Lesson>>;
  activeTab: "info" | "slides" | "exercises" | "assignments" | "attachments" | "scheduling";
  setActiveTab: React.Dispatch<React.SetStateAction<"info" | "slides" | "exercises" | "assignments" | "attachments" | "scheduling">>;
  showQuestionForm: boolean;
  setShowQuestionForm: React.Dispatch<React.SetStateAction<boolean>>;
  editingQuestionIndex: number | null;
  setEditingQuestionIndex: React.Dispatch<React.SetStateAction<number | null>>;
  questionSource: "assignments" | "questions";
  setQuestionSource: React.Dispatch<React.SetStateAction<"assignments" | "questions">>;
  tempQuestion: any;
  setTempQuestion: React.Dispatch<React.SetStateAction<any>>;
  openDropdownId: string | null;
  setOpenDropdownId: React.Dispatch<React.SetStateAction<string | null>>;
  metadataExcelRef: React.RefObject<HTMLInputElement | null>;
  questionsExcelRef: React.RefObject<HTMLInputElement | null>;
  assignmentsExcelRef: React.RefObject<HTMLInputElement | null>;

  // Handlers
  fetchCourseData: (token: string, id: string) => Promise<void>;
  toggleCourseSchool: (id: string) => void;
  selectAllSchools: () => void;
  handleRemoveLesson: (index: number) => void;
  openAddLessonModal: () => void;
  openEditLessonModal: (index: number) => void;
  openBankModal: () => Promise<void>;
  openQuestionBankModal: () => Promise<void>;
  addQuestionFromBank: (q: any) => void;
  saveLesson: () => Promise<void>;
  handleSubmit: (e?: React.FormEvent, isAutoSave?: boolean) => Promise<void>;
  handleDeleteCourse: () => Promise<void>;
  linkExamToCourse: (examId: string) => Promise<void>;
  // Draft backup
  hasDraft: boolean;
  draftSavedAt: string | null;
  restoreFromDraft: () => Promise<void>;
  clearDraft: () => void;
  isSettingsHidden: boolean;
  setIsSettingsHidden: React.Dispatch<React.SetStateAction<boolean>>;
}

const CourseEditorContext = createContext<CourseEditorContextType | undefined>(undefined);

export const CourseEditorProvider: React.FC<{
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN";
  children: React.ReactNode;
}> = ({ role, children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const { language } = useLanguage();
  const courseId = searchParams.get("id");
  const schoolIdParam = searchParams.get("schoolId");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialLoadDoneRef = useRef(false);
  const userEditedRef = useRef(false);
  const [isSettingsHidden, setIsSettingsHidden] = useState(true);

  const [courseData, setCourseData] = useState<CourseData>({
    title: "",
    description: "",
    coverImage: "",
    grades: [] as string[],
    subject: "",
    country: "مصر",
    isCentral: false,
    schoolId: schoolIdParam || "",
    schoolIds: (schoolIdParam ? [schoolIdParam] : []) as string[],
  });

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const serializeLessonContent = (lesson: Lesson, field: "attachments" | "slides" | "questions" | "assignments") => {
    // Existing lessons from the fast list are summaries. Never overwrite their
    // stored JSON with the empty placeholder arrays before opening that lesson.
    if (lesson.id && lesson.isContentLoaded !== true) return undefined;
    return JSON.stringify(lesson[field] || []);
  };
  const lessonsRef = useRef<Lesson[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [activeContentTab] = useState<"lessons">("lessons");
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isLessonContentLoading, setIsLessonContentLoading] = useState(false);
  const [availableMetadata, setAvailableMetadata] = useState({ domains: [] as string[], standards: [] as string[], indicators: [] as string[], outcomes: [] as string[] });
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  const [currentLesson, setCurrentLesson] = useState<Lesson>({
    title: "",
    domain: "",
    videoUrl: "",
    summary: "",
    notes: "",
    standards: "",
    indicators: "",
    learningOutcomes: "",
    isVisible: true,
    publishDate: "",
    cutOffDate: "",
    slides: [
      {
        id: Date.now(),
        type: "TEXT",
        label: "CONTENT",
        title: language === "ar" ? "المقدمة" : "Introduction",
        content: "",
        sections: [],
      },
    ],
    questions: [],
    assignments: [],
    attachments: [],
  });

  const [activeTab, setActiveTab] = useState<"info" | "slides" | "exercises" | "assignments" | "attachments" | "scheduling">("info");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionSource, setQuestionSource] = useState<"assignments" | "questions">("questions");
  const [tempQuestion, setTempQuestion] = useState<any>({
    text: "",
    type: "MCQ",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1,
    xpPoints: 10,
    skill: "General",
    level: "Medium",
    dok: "",
    learningOutcome: "",
    standard: "",
    indicator: "",
    sections: [],
    correctAnswers: [],
    attempts: 1,
  });

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const metadataExcelRef = useRef<HTMLInputElement>(null);
  const questionsExcelRef = useRef<HTMLInputElement>(null);
  const assignmentsExcelRef = useRef<HTMLInputElement>(null);

  const tokenKey = role === "SUPER_ADMIN" ? "super_admin_token" : "school_admin_token";
  // Ref to prevent draft auto-save from firing immediately after restore
  const justRestoredRef = useRef(false);
  const isSavingRef = useRef(false);
  const draftStorageWarningShownRef = useRef(false);

  const acquireSaveLock = async (waitForExistingSave: boolean) => {
    while (isSavingRef.current) {
      if (!waitForExistingSave) return false;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
    }
    isSavingRef.current = true;
    return true;
  };

  useEffect(() => {
    lessonsRef.current = lessons;
  }, [lessons]);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-dropdown-root="true"]')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
    if (!token) {
      router.push(role === "SUPER_ADMIN" ? "/super-admin/login" : "/school-admin/login");
      return;
    }
    if (courseId) {
      fetchCourseData(token, courseId);
    } else {
      setIsLoading(false);
      // Mark initial load done for new courses (no fetch needed)
      setTimeout(() => { initialLoadDoneRef.current = true; }, 100);
    }
  }, [courseId, role]);

  useEffect(() => {
    if (role !== "SUPER_ADMIN" || isSettingsHidden || schools.length > 0) return;
    const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
    if (token) fetchSchools(token);
  }, [role, isSettingsHidden, schools.length, tokenKey]);

  useEffect(() => {
    // Don't flag unsaved changes during initial data load
    if (!isLoading && initialLoadDoneRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [courseData, lessons, currentLesson, isLoading]);

  // =============================================
  // 💾 EMERGENCY LOCAL DRAFT BACKUP
  // IndexedDB stores full lesson content; localStorage is only a fallback.
  // =============================================
  const DRAFT_KEY = courseId ? `lms_draft_course_${courseId}` : 'lms_draft_course_new';

  // Save draft on every lesson or slide change
  useEffect(() => {
    if (!DRAFT_KEY || isLoading) return;
    if (justRestoredRef.current) {
      justRestoredRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        try {
        const draft = {
          savedAt: new Date().toISOString(),
          courseId,
          lessons,
          currentLesson,
          courseData
        };
        const savedToIndexedDb = await offlineSync.saveDraft(DRAFT_KEY, draft);

        if (savedToIndexedDb) {
          // Do not duplicate large slide payloads in quota-limited localStorage.
          try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: draft.savedAt, courseId }));
          } catch {
            // IndexedDB already has the recoverable draft.
          }
          return;
        }

        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (error) {
          console.warn("[CourseEditor] Failed to save local draft", error);
          if (!draftStorageWarningShownRef.current) {
            draftStorageWarningShownRef.current = true;
            showToast(
              language === "ar"
                ? "تعذر حفظ المسودة محليا. تأكد من وجود مساحة متاحة في المتصفح قبل إغلاق الصفحة."
                : "Local draft could not be saved. Please make sure browser storage has free space before closing this page.",
              "error"
            );
          }
        }
      })();
    }, 5_000); // 5 seconds debounce
    return () => clearTimeout(timer);
  }, [lessons, currentLesson, courseData, DRAFT_KEY, isLoading, language, showToast]);

  // Offer to restore draft if page was closed without saving
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  useEffect(() => {
    if (!DRAFT_KEY) return;
    void (async () => {
      try {
        const stored = await offlineSync.getDraft<any>(DRAFT_KEY);
        const legacy = stored?.payload || JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (legacy?.lessons?.length > 0 || legacy?.currentLesson) {
          setHasDraft(true);
          setDraftSavedAt(legacy.savedAt || stored?.savedAt || null);
        }
      } catch {}
    })();
  }, [DRAFT_KEY]);

  const restoreFromDraft = useCallback(async () => {
    if (!DRAFT_KEY) return;
    try {
      const stored = await offlineSync.getDraft<any>(DRAFT_KEY);
      const draft = stored?.payload || JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (!draft) return;
      if (draft?.lessons?.length > 0 || draft?.currentLesson) {
        justRestoredRef.current = true;
        if (draft.lessons?.length > 0) setLessons(draft.lessons);
        if (draft.currentLesson) setCurrentLesson(draft.currentLesson);
        localStorage.removeItem(DRAFT_KEY);
        void offlineSync.removeDraft(DRAFT_KEY);
        showToast(
          language === 'ar' ? `تم استرداد المسودة المحفوظة بتاريخ ${new Date(draft.savedAt).toLocaleString('ar')}` : `Draft from ${new Date(draft.savedAt).toLocaleString()} restored`,
          'success'
        );
        setHasDraft(false);
      }
    } catch {}
  }, [DRAFT_KEY, language, showToast]);

  const clearDraft = useCallback(() => {
    if (DRAFT_KEY) {
      localStorage.removeItem(DRAFT_KEY);
      void offlineSync.removeDraft(DRAFT_KEY);
    }
    setHasDraft(false);
  }, [DRAFT_KEY]);

  const fetchSchools = async (token: string) => {
    try {
      const res = await apiFetch(`${API_URL}/admin/schools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : data.schools || []);
      }
    } catch (error) {
      console.error("Failed to fetch schools");
    }
  };

  const toggleCourseSchool = (id: string) => {
    const current = courseData.schoolIds || [];
    if (current.includes(id)) {
      setCourseData({ ...courseData, schoolIds: current.filter((s) => s !== id) });
    } else {
      setCourseData({ ...courseData, schoolIds: [...current, id] });
    }
  };

  const selectAllSchools = () => {
    if ((courseData.schoolIds || []).length === schools.length) {
      setCourseData({ ...courseData, schoolIds: [] });
    } else {
      setCourseData({ ...courseData, schoolIds: schools.map((s) => s.id) });
    }
  };

  const fetchCourseData = async (token: string, id: string) => {
    try {
      const res = await apiFetch(`${API_URL}/courses/${id}?summary=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        let parsedGrades = ["High School"];
        try {
          if (data.grades && typeof data.grades === "string") {
            parsedGrades = JSON.parse(data.grades);
          } else if (Array.isArray(data.grades)) {
            parsedGrades = data.grades;
          } else if (data.grade) {
            parsedGrades = [data.grade];
          }
        } catch (e) {
          parsedGrades = data.grade ? [data.grade] : ["High School"];
        }

        const forwardGradeMap: { [key: string]: string } = {
          "1st Primary": "الصف الأول الابتدائي",
          "2nd Primary": "الصف الثاني الابتدائي",
          "3rd Primary": "الصف الثالث الابتدائي",
          "4th Primary": "الصف الرابع الابتدائي",
          "5th Primary": "الصف الخامس الابتدائي",
          "6th Primary": "الصف السادس الابتدائي",
          "1st Prep": "الصف الأول الإعدادي",
          "2nd Prep": "الصف الثاني الإعدادي",
          "3rd Prep": "الصف الثالث الإعدادي",
          "1st Secondary": "الصف الأول الثانوي",
          "2nd Secondary": "الصف الثاني الثانوي",
          "3rd Secondary": "الصف الثالث الثانوي",
        };

        const expandedGrades: string[] = [];
        parsedGrades.forEach((g) => {
          const mapped = forwardGradeMap[g] || g;
          if (mapped === "Elementary") {
            expandedGrades.push(
              "الصف الأول الابتدائي",
              "الصف الثاني الابتدائي",
              "الصف الثالث الابتدائي",
              "الصف الرابع الابتدائي",
              "الصف الخامس الابتدائي",
              "الصف السادس الابتدائي"
            );
          } else if (mapped === "Middle School") {
            expandedGrades.push("الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي");
          } else if (mapped === "High School") {
            expandedGrades.push("الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي");
          } else {
            expandedGrades.push(mapped);
          }
        });
        parsedGrades = Array.from(new Set(expandedGrades));

        setCourseData({
          title: data.title,
          description: data.description || "",
          coverImage: data.coverImage || "",
          grades: parsedGrades,
          subject: data.subject || "",
          country: data.country || "مصر",
          isCentral: data.isCentral,
          schoolId: data.schoolId || "",
          schoolIds: data.schools && data.schools.length > 0 ? data.schools.map((s: any) => s.id) : data.schoolId ? [data.schoolId] : [],
        });

        setExams(data.exams || []);

        const rawLessons = (data.lessons || []).slice().sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        if (data.lessonsAreSummaries || rawLessons.some((lesson: any) => lesson.slidesCount !== undefined && lesson.slides === undefined)) {
          setLessons(rawLessons.map((lesson: any) => ({
            ...buildCourseLessonSummary(lesson),
            slides: [],
            questions: [],
            assignments: [],
            attachments: [],
          })) as Lesson[]);

          // Render the lesson list first; JSON slide counts are fetched separately.
          void apiFetch(`${API_URL}/courses/${id}?summary=true&includeSlideCounts=true&countsOnly=true`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((response) => response.ok ? response.json() : null)
            .then((countsData) => {
              const countsByLessonId = new Map<string, number>(
                (countsData?.lessonSlideCounts || []).map((item: any): [string, number] => [
                  String(item.id),
                  Number(item.slidesCount) || 0,
                ]),
              );
              if (countsByLessonId.size === 0) return;
              setLessons((currentLessons) => currentLessons.map((lesson) => (
                lesson.id && countsByLessonId.has(lesson.id)
                  ? { ...lesson, slidesCount: countsByLessonId.get(lesson.id)! }
                  : lesson
              )));
            })
            .catch(() => {
              // The list is still usable if the optional counts request fails.
            });
        } else setLessons(
          rawLessons.filter(Boolean).map((l: any) => {
            let parsedQuestions = [];
            let parsedAssignments = [];
            let parsedAttachments = [];
            let parsedSlides = [];

            try {
              parsedQuestions = typeof l.questions === "string" ? JSON.parse(l.questions) : l.questions || [];
            } catch (e) {
              parsedQuestions = [];
            }

            try {
              parsedAssignments = typeof l.assignments === "string" ? JSON.parse(l.assignments) : l.assignments || [];
            } catch (e) {
              parsedAssignments = [];
            }

            try {
              parsedAttachments = typeof l.attachments === "string" ? JSON.parse(l.attachments) : l.attachments || [];
            } catch (e) {
              parsedAttachments = [];
            }

            try {
              parsedSlides = typeof l.slides === "string" ? JSON.parse(l.slides) : (l.slides || []);
            } catch (e) {
              parsedSlides = [];
            }

            return {
              ...l,
              id: l.id || l._id,
              isVisible: l.isVisible !== undefined ? l.isVisible : true,
              publishDate: l.publishDate && !isNaN(new Date(l.publishDate).getTime()) ? new Date(new Date(l.publishDate).getTime() - new Date(l.publishDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
              cutOffDate: l.cutOffDate && !isNaN(new Date(l.cutOffDate).getTime()) ? new Date(new Date(l.cutOffDate).getTime() - new Date(l.cutOffDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
              questions: Array.isArray(parsedQuestions)
                ? parsedQuestions.filter(Boolean).map((q) => {
                    let parsedExps = [""];
                    try {
                      parsedExps = typeof q.explanation === "string" && q.explanation.startsWith("[") ? JSON.parse(q.explanation) : q.explanations || [""];
                      if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                    } catch (e) {
                      parsedExps = [q.explanation || ""];
                    }
                    let parsedSections = q.sections;
                    if (typeof parsedSections === "string") {
                      try { parsedSections = JSON.parse(parsedSections); } catch(e) { parsedSections = []; }
                    }
                    if (!Array.isArray(parsedSections)) parsedSections = [];

                    let parsedOptions = q.options;
                    if (typeof parsedOptions === "string") {
                      try { parsedOptions = JSON.parse(parsedOptions); } catch(e) { parsedOptions = []; }
                    }
                    if (!Array.isArray(parsedOptions)) parsedOptions = [];

                    let parsedCorrectAnswers = q.correctAnswers;
                    if (typeof parsedCorrectAnswers === "string") {
                      try { parsedCorrectAnswers = JSON.parse(parsedCorrectAnswers); } catch(e) { parsedCorrectAnswers = []; }
                    }
                    if (!Array.isArray(parsedCorrectAnswers) || parsedCorrectAnswers.length === 0) {
                      if (q.type === 'MULTI_SELECT' && q.correctAnswer) {
                        try {
                          parsedCorrectAnswers = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
                        } catch(e) {
                          parsedCorrectAnswers = typeof q.correctAnswer === 'string' ? q.correctAnswer.split(',').map((s: string) => s.trim()) : [];
                        }
                      } else {
                        parsedCorrectAnswers = [];
                      }
                    }
                    if (!Array.isArray(parsedCorrectAnswers)) parsedCorrectAnswers = [];

                    return { ...q, explanations: parsedExps, sections: parsedSections, options: parsedOptions, correctAnswers: parsedCorrectAnswers };
                  })
                : [],
              assignments: Array.isArray(parsedAssignments)
                ? parsedAssignments.filter(Boolean).map((q) => {
                    let parsedExps = [""];
                    try {
                      parsedExps = typeof q.explanation === "string" && q.explanation.startsWith("[") ? JSON.parse(q.explanation) : q.explanations || [""];
                      if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                    } catch (e) {
                      parsedExps = [q.explanation || ""];
                    }
                    let parsedSections = q.sections;
                    if (typeof parsedSections === "string") {
                      try { parsedSections = JSON.parse(parsedSections); } catch(e) { parsedSections = []; }
                    }
                    if (!Array.isArray(parsedSections)) parsedSections = [];

                    let parsedOptions = q.options;
                    if (typeof parsedOptions === "string") {
                      try { parsedOptions = JSON.parse(parsedOptions); } catch(e) { parsedOptions = []; }
                    }
                    if (!Array.isArray(parsedOptions)) parsedOptions = [];

                    let parsedCorrectAnswers = q.correctAnswers;
                    if (typeof parsedCorrectAnswers === "string") {
                      try { parsedCorrectAnswers = JSON.parse(parsedCorrectAnswers); } catch(e) { parsedCorrectAnswers = []; }
                    }
                    if (!Array.isArray(parsedCorrectAnswers) || parsedCorrectAnswers.length === 0) {
                      if (q.type === 'MULTI_SELECT' && q.correctAnswer) {
                        try {
                          parsedCorrectAnswers = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
                        } catch(e) {
                          parsedCorrectAnswers = typeof q.correctAnswer === 'string' ? q.correctAnswer.split(',').map((s: string) => s.trim()) : [];
                        }
                      } else {
                        parsedCorrectAnswers = [];
                      }
                    }
                    if (!Array.isArray(parsedCorrectAnswers)) parsedCorrectAnswers = [];

                    return { ...q, explanations: parsedExps, sections: parsedSections, options: parsedOptions, correctAnswers: parsedCorrectAnswers };
                  })
                : [],
              attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
              slides: (Array.isArray(parsedSlides) && parsedSlides.length ? parsedSlides : [{ id: Date.now(), type: "TEXT", label: "CONTENT", title: language === "ar" ? "المقدمة" : "Introduction", content: "", sections: [] }]).filter(Boolean).map((slide: any) => {
                let parsedSections = slide.sections;
                if (typeof parsedSections === "string") {
                  try { parsedSections = JSON.parse(parsedSections); } catch(e) { parsedSections = []; }
                }
                if (!Array.isArray(parsedSections)) parsedSections = [];
                return { ...slide, id: slide.id || slide._id, sections: parsedSections };
              }),
            };
          })
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || errData.message || (language === "ar" ? "فشل تحميل بيانات الكورس" : "Failed to load course details"), "error");
      }
    } catch (error) {
      console.error("[fetchCourseData] Detailed Error:", error);
      showToast(language === "ar" ? "خطأ في الاتصال" : "Connection error", "error");
    } finally {
      setIsLoading(false);
      // Mark initial load complete after a brief delay so state updates from fetch are settled
      setTimeout(() => { initialLoadDoneRef.current = true; }, 200);
    }
  };

  const handleRemoveLesson = async (index: number) => {
    const lesson = lessons[index];
    
    // 1. If it's a new, unsaved lesson, just remove it locally
    if (!lesson.id || String(lesson.id).length < 5) {
      const newLessons = [...lessons];
      newLessons.splice(index, 1);
      setLessons(newLessons);
      return;
    }
    
    // 2. If it's an existing lesson, it requires an API call to delete
    if (role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN" && role !== "TEACHER") {
      showToast(language === "ar" ? "ليس لديك صلاحية لحذف الدروس" : "You do not have permission to delete lessons", "error");
      return;
    }
    
    if (!window.confirm(language === "ar" ? "هل أنت متأكد من حذف هذا الدرس نهائياً؟" : "Are you sure you want to delete this lesson permanently?")) return;
    
    try {
      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
      const res = await apiFetch(`${API_URL}/lessons/${lesson.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        showToast(language === "ar" ? "تم حذف الدرس بنجاح" : "Lesson deleted successfully", "success");
        const newLessons = [...lessons];
        newLessons.splice(index, 1);
        setLessons(newLessons);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || (language === "ar" ? "فشل حذف الدرس" : "Failed to delete lesson"), "error");
      }
    } catch (e) {
      showToast(language === "ar" ? "خطأ في الاتصال" : "Connection error", "error");
    }
  };

  const openAddLessonModal = () => {
    setEditingLessonIndex(null);
    // ✅ FIX: Always reset currentLesson to a clean blank state for a NEW lesson.
    // We use a unique timestamp-based ID for the intro slide to avoid conflicts.
    setCurrentLesson({
      title: "",
      domain: "",
      videoUrl: "",
      summary: "",
      notes: "",
      standards: "",
      indicators: "",
      learningOutcomes: "",
      isVisible: true,
      publishDate: "",
      cutOffDate: "",
      slides: [
        {
          id: Date.now(),
          type: "TEXT",
          label: "CONTENT",
          title: language === "ar" ? "المقدمة" : "Introduction",
          content: "",
          sections: [],
        },
      ],
      questions: [],
      assignments: [],
      attachments: [],
    });
    setActiveTab("info");
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = async (index: number) => {
    setEditingLessonIndex(index);
    const lessonSummary = lessons[index];
    if (!lessonSummary) return;
    let lessonToEdit: any = { ...lessonSummary };

    if (lessonSummary.id && !lessonSummary.isContentLoaded) {
      // Open immediately so the user gets visible feedback while large lessons load.
      setCurrentLesson({ ...lessonSummary, slides: [], questions: [], assignments: [], attachments: [] });
      setActiveTab("info");
      setIsLessonModalOpen(true);
      setIsLessonContentLoading(true);
      try {
        const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
        const response = await apiFetch(`${API_URL}/lessons/${lessonSummary.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("lesson fetch failed");
        const lesson = await response.json();
        const parseArray = (value: any) => {
          if (Array.isArray(value)) return value;
          try { return JSON.parse(value || "[]"); } catch { return []; }
        };
        lessonToEdit = {
          ...lesson,
          isContentLoaded: true,
          publishDate: lesson.publishDate ? new Date(lesson.publishDate).toISOString().slice(0, 16) : "",
          cutOffDate: lesson.cutOffDate ? new Date(lesson.cutOffDate).toISOString().slice(0, 16) : "",
          slides: parseArray(lesson.slides),
          questions: parseArray(lesson.questions),
          assignments: parseArray(lesson.assignments),
          attachments: parseArray(lesson.attachments),
        };
      } catch (error) {
        showToast(language === "ar" ? "تعذر تحميل محتوى الدرس" : "Failed to load lesson content", "error");
        setIsLessonModalOpen(false);
        return;
      } finally {
        setIsLessonContentLoading(false);
      }
    }
    if (!lessonToEdit.slides || lessonToEdit.slides.length === 0) {
      lessonToEdit.slides = [
        {
          id: Date.now(),
          type: "TEXT",
          label: "CONTENT",
          title: language === "ar" ? "المقدمة" : "Introduction",
          content: "",
          sections: [],
        },
      ];
    }
    setCurrentLesson(lessonToEdit);
    setActiveTab("info");
    setIsLessonModalOpen(true);
    setIsLessonContentLoading(false);
  };

  const openBankModal = async () => {
    try {
      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
      const res = await apiFetch(`${API_URL}/exams?isCentral=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBankItems(await res.json());
        setIsBankModalOpen(true);
      }
    } catch (e) {
      showToast(language === "ar" ? "فشل فتح بنك الأسئلة" : "Failed to open question bank", "error");
    }
  };

  const openQuestionBankModal = async () => {
    showToast(language === "ar" ? "جاري فتح بنك الأسئلة المركزي..." : "Opening Central Question Bank...", "info");
    try {
      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
      const res = await apiFetch(`${API_URL}/bank/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBankQuestions(await res.json());
        setIsQuestionBankModalOpen(true);
      }
    } catch (e) {
      showToast(language === "ar" ? "فشل فتح بنك الأسئلة" : "Failed to open question bank", "error");
    }
  };

  const addQuestionFromBank = (q: any) => {
    const newQuestions = [...(currentLesson.questions || [])];
    newQuestions.push({
      text: q.text,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: q.points,
      explanation: q.explanation,
      skill: q.skill,
      level: q.level,
    });
    setCurrentLesson({ ...currentLesson, questions: newQuestions });
    showToast(language === "ar" ? "تم إضافة السؤال للدرس" : "Question added to lesson", "success");
  };

  const saveLesson = async () => {
    if (!currentLesson.title) {
      showToast(language === "ar" ? "يجب إدخال عنوان الدرس" : "Lesson title is required", "error");
      return;
    }
    const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
    if (!token || !courseId) {
      setLessons((prev) => {
        const next = [...prev];
        if (editingLessonIndex !== null) next[editingLessonIndex] = currentLesson;
        else next.push(currentLesson);
        return next;
      });
      setIsLessonModalOpen(false);
      return;
    }

    await acquireSaveLock(true);

    // 🔒 FIX: Force-sync the ref to current state immediately before snapshotting.
    // lessonsRef updates via useEffect which fires AFTER render, so it can be
    // one cycle stale. Syncing here prevents old snapshots that miss lessons.
    lessonsRef.current = lessons;

    const snapshotLessons = [...lessonsRef.current];
    if (editingLessonIndex !== null) snapshotLessons[editingLessonIndex] = currentLesson;
    else snapshotLessons.push(currentLesson);

    try {
      const targetSchoolIds = (courseData.schoolIds || []).filter(Boolean);

      const deduplicatedLessons = snapshotLessons.filter((l, idx, arr) => {
        if (!l.id) return true;
        return arr.findIndex(other => other.id === l.id) === idx;
      });

      const res = await apiFetch(`${API_URL}/school/courses/${courseId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...courseData,
          isCentral: role === "SUPER_ADMIN" ? targetSchoolIds.length === 0 : false,
          schoolId: role === "SUPER_ADMIN" ? (targetSchoolIds.length > 0 ? targetSchoolIds[0] : null) : schoolIdParam,
          schoolIds: role === "SUPER_ADMIN" ? targetSchoolIds : [schoolIdParam],
          lessons: deduplicatedLessons.map((l) => ({
            id: l.id,
            title: l.title,
            domain: l.domain || null,
            videoUrl: l.videoUrl || null,
            summary: l.summary || null,
            notes: l.notes || null,
            standards: l.standards || null,
            indicators: l.indicators || null,
            learningOutcomes: l.learningOutcomes || null,
            isVisible: l.isVisible !== undefined ? l.isVisible : true,
            publishDate: l.publishDate ? new Date(l.publishDate).toISOString() : null,
            cutOffDate: l.cutOffDate ? new Date(l.cutOffDate).toISOString() : null,
            attachments: serializeLessonContent(l, "attachments"),
            slides: serializeLessonContent(l, "slides"),
            questions: serializeLessonContent(l, "questions"),
            assignments: serializeLessonContent(l, "assignments"),
          })),
        }),
      });

      if (res.ok) {
        clearDraft(); // clear emergency draft after successful save
        const data = await res.json().catch(() => ({}));

        // ✅ SAFE MERGE: Update local lessons with server data.
        // We do NOT blindly replace — we merge server IDs into local state
        // and preserve any local lessons not returned by server (race condition guard).
        if (data && data.lessons && Array.isArray(data.lessons)) {
          const parsed = data.lessons.map((pl: any) => {
            let parsedSlides: any[] = [];
            let parsedQuestions: any[] = [];
            let parsedAssignments: any[] = [];
            let parsedAttachments: any[] = [];
            try { parsedSlides = typeof pl.slides === 'string' ? JSON.parse(pl.slides) : (pl.slides || []); } catch { parsedSlides = []; }
            try { parsedQuestions = typeof pl.questions === 'string' ? JSON.parse(pl.questions) : (pl.questions || []); } catch { parsedQuestions = []; }
            try { parsedAssignments = typeof pl.assignments === 'string' ? JSON.parse(pl.assignments) : (pl.assignments || []); } catch { parsedAssignments = []; }
            try { parsedAttachments = typeof pl.attachments === 'string' ? JSON.parse(pl.attachments) : (pl.attachments || []); } catch { parsedAttachments = []; }
            return {
              ...pl,
              slides: Array.isArray(parsedSlides) ? parsedSlides : [],
              questions: Array.isArray(parsedQuestions) ? parsedQuestions : [],
              assignments: Array.isArray(parsedAssignments) ? parsedAssignments : [],
              attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
            };
          });

          const currentLessonId = currentLesson.id;
          const currentLessonTitle = currentLesson.title;

          // Find the server lesson matching the one we just saved
          const matchedServerLesson = parsed.find((pl: any) => {
            if (currentLessonId && pl.id === currentLessonId) return true;
            if (!currentLessonId && pl.title === currentLessonTitle) return true;
            return false;
          });

          // Sync server-assigned ID back to currentLesson (prevents duplicate creation on next save)
          if (matchedServerLesson?.id && matchedServerLesson.id !== currentLessonId) {
            setCurrentLesson((prev: any) => ({
              ...prev,
              id: matchedServerLesson.id,
              slides: prev.slides?.length > 0 ? prev.slides : matchedServerLesson.slides,
              questions: prev.questions?.length > 0 ? prev.questions : matchedServerLesson.questions,
              assignments: prev.assignments?.length > 0 ? prev.assignments : matchedServerLesson.assignments,
            }));
          }

          // Update lessons ref and state using safe merge
          setLessons((prevLessons: Lesson[]) => {
            const serverIds = new Set(parsed.map((pl: any) => pl.id).filter(Boolean));

            const serverMapped = parsed.map((pl: any) => {
              const isEditedLesson =
                (currentLessonId && pl.id === currentLessonId) ||
                (!currentLessonId && pl.title === currentLessonTitle);

              if (isEditedLesson) {
                // Prefer local content (always fresher), fall back to server
                return {
                  ...pl,
                  id: pl.id,
                  slides: currentLesson.slides?.length > 0 ? currentLesson.slides : pl.slides,
                  questions: currentLesson.questions?.length > 0 ? currentLesson.questions : pl.questions,
                  assignments: currentLesson.assignments?.length > 0 ? currentLesson.assignments : pl.assignments,
                  attachments: currentLesson.attachments?.length > 0 ? currentLesson.attachments : pl.attachments,
                };
              }

              // For other lessons: keep local content if richer than server snapshot
              const localLesson = prevLessons.find((ll: Lesson) => ll.id && ll.id === pl.id);
              if (localLesson) {
                return {
                  ...pl,
                  slides: localLesson.slides?.length > 0 ? localLesson.slides : pl.slides,
                  questions: localLesson.questions?.length > 0 ? localLesson.questions : pl.questions,
                  assignments: localLesson.assignments?.length > 0 ? localLesson.assignments : pl.assignments,
                  attachments: localLesson.attachments?.length > 0 ? localLesson.attachments : pl.attachments,
                };
              }
              return pl;
            });

            // ✅ KEY FIX: Preserve local lessons NOT in the server response
            // (they may have been omitted due to timing / race conditions)
            const localOnlyLessons = prevLessons.filter(
              (ll: Lesson) => ll.id && !serverIds.has(ll.id)
            );

            const merged = [...serverMapped, ...localOnlyLessons];
            lessonsRef.current = merged;
            return merged;
          });
        } else {
          // Server returned no lessons array — update local state from snapshot
          lessonsRef.current = snapshotLessons;
          setLessons(snapshotLessons);
        }

        showToast(language === "ar" ? "تم حفظ الدرس ونشره تلقائياً ✅" : "Lesson saved and published automatically ✅", "success");
      } else {
        const errBody = await res.json().catch(() => ({}));
        // ── Offline / server-down: enqueue for auto-retry ────────────────────
        if (res.status >= 500 || !navigator.onLine) {
          const tokenOffline = localStorage.getItem(tokenKey) || localStorage.getItem("token") || "";
          const targetSchoolIds2 = (courseData.schoolIds || []).filter(Boolean);
          const deduplicatedLessons2 = snapshotLessons.filter((l, idx, arr) => {
            if (!l.id) return true;
            return arr.findIndex(other => other.id === l.id) === idx;
          });
          offlineSync.enqueue({
            url: `${API_URL}/school/courses/${courseId}`,
            method: "PUT",
            headers: { Authorization: `Bearer ${tokenOffline}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              ...courseData,
              isCentral: role === "SUPER_ADMIN" ? targetSchoolIds2.length === 0 : false,
              schoolId: role === "SUPER_ADMIN" ? (targetSchoolIds2.length > 0 ? targetSchoolIds2[0] : null) : schoolIdParam,
              schoolIds: role === "SUPER_ADMIN" ? targetSchoolIds2 : [schoolIdParam],
              lessons: deduplicatedLessons2.map((l) => ({
                id: l.id, title: l.title, domain: l.domain || null, videoUrl: l.videoUrl || null,
                summary: l.summary || null, notes: l.notes || null, standards: l.standards || null,
                indicators: l.indicators || null, learningOutcomes: l.learningOutcomes || null,
                isVisible: l.isVisible !== undefined ? l.isVisible : true,
                publishDate: l.publishDate ? new Date(l.publishDate).toISOString() : null,
                cutOffDate: l.cutOffDate ? new Date(l.cutOffDate).toISOString() : null,
            attachments: serializeLessonContent(l, "attachments"),
            slides: serializeLessonContent(l, "slides"),
            questions: serializeLessonContent(l, "questions"),
            assignments: serializeLessonContent(l, "assignments"),
              })),
            }),
            label: language === "ar" ? `درس: ${currentLesson.title}` : `Lesson: ${currentLesson.title}`,
          });
          // Update local state so UI reflects the snapshot
          lessonsRef.current = snapshotLessons;
          setLessons(snapshotLessons);
          showToast(
            language === "ar"
              ? "السيرفر غير متاح - تم حفظ التغييرات محلياً وسترفع تلقائياً ✅"
              : "Server unavailable - changes saved locally and will upload automatically ✅",
            "info"
          );
        } else if (errBody?.details?.includes('SAFETY_BLOCK')) {
          showToast(language === "ar" ? "حدث خطأ في بيانات الدروس - تم الحفظ محلياً" : "Data integrity error - saved locally only", "error");
        } else {
          showToast(language === "ar" ? "تم الحفظ محلياً لكن فشل النشر - تأكد من الاتصال" : "Saved locally but publication failed - check connection", "error");
        }
      }
    } catch (error: any) {
      console.error("Auto-save error:", error);
      // Network error — enqueue for later retry
      if (!navigator.onLine || error?.message?.includes('fetch')) {
        const tokenOffline2 = localStorage.getItem(tokenKey) || localStorage.getItem("token") || "";
        const targetSchoolIds3 = (courseData.schoolIds || []).filter(Boolean);
        const deduplicatedLessons3 = snapshotLessons.filter((l, idx, arr) => {
          if (!l.id) return true;
          return arr.findIndex(other => other.id === l.id) === idx;
        });
        offlineSync.enqueue({
          url: `${API_URL}/school/courses/${courseId}`,
          method: "PUT",
          headers: { Authorization: `Bearer ${tokenOffline2}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            ...courseData,
            isCentral: role === "SUPER_ADMIN" ? targetSchoolIds3.length === 0 : false,
            schoolId: role === "SUPER_ADMIN" ? (targetSchoolIds3.length > 0 ? targetSchoolIds3[0] : null) : schoolIdParam,
            schoolIds: role === "SUPER_ADMIN" ? targetSchoolIds3 : [schoolIdParam],
            lessons: deduplicatedLessons3.map((l) => ({
              id: l.id, title: l.title, domain: l.domain || null, videoUrl: l.videoUrl || null,
              summary: l.summary || null, notes: l.notes || null, standards: l.standards || null,
              indicators: l.indicators || null, learningOutcomes: l.learningOutcomes || null,
              isVisible: l.isVisible !== undefined ? l.isVisible : true,
              publishDate: l.publishDate ? new Date(l.publishDate).toISOString() : null,
              cutOffDate: l.cutOffDate ? new Date(l.cutOffDate).toISOString() : null,
            attachments: serializeLessonContent(l, "attachments"),
            slides: serializeLessonContent(l, "slides"),
            questions: serializeLessonContent(l, "questions"),
            assignments: serializeLessonContent(l, "assignments"),
            })),
          }),
          label: language === "ar" ? `درس: ${currentLesson.title}` : `Lesson: ${currentLesson.title}`,
        });
        // Reflect snapshot in local state
        lessonsRef.current = snapshotLessons;
        setLessons(snapshotLessons);
        showToast(
          language === "ar"
            ? "لا يوجد اتصال - تم حفظ التغييرات محلياً وسترفع تلقائياً ✅"
            : "No connection - changes saved locally and will upload automatically ✅",
          "info"
        );
      } else {
        showToast(language === "ar" ? "تم الحفظ محلياً لكن فشل النشر" : "Saved locally but publication failed", "error");
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleSubmit = async (e?: React.FormEvent, isAutoSave = false) => {
    if (e) e.preventDefault();
    if (!courseData.title) {
      if (!isAutoSave) showToast(language === "ar" ? "عنوان الكورس مطلوب" : "Course title is required", "error");
      return;
    }
    // Autosave can be coalesced while another write is active. An explicit save
    // must wait, otherwise the click appears to do nothing and the latest data is lost.
    if (!(await acquireSaveLock(!isAutoSave))) return;
    setIsSubmitting(true);
    const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");

    try {
      const targetSchoolIds = (courseData.schoolIds || []).filter(Boolean);

      // 🔒 FIX: Force-sync the ref to current state immediately before snapshotting.
      lessonsRef.current = lessons;

      // 🛡️ SAFETY: If lesson modal is open, merge currentLesson into lessons before saving
      // BUT during autosave, do NOT include NEW lessons (no ID) - they should only be saved
      // when the user explicitly clicks Save Lesson. This prevents ghost lessons on Cancel.
      const lessonsToSend = [...lessons];
      if (isLessonModalOpen && currentLesson.title) {
        if (editingLessonIndex !== null && editingLessonIndex < lessonsToSend.length) {
          // Editing existing lesson - safe to merge during autosave
          lessonsToSend[editingLessonIndex] = currentLesson;
        } else if (editingLessonIndex === null && !isAutoSave) {
          // New lesson during manual save only - push if not already present
          const alreadyPresent = lessonsToSend.some(l => !l.id && l.title === currentLesson.title);
          if (!alreadyPresent) {
            lessonsToSend.push(currentLesson);
          }
        }
        // If editingLessonIndex === null && isAutoSave: skip - don't send new unsaved lesson
      }

      // ✅ ROOT CAUSE FIX: Deduplicate lessons by ID to prevent sending the same lesson twice.
      // If a lesson was just saved via autosave and is in the `lessons` array, but the modal
      // is still open, the above logic might push it again. Deduplication prevents this.
      const deduplicatedLessonsToSend = lessonsToSend.filter((l, idx, arr) => {
        if (!l.id) return true; // keep new (no-ID) lessons
        return arr.findIndex(other => other.id === l.id) === idx;
      });

      // 🛡️ SAFETY: Backend disabled deletion during course update, so empty lessons array is safe.

      const res = await apiFetch(`${API_URL}/school/courses/${courseId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...courseData,
          isCentral: role === "SUPER_ADMIN" ? targetSchoolIds.length === 0 : false,
          schoolId: role === "SUPER_ADMIN" ? (targetSchoolIds.length > 0 ? targetSchoolIds[0] : null) : schoolIdParam,
          schoolIds: role === "SUPER_ADMIN" ? targetSchoolIds : [schoolIdParam],
          lessons: deduplicatedLessonsToSend.map((l) => ({
            id: l.id,
            title: l.title,
            domain: l.domain || null,
            videoUrl: l.videoUrl || null,
            summary: l.summary || null,
            notes: l.notes || null,
            standards: l.standards || null,
            indicators: l.indicators || null,
            learningOutcomes: l.learningOutcomes || null,
            isVisible: l.isVisible !== undefined ? l.isVisible : true,
            publishDate: l.publishDate ? new Date(l.publishDate).toISOString() : null,
            cutOffDate: l.cutOffDate ? new Date(l.cutOffDate).toISOString() : null,
            attachments: serializeLessonContent(l, "attachments"),
            slides: serializeLessonContent(l, "slides"),
            questions: serializeLessonContent(l, "questions"),
            assignments: serializeLessonContent(l, "assignments"),
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsedLessons = data.lessons.map((l: any) => {
          let parsedQuestions = [];
          let parsedAssignments = [];
          let parsedAttachments = [];
          let parsedSlides = [];

          try {
            parsedQuestions = typeof l.questions === "string" ? JSON.parse(l.questions) : l.questions || [];
          } catch (e) {
            parsedQuestions = [];
          }
          try {
            parsedAssignments = typeof l.assignments === "string" ? JSON.parse(l.assignments) : l.assignments || [];
          } catch (e) {
            parsedAssignments = [];
          }
          try {
            parsedAttachments = typeof l.attachments === "string" ? JSON.parse(l.attachments) : l.attachments || [];
          } catch (e) {
            parsedAttachments = [];
          }
          try {
            parsedSlides = typeof l.slides === "string" ? JSON.parse(l.slides) : l.slides || [];
          } catch (e) {
            parsedSlides = [{ id: Date.now(), type: "TEXT", label: "CONTENT", title: language === "ar" ? "المقدمة" : "Introduction", content: "", sections: [] }];
          }

          return {
            ...l,
            id: l.id || l._id,
            isVisible: l.isVisible !== undefined ? l.isVisible : true,
            publishDate: l.publishDate && !isNaN(new Date(l.publishDate).getTime()) ? new Date(new Date(l.publishDate).getTime() - new Date(l.publishDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
            cutOffDate: l.cutOffDate && !isNaN(new Date(l.cutOffDate).getTime()) ? new Date(new Date(l.cutOffDate).getTime() - new Date(l.cutOffDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
            questions: Array.isArray(parsedQuestions)
              ? parsedQuestions.map((q) => {
                  let parsedExps = [""];
                  try {
                    parsedExps = typeof q.explanation === "string" && q.explanation.startsWith("[") ? JSON.parse(q.explanation) : q.explanations || [""];
                    if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                  } catch (e) {
                    parsedExps = [q.explanation || ""];
                  }
                  return { ...q, explanations: parsedExps };
                })
              : [],
            assignments: Array.isArray(parsedAssignments)
              ? parsedAssignments.map((q) => {
                  let parsedExps = [""];
                  try {
                    parsedExps = typeof q.explanation === "string" && q.explanation.startsWith("[") ? JSON.parse(q.explanation) : q.explanations || [""];
                    if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                  } catch (e) {
                    parsedExps = [q.explanation || ""];
                  }
                  return { ...q, explanations: parsedExps };
                })
              : [],
            attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
            slides: Array.isArray(parsedSlides) ? parsedSlides.map((slide: any) => ({ ...slide, id: slide.id || slide._id })) : [],
          };
        }).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

        if (isLessonModalOpen) {
          // 🔒 FIX: Find the server lesson by ID or title, NOT by positional index.
          // Using parsedLessons.length - 1 is unreliable because server orders by `order` field.
          const matchedServerLesson = parsedLessons.find((pl: any) => {
            if (currentLesson.id && pl.id === currentLesson.id) return true;
            if (!currentLesson.id && pl.title === currentLesson.title) return true;
            return false;
          });
          const idx = matchedServerLesson
            ? parsedLessons.findIndex((pl: any) => pl.id === matchedServerLesson.id)
            : (editingLessonIndex !== null ? editingLessonIndex : parsedLessons.length - 1);
          if (idx !== editingLessonIndex && editingLessonIndex === null) {
            setEditingLessonIndex(idx);
          }
          if (matchedServerLesson) {
            setCurrentLesson((prev: any) => ({
              ...prev,
              id: matchedServerLesson.id,
              slides: prev.slides.map((s: any, sIdx: number) => {
                const serverSlide = matchedServerLesson.slides?.[sIdx];
                return serverSlide ? { ...s, id: serverSlide.id } : s;
              }),
              questions: prev.questions.map((q: any, qIdx: number) => {
                const serverQ = matchedServerLesson.questions?.[qIdx];
                return serverQ ? { ...q, id: serverQ.id } : q;
              }),
              assignments: prev.assignments.map((a: any, aIdx: number) => {
                const serverA = matchedServerLesson.assignments?.[aIdx];
                return serverA ? { ...a, id: serverA.id } : a;
              }),
            }));
          } else if (idx >= 0 && idx < parsedLessons.length) {
            // Fallback to positional if no title/ID match found
            setCurrentLesson((prev: any) => ({
              ...prev,
              id: parsedLessons[idx].id,
            }));
          }
          // 🔒 FIX: Match edited lesson by ID or title, NOT by positional index.
          // This prevents overwriting the wrong lesson when server returns lessons in a different order.
          const editedLessonId = matchedServerLesson?.id || currentLesson.id;
          setLessons(
            parsedLessons.map((pl: any) => {
              const isEditedLesson = editedLessonId
                ? pl.id === editedLessonId
                : pl.title === currentLesson.title;

              if (isEditedLesson) {
                return {
                  ...pl,
                  title: currentLesson.title,
                  domain: currentLesson.domain,
                  videoUrl: currentLesson.videoUrl,
                  summary: currentLesson.summary,
                  notes: currentLesson.notes,
                  standards: currentLesson.standards,
                  indicators: currentLesson.indicators,
                  learningOutcomes: currentLesson.learningOutcomes,
                  isVisible: currentLesson.isVisible,
                  publishDate: currentLesson.publishDate,
                  cutOffDate: currentLesson.cutOffDate,
                  slides: currentLesson.slides.map((s: any, sIdx: number) => {
                    const serverSlide = pl.slides?.[sIdx];
                    return serverSlide ? { ...s, id: serverSlide.id } : s;
                  }),
                  questions: currentLesson.questions.map((q: any, qIdx: number) => {
                    const serverQ = pl.questions?.[qIdx];
                    return serverQ ? { ...q, id: serverQ.id } : q;
                  }),
                  assignments: currentLesson.assignments.map((a: any, aIdx: number) => {
                    const serverA = pl.assignments?.[aIdx];
                    return serverA ? { ...a, id: serverA.id } : a;
                  }),
                };
              }
              return pl;
            })
          );
        } else {
          // ✅ SAFE MERGE: Preserve local lessons not returned by server
          setLessons((prevLessons: Lesson[]) => {
            const serverIds = new Set(parsedLessons.map((pl: any) => pl.id).filter(Boolean));
            const localOnlyLessons = prevLessons.filter(
              (ll: Lesson) => ll.id && !serverIds.has(ll.id)
            );
            return [...parsedLessons, ...localOnlyLessons];
          });
        }

        clearDraft(); // clear emergency draft after successful save
        setTimeout(() => setHasUnsavedChanges(false), 1000);

        if (!isAutoSave) {
          showToast(language === "ar" ? "تم تحديث الكورس بنجاح" : "Course updated successfully", "success");
          router.push(role === "SUPER_ADMIN" ? "/super-admin/courses" : "/school-admin/courses");
        } else {
          setLastAutoSave(new Date());
        }
      } else {
        if (!isAutoSave) {
          const data = await res.json().catch(() => ({}));
          // Server error during course update — enqueue for auto-retry
          if (res.status >= 500) {
            const token = localStorage.getItem(tokenKey) || localStorage.getItem("token") || "";
            const targetSchoolIds4 = (courseData.schoolIds || []).filter(Boolean);
            const deduplicatedLessons4 = [...lessons].filter((l, idx, arr) => {
              if (!l.id) return true;
              return arr.findIndex(other => other.id === l.id) === idx;
            });
            offlineSync.enqueue({
              url: `${API_URL}/school/courses/${courseId}`,
              method: "PUT",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                ...courseData,
                isCentral: role === "SUPER_ADMIN" ? targetSchoolIds4.length === 0 : false,
                schoolId: role === "SUPER_ADMIN" ? (targetSchoolIds4.length > 0 ? targetSchoolIds4[0] : null) : schoolIdParam,
                schoolIds: role === "SUPER_ADMIN" ? targetSchoolIds4 : [schoolIdParam],
                lessons: deduplicatedLessons4.map((l) => ({
                  id: l.id, title: l.title, domain: l.domain || null, videoUrl: l.videoUrl || null,
                  summary: l.summary || null, notes: l.notes || null, standards: l.standards || null,
                  indicators: l.indicators || null, learningOutcomes: l.learningOutcomes || null,
                  isVisible: l.isVisible !== undefined ? l.isVisible : true,
                  publishDate: l.publishDate ? new Date(l.publishDate).toISOString() : null,
                  cutOffDate: l.cutOffDate ? new Date(l.cutOffDate).toISOString() : null,
            attachments: serializeLessonContent(l, "attachments"),
            slides: serializeLessonContent(l, "slides"),
            questions: serializeLessonContent(l, "questions"),
            assignments: serializeLessonContent(l, "assignments"),
                })),
              }),
              label: language === "ar" ? `كورس: ${courseData.title}` : `Course: ${courseData.title}`,
            });
            showToast(
              language === "ar"
                ? "السيرفر غير متاح - تم حفظ التغييرات محلياً وسترفع تلقائياً ✅"
                : "Server unavailable - changes saved locally and will upload automatically ✅",
              "info"
            );
          } else {
            showToast(data.error || data.details || (language === "ar" ? "فشل تحديث الكورس" : "Failed to update course"), "error");
          }
        } else {
          console.error("Auto-save failed:", await res.text());
          showToast(
            language === "ar"
              ? "فشل الحفظ التلقائي. تأكد من الاتصال ثم احفظ يدوياً."
              : "Auto-save failed. Check your connection, then save manually.",
            "error"
          );
        }
      }
    } catch (error: any) {
      console.error("Course update error:", error);
      // Network failure — enqueue for offline sync
      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token") || "";
      const targetSchoolIds5 = (courseData.schoolIds || []).filter(Boolean);
      const deduplicatedLessons5 = [...lessons].filter((l, idx, arr) => {
        if (!l.id) return true;
        return arr.findIndex(other => other.id === l.id) === idx;
      });
      offlineSync.enqueue({
        url: `${API_URL}/school/courses/${courseId}`,
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...courseData,
          isCentral: role === "SUPER_ADMIN" ? targetSchoolIds5.length === 0 : false,
          schoolId: role === "SUPER_ADMIN" ? (targetSchoolIds5.length > 0 ? targetSchoolIds5[0] : null) : schoolIdParam,
          schoolIds: role === "SUPER_ADMIN" ? targetSchoolIds5 : [schoolIdParam],
          lessons: deduplicatedLessons5.map((l) => ({
            id: l.id, title: l.title, domain: l.domain || null, videoUrl: l.videoUrl || null,
            summary: l.summary || null, notes: l.notes || null, standards: l.standards || null,
            indicators: l.indicators || null, learningOutcomes: l.learningOutcomes || null,
            isVisible: l.isVisible !== undefined ? l.isVisible : true,
            publishDate: l.publishDate ? new Date(l.publishDate).toISOString() : null,
            cutOffDate: l.cutOffDate ? new Date(l.cutOffDate).toISOString() : null,
            attachments: serializeLessonContent(l, "attachments"),
            slides: serializeLessonContent(l, "slides"),
            questions: serializeLessonContent(l, "questions"),
            assignments: serializeLessonContent(l, "assignments"),
          })),
        }),
        label: language === "ar" ? `كورس: ${courseData.title}` : `Course: ${courseData.title}`,
      });
      if (!isAutoSave) {
        showToast(
          language === "ar"
            ? "لا يوجد اتصال - تم حفظ التغييرات محلياً وسترفع تلقائياً ✅"
            : "No connection - changes saved locally and will upload automatically ✅",
          "info"
        );
      }
    } finally {
      isSavingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm(language === "ar" ? "هل أنت متأكد من حذف هذا الكورس نهائياً؟" : "Are you sure you want to permanently delete this course?")) return;
    const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
    try {
      const res = await apiFetch(`${API_URL}/school/courses/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(language === "ar" ? "تم حذف الكورس بنجاح" : "Course deleted successfully", "success");
        router.push(role === "SUPER_ADMIN" ? "/super-admin/courses" : "/school-admin/courses");
      }
    } catch (error) {
      showToast(language === "ar" ? "خطأ في الاتصال" : "Connection error", "error");
    }
  };

  const linkExamToCourse = async (examId: string) => {
    try {
      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
      const res = await apiFetch(`${API_URL}/exams/${examId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      if (res.ok) {
        showToast(language === "ar" ? "تم ربط المحتوى بنجاح" : "Content linked successfully", "success");
        if (token && courseId) fetchCourseData(token, courseId);
      }
    } catch (e) {
      showToast(language === "ar" ? "فشل الربط" : "Failed to link", "error");
    }
  };

  return (
    <CourseEditorContext.Provider
      value={{
        role,
        courseId,
        schoolIdParam,
        isLoading,
        isSubmitting,
        setIsSubmitting,
        schools,
        isAutoSaveEnabled,
        setIsAutoSaveEnabled,
        lastAutoSave,
        setLastAutoSave,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        courseData,
        setCourseData,
        lessons,
        setLessons,
        exams,
        setExams,
        activeContentTab,
        isLessonModalOpen,
        isLessonContentLoading,
        setIsLessonModalOpen,
        isBankModalOpen,
        setIsBankModalOpen,
        isQuestionBankModalOpen,
        setIsQuestionBankModalOpen,
        bankItems,
        setBankItems,
        bankQuestions,
        setBankQuestions,
        editingLessonIndex,
        setEditingLessonIndex,
        currentLesson,
        setCurrentLesson,
        activeTab,
        setActiveTab,
        showQuestionForm,
        setShowQuestionForm,
        editingQuestionIndex,
        setEditingQuestionIndex,
        questionSource,
        setQuestionSource,
        tempQuestion,
        setTempQuestion,
        openDropdownId,
        setOpenDropdownId,
        metadataExcelRef,
        questionsExcelRef,
        assignmentsExcelRef,
        fetchCourseData,
        toggleCourseSchool,
        selectAllSchools,
        handleRemoveLesson,
        openAddLessonModal,
        openEditLessonModal,
        openBankModal,
        openQuestionBankModal,
        addQuestionFromBank,
        saveLesson,
        handleSubmit,
        handleDeleteCourse,
        linkExamToCourse,
        hasDraft,
        draftSavedAt,
        restoreFromDraft,
        clearDraft,
        availableMetadata,
        setAvailableMetadata,
        isSettingsHidden,
        setIsSettingsHidden,
      }}
    >
      {children}
    </CourseEditorContext.Provider>
  );
};

export const useCourseEditor = () => {
  const context = useContext(CourseEditorContext);
  if (!context) {
    throw new Error("useCourseEditor must be used within a CourseEditorProvider");
  }
  return context;
};
