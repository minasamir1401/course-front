"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
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

export default function SuperAdminNewExamPage() {
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
  
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    coverImage: "",
    grades: [] as string[],
    subjects: [] as string[],
    country: "مصر",
    isCentral: !schoolIdParam,
    schoolIds: (schoolIdParam ? [schoolIdParam] : []) as string[],
    duration: 60,
    password: "",
    resultVisibility: "SHOW_SCORE",
    attemptsAllowed: 1,
    startDate: "",
    endDate: "",
    passingScore: 50,
    courseName: "",
    section: "",
    domain: "",
    learningOutcomes: "",
    indicators: "",
    skills: "",
    gradeTarget: ""
  });

  const [modules, setModules] = useState<any[]>([]);
  const [standaloneQuestions, setStandaloneQuestions] = useState<any[]>([]);
  const [visibleStandaloneCount, setVisibleStandaloneCount] = useState(50);
  const [showSettings, setShowSettings] = useState(true);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);

  // Lesson State
  const [currentModule, setCurrentModule] = useState<any>({
    title: "",
    domain: "",
    duration: 30,
    passingScore: 50,
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

  const [availableMetadata, setAvailableMetadata] = useState({
    domains: [] as string[],
    standards: [] as string[],
    indicators: [] as string[],
    outcomes: [] as string[]
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
    ...(currentModule?.slides || []).map((s: any) => s.skill),
    ...(currentModule?.assignments || []).map((a: any) => a.skill),
    ...(currentModule?.questions || []).map((q: any) => q.skill)
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
    const current = examData.subjects || [];
    const next = current.includes(subject)
      ? current.filter((s: any) => s !== subject)
      : [...current, subject];
    setExamData({ ...examData, subjects: next });
  };

  const toggleCourseSchool = (id: string) => {
    const current = examData.schoolIds || [];
    const next = current.includes(id) ? current.filter((sid: any) => sid !== id) : [...current, id];
    setExamData({ ...examData, schoolIds: next, isCentral: next.length === 0 });
  };

  const selectAllSchools = () => {
    if (!schools.length) return;
    if ((examData.schoolIds || []).length === schools.length) {
      setExamData({ ...examData, schoolIds: [], isCentral: true });
    } else {
      setExamData({ ...examData, schoolIds: schools.map((s) => s.id), isCentral: false });
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

  const handleRemoveModule = async (index: number) => {
    const lesson = modules[index];
    if (lesson.id) {
      if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا الدرس نهائياً؟" : "Are you sure you want to permanently delete this lesson?")) return;
      try {
        const token = localStorage.getItem("super_admin_token");
        const res = await fetch(`${API_URL}/modules/${lesson.id}`, {
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
    const newLessons = [...modules];
    newLessons.splice(index, 1);
    setModules(newLessons);
  };

  const openAddModuleModal = () => {
    setEditingModuleIndex(null);
    setCurrentModule({
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
    setIsModuleModalOpen(true);
  };

  const openEditModuleModal = (index: number) => {
    setEditingModuleIndex(index);
    const lessonToEdit = { ...modules[index] };
    if (lessonToEdit.content === undefined || lessonToEdit.content === null) lessonToEdit.content = "";
    if (!lessonToEdit.slides || lessonToEdit.slides.length === 0) lessonToEdit.slides = [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", sections: [] }];
    if (!lessonToEdit.questions) lessonToEdit.questions = [];
    setCurrentModule(lessonToEdit);
    setActiveTab('info');
    setIsModuleModalOpen(true);
  };

  const saveModule = () => {
    if (!currentModule.title) {
      showToast(t('courseCreate.lessonTitleRequired') || "Lesson title is required", "error");
      return;
    }
    const newLessons = [...modules];
    if (editingModuleIndex !== null) {
      newLessons[editingModuleIndex] = currentModule;
    } else {
      newLessons.push(currentModule);
    }
    setModules(newLessons);
    setIsModuleModalOpen(false);
  };

  const metadataExcelRef = useRef<HTMLInputElement>(null);
  const questionsExcelRef = useRef<HTMLInputElement>(null);
  const assignmentsExcelRef = useRef<HTMLInputElement>(null);

    const exportQuestionsToExcel = (questionsToExport: any[], filename = 'questions_export.xlsx') => {
    if (!questionsToExport || questionsToExport.length === 0) {
      showToast(language === 'ar' ? 'لا توجد أسئلة لتصديرها' : 'No questions to export', 'error');
      return;
    }

    const wsData = [
      [
        language === 'ar' ? 'نص السؤال' : 'Question Text',
        language === 'ar' ? 'نوع السؤال' : 'Question Type',
        language === 'ar' ? 'الخيار 1' : 'Option 1',
        language === 'ar' ? 'الخيار 2' : 'Option 2',
        language === 'ar' ? 'الخيار 3' : 'Option 3',
        language === 'ar' ? 'الخيار 4' : 'Option 4',
        language === 'ar' ? 'الخيار 5' : 'Option 5',
        language === 'ar' ? 'الإجابة الصحيحة' : 'Correct Answer',
        language === 'ar' ? 'الدرجة' : 'Points',
        language === 'ar' ? 'المؤشرات' : 'Indicators',
        language === 'ar' ? 'مخرجات التعلم' : 'Learning Outcomes',
        language === 'ar' ? 'المهارة' : 'Skill',
        language === 'ar' ? 'المهارة الفرعية' : 'Subskill',
        language === 'ar' ? 'المهارة الدقيقة' : 'Micro Skill',
        language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty',
        'DOK',
        language === 'ar' ? 'المستوى المعرفي' : 'Cognitive',
        language === 'ar' ? 'نمط الخطأ' : 'Error Pattern',
        language === 'ar' ? 'الوقت المقدر' : 'Estimated Time',
        language === 'ar' ? 'التفسير' : 'Explanation'
      ]
    ];

    questionsToExport.forEach(q => {
      let optionsArray = [];
      if (typeof q.options === 'string') {
        try { optionsArray = JSON.parse(q.options); } catch (e) { optionsArray = [q.options]; }
      } else if (Array.isArray(q.options)) {
        optionsArray = q.options;
      }

      wsData.push([
        q.text ? q.text.replace(/<[^>]*>?/gm, '') : '',
        q.questionType || q.type || 'MCQ',
        optionsArray[0] || '',
        optionsArray[1] || '',
        optionsArray[2] || '',
        optionsArray[3] || '',
        optionsArray[4] || '',
        typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer || ''),
        q.points || 1,
        q.indicators || q.indicator || '',
        q.learningOutcome || q.learningOutcomes || '',
        q.skill || '',
        q.subskill || '',
        q.microSkill || '',
        q.level || 'Medium',
        q.dok || '',
        q.cognitive || 'Knowledge',
        q.errorPattern || '',
        q.estimatedTime || '',
        q.explanation || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, filename);
    showToast(language === 'ar' ? 'تم تصدير الأسئلة بنجاح' : 'Questions exported successfully', 'success');
  };

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
      
      let level = diffIdx >= 0 ? String(row[diffIdx] ?? "").trim() : "On Level";
      if (level.toLowerCase().includes("easy") || level.toLowerCase().includes("foundation") || level.includes("سهل") || level.includes("تأسيسي")) level = "Foundation";
      else if (level.toLowerCase().includes("hard") || level.toLowerCase().includes("advanced") || level.includes("صعب") || level.includes("متقدم")) level = "Advanced";
      else level = "On Level";

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
        const domainIdx = headers.findIndex(h => h.includes("domain") || h.includes("مجال") || h.includes("الماجال"));
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
        if (lessonIdx >= 0 && currentModule.title) {
          const currentModuleTitleLower = currentModule.title.trim().toLowerCase();
          const matchingRows = dataRows.filter(r => {
            const rowLesson = String(r[lessonIdx] ?? "").trim().toLowerCase();
            return rowLesson && (currentModuleTitleLower.includes(rowLesson) || rowLesson.includes(currentModuleTitleLower));
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

          setAvailableMetadata({
            domains: Array.from(new Set(domainList)),
            standards: Array.from(new Set(standardsList)),
            indicators: Array.from(new Set(indicatorsList)),
            outcomes: Array.from(new Set(outcomesList))
          });

          setCurrentModule((prev: any) => ({
            ...prev,
            domain: prev.domain || domainList[0] || "",
            standards: prev.standards || standardsList[0] || "",
            indicators: prev.indicators || indicatorsList[0] || "",
            learningOutcomes: prev.learningOutcomes || outcomesList[0] || ""
          }));
        }

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

        const currentStds = (currentModule.standards || "").split("\n").filter(Boolean);
        const currentInds = (currentModule.indicators || "").split("\n").filter(Boolean);
        const currentLos = (currentModule.learningOutcomes || "").split("\n").filter(Boolean);

        const updatedStds = Array.from(new Set([...currentStds, ...newStds])).join("\n");
        const updatedInds = Array.from(new Set([...currentInds, ...newInds])).join("\n");
        const updatedLos = Array.from(new Set([...currentLos, ...newLos])).join("\n");

        setCurrentModule((prev: any) => ({
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

        const currentStds = (currentModule.standards || "").split("\n").filter(Boolean);
        const currentInds = (currentModule.indicators || "").split("\n").filter(Boolean);
        const currentLos = (currentModule.learningOutcomes || "").split("\n").filter(Boolean);

        const updatedStds = Array.from(new Set([...currentStds, ...newStds])).join("\n");
        const updatedInds = Array.from(new Set([...currentInds, ...newInds])).join("\n");
        const updatedLos = Array.from(new Set([...currentLos, ...newLos])).join("\n");

        setCurrentModule((prev: any) => ({
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
      ["Module Title", "Standard", "Indicator", "Outcome", "Domain"],
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
        "10", "", "1", "Problem Solving",
        "Standard 1: Operations",
        "Indicator 1.1: Addition",
        "LO: Students can add numbers correctly",
        "Foundation", "DOK 1",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        language === 'ar' ? "الجمع الصحيح هو 10 لأن 5 زائد 5 يساوي 10" : "5 + 5 is 10"
      ],
      [
        language === 'ar' ? "الأرض كروية الشكل." : "The earth is round.",
        "TRUE_FALSE",
        "", "", "", "", "",
        language === 'ar' ? "صحيح" : "True", "", "1", "Observation",
        "Standard 2: Physical Geography",
        "Indicator 2.1: Earth Shape",
        "LO: Understands planet earth's shape",
        "Foundation", "DOK 2", "", ""
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
        "Standard 3: Ancient History",
        "Indicator 3.1: Continents",
        "LO: Identifies old world continents",
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
    setCurrentModule((prev: any) => ({
      ...prev,
      [source]: [...(prev[source] || []), newBlock]
    }));
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 0, newBlock);
      return { ...prev, [source]: newSlides };
    });
    showToast("Slide inserted successfully", "success");
  };

  const moveBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, direction: 'UP' | 'DOWN') => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSlides.length) return prev;
      [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
      return { ...prev, [source]: newSlides };
    });
  };

  const updateBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, field: string, value: any, blockRef?: any) => {
    setCurrentModule((prev: any) => {
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
    
    setCurrentModule((prev: any) => {
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
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 1);
      return { ...prev, [source]: newSlides };
    });
  };

  const addSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, type: string) => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      if (!newSlides[blockIndex]) return prev;
      const sections = [...(newSlides[blockIndex].sections || []), { id: Date.now() + Math.random(), type, content: "" }];
      newSlides[blockIndex] = { ...newSlides[blockIndex], sections };
      return { ...prev, [source]: newSlides };
    });
  };

  const updateSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number, content: string, blockRef?: any, sectionRef?: any) => {
    setCurrentModule((prev: any) => {
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
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      if (!newSlides[blockIndex]) return prev;
      const sections = [...(newSlides[blockIndex].sections || [])];
      sections.splice(sectionIndex, 1);
      newSlides[blockIndex] = { ...newSlides[blockIndex], sections };
      return { ...prev, [source]: newSlides };
    });
  };

  const renderSlidesBuilder = (source: 'slides' | 'assignments' | 'questions') => {
    const list = currentModule[source] || [];
    
    // Label translations depending on source
    const headerLabel = source === 'slides' 
      ? (language === 'ar' ? 'شرائح الشرح' : 'Lecture Slides') 
      : source === 'assignments' 
        ? (language === 'ar' ? 'الواجبات والتكليفات' : 'Lesson Assignments') 
        : (language === 'ar' ? 'أسئلة الموديول' : 'Module Questions');
    
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
            <React.Fragment key={block.id ?? sIdx}>
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

              <div className="bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[30px] overflow-hidden group shadow-sm transition-all hover:shadow-md">
                <div className={`p-3 sm:p-4 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-start md:items-center border-b ${block.type === 'QUESTION' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0 md:w-auto">
                    <span className={`w-10 h-10 min-w-10 shrink-0 whitespace-nowrap tabular-nums rounded-xl flex items-center justify-center font-black text-white shadow-md ${block.type === 'QUESTION' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                      {sIdx + 1}
                    </span>
                    <div className="flex flex-col gap-1 flex-1 min-w-0 md:w-auto">
                      <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                        <select
                          value={block.label}
                          onChange={(e) => updateBlockTypeAndReset(source, sIdx, e.target.value)}
                          className="w-full min-w-0 sm:w-auto bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 outline-none focus:border-indigo-600 px-2 py-1 uppercase"
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
                          className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1 w-full min-w-0 md:w-48 placeholder:text-slate-400"
                          placeholder={block.type === 'TEXT' ? (language === 'ar' ? "عنوان القسم (اختياري)" : "Section Title (Optional)") : (language === 'ar' ? "عنوان السؤال (اختياري)" : "Question Title (Optional)")}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full md:w-auto self-end md:self-auto">
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
                      onChange={(val) => updateBlock(source, sIdx, 'content', val, block)}
                      placeholder={block.type === 'TEXT' ? (language === 'ar' ? "اكتب محتوى شرح الدرس هنا..." : "Write lecture explanation content here...") : (language === 'ar' ? "اكتب نص السؤال هنا..." : "Write question prompt here...")}
                      className="!bg-white !border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-7 gap-4 p-6 bg-white border border-slate-200 rounded-[30px] shadow-sm">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المعيار' : 'Standard'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.standard || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'standard', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر المعيار...' : 'Select Standard...'}</option>
                          {(currentModule.standards || "").split("\n").filter(Boolean).map((s: string) => (
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
                          {(currentModule.indicators || "").split("\n").filter(Boolean).map((ind: string) => (
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
                          {(currentModule.learningOutcomes || "").split("\n").filter(Boolean).map((lo: string) => (
                            <option key={lo} value={lo}>{lo}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة' : 'Skill'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.skill || "General"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "add_custom") {
                              const newVal = prompt(language === 'ar' ? "أدخل مهارة مخصصة جديدة:" : "Enter custom skill:");
                              if (newVal && newVal.trim()) {
                                const trimmed = newVal.trim();
                                setCustomSkills(prev => Array.from(new Set([...prev, trimmed])));
                                updateBlock(source, sIdx, 'skill', trimmed);
                              }
                            } else {
                              updateBlock(source, sIdx, 'skill', val);
                            }
                          }}
                        >
                          <option value="General">{language === 'ar' ? 'عام' : 'General'}</option>
                          {allExistingSkills.filter((sk: any) => sk !== "General").map((sk: any) => (
                            <option key={sk} value={sk}>{sk}</option>
                          ))}
                          <option value="add_custom" className="text-indigo-600 font-bold">
                            {language === 'ar' ? '+ إضافة مهارة مخصصة...' : '+ Add Custom Skill...'}
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.level || "Medium"}
                          onChange={(e) => updateBlock(source, sIdx, 'level', e.target.value)}
                        >
                          <option value="Foundation">{language === 'ar' ? 'تأسيسي' : 'Foundation'}</option>
                          <option value="On Level">{language === 'ar' ? 'في المستوى' : 'On Level'}</option>
                          <option value="Advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
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

                      {block.type === 'QUESTION' && (
                        <>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'النقاط' : 'Points'}</label>
                            <input 
                          type="number"
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.points !== undefined ? block.points : 1}
                          onChange={(e) => updateBlock(source, sIdx, 'points', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? '⭐ نقاط XP' : '⭐ XP Points'}</label>
                        <input
                              type="number"
                              className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                              value={block.xpPoints !== undefined ? block.xpPoints : 10}
                              onChange={(e) => updateBlock(source, sIdx, 'xpPoints', parseInt(e.target.value) || 0)}
                            />
                      </div>
                        </>
                      )}
                    </div>


                  {block.type === 'QUESTION' && (
                    <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4">
                      {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(block.label || 'MCQ') ? (
                        <>
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">{language === 'ar' ? "خيارات الإجابة والإجابة الصحيحة" : "Answer Options & Correct Answer"}</label>
                          {block.label === 'TRUE_FALSE' ? (
                            <div className="grid grid-cols-2 gap-4">
                              {(language === 'ar' ? ['صحيح', 'خطأ'] : ['True', 'False']).map((opt) => (
                                <div key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${block.correctAnswer === opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`} onClick={() => updateBlock(source, sIdx, 'correctAnswer', opt)}>
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${block.correctAnswer === opt ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-200 border-transparent'}`}>
                                    {block.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                                  </div>
                                  <span className={`font-black text-sm ${block.correctAnswer === opt ? 'text-emerald-700' : 'text-slate-500'}`}>{opt}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {block.options?.map((opt: any, oIdx: number) => { return (
                                <div key={oIdx} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${block.correctAnswer === opt ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-transparent'}`}>
                                  <div className="mt-1 flex-shrink-0" onClick={(e) => {
                                    e.stopPropagation();
                                    updateBlock(source, sIdx, 'correctAnswer', opt);
                                  }}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${block.correctAnswer === opt ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                      {block.correctAnswer === opt && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                  <div className="flex-1 flex gap-3 items-start min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-[11px] text-indigo-600 shrink-0 select-none">
                                      {getOptionLetter(oIdx, language)}
                                    </span>
                                    <MathInput 
                                      value={opt}
                                      onChange={(val) => {
                                        const newOpts = [...(block.options || [])];
                                        newOpts[oIdx] = val;
                                        updateBlock(source, sIdx, 'options', newOpts);
                                      }}
                                      placeholder={language === 'ar' ? `الخيار ${oIdx + 1} (بدون أ، ب، ج)` : `Option ${oIdx + 1} (no A, B, C)`}
                                      className="bg-transparent flex-1"
                                    />
                                    {block.options.length > 2 && (
                                      <button type="button" onClick={() => {
                                        const newOpts = [...block.options];
                                        newOpts.splice(oIdx, 1);
                                        updateBlock(source, sIdx, 'options', newOpts);
                                      }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                  </div>
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
                            setCurrentModule((prev: any) => {
                              const newSlides = [...(prev[source] || [])];
                              const resolvedIndex = newSlides.findIndex((candidate: any) => candidate === block || (block.id != null && candidate?.id === block.id));
                              if (resolvedIndex < 0) return prev;
                              newSlides[resolvedIndex] = {
                                ...newSlides[resolvedIndex],
                                options: updatedQ.options,
                                correctAnswer: updatedQ.correctAnswer,
                                ...(updatedQ.type === 'MULTI_SELECT' ? (() => {
                                  try {
                                    return { correctAnswers: JSON.parse(updatedQ.correctAnswer) };
                                  } catch (e) {
                                    return {};
                                  }
                                })() : {})
                              };
                              return { ...prev, [source]: newSlides };
                            });
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
                              onChange={(val) => updateSection(source, sIdx, secIdx, val, block, sec)}
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
  
  const [editingStandaloneIndex, setEditingStandaloneIndex] = useState<number | null>(null);

  const handleAddStandaloneQuestion = () => {
    setTempQuestion({
      id: Date.now() + Math.random(),
      text: "",
      type: "MCQ",
      label: "MCQ",
      options: ["", "", "", ""],
      correctAnswer: "",
      correctAnswers: [],
      points: 1,
      xpPoints: 10,
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
    setEditingStandaloneIndex(null);
    setQuestionSource('questions');
    setCurrentModule({ ...currentModule, _isStandalone: true });
    setShowQuestionForm(true);
  };

  const handleEditStandaloneQuestion = (index: number) => {
    const item = { ...standaloneQuestions[index] };
    if (!item.options) item.options = ["", "", "", ""];
    if (!item.sections) item.sections = [];
    if (!item.type) item.type = item.label || "MCQ";
    setTempQuestion(item);
    setEditingStandaloneIndex(index);
    setQuestionSource('questions');
    setCurrentModule({ ...currentModule, _isStandalone: true });
    setShowQuestionForm(true);
  };

  const handleSaveStandaloneQuestion = () => {
    if (!tempQuestion.text) {
      showToast(language === 'ar' ? "يرجى إدخال نص السؤال" : "Please enter question text", "error");
      return;
    }
    const itemToSave = { ...tempQuestion, label: tempQuestion.type };
    setStandaloneQuestions((prev: any) => {
      const newList = [...prev];
      if (editingStandaloneIndex !== null) newList[editingStandaloneIndex] = itemToSave;
      else newList.push(itemToSave);
      return newList;
    });
    setShowQuestionForm(false);
    setEditingStandaloneIndex(null);
    showToast(language === 'ar' ? "تم حفظ السؤال بنجاح" : "Question saved successfully", "success");
  };

  const removeStandaloneQuestion = (index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    setStandaloneQuestions((prev: any) => {
      const newList = [...prev];
      newList.splice(index, 1);
      return newList;
    });
    showToast(language === 'ar' ? "تم حذف السؤال" : "Question deleted", "info");
  };

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
      xpPoints: 10,
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
    const list = currentModule[source] || [];
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

    const itemToSave = {
      ...tempQuestion,
      label: tempQuestion.type // Ensure label is synced with type
    };

    setCurrentModule((prev: any) => {
      const newList = [...(prev[source] || [])];
      if (editingQuestionIndex !== null) newList[editingQuestionIndex] = itemToSave;
      else newList.push(itemToSave);
      return { ...prev, [source]: newList };
    });
    setShowQuestionForm(false);
    setEditingQuestionIndex(null);
    showToast(language === 'ar' ? "تم حفظ السؤال في القائمة بنجاح" : "Question saved to list successfully", "success");
  };

  const removeQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    setCurrentModule((prev: any) => {
      const newList = [...(prev[source] || [])];
      newList.splice(index, 1);
      return { ...prev, [source]: newList };
    });
    setExpandedQuestionIndex((expanded) => expanded === index ? null : (expanded !== null && expanded > index ? expanded - 1 : expanded));
    showToast(language === 'ar' ? "تم حذف السؤال" : "Question deleted", "info");
  };

  const moveQuestionForSource = (source: 'assignments' | 'questions', index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= (currentModule[source] || []).length) return;
    setCurrentModule((prev: any) => {
      const newList = [...(prev[source] || [])];
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      return { ...prev, [source]: newList };
    });
    setExpandedQuestionIndex((expanded) => expanded === index ? targetIndex : (expanded === targetIndex ? index : expanded));
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
    const list = (currentModule[lessonField] || "").split("\n").filter(Boolean);
    const selectPlaceholder = language === 'ar' ? `اختر ${label}...` : `Select ${label}...`;
    const addCustomLabel = language === 'ar' ? `+ إضافة ${label} مخصص...` : `+ Add Custom ${label}...`;
    const promptEnterLabel = language === 'ar' ? `أدخل ${label} المخصص الجديد:` : `Enter new custom ${label}:`;
    const promptEditLabel = language === 'ar' ? `تعديل ${label} المخصص:` : `Edit custom ${label}:`;
    const confirmDeleteLabel = language === 'ar' ? `هل أنت متأكد من حذف هذا ${label}؟` : `Are you sure you want to delete this ${label}?`;

    return (
      <div className="flex flex-col gap-2 relative">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={currentValue}
            onChange={(e) => updateCurrentQuestionField(field, e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={selectPlaceholder}
            className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-700 font-bold text-xs outline-none min-h-[34px] focus:border-indigo-600 transition-all text-right"
            dir="auto"
          />
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
            className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400 hover:text-indigo-600"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        
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
                          setCurrentModule({ ...currentModule, [lessonField]: newList.join("\n") });
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
                          setCurrentModule({ ...currentModule, [lessonField]: newList.join("\n") });
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
                    const list = (currentModule[lessonField] || "").split("\n").filter(Boolean);
                    if (!list.includes(newVal.trim())) {
                      const newList = [...list, newVal.trim()];
                      setCurrentModule({ ...currentModule, [lessonField]: newList.join("\n") });
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
    const list = currentModule[source] || [];
    const headerLabel = source === 'assignments' 
      ? (language === 'ar' ? 'واجبات وتكليفات الدرس (Assignments)' : 'Lesson Assignments')
      : (language === 'ar' ? 'تدريبات وتقييمات الدرس (Quiz Me)' : 'Quiz Me Practice');
    
    const headerDesc = source === 'assignments'
      ? (language === 'ar' ? 'قم بإضافة التكليفات التطبيقية والواجبات المنزلية للطلاب' : 'Add application homework and assignments for students')
      : (language === 'ar' ? 'قم بإضافة أسئلة لاختبار الطالب في هذا الموديول' : 'Add questions to test student in this module');

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
                <div key={q.id ?? index} className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                  <div className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                      <div className="flex flex-col items-center gap-1">
                        <button type="button" onClick={() => moveQuestionForSource(source, index, 'UP')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                        <span className="w-8 h-8 min-w-8 shrink-0 whitespace-nowrap tabular-nums bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{index + 1}</span>
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
                          <HtmlRenderer html={q.text} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold" />
                          
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
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                                          {isCorrect ? '✓' : ''}
                                        </div>
                                        <span className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-[10px] text-indigo-600 shrink-0">
                                          {getOptionLetter(oIdx, language)}
                                        </span>
                                        <span>{cleanOptionText(opt)}</span>
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
                                      <HtmlRenderer html={sec.content} className="text-slate-700 font-bold font-sans" />
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
                onClick={() => { setShowQuestionForm(false); setCurrentModule({...currentModule, _isStandalone: false}); }}
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
                        updated.options = language === 'ar' ? ["صحيح", "خطأ", "", ""] : ["True", "False", "", ""];
                        updated.correctAnswer = language === 'ar' ? "صحيح" : "True";
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

                                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المجال' : 'Domain'}</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                    value={tempQuestion.domain || ""}
                    onChange={(e) => updateCurrentQuestionField("domain", e.target.value)}
                  >
                    <option value="">{language === 'ar' ? 'اختر المجال...' : 'Select Domain...'}</option>
                    {availableMetadata.domains.map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المعيار' : 'Standard'}</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px] truncate"
                    value={tempQuestion.standard || ""}
                    onChange={(e) => updateCurrentQuestionField("standard", e.target.value)}
                  >
                    <option value="">{language === 'ar' ? 'اختر المعيار...' : 'Select Standard...'}</option>
                    {availableMetadata.standards.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المؤشر' : 'Indicator'}</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px] truncate"
                    value={tempQuestion.indicator || ""}
                    onChange={(e) => updateCurrentQuestionField("indicator", e.target.value)}
                  >
                    <option value="">{language === 'ar' ? 'اختر المؤشر...' : 'Select Indicator...'}</option>
                    {availableMetadata.indicators.map((ind: string) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'ناتج التعلم (LO)' : 'Learning Outcome (LO)'}</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px] truncate"
                    value={tempQuestion.learningOutcome || ""}
                    onChange={(e) => updateCurrentQuestionField("learningOutcome", e.target.value)}
                  >
                    <option value="">{language === 'ar' ? 'اختر ناتج التعلم...' : 'Select Outcome...'}</option>
                    {availableMetadata.outcomes.map((lo: string) => (
                      <option key={lo} value={lo}>{lo}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة' : 'Skill'}</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                    value={tempQuestion.skill || "General"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "add_custom") {
                        const newVal = prompt(language === 'ar' ? "أدخل مهارة مخصصة جديدة:" : "Enter custom skill:");
                        if (newVal && newVal.trim()) {
                          const trimmed = newVal.trim();
                          setCustomSkills(prev => Array.from(new Set([...prev, trimmed])));
                          updateCurrentQuestionField("skill", trimmed);
                        }
                      } else {
                        updateCurrentQuestionField("skill", val);
                      }
                    }}
                  >
                    <option value="General">{language === 'ar' ? 'عام' : 'General'}</option>
                    {allExistingSkills.filter((sk: any) => sk !== "General").map((sk: any) => (
                      <option key={sk} value={sk}>{sk}</option>
                    ))}
                    <option value="add_custom" className="text-indigo-600 font-bold">
                      {language === 'ar' ? '+ إضافة مهارة مخصصة...' : '+ Add Custom Skill...'}
                    </option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                    value={tempQuestion.level || "Medium"}
                    onChange={(e) => updateCurrentQuestionField("level", e.target.value)}
                  >
                    <option value="Foundation">{language === 'ar' ? 'تأسيسي' : 'Foundation'}</option>
                    <option value="On Level">{language === 'ar' ? 'في المستوى' : 'On Level'}</option>
                    <option value="Advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
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

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? '⭐ نقاط XP' : '⭐ XP Points'}</label>
                  <input
                      type="number"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                      value={tempQuestion.xpPoints !== undefined ? tempQuestion.xpPoints : 10}
                      onChange={(e) => updateCurrentQuestionField("xpPoints", parseInt(e.target.value) || 0)}
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
                    <div className="grid grid-cols-2 gap-6 mt-4 col-span-2">
                      <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div 
                          className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                          onClick={() => updateCurrentQuestionField('correctAnswer', language === 'ar' ? "صحيح" : "True")}
                        >
                          {isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                        <span className="font-black text-xl text-slate-700">{language === 'ar' ? "صحيح" : "True"}</span>
                      </div>
                      
                      <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "خطأ" : "False") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div 
                          className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "خطأ" : "False") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                          onClick={() => updateCurrentQuestionField('correctAnswer', language === 'ar' ? "خطأ" : "False")}
                        >
                          {isQuestionCorrectAnswer(language === 'ar' ? "خطأ" : "False") && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                        <span className="font-black text-xl text-slate-700">{language === 'ar' ? "خطأ" : "False"}</span>
                      </div>
                    </div>
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
                          <span className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-xs text-indigo-600 shrink-0 select-none">
                            {getOptionLetter(oIndex, language)}
                          </span>
                          <MathInput 
                            placeholder={language === 'ar' ? `الخيار ${oIndex + 1} (بدون أ، ب، ج)` : `Option ${oIndex + 1} (no A, B, C)`}
                            className="bg-transparent flex-1"
                            value={opt}
                            onChange={(val) => updateQuestionOption(oIndex, val)}
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
    if (!isAutoSaveEnabled || isLoading || manualSubmitRef.current) return;

    const snapshot = JSON.stringify({ createdId, examData, modules, isModuleModalOpen, currentModule, editingModuleIndex });
    if (snapshot === lastAutoSaveSnapshotRef.current) return;
    lastAutoSaveSnapshotRef.current = snapshot;
    const requestGeneration = ++autoSaveGenerationRef.current;
    
    const timer = setTimeout(() => {
      const runAutoSave = async () => {
        if (manualSubmitRef.current || requestGeneration !== autoSaveGenerationRef.current) return;
      try {
        const token = localStorage.getItem("super_admin_token");
        if (!token) return;

        const finalModules = [...modules];
        if (isModuleModalOpen && currentModule.title) {
          if (editingModuleIndex !== null) {
            finalModules[editingModuleIndex] = currentModule;
          } else {
            finalModules.push(currentModule);
          }
        }

                const targetSchoolIds = (examData.schoolIds || []).filter(Boolean);
        const isCentral = targetSchoolIds.length === 0;

        const allQuestions: any[] = [];
        const modulesPayload = finalModules.map((m, index) => {
           const mId = m.id || String(Date.now() + index);
           const mQuestions = (m.questions || []).map((q: any) => ({
               ...q,
               moduleId: mId
           }));
           allQuestions.push(...mQuestions);
           return {
              id: mId,
              title: m.title,
              description: m.content || null,
              duration: m.duration || null,
              passingScore: m.passingScore || null,
              order: index
           };
        });
        
        allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));
        const payload = {
          title: examData.title || (language === 'ar' ? "مسودة امتحان بدون عنوان" : "Untitled Exam Draft"),
          description: examData.description,
          coverImage: examData.coverImage || null,
          grades: examData.grades,
          subjects: examData.subjects || [],
          country: examData.country,
          isCentral,
          schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
          schoolIds: targetSchoolIds,
          duration: examData.duration || 60,
          passingScore: examData.passingScore || 50,
          password: examData.password || null,
          resultVisibility: examData.resultVisibility || "SHOW_SCORE",
          attemptsAllowed: examData.attemptsAllowed || 1,
          startDate: examData.startDate || null,
          endDate: examData.endDate || null,
          status: "DRAFT",
          modules: modulesPayload,
          questions: allQuestions
        };

        const activeExamId = createdIdRef.current;
        const method = activeExamId ? "PUT" : "POST";
        const url = activeExamId 
          ? `${API_URL}/exams/${activeExamId}`
          : `${API_URL}/exams`;

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
          const serverId = data.id || data.exam?.id;
          if (!createdIdRef.current && serverId) {
             createdIdRef.current = serverId;
             setCreatedId(serverId);
          }
          if (manualSubmitRef.current || requestGeneration !== autoSaveGenerationRef.current) return;
          if (data && data.modules) {
            const parsedModules = data.modules.map((l: any) => {
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
            if (isModuleModalOpen) {
              let idx = editingModuleIndex;
              if (idx === null) {
                idx = parsedModules.length - 1;
                setEditingModuleIndex(idx);
              }
              if (idx >= 0 && idx < parsedModules.length) {
                // Keep current state edits so we don't overwrite user actively typing, 
                // but preserve backend-assigned IDs (UUIDs)
                setCurrentModule((prev: any) => ({
                ...prev,
                id: parsedModules[idx].id,
                content: prev.content,
                slides: prev.slides.map((s: any, sIdx: number) => {
                  const serverSlide = parsedModules[idx].slides?.[sIdx];
                  return serverSlide ? { ...s, id: serverSlide.id } : s;
                  }),
                  questions: prev.questions.map((q: any, qIdx: number) => {
                    const serverQ = parsedModules[idx].questions?.[qIdx];
                    return serverQ ? { ...q, id: serverQ.id } : q;
                  }),
                  assignments: prev.assignments.map((a: any, aIdx: number) => {
                    const serverA = parsedModules[idx].assignments?.[aIdx];
                    return serverA ? { ...a, id: serverA.id } : a;
                  })
                }));
              }
              // Set all modules with backend IDs
              setModules(parsedModules.map((pl: any, plIdx: number) => {
                if (plIdx === idx) {
                  return {
                    ...pl,
                    title: currentModule.title,
                    domain: currentModule.domain,
                    content: currentModule.content,
                    videoUrl: currentModule.videoUrl,
                    summary: currentModule.summary,
                    notes: currentModule.notes,
                    standards: currentModule.standards,
                    indicators: currentModule.indicators,
                    learningOutcomes: currentModule.learningOutcomes,
                    isVisible: currentModule.isVisible,
                    publishDate: currentModule.publishDate,
                    cutOffDate: currentModule.cutOffDate,
                    slides: currentModule.slides.map((s: any, sIdx: number) => {
                      const serverSlide = pl.slides?.[sIdx];
                      return serverSlide ? { ...s, id: serverSlide.id } : s;
                    }),
                    questions: currentModule.questions.map((q: any, qIdx: number) => {
                      const serverQ = pl.questions?.[qIdx];
                      return serverQ ? { ...q, id: serverQ.id } : q;
                    }),
                    assignments: currentModule.assignments.map((a: any, aIdx: number) => {
                      const serverA = pl.assignments?.[aIdx];
                      return serverA ? { ...a, id: serverA.id } : a;
                    })
                  };
                }
                return pl;
              }));
            } else {
              setModules(parsedModules);
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
      };

      const queuedWrite = autoSaveWriteQueueRef.current.then(runAutoSave, runAutoSave);
      autoSaveWriteQueueRef.current = queuedWrite.catch(() => undefined);
    }, 1_500);
    autoSaveTimerRef.current = timer;

    return () => {
      clearTimeout(timer);
      if (autoSaveTimerRef.current === timer) autoSaveTimerRef.current = null;
    };
  }, [isAutoSaveEnabled, isLoading, createdId, examData, modules, isModuleModalOpen, currentModule, editingModuleIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examData.title) {
      showToast(t('courseCreate.titleRequired') || "Please enter a course title", "error");
      return;
    }
    if (!examData.subjects || examData.subjects.length === 0) {
      showToast(t('courseCreate.subjectRequired') || "Please select at least one subject / specialization", "error");
      return;
    }
    
    manualSubmitRef.current = true;
    autoSaveGenerationRef.current += 1;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsLoading(true);
    const token = localStorage.getItem("super_admin_token");
    
    try {
      await autoSaveWriteQueueRef.current;

      const finalModules = [...modules];
      if (isModuleModalOpen && currentModule.title) {
        if (editingModuleIndex !== null) {
          finalModules[editingModuleIndex] = currentModule;
        } else {
          finalModules.push(currentModule);
        }
      }

            const targetSchoolIds = (examData.schoolIds || []).filter(Boolean);
      const isCentral = targetSchoolIds.length === 0;

      const allQuestions: any[] = [];
      const modulesPayload = finalModules.map((m, index) => {
         const mId = m.id || String(Date.now() + index);
         const mQuestions = (m.questions || []).map((q: any) => ({
             ...q,
             moduleId: mId
         }));
         allQuestions.push(...mQuestions);
         return {
            id: mId,
            title: m.title,
            description: m.content || null,
            duration: m.duration || null,
            passingScore: m.passingScore || null,
            order: index
         };
      });

      const activeExamId = createdIdRef.current;
      const method = activeExamId ? "PUT" : "POST";
      const url = activeExamId 
        ? `${API_URL}/exams/${activeExamId}`
        : `${API_URL}/exams`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: examData.title,
          description: examData.description,
          coverImage: examData.coverImage || null,
          grades: examData.grades,
          subjects: examData.subjects || [],
          country: examData.country,
          isCentral,
          schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
          schoolIds: targetSchoolIds,
          duration: examData.duration || 60,
          passingScore: examData.passingScore || 50,
          password: examData.password || null,
          resultVisibility: examData.resultVisibility || "SHOW_SCORE",
          attemptsAllowed: examData.attemptsAllowed || 1,
          startDate: examData.startDate || null,
          endDate: examData.endDate || null,
          status: "PUBLISHED",

          courseName: examData.courseName,
          section: examData.section,
          domain: examData.domain,
          learningOutcomes: examData.learningOutcomes,
          indicators: examData.indicators,
          skills: examData.skills,
          gradeTarget: examData.gradeTarget,

          modules: modulesPayload,
          questions: allQuestions
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.stack || data.details || data.error || "Failed to create exam");
      }

      showToast("Exam created successfully!", "success");
      router.push(`/super-admin/exams`);
    } catch (error: any) {
      console.error("Exam creation error:", error);
      showToast(error.message || "Connection error", 'error');
    } finally {
      manualSubmitRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto space-y-6">
        {isModuleModalOpen && typeof document !== 'undefined' && createPortal(
          <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 w-full max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[95vh] rounded-[24px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-slate-900 p-3 sm:p-8 flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3 truncate">
                    <Monitor className="w-8 h-8" />
                    {editingModuleIndex !== null ? (language === 'ar' ? `تعديل الموديول: ${currentModule.title}` : `Edit Module: ${currentModule.title}`) : (language === 'ar' ? "إضافة موديول جديد" : "Design New Module")}
                  </h3>
                  <p className="hidden sm:block text-slate-400 mt-1 font-bold">{language === 'ar' ? "بناء محتوى الموديول والأسئلة" : "Build module content and questions"}</p>
                </div>
                <button onClick={() => setIsModuleModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto shrink-0 custom-scrollbar">
                {[
                  { id: 'info', label: language === 'ar' ? "الأهداف والمعلومات" : "Objectives & Info", icon: Target },
                  { id: 'scheduling', label: language === 'ar' ? "الجدولة والظهور" : "Scheduling & Visibility", icon: Clock },
                  { id: 'exercises', label: language === 'ar' ? "الأسئلة والامتحانات" : "Questions & Exams", icon: HelpCircle },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all ${
                      activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
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
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{language === 'ar' ? "عنوان الموديول" : "Module Title"}</label>
                        <input
                          type="text"
                          value={currentModule.title}
                          onChange={(e) => setCurrentModule({...currentModule, title: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                          placeholder={language === 'ar' ? "مثال: القوة والحركة في اتجاه واحد" : "e.g. Force and Motion in One Dimension"}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{language === 'ar' ? "رابط فيديو يوتيوب" : "YouTube Video URL"}</label>
                        <input 
                          type="text" 
                          value={currentModule.videoUrl}
                          onChange={(e) => setCurrentModule({...currentModule, videoUrl: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-rose-600 transition-all text-left"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                        {language === 'ar' ? "محتوى الدرس" : "Lesson Content"}
                      </label>
                      <textarea
                        value={currentModule.content || ""}
                        onChange={(e) => setCurrentModule({ ...currentModule, content: e.target.value })}
                        className="w-full min-h-[180px] bg-slate-50 border border-slate-200 rounded-[28px] py-5 px-6 text-slate-900 text-base font-medium outline-none focus:border-indigo-600 transition-all shadow-sm resize-y leading-8"
                        placeholder={language === 'ar' ? "اكتب أو الصق المحتوى النصي للدرس هنا..." : "Write or paste the lesson content here..."}
                      />
                    </div>

                    <div className="bg-white p-8 rounded-[35px] border border-slate-100 space-y-8">
                       <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          <Target className="w-6 h-6 text-indigo-600" />
                          {language === 'ar' ? "الأهداف والمعايير الأكاديمية" : "Academic Objectives & Standards"}
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المجال" : "Domain"}</label>
                          <select 
                            value={currentModule.domain || ""}
                            onChange={(e) => setCurrentModule({...currentModule, domain: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm font-bold"
                          >
                            <option value="">{t('courseCreate.selectDomain') || "Select Domain..."}</option>
                            {availableMetadata.domains.map((domainName: string) => (
                              <option key={domainName} value={domainName}>{domainName}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المعايير" : "Standards"}</label>
                          <select 
                            value={currentModule.standards || ""}
                            onChange={(e) => setCurrentModule({...currentModule, standards: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm font-bold truncate"
                          >
                            <option value="">{t('courseCreate.selectStandard') || "Select Standard..."}</option>
                            {availableMetadata.standards.map((standardName: string) => (
                              <option key={standardName} value={standardName}>{standardName}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المؤشرات" : "Indicators"}</label>
                          <select 
                            value={currentModule.indicators || ""}
                            onChange={(e) => setCurrentModule({...currentModule, indicators: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm font-bold truncate"
                          >
                            <option value="">{t('courseCreate.selectIndicator') || "Select Indicator..."}</option>
                            {availableMetadata.indicators.map((indicatorName: string) => (
                              <option key={indicatorName} value={indicatorName}>{indicatorName}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "نواتج التعلم (LOs)" : "Learning Outcomes (LOs)"}</label>
                          <select 
                            value={currentModule.learningOutcomes || ""}
                            onChange={(e) => setCurrentModule({...currentModule, learningOutcomes: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm font-bold truncate"
                          >
                            <option value="">{t('courseCreate.selectOutcome') || "Select Learning Outcome..."}</option>
                            {availableMetadata.outcomes.map((outcomeName: string) => (
                              <option key={outcomeName} value={outcomeName}>{outcomeName}</option>
                            ))}
                          </select>
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
                          <h4 className="text-xl font-black text-indigo-900">{language === 'ar' ? "ظهور الموديول" : "Module Visibility"}</h4>
                          <p className="text-indigo-600/60 font-bold text-sm">{language === 'ar' ? "التحكم في إمكانية رؤية الطلاب لهذا الموديول حالياً" : "Control whether students can see this module currently"}</p>
                       </div>
                       <button 
                        type="button"
                        onClick={() => setCurrentModule({...currentModule, isVisible: !currentModule.isVisible})}
                        className={`w-20 h-10 rounded-full relative transition-all duration-300 ${currentModule.isVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}
                       >
                          <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 ${currentModule.isVisible ? (language === 'ar' ? 'left-1' : 'right-11') : (language === 'ar' ? 'left-11' : 'right-1')}`}></div>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-3 text-emerald-600">
                             <CheckCircle2 className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? "تاريخ النشر" : "Publish Date"}</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">{language === 'ar' ? "لن يظهر الموديول للطلاب قبل هذا التاريخ حتى لو تم تمكين الظهور" : "The module will not appear to students before this date even if Visibility is enabled"}</p>
                          <input 
                            type="datetime-local"
                            value={currentModule.publishDate || ""}
                            onChange={(e) => setCurrentModule({...currentModule, publishDate: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                          />
                       </div>

                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-3 text-red-500">
                             <AlertCircle className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? "تاريخ الإيقاف / الحذف" : "Cut-off Date"}</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">{language === 'ar' ? "سيختفي الموديول تلقائياً من واجهة الطالب بعد هذا التاريخ" : "The module will automatically disappear from the student interface after this date"}</p>
                          <input 
                            type="datetime-local"
                            value={currentModule.cutOffDate || ""}
                            onChange={(e) => setCurrentModule({...currentModule, cutOffDate: e.target.value})}
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
                          onClick={() => setCurrentModule({...currentModule, attachments: [...(currentModule.attachments || []), { name: "", url: "", type: "PDF" }]})}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          {t('courseCreate.addFile') || "Add File"}
                        </button>
                     </div>
                     <div className="grid grid-cols-1 gap-6">
                        {(currentModule.attachments || []).map((att: any, attIdx: number) => (
                          <div key={attIdx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                              </div>
                              <button 
                                onClick={() => {
                                  const atts = [...currentModule.attachments];
                                  atts.splice(attIdx, 1);
                                  setCurrentModule({...currentModule, attachments: atts});
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
                                  const atts = [...currentModule.attachments];
                                  atts[attIdx].name = e.target.value;
                                  setCurrentModule({...currentModule, attachments: atts});
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm outline-none focus:border-indigo-600"
                                placeholder={t('courseCreate.fileName') || "File Name"}
                              />
                              <div className="flex gap-3">
                                <select 
                                  value={att.type}
                                  onChange={(e) => {
                                    const atts = [...currentModule.attachments];
                                    atts[attIdx].type = e.target.value;
                                    setCurrentModule({...currentModule, attachments: atts});
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
                                      const atts = [...currentModule.attachments];
                                      atts[attIdx].url = e.target.value;
                                      setCurrentModule({...currentModule, attachments: atts});
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
                                            const atts = [...currentModule.attachments];
                                            atts[attIdx].url = url;
                                            if (!atts[attIdx].name) atts[attIdx].name = file.name;
                                            if (file.name.toLowerCase().endsWith('.pdf')) atts[attIdx].type = 'PDF';
                                            else if (file.name.match(/\.(ppt|pptx)$/i)) atts[attIdx].type = 'PPT';
                                            else if (file.name.match(/\.(doc|docx)$/i)) atts[attIdx].type = 'DOC';
                                            else if (file.name.match(/\.(xls|xlsx)$/i)) atts[attIdx].type = 'XLS';
                                            else if (file.type.startsWith('image/')) atts[attIdx].type = 'IMAGE';
                                            setCurrentModule({...currentModule, attachments: atts});
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

              {/* Standalone Questions */}
              {/* Standalone Questions Restored Grid */}
              <div className="mt-12 standalone-questions-section">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {standaloneQuestions.slice(0, visibleStandaloneCount).map((q: any, index: number) => (
                    <div key={index} className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500">
                             {index + 1}
                           </div>
                           <div>
                             <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">{q.type || 'MCQ'}</span>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={(e) => { e.preventDefault(); handleEditStandaloneQuestion(index); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={(e) => { e.preventDefault(); removeStandaloneQuestion(index); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                      <div className="text-slate-800 font-bold line-clamp-3 text-sm flex-1" dangerouslySetInnerHTML={{ __html: q.text }} />
                      <div className="text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-auto">
                        {language === 'ar' ? 'الإجابة:' : 'Answer:'} <span className="text-emerald-600 ml-1">{q.correctAnswer || (q.correctAnswers?.join(', ') || '-')}</span>
                      </div>
                    </div>
                  ))}
                  {standaloneQuestions.length > visibleStandaloneCount && (
                    <div className="col-span-1 md:col-span-2 flex justify-center mt-6">
                      <button
                        onClick={(e) => { e.preventDefault(); setVisibleStandaloneCount(prev => prev + 50); }}
                        className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black hover:bg-indigo-100 hover:scale-105 transition-all shadow-sm"
                      >
                        {language === 'ar' ? 'عرض المزيد من الأسئلة' : 'Load More Questions'} ({standaloneQuestions.length - visibleStandaloneCount} {language === 'ar' ? 'متبقي' : 'Remaining'})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button 
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                >
                  {t('courseCreate.cancelChanges') || "Cancel Changes"}
                </button>
                <button 
                  onClick={saveModule}
                  className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3"
                >
                  {language === 'ar' ? "تأكيد وحفظ" : "Confirm & Save"}
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

          <div className="animate-in fade-in duration-500">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100">
                  <ArrowLeft className="w-7 h-7" />
                </button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">{language === 'ar' ? 'إنشاء تقييم جديد' : 'Create New Exam'}</h1>
                  <p className="text-slate-400 text-lg mt-1 font-bold">{language === 'ar' ? 'صمم تجربة تقييم متكاملة لطلابك' : 'Design a complete assessment experience for your students'}</p>
                </div>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-12 py-5 rounded-[22px] font-black flex items-center gap-3 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ ونشر التقييم' : 'Save & Publish Exam')}
                <Save className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Side: Exam Settings */}
              {showSettings && (
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>
                  <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 relative z-10">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    {language === 'ar' ? 'إعدادات التقييم' : 'Assessment Settings'}
                  </h2>
                  
                  <div className="space-y-6 relative z-10">
                    {/* Cover Image Upload */}
                    <div className="space-y-3">
                      <FileUpload
                        label={language === 'ar' ? 'صورة غلاف التقييم' : 'Assessment Cover Image'}
                        accept="image/*"
                        value={examData.coverImage}
                        onUploadSuccess={(url) => setExamData({ ...examData, coverImage: url })}
                        tokenKey="super_admin_token"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'عنوان التقييم' : 'Assessment Title'}</label>
                      <input 
                        type="text" 
                        value={examData.title}
                        onChange={(e) => setExamData({...examData, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                        placeholder={language === 'ar' ? 'مثال: الرياضيات المتقدمة' : 'e.g. Advanced Mathematics'}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'وصف التقييم' : 'Assessment Description'}</label>
                      <textarea 
                        value={examData.description}
                        onChange={(e) => setExamData({...examData, description: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all min-h-[120px] resize-none"
                        placeholder={language === 'ar' ? 'نبذة مختصرة عن التقييم...' : 'Brief description of the exam...'}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.country')}</label>
                        <select 
                          value={examData.country}
                          onChange={(e) => setExamData({...examData, country: e.target.value})}
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
                          ].map((group) => {
                            const allSelected = group.grades.every(g => examData.grades.includes(g));
                            
                            return (
                              <div key={group.stage} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                  <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    {group.title}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (allSelected) {
                                        setExamData({
                                          ...examData,
                                          grades: examData.grades.filter(g => !group.grades.includes(g))
                                        });
                                      } else {
                                        const newGrades = [...examData.grades];
                                        group.grades.forEach(g => {
                                          if (!newGrades.includes(g)) newGrades.push(g);
                                        });
                                        setExamData({
                                          ...examData,
                                          grades: newGrades
                                        });
                                      }
                                    }}
                                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                                  >
                                    {allSelected ? (language === 'ar' ? "إلغاء تحديد الكل" : "تحديد الكل") : (language === 'ar' ? "تحديد الكل" : "Select All")}
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {group.grades.map(g => (
                                    <label key={g} className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${examData.grades.includes(g) ? 'bg-indigo-50/50 border-indigo-400' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${examData.grades.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'}`}>
                                        {examData.grades.includes(g) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </div>
                                      <span className={`text-[11px] sm:text-xs font-bold ${examData.grades.includes(g) ? 'text-indigo-900' : 'text-slate-600'}`}>{getGradeName(g)}</span>
                                      <input type="checkbox" className="hidden" checked={examData.grades.includes(g)} onChange={(e) => {
                                        if(e.target.checked) setExamData({...examData, grades: [...examData.grades, g]});
                                        else setExamData({...examData, grades: examData.grades.filter(gr => gr !== g)});
                                      }} />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.subjectSpecialization')} <span className="text-red-500">*</span></label>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                          {CATEGORIES.map((cat) => (
                            <label
                              key={cat}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                                examData.subjects.includes(cat)
                                  ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={examData.subjects.includes(cat)}
                                onChange={() => toggleCourseSubject(cat)}
                              />
                              <div
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                  examData.subjects.includes(cat)
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 border border-slate-200"
                                }`}
                              >
                                {examData.subjects.includes(cat) && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="text-xs font-black">{getSubjectName(cat)}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'يمكن اختيار أكثر من مادة وسيتم حفظها كوسوم داخل نفس التقييم.' : 'Multiple subjects can be selected and will be saved as tags within the same assessment.'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'إسناد التقييم للمدرسة' : 'Assign Assessment to School'}</label>
                      {schools.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold text-sm">
                          {language === 'ar' ? 'لا توجد مدارس متاحة' : 'No schools available'}
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center px-2 mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'اختر المدارس (اختياري)' : 'Select Schools (Optional)'}</span>
                            <button
                              type="button"
                              onClick={selectAllSchools}
                              className="text-[10px] font-black text-indigo-600 hover:underline"
                            >
                              {(examData.schoolIds || []).length === schools.length ? (language === 'ar' ? 'إلغاء الكل' : 'Deselect All') : (language === 'ar' ? 'تحديد الكل' : 'Select All')}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {schools.map((s) => (
                              <label
                                key={s.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  (examData.schoolIds || []).includes(s.id)
                                    ? "bg-indigo-50 border-indigo-500"
                                    : "bg-white border-transparent hover:border-slate-200"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={(examData.schoolIds || []).includes(s.id)}
                                  onChange={() => toggleCourseSchool(s.id)}
                                />
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                    (examData.schoolIds || []).includes(s.id)
                                      ? "bg-indigo-600 text-white"
                                      : "bg-slate-100 border border-slate-200"
                                  }`}
                                >
                                  {(examData.schoolIds || []).includes(s.id) && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{s.name}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {language === 'ar' ? 'لو ما اخترتش مدارس: التقييم يبقى مركزي. لو اخترت أكثر من مدرسة: النظام هيعمل نسخة من نفس التقييم لكل مدرسة.' : 'If no schools are selected, the assessment remains central. If multiple schools are selected, a copy will be created for each school.'}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المدة (دقائق)" : "Duration (Mins)"}</label>
                        <input
                          type="number"
                          value={examData.duration}
                          onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 60})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "درجة النجاح" : "Passing Score"}</label>
                        <input
                          type="number"
                          value={examData.passingScore}
                          onChange={(e) => setExamData({...examData, passingScore: parseInt(e.target.value) || 50})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المحاولات" : "Attempts"}</label>
                        <input
                          type="number"
                          value={examData.attemptsAllowed}
                          onChange={(e) => setExamData({...examData, attemptsAllowed: parseInt(e.target.value) || 1})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "كلمة المرور" : "Password"}</label>
                        <input
                          type="text"
                          value={examData.password || ""}
                          onChange={(e) => setExamData({...examData, password: e.target.value})}
                          placeholder={language === 'ar' ? "اختياري" : "Optional"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ البدء" : "Start Date"}</label>
                        <input
                          type="datetime-local"
                          value={examData.startDate || ""}
                          onChange={(e) => setExamData({...examData, startDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ الانتهاء" : "End Date"}</label>
                        <input
                          type="datetime-local"
                          value={examData.endDate || ""}
                          onChange={(e) => setExamData({...examData, endDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                    </div>
                                        {/* Advanced Module Metadata */}
                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl space-y-4">
                      <h4 className="font-black text-indigo-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        {language === 'ar' ? 'البيانات الوصفية المتقدمة' : 'Advanced Metadata'}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-indigo-700 uppercase tracking-widest">{language === 'ar' ? 'الكورس' : 'Course'}</label>
                          <input type="text" value={examData.courseName || ""} onChange={(e) => setExamData({...examData, courseName: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-indigo-700 uppercase tracking-widest">{language === 'ar' ? 'القسم' : 'Section'}</label>
                          <input type="text" value={examData.section || ""} onChange={(e) => setExamData({...examData, section: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-indigo-700 uppercase tracking-widest">{language === 'ar' ? 'المجال' : 'Domain'}</label>
                          <input type="text" value={examData.domain || ""} onChange={(e) => setExamData({...examData, domain: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-indigo-700 uppercase tracking-widest">{language === 'ar' ? 'مخرجات التعلم' : 'Learning Outcomes'}</label>
                          <input type="text" value={examData.learningOutcomes || ""} onChange={(e) => setExamData({...examData, learningOutcomes: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-indigo-700 uppercase tracking-widest">{language === 'ar' ? 'المؤشرات' : 'Indicators'}</label>
                          <input type="text" value={examData.indicators || ""} onChange={(e) => setExamData({...examData, indicators: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-indigo-700 uppercase tracking-widest">{language === 'ar' ? 'المهارات' : 'Skills'}</label>
                          <input type="text" value={examData.skills || ""} onChange={(e) => setExamData({...examData, skills: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-indigo-700 uppercase tracking-widest">{language === 'ar' ? 'المرحلة المستهدفة' : 'Grade Target'}</label>
                          <input type="text" value={examData.gradeTarget || ""} onChange={(e) => setExamData({...examData, gradeTarget: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                        </div>
                      </div>
                    </div>

<div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "سياسة النتيجة" : "Result Policy"}</label>
                      <select
                        value={examData.resultVisibility}
                        onChange={(e) => setExamData({...examData, resultVisibility: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                      >
                        <option value="SHOW_SCORE">{language === 'ar' ? "إظهار النتيجة فقط" : "Show Score Only"}</option>
                        <option value="SHOW_SCORE_ANSWERS">{language === 'ar' ? "إظهار النتيجة والإجابات" : "Show Score & Answers"}</option>
                        <option value="HIDDEN">{language === 'ar' ? "إخفاء النتيجة" : "Hidden"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[40px] flex items-center gap-6">
                   <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <ListOrdered className="w-8 h-8" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900">{language === 'ar' ? 'محتوى الامتحان' : 'Exam Content'}</h4>
                      <p className="text-indigo-600 font-bold">{language === 'ar' ? `تم إضافة ${modules.length} موديولات` : `${modules.length} Modules Added`}</p>
                   </div>
                </div>
              </div>

              )}

              {/* Right Side: Modules Management */}
              <div className={`space-y-8 ${showSettings ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                {/* Sections Structure hidden as requested */}

                {modules.length === 0 ? (
                  <div className="bg-white border-4 border-dashed border-slate-100 rounded-[50px] p-24 text-center group cursor-pointer hover:border-indigo-500/20 transition-all" onClick={openAddModuleModal}>
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all">
                      <Monitor className="w-12 h-12 text-slate-300 group-hover:text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">{language === 'ar' ? 'ابدأ ببناء امتحانك!' : 'Start Building Your Exam!'}</h3>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-lg">{language === 'ar' ? 'لم يتم إضافة أي موديولات بعد' : 'No modules added yet'}</p>
                    <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20">
                      {language === 'ar' ? 'إنشاء موديول' : 'Create Module'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {modules.map((lesson, index) => (
                      <div key={index} className="bg-white border border-slate-100 rounded-[24px] p-4 hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-md cursor-pointer flex items-center gap-4"
                        onClick={() => { openEditModuleModal(index); setActiveTab('exercises'); }}>
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                        
                        {/* Number */}
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-indigo-100">
                          {index + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 text-lg truncate group-hover:text-indigo-600 transition-colors">
                            {lesson.title || (language === 'ar' ? 'موديول بدون عنوان' : 'Untitled Module')}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-400">
                            <HelpCircle className={`w-3.5 h-3.5 ${lesson.questions?.length ? 'text-indigo-600' : 'text-slate-300'}`} />
                            {language === 'ar' ? `${lesson.questions?.length || 0} أسئلة` : `${lesson.questions?.length || 0} Questions`}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditModuleModal(index); }}
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-blue-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveModule(index); }}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Standalone Questions */}
              {/* Standalone Questions Restored Grid */}
              <div className="mt-12 standalone-questions-section">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {standaloneQuestions.slice(0, visibleStandaloneCount).map((q: any, index: number) => (
                    <div key={index} className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500">
                             {index + 1}
                           </div>
                           <div>
                             <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">{q.type || 'MCQ'}</span>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={(e) => { e.preventDefault(); handleEditStandaloneQuestion(index); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={(e) => { e.preventDefault(); removeStandaloneQuestion(index); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                      <div className="text-slate-800 font-bold line-clamp-3 text-sm flex-1" dangerouslySetInnerHTML={{ __html: q.text }} />
                      <div className="text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-auto">
                        {language === 'ar' ? 'الإجابة:' : 'Answer:'} <span className="text-emerald-600 ml-1">{q.correctAnswer || (q.correctAnswers?.join(', ') || '-')}</span>
                      </div>
                    </div>
                  ))}
                  {standaloneQuestions.length > visibleStandaloneCount && (
                    <div className="col-span-1 md:col-span-2 flex justify-center mt-6">
                      <button
                        onClick={(e) => { e.preventDefault(); setVisibleStandaloneCount(prev => prev + 50); }}
                        className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black hover:bg-indigo-100 hover:scale-105 transition-all shadow-sm"
                      >
                        {language === 'ar' ? 'عرض المزيد من الأسئلة' : 'Load More Questions'} ({standaloneQuestions.length - visibleStandaloneCount} {language === 'ar' ? 'متبقي' : 'Remaining'})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
