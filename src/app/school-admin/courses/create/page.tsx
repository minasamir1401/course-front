"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Plus, Trash2, Video, FileText, HelpCircle, BookOpen, Save, Layers, Edit2, X, ChevronDown, ChevronUp, Play, Layout, Target, CheckCircle2, AlertCircle, Upload, Download, Settings, Eye, Monitor, ListOrdered, FileJson, FileDown, Clock, Lightbulb, MessageSquareQuote, TriangleAlert, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import RichTextEditor from "@/components/RichTextEditor";
import { compressImage } from "@/lib/image-utils";
import FileUpload from "@/components/FileUpload";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";

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
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolName, setSchoolName] = useState<string>("");

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
    correctAnswer: "", points: 1, skill: "General", level: "Medium", dok: "",
    learningOutcome: "", standard: "", indicator: "",
    sections: [], correctAnswers: [], attempts: 1
  });

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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
    "المعيار 1: الفهم الأساسي",
    "المعيار 2: القدرة على التحليل",
    "المعيار 3: التطبيق العملي",
    "المعيار 4: التفكير الإبداعي"
  ];

  const INDICATORS = [
    "المؤشر 1.1: تعريف المصطلحات",
    "المؤشر 1.2: شرح المفاهيم",
    "المؤشر 2.1: مقارنة النتائج",
    "المؤشر 3.1: حل المسائل"
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
      ? current.filter((s) => s !== subject)
      : [...current, subject];
    setCourseData({ ...courseData, subjects: next });
  };

  const toggleCourseSchool = (id: string) => {
    const current = courseData.schoolIds || [];
    const next = current.includes(id) ? current.filter((sid) => sid !== id) : [...current, id];
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
    const token = localStorage.getItem("school_admin_token");
    const userStr = localStorage.getItem("school_admin_user");
    if (!token || !userStr) {
      router.push("/school-admin/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setCourseData(prev => ({
        ...prev,
        isCentral: false,
        schoolIds: [user.schoolId]
      }));
      if (user.schoolName) {
        setSchoolName(user.schoolName);
      } else if (user.school?.name) {
        setSchoolName(user.school.name);
      }
    } catch (e) {
      console.error(e);
      router.push("/school-admin/login");
    }
  }, []);

  const fetchSchools = async (token: string) => {};

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
    const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("مخرج") || h.includes("ناتج") || h.includes("التعلم"));
    const diffIdx = headers.findIndex(h => h.includes("difficulty") || h.includes("صعوبة") || h.includes("الصعوبة"));
    const dokIdx = headers.findIndex(h => h.includes("dok"));
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
      const standard = stdIdx >= 0 ? String(row[stdIdx] ?? "").trim() : "";
      const indicator = indIdx >= 0 ? String(row[indIdx] ?? "").trim() : "";
      const learningOutcome = loIdx >= 0 ? String(row[loIdx] ?? "").trim() : "";
      const videoUrl = videoIdx >= 0 ? String(row[videoIdx] ?? "").trim() : "";

      let level = diffIdx >= 0 ? String(row[diffIdx] ?? "").trim() : "Medium";
      if (level.toLowerCase().includes("easy") || level.includes("سهل")) level = "Easy";
      else if (level.toLowerCase().includes("hard") || level.includes("صعب")) level = "Hard";
      else level = "Medium";

      const dokRaw = dokIdx >= 0 ? String(row[dokIdx] ?? "").trim() : "";
      const dok = ["DOK 1", "DOK 2", "DOK 3", "DOK 4"].includes(dokRaw) ? dokRaw : "";

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

  const handleQuestionsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        const parsed = parseQuestionsFromExcel(rows);
        if (parsed.length === 0) {
          showToast(language === 'ar' ? "لم يتم العثور على أسئلة صالحة في الملف" : "No valid questions found in the file", "error");
          return;
        }

        const newStds = Array.from(new Set(parsed.map(q => q.standard).filter(Boolean)));
        const newInds = Array.from(new Set(parsed.map(q => q.indicator).filter(Boolean)));
        const newLos = Array.from(new Set(parsed.map(q => q.learningOutcome).filter(Boolean)));

        const currentStds = (currentLesson.standards || "").split("\n").filter(Boolean);
        const currentInds = (currentLesson.indicators || "").split("\n").filter(Boolean);
        const currentLos = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);

        const updatedStds = Array.from(new Set([...currentStds, ...newStds])).join("\n");
        const updatedInds = Array.from(new Set([...currentInds, ...newInds])).join("\n");
        const updatedLos = Array.from(new Set([...currentLos, ...newLos])).join("\n");

        setCurrentLesson((prev: any) => ({
          ...prev,
          questions: [...(prev.questions || []), ...parsed],
          standards: updatedStds,
          indicators: updatedInds,
          learningOutcomes: updatedLos
        }));

        showToast(
          language === 'ar'
            ? `تم استيراد ${parsed.length} سؤال بنجاح`
            : `Imported ${parsed.length} questions successfully`,
          "success"
        );
      } catch (err) {
        console.error(err);
        showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف Excel" : "Error reading Excel file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleAssignmentsExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        const parsed = parseQuestionsFromExcel(rows);
        if (parsed.length === 0) {
          showToast(language === 'ar' ? "لم يتم العثور على واجبات صالحة في الملف" : "No valid assignments found in the file", "error");
          return;
        }

        const newStds = Array.from(new Set(parsed.map(q => q.standard).filter(Boolean)));
        const newInds = Array.from(new Set(parsed.map(q => q.indicator).filter(Boolean)));
        const newLos = Array.from(new Set(parsed.map(q => q.learningOutcome).filter(Boolean)));

        const currentStds = (currentLesson.standards || "").split("\n").filter(Boolean);
        const currentInds = (currentLesson.indicators || "").split("\n").filter(Boolean);
        const currentLos = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);

        const updatedStds = Array.from(new Set([...currentStds, ...newStds])).join("\n");
        const updatedInds = Array.from(new Set([...currentInds, ...newInds])).join("\n");
        const updatedLos = Array.from(new Set([...currentLos, ...newLos])).join("\n");

        setCurrentLesson((prev: any) => ({
          ...prev,
          assignments: [...(prev.assignments || []), ...parsed],
          standards: updatedStds,
          indicators: updatedInds,
          learningOutcomes: updatedLos
        }));

        showToast(
          language === 'ar'
            ? `تم استيراد ${parsed.length} واجب بنجاح`
            : `Imported ${parsed.length} assignments successfully`,
          "success"
        );
      } catch (err) {
        console.error(err);
        showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف Excel" : "Error reading Excel file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

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
      ["مقدمة في الفيزياء", "معيار 1: الفهم والاستيعاب", "مؤشر 1: يحدد المفاهيم الأساسية", "ناتج 1: أن يكون الطالب قادراً على...", "الفيزياء"],
      ["مقدمة في الفيزياء", "معيار 2: التطبيق والتحليل", "مؤشر 2: يطبق القوانين الرياضية", "ناتج 2: أن يميز الطالب بين...", "الفيزياء"],
      ["الحركة الموجية", "معيار 3: التفكير النقدي", "مؤشر 3: يستنتج العلاقات", "ناتج 3: أن يحلل الطالب...", "الفيزياء"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metadata Template");
    XLSX.writeFile(wb, "course_metadata_template.xlsx");
    showToast(language === 'ar' ? "تم تحميل نموذج المعايير بنجاح" : "Metadata template downloaded successfully", "success");
  };

  const downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    const wsData = [
      [
        language === 'ar' ? "نص السؤال" : "Question Text",
        language === 'ar' ? "نوع السؤال" : "Question Type",
        language === 'ar' ? "الخيار 1" : "Option 1",
        language === 'ar' ? "الخيار 2" : "Option 2",
        language === 'ar' ? "الخيار 3" : "Option 3",
        language === 'ar' ? "الخيار 4" : "Option 4",
        language === 'ar' ? "الخيار 5" : "Option 5",
        language === 'ar' ? "الإجابة الصحيحة" : "Correct Answer",
        language === 'ar' ? "الإجابات الصحيحة المتعددة" : "Correct Answers",
        language === 'ar' ? "الدرجة" : "Points",
        language === 'ar' ? "المهارة" : "Skill",
        language === 'ar' ? "المعيار" : "Standard",
        language === 'ar' ? "المؤشر" : "Indicator",
        language === 'ar' ? "ناتج التعلم" : "Learning Outcome",
        language === 'ar' ? "مستوى الصعوبة" : "Difficulty Level",
        "DOK",
        language === 'ar' ? "رابط الفيديو" : "Video URL",
        language === 'ar' ? "التفسير" : "Explanation"
      ],
      [
        language === 'ar' ? "ما هو ناتج 5 + 5؟" : "What is 5 + 5?",
        "MCQ",
        "8", "9", "10", "11", "",
        "10", "", "1", "Math",
        language === 'ar' ? "معيار 1: العمليات الحسابية" : "Standard 1: Operations",
        language === 'ar' ? "مؤشر 1.1: الجمع" : "Indicator 1.1: Addition",
        language === 'ar' ? "أن يجمع الطالب الأعداد بشكل صحيح" : "LO: Students can add numbers correctly",
        "Easy", "DOK 1",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        language === 'ar' ? "الجمع الصحيح هو 10 لأن 5 زائد 5 يساوي 10" : "5 + 5 is 10"
      ],
      [
        language === 'ar' ? "الأرض كروية الشكل." : "The earth is round.",
        "TRUE_FALSE",
        "", "", "", "", "",
        language === 'ar' ? "صحيح" : "True", "", "1", "General",
        language === 'ar' ? "معيار 2: الجغرافيا الطبيعية" : "Standard 2: Physical Geography",
        language === 'ar' ? "مؤشر 2.1: شكل الأرض" : "Indicator 2.1: Earth Shape",
        language === 'ar' ? "أن يدرك شكل كوكب الأرض" : "LO: Understands planet earth's shape",
        "Easy", "DOK 2", "", ""
      ],
      [
        language === 'ar' ? "حدد قارات العالم القديم:" : "Select the ancient world continents:",
        "MULTI_SELECT",
        language === 'ar' ? "آسيا" : "Asia",
        language === 'ar' ? "أوروبا" : "Europe",
        language === 'ar' ? "أفريقيا" : "Africa",
        language === 'ar' ? "أستراليا" : "Australia", "",
        "",
        language === 'ar' ? "آسيا, أوروبا, أفريقيا" : "Asia, Europe, Africa",
        "2", "General",
        language === 'ar' ? "معيار 3: التاريخ القديم" : "Standard 3: Ancient History",
        language === 'ar' ? "مؤشر 3.1: القارات" : "Indicator 3.1: Continents",
        language === 'ar' ? "أن يحدد قارات العالم القديم" : "LO: Identifies old world continents",
        "Medium", "", "", ""
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions Template");
    const filename = type === 'assignments' ? "assignments_template.xlsx" : "practice_questions_template.xlsx";
    XLSX.writeFile(wb, filename);
    showToast(
      language === 'ar'
        ? "تم تحميل نموذج الأسئلة الاسترشادي بنجاح"
        : "Questions template downloaded successfully",
      "success"
    );
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
    const newSlides = [...(currentLesson[source] || [])];
    newSlides.splice(index, 0, newBlock);
    setCurrentLesson((prev: any) => ({
      ...prev,
      [source]: newSlides
    }));
    showToast("Slide inserted successfully", "success");
  };

  const moveBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, direction: 'UP' | 'DOWN') => {
    const newSlides = [...(currentLesson[source] || [])];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    setCurrentLesson((prev: any) => ({
      ...prev,
      [source]: newSlides
    }));
  };

  const updateBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, field: string, value: any) => {
    const newSlides = [...(currentLesson[source] || [])];
    newSlides[index] = { ...newSlides[index], [field]: value };
    if (field === 'content') {
      newSlides[index].text = value;
    } else if (field === 'text') {
      newSlides[index].content = value;
    }
    setCurrentLesson((prev: any) => ({ ...prev, [source]: newSlides }));
  };

  const updateBlockTypeAndReset = (source: 'slides' | 'assignments' | 'questions', index: number, newType: string) => {
    const isOldSimple = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(newType);
    let defaultOptions: any = ["", "", "", ""];
    let defaultCorrect = "";
    
    if (newType === 'TRUE_FALSE') {
      defaultOptions = ["صحيح", "خطأ"];
      defaultCorrect = "صحيح";
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
      } else {
        defaultOptions = JSON.stringify({ choices: [] });
        defaultCorrect = "";
      }
    }
    
    const newSlides = [...(currentLesson[source] || [])];
    newSlides[index] = { 
      ...newSlides[index], 
      label: newType,
      options: defaultOptions,
      correctAnswer: defaultCorrect,
      correctAnswers: newType === 'MULTI_SELECT' ? [] : undefined
    };
    setCurrentLesson((prev: any) => ({ ...prev, [source]: newSlides }));
  };

  const removeBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذه الشريحة/السؤال؟" : "Are you sure you want to delete this slide/question?")) return;
    const newSlides = [...(currentLesson[source] || [])];
    newSlides.splice(index, 1);
    setCurrentLesson((prev: any) => ({ ...prev, [source]: newSlides }));
  };

  const addSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, type: string) => {
    const newSlides = [...(currentLesson[source] || [])];
    if (!newSlides[blockIndex].sections) newSlides[blockIndex].sections = [];
    newSlides[blockIndex].sections.push({ id: Date.now() + Math.random(), type, content: "" });
    setCurrentLesson((prev: any) => ({ ...prev, [source]: newSlides }));
  };

  const updateSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number, content: string) => {
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides[blockIndex].sections[sectionIndex].content = content;
      return { ...prev, [source]: newSlides };
    });
  };

  const removeSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا القسم؟" : "Are you sure you want to delete this section?")) return;
    setCurrentLesson((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides[blockIndex].sections.splice(sectionIndex, 1);
      return { ...prev, [source]: newSlides };
    });
  };

  const renderSlidesBuilder = (source: 'slides' | 'assignments' | 'questions') => {
    const list = currentLesson[source] || [];

    // Label translations depending on source
    const headerLabel = source === 'slides'
      ? (language === 'ar' ? 'شرائح الشرح' : 'Lecture Slides')
      : source === 'assignments'
        ? (language === 'ar' ? 'الواجبات والتكليفات' : 'Lesson Assignments')
        : (language === 'ar' ? 'التدريبات التفاعلية' : 'Practice Quizzes (Quiz Me)');

    const headerDesc = source === 'slides'
      ? (language === 'ar' ? 'إضافة نصوص منسقة وشرائح تفاعلية لشرح المحاضرة' : 'Add rich text and interactive slides for lecture explanation')
      : source === 'assignments'
        ? (language === 'ar' ? 'إضافة مهام تطبيقية وكتل واجبات للطلاب' : 'Add application tasks and homework blocks for students')
        : (language === 'ar' ? 'إضافة أسئلة تدريبية تفاعلية لاختبار فهم الطلاب' : 'Add interactive practice questions to test student understanding');

    return (
      <div className="space-y-8">
        {source !== 'slides' && (
          <input
            type="file"
            ref={source === 'assignments' ? assignmentsExcelRef : questionsExcelRef}
            style={{ display: 'none' }}
            accept=".xlsx,.xls"
            onChange={source === 'assignments' ? handleAssignmentsExcelChange : handleQuestionsExcelChange}
          />
        )}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Layout className="w-6 h-6 text-indigo-600" />
              {headerLabel}
            </h4>
            <p className="text-slate-400 text-sm font-bold mt-1">{headerDesc}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {source !== 'slides' && (
              <>
                <button
                  type="button"
                  onClick={() => handleExcelUpload(source === 'assignments' ? 'assignments' : 'questions')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
                >
                  <Upload className="w-4 h-4" />
                  {language === 'ar' ? 'استيراد Excel' : 'Import Excel'}
                </button>
                <button
                  type="button"
                  onClick={() => downloadQuestionsTemplate(source === 'assignments' ? 'assignments' : 'questions')}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
                >
                  <Download className="w-4 h-4" />
                  {language === 'ar' ? 'تحميل نموذج' : 'Template'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => addBlock(source, 'TEXT')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? '+ محتوى نصي' : '+ Text Content'}
            </button>
            <button
              type="button"
              onClick={() => addBlock(source, 'QUESTION')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? '+ سؤال تفاعلي' : '+ Question Slide'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {list.map((block: any, sIdx: number) => (
            <React.Fragment key={block.id || sIdx}>
              {sIdx === 0 && (
                <div className="group/divider relative py-2 flex items-center justify-center my-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-dashed border-slate-200 group-hover/divider:border-indigo-300 transition-colors"></div>
                  </div>
                  <div className="relative flex justify-center opacity-0 group-hover/divider:opacity-100 transition-all duration-300 scale-95 group-hover/divider:scale-100 gap-3 z-10">
                    <button
                      type="button"
                      onClick={() => insertBlockAt(source, 0, 'TEXT')}
                      className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? '+ شريحة نصية' : '+ Text Slide'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertBlockAt(source, 0, 'QUESTION')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? '+ شريحة سؤال' : '+ Question Slide'}</span>
                    </button>
                  </div>
                  <div className="relative w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black group-hover/divider:hidden transition-all shadow-sm">
                    +
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-[30px] overflow-hidden group shadow-sm transition-all hover:shadow-md">
                <div className={`p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b ${block.type === 'QUESTION' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md ${block.type === 'QUESTION' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                      {sIdx + 1}
                    </span>
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                      <div className="flex gap-2">
                        <select
                          value={block.label}
                          onChange={(e) => updateBlockTypeAndReset(source, sIdx, e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 outline-none focus:border-indigo-600 px-2 py-1 uppercase"
                        >
                          {block.type === 'TEXT' ? (
                            <>
                              <option value="CONTENT">{language === 'ar' ? 'محتوى الشرح' : 'Content (Lecture)'}</option>
                              <option value="EXAMPLE">{language === 'ar' ? 'مثال محلول' : 'Worked Example'}</option>
                              <option value="SUMMARY">{language === 'ar' ? 'ملخص رئيسي' : 'Key Summary'}</option>
                              <option value="HINT">{language === 'ar' ? 'ملاحظة ومساعد' : 'Note / Helper'}</option>
                              <option value="EXPLANATION">{language === 'ar' ? 'شرح وتوضيح' : 'Explanation'}</option>
                            </>
                          ) : (
                            <>
                              <option value="MCQ">{language === 'ar' ? 'اختيار من متعدد (MCQ)' : 'Multiple Choice (MCQ)'}</option>
                              <option value="TRUE_FALSE">{language === 'ar' ? 'صح / خطأ (T/F)' : 'True / False (T/F)'}</option>
                              <option value="MULTI_SELECT">{language === 'ar' ? 'اختيار متعدد (تحديد)' : 'Multi-select (Checkboxes)'}</option>
                              <option value="MATCHING">{language === 'ar' ? 'سؤال التوصيل (Matching)' : 'Matching Elements'}</option>
                              <option value="DRAG_DROP_FILL">{language === 'ar' ? 'سحب الفراغات (Drag & Drop Fill)' : 'Drag & Drop Fill'}</option>
                              <option value="GROUP_SORTING">{language === 'ar' ? 'تصنيف المجموعات (Group Sorting)' : 'Group Sorting'}</option>
                              <option value="NUMBER_LINE">{language === 'ar' ? 'خط الأعداد (Number Line)' : 'Number Line'}</option>
                              <option value="CLOCK">{language === 'ar' ? 'عقارب الساعة (Clock)' : 'Interactive Clock'}</option>
                              <option value="MIND_MAP">{language === 'ar' ? 'خريطة مفاهيم (Mind Map)' : 'Concept Mind Map'}</option>
                              <option value="VIDEO_CHECKPOINT">{language === 'ar' ? 'فيديو تفاعلي (Video Checkpoint)' : 'Interactive Video'}</option>
                              <option value="SWIPE_SORT">{language === 'ar' ? 'سحب سريع لليمين/اليسار (Swipe Sort)' : 'Swipe Sort'}</option>
                              <option value="MAZE">{language === 'ar' ? 'المتاهة التعليمية (Maze)' : 'Educational Maze'}</option>
                              <option value="WORD_SEARCH">{language === 'ar' ? 'البحث عن الكلمات (Word Search)' : 'Word Search'}</option>
                              <option value="GEOGEBRA">{language === 'ar' ? 'جيوجيبرا (GeoGebra)' : 'GeoGebra Widget'}</option>
                              <option value="FLASH_CARD">{language === 'ar' ? 'البطاقات التعليمية (Flash Cards)' : 'Flash Cards'}</option>
                              <option value="MEMORY_GAME">{language === 'ar' ? 'لعبة الذاكرة (Memory Game)' : 'Memory Game'}</option>
                              <option value="WORD_SCRAMBLE">{language === 'ar' ? 'ترتيب الحروف (Word Scramble)' : 'Word Scramble'}</option>
                              <option value="SENTENCE_REORDER">{language === 'ar' ? 'ترتيب الجملة (Sentence Reorder)' : 'Sentence Reorder'}</option>
                              <option value="MATH_EQUATION">{language === 'ar' ? 'معادلة حسابية (Math Equation)' : 'Math Equation'}</option>
                              <option value="SEQUENCE_ORDER">{language === 'ar' ? 'ترتيب التسلسل (Sequence Order)' : 'Sequence Order'}</option>
                              <option value="CROSSWORD">{language === 'ar' ? 'الكلمات المتقاطعة (Crossword)' : 'Crossword'}</option>
                              <option value="COUNT_OBJECTS">{language === 'ar' ? 'عد العناصر (Count Objects)' : 'Count Objects'}</option>
                              <option value="IMAGE_LABEL">{language === 'ar' ? 'تسمية الصورة (Image Labeling)' : 'Image Labeling'}</option>
                              <option value="COLOR_MATCH">{language === 'ar' ? 'تطابق الألوان (Color Match)' : 'Color Match'}</option>
                            </>
                          )}
                        </select>
                        <input
                          type="text"
                          value={block.title || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'title', e.target.value)}
                          className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1 w-full md:w-48 placeholder:text-slate-400"
                          placeholder={block.type === 'TEXT' ? (language === 'ar' ? "عنوان القسم (اختياري)" : "Section Title (Optional)") : (language === 'ar' ? "عنوان السؤال (اختياري)" : "Question Title (Optional)")}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm ml-1">
                      <button
                        type="button"
                        disabled={sIdx === 0}
                        onClick={() => moveBlock(source, sIdx, 'UP')}
                        className="p-2 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:hover:text-slate-300 hover:bg-slate-50 rounded-lg transition-all"
                        title={language === 'ar' ? "تحريك لأعلى" : "Move Up"}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={sIdx === list.length - 1}
                        onClick={() => moveBlock(source, sIdx, 'DOWN')}
                        className="p-2 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:hover:text-slate-300 hover:bg-slate-50 rounded-lg transition-all"
                        title={language === 'ar' ? "تحريك لأسفل" : "Move Down"}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="relative" data-dropdown-root="true" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === `${source}-slide-${sIdx}` ? null : `${source}-slide-${sIdx}`);
                        }}
                        className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> {language === 'ar' ? 'إضافة كتلة' : 'Add Block'}
                      </button>
                      <div className={`absolute left-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 ${openDropdownId === `${source}-slide-${sIdx}` ? "block" : "hidden"}`}>
                        {['FEEDBACK', 'HINT', 'EXPLANATION', 'TIP', 'WARNING', 'KEY_INSIGHT'].map(secType => (
                          <button
                            key={secType}
                            type="button"
                            onClick={() => {
                               addSection(source, sIdx, secType);
                               setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex-center gap-2"
                          >
                            {React.createElement(SECTION_STYLE_PRESETS[secType]?.icon || FileText, { className: "w-4 h-4" })}
                            <span>{SECTION_STYLE_PRESETS[secType]?.label || secType}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlock(source, sIdx)}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-500/10 rounded-xl transition-all bg-white cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="mb-4">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">{language === 'ar' ? "رابط فيديو اختياري (يوتيوب/فيميو) لهذا القسم" : "Optional Video Link (YouTube/Vimeo) for this section"}</label>
                    <input
                      type="url"
                      value={block.videoUrl || ""}
                      onChange={(e) => updateBlock(source, sIdx, 'videoUrl', e.target.value)}
                      placeholder={language === 'ar' ? "الصق رابط الفيديو هنا..." : "Paste video URL here..."}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      value={block.content}
                      onChange={(val) => updateBlock(source, sIdx, 'content', val)}
                      placeholder={block.type === 'TEXT' ? (language === 'ar' ? "اكتب محتوى شرح الدرس هنا..." : "Write lecture explanation content here...") : (language === 'ar' ? "اكتب نص السؤال هنا..." : "Write question prompt here...")}
                      className="!bg-white !border-slate-200"
                    />
                  </div>

                  {block.type === 'QUESTION' && (
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4 p-6 bg-white border border-slate-200 rounded-[30px] shadow-sm">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المعيار' : 'Standard'}</label>
                        <select
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.standard || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'standard', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر المعيار...' : 'Select Standard...'}</option>
                          {(currentLesson.standards || "").split("\n").filter(Boolean).map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المؤشر' : 'Indicator'}</label>
                        <select
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.indicator || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'indicator', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر المؤشر...' : 'Select Indicator...'}</option>
                          {(currentLesson.indicators || "").split("\n").filter(Boolean).map((ind: string) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مخرج التعلم' : 'Learning Outcome'}</label>
                        <select
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.learningOutcome || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'learningOutcome', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر مخرج التعلم...' : 'Select Learning Outcome...'}</option>
                          {(currentLesson.learningOutcomes || "").split("\n").filter(Boolean).map((lo: string) => (
                            <option key={lo} value={lo}>{lo}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة' : 'Skill'}</label>
                        <select
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.skill || "General"}
                          onChange={(e) => updateBlock(source, sIdx, 'skill', e.target.value)}
                        >
                          <option value="General">{language === 'ar' ? 'عام' : 'General'}</option>
                          {["Math", "Physics", "Chemistry", "Biology", "Geology", "History", "Geography", "Philosophy", "Arabic", "English", "French"].map(sk => (
                            <option key={sk} value={sk}>{sk}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</label>
                        <select
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.level || "Medium"}
                          onChange={(e) => updateBlock(source, sIdx, 'level', e.target.value)}
                        >
                          <option value="Easy">{language === 'ar' ? 'سهل' : 'Easy'}</option>
                          <option value="Medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                          <option value="Hard">{language === 'ar' ? 'صعب' : 'Hard'}</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'عمق المعرفة (DOK)' : 'Depth of Knowledge (DOK)'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.dok || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'dok', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'بلا تحديد' : 'None'}</option>
                          <option value="DOK 1">DOK 1</option>
                          <option value="DOK 2">DOK 2</option>
                          <option value="DOK 3">DOK 3</option>
                          <option value="DOK 4">DOK 4</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'النقاط' : 'Points'}</label>
                        <input
                          type="number"
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.points !== undefined ? block.points : 1}
                          onChange={(e) => updateBlock(source, sIdx, 'points', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}

                  {block.type === 'QUESTION' && (
                    <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4">
                      {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(block.label || 'MCQ') ? (
                        <>
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">{language === 'ar' ? "خيارات الإجابة والإجابة الصحيحة" : "Answer Options & Correct Answer"}</label>
                          {block.label === 'TRUE_FALSE' ? (
                            <div className="grid grid-cols-2 gap-4">
                              {['صحيح', 'خطأ'].map((opt) => (
                                <div key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${block.correctAnswer === opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`} onClick={() => updateBlock(source, sIdx, 'correctAnswer', opt)}>
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${block.correctAnswer === opt ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-200 border-transparent'}`}>
                                    {block.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                                  </div>
                                  <span className="font-bold text-slate-700">{opt === 'صحيح' ? (language === 'ar' ? 'صحيح' : 'True') : (language === 'ar' ? 'خطأ' : 'False')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(block.options || []).map((opt: string, oIdx: number) => {
                                const isSelected = block.label === 'MULTI_SELECT'
                                  ? (block.correctAnswers || []).includes(opt)
                                  : block.correctAnswer === opt;
        
                                return (
                                  <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isSelected && opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`}>
                                    <div
                                      onClick={() => {
                                        if (block.label === 'MULTI_SELECT') {
                                          const answers = block.correctAnswers || [];
                                          if (answers.includes(opt) && opt) updateBlock(source, sIdx, 'correctAnswers', answers.filter((a:string) => a !== opt));
                                          else if (opt) updateBlock(source, sIdx, 'correctAnswers', [...answers, opt]);
                                        } else {
                                          updateBlock(source, sIdx, 'correctAnswer', opt);
                                        }
                                      }}
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${isSelected && opt ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-200 border-transparent'}`}
                                    >
                                      {isSelected && opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...(block.options || [])];
                                        newOpts[oIdx] = e.target.value;
                                        updateBlock(source, sIdx, 'options', newOpts);
                                      }}
                                      placeholder={language === 'ar' ? `الخيار ${oIdx + 1}` : `Option ${oIdx + 1}`}
                                      className="bg-transparent outline-none font-bold text-slate-700 flex-1"
                                    />
                                    {block.options.length > 2 && (
                                      <button type="button" onClick={() => {
                                        const newOpts = [...block.options];
                                        newOpts.splice(oIdx, 1);
                                        updateBlock(source, sIdx, 'options', newOpts);
                                      }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => updateBlock(source, sIdx, 'options', [...(block.options||[]), ""])}
                                className="flex justify-center items-center p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-200 hover:border-slate-400 transition-all cursor-pointer"
                              >
                                <Plus className="w-5 h-5 ml-1" /> {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <InteractiveQuestionEditor
                          question={{
                            ...block,
                            type: block.label || 'MCQ'
                          }}
                          onChange={(updatedQ) => {
                            updateBlock(source, sIdx, 'options', updatedQ.options);
                            updateBlock(source, sIdx, 'correctAnswer', updatedQ.correctAnswer);
                            if (updatedQ.type === 'MULTI_SELECT') {
                              try {
                                const parsed = JSON.parse(updatedQ.correctAnswer);
                                updateBlock(source, sIdx, 'correctAnswers', parsed);
                              } catch (e) {}
                            }
                          }}
                          language={language}
                        />
                      )}
                    </div>
                  )}

                  {(block.sections || []).length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "كتل المحتوى الديناميكية" : "Dynamic Content Blocks"}</label>
                      {(block.sections || []).map((sec: any, secIdx: number) => {
                        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                        const SectionIcon = preset.icon;
                        return (
                          <div key={sec.id || secIdx} className={`p-4 rounded-2xl relative group/section border ${preset.container}`}>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${preset.badge}`}>
                                <SectionIcon className="w-3.5 h-3.5" />
                                {preset.label}
                              </span>
                              <button type="button" onClick={() => removeSection(source, sIdx, secIdx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover/section:opacity-100 transition-all cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <RichTextEditor
                              value={sec.content}
                              onChange={(val) => updateSection(source, sIdx, secIdx, val)}
                              placeholder={language === 'ar' ? `اكتب محتوى الـ ${preset.label} هنا...` : `Write ${preset.label} content here...`}
                              className="!bg-white"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="group/divider relative py-2 flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-dashed border-slate-200 group-hover/divider:border-indigo-300 transition-colors"></div>
                </div>
                <div className="relative flex justify-center opacity-0 group-hover/divider:opacity-100 transition-all duration-300 scale-95 group-hover/divider:scale-100 gap-3 z-10">
                  <button
                    type="button"
                    onClick={() => insertBlockAt(source, sIdx + 1, 'TEXT')}
                    className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? '+ شريحة نصية' : '+ Text Slide'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlockAt(source, sIdx + 1, 'QUESTION')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? '+ شريحة سؤال' : '+ Question Slide'}</span>
                  </button>
                </div>
                <div className="relative w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black group-hover/divider:hidden transition-all shadow-sm">
                  +
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Advanced Question Logic
  const handleAddQuestionForSource = (source: 'assignments' | 'questions') => {
    setTempQuestion({
      id: Date.now() + Math.random(),
      text: "",
      type: "MCQ",
      label: "MCQ",
      options: ["", "", "", ""],
      correctAnswer: "",
      correctAnswers: [],
      points: 1,
      skill: "General",
      level: "Medium",
      dok: "",
      standard: "",
      indicator: "",
      learningOutcome: "",
      videoUrl: "",
      sections: [],
      attempts: 1
    });
    setEditingQuestionIndex(null);
    setQuestionSource(source);
    setShowQuestionForm(true);
  };

  const handleEditQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    const list = currentLesson[source] || [];
    const item = { ...list[index] };
    if (!item.options) item.options = ["", "", "", ""];
    if (!item.sections) item.sections = [];
    if (!item.type) item.type = item.label || "MCQ";
    setTempQuestion(item);
    setEditingQuestionIndex(index);
    setQuestionSource(source);
    setShowQuestionForm(true);
  };

  const handleSaveQuestionForSource = (source: 'assignments' | 'questions') => {
    if (!tempQuestion.text) {
      showToast(language === 'ar' ? "يرجى إدخال نص السؤال" : "Please enter question text", "error");
      return;
    }

    if (tempQuestion.type !== 'TEXT') {
      if (tempQuestion.type === 'TRUE_FALSE') {
        if (!tempQuestion.correctAnswer) {
          showToast(language === 'ar' ? "يرجى تحديد الإجابة الصحيحة" : "Please select the correct answer", "error");
          return;
        }
      } else if (tempQuestion.type === 'MULTI_SELECT') {
        const validAnswers = (tempQuestion.correctAnswers || []).filter(Boolean);
        if (validAnswers.length === 0) {
          showToast(language === 'ar' ? "يرجى اختيار إجابة صحيحة واحدة على الأقل" : "Please select at least one correct answer", "error");
          return;
        }
      } else {
        if (!tempQuestion.correctAnswer) {
          showToast(language === 'ar' ? "يرجى اختيار الإجابة الصحيحة" : "Please select the correct answer", "error");
          return;
        }
      }
    }

    const newList = [...(currentLesson[source] || [])];
    const itemToSave = {
      ...tempQuestion,
      label: tempQuestion.type // Ensure label is synced with type
    };

    if (editingQuestionIndex !== null) {
      newList[editingQuestionIndex] = itemToSave;
    } else {
      newList.push(itemToSave);
    }

    setCurrentLesson((prev: any) => ({ ...prev, [source]: newList }));
    setShowQuestionForm(false);
    setEditingQuestionIndex(null);
    showToast(language === 'ar' ? "تم حفظ السؤال في القائمة بنجاح" : "Question saved to list successfully", "success");
  };

  const removeQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    const newList = [...(currentLesson[source] || [])];
    newList.splice(index, 1);
    setCurrentLesson((prev: any) => ({ ...prev, [source]: newList }));
    showToast(language === 'ar' ? "تم حذف السؤال" : "Question deleted", "info");
  };

  const moveQuestionForSource = (source: 'assignments' | 'questions', index: number, direction: 'UP' | 'DOWN') => {
    const newList = [...(currentLesson[source] || [])];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setCurrentLesson((prev: any) => ({ ...prev, [source]: newList }));
  };

  const updateCurrentQuestionField = (field: string, value: any) => {
    setTempQuestion((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateQuestionOption = (oIdx: number, value: string) => {
    setTempQuestion((prev: any) => {
      const newOpts = [...prev.options];
      const oldVal = newOpts[oIdx];
      newOpts[oIdx] = value;
      const updated: any = { ...prev, options: newOpts };
      if (prev.type === 'MULTI_SELECT') {
        const answers = prev.correctAnswers || [];
        if (answers.includes(oldVal)) {
          updated.correctAnswers = answers.map((a: string) => a === oldVal ? value : a);
        }
      } else {
        if (prev.correctAnswer === oldVal) {
          updated.correctAnswer = value;
        }
      }
      return updated;
    });
  };

  const toggleQuestionCorrectAnswer = (oIdx: number) => {
    setTempQuestion((prev: any) => {
      const opt = prev.options[oIdx];
      if (!opt && prev.type !== 'TRUE_FALSE') return prev;

      const updated = { ...prev };
      if (prev.type === 'MULTI_SELECT') {
        const answers = prev.correctAnswers || [];
        if (answers.includes(opt)) {
          updated.correctAnswers = answers.filter((a: string) => a !== opt);
        } else {
          updated.correctAnswers = [...answers, opt];
        }
      } else {
        updated.correctAnswer = opt;
      }
      return updated;
    });
  };

  const isQuestionCorrectAnswer = (opt: string) => {
    if (!opt) return false;
    if (tempQuestion.type === 'MULTI_SELECT') {
      return (tempQuestion.correctAnswers || []).includes(opt);
    }
    return tempQuestion.correctAnswer === opt;
  };

  const addQuestionSection = (secType: string) => {
    setTempQuestion((prev: any) => {
      const sections = [...(prev.sections || [])];
      sections.push({ id: Date.now() + Math.random(), type: secType, content: "" });
      return { ...prev, sections };
    });
  };

  const updateQuestionSectionContent = (idx: number, value: string) => {
    setTempQuestion((prev: any) => {
      const sections = [...(prev.sections || [])];
      sections[idx] = { ...sections[idx], content: value };
      return { ...prev, sections };
    });
  };

  const removeQuestionSection = (idx: number) => {
    setTempQuestion((prev: any) => {
      const sections = [...(prev.sections || [])];
      sections.splice(idx, 1);
      return { ...prev, sections };
    });
  };

  // State to track which question is expanded in the list
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);

  const renderMetadataDropdown = (
    label: string,
    currentValue: string,
    field: 'standard' | 'indicator' | 'learningOutcome',
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    lessonField: 'standards' | 'indicators' | 'learningOutcomes'
  ) => {
    const list = (currentLesson[lessonField] || "").split("\n").filter(Boolean);
    const selectPlaceholder = language === 'ar' ? `اختر ${label}...` : `Select ${label}...`;
    const addCustomLabel = language === 'ar' ? `+ إضافة ${label} مخصص...` : `+ Add Custom ${label}...`;
    const promptEnterLabel = language === 'ar' ? `أدخل ${label} المخصص الجديد:` : `Enter new custom ${label}:`;
    const promptEditLabel = language === 'ar' ? `تعديل ${label} المخصص:` : `Edit custom ${label}:`;
    const confirmDeleteLabel = language === 'ar' ? `هل أنت متأكد من حذف هذا ${label}؟` : `Are you sure you want to delete this ${label}?`;

    return (
      <div className="flex flex-col gap-2 relative">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (field === 'standard') {
              setIsQuestionIndicatorOpen(false);
              setIsQuestionOutcomeOpen(false);
            } else if (field === 'indicator') {
              setIsQuestionStandardOpen(false);
              setIsQuestionOutcomeOpen(false);
            } else {
              setIsQuestionStandardOpen(false);
              setIsQuestionIndicatorOpen(false);
            }
          }}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold text-xs outline-none text-right flex justify-between items-center cursor-pointer min-h-[34px]"
        >
          <span className="truncate">{currentValue || selectPlaceholder}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full left-0 z-50 w-72 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150" dir="rtl">
              {list.map((opt: string) => (
                <div key={opt} className="flex items-center justify-between gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl transition-all">
                  <button
                    type="button"
                    onClick={() => {
                      updateCurrentQuestionField(field, opt);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-right font-bold text-slate-700 text-xs truncate"
                  >
                    {opt}
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = prompt(promptEditLabel, opt);
                        if (newVal !== null && newVal.trim()) {
                          const newList = list.map((x: string) => x === opt ? newVal.trim() : x);
                          setCurrentLesson((prev: any) => ({ ...prev, [lessonField]: newList.join("\n") }));
                          if (tempQuestion[field] === opt) {
                            updateCurrentQuestionField(field, newVal.trim());
                          }
                        }
                      }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(confirmDeleteLabel)) {
                          const newList = list.filter((x: string) => x !== opt);
                          setCurrentLesson((prev: any) => ({ ...prev, [lessonField]: newList.join("\n") }));
                          if (tempQuestion[field] === opt) {
                            updateCurrentQuestionField(field, "");
                          }
                        }
                      }}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newVal = prompt(promptEnterLabel);
                  if (newVal && newVal.trim()) {
                    const list = (currentLesson[lessonField] || "").split("\n").filter(Boolean);
                    if (!list.includes(newVal.trim())) {
                      const newList = [...list, newVal.trim()];
                      setCurrentLesson((prev: any) => ({ ...prev, [lessonField]: newList.join("\n") }));
                      updateCurrentQuestionField(field, newVal.trim());
                      setIsOpen(false);
                    }
                  }
                }}
                className="w-full text-center py-2 text-indigo-600 font-black text-xs hover:bg-indigo-50 border-t border-dashed border-slate-100 rounded-b-xl flex items-center justify-center gap-1 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addCustomLabel}</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderQuestionsBuilder = (source: 'assignments' | 'questions') => {
    const list = currentLesson[source] || [];
    const headerLabel = source === 'assignments'
      ? (language === 'ar' ? 'واجبات وتكليفات الدرس (Assignments)' : 'Lesson Assignments')
      : (language === 'ar' ? 'تدريبات وتقييمات الدرس (Quiz Me)' : 'Quiz Me Practice');

    const headerDesc = source === 'assignments'
      ? (language === 'ar' ? 'قم بإضافة التكليفات التطبيقية والواجبات المنزلية للطلاب' : 'Add application homework and assignments for students')
      : (language === 'ar' ? 'قم بإضافة أسئلة تدريبية تفاعلية لتقييم فهم واستيعاب الطالب' : 'Add interactive practice questions to test student understanding');

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <input
          type="file"
          ref={source === 'assignments' ? assignmentsExcelRef : questionsExcelRef}
          style={{ display: 'none' }}
          accept=".xlsx,.xls"
          onChange={source === 'assignments' ? handleAssignmentsExcelChange : handleQuestionsExcelChange}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-indigo-600" />
              {headerLabel}
            </h4>
            <p className="text-slate-400 text-sm font-bold mt-1">{headerDesc}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleExcelUpload(source === 'assignments' ? 'assignments' : 'questions')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
            >
              <Upload className="w-4 h-4" />
              {language === 'ar' ? 'استيراد Excel' : 'Import Excel'}
            </button>
            <button
              type="button"
              onClick={() => downloadQuestionsTemplate(source === 'assignments' ? 'assignments' : 'questions')}
              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
            >
              <Download className="w-4 h-4" />
              {language === 'ar' ? 'تحميل نموذج' : 'Template'}
            </button>
            <button
              type="button"
              onClick={() => handleAddQuestionForSource(source)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? '+ إضافة سؤال' : '+ Add Question'}
            </button>
          </div>
        </div>

        {/* Saved Questions Cards List */}
        {!showQuestionForm && (
          <div className="space-y-4">
            {list.length === 0 ? (
              <div className="bg-white rounded-[35px] border-4 border-dashed border-slate-100 p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 mb-1">{language === 'ar' ? 'لا يوجد أسئلة مضافة' : 'No questions added yet'}</h4>
                  <p className="text-slate-400 font-bold text-xs max-w-sm">{language === 'ar' ? 'ابدأ بإضافة سؤال جديد أو استيراده من ملف إكسيل' : 'Start by adding a new question or importing from Excel'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddQuestionForSource(source)}
                  className="bg-indigo-50 text-indigo-600 px-8 py-3.5 rounded-2xl font-black transition-all hover:bg-indigo-100 cursor-pointer text-xs"
                >
                  {language === 'ar' ? '+ إضافة أول سؤال' : '+ Add First Question'}
                </button>
              </div>
            ) : (
              list.map((q: any, index: number) => (
                <div key={q.id || index} className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                  <div className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                      <div className="flex flex-col items-center gap-1">
                        <button type="button" onClick={() => moveQuestionForSource(source, index, 'UP')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                        <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{index + 1}</span>
                        <button type="button" onClick={() => moveQuestionForSource(source, index, 'DOWN')} disabled={index === list.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                            {QUESTION_TYPES.find(t => t.id === q.type)?.label || q.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">
                            {q.level || "Medium"} {q.dok ? `• ${q.dok}` : ''} • {q.points || 1} {language === 'ar' ? 'درجة' : 'pts'}
                          </span>
                          {q.standard && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{q.standard}</span>}
                        </div>
                        <div
                          className="text-slate-700 font-bold truncate text-sm"
                          dangerouslySetInnerHTML={{ __html: (q.text || "").replace(/<[^>]*>?/gm, '').substring(0, 120) + '...' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedQuestionIndex(expandedQuestionIndex === index ? null : index)}
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-indigo-600 transition-all"
                        title="Expand"
                      >
                        {expandedQuestionIndex === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditQuestionForSource(source, index)}
                        className="w-10 h-10 bg-blue-50 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestionForSource(source, index)}
                        className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Question details collapsible view */}
                  {expandedQuestionIndex === index && (
                    <div className="px-8 pb-8 pt-4 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نص السؤال / المحتوى:' : 'Question Content:'}</h5>
                          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm prose prose-slate max-w-none text-sm font-bold" dangerouslySetInnerHTML={{ __html: q.text }} />

                          {q.learningOutcome && (
                            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-150 w-fit text-xs font-bold">
                              <Target className="w-4 h-4" />
                              <span>{q.learningOutcome}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          {q.type !== 'TEXT' && (
                            <>
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'معاينة السؤال:' : 'Question Preview:'}</h5>
                              {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(q.type) ? (
                                <div className="space-y-2">
                                  {Array.isArray(q.options) && q.options.filter(Boolean).map((opt: string, oIdx: number) => {
                                    const isCorrect = q.type === 'MULTI_SELECT'
                                      ? (q.correctAnswers || []).includes(opt)
                                      : q.correctAnswer === opt;
                                    return (
                                      <div key={oIdx} className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-bold transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-100 text-slate-600'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                                          {isCorrect ? '✓' : ''}
                                        </div>
                                        <span>{opt}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : q.type === 'FLASH_CARD' ? (
                                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-2 font-bold text-right" dir="rtl">
                                  <p className="text-slate-800"><span className="text-indigo-650">🎴 {language === 'ar' ? 'الوجه الأمامي (السؤال):' : 'Front (Question):'}</span> {parseJson(q.options, {front: ""}).front || q.text}</p>
                                  <p className="text-slate-800"><span className="text-indigo-650">✨ {language === 'ar' ? 'الوجه الخلفي (الإجابة):' : 'Back (Answer):'}</span> {parseJson(q.options, {back: ""}).back || q.correctAnswer}</p>
                                </div>
                              ) : (
                                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-1.5 font-bold text-right" dir="rtl">
                                  <p className="text-slate-400">{language === 'ar' ? `نوع النشاط: ${q.type}` : `Activity Type: ${q.type}`}</p>
                                  <p className="text-slate-800"><span className="text-emerald-600">✓ {language === 'ar' ? 'الإجابة النموذجية:' : 'Correct Answer:'}</span> {typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer || "")}</p>
                                </div>
                              )}
                            </>
                          )}

                          {q.sections && q.sections.length > 0 && (
                            <div className="space-y-3 pt-2">
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'تفسيرات وملاحظات إضافية:' : 'Explanations & Notes:'}</h5>
                              <div className="space-y-2">
                                {q.sections.map((sec: any, secIdx: number) => {
                                  const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                                  const SectionIcon = preset.icon;
                                  return (
                                    <div key={secIdx} className={`p-4 rounded-xl border ${preset.container} text-xs`}>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 mb-1.5 ${preset.badge}`}>
                                        <SectionIcon className="w-3 h-3" />
                                        {preset.label}
                                      </span>
                                      <div className="prose prose-slate max-w-none text-slate-700 font-bold font-sans" dangerouslySetInnerHTML={{ __html: sec.content }} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Premium Save Slide Form inside card list view */}
        {showQuestionForm && (
          <div className="bg-white rounded-[40px] border-2 border-indigo-500 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center">
              <h4 className="text-white font-black flex items-center gap-3">
                <Plus className="w-5 h-5" />
                {editingQuestionIndex !== null
                  ? (language === 'ar' ? `تعديل السؤال #${editingQuestionIndex + 1}` : `Edit Question #${editingQuestionIndex + 1}`)
                  : (language === 'ar' ? 'إضافة سؤال تفاعلي جديد' : 'Add New Question')}
              </h4>
              <button
                type="button"
                onClick={() => setShowQuestionForm(false)}
                className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 md:p-12 space-y-8">
              {/* Unified Metadata & Configuration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border border-slate-200 rounded-[30px] shadow-sm mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نوع السؤال' : 'Question Type'}</label>
                  <select
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                    value={tempQuestion.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const updated = { ...tempQuestion, type: newType };
                      if (newType === "TRUE_FALSE") {
                        updated.options = ["صحيح", "خطأ", "", ""];
                        updated.correctAnswer = "صحيح";
                      } else if (tempQuestion.type === "TRUE_FALSE") {
                        updated.options = ["", "", "", ""];
                        updated.correctAnswer = "";
                      }
                      setTempQuestion(updated);
                    }}
                  >
                    {QUESTION_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Standard with CRUD */}
                {renderMetadataDropdown(
                  language === 'ar' ? 'المعيار' : 'Standard',
                  tempQuestion.standard || "",
                  'standard',
                  isQuestionStandardOpen,
                  setIsQuestionStandardOpen,
                  'standards'
                )}

                {/* Custom Indicator with CRUD */}
                {renderMetadataDropdown(
                  language === 'ar' ? 'المؤشر' : 'Indicator',
                  tempQuestion.indicator || "",
                  'indicator',
                  isQuestionIndicatorOpen,
                  setIsQuestionIndicatorOpen,
                  'indicators'
                )}

                {/* Custom Learning Outcome with CRUD */}
                {renderMetadataDropdown(
                  language === 'ar' ? 'المخرج التعليمي' : 'Learning Outcome',
                  tempQuestion.learningOutcome || "",
                  'learningOutcome',
                  isQuestionOutcomeOpen,
                  setIsQuestionOutcomeOpen,
                  'learningOutcomes'
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة' : 'Skill'}</label>
                  <select
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                    value={tempQuestion.skill || "General"}
                    onChange={(e) => updateCurrentQuestionField("skill", e.target.value)}
                  >
                    {["General", "Critical Thinking", "Problem Solving", "Analysis", "Application", "Math", "Physics", "Chemistry", "Biology", "Geology", "History", "Geography", "Philosophy", "Arabic", "English", "French"].map(sk => (
                      <option key={sk} value={sk}>{sk}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</label>
                  <select
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                    value={tempQuestion.level || "Medium"}
                    onChange={(e) => updateCurrentQuestionField("level", e.target.value)}
                  >
                    <option value="Easy">{language === 'ar' ? 'سهل' : 'Easy'}</option>
                    <option value="Medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                    <option value="Hard">{language === 'ar' ? 'صعب' : 'Hard'}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'عمق المعرفة (DOK)' : 'Depth of Knowledge (DOK)'}</label>
                  <select
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                    value={tempQuestion.dok || ""}
                    onChange={(e) => updateCurrentQuestionField("dok", e.target.value)}
                  >
                    <option value="">{language === 'ar' ? 'بلا تحديد' : 'None'}</option>
                    <option value="DOK 1">DOK 1</option>
                    <option value="DOK 2">DOK 2</option>
                    <option value="DOK 3">DOK 3</option>
                    <option value="DOK 4">DOK 4</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'النقاط / الدرجة' : 'Points'}</label>
                  <input
                    type="number"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                    value={tempQuestion.points !== undefined ? tempQuestion.points : 1}
                    onChange={(e) => updateCurrentQuestionField("points", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'رابط فيديو اختياري للسؤال' : 'Optional Video Link'}</label>
                  <input
                    type="url"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 min-h-[34px]"
                    value={tempQuestion.videoUrl || ""}
                    onChange={(e) => updateCurrentQuestionField("videoUrl", e.target.value)}
                    placeholder="YouTube or Vimeo link..."
                  />
                </div>
              </div>

              {/* Rich Text Editor for Question Text */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نص السؤال أو التكليف الرئيسي' : 'Question / Assignment Prompt'}</label>
                <RichTextEditor
                  value={tempQuestion.text || ""}
                  onChange={(value) => updateCurrentQuestionField("text", value)}
                  placeholder="Write the question prompt here..."
                />
              </div>

              {/* Explanations & dynamic blocks inside form */}
              <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">{language === 'ar' ? 'تفسيرات الإجابة والكتل المساعدة' : 'Answer Explanations & Content Blocks'}</label>
                    <p className="text-slate-400 text-[10px] font-bold mt-0.5">{language === 'ar' ? 'أضف تلميحات أو ملاحظات أو تفسيرات تفصيلية لهذا السؤال' : 'Add hints, tips, or detailed explanations'}</p>
                  </div>
                  <div className="relative" data-dropdown-root="true">
                    <button
                      type="button"
                      onClick={() => setOpenDropdownId(openDropdownId === 'question-sections' ? null : 'question-sections')}
                      className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border border-indigo-100"
                    >
                      <Plus className="w-4 h-4" /> {language === 'ar' ? 'إضافة شريحة مساعدة' : 'Add Block'}
                    </button>
                    <div className={`absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 ${openDropdownId === 'question-sections' ? "block" : "hidden"}`}>
                      {['EXPLANATION', 'HINT', 'TIP', 'WARNING', 'KEY_INSIGHT'].map(secType => (
                        <button
                          key={secType}
                          type="button"
                          onClick={() => {
                             addQuestionSection(secType);
                             setOpenDropdownId(null);
                          }}
                          className="w-full text-right px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {React.createElement(SECTION_STYLE_PRESETS[secType]?.icon || FileText, { className: "w-4 h-4" })}
                          <span>{SECTION_STYLE_PRESETS[secType]?.label || secType}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(tempQuestion.sections || []).map((sec: any, idx: number) => {
                    const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                    const IconComponent = preset.icon;
                    return (
                      <div key={idx} className={`p-6 rounded-3xl border-2 flex flex-col gap-4 relative group ${preset.container}`}>
                        <div className="flex justify-between items-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${preset.badge}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                            {preset.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQuestionSection(idx)}
                            className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <RichTextEditor
                          value={sec.content || ""}
                          onChange={(value) => updateQuestionSectionContent(idx, value)}
                          placeholder="Write block content here..."
                          className="!bg-white !border-slate-200"
                        />
                      </div>
                    );
                  })}
                  {(tempQuestion.sections || []).length === 0 && (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-bold">
                      {language === 'ar' ? 'لا يوجد أي شرائح تفسيرية مضافة بعد.' : 'No explanations or content blocks added yet.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Options & Choices block */}
              {tempQuestion.type !== "TEXT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                  {tempQuestion.type === "TRUE_FALSE" ? (
                    <>
                      <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer("صحيح") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div
                          onClick={() => toggleQuestionCorrectAnswer(0)}
                          className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer("صحيح") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                        >
                          {isQuestionCorrectAnswer("صحيح") && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                        <span className="font-bold text-slate-700">{language === 'ar' ? 'صحيح' : 'True'}</span>
                      </div>
                      <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer("خطأ") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div
                          onClick={() => toggleQuestionCorrectAnswer(1)}
                          className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer("خطأ") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                        >
                          {isQuestionCorrectAnswer("خطأ") && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                        <span className="font-bold text-slate-700">{language === 'ar' ? 'خطأ' : 'False'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {(tempQuestion.options || ["", "", "", ""]).map((opt: string, oIndex: number) => (
                        <div key={oIndex} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer(opt) && opt !== "" ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                          <div
                            onClick={() => toggleQuestionCorrectAnswer(oIndex)}
                            className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer(opt) && opt !== "" ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                          >
                            {isQuestionCorrectAnswer(opt) && opt !== "" && <CheckCircle2 className="w-5 h-5 text-white" />}
                          </div>
                          <input
                            type="text"
                            placeholder={language === 'ar' ? `الخيار ${oIndex + 1}` : `Option ${oIndex + 1}`}
                            className="bg-transparent flex-1 outline-none font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                            value={opt}
                            onChange={(e) => updateQuestionOption(oIndex, e.target.value)}
                          />
                          {tempQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = [...tempQuestion.options];
                                newOptions.splice(oIndex, 1);
                                setTempQuestion({ ...tempQuestion, options: newOptions });
                              }}
                              className="text-red-400 hover:text-red-600 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <div
                        onClick={() => setTempQuestion({ ...tempQuestion, options: [...tempQuestion.options, ""] })}
                        className="flex items-center justify-center gap-2 p-5 rounded-[22px] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer text-indigo-600 font-bold text-sm"
                      >
                        <Plus className="w-5 h-5" />
                        {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="px-8 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuestionForSource(source)}
                  className="px-10 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{language === 'ar' ? 'حفظ السؤال في القائمة' : 'Save Slide to List'}</span>
                  <Save className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Auto-save interval
  useEffect(() => {
    if (!isAutoSaveEnabled) return;

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("school_admin_token");
        const userStr = localStorage.getItem("school_admin_user");
        if (!token || !userStr) return;
        const user = JSON.parse(userStr);
        const targetSchoolId = user.schoolId;

        const finalLessons = [...lessons];
        if (isLessonModalOpen && currentLesson.title) {
          if (editingLessonIndex !== null) {
            finalLessons[editingLessonIndex] = currentLesson;
          } else {
            finalLessons.push(currentLesson);
          }
        }

        const lessonsPayload = finalLessons.map((l) => ({
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
          assignments: JSON.stringify(l.assignments || [])
        }));

        const subjectString = courseData.subjects.join(", ");

        const payload = {
          title: courseData.title || "مسودة كورس بدون عنوان",
          description: courseData.description,
          coverImage: courseData.coverImage || null,
          grades: courseData.grades,
          subject: subjectString || "غير محدد",
          country: courseData.country,
          isCentral: false,
          schoolId: targetSchoolId,
          schoolIds: [targetSchoolId],
          lessons: lessonsPayload
        };

        const method = createdId ? "PUT" : "POST";
        const url = createdId
          ? `${API_URL}/school/courses/${createdId}`
          : `${API_URL}/school/courses`;

        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const serverId = data.id || data.course?.id;
          if (!createdId && serverId) {
             setCreatedId(serverId);
          }
          if (data && data.lessons) {
            const parsedLessons = data.lessons.map((l: any) => {
              let parsedQuestions = [];
              let parsedAssignments = [];
              let parsedAttachments = [];
              let parsedSlides = [];

              try {
                parsedQuestions = typeof l.questions === 'string' ? JSON.parse(l.questions) : (l.questions || []);
              } catch (e) { parsedQuestions = []; }

              try {
                parsedAssignments = typeof l.assignments === 'string' ? JSON.parse(l.assignments) : (l.assignments || []);
              } catch (e) { parsedAssignments = []; }

              try {
                parsedAttachments = typeof l.attachments === 'string' ? JSON.parse(l.attachments) : (l.attachments || []);
              } catch (e) { parsedAttachments = []; }

              try {
                parsedSlides = typeof l.slides === 'string' ? JSON.parse(l.slides) : (l.slides || []);
              } catch (e) { parsedSlides = [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", sections: [] }]; }

              return {
                ...l,
                isVisible: l.isVisible !== undefined ? l.isVisible : true,
                publishDate: l.publishDate ? new Date(new Date(l.publishDate).getTime() - new Date(l.publishDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                cutOffDate: l.cutOffDate ? new Date(new Date(l.cutOffDate).getTime() - new Date(l.cutOffDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                questions: Array.isArray(parsedQuestions) ? parsedQuestions.map(q => {
                  let parsedExps = [""];
                  try {
                    parsedExps = typeof q.explanation === 'string' && q.explanation.startsWith('[') ? JSON.parse(q.explanation) : (q.explanations || [""]);
                    if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                  } catch (e) {
                    parsedExps = [q.explanation || ""];
                  }
                  return { ...q, explanations: parsedExps };
                }) : [],
                assignments: Array.isArray(parsedAssignments) ? parsedAssignments.map(q => {
                  let parsedExps = [""];
                  try {
                    parsedExps = typeof q.explanation === 'string' && q.explanation.startsWith('[') ? JSON.parse(q.explanation) : (q.explanations || [""]);
                    if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                  } catch (e) {
                    parsedExps = [q.explanation || ""];
                  }
                  return { ...q, explanations: parsedExps };
                }) : [],
                attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
                slides: Array.isArray(parsedSlides) && parsedSlides.length ? parsedSlides : [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", sections: [] }]
              };
            });

            // Adjust editing indexes if modal is open
            if (isLessonModalOpen) {
              let idx = editingLessonIndex;
              if (idx === null) {
                idx = parsedLessons.length - 1;
                setEditingLessonIndex(idx);
              }
              if (idx >= 0 && idx < parsedLessons.length) {
                // Keep current state edits so we don't overwrite user actively typing,
                // but preserve backend-assigned IDs (UUIDs)
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
                  })
                }));
              }
              // Set all lessons with backend IDs
              setLessons(parsedLessons.map((pl: any, plIdx: number) => {
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
                    })
                  };
                }
                return pl;
              }));
            } else {
              setLessons(parsedLessons);
            }
          }
          setLastAutoSave(new Date());
        } else {
          const message = await res.text().catch(() => "");
          console.error("Auto-save failed:", message);
          showToast(language === 'ar' ? "فشل الحفظ التلقائي. تأكد من الاتصال ثم احفظ يدوياً." : "Auto-save failed. Check your connection, then save manually.", "error");
        }
      } catch (err) {
        console.error("Auto save failed", err);
        showToast(language === 'ar' ? "فشل الحفظ التلقائي. تأكد من الاتصال ثم احفظ يدوياً." : "Auto-save failed. Check your connection, then save manually.", "error");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAutoSaveEnabled, createdId, courseData, lessons, isLessonModalOpen, currentLesson, editingLessonIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.title) {
      showToast(t('courseCreate.titleRequired') || "Please enter a course title", "error");
      return;
    }
    if (!courseData.subjects || courseData.subjects.length === 0) {
      showToast(t('courseCreate.subjectRequired') || "Please select at least one subject / specialization", "error");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("school_admin_token");
    const userStr = localStorage.getItem("school_admin_user");
    if (!token || !userStr) {
      router.push("/school-admin/login");
      return;
    }
    const user = JSON.parse(userStr);
    const targetSchoolId = user.schoolId;

    try {
      const finalLessons = [...lessons];
      if (isLessonModalOpen && currentLesson.title) {
        if (editingLessonIndex !== null) {
          finalLessons[editingLessonIndex] = currentLesson;
        } else {
          finalLessons.push(currentLesson);
        }
      }

      const lessonsPayload = finalLessons.map((l) => ({
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
        assignments: JSON.stringify(l.assignments || [])
      }));

      const subjectString = courseData.subjects.join(", ");

      const method = createdId ? "PUT" : "POST";
      const url = createdId
        ? `${API_URL}/school/courses/${createdId}`
        : `${API_URL}/school/courses`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          coverImage: courseData.coverImage || null,
          grades: courseData.grades,
          subject: subjectString,
          country: courseData.country,
          isCentral: false,
          schoolId: targetSchoolId,
          schoolIds: [targetSchoolId],
          lessons: lessonsPayload
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.stack || data.details || data.error || "Failed to create course");
      }

      showToast(
        t('courseCreate.publishSuccess') || "Course created successfully",
        "success"
      );

      router.push(`/school-admin/courses`);
    } catch (error: any) {
      console.error("Course creation error:", error);
      showToast(error.message || t('courseCreate.connectionError') || "Connection error", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {isLessonModalOpen ? (
          <div className="max-w-6xl mx-auto w-full h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 w-full h-full rounded-[28px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-slate-900 p-8 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Monitor className="w-8 h-8" />
                    {editingLessonIndex !== null ? (language === 'ar' ? `تعديل الدرس: ${currentLesson.title}` : `Edit Lesson: ${currentLesson.title}`) : (language === 'ar' ? "تصميم درس جديد" : "Design New Lesson")}
                  </h3>
                  <p className="text-slate-400 mt-1 font-bold">{language === 'ar' ? "بناء محتوى الدرس والأهداف والمهام التفاعلية" : "Build lesson content, objectives, and interactive tasks"}</p>
                </div>
                <button onClick={() => setIsLessonModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto shrink-0 custom-scrollbar">
                {[
                  { id: 'info', label: language === 'ar' ? "الأهداف والمعلومات" : "Objectives & Info", icon: Target },
                  { id: 'scheduling', label: language === 'ar' ? "الجدولة والظهور" : "Scheduling & Visibility", icon: Clock },
                  { id: 'slides', label: language === 'ar' ? "شرائح الشرح" : "Lecture Slides", icon: Layout },
                  { id: 'assignments', label: language === 'ar' ? "واجبات وتكليفات الدرس (Assignments)" : "Assignments", icon: FileText },
                  { id: 'exercises', label: language === 'ar' ? "تدريبات وتقييمات الدرس (Quiz Me)" : "Quiz Me", icon: HelpCircle },
                  { id: 'attachments', label: t('courseCreate.attachments') || "Attachments", icon: FileDown },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all ${
                      activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-500'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 p-5 sm:p-8 lg:p-12 overflow-y-auto custom-scrollbar overscroll-contain">
                {activeTab === 'info' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{language === 'ar' ? "عنوان الدرس" : "Lesson Title"}</label>
                        <input
                          type="text"
                          value={currentLesson.title}
                          onChange={(e) => setCurrentLesson({...currentLesson, title: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                          placeholder={language === 'ar' ? "مثال: القوة والحركة في اتجاه واحد" : "e.g. Force and Motion in One Dimension"}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{language === 'ar' ? "رابط فيديو يوتيوب" : "YouTube Video URL"}</label>
                        <input
                          type="text"
                          value={currentLesson.videoUrl}
                          onChange={(e) => setCurrentLesson({...currentLesson, videoUrl: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-rose-600 transition-all text-left"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[35px] border border-slate-100 space-y-8">
                       <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          <Target className="w-6 h-6 text-indigo-600" />
                          {language === 'ar' ? "الأهداف والمعايير الأكاديمية" : "Academic Objectives & Standards"}
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المجال" : "Domain"}</label>
                          <div className="flex gap-2">
                            <select
                              value={currentLesson.domain || ""}
                              onChange={(e) => {
                                if (e.target.value === "__NEW__") {
                                  const newDomain = prompt(language === 'ar' ? "أدخل اسم المجال الجديد:" : "Enter new domain name:");
                                  if (newDomain && newDomain.trim()) {
                                    setCurrentLesson({...currentLesson, domain: newDomain.trim()});
                                  }
                                } else {
                                    setCurrentLesson({...currentLesson, domain: e.target.value});
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm"
                            >
                              <option value="">{t('courseCreate.selectDomain') || "Select Domain..."}</option>
                              {Array.from(new Set(lessons.map(l => l.domain).filter(Boolean))).map((domainName: any) => (
                                <option key={domainName} value={domainName}>{domainName}</option>
                              ))}
                              <option value="__NEW__" className="text-indigo-600 font-bold">{language === 'ar' ? "+ إضافة مجال جديد..." : "+ Add New Domain..."}</option>
                            </select>
                            {currentLesson.domain && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVal = prompt(language === 'ar' ? "تعديل المجال:" : "Edit Domain:", currentLesson.domain);
                                    if (newVal !== null && newVal.trim()) {
                                      setCurrentLesson({...currentLesson, domain: newVal.trim()});
                                      showToast(language === 'ar' ? "تم تعديل المجال بنجاح" : "Domain updated successfully", "success");
                                    }
                                  }}
                                  className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center transition-all"
                                  title={language === 'ar' ? "تعديل المجال" : "Edit Domain"}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentLesson({...currentLesson, domain: ""});
                                    showToast(language === 'ar' ? "تم إزالة المجال" : "Domain cleared", "info");
                                  }}
                                  className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center transition-all"
                                  title={language === 'ar' ? "حذف المجال" : "Clear Domain"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 relative">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المعايير" : "Standards"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsStandardDropdownOpen(!isStandardDropdownOpen);
                                setIsIndicatorDropdownOpen(false);
                                setIsOutcomeDropdownOpen(false);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return t('courseCreate.selectStandard') || "Select Standard...";
                                  return language === 'ar'
                                    ? `تم تحديد (${selected.length}) معايير`
                                    : `Selected (${selected.length}) standards`;
                                })()}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isStandardDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStandardDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsStandardDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                  {[
                                    language === 'ar' ? "معيار 1: الفهم والاستيعاب" : "Standard 1: Understanding & Comprehension",
                                    language === 'ar' ? "معيار 2: التطبيق والتحليل" : "Standard 2: Application & Analysis",
                                    language === 'ar' ? "معيار 3: التفكير النقدي" : "Standard 3: Critical Thinking"
                                  ].map((option) => {
                                    const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                    const isSelected = selected.includes(option);
                                    return (
                                      <label key={option} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-700 font-bold text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            let nextList = [...selected];
                                            if (isSelected) {
                                              nextList = nextList.filter((x: string) => x !== option);
                                            } else {
                                              nextList.push(option);
                                            }
                                            setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                          }}
                                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                        />
                                        <span className="flex-1 text-right">{option}</span>
                                      </label>
                                    );
                                  })}

                                  {(() => {
                                    const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                    const defaultOptions = [
                                      language === 'ar' ? "معيار 1: الفهم والاستيعاب" : "Standard 1: Understanding & Comprehension",
                                      language === 'ar' ? "معيار 2: التطبيق والتحليل" : "Standard 2: Application & Analysis",
                                      language === 'ar' ? "معيار 3: التفكير النقدي" : "Standard 3: Critical Thinking",
                                      "معيار 1: الفهم والاستيعاب",
                                      "معيار 2: التطبيق والتحليل",
                                      "معيار 3: التفكير النقدي"
                                    ];
                                    const customOpts = selected.filter((x: string) => !defaultOptions.includes(x));
                                    return customOpts.map((option: string) => (
                                      <div key={option} className="flex items-center justify-between gap-2 px-3 py-1 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer py-1.5">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <span className="flex-1 text-right truncate" title={option}>{option}</span>
                                        </label>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newVal = prompt(language === 'ar' ? "تعديل المعيار المخصص:" : "Edit Custom Standard:", option);
                                              if (newVal !== null && newVal.trim()) {
                                                const nextList = selected.map((x: string) => x === option ? newVal.trim() : x);
                                                setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                                showToast(language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully", "success");
                                              }
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "تعديل" : "Edit"}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                              showToast(language === 'ar' ? "تم إزالة المعيار" : "Standard removed", "info");
                                            }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "حذف" : "Delete"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(language === 'ar' ? "أدخل المعيار المخصص الجديد:" : "Enter new custom standard:");
                                      if (newVal && newVal.trim()) {
                                        const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                        if (!selected.includes(newVal.trim())) {
                                          const nextList = [...selected, newVal.trim()];
                                          setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                          showToast(language === 'ar' ? "تم الإضافة بنجاح" : "Added successfully", "success");
                                        }
                                      }
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all text-indigo-600 font-black text-xs border border-dashed border-indigo-100 mt-2 flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{t('courseCreate.addCustomStandard') || "+ Add Custom Standard..."}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {(() => {
                            const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                            if (selected.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {selected.map((option: string) => (
                                  <span key={option} className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100/50 text-[10px] md:text-xs font-black shadow-sm shrink-0">
                                    <span className="max-w-[120px] md:max-w-[200px] truncate" title={option}>{option}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextList = selected.filter((x: string) => x !== option);
                                        setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                      }}
                                      className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer font-bold text-[8px]"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="space-y-3 relative">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المؤشرات" : "Indicators"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsIndicatorDropdownOpen(!isIndicatorDropdownOpen);
                                setIsOutcomeDropdownOpen(false);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return t('courseCreate.selectIndicator') || "Select Indicator...";
                                  return language === 'ar'
                                    ? `تم تحديد (${selected.length}) مؤشرات`
                                    : `Selected (${selected.length}) indicators`;
                                })()}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isIndicatorDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isIndicatorDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsIndicatorDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                  {[
                                    language === 'ar' ? "مؤشر 1: يحدد المفاهيم الأساسية" : "Indicator 1: Identifies core concepts",
                                    language === 'ar' ? "مؤشر 2: يطبق القوانين الرياضية" : "Indicator 2: Applies mathematical laws",
                                    language === 'ar' ? "مؤشر 3: يستنتج العلاقات" : "Indicator 3: Infers relationships"
                                  ].map((option) => {
                                    const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                    const isSelected = selected.includes(option);
                                    return (
                                      <label key={option} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-700 font-bold text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            let nextList = [...selected];
                                            if (isSelected) {
                                              nextList = nextList.filter((x: string) => x !== option);
                                            } else {
                                              nextList.push(option);
                                            }
                                            setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                          }}
                                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                        />
                                        <span className="flex-1 text-right">{option}</span>
                                      </label>
                                    );
                                  })}

                                  {(() => {
                                    const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                    const defaultOptions = [
                                      language === 'ar' ? "مؤشر 1: يحدد المفاهيم الأساسية" : "Indicator 1: Identifies core concepts",
                                      language === 'ar' ? "مؤشر 2: يطبق القوانين الرياضية" : "Indicator 2: Applies mathematical laws",
                                      language === 'ar' ? "مؤشر 3: يستنتج العلاقات" : "Indicator 3: Infers relationships",
                                      "مؤشر 1: يحدد المفاهيم الأساسية",
                                      "مؤشر 2: يطبق القوانين الرياضية",
                                      "مؤشر 3: يستنتج العلاقات"
                                    ];
                                    const customOpts = selected.filter((x: string) => !defaultOptions.includes(x));
                                    return customOpts.map((option: string) => (
                                      <div key={option} className="flex items-center justify-between gap-2 px-3 py-1 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer py-1.5">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <span className="flex-1 text-right truncate" title={option}>{option}</span>
                                        </label>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newVal = prompt(language === 'ar' ? "تعديل المؤشر المخصص:" : "Edit Custom Indicator:", option);
                                              if (newVal !== null && newVal.trim()) {
                                                const nextList = selected.map((x: string) => x === option ? newVal.trim() : x);
                                                setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                                showToast(language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully", "success");
                                              }
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "تعديل" : "Edit"}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                              showToast(language === 'ar' ? "تم إزالة المؤشر" : "Indicator removed", "info");
                                            }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "حذف" : "Delete"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(language === 'ar' ? "أدخل المؤشر المخصص الجديد:" : "Enter new custom indicator:");
                                      if (newVal && newVal.trim()) {
                                        const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                        if (!selected.includes(newVal.trim())) {
                                          const nextList = [...selected, newVal.trim()];
                                          setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                          showToast(language === 'ar' ? "تم الإضافة بنجاح" : "Added successfully", "success");
                                        }
                                      }
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all text-indigo-600 font-black text-xs border border-dashed border-indigo-100 mt-2 flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{language === 'ar' ? "+ إضافة مؤشر مخصص..." : "+ Add Custom Indicator..."}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {(() => {
                            const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                            if (selected.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {selected.map((option: string) => (
                                  <span key={option} className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100/50 text-[10px] md:text-xs font-black shadow-sm shrink-0">
                                    <span className="max-w-[120px] md:max-w-[200px] truncate" title={option}>{option}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextList = selected.filter((x: string) => x !== option);
                                        setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                      }}
                                      className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer font-bold text-[8px]"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="space-y-3 relative">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نواتج التعلم (LOs)" : "Learning Outcomes (LOs)"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsOutcomeDropdownOpen(!isOutcomeDropdownOpen);
                                setIsIndicatorDropdownOpen(false);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return t('courseCreate.selectOutcome') || "Select Learning Outcome...";
                                  return language === 'ar'
                                    ? `تم تحديد (${selected.length}) نواتج تعلم`
                                    : `Selected (${selected.length}) outcomes`;
                                })()}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOutcomeDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isOutcomeDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsOutcomeDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                  {[
                                    language === 'ar' ? "ناتج 1: أن يكون الطالب قادراً على..." : "Outcome 1: Student will be able to...",
                                    language === 'ar' ? "ناتج 2: أن يميز الطالب بين..." : "Outcome 2: Student will distinguish between...",
                                    language === 'ar' ? "ناتج 3: أن يحلل الطالب..." : "Outcome 3: Student will analyze..."
                                  ].map((option) => {
                                    const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                    const isSelected = selected.includes(option);
                                    return (
                                      <label key={option} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-700 font-bold text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            let nextList = [...selected];
                                            if (isSelected) {
                                              nextList = nextList.filter((x: string) => x !== option);
                                            } else {
                                              nextList.push(option);
                                            }
                                            setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                          }}
                                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                        />
                                        <span className="flex-1 text-right">{option}</span>
                                      </label>
                                    );
                                  })}

                                  {(() => {
                                    const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                    const defaultOptions = [
                                      language === 'ar' ? "ناتج 1: أن يكون الطالب قادراً على..." : "Outcome 1: Student will be able to...",
                                      language === 'ar' ? "ناتج 2: أن يميز الطالب بين..." : "Outcome 2: Student will distinguish between...",
                                      language === 'ar' ? "ناتج 3: أن يحلل الطالب..." : "Outcome 3: Student will analyze...",
                                      "ناتج 1: أن يكون الطالب قادراً على...",
                                      "ناتج 2: أن يميز الطالب بين...",
                                      "ناتج 3: أن يحلل الطالب..."
                                    ];
                                    const customOpts = selected.filter((x: string) => !defaultOptions.includes(x));
                                    return customOpts.map((option: string) => (
                                      <div key={option} className="flex items-center justify-between gap-2 px-3 py-1 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer py-1.5">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <span className="flex-1 text-right truncate" title={option}>{option}</span>
                                        </label>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newVal = prompt(language === 'ar' ? "تعديل ناتج التعلم المخصص:" : "Edit Custom Outcome:", option);
                                              if (newVal !== null && newVal.trim()) {
                                                const nextList = selected.map((x: string) => x === option ? newVal.trim() : x);
                                                setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                                showToast(language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully", "success");
                                              }
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "تعديل" : "Edit"}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                              showToast(language === 'ar' ? "تم إزالة ناتج التعلم" : "Learning outcome removed", "info");
                                            }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "حذف" : "Delete"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(language === 'ar' ? "أدخل ناتج التعلم المخصص الجديد:" : "Enter new custom learning outcome:");
                                      if (newVal && newVal.trim()) {
                                        const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                        if (!selected.includes(newVal.trim())) {
                                          const nextList = [...selected, newVal.trim()];
                                          setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                          showToast(language === 'ar' ? "تم الإضافة بنجاح" : "Added successfully", "success");
                                        }
                                      }
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all text-indigo-600 font-black text-xs border border-dashed border-indigo-100 mt-2 flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{language === 'ar' ? "+ إضافة ناتج مخصص..." : "+ Add Custom Outcome..."}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {(() => {
                            const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                            if (selected.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {selected.map((option: string) => (
                                  <span key={option} className="inline-flex items-center gap-1.5 bg-indigo-50/80 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100/50 text-[10px] md:text-xs font-black shadow-sm shrink-0">
                                    <span className="max-w-[120px] md:max-w-[200px] truncate" title={option}>{option}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextList = selected.filter((x: string) => x !== option);
                                        setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                      }}
                                      className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer font-bold text-[8px]"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                       </div>

                       <div className="flex justify-center items-center gap-4 mt-6">
                        <input
                          type="file"
                          ref={metadataExcelRef}
                          style={{ display: 'none' }}
                          accept=".xlsx,.xls"
                          onChange={handleMetadataExcelChange}
                        />
                        <button
                          type="button"
                          onClick={() => handleExcelUpload('metadata')}
                          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all font-black text-xs cursor-pointer shadow-sm"
                        >
                          <Upload className="w-4 h-4" />
                          {t('courseCreate.uploadStandardsExcel') || "Upload Standards from Excel"}
                        </button>
                        <button
                          type="button"
                          onClick={downloadMetadataTemplate}
                          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all font-black text-xs cursor-pointer shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          {language === 'ar' ? "تحميل نموذج Excel الاسترشادي" : "Download Excel Template"}
                        </button>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'scheduling' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[35px] flex items-center justify-between">
                       <div className="space-y-1">
                          <h4 className="text-xl font-black text-indigo-900">{language === 'ar' ? "ظهور الدرس" : "Lesson Visibility"}</h4>
                          <p className="text-indigo-600/60 font-bold text-sm">{language === 'ar' ? "التحكم في إمكانية رؤية الطلاب لهذا الدرس حالياً" : "Control whether students can see this lesson currently"}</p>
                       </div>
                       <button
                        type="button"
                        onClick={() => setCurrentLesson({...currentLesson, isVisible: !currentLesson.isVisible})}
                        className={`w-20 h-10 rounded-full relative transition-all duration-300 ${currentLesson.isVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}
                       >
                          <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 ${currentLesson.isVisible ? (language === 'ar' ? 'left-1' : 'right-11') : (language === 'ar' ? 'left-11' : 'right-1')}`}></div>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-3 text-emerald-600">
                             <CheckCircle2 className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? "تاريخ النشر" : "Publish Date"}</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">{language === 'ar' ? "لن يظهر الدرس للطلاب قبل هذا التاريخ حتى لو تم تمكين الظهور" : "The lesson will not appear to students before this date even if Visibility is enabled"}</p>
                          <input
                            type="datetime-local"
                            value={currentLesson.publishDate || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, publishDate: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                          />
                       </div>

                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-3 text-red-500">
                             <AlertCircle className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? "تاريخ الإيقاف / الحذف" : "Cut-off Date"}</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">{language === 'ar' ? "سيختفي الدرس تلقائياً من واجهة الطالب بعد هذا التاريخ" : "The lesson will automatically disappear from the student interface after this date"}</p>
                          <input
                            type="datetime-local"
                            value={currentLesson.cutOffDate || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, cutOffDate: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-red-500 transition-all"
                          />
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'slides' && renderSlidesBuilder('slides')}

                {activeTab === 'assignments' && renderQuestionsBuilder('assignments')}

                {activeTab === 'exercises' && renderQuestionsBuilder('questions')}

                {activeTab === 'attachments' && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xl font-black text-slate-900">{t('courseCreate.attachments') || "Files & Attachments"}</h4>
                        <button
                          onClick={() => setCurrentLesson({...currentLesson, attachments: [...(currentLesson.attachments || []), { name: "", url: "", type: "PDF" }]})}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          {t('courseCreate.addFile') || "Add File"}
                        </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(currentLesson.attachments || []).map((att: any, attIdx: number) => (
                          <div key={attIdx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                              </div>
                              <button
                                onClick={() => {
                                  const atts = [...currentLesson.attachments];
                                  atts.splice(attIdx, 1);
                                  setCurrentLesson({...currentLesson, attachments: atts});
                                }}
                                className="text-red-500 hover:text-red-600 p-2"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="space-y-4">
                              <input
                                type="text"
                                value={att.name}
                                onChange={(e) => {
                                  const atts = [...currentLesson.attachments];
                                  atts[attIdx].name = e.target.value;
                                  setCurrentLesson({...currentLesson, attachments: atts});
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm outline-none focus:border-indigo-600"
                                placeholder={t('courseCreate.fileName') || "File Name"}
                              />
                              <div className="flex gap-3">
                                <select
                                  value={att.type}
                                  onChange={(e) => {
                                    const atts = [...currentLesson.attachments];
                                    atts[attIdx].type = e.target.value;
                                    setCurrentLesson({...currentLesson, attachments: atts});
                                  }}
                                  className="w-32 bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs outline-none focus:border-indigo-600"
                                >
                                  <option value="PDF">PDF</option>
                                  <option value="PPT">PPT</option>
                                  <option value="DOC">DOC</option>
                                  <option value="XLS">XLS</option>
                                  <option value="IMAGE">IMAGE</option>
                                </select>
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={att.url}
                                    onChange={(e) => {
                                      const atts = [...currentLesson.attachments];
                                      atts[attIdx].url = e.target.value;
                                      setCurrentLesson({...currentLesson, attachments: atts});
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs outline-none text-left font-mono focus:border-indigo-600"
                                    placeholder={t('courseCreate.externalUrl') || "External File URL (URL)"}
                                    dir="ltr"
                                  />
                                  <label className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 shadow-sm border border-indigo-200" title={language === 'ar' ? "رفع ملف (PDF, PPT, DOC...)" : "Upload File"}>
                                    <Upload className="w-4 h-4" />
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*" 
                                      onChange={async (e: any) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            const { uploadFileToServer } = await import("@/lib/image-utils");
                                            const url = await uploadFileToServer(file);
                                            const atts = [...currentLesson.attachments];
                                            atts[attIdx].url = url;
                                            if (!atts[attIdx].name) atts[attIdx].name = file.name;
                                            if (file.name.toLowerCase().endsWith('.pdf')) atts[attIdx].type = 'PDF';
                                            else if (file.name.match(/\.(ppt|pptx)$/i)) atts[attIdx].type = 'PPT';
                                            else if (file.name.match(/\.(doc|docx)$/i)) atts[attIdx].type = 'DOC';
                                            else if (file.name.match(/\.(xls|xlsx)$/i)) atts[attIdx].type = 'XLS';
                                            else if (file.type.startsWith('image/')) atts[attIdx].type = 'IMAGE';
                                            setCurrentLesson({...currentLesson, attachments: atts});
                                            showToast(language === 'ar' ? "تم رفع الملف بنجاح ✅" : "File uploaded successfully ✅", "success");
                                          } catch (error) {
                                            showToast(language === 'ar' ? "فشل رفع الملف ❌" : "File upload failed ❌", "error");
                                          }
                                        }
                                      }} 
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                >
                  {t('courseCreate.cancelChanges') || "Cancel Changes"}
                </button>
                <button
                  onClick={saveLesson}
                  className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3"
                >
                  {t('courseCreate.saveLesson') || "Confirm & Save Lesson"}
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100">
                  <ArrowLeft className="w-7 h-7" />
                </button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">{t('courseCreate.title')}</h1>
                  <p className="text-slate-400 text-lg mt-1 font-bold">{t('courseCreate.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-12 py-5 rounded-[22px] font-black flex items-center gap-3 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? t('courseCreate.saving') : t('courseCreate.savePublish')}
                <Save className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Side: Course Settings */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>
                  <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 relative z-10">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    {t('courseCreate.courseSettings')}
                  </h2>

                  <div className="space-y-6 relative z-10">
                    {/* Cover Image Upload */}
                    <div className="space-y-3">
                      <FileUpload
                        label={t('courseCreate.coverImage') || "Course Cover Image"}
                        accept="image/*"
                        value={courseData.coverImage}
                        onUploadSuccess={(url) => setCourseData({ ...courseData, coverImage: url })}
                        tokenKey="school_admin_token"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.courseTitle')}</label>
                      <input
                        type="text"
                        value={courseData.title}
                        onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                        placeholder={t('courseCreate.titlePlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.courseDesc')}</label>
                      <textarea
                        value={courseData.description}
                        onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all min-h-[120px] resize-none"
                        placeholder={t('courseCreate.descPlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.country')}</label>
                        <select
                          value={courseData.country}
                          onChange={(e) => setCourseData({...courseData, country: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all appearance-none"
                        >
                          <option value="مصر">{language === 'ar' ? 'مصر' : 'Egypt'}</option>
                          <option value="السعودية">{language === 'ar' ? 'السعودية' : 'Saudi Arabia'}</option>
                          <option value="الإمارات">{language === 'ar' ? 'الإمارات' : 'UAE'}</option>
                          <option value="الكويت">{language === 'ar' ? 'الكويت' : 'Kuwait'}</option>
                          <option value="قطر">{language === 'ar' ? 'قطر' : 'Qatar'}</option>
                          <option value="عمان">{language === 'ar' ? 'عمان' : 'Oman'}</option>
                          <option value="البحرين">{language === 'ar' ? 'البحرين' : 'Bahrain'}</option>
                          <option value="الأردن">{language === 'ar' ? 'الأردن' : 'Jordan'}</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{t('courseCreate.grades')}</label>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          {[
                            {
                              stage: "Elementary",
                              title: language === 'ar' ? "المرحلة الابتدائية (Primary)" : "Elementary School (Primary)",
                              grades: [
                                "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
                                "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"
                              ]
                            },
                            {
                              stage: "Middle School",
                              title: language === 'ar' ? "المرحلة الإعدادية (Prep)" : "Middle School (Prep)",
                              grades: [
                                "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"
                              ]
                            },
                            {
                              stage: "High School",
                              title: language === 'ar' ? "المرحلة الثانوية (Secondary)" : "High School (Secondary)",
                               grades: [
                                 "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
                               ]
                             }
                           ].map(({ stage, title, grades: stageGrades }) => (
                             <div key={stage} className="space-y-3">
                               <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{title}</h4>
                               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                 {stageGrades.map((g) => (
                                   <label
                                     key={g}
                                     className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                       courseData.grades.includes(g)
                                         ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                                         : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                     }`}
                                   >
                                     <input
                                       type="checkbox"
                                       className="hidden"
                                       checked={courseData.grades.includes(g)}
                                       onChange={(e) => {
                                         if(e.target.checked) setCourseData({...courseData, grades: [...courseData.grades, g]});
                                         else setCourseData({...courseData, grades: courseData.grades.filter(gr => gr !== g)});
                                       }} />
                                     <div
                                       className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                         courseData.grades.includes(g)
                                           ? "bg-indigo-600 text-white"
                                           : "bg-slate-100 border border-slate-200"
                                       }`}
                                     >
                                       {courseData.grades.includes(g) && <CheckCircle2 className="w-3 h-3" />}
                                     </div>
                                     <span className="text-xs font-black">{getGradeCheckboxLabel(g)}</span>
                                   </label>
                                 ))}
                               </div>
                             </div>
                           ))}
                          {CATEGORIES.map((cat) => (
                            <label
                              key={cat}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                                courseData.subjects.includes(cat)
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
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                  courseData.subjects.includes(cat)
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
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {language === 'ar' ? 'المدرسة المرتبطة' : 'Linked School'}
                      </label>
                      <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-indigo-900 truncate">
                            {schoolName || (language === 'ar' ? 'مدرستك' : 'Your School')}
                          </p>
                          <p className="text-xs font-bold text-indigo-500 mt-0.5">
                            {language === 'ar'
                              ? 'سيظهر هذا الكورس على مستوى مدرستك فقط'
                              : 'This course will be visible to your school only'}
                          </p>
                        </div>
                      </div>
                    </div>
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
                    <h3 className="text-2xl font-black text-slate-900 mb-3">{t('courseCreate.startDreamCourse')}</h3>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-lg">{t('courseCreate.noLessonsYet')}</p>
                    <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20">
                      {t('courseCreate.addFirstLesson')}
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
                            {t('courseCreate.slidesCount').replace('{n}', String(lesson.slides?.length || 0))}
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <HelpCircle className={`w-4 h-4 ${lesson.questions?.length ? 'text-amber-500' : 'text-slate-300'}`} />
                            {t('courseCreate.exercisesCount').replace('{n}', String(lesson.questions?.length || 0))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
