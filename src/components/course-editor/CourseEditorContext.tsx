"use client";
import { lessonTranslationPayload } from "@/lib/bilingualMetadata";
import { toEgyptInput, parseEgyptDate } from '@/lib/egyptTime';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, apiFetch } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { offlineSync, captureOfflineOwner } from "@/lib/offlineSync";
import { buildCourseLessonSummary } from "@/lib/courseLessonSummary";
import { courseLessonKey, parseLessonJsonArray, stageCourseLesson, withCourseLessonKey } from "@/lib/courseCreatePersistence";
import { useDeletionPolicy } from "@/hooks/useDeletionPolicy";
import type { CourseData, Lesson, CourseEditorContextType } from './types';
export type { CourseData, Lesson } from './types';
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
  const allowContentDeletion = useDeletionPolicy(role);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialLoadDoneRef = useRef(false);
  const suppressUnsavedTrackingRef = useRef(false);
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
  const courseVersionRef = useRef<string | undefined>(undefined);
  const loadedCourseRef = useRef<string | null>(null);
  const courseLoadRef = useRef(0);
  const slideCountsRef = useRef<Map<string, number>>(new Map());
  const initialSchoolIdsRef = useRef<string[]>([]);
  const serializeLessonContent = (lesson: Lesson, field: "attachments" | "slides" | "questions" | "assignments") => {
    // Existing lessons from the fast list are summaries. Never overwrite their
    // stored JSON with the empty placeholder arrays before opening that lesson.
    if (lesson.id && lesson.isContentLoaded !== true) return undefined;
    return JSON.stringify(lesson[field] || []);
  };
  const serializeLessonForPut = (l: Lesson) => {
    const isUnloaded = Boolean(l.id && l.isContentLoaded !== true);
    return {
      ...(l.id ? { id: l.id, expectedUpdatedAt: l.updatedAt } : { newLessonId: l.newLessonId }),
      ...lessonTranslationPayload(l),
      title: l.title,
      domain: isUnloaded && !l.domain ? undefined : (l.domain || null),
      videoUrl: isUnloaded && !l.videoUrl ? undefined : (l.videoUrl || null),
      summary: isUnloaded && !l.summary ? undefined : (l.summary || null),
      notes: isUnloaded && !l.notes ? undefined : (l.notes || null),
      standards: isUnloaded && !l.standards ? undefined : (l.standards || null),
      indicators: isUnloaded && !l.indicators ? undefined : (l.indicators || null),
      learningOutcomes: isUnloaded && !l.learningOutcomes ? undefined : (l.learningOutcomes || null),
      isVisible: l.isVisible !== undefined ? l.isVisible : true,
      publishDate: l.publishDate ? parseEgyptDate(l.publishDate).toISOString() : null,
      cutOffDate: l.cutOffDate ? parseEgyptDate(l.cutOffDate).toISOString() : null,
      isContentLoaded: Boolean(l.isContentLoaded),
      attachments: serializeLessonContent(l, "attachments"),
      slides: serializeLessonContent(l, "slides"),
      questions: serializeLessonContent(l, "questions"),
      assignments: serializeLessonContent(l, "assignments"),
    };
  };
  const lessonsRef = useRef<Lesson[]>([]);
  lessonsRef.current = lessons;
  const [exams, setExams] = useState<any[]>([]);
  const [activeContentTab] = useState<"lessons">("lessons");
  const [isLessonModalOpen, setLessonModalOpen] = useState(false);
  const lessonSessionRef = useRef(0);
  const setIsLessonModalOpen = (open: boolean) => {
    if (!open) lessonSessionRef.current += 1;
    setLessonModalOpen(open);
  };
  const [isLessonContentLoading, setIsLessonContentLoading] = useState(false);
  const [availableMetadata, setAvailableMetadata] = useState({ domains: [] as string[], standards: [] as string[], indicators: [] as string[], outcomes: [] as string[] });
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const buildBlankLessonDraft = (): Lesson => ({
    newLessonId: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : undefined,
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
    isContentLoaded: true,
  });
  const [currentLesson, setCurrentLesson] = useState<Lesson>(buildBlankLessonDraft);
  const liveEditor = useRef({ courseId, courseData, currentLesson, isLessonModalOpen, isLessonContentLoading });
  liveEditor.current = { courseId, courseData, currentLesson, isLessonModalOpen, isLessonContentLoading };
  const failedSaveBodyRef = useRef<string | undefined>(undefined);

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
    // Don't flag unsaved changes during initial load or programmatic state hydration
    if (!isLoading && initialLoadDoneRef.current) {
      if (suppressUnsavedTrackingRef.current) {
        suppressUnsavedTrackingRef.current = false;
        return;
      }
      setHasUnsavedChanges(true);
    }
  }, [courseData, lessons, currentLesson, isLoading]);

  // =============================================
  // EMERGENCY LOCAL DRAFT BACKUP
  // IndexedDB stores full lesson content; localStorage is only a fallback.
  // =============================================
  const DRAFT_KEY = offlineSync.getDraftStorageKey(courseId ? `lms_draft_course_${courseId}` : 'lms_draft_course_new');

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
          expectedUpdatedAt: courseVersionRef.current,
          courseId,
          lessons,
          currentLesson,
          isLessonModalOpen,
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
  }, [lessons, currentLesson, courseData, DRAFT_KEY, isLoading, isLessonModalOpen, language, showToast]);

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
        if (!draft.expectedUpdatedAt || draft.expectedUpdatedAt !== courseVersionRef.current) {
          showToast(language === "ar"
            ? "المسودة مبنية على نسخة قديمة من الكورس. احتفظنا بيها للمراجعة."
            : "This draft is based on an older course version and has been kept for review.", "error");
          return;
        }
        justRestoredRef.current = true;
        if (Array.isArray(draft.lessons)) setLessons(draft.lessons.map(withCourseLessonKey));
        if (draft.currentLesson?.title && (draft.isLessonModalOpen === true ||
            (draft.isLessonModalOpen === undefined && !draft.currentLesson.id))) {
          lessonSessionRef.current += 1;
          setCurrentLesson(withCourseLessonKey(draft.currentLesson));
          setLessonModalOpen(true);
        }
        localStorage.removeItem(DRAFT_KEY);
        void offlineSync.removeDraft(DRAFT_KEY);
        showToast(
          language === 'ar' ? `تم استرداد المسودة المحفوظة بتاريخ ${new Date(draft.savedAt).toLocaleString('ar', { timeZone: 'Africa/Cairo' })}` : `Draft from ${new Date(draft.savedAt).toLocaleString(undefined, { timeZone: 'Africa/Cairo' })} restored`,
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
    if (!id || id === "null" || id === "undefined") return;
    const current = (courseData.schoolIds || []).filter(Boolean);
    if (current.includes(id)) {
      setCourseData({ ...courseData, schoolIds: current.filter((s) => s !== id) });
    } else {
      setCourseData({ ...courseData, schoolIds: [...current, id] });
    }
  };

  const selectAllSchools = () => {
    const validSchoolIds = (schools || []).map((s) => s.id).filter(Boolean);
    if ((courseData.schoolIds || []).length === validSchoolIds.length) {
      setCourseData({ ...courseData, schoolIds: [] });
    } else {
      setCourseData({ ...courseData, schoolIds: validSchoolIds });
    }
  };

  const fetchCourseData = async (token: string, id: string) => {
    const request = ++courseLoadRef.current;
    const isCurrent = () => courseLoadRef.current === request && liveEditor.current.courseId === id;
    try {
      const res = await apiFetch(`${API_URL}/courses/${id}?summary=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isCurrent()) return;
      if (res.ok) {
        const data = await res.json();
        if (!isCurrent() || data.id !== id) return;
        if (loadedCourseRef.current === id && Date.parse(data.updatedAt) < Date.parse(courseVersionRef.current || "")) return;
        loadedCourseRef.current = id;
        courseVersionRef.current = data.updatedAt;
        let parsedGrades: string[] = data.grade ? [data.grade] : [];
        try {
          if (data.grades && typeof data.grades === "string") {
            const values = JSON.parse(data.grades);
            if (Array.isArray(values)) parsedGrades = values;
          } else if (Array.isArray(data.grades)) {
            parsedGrades = data.grades;
          } else if (data.grade) {
            parsedGrades = [data.grade];
          }
        } catch (e) {
          parsedGrades = data.grade ? [data.grade] : [];
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

        const schoolIds = data.schools?.length
          ? data.schools.map((school: { id: string }) => school.id).filter(Boolean)
          : data.schoolId ? [data.schoolId] : [];
        initialSchoolIdsRef.current = schoolIds;
        setCourseData({
          title: data.title,
          description: data.description || "",
          coverImage: data.coverImage || "",
          grades: parsedGrades,
          subject: data.subject || "",
          country: data.country || "مصر",
          isCentral: data.isCentral,
          schoolId: data.schoolId || "",
          schoolIds,
        });

        setExams(data.exams || []);

        const rawLessons = (data.lessons || []).slice().sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        slideCountsRef.current = new Map();
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
              if (!isCurrent() || countsByLessonId.size === 0) return;
              slideCountsRef.current = countsByLessonId;
              // Skip mutating lesson references mid-save; reconcile() reads slideCountsRef when save finishes.
              if (isSavingRef.current) return;
              suppressUnsavedTrackingRef.current = true;
              setLessons((currentLessons) => {
                let changed = false;
                const next = currentLessons.map((lesson) => {
                  if (!lesson.id || !countsByLessonId.has(lesson.id)) return lesson;
                  const nextCount = countsByLessonId.get(lesson.id)!;
                  if (lesson.slidesCount === nextCount) return lesson;
                  changed = true;
                  return { ...lesson, slidesCount: nextCount };
                });
                return changed ? next : currentLessons;
              });
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
              isContentLoaded: true,
              isVisible: l.isVisible !== undefined ? l.isVisible : true,
              publishDate: l.publishDate && !isNaN(new Date(l.publishDate).getTime()) ? toEgyptInput(l.publishDate) : "",
              cutOffDate: l.cutOffDate && !isNaN(new Date(l.cutOffDate).getTime()) ? toEgyptInput(l.cutOffDate) : "",
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
      if (isCurrent()) {
        console.error("[fetchCourseData] Detailed Error:", error);
        showToast(language === "ar" ? "خطأ في الاتصال" : "Connection error", "error");
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
        // Mark initial load complete after state updates from this request are settled.
        setTimeout(() => { if (isCurrent()) initialLoadDoneRef.current = true; }, 200);
      }
    }
  };

  const handleRemoveLesson = async (index: number) => {
    const lesson = lessons[index];
    if (!lesson) return;
    
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
        setLessons(current => current.filter(item => item.id !== lesson.id));
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || (language === "ar" ? "فشل حذف الدرس" : "Failed to delete lesson"), "error");
      }
    } catch (e) {
      showToast(language === "ar" ? "خطأ في الاتصال" : "Connection error", "error");
    }
  };

  const openAddLessonModal = () => {
    lessonSessionRef.current += 1;
    setIsLessonContentLoading(false);
    suppressUnsavedTrackingRef.current = true;
    setCurrentLesson(buildBlankLessonDraft());
    setActiveTab("info");
    setIsLessonModalOpen(true);
  };

  const addImportedLesson = (importedLesson: Partial<Lesson>) => {
    const normalized: Lesson = {
      ...buildBlankLessonDraft(),
      ...importedLesson,
      id: undefined,
      newLessonId: crypto.randomUUID(),
      isContentLoaded: true,
      isVisible: importedLesson.isVisible !== undefined ? importedLesson.isVisible : true,
      slides: Array.isArray(importedLesson.slides) ? importedLesson.slides : [],
      questions: Array.isArray(importedLesson.questions) ? importedLesson.questions : [],
      assignments: Array.isArray(importedLesson.assignments) ? importedLesson.assignments : [],
      attachments: Array.isArray(importedLesson.attachments) ? importedLesson.attachments : [],
    };
    setLessons((prev) => {
      const next = [...prev, normalized];
      lessonsRef.current = next;
      return next;
    });
  };

  const openEditLessonModal = async (index: number) => {
    const lessonSummary = lessons[index];
    if (!lessonSummary) return;
    const session = ++lessonSessionRef.current;
    let lessonToEdit: Lesson = withCourseLessonKey({ ...lessonSummary });

    if (lessonSummary.id && !lessonSummary.isContentLoaded) {
      // Open immediately so the user gets visible feedback while large lessons load.
      suppressUnsavedTrackingRef.current = true;
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
        if (session !== lessonSessionRef.current) return;
        lessonToEdit = {
          ...lesson,
          isContentLoaded: true,
          publishDate: lesson.publishDate ? toEgyptInput(lesson.publishDate) : "",
          cutOffDate: lesson.cutOffDate ? toEgyptInput(lesson.cutOffDate) : "",
          slides: parseLessonJsonArray(lesson.slides),
          questions: parseLessonJsonArray(lesson.questions),
          assignments: parseLessonJsonArray(lesson.assignments),
          attachments: parseLessonJsonArray(lesson.attachments),
        };
      } catch (error) {
        if (session !== lessonSessionRef.current) return;
        showToast(language === "ar" ? "تعذر تحميل محتوى الدرس" : "Failed to load lesson content", "error");
        setIsLessonModalOpen(false);
        setIsLessonContentLoading(false);
        return;
      } finally {
        if (session === lessonSessionRef.current) setIsLessonContentLoading(false);
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
    suppressUnsavedTrackingRef.current = true;
    if (lessonToEdit.isContentLoaded && !lessonSummary.isContentLoaded) {
      setLessons((prev) =>
        prev.map(item => item.id === lessonSummary.id ? { ...item, ...lessonToEdit, isContentLoaded: true } : item)
      );
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

  const persistFailedWrite = async (item: Parameters<typeof offlineSync.enqueue>[0]) => {
    try {
      await offlineSync.enqueue(item);
      return true;
    } catch {
      setHasUnsavedChanges(true);
      showToast(language === "ar"
        ? "تعذر حفظ التغييرات محلياً. لا تغلق الصفحة ونزّل نسخة من التغييرات المعلقة."
        : "Changes could not be saved locally. Keep this page open and download pending changes.", "error");
      return false;
    }
  };

  const getSchoolPayload = (data: CourseData) => {
    const sanitizedTargetSchoolIds = (data.schoolIds || [])
      .map((s: any) => (typeof s === "object" && s ? s.id : s))
      .filter((s: any): s is string => Boolean(s && typeof s === "string" && s !== "null" && s !== "undefined" && s.trim() !== ""))
      .map((s: string) => s.trim());

    if (role === "SUPER_ADMIN" &&
        JSON.stringify([...sanitizedTargetSchoolIds].sort()) !== JSON.stringify([...initialSchoolIdsRef.current].sort())) {
      return {
        isCentral: sanitizedTargetSchoolIds.length === 0,
        schoolId: sanitizedTargetSchoolIds.length > 0 ? sanitizedTargetSchoolIds[0] : null,
        schoolIds: sanitizedTargetSchoolIds,
      };
    }

    return { isCentral: undefined, schoolId: undefined, schoolIds: undefined };
  };

  const saveCourse = async (mode: "lesson" | "course" | "auto") => {
    const requestedSession = lessonSessionRef.current;
    if (!(await acquireSaveLock(mode !== "auto"))) return;

    let submitting = false;
    try {
      const editor = liveEditor.current;
      if (editor.courseId !== courseId || (mode === "lesson" && requestedSession !== lessonSessionRef.current)) return;
      if (courseId && loadedCourseRef.current !== courseId) return;
      if (mode === "auto" && editor.isLessonModalOpen) return;
      if (mode === "lesson" && (!editor.isLessonModalOpen || editor.isLessonContentLoading)) return;
      if (editor.isLessonModalOpen && editor.currentLesson.id && editor.currentLesson.isContentLoaded !== true) return;

      const lessonTitle = editor.currentLesson.title.trim();
      if (editor.isLessonModalOpen && !lessonTitle) {
        if (mode !== "auto") showToast(language === "ar" ? "يجب إدخال عنوان الدرس" : "Lesson title is required", "error");
        return;
      }
      if (!editor.courseData.title.trim()) {
        if (mode !== "auto") showToast(language === "ar" ? "عنوان الكورس مطلوب" : "Course title is required", "error");
        return;
      }

      const session = lessonSessionRef.current;
      const draft = editor.isLessonModalOpen && lessonTitle && !editor.isLessonContentLoading
        ? withCourseLessonKey({ ...editor.currentLesson, isContentLoaded: true })
        : undefined;
      const beforeSave = lessonsRef.current;
      const submitted = draft ? stageCourseLesson(beforeSave, draft) : beforeSave;
      if (!submitted) {
        showToast(language === "ar" ? "الدرس لم يعد موجودًا في الكورس. حدّث الصفحة وراجع المسودة." : "The lesson is no longer in this course. Refresh and review the draft.", "error");
        return;
      }
      const baselineLessons = mode === "lesson" && draft ? submitted : beforeSave;
      if (mode === "lesson" && draft) {
        suppressUnsavedTrackingRef.current = true;
        lessonsRef.current = submitted;
        setLessons(submitted);
      }

      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
      if (!courseId || !token) {
        if (mode === "lesson") {
          setLessons(submitted);
          setIsLessonModalOpen(false);
          suppressUnsavedTrackingRef.current = true;
          setCurrentLesson(buildBlankLessonDraft());
        }
        return;
      }

      const url = API_URL + "/school/courses/" + courseId;
      const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
      const requestOwner = captureOfflineOwner(headers);
      const body = JSON.stringify({
        ...editor.courseData,
        ...getSchoolPayload(editor.courseData),
        expectedUpdatedAt: courseVersionRef.current,
        lessons: submitted.map(serializeLessonForPut),
      });
      if (mode === "auto" && failedSaveBodyRef.current === body) return;
      submitting = true;
      setIsSubmitting(true);

      const queueSave = async () => {
        failedSaveBodyRef.current = body;
        if (!await persistFailedWrite({
          owner: requestOwner, url, method: "PUT", headers, body,
          supersedeKey: "course-put:" + courseId,
          label: mode === "lesson" ? lessonTitle : editor.courseData.title,
        })) return;
        if (draft && session === lessonSessionRef.current) {
          const latest = liveEditor.current.currentLesson;
          setLessons(current => stageCourseLesson(current, withCourseLessonKey(latest)) ?? current);
          if (mode === "lesson") {
            setIsLessonModalOpen(false);
            suppressUnsavedTrackingRef.current = true;
            setCurrentLesson(buildBlankLessonDraft());
          }
        }
        showToast(
          language === "ar" ? "تم حفظ التغييرات محلياً في قائمة المزامنة." : "Changes were saved locally in the sync queue.",
          "info"
        );
      };

      let response: Response;
      try {
        response = await apiFetch(url, {
          method: "PUT",
          headers: { ...headers, "X-Offline-Queue-Managed": "1" },
          body,
        });
      } catch {
        await queueSave();
        return;
      }

      if (!response.ok) {
        if (response.status >= 500) {
          await queueSave();
          return;
        }
        failedSaveBodyRef.current = body;
        const error = await response.json().catch(() => ({}));
        showToast(error.error || (language === "ar" ? "تعذر حفظ الكورس." : "Unable to save the course."), "error");
        return;
      }

      const saved = await response.json().catch(() => null);
      if (liveEditor.current.courseId !== courseId) return;
      const savedLessons: Lesson[] = Array.isArray(saved?.lessons) ? saved.lessons : [];
      const savedById = new Map(savedLessons.map(lesson => [lesson.id, lesson]));
      const draftKey = draft && courseLessonKey(draft);
      const acknowledgedDraft = draftKey ? savedById.get(draftKey) : undefined;
      const acknowledgedAllNew = submitted.every(lesson => !lesson.newLessonId || savedById.has(lesson.newLessonId));
      if (!saved?.updatedAt || !Array.isArray(saved.lessons) || (draftKey && !acknowledgedDraft) || !acknowledgedAllNew) {
        failedSaveBodyRef.current = body;
        showToast(language === "ar" ? "تعذر تأكيد الحفظ بنفس معرّفات الدروس. تم الاحتفاظ بالمسودة." : "The server did not confirm the same lesson IDs. Your draft was kept.", "error");
        return;
      }

      failedSaveBodyRef.current = undefined;
      courseVersionRef.current = saved.updatedAt;
      void offlineSync.removeByUrl(url, "PUT", requestOwner);

      const currentEditor = liveEditor.current;
      const latestLessons = lessonsRef.current;
      const listChanged = latestLessons !== baselineLessons;
      const draftStillOpen = session === lessonSessionRef.current && currentEditor.isLessonModalOpen;
      const editedDuringSave = currentEditor.courseData !== editor.courseData || listChanged ||
        ((editor.isLessonModalOpen || currentEditor.isLessonModalOpen) && currentEditor.currentLesson !== editor.currentLesson) ||
        (currentEditor.isLessonModalOpen && !draftStillOpen);
      const initialById = new Map(baselineLessons.map(lesson => [courseLessonKey(lesson), lesson]));
      const submittedById = new Map(submitted.map(lesson => [courseLessonKey(lesson), lesson]));

      const reconcile = (server: Lesson, local?: Lesson): Lesson => {
        const sent = submittedById.get(server.id);
        if (local && local !== initialById.get(server.id)) {
          return { ...local, id: server.id, newLessonId: undefined, updatedAt: server.updatedAt };
        }
        const isContentLoaded = Boolean(sent?.isContentLoaded);
        const base = isContentLoaded ? server : buildCourseLessonSummary(server);
        const fallbackCount = sent?.slidesCount ?? (server.id ? slideCountsRef.current.get(server.id) : undefined) ?? 0;
        return {
          ...base,
          ...(!isContentLoaded && (base as any).slidesCount === 0 && fallbackCount > 0 ? { slidesCount: fallbackCount } : {}),
          isContentLoaded,
          publishDate: server.publishDate ? toEgyptInput(server.publishDate) : "",
          cutOffDate: server.cutOffDate ? toEgyptInput(server.cutOffDate) : "",
          slides: isContentLoaded ? parseLessonJsonArray(server.slides) : [],
          questions: isContentLoaded ? parseLessonJsonArray(server.questions) : [],
          assignments: isContentLoaded ? parseLessonJsonArray(server.assignments) : [],
          attachments: isContentLoaded ? parseLessonJsonArray(server.attachments) : [],
        } as Lesson;
      };
      const localById = new Map(latestLessons.map(lesson => [courseLessonKey(lesson), lesson]));
      const merged = savedLessons
        .filter(lesson => !listChanged || !initialById.has(lesson.id) || localById.has(lesson.id))
        .map(lesson => reconcile(lesson, localById.get(lesson.id)));
      const mergedById = new Map(merged.map(lesson => [lesson.id, lesson]));
      const localOrder = listChanged
        ? latestLessons.flatMap(lesson => {
            const key = courseLessonKey(lesson);
            const persisted = mergedById.get(key);
            mergedById.delete(key);
            return persisted ? [persisted] : lesson.id ? [] : [lesson];
          })
        : [];
      const nextLessons = listChanged ? [...localOrder, ...mergedById.values()] : merged;

      suppressUnsavedTrackingRef.current = !editedDuringSave;
      lessonsRef.current = nextLessons;
      setLessons(nextLessons);
      if (acknowledgedDraft && draftStillOpen && editedDuringSave) {
        setCurrentLesson(previous => {
          if (session !== lessonSessionRef.current || courseLessonKey(previous) !== draftKey) return previous;
          return { ...previous, id: acknowledgedDraft.id, newLessonId: undefined, updatedAt: acknowledgedDraft.updatedAt };
        });
      } else if (mode === "lesson" && draftStillOpen) {
        setIsLessonModalOpen(false);
        setCurrentLesson(buildBlankLessonDraft());
      }

      if (!editedDuringSave) clearDraft();
      setHasUnsavedChanges(editedDuringSave);
      if (mode === "auto") {
        setLastAutoSave(new Date());
      } else if (mode === "lesson") {
        showToast(language === "ar" ? "تم حفظ الدرس بنجاح" : "Lesson saved successfully", "success");
      } else {
        showToast(language === "ar" ? "تم تحديث الكورس بنجاح" : "Course updated successfully", "success");
        if (!editedDuringSave) router.push(role === "SUPER_ADMIN" ? "/super-admin/courses" : "/school-admin/courses");
      }
    } catch (error) {
      console.error("Course save failed:", error);
      showToast(language === "ar" ? "تعذر تأكيد الحفظ. تم الاحتفاظ بالتغييرات في المحرر." : "The save could not be confirmed. Your changes are still in the editor.", "error");
    } finally {
      isSavingRef.current = false;
      if (submitting) setIsSubmitting(false);
    }
  };

  const saveLesson = () => saveCourse("lesson");

  const handleSubmit = async (event?: React.FormEvent, isAutoSave = false) => {
    event?.preventDefault();
    await saveCourse(isAutoSave ? "auto" : "course");
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
        addImportedLesson,
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
        allowContentDeletion,
      }}
    >
      {children}
    </CourseEditorContext.Provider>
  );
};

export const useOptionalCourseEditor = () => useContext(CourseEditorContext);

export const useCourseEditor = () => {
  const context = useContext(CourseEditorContext);
  if (!context) {
    throw new Error("useCourseEditor must be used within a CourseEditorProvider");
  }
  return context;
};
