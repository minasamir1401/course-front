"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ArrowLeft, Plus, Trash2, Video, FileText, 
  HelpCircle, BookOpen, Save, Layers, Edit2, X,
  ChevronDown, ChevronUp, Play, Layout, Target, 
  CheckCircle2, AlertCircle, Upload, Download, Settings,
  Eye, Monitor, ListOrdered, FileJson, FileDown, Clock,
  Lightbulb, MessageSquareQuote, TriangleAlert, Search, CheckCircle
} from "lucide-react";
import * as XLSX from 'xlsx';
import RichTextEditor from "@/components/RichTextEditor";
import { compressImage } from "@/lib/image-utils";
import FileUpload from "@/components/FileUpload";


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
      icon: CheckCircle,
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
        "الصف الأول الابتدائي": "المرحلة الابتدائية",
        "الصف الثاني الابتدائي": "المرحلة الابتدائية",
        "الصف الثالث الابتدائي": "المرحلة الابتدائية",
        "الصف الرابع الابتدائي": "المرحلة الابتدائية",
        "الصف الخامس الابتدائي": "المرحلة الابتدائية",
        "الصف السادس الابتدائي": "المرحلة الابتدائية",
        "الصف الأول الإعدادي": "المرحلة الإعدادية",
        "الصف الثاني الإعدادي": "المرحلة الإعدادية",
        "الصف الثالث الإعدادي": "المرحلة الإعدادية",
        "الصف الأول الثانوي": "المرحلة الثانوية",
        "الصف الثاني الثانوي": "المرحلة الثانوية",
        "الصف الثالث الثانوي": "المرحلة الثانوية"
      };
      return translations[grade] || grade;
    }
    const translations: { [key: string]: string } = {
      "Elementary": "Elementary",
      "Middle School": "Middle School",
      "High School": "High School",
      "الصف الأول الابتدائي": "Elementary",
      "الصف الثاني الابتدائي": "Elementary",
      "الصف الثالث الابتدائي": "Elementary",
      "الصف الرابع الابتدائي": "Elementary",
      "الصف الخامس الابتدائي": "Elementary",
      "الصف السادس الابتدائي": "Elementary",
      "الصف الأول الإعدادي": "Middle School",
      "الصف الثاني الإعدادي": "Middle School",
      "الصف الثالث الإعدادي": "Middle School",
      "الصف الأول الثانوي": "High School",
      "الصف الثاني الثانوي": "High School",
      "الصف الثالث الثانوي": "High School"
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
  const [schools, setSchools] = useState<any[]>([]);
  
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
  const [questionSource, setQuestionSource] = useState<'assignments' | 'exercises'>('exercises');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [tempQuestion, setTempQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "General", level: "Medium",
    learningOutcome: "", standard: "", indicator: "", 
    explanations: [""], correctAnswers: [], attempts: 1
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
    "Elementary",
    "Middle School",
    "High School"
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
        
        // Find columns matching Standard, Indicator, Outcome, Domain
        const stdIdx = headers.findIndex(h => h.includes("standard") || h.includes("معيار") || h.includes("المعايير"));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات"));
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات"));
        const domainIdx = headers.findIndex(h => h.includes("domain") || h.includes("مجال") || h.includes("المجال"));
        const lessonIdx = headers.findIndex(h => h.includes("lesson") || h.includes("درس") || h.includes("الدرس"));

        if (stdIdx === -1 && indIdx === -1 && loIdx === -1 && domainIdx === -1) {
          showToast(t('courseCreate.excelNoHeaderError') || "Could not find matching columns (Standards, Indicators, Outcomes, Domain)", "error");
          return;
        }

        // Combine rows or pick values
        let standardVal = "";
        let indicatorVal = "";
        let outcomeVal = "";
        let domainVal = "";

        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim() !== ""));
        
        // Smart filtering by lesson name if "Lesson" column exists and current lesson has a title
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

  const handleExcelUpload = (type: 'questions' | 'metadata' | 'assignments') => {
    if (type === 'metadata') {
      metadataExcelRef.current?.click();
    } else {
      showToast(language === 'ar' ? "هذه الميزة قيد التطوير" : "This feature is under development", "info");
    }
  };

  const downloadMetadataTemplate = () => {
    const wsData = [
      ["Standard", "Indicator", "Outcome", "Domain"],
      ["معيار 1: الفهم والاستيعاب", "مؤشر 1: يحدد المفاهيم الأساسية", "ناتج 1: أن يكون الطالب قادراً على...", "الفيزياء"],
      ["معيار 2: التطبيق والتحليل", "مؤشر 2: يطبق القوانين الرياضية", "ناتج 2: أن يميز الطالب بين...", "الفيزياء"],
      ["معيار 3: التفكير النقدي", "مؤشر 3: يستنتج العلاقات", "ناتج 3: أن يحلل الطالب...", "الفيزياء"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metadata Template");
    XLSX.writeFile(wb, "course_metadata_template.xlsx");
    showToast(language === 'ar' ? "تم تحميل نموذج المعايير بنجاح" : "Metadata template downloaded successfully", "success");
  };

  const addBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    const currentList = currentLesson[source] || [];
    setCurrentLesson({
      ...currentLesson,
      [source]: [...currentList, newBlock]
    });
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    const newSlides = [...(currentLesson[source] || [])];
    newSlides.splice(index, 0, newBlock);
    setCurrentLesson({
      ...currentLesson,
      [source]: newSlides
    });
    showToast("Slide inserted successfully", "success");
  };

  const moveBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, direction: 'UP' | 'DOWN') => {
    const newSlides = [...(currentLesson[source] || [])];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    setCurrentLesson({
      ...currentLesson,
      [source]: newSlides
    });
  };

  const updateBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, field: string, value: any) => {
    const newSlides = [...(currentLesson[source] || [])];
    newSlides[index] = { ...newSlides[index], [field]: value };
    if (field === 'content') {
      newSlides[index].text = value;
    } else if (field === 'text') {
      newSlides[index].content = value;
    }
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
  };

  const removeBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number) => {
    const newSlides = [...(currentLesson[source] || [])];
    newSlides.splice(index, 1);
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
  };

  const addSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, type: string) => {
    const newSlides = [...(currentLesson[source] || [])];
    if (!newSlides[blockIndex].sections) newSlides[blockIndex].sections = [];
    newSlides[blockIndex].sections.push({ id: Date.now() + Math.random(), type, content: "" });
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
  };

  const updateSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number, content: string) => {
    const newSlides = [...(currentLesson[source] || [])];
    newSlides[blockIndex].sections[sectionIndex].content = content;
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
  };

  const removeSection = (source: 'slides' | 'assignments' | 'questions' = 'slides', blockIndex: number, sectionIndex: number) => {
    const newSlides = [...(currentLesson[source] || [])];
    newSlides[blockIndex].sections.splice(sectionIndex, 1);
    setCurrentLesson({ ...currentLesson, [source]: newSlides });
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Layout className="w-6 h-6 text-indigo-600" />
              {headerLabel}
            </h4>
            <p className="text-slate-400 text-sm font-bold mt-1">{headerDesc}</p>
          </div>
          <div className="flex gap-3">
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
                          onChange={(e) => updateBlock(source, sIdx, 'label', e.target.value)}
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
                    <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4">
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
  const handleAddQuestion = (source: 'assignments' | 'exercises') => {
    setTempQuestion({
      text: "", type: "MCQ", options: ["", "", "", ""],
      correctAnswer: "", points: 1, skill: "General", level: "Medium",
      learningOutcome: "", standard: "", indicator: "",
      explanations: [""], correctAnswers: [], attempts: 1
    });
    setQuestionSource(source);
    setEditingQuestionIndex(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (source: 'assignments' | 'exercises', index: number) => {
    const questions = source === 'assignments' ? currentLesson.assignments : currentLesson.questions;
    setTempQuestion({ ...questions[index] });
    setQuestionSource(source);
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = () => {
    if (!tempQuestion.text) {
      showToast(t('courseCreate.enterQuestionText') || "Please enter question text", "error");
      return;
    }

    if (questionSource === 'assignments') {
      const newAssignments = [...(currentLesson.assignments || [])];
      if (editingQuestionIndex !== null) {
        newAssignments[editingQuestionIndex] = tempQuestion;
      } else {
        newAssignments.push(tempQuestion);
      }
      setCurrentLesson({ ...currentLesson, assignments: newAssignments });
    } else {
      const newQuestions = [...(currentLesson.questions || [])];
      if (editingQuestionIndex !== null) {
        newQuestions[editingQuestionIndex] = tempQuestion;
      } else {
        newQuestions.push(tempQuestion);
      }
      setCurrentLesson({ ...currentLesson, questions: newQuestions });
    }

    setShowQuestionForm(false);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...currentLesson.questions];
    newQuestions.splice(index, 1);
    setCurrentLesson({ ...currentLesson, questions: newQuestions });
  };

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
    const token = localStorage.getItem("super_admin_token");
    
    try {
      const lessonsPayload = lessons.map((l) => ({
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
      const targetSchoolIds = (courseData.schoolIds || []).filter(Boolean);
      const isCentral = targetSchoolIds.length === 0;

      const res = await fetch(`${API_URL}/school/courses`, {
        method: "POST",
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
          isCentral,
          schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
          schoolIds: targetSchoolIds,
          lessons: lessonsPayload
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.stack || data.details || data.error || "Failed to create course");
      }

      showToast(
        targetSchoolIds.length > 0
          ? (t('courseCreate.publishAssignedSuccess') || "Course created and assigned to selected schools")
          : (t('courseCreate.publishSuccess') || "Course created successfully"),
        "success"
      );

      router.push(`/super-admin/courses`);
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
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 w-full rounded-[40px] shadow-2xl overflow-hidden">
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
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                {[
                  { id: 'info', label: language === 'ar' ? "الأهداف والمعلومات" : "Objectives & Info", icon: Target },
                  { id: 'scheduling', label: language === 'ar' ? "الجدولة والظهور" : "Scheduling & Visibility", icon: Clock },
                  { id: 'slides', label: language === 'ar' ? "شرائح الشرح" : "Lecture Slides", icon: Layout },
                  { id: 'assignments', label: language === 'ar' ? "الواجبات والتكليفات" : "Lesson Assignments", icon: FileText },
                  { id: 'exercises', label: language === 'ar' ? "التدريبات التفاعلية (Quiz Me)" : "Practice Quizzes (Quiz Me)", icon: HelpCircle },
                  { id: 'attachments', label: t('courseCreate.attachments') || "Attachments", icon: FileDown },
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

              <div className="p-8 sm:p-12 overflow-y-auto max-h-[70vh] custom-scrollbar">
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
                                  {["مؤشر 1: يحدد المفاهيم الأساسية", "مؤشر 2: يطبق القوانين الرياضية", "مؤشر 3: يستنتج العلاقات"].map((option) => {
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
                                    const customOpts = selected.filter((x: string) => !["مؤشر 1: يحدد المفاهيم الأساسية", "مؤشر 2: يطبق القوانين الرياضية", "مؤشر 3: يستنتج العلاقات"].includes(x));
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
                                  {["ناتج 1: أن يكون الطالب قادراً على...", "ناتج 2: أن يميز الطالب بين...", "ناتج 3: أن يحلل الطالب..."].map((option) => {
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
                                    const customOpts = selected.filter((x: string) => !["ناتج 1: أن يكون الطالب قادراً على...", "ناتج 2: أن يميز الطالب بين...", "ناتج 3: أن يحلل الطالب..."].includes(x));
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

                {activeTab === 'assignments' && renderSlidesBuilder('assignments')}

                {activeTab === 'exercises' && renderSlidesBuilder('questions')}

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
                                <input 
                                  type="text"
                                  value={att.url}
                                  onChange={(e) => {
                                    const atts = [...currentLesson.attachments];
                                    atts[attIdx].url = e.target.value;
                                    setCurrentLesson({...currentLesson, attachments: atts});
                                  }}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs outline-none text-left font-mono focus:border-indigo-600"
                                  placeholder={t('courseCreate.externalUrl') || "External File URL (URL)"}
                                  dir="ltr"
                                />
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
                        tokenKey="super_admin_token"
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

                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.grades')}</label>
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-[250px] overflow-y-auto custom-scrollbar">
                          {GRADES.map(g => (
                            <label key={g} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${courseData.grades.includes(g) ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-transparent hover:border-slate-200'}`}>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${courseData.grades.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'}`}>
                                {courseData.grades.includes(g) && <CheckCircle2 className="w-4 h-4" />}
                              </div>
                              <span className={`text-sm font-bold ${courseData.grades.includes(g) ? 'text-indigo-900' : 'text-slate-600'}`}>{getGradeName(g)}</span>
                              <input type="checkbox" className="hidden" checked={courseData.grades.includes(g)} onChange={(e) => {
                                if(e.target.checked) setCourseData({...courseData, grades: [...courseData.grades, g]});
                                else setCourseData({...courseData, grades: courseData.grades.filter(gr => gr !== g)});
                              }} />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.subjectSpecialization')} <span className="text-red-500">*</span></label>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
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
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  (courseData.schoolIds || []).includes(s.id)
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
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                    (courseData.schoolIds || []).includes(s.id)
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
