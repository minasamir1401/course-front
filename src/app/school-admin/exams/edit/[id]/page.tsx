"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Save, Plus, Trash2, Image as ImageIcon, CheckCircle, HelpCircle, 
  ArrowRight, Settings, ListPlus, Globe, Layout, Loader2, 
  Clock, Lock, Calendar, Eye, EyeOff, FileText, AlertCircle, BookOpen, ChevronLeft,
  ChevronDown, ChevronUp, Edit3, Play, X, CheckCircle2, Target,
  Edit2, Sparkles, MessageSquare, Info, Upload, Download
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Suspense } from "react";
import { useNotification } from "@/context/NotificationContext";
import RichTextEditor from "@/components/RichTextEditor";
import * as XLSX from 'xlsx';
import VideoPlayer from "@/components/VideoPlayer";


export default function SchoolAdminEditExamPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-400">
           <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="font-black text-2xl animate-pulse">جاري التحميل...</p>
        </div>
      </DashboardLayout>
    }>
      <SchoolAdminEditExamPageContent />
    </Suspense>
  );
}

function SchoolAdminEditExamPageContent() {
    const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('courseId');
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  // UI States
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const [examInfo, setExamInfo] = useState<any>({
    title: "",
    description: "",
    category: "اللغة العربية",
    type: "Exam",
    duration: 60,
    passingScore: 50,
    isCentral: false,
    showAnswers: true,
    resultVisibility: "SHOW_ANSWERS",
    password: "",
    startDate: "",
    endDate: "",
    attemptsAllowed: 1,
    status: "PUBLISHED",
    grade: "الصف الأول الثانوي",
    skill: "Math",
    level: "Medium",
  });

  const [questions, setQuestions] = useState<any[]>([]);

  const [customLearningOutcomes, setCustomLearningOutcomes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("custom_learning_outcomes_exams");
      return saved ? JSON.parse(saved) : [
        "مخرج 1: فهم واستيعاب المقروء",
        "مخرج 2: التعبير بدقة ووضوح",
        "مخرج 3: تطبيق القواعد النحوية",
        "مخرج 4: ربط المفاهيم الرياضية",
        "مخرج 5: استنتاج الحلول للمسائل"
      ];
    }
    return [
      "مخرج 1: فهم واستيعاب المقروء",
      "مخرج 2: التعبير بدقة ووضوح",
      "مخرج 3: تطبيق القواعد النحوية",
      "مخرج 4: ربط المفاهيم الرياضية",
      "مخرج 5: استنتاج الحلول للمسائل"
    ];
  });

  const [customStandards, setCustomStandards] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("custom_standards_exams");
      return saved ? JSON.parse(saved) : [
        "معيار 1: الفهم والاستيعاب",
        "معيار 2: التطبيق والتحليل",
        "معيار 3: الاستنتاج والتقييم",
        "معيار 4: التفكير النقدي",
        "معيار 5: حل المشكلات"
      ];
    }
    return [
      "معيار 1: الفهم والاستيعاب",
      "معيار 2: التطبيق والتحليل",
      "معيار 3: الاستنتاج والتقييم",
      "معيار 4: التفكير النقدي",
      "معيار 5: حل المشكلات"
    ];
  });

  const [customIndicators, setCustomIndicators] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("custom_indicators_exams");
      return saved ? JSON.parse(saved) : [
        "مؤشر 1.1: الاستماع النشط والفهم",
        "مؤشر 2.1: تحليل الأفكار الرئيسية",
        "مؤشر 3.1: تطبيق المبادئ العلمية",
        "مؤشر 4.1: تركيب الجمل والفقرات",
        "مؤشر 5.1: استخلاص النتائج بدقة"
      ];
    }
    return [
      "مؤشر 1.1: الاستماع النشط والفهم",
      "مؤشر 2.1: تحليل الأفكار الرئيسية",
      "مؤشر 3.1: تطبيق المبادئ العلمية",
      "مؤشر 4.1: تركيب الجمل والفقرات",
      "مؤشر 5.1: استخلاص النتائج بدقة"
    ];
  });

  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [isIndicatorOpen, setIsIndicatorOpen] = useState(false);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const questionsExcelRef = useRef<HTMLInputElement>(null);

  const [currentQuestion, setCurrentQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "Math", level: "Medium",
    standard: "",
    indicator: "",
    learningOutcome: "",
    videoUrl: "",
    sections: [{ type: "EXPLANATION", content: "" }], imageUrl: "", correctAnswers: [],
  });

  const CATEGORIES = [
    "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
    "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
    "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
    "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
    "SAT Math", "SAT English"
  ];
  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];
  const QUESTION_TYPES = [
    { id: "MCQ", label: "اختيار من متعدد (MCQ)", desc: "اختر إجابة واحدة صحيحة" },
    { id: "TRUE_FALSE", label: "صح وخطأ", desc: "حدد إذا كانت العبارة صحيحة أم خاطئة" },
    { id: "MULTI_SELECT", label: "اختيار متعدد", desc: "اختر جميع الإجابات الصحيحة" },
    { id: "TEXT", label: "شريحة نصية (محتوى فقط)", desc: "عرض شريحة محتوى بدون تقييم" }
  ];

  const SECTION_STYLE_PRESETS: Record<string, {
    icon: any;
    label: string;
    container: string;
    badge: string;
  }> = {
    HINT: {
      icon: HelpCircle,
      label: "تلميح (Hint)",
      container: "bg-yellow-50/70 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
    },
    TIP: {
      icon: Info,
      label: "نصيحة (Tip)",
      container: "bg-sky-50/70 border-sky-200",
      badge: "bg-sky-100 text-sky-700",
    },
    WARNING: {
      icon: AlertCircle,
      label: "تحذير (Warning)",
      container: "bg-rose-50/70 border-rose-200",
      badge: "bg-rose-100 text-rose-700",
    },
    KEY_INSIGHT: {
      icon: Sparkles,
      label: "فكرة رئيسية (Key Insight)",
      container: "bg-indigo-50/70 border-indigo-200",
      badge: "bg-indigo-100 text-indigo-700",
    },
    FEEDBACK: {
      icon: MessageSquare,
      label: "تغذية راجعة (Feedback)",
      container: "bg-emerald-50/70 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
    },
    EXPLANATION: {
      icon: BookOpen,
      label: "شرح تفصيلي (Explanation)",
      container: "bg-amber-50/70 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
    },
  };

    const SKILLS = language === 'ar' ? [
    "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
    "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
    "الحاسب الآلي", "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
    "التربية الدينية", "التربية الوطنية", "SAT Reading", "SAT Writing"
  ] : [
    "Math", "Physics", "Chemistry", "Biology", "Geology", "Mechanics",
    "History", "Geography", "Philosophy", "Psychology", "Economics", "Statistics",
    "Computer Science", "Arabic", "English", "French", "German", "Italian",
    "Religious Education", "National Education", "SAT Reading", "SAT Writing"
  ];

  const VISIBILITY_OPTIONS = [
    { id: "SHOW_SCORE", label: "الدرجة فقط", desc: "سيرى الطالب مجموع درجاته فقط", icon: Eye },
    { id: "SHOW_ANSWERS", label: "الإجابات الصحيحة", desc: "سيتمكن الطالب من مراجعة كل إجابة مع النموذج الصحيح", icon: CheckCircle },
    { id: "SHOW_MARK_ONLY", label: "الصح والغلط", desc: "سيرى الطالب إذا كانت إجابته صحيحة أم خاطئة بدون معرفة النموذج الصحيح", icon: HelpCircle },
    { id: "HIDE_ALL", label: "إخفاء النتائج بالكامل", desc: "لن تظهر أي نتائج حتى تقوم بتغيير هذه السياسة", icon: EyeOff },
  ];


  useEffect(() => {
    localStorage.setItem("custom_standards_exams", JSON.stringify(customStandards));
  }, [customStandards]);

  useEffect(() => {
    localStorage.setItem("custom_indicators_exams", JSON.stringify(customIndicators));
  }, [customIndicators]);

  useEffect(() => {
    localStorage.setItem("custom_learning_outcomes_exams", JSON.stringify(customLearningOutcomes));
  }, [customLearningOutcomes]);


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
        text: qText,
        type: qType,
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
          showToast("لم يتم العثور على أسئلة صالحة في الملف", "error");
          return;
        }

        const newStds = Array.from(new Set(parsed.map(q => q.standard).filter(Boolean)));
        const newInds = Array.from(new Set(parsed.map(q => q.indicator).filter(Boolean)));
        const newLos = Array.from(new Set(parsed.map(q => q.learningOutcome).filter(Boolean)));

        setCustomStandards(prev => Array.from(new Set([...prev, ...newStds])));
        setCustomIndicators(prev => Array.from(new Set([...prev, ...newInds])));
        setCustomLearningOutcomes(prev => Array.from(new Set([...prev, ...newLos])));

        setQuestions(prev => [...prev, ...parsed]);

        showToast(`تم استيراد ${parsed.length} سؤال بنجاح`, "success");
      } catch (err) {
        console.error(err);
        showToast("حدث خطأ أثناء قراءة ملف Excel", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const downloadQuestionsTemplate = () => {
    const wsData = [
      [
        "Question Text",
        "Question Type",
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4",
        "Option 5",
        "Correct Answer",
        "Correct Answers",
        "Points",
        "Skill",
        "Standard",
        "Indicator",
        "Learning Outcome",
        "Difficulty Level",
        "Video URL",
        "Explanation"
      ],
      [
        "ما هو ناتج 5 + 5؟",
        "MCQ",
        "8", "9", "10", "11", "",
        "10", "", "1", "Math",
        "المعيار 1: العمليات الحسابية",
        "المؤشر 1.1: الجمع",
        "أن يجمع الطالب الأعداد بشكل صحيح",
        "Easy",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "الجمع الصحيح هو 10 لأن 5 زائد 5 يساوي 10"
      ],
      [
        "الأرض كروية الشكل.",
        "TRUE_FALSE",
        "", "", "", "", "",
        "صحيح", "", "1", "General",
        "المعيار 2: الجغرافيا الطبيعية",
        "المؤشر 2.1: شكل الأرض",
        "أن يدرك شكل كوكب الأرض",
        "Easy", "", ""
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions Template");
    XLSX.writeFile(wb, "exams_questions_template.xlsx");
    showToast("تم تحميل نموذج الأسئلة بنجاح", "success");
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
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("school_admin_token");
      
      const res = await fetch(`${API_URL}/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setExamInfo({
          ...data,
          grade: data.grade || "الصف الأول الثانوي",
          category: data.category || "اللغة العربية",
          resultVisibility: data.resultVisibility || "SHOW_ANSWERS",
          attemptsAllowed: data.attemptsAllowed || 1,
          skill: data.skill || "Math",
          level: data.level || "Medium",
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "",
        });
        setQuestions(data.questions?.map((q: any) => {
          let parsedOptions = [];
          try {
            parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
          } catch (e) {
            console.error("Failed to parse options", e);
          }
          return {
            ...q,
            options: Array.isArray(parsedOptions) ? parsedOptions : []
          };
        }) || []);
      }
    } catch (e) {
      console.error(e);
      showToast("خطأ في الاتصال بالسيرفر", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = (type: string = 'MCQ') => {
    setCurrentQuestion({
      text: "", type, options: type === 'TRUE_FALSE' ? ["صحيح", "خطأ", "", ""] : ["", "", "", ""],
      correctAnswer: "", points: type === 'TEXT' ? 0 : 1, skill: "Math", level: "Medium",
      standard: "",
      indicator: "",
      learningOutcome: "",
      videoUrl: "",
      sections: [{ type: "EXPLANATION", content: "" }], imageUrl: "", correctAnswers: [],
    });
    setEditingIndex(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (index: number) => {
    const q = questions[index];
    let parsedSections = [];
    try {
      const parsed = typeof q.explanation === 'string' ? JSON.parse(q.explanation) : (q.sections || []);
      if (Array.isArray(parsed)) {
        parsedSections = parsed.map((item: any) => {
          if (typeof item === 'string') {
            return { type: 'EXPLANATION', content: item };
          }
          return item;
        });
      } else {
        parsedSections = [{ type: 'EXPLANATION', content: q.explanation || "" }];
      }
    } catch (e) {
      parsedSections = [{ type: 'EXPLANATION', content: q.explanation || "" }];
    }

    setCurrentQuestion({ 
      ...q,
      sections: parsedSections.length > 0 ? parsedSections : [{ type: "EXPLANATION", content: "" }]
    });
    setEditingIndex(index);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion.text) {
      showToast("يرجى إدخال نص السؤال أو المحتوى", "error");
      return;
    }
    
    if (editingIndex !== null) {
      const newQuestions = [...questions];
      newQuestions[editingIndex] = currentQuestion;
      setQuestions(newQuestions);
    } else {
      setQuestions([...questions, currentQuestion]);
    }
    
    setShowQuestionForm(false);
    setEditingIndex(null);
  };

  const addSection = (type: string) => {
    const sections = [...(currentQuestion.sections || [])];
    sections.push({ type, content: "" });
    setCurrentQuestion({ ...currentQuestion, sections });
  };

  const removeSection = (index: number) => {
    const sections = [...(currentQuestion.sections || [])];
    sections.splice(index, 1);
    setCurrentQuestion({ ...currentQuestion, sections });
  };

  const updateSectionContent = (index: number, content: string) => {
    const sections = [...(currentQuestion.sections || [])];
    sections[index].content = content;
    setCurrentQuestion({ ...currentQuestion, sections });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const updateCurrentQuestion = (field: string, value: any) => {
    setCurrentQuestion({ ...currentQuestion, [field]: value });
  };

  const updateOption = (oIndex: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[oIndex] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const updateCorrectAnswers = (optionIndex: number) => {
    const question = { ...currentQuestion };
    
    if (question.type === "TRUE_FALSE") {
      question.correctAnswer = optionIndex === 0 ? "صحيح" : "خطأ";
    } else if (question.type === "MULTI_SELECT") {
      const option = question.options[optionIndex];
      if (!question.correctAnswers) question.correctAnswers = [];
      if (question.correctAnswers.includes(option)) {
        question.correctAnswers = question.correctAnswers.filter((a: string) => a !== option);
      } else {
        question.correctAnswers.push(option);
      }
    } else {
      question.correctAnswer = question.options[optionIndex];
    }
    
    setCurrentQuestion(question);
  };

  const isCorrectAnswer = (question: any, option: string) => {
    if (question.type === "MULTI_SELECT") {
      return question.correctAnswers?.includes(option);
    }
    return question.correctAnswer === option;
  };

    // Auto-save interval
  useEffect(() => {
    if (!isAutoSaveEnabled) return;
    
    const interval = setInterval(() => {
      handleSubmit(null, true);
    }, 60000);

    return () => clearInterval(interval);
  }, [isAutoSaveEnabled, examInfo, questions]);

  const handleSubmit = async (statusOverride: string | null = null, isAutoSave = false) => {
    if (!examInfo.title) {
      showToast("يرجى إدخال عنوان الامتحان", 'error');
      return;
    }

    if (questions.length === 0) {
      showToast("يرجى إضافة سؤال واحد على الأقل", 'error');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("school_admin_token");
      const questionsPayload = questions.map(q => ({
        ...q,
        explanation: JSON.stringify(q.sections || [])
      }));

      const res = await fetch(`${API_URL}/exams/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          ...examInfo, 
          status: statusOverride || examInfo.status,
          questions: questionsPayload 
        }),
      });

      if (res.ok) {
        showToast("تم تحديث الامتحان بنجاح!", 'success');
        router.push("/school-admin/exams");
      } else {
        const err = await res.json();
        showToast(err.error || "خطأ في التحديث", 'error');
      }
    } catch (error) {
      showToast("حدث خطأ غير متوقع", 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-400">
         <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
         <p className="font-black text-2xl animate-pulse">جاري تحميل بيانات الامتحان...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto flex flex-col gap-10 pb-20 rtl" dir="rtl">
        {/* Command Center Header */}
        <div className="bg-[#1a1a2e] p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden border border-white/5">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-right">
              <div className="flex items-center gap-4 justify-center lg:justify-start mb-4">
                <button 
                  onClick={() => router.back()}
                  className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-white mr-2"
                >
                  <ChevronLeft className="w-6 h-6 rotate-180" />
                </button>
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                  <Settings className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  تعديل الامتحان المدرسي
                </h2>
              </div>
              <p className="text-indigo-200/60 mt-2 text-lg font-medium max-w-2xl leading-relaxed">
                أنت الآن تقوم بتحديث " {examInfo.title} ". تأكد من مراجعة كافة الإعدادات والأسئلة بدقة.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-center">
              <button 
                onClick={() => handleSubmit("DRAFT")}
                disabled={saving}
                className="px-8 py-5 rounded-2xl font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                تحويل لمسودة
                <FileText className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => handleSubmit()}
                disabled={saving}
                className="px-10 py-5 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                <Save className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] -mr-64 -mt-64"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-8">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg border-b border-slate-50 pb-6">
                <Settings className="w-6 h-6 text-indigo-600" />
                إعدادات الاختبار
              </h3>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المادة / الفئة</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                    value={examInfo.category}
                    onChange={(e) => setExamInfo({...examInfo, category: e.target.value})}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المرحلة</label>
                    <select 
                      className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-3 outline-none font-bold text-white text-sm focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                      value={examInfo.grade}
                      onChange={(e) => setExamInfo({...examInfo, grade: e.target.value})}
                    >
                      {GRADES.map(g => <option key={g} value={g} className="bg-[#0a0a14] text-white">{g}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المدة (دقيقة)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                        value={examInfo.duration}
                        onChange={(e) => setExamInfo({...examInfo, duration: parseInt(e.target.value)})}
                      />
                      <Clock className="w-4 h-4 text-slate-300 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">كلمة السر (اختياري)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="كلمة سر فتح الامتحان"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                      value={examInfo.password}
                      onChange={(e) => setExamInfo({...examInfo, password: e.target.value})}
                    />
                    <Lock className="w-4 h-4 text-slate-300 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المهارة</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-700 text-sm appearance-none"
                    value={examInfo.skill}
                    onChange={(e) => setExamInfo({...examInfo, skill: e.target.value})}
                  >
                    {SKILLS.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Scheduling Card */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-8">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg border-b border-slate-50 pb-6">
                <Calendar className="w-6 h-6 text-indigo-600" />
                الموعد والمحاولات
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">تاريخ البدء</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      value={examInfo.startDate}
                      onChange={(e) => setExamInfo({...examInfo, startDate: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">تاريخ الانتهاء</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      value={examInfo.endDate}
                      onChange={(e) => setExamInfo({...examInfo, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">عدد المحاولات</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                    value={examInfo.attemptsAllowed}
                    onChange={(e) => setExamInfo({...examInfo, attemptsAllowed: parseInt(e.target.value)})}
                  >
                    <option value={1}>محاولة واحدة فقط</option>
                    <option value={2}>محاولتين</option>
                    <option value={3}>3 محاولات</option>
                    <option value={999}>غير محدود</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-8">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg border-b border-slate-50 pb-6">
                <Eye className="w-6 h-6 text-indigo-600" />
                ظهور النتائج للطلاب
              </h3>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">اختر سياسة النتائج</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                  value={examInfo.resultVisibility}
                  onChange={(e) => setExamInfo({...examInfo, resultVisibility: e.target.value})}
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="text-slate-700">{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs font-bold text-slate-400 mt-2">
                  {VISIBILITY_OPTIONS.find(opt => opt.id === examInfo.resultVisibility)?.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Questions Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
               <label className="text-sm font-black text-slate-400 mb-3 block uppercase tracking-widest">عنوان الامتحان المدرسي</label>
               <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-[25px] px-8 py-6 text-2xl md:text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all text-slate-800"
                placeholder="أدخل عنوان الامتحان هنا..."
                value={examInfo.title || ""}
                onChange={(e) => setExamInfo({...examInfo, title: e.target.value})}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-slate-800">شرائح الامتحان ({questions.length})</h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                  {questions.reduce((sum, q) => sum + (q.points || 0), 0)} نقطة إجمالية
                </span>
              </div>
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <input 
                  type="file" 
                  ref={questionsExcelRef} 
                  style={{ display: 'none' }} 
                  accept=".xlsx,.xls" 
                  onChange={handleQuestionsExcelChange} 
                />
                <button 
                  onClick={() => questionsExcelRef.current?.click()}
                  className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm border border-emerald-200 whitespace-nowrap shrink-0 cursor-pointer text-xs"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>استيراد Excel</span>
                </button>
                <button 
                  onClick={downloadQuestionsTemplate}
                  className="flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm border border-sky-200 whitespace-nowrap shrink-0 cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>تحميل نموذج</span>
                </button>
                <button 
                  onClick={() => handleAddQuestion('TEXT')}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>شريحة نصية</span>
                </button>
                <button 
                  onClick={() => handleAddQuestion('MCQ')}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap shrink-0 cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4 shrink-0 text-white" />
                  <span>شريحة سؤال</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {questions.length === 0 && !showQuestionForm && (
                <div className="bg-white rounded-[40px] border-4 border-dashed border-slate-100 p-20 flex flex-col items-center justify-center text-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-[35px] flex items-center justify-center text-slate-200">
                    <HelpCircle className="w-12 h-12" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 mb-2">لا توجد شرائح بعد</h4>
                    <p className="text-slate-400 font-medium max-w-sm">ابدأ بإضافة أول شريحة نصية أو سؤال لامتحانك الآن لتظهر لك هنا.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAddQuestion('TEXT')}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-800 px-10 py-5 rounded-3xl font-black hover:scale-105 transition-all shadow-md border border-slate-200 whitespace-nowrap shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-6 h-6 shrink-0 text-slate-600" />
                      <span>إضافة شريحة نصية</span>
                    </button>
                    <button 
                      onClick={() => handleAddQuestion('MCQ')}
                      className="bg-[#0f0f1d] hover:bg-[#16162a] text-white px-10 py-5 rounded-3xl font-black hover:scale-105 transition-all shadow-2xl whitespace-nowrap shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-6 h-6 shrink-0 text-indigo-400" />
                      <span>إضافة شريحة سؤال</span>
                    </button>
                  </div>
                </div>
              )}

              {showQuestionForm && (
                <div className="bg-white rounded-[40px] border-2 border-indigo-500 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center">
                    <h4 className="text-white font-black flex items-center gap-3">
                      <Edit3 className="w-5 h-5" />
                      {editingIndex !== null ? `تعديل الشريحة / السؤال رقم ${editingIndex + 1}` : "إضافة شريحة / سؤال جديد"}
                    </h4>
                    <button 
                      onClick={() => setShowQuestionForm(false)}
                      className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-8 md:p-12 space-y-8">
                    {/* شبكة البيانات الوصفية الموحدة */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border border-slate-200 rounded-[30px] shadow-sm mb-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نوع الشريحة</label>
                        <select 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                          value={currentQuestion.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const updated = { ...currentQuestion, type: newType };
                            if (newType === "TRUE_FALSE") {
                              updated.options = ["صحيح", "خطأ", "", ""];
                            } else if (currentQuestion.type === "TRUE_FALSE") {
                              updated.options = ["", "", "", ""];
                            }
                            if (newType === "TEXT") {
                              updated.points = 0;
                            }
                            setCurrentQuestion(updated);
                          }}
                        >
                          {QUESTION_TYPES.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* المعيار المخصص مع التعديل والحذف */}
                      <div className="flex flex-col gap-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المعيار</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsStandardOpen(!isStandardOpen);
                            setIsIndicatorOpen(false);
                            setIsOutcomeOpen(false);
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold text-xs outline-none text-right flex justify-between items-center cursor-pointer min-h-[34px]"
                        >
                          <span className="truncate">{currentQuestion.standard || "اختر المعيار..."}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        
                        {isStandardOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsStandardOpen(false)}></div>
                            <div className="absolute top-full right-0 z-50 w-72 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                              {customStandards.map((opt) => (
                                <div key={opt} className="flex items-center justify-between gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl transition-all">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateCurrentQuestion("standard", opt);
                                      setIsStandardOpen(false);
                                    }}
                                    className="flex-1 text-right font-bold text-slate-700 text-xs truncate"
                                  >
                                    {opt}
                                  </button>
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newVal = prompt("تعديل المعيار المخصص:", opt);
                                        if (newVal !== null && newVal.trim()) {
                                          setCustomStandards(prev => prev.map(x => x === opt ? newVal.trim() : x));
                                          if (currentQuestion.standard === opt) {
                                            updateCurrentQuestion("standard", newVal.trim());
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
                                        setCustomStandards(prev => prev.filter(x => x !== opt));
                                        if (currentQuestion.standard === opt) {
                                          updateCurrentQuestion("standard", "");
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
                                  const newVal = prompt("أدخل المعيار المخصص الجديد:");
                                  if (newVal && newVal.trim()) {
                                    setCustomStandards(prev => [...prev, newVal.trim()]);
                                    updateCurrentQuestion("standard", newVal.trim());
                                    setIsStandardOpen(false);
                                  }
                                }}
                                className="w-full text-center py-2 text-indigo-600 font-black text-xs hover:bg-indigo-50 border-t border-dashed border-slate-100 rounded-b-xl flex items-center justify-center gap-1 mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ إضافة معيار مخصص</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* المؤشر المخصص مع التعديل والحذف */}
                      <div className="flex flex-col gap-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المؤشر</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsIndicatorOpen(!isIndicatorOpen);
                            setIsStandardOpen(false);
                            setIsOutcomeOpen(false);
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold text-xs outline-none text-right flex justify-between items-center cursor-pointer min-h-[34px]"
                        >
                          <span className="truncate">{currentQuestion.indicator || "اختر المؤشر..."}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        
                        {isIndicatorOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsIndicatorOpen(false)}></div>
                            <div className="absolute top-full right-0 z-50 w-72 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                              {customIndicators.map((opt) => (
                                <div key={opt} className="flex items-center justify-between gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl transition-all">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateCurrentQuestion("indicator", opt);
                                      setIsIndicatorOpen(false);
                                    }}
                                    className="flex-1 text-right font-bold text-slate-700 text-xs truncate"
                                  >
                                    {opt}
                                  </button>
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newVal = prompt("تعديل المؤشر المخصص:", opt);
                                        if (newVal !== null && newVal.trim()) {
                                          setCustomIndicators(prev => prev.map(x => x === opt ? newVal.trim() : x));
                                          if (currentQuestion.indicator === opt) {
                                            updateCurrentQuestion("indicator", newVal.trim());
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
                                        setCustomIndicators(prev => prev.filter(x => x !== opt));
                                        if (currentQuestion.indicator === opt) {
                                          updateCurrentQuestion("indicator", "");
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
                                  const newVal = prompt("أدخل المؤشر المخصص الجديد:");
                                  if (newVal && newVal.trim()) {
                                    setCustomIndicators(prev => [...prev, newVal.trim()]);
                                    updateCurrentQuestion("indicator", newVal.trim());
                                    setIsIndicatorOpen(false);
                                  }
                                }}
                                className="w-full text-center py-2 text-indigo-600 font-black text-xs hover:bg-indigo-50 border-t border-dashed border-slate-100 rounded-b-xl flex items-center justify-center gap-1 mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ إضافة مؤشر مخصص</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* ناتج التعلم المخصص مع التعديل والحذف */}
                      <div className="flex flex-col gap-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ناتج التعلم</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOutcomeOpen(!isOutcomeOpen);
                            setIsStandardOpen(false);
                            setIsIndicatorOpen(false);
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold text-xs outline-none text-right flex justify-between items-center cursor-pointer min-h-[34px]"
                        >
                          <span className="truncate">{currentQuestion.learningOutcome || "اختر ناتج التعلم..."}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        
                        {isOutcomeOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOutcomeOpen(false)}></div>
                            <div className="absolute top-full right-0 z-50 w-72 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                              {customLearningOutcomes.map((opt) => (
                                <div key={opt} className="flex items-center justify-between gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl transition-all">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateCurrentQuestion("learningOutcome", opt);
                                      setIsOutcomeOpen(false);
                                    }}
                                    className="flex-1 text-right font-bold text-slate-700 text-xs truncate"
                                  >
                                    {opt}
                                  </button>
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newVal = prompt("تعديل ناتج التعلم المخصص:", opt);
                                        if (newVal !== null && newVal.trim()) {
                                          setCustomLearningOutcomes(prev => prev.map(x => x === opt ? newVal.trim() : x));
                                          if (currentQuestion.learningOutcome === opt) {
                                            updateCurrentQuestion("learningOutcome", newVal.trim());
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
                                        setCustomLearningOutcomes(prev => prev.filter(x => x !== opt));
                                        if (currentQuestion.learningOutcome === opt) {
                                          updateCurrentQuestion("learningOutcome", "");
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
                                  const newVal = prompt("أدخل ناتج التعلم المخصص الجديد:");
                                  if (newVal && newVal.trim()) {
                                    setCustomLearningOutcomes(prev => [...prev, newVal.trim()]);
                                    updateCurrentQuestion("learningOutcome", newVal.trim());
                                    setIsOutcomeOpen(false);
                                  }
                                }}
                                className="w-full text-center py-2 text-indigo-600 font-black text-xs hover:bg-indigo-50 border-t border-dashed border-slate-100 rounded-b-xl flex items-center justify-center gap-1 mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ إضافة ناتج تعلم مخصص</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المهارة</label>
                        <select 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                          value={currentQuestion.skill}
                          onChange={(e) => updateCurrentQuestion("skill", e.target.value)}
                        >
                          {SKILLS.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مستوى الصعوبة</label>
                        <select 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                          value={currentQuestion.level}
                          onChange={(e) => updateCurrentQuestion("level", e.target.value)}
                        >
                          <option value="Easy">سهل</option>
                          <option value="Medium">متوسط</option>
                          <option value="Hard">صعب</option>
                        </select>
                      </div>

                      {currentQuestion.type !== 'TEXT' && (
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الدرجة / النقاط</label>
                          <input 
                            type="number"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                            value={currentQuestion.points}
                            onChange={(e) => updateCurrentQuestion("points", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رابط فيديو اختياري (YouTube/Vimeo)</label>
                        <input 
                          type="url"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white min-h-[34px]"
                          value={currentQuestion.videoUrl || ""}
                          onChange={(e) => updateCurrentQuestion("videoUrl", e.target.value)}
                          placeholder="ضع رابط يوتيوب أو فيميو هنا..."
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نص السؤال / محتوى الشريحة</label>
                      <RichTextEditor
                        value={currentQuestion.text}
                        onChange={(value) => updateCurrentQuestion("text", value)}
                        placeholder="اكتب نص السؤال أو المحتوى التعليمي هنا..."
                      />
                    </div>

                    {/* كتل الشروحات والمحتوى الديناميكية */}
                    <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">شروحات الإجابة وكتل المحتوى</label>
                          <p className="text-slate-400 text-[10px] font-bold mt-0.5">أضف تلميحات أو نصائح أو تحذيرات أو شروحات تفصيلية لهذه الشريحة</p>
                        </div>
                        <div className="relative" data-dropdown-root="true">
                          <button 
                            type="button"
                            onClick={() => setOpenDropdownId(openDropdownId === 'question-sections' ? null : 'question-sections')}
                            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border border-indigo-100"
                          >
                            <Plus className="w-4 h-4" /> إضافة كتلة محتوى
                          </button>
                          <div className={`absolute left-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 ${openDropdownId === 'question-sections' ? "block" : "hidden"}`}>
                            {['EXPLANATION', 'HINT', 'TIP', 'WARNING', 'KEY_INSIGHT'].map(secType => (
                              <button
                                key={secType}
                                type="button"
                                onClick={() => {
                                   addSection(secType);
                                   setOpenDropdownId(null);
                                }}
                                className="w-full text-right px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2"
                              >
                                {React.createElement(SECTION_STYLE_PRESETS[secType]?.icon || FileText, { className: "w-4 h-4 mr-2" })}
                                <span>{SECTION_STYLE_PRESETS[secType]?.label || secType}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {(currentQuestion.sections || []).map((sec: any, idx: number) => {
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
                                  onClick={() => removeSection(idx)} 
                                  className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <RichTextEditor 
                                value={sec.content}
                                onChange={(value) => updateSectionContent(idx, value)}
                                placeholder={`اكتب محتوى ${preset.label} هنا...`}
                                className="!bg-white !border-slate-200"
                              />
                            </div>
                          );
                        })}
                        {(currentQuestion.sections || []).length === 0 && (
                          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-bold">
                            لا توجد شروحات أو كتل محتوى مضافة بعد. انقر على "إضافة كتلة محتوى" لإدراج تلميح، نصيحة، تحذير إلخ.
                          </div>
                        )}
                      </div>
                    </div>

                    {currentQuestion.type !== "TEXT" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                        {currentQuestion.type === "TRUE_FALSE" ? (
                          <>
                            <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isCorrectAnswer(currentQuestion, "صحيح") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                              <div 
                                onClick={() => updateCorrectAnswers(0)}
                                className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isCorrectAnswer(currentQuestion, "صحيح") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                              >
                                {isCorrectAnswer(currentQuestion, "صحيح") && <CheckCircle className="w-5 h-5 text-white" />}
                              </div>
                              <span className="bg-transparent flex-1 outline-none font-bold text-slate-700">صحيح</span>
                            </div>
                            <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isCorrectAnswer(currentQuestion, "خطأ") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                              <div 
                                onClick={() => updateCorrectAnswers(1)}
                                className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isCorrectAnswer(currentQuestion, "خطأ") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                              >
                                {isCorrectAnswer(currentQuestion, "خطأ") && <CheckCircle className="w-5 h-5 text-white" />}
                              </div>
                              <span className="bg-transparent flex-1 outline-none font-bold text-slate-700">خطأ</span>
                            </div>
                          </>
                        ) : (
                          <>
                            {currentQuestion.options.map((opt: string, oIndex: number) => (
                              <div key={oIndex} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isCorrectAnswer(currentQuestion, opt) && opt !== "" ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                <div 
                                  onClick={() => updateCorrectAnswers(oIndex)}
                                  className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isCorrectAnswer(currentQuestion, opt) && opt !== "" ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                                >
                                  {isCorrectAnswer(currentQuestion, opt) && opt !== "" && <CheckCircle className="w-5 h-5 text-white" />}
                                </div>
                                <input 
                                  type="text" 
                                  placeholder={`الخيار ${oIndex + 1}`}
                                  className="bg-transparent flex-1 outline-none font-bold text-slate-700 placeholder:text-slate-300 animate-all duration-300"
                                  value={opt}
                                  onChange={(e) => updateOption(oIndex, e.target.value)}
                                />
                                {currentQuestion.options.length > 2 && (
                                  <button onClick={() => {
                                    const newOptions = [...currentQuestion.options];
                                    newOptions.splice(oIndex, 1);
                                    setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                  }} className="text-red-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                                )}
                              </div>
                            ))}
                            {currentQuestion.type === "MCQ" && currentQuestion.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentQuestion({
                                    ...currentQuestion,
                                    options: [...currentQuestion.options, ""]
                                  });
                                }}
                                className="w-full text-center py-4 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-[22px] font-black text-xs hover:bg-indigo-50/50 hover:border-indigo-400 transition-all md:col-span-2 flex items-center justify-center gap-1.5"
                              >
                                <Plus className="w-4 h-4" />
                                <span>إضافة خيار إضافي</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                      <button 
                        onClick={() => setShowQuestionForm(false)}
                        className="px-8 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all whitespace-nowrap shrink-0"
                      >
                        إلغاء
                      </button>
                      <button 
                        onClick={handleSaveQuestion}
                        className="px-10 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 whitespace-nowrap shrink-0"
                      >
                        <span>حفظ الشريحة في القائمة</span>
                        <Save className="w-5 h-5 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div key={index} className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        <div className="flex flex-col items-center gap-1">
                          <button onClick={() => moveQuestion(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                          <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{index + 1}</span>
                          <button onClick={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{QUESTION_TYPES.find(t => t.id === q.type)?.label}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{q.level === "Easy" ? "سهل" : q.level === "Medium" ? "متوسط" : "صعب"} • {q.points} نقطة</span>
                          </div>
                          <div 
                            className="text-slate-700 font-bold truncate text-sm"
                            dangerouslySetInnerHTML={{ __html: q.text.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                          className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-indigo-600 transition-all"
                          title={expandedIndex === index ? "تصغير" : "توسيع"}
                        >
                          {expandedIndex === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setPreviewQuestion(q)}
                          className="w-10 h-10 bg-indigo-50 text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                          title="معاينة كطالب"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleEditQuestion(index)}
                          className="w-10 h-10 bg-blue-50 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                          title="تعديل"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => removeQuestion(index)}
                          className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expandedIndex === index && (
                      <div className="px-8 pb-8 pt-4 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">محتوى السؤال:</h5>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.text) }} />
                            
                            {q.learningOutcome && (
                              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 w-fit">
                                <Target className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase">ناتج التعلم: {q.learningOutcome}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">الخيارات:</h5>
                            <div className="flex flex-col gap-2">
                              {q.type === "MCQ" || q.type === "MULTI_SELECT" ? (
                                q.options.filter((o: string) => o).map((opt: string, i: number) => (
                                  <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 ${isCorrectAnswer(q, opt) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                    {isCorrectAnswer(q, opt) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                                    <span className="font-bold text-sm">{opt}</span>
                                  </div>
                                ))
                              ) : (
                                ["صحيح", "خطأ"].map((opt, i) => (
                                  <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 ${isCorrectAnswer(q, opt) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                    {isCorrectAnswer(q, opt) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                                    <span className="font-bold text-sm">{opt}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 rtl" dir="rtl">
          <div className="absolute inset-0 bg-[#0f0f1d]/80 backdrop-blur-xl" onClick={() => setPreviewQuestion(null)}></div>
          <div className="relative bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[50px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800">معاينة الطالب</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">هكذا سيظهر السؤال تماماً في واجهة الطالب</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewQuestion(null)}
                className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 md:p-16">
               <div className="max-w-2xl mx-auto space-y-12">
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      {previewQuestion.type === 'MCQ' ? 'اختيار من متعدد' : previewQuestion.type === 'MULTI_SELECT' ? 'اختيار متعدد' : 'صح وخطأ'}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                      {previewQuestion.skill} | {previewQuestion.level === 'Easy' ? 'سهل' : previewQuestion.level === 'Medium' ? 'متوسط' : 'صعب'}
                    </span>
                  </div>

                  {previewQuestion.learningOutcome && (
                    <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 w-fit">
                      <Target className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-widest">ناتج التعلم: {previewQuestion.learningOutcome}</span>
                    </div>
                  )}

                  <h2 
                    className="text-3xl font-bold text-slate-800 leading-relaxed prose prose-indigo max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewQuestion.text) }}
                  />

                  {previewQuestion.imageUrl && (
                    <img
                      src={previewQuestion.imageUrl}
                      alt="Question"
                      className="max-w-full rounded-[30px] border border-slate-100 shadow-xl"
                    />
                  )}

                  {previewQuestion.videoUrl && (
                    <div className="relative w-full aspect-video rounded-[30px] overflow-hidden border border-slate-150 shadow-md">
                      <VideoPlayer url={previewQuestion.videoUrl} />
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    {(previewQuestion.type === "MCQ" || previewQuestion.type === "MULTI_SELECT" ? previewQuestion.options : ["صحيح", "خطأ"]).filter((o: string) => o).map((option: string, i: number) => (
                      <button
                        key={i}
                        className="w-full text-right p-6 rounded-3xl border-2 border-slate-100 bg-white hover:border-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center gap-5 group"
                      >
                        <div className="w-7 h-7 rounded-full border-2 border-slate-200 group-hover:border-indigo-600 flex items-center justify-center transition-all">
                          <div className="w-3 h-3 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>
                        </div>
                        <span className="text-xl font-bold text-slate-700 group-hover:text-indigo-900">{option}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-center">
               <button 
                onClick={() => setPreviewQuestion(null)}
                className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
               >
                 إغلاق المعاينة
               </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
