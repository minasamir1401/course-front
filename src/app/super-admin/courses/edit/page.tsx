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
  const [isQuestionStandardOpen, setIsQuestionStandardOpen] = useState(false);
  const [isQuestionIndicatorOpen, setIsQuestionIndicatorOpen] = useState(false);
  const [isQuestionOutcomeOpen, setIsQuestionOutcomeOpen] = useState(false);
  const [questionSource, setQuestionSource] = useState<'assignments' | 'questions'>('questions');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [tempQuestion, setTempQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "General", level: "Medium",
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
          schoolIds: (data.schools && data.schools.length > 0) ? data.schools.map((s: any) => s.id) : (data.schoolId ? [data.schoolId] : [])
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
        "Easy",
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
        "Easy", "", ""
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
        "Medium", "", ""
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
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-6 bg-white border border-slate-200 rounded-[30px] shadow-sm mb-4">
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

    setCurrentLesson({ ...currentLesson, [source]: newList });
    setShowQuestionForm(false);
    setEditingQuestionIndex(null);
    showToast(language === 'ar' ? "تم حفظ السؤال في القائمة بنجاح" : "Question saved to list successfully", "success");
  };

  const removeQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    const newList = [...(currentLesson[source] || [])];
    newList.splice(index, 1);
    setCurrentLesson({ ...currentLesson, [source]: newList });
    showToast(language === 'ar' ? "تم حذف السؤال" : "Question deleted", "info");
  };

  const moveQuestionForSource = (source: 'assignments' | 'questions', index: number, direction: 'UP' | 'DOWN') => {
    const newList = [...(currentLesson[source] || [])];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setCurrentLesson({ ...currentLesson, [source]: newList });
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
                          setCurrentLesson({ ...currentLesson, [lessonField]: newList.join("\n") });
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
                          setCurrentLesson({ ...currentLesson, [lessonField]: newList.join("\n") });
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
                      setCurrentLesson({ ...currentLesson, [lessonField]: newList.join("\n") });
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
                            {q.level || "Medium"} • {q.points || 1} {language === 'ar' ? 'درجة' : 'pts'}
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
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'خيارات الإجابة:' : 'Options & Correct Answer:'}</h5>
                              <div className="space-y-2">
                                {(q.options || []).filter(Boolean).map((opt: string, oIdx: number) => {
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <SuperAdminSidebar />

      <main className={`${language === 'ar' ? 'lg:mr-72' : 'lg:ml-72'} p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8`}>
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

                {activeTab === 'assignments' && renderQuestionsBuilder('assignments')}

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

                {activeTab === 'exercises' && renderQuestionsBuilder('questions')}

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
                            Array.from(new Set(courseData.grades)).map((g, index) => (
                              <span key={`${g}-${index}`} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-black shrink-0">
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
                                      <span className={`text-[11px] sm:text-xs font-bold ${courseData.grades.includes(g) ? 'text-indigo-900' : 'text-slate-600'}`}>{getGradeCheckboxLabel(g)}</span>
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



