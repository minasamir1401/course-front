"use client";
import { buildQuestionWorkbook, importModuleQuestions } from '@/lib/questionExcelWorkbook';

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { normalizeDok } from '@/lib/examQuestionMetadata';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { LessonInfoTab } from "@/components/course-editor/lesson-builder/LessonInfoTab";
import { LessonSlidesBuilder } from "@/components/course-editor/lesson-builder/LessonSlidesBuilder";
import { LessonQuestionsBuilder } from "@/components/course-editor/lesson-builder/LessonQuestionsBuilder";
import { LessonAttachmentsTab } from "@/components/course-editor/lesson-builder/LessonAttachmentsTab";

import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Plus, Trash2, Video, FileText, HelpCircle, BookOpen, Save, Layers, Edit2, X, ChevronDown, ChevronUp, Play, Layout, Target, CheckCircle2, AlertCircle, Upload, Download, Settings, Eye, Monitor, ListOrdered, FileJson, FileDown, Clock, Lightbulb, MessageSquareQuote, TriangleAlert, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import RichTextEditor from "@/components/RichTextEditor";
import MathInput from "@/components/MathInput";
import FileUpload from "@/components/FileUpload";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";
import HtmlRenderer from "@/components/HtmlRenderer";

// Safely parse JSON
const parseJson = (str: any, fallback: any = {}) => {
  try {
    if (str === undefined || str === null) return fallback;
    let parsed = str;
    if (typeof str === "string") {
      const trimmed = str.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[") || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          parsed = trimmed;
        }
      } else {
        return fallback;
      }
    }
    if (typeof parsed !== "object" || parsed === null) {
      return parsed;
    }
    if (fallback && !Array.isArray(fallback) && Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

export default function CreateCoursePage() {
  const { t, language } = useLanguage();
  const SECTION_STYLE_PRESETS: Record<string, {
    icon: any;
    label: string;
    container: string;
    badge: string;
  }> = {
    HINT: {
      icon: Lightbulb,
      label: language === 'ar' ? "تلميح" : "Hint",
      container: "bg-yellow-50/70 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
    },
    TIP: {
      icon: Lightbulb,
      label: language === 'ar' ? "نصيحة" : "Tip",
      container: "bg-sky-50/70 border-sky-200",
      badge: "bg-sky-100 text-sky-700",
    },
    WARNING: {
      icon: TriangleAlert,
      label: language === 'ar' ? "تحذير" : "Warning",
      container: "bg-rose-50/70 border-rose-200",
      badge: "bg-rose-100 text-rose-700",
    },
    KEY_INSIGHT: {
      icon: Search,
      label: language === 'ar' ? "رؤية رئيسية" : "Key Insight",
      container: "bg-indigo-50/70 border-indigo-200",
      badge: "bg-indigo-100 text-indigo-700",
    },
    FEEDBACK: {
      icon: MessageSquareQuote,
      label: language === 'ar' ? "ملاحظات" : "Feedback",
      container: "bg-emerald-50/70 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
    },
    EXPLANATION: {
      icon: CheckCircle2,
      label: language === 'ar' ? "تفسير" : "Explanation",
      container: "bg-amber-50/70 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
    },
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const schoolIdParam = searchParams.get('schoolId');

  const getGradeName = (grade: string) => {
    if (language === 'ar') {
      const translations: { [key: string]: string } = {
        "Elementary": "المرحلة الابتدائية",
        "Middle School": "المرحلة الإعدادية",
        "High School": "المرحلة الثانوية",
        "الصف الأول الابتدائي": "الأول الابتدائي",
        "الصف الثاني الابتدائي": "الثاني الابتدائي",
        "الصف الثالث الابتدائي": "الثالث الابتدائي",
        "الصف الرابع الابتدائي": "الرابع الابتدائي",
        "الصف الخامس الابتدائي": "الخامس الابتدائي",
        "الصف السادس الابتدائي": "السادس الابتدائي",
        "الصف الأول الإعدادي": "الأول الإعدادي",
        "الصف الثاني الإعدادي": "الثاني الإعدادي",
        "الصف الثالث الإعدادي": "الثالث الإعدادي",
        "الصف الأول الثانوي": "الأول الثانوي",
        "الصف الثاني الثانوي": "الثاني الثانوي",
        "الصف الثالث الثانوي": "الثالث الثانوي"
      };
      return translations[grade] || grade;
    }
    const translations: { [key: string]: string } = {
      "Elementary": "Elementary Stage",
      "Middle School": "Middle School Stage",
      "High School": "High School Stage",
      "الصف الأول الابتدائي": "1st Primary",
      "الصف الثاني الابتدائي": "2nd Primary",
      "الصف الثالث الابتدائي": "3rd Primary",
      "الصف الرابع الابتدائي": "4th Primary",
      "الصف الخامس الابتدائي": "5th Primary",
      "الصف السادس الابتدائي": "6th Primary",
      "الصف الأول الإعدادي": "1st Prep",
      "الصف الثاني الإعدادي": "2nd Prep",
      "الصف الثالث الإعدادي": "3rd Prep",
      "الصف الأول الثانوي": "1st Secondary",
      "الصف الثاني الثانوي": "2nd Secondary",
      "الصف الثالث الثانوي": "3rd Secondary"
    };
    return translations[grade] || grade;
  };

  const getGradeCheckboxLabel = (grade: string) => {
    if (language === 'ar') {
      const translations: { [key: string]: string } = {
        "الصف الأول الابتدائي": "الأول",
        "الصف الثاني الابتدائي": "الثاني",
        "الصف الثالث الابتدائي": "الثالث",
        "الصف الرابع الابتدائي": "الرابع",
        "الصف الخامس الابتدائي": "الخامس",
        "الصف السادس الابتدائي": "السادس",
        "الصف الأول الإعدادي": "الأول",
        "الصف الثاني الإعدادي": "الثاني",
        "الصف الثالث الإعدادي": "الثالث",
        "الصف الأول الثانوي": "الأول",
        "الصف الثاني الثانوي": "الثاني",
        "الصف الثالث الثانوي": "الثالث"
      };
      return translations[grade] || grade;
    }
    const translations: { [key: string]: string } = {
      "الصف الأول الابتدائي": "Gr. 1",
      "الصف الثاني الابتدائي": "Gr. 2",
      "الصف الثالث الابتدائي": "Gr. 3",
      "الصف الرابع الابتدائي": "Gr. 4",
      "الصف الخامس الابتدائي": "Gr. 5",
      "الصف السادس الابتدائي": "Gr. 6",
      "الصف الأول الإعدادي": "Gr. 1",
      "الصف الثاني الإعدادي": "Gr. 2",
      "الصف الثالث الإعدادي": "Gr. 3",
      "الصف الأول الثانوي": "Gr. 1",
      "الصف الثاني الثانوي": "Gr. 2",
      "الصف الثالث الثانوي": "Gr. 3"
    };
    return translations[grade] || grade;
  };

  const getSubjectName = (subject: string) => {
    if (language === 'ar') return subject;
    const translations: { [key: string]: string } = {
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
    return translations[subject] || subject;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const createdIdRef = useRef<string | null>(null);
  const autoSaveWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const autoSaveGenerationRef = useRef(0);
  const lastAutoSaveSnapshotRef = useRef("");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualSubmitRef = useRef(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [availableMetadata, setAvailableMetadata] = useState<{ domains: string[]; standards: string[]; indicators: string[]; outcomes: string[] }>({ domains: [], standards: [], indicators: [], outcomes: [] });

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    coverImage: "",
    grades: [] as string[],
    subjects: [] as string[],
    country: "مصر",
    isCentral: !schoolIdParam,
    schoolIds: (schoolIdParam ? [schoolIdParam] : []) as string[]
  });

  const [lessons, setLessons] = useState<any[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  // Lesson State
  const [currentLesson, setCurrentLesson] = useState<any>({
    title: "",
    domain: "",
    content: "",
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
      { id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", videoUrl: "", sections: [] }
    ],
    questions: [],
    assignments: [],
    attachments: []
  });

  // UI States for Lesson Modal
  const [activeTab, setActiveTab] = useState<'info' | 'slides' | 'assignments' | 'exercises' | 'attachments' | 'scheduling'>('info');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false);
  const [isOutcomeDropdownOpen, setIsOutcomeDropdownOpen] = useState(false);
  const [isStandardDropdownOpen, setIsStandardDropdownOpen] = useState(false);
  const [isQuestionStandardOpen, setIsQuestionStandardOpen] = useState(false);
  const [isQuestionIndicatorOpen, setIsQuestionIndicatorOpen] = useState(false);
  const [isQuestionOutcomeOpen, setIsQuestionOutcomeOpen] = useState(false);
  const [questionSource, setQuestionSource] = useState<'assignments' | 'questions'>('questions');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [tempQuestion, setTempQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, xpPoints: 10, skill: "General", level: "Medium", dok: "",
    learningOutcome: "", standard: "", indicator: "",
    sections: [], correctAnswers: [], attempts: 1
  });

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [customSkills, setCustomSkills] = useState<string[]>([]);

  const DEFAULT_SKILLS = [
    "Problem Solving", "Reasoning", "Number Sense", "Algebraic Thinking", "Geometry", "Data Analysis",
    "Observation", "Investigation", "Scientific Reasoning", "Data Interpretation", "Experiment Design",
    "Main Idea", "Inference", "Vocabulary in Context", "Author's Purpose", "Supporting Details"
  ];

  const allExistingSkills = Array.from(new Set([
    ...DEFAULT_SKILLS,
    ...customSkills,
    ...(currentLesson?.slides || []).map((s: any) => s.skill),
    ...(currentLesson?.assignments || []).map((a: any) => a.skill),
    ...(currentLesson?.questions || []).map((q: any) => q.skill)
  ].filter(Boolean)));

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-dropdown-root="true"]')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  const STANDARDS = [
    "Standard 1: Basic Comprehension",
    "Standard 2: Analytical Ability",
    "Standard 3: Practical Application",
    "Standard 4: Creative Thinking"
  ];

  const INDICATORS = [
    "Indicator 1.1: Defining Terms",
    "Indicator 1.2: Explaining Concepts",
    "Indicator 2.1: Comparing Results",
    "Indicator 3.1: Problem Solving"
  ];

  const LEARNING_OUTCOMES = [
    "LO1: أن يعدد الطالب خصائص...",
    "LO2: أن يحلل الطالب العلاقة بين...",
    "LO3: أن يطبق القوانين في...",
    "LO4: أن يستنتج الطالب..."
  ];

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const QUESTION_TYPES = [
    { id: "MCQ", label: language === 'ar' ? "اختيار من متعدد" : "Multiple Choice" },
    { id: "TRUE_FALSE", label: language === 'ar' ? "صح وخطأ" : "True / False" },
    { id: "MULTI_SELECT", label: language === 'ar' ? "اختيار متعدد" : "Multi-select" }
  ];

  const CATEGORIES = [
    "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
    "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
    "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
    "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
    "SAT Math", "SAT English"
  ];

  const SKILLS = ["General", "Critical Thinking", "Problem Solving", "Analysis", "Application"];

  const toggleCourseSubject = (subject: string) => {
    const current = courseData.subjects || [];
    const next = current.includes(subject)
      ? current.filter((s: any) => s !== subject)
      : [...current, subject];
    setCourseData({ ...courseData, subjects: next });
  };

  const toggleCourseSchool = (id: string) => {
    const current = courseData.schoolIds || [];
    const next = current.includes(id) ? current.filter((sid: any) => sid !== id) : [...current, id];
    setCourseData({ ...courseData, schoolIds: next, isCentral: next.length === 0 });
  };

  const selectAllSchools = () => {
    if (!schools.length) return;
    if ((courseData.schoolIds || []).length === schools.length) {
      setCourseData({ ...courseData, schoolIds: [], isCentral: true });
    } else {
      setCourseData({ ...courseData, schoolIds: schools.map((s) => s.id), isCentral: false });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchSchools(token);
  }, []);

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/schools`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : (data.schools || []));
      }
    } catch (error) {
      console.error("Failed to fetch schools");
    }
  };

  const handleRemoveLesson = async (index: number) => {
    const lesson = lessons[index];
    if (lesson.id) {
      if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا الدرس نهائياً؟" : "Are you sure you want to permanently delete this lesson?")) return;
      try {
        const token = localStorage.getItem("super_admin_token");
        const res = await fetch(`${API_URL}/lessons/${lesson.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          showToast(language === 'ar' ? "فشل الحذف من السيرفر" : "Failed to delete from server", "error");
          return;
        }
      } catch (e) {
        showToast(language === 'ar' ? "خطأ في الاتصال" : "Connection error", "error");
        return;
      }
    }
    const newLessons = [...lessons];
    newLessons.splice(index, 1);
    setLessons(newLessons);
  };

  const openAddLessonModal = () => {
    setEditingLessonIndex(null);
    setCurrentLesson({
      title: "",
      domain: "",
      content: "",
      videoUrl: "",
      summary: "",
      notes: "",
      standards: "",
      indicators: "",
      learningOutcomes: "",
      isVisible: true,
      publishDate: "",
      cutOffDate: "",
      slides: [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", videoUrl: "", sections: [] }],
      questions: [],
      assignments: [],
      attachments: []
    });
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (index: number) => {
    setEditingLessonIndex(index);
    const lessonToEdit = { ...lessons[index] };
    if (lessonToEdit.content === undefined || lessonToEdit.content === null) lessonToEdit.content = "";
    if (!lessonToEdit.slides || lessonToEdit.slides.length === 0) lessonToEdit.slides = [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", sections: [] }];
    if (!lessonToEdit.questions) lessonToEdit.questions = [];
    setCurrentLesson(lessonToEdit);
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const saveLesson = () => {
    if (!currentLesson.title) {
      showToast(t('courseCreate.lessonTitleRequired') || "Lesson title is required", "error");
      return;
    }
    const newLessons = [...lessons];
    if (editingLessonIndex !== null) {
      newLessons[editingLessonIndex] = currentLesson;
    } else {
      newLessons.push(currentLesson);
    }
    setLessons(newLessons);
    setIsLessonModalOpen(false);
  };

  const metadataExcelRef = useRef<HTMLInputElement>(null);
  const questionsExcelRef = useRef<HTMLInputElement>(null);
  const assignmentsExcelRef = useRef<HTMLInputElement>(null);

  const parseQuestionsFromExcel = (rows: any[][]) => {
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => String(h).trim().toLowerCase());

    const textIdx = headers.findIndex(h => h.includes("question") || h.includes("السؤال") || h.includes("نص السؤال"));
    const typeIdx = headers.findIndex(h => h.includes("type") || h.includes("نوع"));
    const opt1Idx = headers.findIndex(h => h.includes("option 1") || h.includes("الخيار 1") || h.includes("أول"));
    const opt2Idx = headers.findIndex(h => h.includes("option 2") || h.includes("الخيار 2") || h.includes("ثاني"));
    const opt3Idx = headers.findIndex(h => h.includes("option 3") || h.includes("الخيار 3") || h.includes("ثالث"));
    const opt4Idx = headers.findIndex(h => h.includes("option 4") || h.includes("الخيار 4") || h.includes("رابع"));
    const opt5Idx = headers.findIndex(h => h.includes("option 5") || h.includes("الخيار 5") || h.includes("خامس"));
    const correctIdx = headers.findIndex(h => h.includes("correct answer") || h.includes("الإجابة الصحيحة") || h.includes("الاجابه الصحيحه"));
    const correctsIdx = headers.findIndex(h => h.includes("correct answers") || h.includes("الإجابات") || h.includes("الاجابات"));
    const pointsIdx = headers.findIndex(h => h.includes("points") || h.includes("الدرجة") || h.includes("الدرجه") || h.includes("النقاط"));
    const skillIdx = headers.findIndex(h => h.includes("skill") || h.includes("المهارة") || h.includes("المهاره"));
    const stdIdx = headers.findIndex(h => h.includes("standard") || h.includes("معيار") || h.includes("المعيار"));
    const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشر"));
    const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("مخرج") || h.includes("ناتج") || h.includes("التعلم") || h.includes("learning"));
    const diffIdx = headers.findIndex(h => h.includes("difficulty") || h.includes("صعوبة") || h.includes("الصعوبة"));
    const dokIdx = headers.findIndex(h => h.includes("dok") || h.includes("عمق") || h.includes("depth"));
    const videoIdx = headers.findIndex(h => h.includes("video") || h.includes("فيديو") || h.includes("الفيديو"));
    const expIdx = headers.findIndex(h => h.includes("explanation") || h.includes("تفسير") || h.includes("التفسير") || h.includes("شرح"));

    const parsed: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every(c => String(c).trim() === "")) continue;

      const qText = textIdx >= 0 ? String(row[textIdx] ?? "").trim() : "";
      if (!qText) continue;

      let qType = typeIdx >= 0 ? String(row[typeIdx] ?? "").trim().toUpperCase() : "MCQ";
      if (qType.includes("TRUE") || qType.includes("صح") || qType.includes("T/F")) {
        qType = "TRUE_FALSE";
      } else if (qType.includes("MULTI") || qType.includes("تحديد") || qType.includes("متعدد")) {
        qType = "MULTI_SELECT";
      } else {
        qType = "MCQ";
      }

      const options: string[] = [];
      if (opt1Idx >= 0 && row[opt1Idx] !== "") options.push(String(row[opt1Idx]).trim());
      if (opt2Idx >= 0 && row[opt2Idx] !== "") options.push(String(row[opt2Idx]).trim());
      if (opt3Idx >= 0 && row[opt3Idx] !== "") options.push(String(row[opt3Idx]).trim());
      if (opt4Idx >= 0 && row[opt4Idx] !== "") options.push(String(row[opt4Idx]).trim());
      if (opt5Idx >= 0 && row[opt5Idx] !== "") options.push(String(row[opt5Idx]).trim());

      if (options.length === 0 && qType !== 'TRUE_FALSE') {
        options.push("Option 1", "Option 2", "Option 3", "Option 4");
      }

      const correctAnswer = correctIdx >= 0 ? String(row[correctIdx] ?? "").trim() : "";
      const correctAnswersStr = correctsIdx >= 0 ? String(row[correctsIdx] ?? "").trim() : "";
      const correctAnswers = correctAnswersStr ? correctAnswersStr.split(",").map(s => s.trim()).filter(Boolean) : [];

      const points = pointsIdx >= 0 ? (parseInt(String(row[pointsIdx])) || 1) : 1;
      const skill = skillIdx >= 0 ? String(row[skillIdx] ?? "").trim() : "General";
      const indicator = indIdx >= 0 ? String(row[indIdx] ?? "").trim() : "";
      const rawLearningOutcome = loIdx >= 0 ? String(row[loIdx] ?? "").trim() : "";
      const rawStandard = stdIdx >= 0 ? String(row[stdIdx] ?? "").trim() : "";
      const finalOutcome = rawLearningOutcome || rawStandard || "";
      const standard = finalOutcome;
      const learningOutcome = finalOutcome;
      const videoUrl = videoIdx >= 0 ? String(row[videoIdx] ?? "").trim() : "";

      let level = diffIdx >= 0 ? String(row[diffIdx] ?? "").trim() : "On Level";
      if (level.toLowerCase().includes("easy") || level.toLowerCase().includes("foundation") || level.includes("سهل") || level.includes("تأسيسي")) level = "Foundation";
      else if (level.toLowerCase().includes("hard") || level.toLowerCase().includes("advanced") || level.includes("صعب") || level.includes("متقدم")) level = "Advanced";
      else level = "On Level";

      const dokRaw = dokIdx >= 0 ? String(row[dokIdx] ?? "").trim() : "";
      const dok = normalizeDok(dokRaw) || (["DOK 1", "DOK 2", "DOK 3", "DOK 4"].includes(dokRaw) ? dokRaw : dokRaw);

      const explanation = expIdx >= 0 ? String(row[expIdx] ?? "").trim() : "";
      const sections = explanation ? [{ id: Date.now() + Math.random(), type: "EXPLANATION", content: explanation }] : [];

      parsed.push({
        id: Date.now() + Math.random(),
        type: "QUESTION",
        label: qType,
        title: qText.substring(0, 30) + "...",
        content: qText,
        text: qText,
        options,
        correctAnswer,
        correctAnswers,
        points,
        skill,
        standard,
        indicator,
        learningOutcome,
        level,
        dok,
        videoUrl,
        sections
      });
    }
    return parsed;
  };

  const handleMetadataExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (rows.length < 2) {
          showToast(t('courseCreate.excelNoDataError') || "Excel file is empty or does not contain data rows", "error");
          return;
        }

        const headers = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());

        const stdIdx = headers.findIndex(h => h.includes("standard") || h.includes("معيار") || h.includes("المعايير"));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات"));
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات"));
        const domainIdx = headers.findIndex(h => h.includes("domain") || h.includes("مجال") || h.includes("المجال"));
        const lessonIdx = headers.findIndex(h => h.includes("lesson") || h.includes("درس") || h.includes("الدرس"));

        if (stdIdx === -1 && indIdx === -1 && loIdx === -1 && domainIdx === -1) {
          showToast(t('courseCreate.excelNoHeaderError') || "Could not find matching columns (Standards, Indicators, Outcomes, Domain)", "error");
          return;
        }

        let standardVal = "";
        let indicatorVal = "";
        let outcomeVal = "";
        let domainVal = "";

        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim() !== ""));

        let filteredRows = dataRows;
        if (lessonIdx >= 0 && currentLesson.title) {
          const currentLessonTitleLower = currentLesson.title.trim().toLowerCase();
          const matchingRows = dataRows.filter(r => {
            const rowLesson = String(r[lessonIdx] ?? "").trim().toLowerCase();
            return rowLesson && (currentLessonTitleLower.includes(rowLesson) || rowLesson.includes(currentLessonTitleLower));
          });
          if (matchingRows.length > 0) {
            filteredRows = matchingRows;
          }
        }

        if (filteredRows.length > 0) {
          const standardsList = filteredRows.map(r => stdIdx >= 0 ? String(r[stdIdx] ?? "").trim() : "").filter(Boolean);
          const indicatorsList = filteredRows.map(r => indIdx >= 0 ? String(r[indIdx] ?? "").trim() : "").filter(Boolean);
          const outcomesList = filteredRows.map(r => loIdx >= 0 ? String(r[loIdx] ?? "").trim() : "").filter(Boolean);
          const domainList = filteredRows.map(r => domainIdx >= 0 ? String(r[domainIdx] ?? "").trim() : "").filter(Boolean);

          standardVal = standardsList.join("\n");
          indicatorVal = indicatorsList.join("\n");
          outcomeVal = outcomesList.join("\n");
          domainVal = domainList[0] || "";
        }

        setCurrentLesson((prev: any) => ({
          ...prev,
          standards: standardVal || prev.standards,
          indicators: indicatorVal || prev.indicators,
          learningOutcomes: outcomeVal || prev.learningOutcomes,
          domain: domainVal || prev.domain
        }));

        showToast(t('courseCreate.excelMetadataSuccess') || "Standards, indicator and domain successfully imported from Excel", "success");
      } catch (err) {
        console.error(err);
        showToast(t('courseCreate.excelMetadataError') || "Error reading Excel file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const excelContext = useRef<any>(null);
  excelContext.current = { currentModule: currentLesson, setCurrentModule: setCurrentLesson, language, showToast };
  const handleQuestionsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    importModuleQuestions(e, null, 'questions', () => excelContext.current, true);
  const handleAssignmentsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    importModuleQuestions(e, null, 'assignments', () => excelContext.current, true);

  const handleExcelUpload = (type: 'questions' | 'metadata' | 'assignments') => {
    if (type === 'metadata') {
      metadataExcelRef.current?.click();
    } else if (type === 'questions') {
      questionsExcelRef.current?.click();
    } else if (type === 'assignments') {
      assignmentsExcelRef.current?.click();
    }
  };

  const downloadMetadataTemplate = () => {
    const wsData = [
      ["Lesson Title", "Standard", "Indicator", "Outcome", "Domain"],
      ["مقدمة في الفيزياء", "Standard 1: Understanding & Comprehension", "Indicator 1: Identifies Basic Concepts", "Outcome 1: Student will be able to...", "الفيزياء"],
      ["مقدمة في الفيزياء", "Standard 2: Application & Analysis", "Indicator 2: Applies Mathematical Laws", "Outcome 2: Student will distinguish between...", "الفيزياء"],
      ["الحركة الموجية", "Standard 3: Critical Thinking", "Indicator 3: Infers Relationships", "Outcome 3: Student will analyze...", "الفيزياء"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metadata Template");
    XLSX.writeFile(wb, "course_metadata_template.xlsx");
    showToast(language === 'ar' ? "تم تحميل نموذج المعايير بنجاح" : "Metadata template downloaded successfully", "success");
  };

  const downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    XLSX.writeFile(buildQuestionWorkbook(null, language), type === 'assignments' ? 'assignments_template.xlsx' : 'questions_template.xlsx');
  };
  const addBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT'
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    setCurrentLesson((prev: any) => ({
      ...prev,
      [source]: [...(prev[source] || []), newBlock]
    }));
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT'
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 0, newBlock);
      return { ...prev, [source]: newSlides };
    });
    showToast("Slide inserted successfully", "success");
  };

  const moveBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, direction: 'UP' | 'DOWN') => {
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSlides.length) return prev;
      [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
      return { ...prev, [source]: newSlides };
    });
  };

  const updateBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, field: string, value: any, blockRef?: any) => {
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const resolvedIndex = blockRef
        ? newSlides.findIndex((candidate: any) => candidate === blockRef || (blockRef.id != null && candidate?.id === blockRef.id))
        : index;
      if (resolvedIndex < 0 || !newSlides[resolvedIndex]) return prev;
      newSlides[resolvedIndex] = { ...newSlides[resolvedIndex], [field]: value };
      if (field === 'content') {
        newSlides[resolvedIndex].text = value;
      } else if (field === 'text') {
        newSlides[resolvedIndex].content = value;
      }
      return { ...prev, [source]: newSlides };
    });
  };

  const updateBlockTypeAndReset = (source: 'slides' | 'assignments' | 'questions', index: number, newType: string) => {
    const isOldSimple = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(newType);
    let defaultOptions: any = ["", "", "", ""];
    let defaultCorrect = "";

    if (newType === 'TRUE_FALSE') {
      defaultOptions = language === 'ar' ? ["صحيح", "خطأ"] : ["True", "False"];
      defaultCorrect = language === 'ar' ? "صحيح" : "True";
    } else if (newType === 'MULTI_SELECT') {
      defaultOptions = ["", "", "", ""];
      defaultCorrect = "[]";
    } else if (!isOldSimple) {
      if (newType === 'MATCHING') {
        defaultOptions = JSON.stringify({ left: [], right: [] });
        defaultCorrect = JSON.stringify({});
      } else if (newType === 'DRAG_DROP_FILL') {
        defaultOptions = JSON.stringify({ sentence: "", choices: [] });
        defaultCorrect = JSON.stringify([]);
      } else if (newType === 'GROUP_SORTING') {
        defaultOptions = JSON.stringify({ groups: [], items: [] });
        defaultCorrect = JSON.stringify({});
      } else if (newType === 'CLOCK') {
        defaultOptions = JSON.stringify({ minuteStep: 5 });
        defaultCorrect = "12:00";
      } else if (newType === 'MIND_MAP') {
        defaultOptions = JSON.stringify({ nodes: [] });
        defaultCorrect = JSON.stringify({});
      } else if (newType === 'VIDEO_CHECKPOINT') {
        defaultOptions = JSON.stringify({ videoUrl: "", checkpoints: [] });
        defaultCorrect = JSON.stringify({});
      } else if (newType === 'GEOGEBRA') {
        defaultOptions = JSON.stringify({ materialId: "", width: 800, height: 500, iframeUrl: "" });
        defaultCorrect = "";
      } else {
        defaultOptions = JSON.stringify({ choices: [] });
        defaultCorrect = "";
      }
    }

    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides[index] = {
        ...newSlides[index],
        label: newType,
        options: defaultOptions,
        correctAnswer: defaultCorrect,
        correctAnswers: newType === 'MULTI_SELECT' ? [] : undefined
      };
      return { ...prev, [source]: newSlides };
    });
  };

  const removeBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذه الشريحة/السؤال؟" : "Are you sure you want to delete this slide/question?")) return;
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 1);
      return { ...prev, [source]: newSlides };
    });
  };

  const addSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, type: string) => {
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      if (!newSlides[blockIndex]) return prev;
      const sections = [...(newSlides[blockIndex].sections || []), { id: Date.now() + Math.random(), type, content: "" }];
      newSlides[blockIndex] = { ...newSlides[blockIndex], sections };
      return { ...prev, [source]: newSlides };
    });
  };

  const updateSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number, content: string, blockRef?: any, sectionRef?: any) => {
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const resolvedBlockIndex = blockRef
        ? newSlides.findIndex((candidate: any) => candidate === blockRef || (blockRef.id != null && candidate?.id === blockRef.id))
        : blockIndex;
      const block = newSlides[resolvedBlockIndex];
      if (!block) return prev;
      const sections = [...(block.sections || [])];
      const resolvedSectionIndex = sectionRef
        ? sections.findIndex((candidate: any) => candidate === sectionRef || (sectionRef.id != null && candidate?.id === sectionRef.id))
        : sectionIndex;
      if (resolvedSectionIndex < 0 || !sections[resolvedSectionIndex]) return prev;
      sections[resolvedSectionIndex] = { ...sections[resolvedSectionIndex], content };
      newSlides[resolvedBlockIndex] = { ...block, sections };
      return { ...prev, [source]: newSlides };
    });
  };

  const removeSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا القسم؟" : "Are you sure you want to delete this section?")) return;
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      if (!newSlides[blockIndex]) return prev;
      const sections = [...(newSlides[blockIndex].sections || [])];
      sections.splice(sectionIndex, 1);
      newSlides[blockIndex] = { ...newSlides[blockIndex], sections };
      return { ...prev, [source]: newSlides };
    });
  };

  return (
    <DashboardLayout>
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-6xl my-auto relative shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[40px] shrink-0">
               <h2 className="text-2xl font-black text-slate-900">{t('courseCreate.lessonDetails') || "Lesson Details"}</h2>
               <button onClick={() => setIsLessonModalOpen(false)} className="p-3 bg-white rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shadow-sm">
                 <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
                {['info', 'slides', 'assignments', 'exercises', 'attachments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-3 ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                        : 'bg-white text-slate-500 hover:bg-indigo-50 border border-slate-200'
                    }`}
                  >
                    {tab === 'info' && <BookOpen className="w-5 h-5" />}
                    {tab === 'slides' && <Layout className="w-5 h-5" />}
                    {tab === 'assignments' && <FileText className="w-5 h-5" />}
                    {tab === 'exercises' && <Target className="w-5 h-5" />}
                    {tab === 'attachments' && <Upload className="w-5 h-5" />}
                    {t(`courseCreate.tab_${tab}`) || tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm">
                {activeTab === 'info' && (
                   <LessonInfoTab currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} showToast={showToast} metadataExcelRef={metadataExcelRef} handleExcelUpload={handleExcelUpload} />
                )}
                {activeTab === 'slides' && (
                   <LessonSlidesBuilder source="slides" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} />
                )}
                {activeTab === 'assignments' && (
                   <LessonQuestionsBuilder source="assignments" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} showQuestionForm={showQuestionForm} setShowQuestionForm={setShowQuestionForm} editingQuestionIndex={editingQuestionIndex} setEditingQuestionIndex={setEditingQuestionIndex} tempQuestion={tempQuestion} setTempQuestion={setTempQuestion} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
                )}
                {activeTab === 'exercises' && (
                   <LessonQuestionsBuilder source="questions" currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} assignmentsExcelRef={assignmentsExcelRef} questionsExcelRef={questionsExcelRef} handleAssignmentsExcelChange={handleAssignmentsExcelChange} handleQuestionsExcelChange={handleQuestionsExcelChange} handleExcelUpload={handleExcelUpload} downloadQuestionsTemplate={downloadQuestionsTemplate} showQuestionForm={showQuestionForm} setShowQuestionForm={setShowQuestionForm} editingQuestionIndex={editingQuestionIndex} setEditingQuestionIndex={setEditingQuestionIndex} tempQuestion={tempQuestion} setTempQuestion={setTempQuestion} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
                )}
                {activeTab === 'attachments' && (
                   <LessonAttachmentsTab currentLesson={currentLesson} setCurrentLesson={setCurrentLesson} language={language} showToast={showToast} />
                )}
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button onClick={() => setIsLessonModalOpen(false)} className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                {t('courseCreate.cancelChanges') || "Cancel Changes"}
              </button>
              <button onClick={saveLesson} className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3">
                {t('courseCreate.saveLesson') || "Confirm & Save Lesson"}
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative max-w-[1600px] mx-auto p-4 md:p-8">
        {/* Left Side: Course Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-2xl font-black text-slate-900">{t('courseCreate.courseDetails') || "Course Details"}</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.courseTitle')} <span className="text-red-500">*</span></label>
              <input type="text" value={courseData.title} onChange={e => setCourseData({...courseData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" placeholder={t('courseCreate.courseTitlePlaceholder') || "Enter course title"} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.courseDescription')}</label>
              <textarea value={courseData.description} onChange={e => setCourseData({...courseData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all min-h-[120px]" placeholder={t('courseCreate.courseDescriptionPlaceholder') || "Describe the course"} />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.coverImage') || "Cover Image"}</label>
              <input type="text" value={courseData.coverImage} onChange={e => setCourseData({...courseData, coverImage: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.targetGrades')} <span className="text-red-500">*</span></label>
              <div className="space-y-3">
                {[
                  { name: language === 'ar' ? 'المرحلة الابتدائية' : 'Elementary', grades: ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي", "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"] },
                  { name: language === 'ar' ? 'المرحلة الإعدادية' : 'Middle School', grades: ["الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"] },
                  { name: language === 'ar' ? 'المرحلة الثانوية' : 'High School', grades: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"] }
                ].map(group => (
                  <div key={group.name} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-black text-slate-700">{group.name}</span>
                      <button type="button" onClick={() => {
                        const allSelected = group.grades.every(g => courseData.grades.includes(g));
                        if (allSelected) {
                          setCourseData({ ...courseData, grades: courseData.grades.filter(g => !group.grades.includes(g)) });
                        } else {
                          const newGrades = [...courseData.grades];
                          group.grades.forEach(g => { if (!newGrades.includes(g)) newGrades.push(g); });
                          setCourseData({ ...courseData, grades: newGrades });
                        }
                      }} className="text-[10px] font-black text-indigo-600 hover:underline">
                        {group.grades.every(g => courseData.grades.includes(g)) ? (t('courseCreate.deselectAll') || "Deselect All") : (t('courseCreate.selectAll') || "Select All")}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {group.grades.map(g => (
                            <label key={g} className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${courseData.grades.includes(g) ? 'bg-indigo-50/50 border-indigo-400' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${courseData.grades.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'}`}>
                                {courseData.grades.includes(g) && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                              <span className={`text-[11px] sm:text-xs font-bold ${courseData.grades.includes(g) ? 'text-indigo-900' : 'text-slate-600'}`}>{getGradeCheckboxLabel(g)}</span>
                              <input type="checkbox" className="hidden" checked={courseData.grades.includes(g)} onChange={(e) => {
                                if (e.target.checked) setCourseData({ ...courseData, grades: [...courseData.grades, g] });
                                else setCourseData({ ...courseData, grades: courseData.grades.filter(gr => gr !== g) });
                              }} />
                            </label>
                          ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.subjectSpecialization')} <span className="text-red-500">*</span></label>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${courseData.subjects.includes(cat)
                        ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={courseData.subjects.includes(cat)}
                        onChange={() => toggleCourseSubject(cat)}
                      />
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center transition-all ${courseData.subjects.includes(cat)
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 border border-slate-200"
                          }`}
                      >
                        {courseData.subjects.includes(cat) && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span className="text-xs font-black">{getSubjectName(cat)}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-bold">{t('courseCreate.subjectHelper')}</p>
              </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.assignSchool')}</label>
              {schools.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold text-sm">
                  {t('courseCreate.noSchools')}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center px-2 mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.selectSchoolsOptional')}</span>
                    <button
                      type="button"
                      onClick={selectAllSchools}
                      className="text-[10px] font-black text-indigo-600 hover:underline"
                    >
                      {(courseData.schoolIds || []).length === schools.length ? t('courseCreate.deselectAll') : t('courseCreate.selectAll')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {schools.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${(courseData.schoolIds || []).includes(s.id)
                          ? "bg-indigo-50 border-indigo-500"
                          : "bg-white border-transparent hover:border-slate-200"
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={(courseData.schoolIds || []).includes(s.id)}
                          onChange={() => toggleCourseSchool(s.id)}
                        />
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${(courseData.schoolIds || []).includes(s.id)
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 border border-slate-200"
                            }`}
                        >
                          {(courseData.schoolIds || []).includes(s.id) && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{s.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {t('courseCreate.schoolAssignmentHelper')}
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[40px] flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <ListOrdered className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">{t('courseCreate.courseContent')}</h4>
              <p className="text-indigo-600 font-bold">{t('courseCreate.lessonsCompleted').replace('{n}', String(lessons.length))}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Lessons Management */}
      <div className="lg:col-span-8 space-y-8">
        <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
            <Layers className="w-8 h-8 text-indigo-600" />
            {t('courseCreate.curriculumStructure')}
          </h3>
          <button
            onClick={openAddLessonModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
          >
            <Plus className="w-6 h-6" />
            {t('courseCreate.addNewLesson')}
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-slate-100 rounded-[50px] p-24 text-center group cursor-pointer hover:border-indigo-500/20 transition-all" onClick={openAddLessonModal}>
            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all">
              <Monitor className="w-12 h-12 text-slate-300 group-hover:text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">{t('courseCreate.startDreamCourse') || "Start your dream course"}</h3>
            <p className="text-slate-400 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-lg">{t('courseCreate.noLessonsYet') || "No lessons yet"}</p>
            <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20">
              {t('courseCreate.addFirstLesson') || "Add First Lesson"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessons.map((lesson, index) => (
              <div key={index} className="bg-white border border-slate-100 rounded-[40px] p-8 hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100">
                    {index + 1}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditLessonModal(index)}
                      className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-blue-100"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveLesson(index)}
                      className="w-12 h-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-red-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-black text-slate-900 text-2xl mb-4 truncate leading-tight group-hover:text-indigo-600 transition-colors">{lesson.title || t('courseCreate.untitledLesson')}</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-400">
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Monitor className={`w-4 h-4 ${lesson.slides?.length ? 'text-indigo-600' : 'text-slate-300'}`} />
                    {(t('courseCreate.slidesCount') || "{n} Slides").replace('{n}', String(lesson.slides?.length || 0))}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <HelpCircle className={`w-4 h-4 ${lesson.questions?.length ? 'text-amber-500' : 'text-slate-300'}`} />
                    {(t('courseCreate.exercisesCount') || "{n} Exercises").replace('{n}', String(lesson.questions?.length || 0))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
