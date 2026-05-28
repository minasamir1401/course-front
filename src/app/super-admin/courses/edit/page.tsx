"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, getFullImageUrl } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import {
  ArrowLeft, Plus, Trash2, Video, FileText,
  HelpCircle, BookOpen, Save, Layers, Edit2, X,
  ChevronDown, ChevronUp, Play, Layout, Target,
  CheckCircle2, AlertCircle, Upload, Download, Settings,
  Eye, Monitor, ListOrdered, FileJson, Clock,
  Lightbulb, MessageSquareQuote, TriangleAlert, Search, CheckCircle
} from "lucide-react";
import * as XLSX from 'xlsx';
import RichTextEditor from "@/components/RichTextEditor";
import { compressImage } from "@/lib/image-utils";
import { useLanguage } from "@/contexts/LanguageContext";


export default function EditCoursePage() {
  const { t, language } = useLanguage();
  const SECTION_STYLE_PRESETS: Record<string, {
    icon: any;
    label: string;
    container: string;
    badge: string;
  }> = {
    HINT: {
      icon: Lightbulb,
      label: "Hint",
      container: "bg-yellow-50/70 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
    },
    TIP: {
      icon: Lightbulb,
      label: "Tip",
      container: "bg-sky-50/70 border-sky-200",
      badge: "bg-sky-100 text-sky-700",
    },
    WARNING: {
      icon: TriangleAlert,
      label: "Warning",
      container: "bg-rose-50/70 border-rose-200",
      badge: "bg-rose-100 text-rose-700",
    },
    KEY_INSIGHT: {
      icon: Search,
      label: "Key Insight",
      container: "bg-indigo-50/70 border-indigo-200",
      badge: "bg-indigo-100 text-indigo-700",
    },
    FEEDBACK: {
      icon: MessageSquareQuote,
      label: "Feedback",
      container: "bg-emerald-50/70 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
    },
    EXPLANATION: {
      icon: CheckCircle,
      label: "Explanation",
      container: "bg-amber-50/70 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
    },
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const courseId = searchParams.get('id');
  const schoolIdParam = searchParams.get('schoolId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);

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

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    coverImage: "",
    grades: [] as string[],
    subject: "",
    country: "مصر",
    isCentral: false,
    schoolId: schoolIdParam || "",
    schoolIds: (schoolIdParam ? [schoolIdParam] : []) as string[]
  });

  const [lessons, setLessons] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [activeContentTab, setActiveContentTab] = useState<'lessons' | 'quizzes' | 'assignments'>('lessons');
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  // Collapsible panel state
  const [courseSettingsCollapsed, setCourseSettingsCollapsed] = useState(false);

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
    slides: [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: "المقدمة", content: "", sections: [] }],
    questions: [],
    assignments: [],
    attachments: []
  });

  // UI States for Lesson Modal
  const [activeTab, setActiveTab] = useState<'info' | 'slides' | 'exercises' | 'assignments' | 'attachments' | 'scheduling'>('info');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false);
  const [isOutcomeDropdownOpen, setIsOutcomeDropdownOpen] = useState(false);
  const [isStandardDropdownOpen, setIsStandardDropdownOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [tempQuestion, setTempQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "General", level: "Medium",
    learningOutcome: "", explanations: [""], correctAnswers: [], attempts: 1
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

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const QUESTION_TYPES = [
    { id: "MCQ", label: "اختيار من متعدد" },
    { id: "TRUE_FALSE", label: "صح وخطأ" },
    { id: "MULTI_SELECT", label: "اختيار متعدد" }
  ];

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchSchools(token);
    if (courseId) {
      fetchCourseData(token, courseId);
    }
  }, [courseId]);

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

  const toggleCourseSchool = (id: string) => {
    const current = courseData.schoolIds || [];
    if (current.includes(id)) {
      setCourseData({ ...courseData, schoolIds: current.filter(s => s !== id) });
    } else {
      setCourseData({ ...courseData, schoolIds: [...current, id] });
    }
  };

  const selectAllSchools = () => {
    if ((courseData.schoolIds || []).length === schools.length) {
      setCourseData({ ...courseData, schoolIds: [] });
    } else {
      setCourseData({ ...courseData, schoolIds: schools.map(s => s.id) });
    }
  };

  const fetchCourseData = async (token: string, id: string) => {
    try {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let parsedGrades = ["High School"];
        try {
          if (data.grades && typeof data.grades === 'string') {
            parsedGrades = JSON.parse(data.grades);
          } else if (Array.isArray(data.grades)) {
            parsedGrades = data.grades;
          } else if (data.grade) {
            parsedGrades = [data.grade];
          }
        } catch (e) {
          parsedGrades = data.grade ? [data.grade] : ["High School"];
        }

        const legacyGradeMap: { [key: string]: string } = {
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
          "الصف الثالث الثانوي": "High School",
          "1st Primary": "Elementary",
          "2nd Primary": "Elementary",
          "3rd Primary": "Elementary",
          "4th Primary": "Elementary",
          "5th Primary": "Elementary",
          "6th Primary": "Elementary",
          "1st Prep": "Middle School",
          "2nd Prep": "Middle School",
          "3rd Prep": "Middle School",
          "1st Secondary": "High School",
          "2nd Secondary": "High School",
          "3rd Secondary": "High School"
        };
        parsedGrades = parsedGrades.map(g => legacyGradeMap[g] || g);

        setCourseData({
          title: data.title,
          description: data.description || "",
          coverImage: data.coverImage || "",
          grades: parsedGrades,
          subject: data.subject || "",
          country: data.country || "مصر",
          isCentral: data.isCentral,
          schoolId: data.schoolId || "",
          schoolIds: data.schools ? data.schools.map((s: any) => s.id) : (data.schoolId ? [data.schoolId] : [])
        });
        
        setExams(data.exams || []);

        setLessons(data.lessons.map((l: any) => {
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
          } catch (e) { parsedSlides = [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: "المقدمة", content: "", sections: [] }]; }

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
            slides: Array.isArray(parsedSlides) && parsedSlides.length ? parsedSlides : [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: "المقدمة", content: "", sections: [] }]
          };
        }));

        // Set Exams
        if (data.exams) {
          setExams(data.exams);
        }
      }
    } catch (error) {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const linkExamToCourse = async (examId: string) => {
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/exams/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId }) // Link this exam to this course
      });
      
      if (res.ok) {
        showToast("تم ربط المحتوى بنجاح", "success");
        if(token) fetchCourseData(token, courseId!);
      }
    } catch (e) {
      showToast("فشل الربط", "error");
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
      title: "", domain: "", videoUrl: "", summary: "", notes: "", standards: "", indicators: "", learningOutcomes: "",
      isVisible: true, publishDate: "", cutOffDate: "",
      slides: [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: "المقدمة", content: "", sections: [] }],
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
    if (!lessonToEdit.slides || lessonToEdit.slides.length === 0) lessonToEdit.slides = [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: "المقدمة", content: "", sections: [] }];
    setCurrentLesson(lessonToEdit);
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const openBankModal = async () => {
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/exams?isCentral=true`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setBankItems(await res.json());
        setIsBankModalOpen(true);
      }
    } catch (e) {
      showToast("فشل فتح بنك الأسئلة", "error");
    }
  };

  const openQuestionBankModal = async () => {
    showToast("جاري فتح بنك الأسئلة المركزي...", "info");
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/bank/questions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setBankQuestions(await res.json());
        setIsQuestionBankModalOpen(true);
      }
    } catch (e) {
      showToast("فشل فتح بنك الأسئلة", "error");
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
      level: q.level
    });
    setCurrentLesson({ ...currentLesson, questions: newQuestions });
    showToast("تم إضافة السؤال للدرس", "success");
  };

  const saveLesson = async () => {
    if (!currentLesson.title) {
      showToast("يجب إدخال عنوان الدرس", "error");
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

    const token = localStorage.getItem("super_admin_token");
    if (!token || !courseId) return;

    try {
      const targetSchoolIds = (courseData.schoolIds || []).filter(Boolean);
      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...courseData,
          isCentral: targetSchoolIds.length === 0,
          schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
          schoolIds: targetSchoolIds,
          lessons: newLessons.map((l) => ({
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
          }))
        })
      });

      if (res.ok) {
        showToast("تم حفظ الدرس ونشره تلقائياً ✅", "success");
      } else {
        showToast("تم الحفظ محلياً لكن فشل النشر - تأكد من الاتصال", "error");
      }
    } catch (error: any) {
      console.error("Auto-save error:", error);
      showToast("تم الحفظ محلياً لكن فشل النشر", "error");
    }
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
          showToast("الملف فارغ أو لا يحتوي على صفوف بيانات", "error");
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
          showToast("لم يتم العثور على أعمدة متوافقة (المعايير، المؤشرات، المخرجات، المجال)", "error");
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
      showToast("هذه الميزة قيد التطوير", "info");
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
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `محتوى جديد`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `سؤال جديد`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    const currentList = currentLesson[source] || [];
    setCurrentLesson({
      ...currentLesson,
      [source]: [...currentList, newBlock]
    });
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `محتوى جديد`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `سؤال جديد`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    const newSlides = [...(currentLesson[source] || [])];
    newSlides.splice(index, 0, newBlock);
    setCurrentLesson({
      ...currentLesson,
      [source]: newSlides
    });
    showToast("تم إدراج الشريحة بنجاح", "success");
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
    const headerLabel = source === 'slides' ? 'شرائح الشرح والدرس' : source === 'assignments' ? 'تكليفات الدرس (Assignments)' : 'تدريبات الدرس (Quiz Me)';
    const headerDesc = source === 'slides' 
      ? 'قم بإضافة محتوى نصي، أمثلة، ملاحظات، أو أسئلة تفاعلية مدمجة لشرح الدرس' 
      : source === 'assignments' 
        ? 'قم بإضافة التكليفات التطبيقية والواجبات المنزلية للطلاب' 
        : 'قم بإضافة أسئلة تدريبية تفاعلية لتقييم فهم واستيعاب الطالب';

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
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
              + محتوى نصي (Text)
            </button>
            <button 
              type="button"
              onClick={() => addBlock(source, 'QUESTION')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              + سؤال مدمج (Question)
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
                      <span>+ شريحة شرح</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertBlockAt(source, 0, 'QUESTION')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ سؤال مدمج</span>
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
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md ${block.type === 'QUESTION' ? 'bg-indigo-600' : 'bg-slate-888 bg-slate-800'}`}>
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
                              <option value="CONTENT">محتوى (Content)</option>
                              <option value="EXAMPLE">مثال (Example)</option>
                              <option value="SUMMARY">ملخص (Summary)</option>
                              <option value="HINT">ملاحظة (Note)</option>
                              <option value="EXPLANATION">شرح (Explanation)</option>
                            </>
                          ) : (
                            <>
                              <option value="MCQ">اختيار من متعدد (MCQ)</option>
                              <option value="TRUE_FALSE">صح وخطأ (T/F)</option>
                              <option value="MULTI_SELECT">اختيار متعدد (Multi-select)</option>
                            </>
                          )}
                        </select>
                        <input 
                          type="text"
                          value={block.title || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'title', e.target.value)}
                          className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1 w-full md:w-48 placeholder:text-slate-400"
                          placeholder={block.type === 'TEXT' ? "عنوان الوحدة (اختياري)" : "عنوان السؤال (اختياري)"}
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
                        title="تحريك لأعلى"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={sIdx === list.length - 1}
                        onClick={() => moveBlock(source, sIdx, 'DOWN')}
                        className="p-2 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:hover:text-slate-300 hover:bg-slate-50 rounded-lg transition-all"
                        title="تحريك لأسفل"
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
                        <Plus className="w-4 h-4" /> إضافة قسم
                      </button>
                      <div className={`absolute right-0 left-auto mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 ${openDropdownId === `${source}-slide-${sIdx}` ? "block" : "hidden"}`}>
                        {['FEEDBACK', 'HINT', 'EXPLANATION', 'TIP', 'WARNING', 'KEY_INSIGHT'].map(secType => (
                          <button
                            key={secType}
                            type="button"
                            onClick={() => {
                               addSection(source, sIdx, secType);
                               setOpenDropdownId(null);
                            }}
                            className="w-full text-right px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2"
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
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">رابط فيديو (اختياري) خاص بهذا القسم</label>
                    <input
                      type="url"
                      value={block.videoUrl || ""}
                      onChange={(e) => updateBlock(source, sIdx, 'videoUrl', e.target.value)}
                      placeholder="أضف رابط يوتيوب أو فيميو هنا..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <RichTextEditor 
                      value={block.content}
                      onChange={(val) => updateBlock(source, sIdx, 'content', val)}
                      placeholder={block.type === 'TEXT' ? "اكتب محتوى الشرح هنا..." : "اكتب نص السؤال هنا..."}
                      className="!bg-white !border-slate-200"
                    />
                  </div>

                  {block.type === 'QUESTION' && (
                    <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">خيارات الإجابة</label>
                      {block.label === 'TRUE_FALSE' ? (
                        <div className="grid grid-cols-2 gap-4">
                          {['صحيح', 'خطأ'].map((opt) => (
                            <div key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${block.correctAnswer === opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`} onClick={() => updateBlock(source, sIdx, 'correctAnswer', opt)}>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${block.correctAnswer === opt ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-200 border-transparent'}`}>
                                {block.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                              <span className="font-bold text-slate-700">{opt}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(block.options || ["", "", "", ""]).map((opt: string, oIdx: number) => {
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
                                    const newOpts = [...(block.options || ["", "", "", ""])];
                                    const oldVal = newOpts[oIdx];
                                    const newVal = e.target.value;
                                    newOpts[oIdx] = newVal;
                                    
                                    const newBlock = { ...block, options: newOpts };
                                    if (block.label === 'MULTI_SELECT' && (block.correctAnswers || []).includes(oldVal)) {
                                      newBlock.correctAnswers = (block.correctAnswers || []).map((a: string) => a === oldVal ? newVal : a);
                                    } else if (block.correctAnswer === oldVal) {
                                      newBlock.correctAnswer = newVal;
                                    }
                                    
                                    const newSlides = [...(currentLesson[source] || [])];
                                    newSlides[sIdx] = newBlock;
                                    setCurrentLesson({ ...currentLesson, [source]: newSlides });
                                  }}
                                  placeholder={`خيار ${oIdx + 1}`}
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
                            onClick={() => updateBlock(source, sIdx, 'options', [...(block.options||["", "", "", ""]), ""])}
                            className="flex justify-center items-center p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-200 hover:border-slate-400 transition-all cursor-pointer"
                          >
                            <Plus className="w-5 h-5 ml-1" /> إضافة خيار
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(block.sections || []).length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">أقسام إضافية ديناميكية (Dynamic Sections)</label>
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
                              placeholder={`محتوى الـ ${sec.type}...`}
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
                    <span>+ شريحة شرح</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlockAt(source, sIdx + 1, 'QUESTION')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ سؤال مدمج</span>
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

  const handleAddQuestion = () => {
    setTempQuestion({
      text: "", type: "MCQ", options: ["", "", "", ""],
      correctAnswer: "", points: 1, skill: "General", level: "Medium",
      learningOutcome: "", explanations: [""], correctAnswers: [], attempts: 1
    });
    setEditingQuestionIndex(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (index: number) => {
    setTempQuestion({ ...currentLesson.questions[index] });
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = () => {
    if (!tempQuestion.text) {
      showToast("يرجى إدخال نص السؤال", "error");
      return;
    }
    const newQuestions = [...currentLesson.questions];
    if (editingQuestionIndex !== null) {
      newQuestions[editingQuestionIndex] = tempQuestion;
    } else {
      newQuestions.push(tempQuestion);
    }
    setCurrentLesson({ ...currentLesson, questions: newQuestions });
    setShowQuestionForm(false);
  };

  const handleSaveAssignment = () => {
    if (!tempQuestion.text) {
      showToast("يرجى إدخال نص التكليف", "error");
      return;
    }
    const newAssignments = [...(currentLesson.assignments || [])];
    if (editingQuestionIndex !== null) {
      newAssignments[editingQuestionIndex] = tempQuestion;
    } else {
      newAssignments.push(tempQuestion);
    }
    setCurrentLesson({ ...currentLesson, assignments: newAssignments });
    setShowQuestionForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.title) {
      showToast("يرجى إدخال عنوان الكورس", "error");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");

    try {
      const targetSchoolIds = (courseData.schoolIds || []).filter(Boolean);

      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...courseData,
          isCentral: targetSchoolIds.length === 0,
          schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
          schoolIds: targetSchoolIds,
          lessons: lessons.map((l) => ({
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
          }))
        })
      });

      if (res.ok) {
        showToast("تم تحديث الكورس بنجاح", 'success');
        router.push(`/super-admin/courses`);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || data.details || "فشل تحديث الكورس", 'error');
      }
    } catch (error: any) {
      console.error("Course update error:", error);
      showToast(error.message || "خطأ في الاتصال بالخادم", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الكورس نهائياً؟")) return;
    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("تم حذف الكورس بنجاح", 'success');
        router.back();
      }
    } catch (error) { showToast("خطأ في الاتصال", "error"); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900" dir="rtl">
      <SuperAdminSidebar />

      <main className="lg:mr-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        {isLessonModalOpen ? (
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 w-full rounded-[40px] shadow-2xl overflow-hidden">
              <div className="bg-indigo-600 p-8 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Edit2 className="w-8 h-8" />
                    {editingLessonIndex !== null ? `تعديل الدرس: ${currentLesson.title}` : "إضافة درس جديد"}
                  </h3>
                  <p className="text-indigo-100/60 mt-1 font-bold">قم بتحديث محتوى الدرس والأنشطة التفاعلية</p>
                </div>
                <button onClick={() => setIsLessonModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex border-b border-slate-100 bg-slate-50">
                {[
                  { id: 'info', label: 'الأهداف والبيانات', icon: Target },
                  { id: 'scheduling', label: 'الجدولة والظهور', icon: Clock },
                  { id: 'slides', label: 'محتوى الشرح', icon: Layout },
                  { id: 'assignments', label: 'التكليفات (Assignments)', icon: FileText },
                  { id: 'exercises', label: 'التدريبات', icon: HelpCircle },
                  { id: 'attachments', label: 'المرفقات', icon: FileJson },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all ${activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-[0_4px_20px_-10px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                      }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-8 sm:p-12 overflow-y-auto max-h-[70vh] custom-scrollbar bg-white">
                {activeTab === 'info' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">عنوان الدرس</label>
                        <input
                          type="text"
                          placeholder="مثال: مقدمة في علم الفيزياء"
                          value={currentLesson.title || ""}
                          onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">رابط الفيديو (YouTube)</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="https://youtube.com/watch?v=..."
                            value={currentLesson.videoUrl || ""}
                            onChange={(e) => setCurrentLesson({ ...currentLesson, videoUrl: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all text-left pl-12 shadow-sm"
                            dir="ltr"
                          />
                          <Video className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-[35px] space-y-8">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                           <Target className="w-5 h-5 text-white" />
                        </div>
                        المعايير والمخرجات الأكاديمية
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المجال (Domain)</label>
                          <div className="flex gap-2">
                            <select
                              value={currentLesson.domain || ""}
                              onChange={(e) => {
                                if (e.target.value === "__NEW__") {
                                  const newDomain = prompt("أدخل اسم المجال الجديد (New Domain Name):");
                                  if (newDomain && newDomain.trim()) {
                                    setCurrentLesson({ ...currentLesson, domain: newDomain.trim() });
                                  }
                                } else {
                                  setCurrentLesson({ ...currentLesson, domain: e.target.value });
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm appearance-none"
                            >
                              <option value="">اختر المجال...</option>
                              {Array.from(new Set(lessons.map(l => l.domain).filter(Boolean))).map((domainName: any) => (
                                <option key={domainName} value={domainName}>{domainName}</option>
                              ))}
                              <option value="__NEW__" className="text-indigo-600 font-bold">+ إضافة مجال جديد...</option>
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
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "المعايير (Standards)" : "Standards"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsStandardDropdownOpen(!isStandardDropdownOpen);
                                setIsIndicatorDropdownOpen(false);
                                setIsOutcomeDropdownOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return language === 'ar' ? "اختر المعيار..." : "Select Standard...";
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
                                    <span>{language === 'ar' ? "+ إضافة معيار مخصص..." : "+ Add Custom Standard..."}</span>
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
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المؤشرات (Indicators)</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsIndicatorDropdownOpen(!isIndicatorDropdownOpen);
                                setIsOutcomeDropdownOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return "اختر المؤشر...";
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
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">نواتج التعلم (Outcomes)</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsOutcomeDropdownOpen(!isOutcomeDropdownOpen);
                                setIsIndicatorDropdownOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return "اختر ناتج التعلم...";
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
                          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all font-black text-xs cursor-pointer shadow-sm"
                        >
                          <Upload className="w-4 h-4" />
                          رفع المعايير من Excel
                        </button>
                        <button 
                          type="button"
                          onClick={downloadMetadataTemplate}
                          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all font-black text-xs cursor-pointer shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          تحميل نموذج Excel الاسترشادي
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'assignments' && renderSlidesBuilder('assignments')}

                {activeTab === 'scheduling' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[35px] flex items-center justify-between">
                       <div className="space-y-1">
                          <h4 className="text-xl font-black text-indigo-900">حالة ظهور الدرس</h4>
                          <p className="text-indigo-600/60 font-bold text-sm">تحكم في ما إذا كان الطالب يستطيع رؤية هذا الدرس حالياً</p>
                       </div>
                       <button 
                        onClick={() => setCurrentLesson({...currentLesson, isVisible: !currentLesson.isVisible})}
                        className={`w-20 h-10 rounded-full relative transition-all duration-300 ${currentLesson.isVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}
                       >
                          <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 ${currentLesson.isVisible ? 'right-11' : 'right-1'}`}></div>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-3 text-emerald-600">
                             <CheckCircle2 className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">تاريخ النشر (Publish Date)</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">لن يظهر الدرس للطالب قبل هذا التاريخ حتى لو كان وضع "الظهور" مفعلاً</p>
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
                             <label className="text-sm font-black uppercase tracking-widest">تاريخ الانتهاء (Cut-off Date)</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">سيختفي الدرس من واجهة الطالب تلقائياً بعد هذا التاريخ</p>
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

                {activeTab === 'exercises' && renderSlidesBuilder('questions')}

                {activeTab === 'attachments' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-black text-slate-900">الملفات المرفقة</h4>
                      <button onClick={() => setCurrentLesson({ ...currentLesson, attachments: [...(currentLesson.attachments || []), { name: "", url: "", type: "PDF" }] })} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"><Plus className="w-5 h-5" /> إضافة ملف</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(currentLesson.attachments || []).map((att: any, attIdx: number) => (
                        <div key={attIdx} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 hover:border-indigo-100 transition-all shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                            <button onClick={() => { const atts = [...currentLesson.attachments]; atts.splice(attIdx, 1); setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="text-red-500 hover:text-red-700 p-2 transition-colors"><Trash2 size={20} /></button>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">اسم الملف</label>
                            <input type="text" value={att.name} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].name = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-600" placeholder="مثال: كتاب الفيزياء الأساسي" />
                          </div>
                          <div className="flex gap-3">
                            <div className="w-32 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">النوع</label>
                              <select value={att.type} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].type = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-xs outline-none focus:border-indigo-600"><option value="PDF">PDF</option><option value="PPT">PPT</option><option value="IMAGE">IMAGE</option></select>
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 text-left" dir="ltr">URL</label>
                              <input type="text" value={att.url} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].url = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-600 text-xs outline-none text-left font-mono focus:border-indigo-600" dir="ltr" placeholder="https://..." />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setIsLessonModalOpen(false)} className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">إلغاء</button>
                <button onClick={saveLesson} className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center gap-3 transition-all">تحديث وحفظ الدرس <CheckCircle2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 transition-all"><ArrowLeft className="w-7 h-7" /></button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">تعديل الكورس</h1>
                  <p className="text-slate-400 text-lg mt-1 font-bold">تحديث محتوى وهيكل الكورس التعليمي</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDeleteCourse} className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all border border-red-100"><Trash2 size={20} /> حذف</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all">{isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}<Save className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8">
                {/* Course Settings Panel — Collapsible */}
                <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                    <span className="font-black text-slate-800 flex items-center gap-2 text-sm">
                      <Settings className="w-4 h-4 text-indigo-600" /> إعدادات الكورس
                    </span>
                    <button
                      onClick={() => setCourseSettingsCollapsed(prev => !prev)}
                      className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-1.5"
                    >
                      {courseSettingsCollapsed
                        ? <><Edit2 className="w-3 h-3" />تعديل</>
                        : <><CheckCircle2 className="w-3 h-3" />حفظ</>}
                    </button>
                  </div>

                  {courseSettingsCollapsed ? (
                    <div className="px-6 py-4 space-y-4">
                      {courseData.coverImage && (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 mb-2">
                           <img src={getFullImageUrl(courseData.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <p className="font-black text-slate-800 text-sm truncate">{courseData.title || '—'}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {courseData.grades && courseData.grades.length > 0 ? (
                            courseData.grades.map((g) => (
                              <span key={g} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-black shrink-0">
                                {getGradeName(g)}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-black">—</span>
                          )}
                          {courseData.subject && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">{courseData.subject}</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-5">
                      {/* Cover Image Upload */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">صورة الغلاف</label>
                        <div className="relative group cursor-pointer">
                          {courseData.coverImage ? (
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-400 transition-all">
                              <img src={getFullImageUrl(courseData.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                                 <button onClick={() => setCourseData({...courseData, coverImage: ""})} className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 transition-all"><Trash2 className="w-5 h-5" /></button>
                                 <label className="p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 transition-all cursor-pointer">
                                    <Upload className="w-5 h-5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (re) => {
                                          const res = re.target?.result as string;
                                          if(confirm("هل تريد اعتماد هذه الصورة كغلاف جديد؟")) {
                                             setCourseData({...courseData, coverImage: res});
                                             showToast("تم تحديث صورة الغلاف بنجاح", "success");
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }} />
                                 </label>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group cursor-pointer">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm mb-3">
                                <Upload className="w-6 h-6" />
                              </div>
                              <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600">اضغط لرفع غلاف الكورس</span>
                              <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (re) => {
                                          const res = re.target?.result as string;
                                          if(confirm("تأكيد اعتماد هذه الصورة كغلاف؟")) {
                                             setCourseData({...courseData, coverImage: res});
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }} />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">عنوان الكورس</label>
                        <input type="text" value={courseData.title} onChange={(e) => setCourseData({ ...courseData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">وصف الكورس</label>
                        <textarea value={courseData.description} onChange={(e) => setCourseData({ ...courseData, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 min-h-[100px] max-h-[250px] overflow-y-auto resize-none transition-all text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">الدولة</label>
                        <select 
                          value={courseData.country}
                          onChange={(e) => setCourseData({...courseData, country: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm appearance-none"
                        >
                          <option value="مصر">مصر</option>
                          <option value="السعودية">السعودية</option>
                          <option value="الإمارات">الإمارات</option>
                          <option value="الكويت">الكويت</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">المراحل والصفوف الدراسية</label>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          {[
                            {
                              stage: "Elementary",
                              title: language === 'ar' ? "المرحلة الابتدائية (Elementary)" : "Elementary School",
                              grades: [
                                "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
                                "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"
                              ]
                            },
                            {
                              stage: "Middle School",
                              title: language === 'ar' ? "المرحلة الإعدادية (Middle School)" : "Middle School",
                              grades: [
                                "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"
                              ]
                            },
                            {
                              stage: "High School",
                              title: language === 'ar' ? "المرحلة الثانوية (High School)" : "High School",
                              grades: [
                                "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
                              ]
                            }
                          ].map((group) => {
                            const allSelected = group.grades.every(g => courseData.grades.includes(g));
                            
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
                                        setCourseData({
                                          ...courseData,
                                          grades: courseData.grades.filter(g => !group.grades.includes(g))
                                        });
                                      } else {
                                        const newGrades = [...courseData.grades];
                                        group.grades.forEach(g => {
                                          if (!newGrades.includes(g)) newGrades.push(g);
                                        });
                                        setCourseData({
                                          ...courseData,
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
                                    <label key={g} className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${courseData.grades.includes(g) ? 'bg-indigo-50/50 border-indigo-400' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${courseData.grades.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'}`}>
                                        {courseData.grades.includes(g) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </div>
                                      <span className={`text-[11px] sm:text-xs font-bold ${courseData.grades.includes(g) ? 'text-indigo-900' : 'text-slate-600'}`}>{getGradeName(g)}</span>
                                      <input type="checkbox" className="hidden" checked={courseData.grades.includes(g)} onChange={(e) => {
                                        if(e.target.checked) setCourseData({...courseData, grades: [...courseData.grades, g]});
                                        else setCourseData({...courseData, grades: courseData.grades.filter(gr => gr !== g)});
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
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">المادة</label>
                        <input type="text" value={courseData.subject} onChange={(e) => setCourseData({ ...courseData, subject: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">إسناد الكورس (نطاق الكورس)</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                           <button 
                            type="button"
                            onClick={() => setCourseData({...courseData, isCentral: true, schoolId: "", schoolIds: []})}
                            className={`py-3 rounded-xl text-[10px] font-black transition-all ${courseData.isCentral ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                           >نطاق مركزي (كل المدارس)</button>
                           <button 
                            type="button"
                            onClick={() => setCourseData({...courseData, isCentral: false})}
                            className={`py-3 rounded-xl text-[10px] font-black transition-all ${!courseData.isCentral ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                           >تخصيص لمدرسة محددة</button>
                        </div>
                        
                        {!courseData.isCentral && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center mb-3 px-1">
                              <span className="text-xs font-bold text-slate-500">اختر المدارس المحددة:</span>
                              <button
                                type="button"
                                onClick={selectAllSchools}
                                className="text-[10px] font-black text-indigo-600 hover:underline"
                              >
                                {(courseData.schoolIds || []).length === schools.length ? "إلغاء الكل" : "تحديد كافة المدارس"}
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
                          </div>
                        )}
                      </div>

                      <button onClick={() => setCourseSettingsCollapsed(true)} className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> حفظ الإعدادات
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                {/* Content Navigation Tabs */}
                <div className="bg-white p-2 rounded-[30px] border border-slate-100 shadow-sm flex gap-2">
                   {[
                     { id: 'lessons', label: 'الدروس والمحاضرات', icon: Layers, color: 'indigo' },
                     { id: 'quizzes', label: 'الاختبارات القصيرة', icon: HelpCircle, color: 'orange' },
                     { id: 'assignments', label: 'التكليفات والمهام', icon: FileText, color: 'emerald' },
                   ].map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveContentTab(tab.id as any)}
                       className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all ${
                         activeContentTab === tab.id 
                         ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-600/20` 
                         : 'text-slate-400 hover:bg-slate-50'
                       }`}
                     >
                       <tab.icon className="w-5 h-5" />
                       {tab.label}
                     </button>
                   ))}
                </div>

                <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                    {activeContentTab === 'lessons' && <><Layers className="w-8 h-8 text-indigo-600" /> الدروس والمحاضرات</>}
                    {activeContentTab === 'quizzes' && <><HelpCircle className="w-8 h-8 text-orange-500" /> الاختبارات والتقييمات</>}
                    {activeContentTab === 'assignments' && <><FileText className="w-8 h-8 text-emerald-500" /> التكليفات الدراسية</>}
                  </h3>
                  <button 
                    onClick={() => {
                      if (activeContentTab === 'lessons') openAddLessonModal();
                      else showToast("سيتم تفعيل إنشاء الاختبارات/التكليفات قريباً", "info");
                    }} 
                    className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl text-white ${
                      activeContentTab === 'lessons' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' :
                      activeContentTab === 'quizzes' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' :
                      'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    }`}
                  >
                    <Plus size={24} /> 
                    إضافة {activeContentTab === 'lessons' ? 'درس' : activeContentTab === 'quizzes' ? 'اختبار' : 'تكليف'}
                  </button>
                  {activeContentTab !== 'lessons' && (
                    <button 
                      onClick={openBankModal}
                      className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-200 transition-all border border-slate-200"
                    >
                      <Layers className="w-5 h-5" />
                      ربط من البنك المركزي
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {activeContentTab === 'lessons' ? (
                    lessons.length === 0 ? (
                      <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <p className="font-black text-xl">لا يوجد دروس في هذا الكورس بعد</p>
                        <button onClick={openAddLessonModal} className="text-indigo-600 font-bold hover:underline">أضف درسك الأول الآن</button>
                      </div>
                    ) : (
                      lessons.map((lesson, index) => (
                        <div key={index} className="bg-white border border-slate-100 rounded-[30px] p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                          
                          <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100 shadow-inner group-hover:scale-105 transition-all shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h3 className="font-black text-slate-900 text-xl truncate group-hover:text-indigo-600 transition-colors">
                                {lesson.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${lesson.isVisible ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                    {lesson.isVisible ? <Eye className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    {lesson.isVisible ? 'مرئي للطلاب' : 'مخفي عن الطلاب'}
                                </div>
                                {lesson.publishDate && (
                                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                                      <Clock className="w-3 h-3" />
                                      مجدول: {new Date(lesson.publishDate).toLocaleDateString('ar-EG')}
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                                    <Monitor className="w-3 h-3" />
                                    {lesson.slides?.length || 0} شرائح
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block"></div>
                            <button 
                              onClick={() => window.open(`/lessons/${lesson.id}?preview=true`, '_blank')} 
                              className="flex items-center gap-2 bg-slate-50 text-slate-400 px-5 py-3 rounded-2xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all border border-slate-100"
                              title="معاينة الدرس"
                            >
                              <Eye size={18} />
                              معاينة
                            </button>
                            <button 
                              onClick={() => openEditLessonModal(index)} 
                              className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                            >
                              <Edit2 size={18} />
                              تعديل
                            </button>
                            <button 
                              onClick={() => handleRemoveLesson(index)} 
                              className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-50"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    <div className="bg-white border border-slate-100 rounded-[40px] p-12 flex flex-col items-center justify-center text-center gap-6">
                       <div className={`w-24 h-24 rounded-[35px] flex items-center justify-center ${activeContentTab === 'quizzes' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {activeContentTab === 'quizzes' ? <HelpCircle className="w-12 h-12" /> : <FileText className="w-12 h-12" />}
                       </div>
                       <div>
                         <h4 className="text-2xl font-black text-slate-900 mb-2">
                           {activeContentTab === 'quizzes' ? 'إدارة الاختبارات' : 'إدارة التكليفات'}
                         </h4>
                         <p className="text-slate-400 font-bold max-w-md">
                           يمكنك ربط هذا الكورس بأسئلة من بنك الأسئلة المركزي وتعيينها كـ {activeContentTab === 'quizzes' ? 'اختبارات' : 'تكليفات'} للطلاب.
                         </p>
                       </div>
                       
                       <div className="w-full max-w-2xl space-y-3">
                          {exams.filter(e => activeContentTab === 'quizzes' ? e.type !== 'ASSIGNMENT' : e.type === 'ASSIGNMENT').length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-bold">
                               لا يوجد {activeContentTab === 'quizzes' ? 'اختبارات' : 'تكليفات'} مرتبطة بهذا الكورس حالياً.
                            </div>
                          ) : (
                            exams.filter(e => activeContentTab === 'quizzes' ? e.type !== 'ASSIGNMENT' : e.type === 'ASSIGNMENT').map((exam, idx) => (
                              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 font-black border border-slate-100">
                                       {idx + 1}
                                    </div>
                                    <div className="text-right">
                                       <div className="font-black text-slate-900">{exam.title}</div>
                                       <div className="text-[10px] text-slate-400 font-bold flex gap-2">
                                          <span>{exam._count?.questions || 0} سؤال</span>
                                          <span>•</span>
                                          <span>{exam.duration} دقيقة</span>
                                       </div>
                                    </div>
                                 </div>
                                 <button className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={16} /></button>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exam Bank Modal (Quizzes/Assignments) */}
        {isBankModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">بنك الأسئلة المركزي</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1">اختر المحتوى الذي ترغب في ربطه بهذا الكورس</p>
                  </div>
                  <button onClick={() => setIsBankModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                      <X size={24} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                  {bankItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold">لا توجد عناصر متاحة في البنك المركزي حالياً.</div>
                  ) : (
                    bankItems.map((item) => (
                      <div key={item.id} className="p-5 border border-slate-100 rounded-3xl flex items-center justify-between hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'ASSIGNMENT' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                                {item.type === 'ASSIGNMENT' ? <FileText size={20} /> : <HelpCircle size={20} />}
                            </div>
                            <div className="text-right">
                                <div className="font-black text-slate-900">{item.title}</div>
                                <div className="text-[10px] text-slate-400 font-bold mt-1 flex gap-3">
                                  <span>{item.type === 'ASSIGNMENT' ? 'تكليف' : 'اختبار'}</span>
                                  <span>•</span>
                                  <span>{item._count?.questions || 0} سؤال</span>
                                </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              linkExamToCourse(item.id);
                              setIsBankModalOpen(false);
                            }}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            ربط الآن
                          </button>
                      </div>
                    ))
                  )}
                </div>
            </div>
          </div>
        )}

        {/* Question Bank Modal (For Lessons) */}
        {isQuestionBankModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-orange-50/50">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">بنك الأسئلة المركزي</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1">اختر الأسئلة التي ترغب في إضافتها لهذا الدرس</p>
                  </div>
                  <button onClick={() => setIsQuestionBankModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                      <X size={24} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                  {bankQuestions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold">لا توجد أسئلة متاحة في البنك المركزي حالياً.</div>
                  ) : (
                    bankQuestions.map((q, idx) => (
                      <div key={idx} className="p-6 border border-slate-100 rounded-3xl flex flex-col gap-4 hover:border-orange-200 hover:bg-orange-50/20 transition-all group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="text-right flex-1">
                                <div className="text-[10px] text-orange-500 font-black uppercase mb-1">{q.exam?.title || 'بنك الأسئلة'}</div>
                                <div className="font-black text-slate-900 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }}></div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{q.type === 'MCQ' ? 'اختيار من متعدد' : q.type}</span>
                                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{q.level}</span>
                                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{q.points} نقاط</span>
                                </div>
                            </div>
                            <button 
                              onClick={() => addQuestionFromBank(q)}
                              className="shrink-0 w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                            >
                                <Plus size={24} />
                            </button>
                          </div>
                      </div>
                    ))
                  )}
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



