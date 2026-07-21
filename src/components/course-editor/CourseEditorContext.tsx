"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";

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
  restoreFromDraft: () => void;
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
  const [exams, setExams] = useState<any[]>([]);
  const [activeContentTab] = useState<"lessons">("lessons");
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
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
    if (role === "SUPER_ADMIN") {
      fetchSchools(token);
    }
    if (courseId) {
      fetchCourseData(token, courseId);
    } else {
      setIsLoading(false);
    }
  }, [courseId, role]);

  useEffect(() => {
    if (!isLoading) {
      setHasUnsavedChanges(true);
    }
  }, [courseData, lessons, currentLesson]);

  // =============================================
  // 💾 EMERGENCY LOCAL DRAFT BACKUP
  // Saves lesson data to localStorage every 30s as a safety net
  // =============================================
  const DRAFT_KEY = courseId ? `lms_draft_course_${courseId}` : null;

  // Save draft on every lesson change
  useEffect(() => {
    if (!DRAFT_KEY || isLoading || lessons.length === 0) return;
    // Don't save draft immediately after restore (prevents reappearing banner)
    if (justRestoredRef.current) {
      justRestoredRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      try {
        const draft = {
          savedAt: new Date().toISOString(),
          courseId,
          lessons,
          courseData
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        // ignore storage quota errors
      }
    }, 30_000); // 30 seconds debounce
    return () => clearTimeout(timer);
  }, [lessons, courseData, DRAFT_KEY, isLoading]);

  // Offer to restore draft if page was closed without saving
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  useEffect(() => {
    if (!DRAFT_KEY) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.lessons?.length > 0) {
          setHasDraft(true);
          setDraftSavedAt(draft.savedAt);
        }
      }
    } catch {}
  }, [DRAFT_KEY]);

  const restoreFromDraft = useCallback(() => {
    if (!DRAFT_KEY) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft?.lessons?.length > 0) {
        justRestoredRef.current = true;
        setLessons(draft.lessons);
        // Remove draft immediately so it won't reappear after navigation
        localStorage.removeItem(DRAFT_KEY);
        showToast(
          language === 'ar' ? `تم استرداد المسودة المحفوظة بتاريخ ${new Date(draft.savedAt).toLocaleString('ar')}` : `Draft from ${new Date(draft.savedAt).toLocaleString()} restored`,
          'success'
        );
        setHasDraft(false);
      }
    } catch {}
  }, [DRAFT_KEY, language, showToast]);

  const clearDraft = useCallback(() => {
    if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }, [DRAFT_KEY]);

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/schools`, {
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
      const res = await fetch(`${API_URL}/courses/${id}`, {
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
        setLessons(
          rawLessons.map((l: any) => {
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
              parsedSlides = [
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

            return {
              ...l,
              isVisible: l.isVisible !== undefined ? l.isVisible : true,
              publishDate: l.publishDate ? new Date(new Date(l.publishDate).getTime() - new Date(l.publishDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
              cutOffDate: l.cutOffDate ? new Date(new Date(l.cutOffDate).getTime() - new Date(l.cutOffDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
              questions: Array.isArray(parsedQuestions)
                ? parsedQuestions.map((q) => {
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
                    if (!Array.isArray(parsedCorrectAnswers)) parsedCorrectAnswers = [];

                    return { ...q, explanations: parsedExps, sections: parsedSections, options: parsedOptions, correctAnswers: parsedCorrectAnswers };
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
                    if (!Array.isArray(parsedCorrectAnswers)) parsedCorrectAnswers = [];

                    return { ...q, explanations: parsedExps, sections: parsedSections, options: parsedOptions, correctAnswers: parsedCorrectAnswers };
                  })
                : [],
              attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
              slides: (Array.isArray(parsedSlides) && parsedSlides.length ? parsedSlides : [{ id: Date.now(), type: "TEXT", label: "CONTENT", title: language === "ar" ? "المقدمة" : "Introduction", content: "", sections: [] }]).map((slide: any) => {
                let parsedSections = slide.sections;
                if (typeof parsedSections === "string") {
                  try { parsedSections = JSON.parse(parsedSections); } catch(e) { parsedSections = []; }
                }
                if (!Array.isArray(parsedSections)) parsedSections = [];
                return { ...slide, sections: parsedSections };
              }),
            };
          })
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || errData.message || (language === "ar" ? "فشل تحميل بيانات الكورس" : "Failed to load course details"), "error");
      }
    } catch (error) {
      showToast(language === "ar" ? "خطأ في الاتصال" : "Connection error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLesson = (index: number) => {
    const newLessons = [...lessons];
    newLessons.splice(index, 1);
    setLessons(newLessons);
  };

  const openAddLessonModal = () => {
    setEditingLessonIndex(null);
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

  const openEditLessonModal = (index: number) => {
    setEditingLessonIndex(index);
    const lessonToEdit = { ...lessons[index] };
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
  };

  const openBankModal = async () => {
    try {
      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/exams?isCentral=true`, {
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
      const res = await fetch(`${API_URL}/bank/questions`, {
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
    // Optimistic local update (will be replaced by server response)
    const newLessons = [...lessons];
    if (editingLessonIndex !== null) {
      newLessons[editingLessonIndex] = currentLesson;
    } else {
      // Check if lesson already exists by title to prevent duplication
      const alreadyExists = newLessons.some(
        (l, idx) => l.title === currentLesson.title && idx !== editingLessonIndex
      );
      if (!alreadyExists) {
        newLessons.push(currentLesson);
      }
    }
    setLessons(newLessons);
    setIsLessonModalOpen(false);

    const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
    if (!token || !courseId) return;

    // 🛡️ SAFETY: Never send empty lessons to the server
    if (newLessons.length === 0) {
      console.warn('[saveLesson] BLOCKED: newLessons is empty — would have wiped all course lessons');
      showToast(language === "ar" ? "حدث خطأ في تحميل الدروس - تم الحفظ محلياً فقط" : "Lessons list error - saved locally only", "error");
      return;
    }

    try {
      const targetSchoolIds = (courseData.schoolIds || []).filter(Boolean);

      // 🛡️ SAFE SLIDES PATCH — update slides separately to avoid overwrite
      if (currentLesson.id && currentLesson.slides && currentLesson.slides.length > 0) {
        fetch(`${API_URL}/lessons/${currentLesson.id}/slides`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ slides: JSON.stringify(currentLesson.slides) }),
        }).catch(() => {});
      }

      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
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
          lessons: newLessons.map((l) => ({
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
            attachments: JSON.stringify(l.attachments || []),
            slides: JSON.stringify(l.slides || []),
            questions: JSON.stringify(l.questions || []),
            assignments: JSON.stringify(l.assignments || []),
          })),
        }),
      });

      if (res.ok) {
        clearDraft(); // clear emergency draft after successful save
        showToast(language === "ar" ? "تم حفظ الدرس ونشره تلقائياً ✅" : "Lesson saved and published automatically ✅", "success");
      } else {
        const errBody = await res.json().catch(() => ({}));
        if (errBody?.details?.includes('SAFETY_BLOCK')) {
          showToast(language === "ar" ? "حدث خطأ في بيانات الدروس - تم الحفظ محلياً" : "Data integrity error - saved locally only", "error");
        } else {
          showToast(language === "ar" ? "تم الحفظ محلياً لكن فشل النشر - تأكد من الاتصال" : "Saved locally but publication failed - check connection", "error");
        }
      }
    } catch (error: any) {
      console.error("Auto-save error:", error);
      showToast(language === "ar" ? "تم الحفظ محلياً لكن فشل النشر" : "Saved locally but publication failed", "error");
    }
  };

  const handleSubmit = async (e?: React.FormEvent, isAutoSave = false) => {
    if (e) e.preventDefault();
    if (!courseData.title) {
      if (!isAutoSave) showToast(language === "ar" ? "عنوان الكورس مطلوب" : "Course title is required", "error");
      return;
    }
    setIsSubmitting(true);
    const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");

    try {
      const targetSchoolIds = (courseData.schoolIds || []).filter(Boolean);

      // 🛡️ SAFETY: If lesson modal is open, merge currentLesson into lessons before saving
      let lessonsToSend = [...lessons];
      if (isLessonModalOpen && currentLesson.title) {
        if (editingLessonIndex !== null && editingLessonIndex < lessonsToSend.length) {
          lessonsToSend[editingLessonIndex] = currentLesson;
        } else if (editingLessonIndex === null) {
          lessonsToSend.push(currentLesson);
        }
      }

      // 🛡️ SAFETY: Never submit empty lessons when courseId exists (would wipe all lessons)
      if (courseId && lessonsToSend.length === 0) {
        console.warn('[handleSubmit] BLOCKED: lessons list is empty for existing course — skipping to prevent data loss');
        if (!isAutoSave) showToast(language === "ar" ? "تحذير: قائمة الدروس فارغة - لم يتم الحفظ حمايةً للبيانات" : "Warning: Lessons list is empty - save blocked for data safety", "error");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
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
          lessons: lessonsToSend.map((l) => ({
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
            attachments: JSON.stringify(l.attachments || []),
            slides: JSON.stringify(l.slides || []),
            questions: JSON.stringify(l.questions || []),
            assignments: JSON.stringify(l.assignments || []),
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
            isVisible: l.isVisible !== undefined ? l.isVisible : true,
            publishDate: l.publishDate ? new Date(new Date(l.publishDate).getTime() - new Date(l.publishDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
            cutOffDate: l.cutOffDate ? new Date(new Date(l.cutOffDate).getTime() - new Date(l.cutOffDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
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
            slides: Array.isArray(parsedSlides) && parsedSlides.length ? parsedSlides : [{ id: Date.now(), type: "TEXT", label: "CONTENT", title: language === "ar" ? "المقدمة" : "Introduction", content: "", sections: [] }],
          };
        }).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

        if (isLessonModalOpen) {
          let idx = editingLessonIndex;
          if (idx === null) {
            idx = parsedLessons.length - 1;
            setEditingLessonIndex(idx);
          }
          if (idx >= 0 && idx < parsedLessons.length) {
            setCurrentLesson((prev: any) => ({
              ...prev,
              id: parsedLessons[idx].id,
              slides: prev.slides.map((s: any, sIdx: number) => {
                const serverSlide = parsedLessons[idx].slides?.[sIdx];
                return serverSlide ? { ...s, id: serverSlide.id } : s;
              }),
              questions: prev.questions.map((q: any, qIdx: number) => {
                const serverQ = parsedLessons[idx].questions?.[qIdx];
                return serverQ ? { ...q, id: serverQ.id } : q;
              }),
              assignments: prev.assignments.map((a: any, aIdx: number) => {
                const serverA = parsedLessons[idx].assignments?.[aIdx];
                return serverA ? { ...a, id: serverA.id } : a;
              }),
            }));
          }
          setLessons(
            parsedLessons.map((pl: any, plIdx: number) => {
              if (plIdx === idx) {
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
          setLessons(parsedLessons);
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
          showToast(data.error || data.details || (language === "ar" ? "فشل تحديث الكورس" : "Failed to update course"), "error");
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
      if (!isAutoSave) {
        showToast(error.message || (language === "ar" ? "خطأ في الاتصال بالخادم" : "Connection error"), "error");
      } else {
        showToast(
          language === "ar"
            ? "فشل الحفظ التلقائي. تأكد من الاتصال ثم احفظ يدوياً."
            : "Auto-save failed. Check your connection, then save manually.",
          "error"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm(language === "ar" ? "هل أنت متأكد من حذف هذا الكورس نهائياً؟" : "Are you sure you want to permanently delete this course?")) return;
    const token = localStorage.getItem(tokenKey) || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
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
      const res = await fetch(`${API_URL}/exams/${examId}`, {
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
