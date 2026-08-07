"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Save, Plus, Trash2, Image as ImageIcon, CheckCircle2, HelpCircle, ArrowRight, Settings, ListPlus, Globe, Layout, Loader2, Clock, Lock, Calendar, Eye, EyeOff, FileText, AlertCircle, BookOpen, ChevronLeft, ChevronDown, ChevronUp, Edit3, Play, X, Target, Edit2, Sparkles, MessageSquare, Info, Upload, Download } from 'lucide-react';
import { API_URL } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import HtmlRenderer from "@/components/HtmlRenderer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Suspense } from "react";
import { useNotification } from "@/context/NotificationContext";
import RichTextEditor from "@/components/RichTextEditor";
import * as XLSX from 'xlsx';
import VideoPlayer from "@/components/VideoPlayer";
import MathInput from "@/components/MathInput";
import { MetadataModalButton } from '@/components/LessonSubComponents';

// Helper: extract choices array from options (handles both array and JSON object formats)
const parseQuestionChoices = (options: any): string[] => {
  if (!options) return [];
  // If it's already an array, return it
  if (Array.isArray(options)) return options;
  // If it's a string, try to parse it
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) return parsed;
      // Handle {choices: [...]} format
      if (parsed && Array.isArray(parsed.choices)) return parsed.choices;
    } catch {}
  }
  // If it's an object with choices property
  if (typeof options === 'object' && Array.isArray(options.choices)) {
    return options.choices;
  }
  return [];
};

export default function SchoolAdminEditExamPage({ presetType }: { presetType?: 'Exam' | 'Quiz' | 'Assignment' }) {
  return (
    <Suspense fallback={
      <DashboardLayout hideSidebar>
        <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-400">
           <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="font-black text-2xl animate-pulse">جاري التحميل...</p>
        </div>
      </DashboardLayout>
    }>
      <SchoolAdminEditExamPageContent presetType={presetType} />
    </Suspense>
  );
}

export function SchoolAdminEditExamPageContent({ presetType }: { presetType?: 'Exam' | 'Quiz' | 'Assignment' }) {
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
  const [previewSelectedOptions, setPreviewSelectedOptions] = useState<string[]>([]);
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
    skill: "Problem Solving",
    level: "On Level",
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
        "Standard 1: Understanding & Comprehension",
        "Standard 2: Application & Analysis",
        "معيار 3: الاستنتاج والتقييم",
        "معيار 4: التفكير النقدي",
        "معيار 5: حل المشكلات"
      ];
    }
    return [
      "Standard 1: Understanding & Comprehension",
      "Standard 2: Application & Analysis",
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);


  const questionsExcelRef = useRef<HTMLInputElement>(null);

  const [currentQuestion, setCurrentQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, xpPoints: 10, skill: "Problem Solving", level: "On Level", dok: "",
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
  const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
    "الصف الأول الابتدائي": { ar: "الصف الأول الابتدائي", en: "Grade 1 Elementary" },
    "الصف الثاني الابتدائي": { ar: "الصف الثاني الابتدائي", en: "Grade 2 Elementary" },
    "الصف الثالث الابتدائي": { ar: "الصف الثالث الابتدائي", en: "Grade 3 Elementary" },
    "الصف الرابع الابتدائي": { ar: "الصف الرابع الابتدائي", en: "Grade 4 Elementary" },
    "الصف الخامس الابتدائي": { ar: "الصف الخامس الابتدائي", en: "Grade 5 Elementary" },
    "الصف السادس الابتدائي": { ar: "الصف السادس الابتدائي", en: "Grade 6 Elementary" },
    "الصف الأول الإعدادي": { ar: "الصف الأول الإعدادي", en: "Grade 1 Middle School" },
    "الصف الثاني الإعدادي": { ar: "الصف الثاني الإعدادي", en: "Grade 2 Middle School" },
    "الصف الثالث الإعدادي": { ar: "الصف الثالث الإعدادي", en: "Grade 3 Middle School" },
    "الصف الأول الثانوي": { ar: "الصف الأول الثانوي", en: "Grade 1 High School" },
    "الصف الثاني الثانوي": { ar: "الصف الثاني الثانوي", en: "Grade 2 High School" },
    "الصف الثالث الثانوي": { ar: "الصف الثالث الثانوي", en: "Grade 3 High School" },
  };
  const isGradeSelected = (g: string) => {
    const enLabel = GRADE_LABELS[g]?.en;
    return (examInfo.grades || []).includes(g) || (enLabel && (examInfo.grades || []).includes(enLabel));
  };
  const getGradeDisplay = (g: string) => GRADE_LABELS[g]?.[language === 'ar' ? 'ar' : 'en'] || g;
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
    "حل المشكلات", "التفكير المنطقي", "حس الأعداد", "التفكير الجبري", "الهندسة", "تحليل البيانات",
    "الملاحظة", "الاستقصاء", "التفكير العلمي", "تفسير البيانات", "تصميم التجارب",
    "الفكرة الرئيسية", "الاستنتاج", "المفردات في السياق", "غرض الكاتب", "التفاصيل الداعمة"
  ] : [
    "Problem Solving", "Reasoning", "Number Sense", "Algebraic Thinking", "Geometry", "Data Analysis",
    "Observation", "Investigation", "Scientific Reasoning", "Data Interpretation", "Experiment Design",
    "Main Idea", "Inference", "Vocabulary in Context", "Author's Purpose", "Supporting Details"
  ];

  const [customSkills, setCustomSkills] = useState<string[]>([]);

  const allExistingSkills = Array.from(new Set([
    ...SKILLS,
    ...customSkills,
    ...questions.map(q => q.skill).filter(Boolean)
  ]));

  const VISIBILITY_OPTIONS = [
    { id: "SHOW_SCORE", label: "الدرجة فقط", desc: "سيرى الطالب مجموع درجاته فقط", icon: Eye },
    { id: "SHOW_ANSWERS", label: "الإجابات الصحيحة", desc: "سيتمكن الطالب من مراجعة كل إجابة مع النموذج الصحيح", icon: CheckCircle2 },
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
        dok,
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
        "DOK",
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
        "DOK 1",
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
        "Easy", "DOK 2", "", ""
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
          let parsedCorrectAnswers = [];
          if (q.type === 'MULTI_SELECT' && q.correctAnswer) {
            try {
              parsedCorrectAnswers = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
            } catch (e) {
              parsedCorrectAnswers = typeof q.correctAnswer === 'string' ? q.correctAnswer.split(',').map((s: string) => s.trim()) : [];
            }
          }
          let parsedSections = [{ type: 'EXPLANATION', content: "" }];
          if (q.explanation) {
            try {
              const parsed = typeof q.explanation === 'string' ? JSON.parse(q.explanation) : q.explanation;
              if (Array.isArray(parsed)) {
                parsedSections = parsed.map((item: any) => typeof item === 'string' ? { type: 'EXPLANATION', content: item } : item);
              } else {
                parsedSections = [{ type: 'EXPLANATION', content: q.explanation }];
              }
            } catch (e) {
              parsedSections = [{ type: 'EXPLANATION', content: q.explanation }];
            }
          }
          return {
            ...q,
            options: parseQuestionChoices(q.options),
            correctAnswers: q.type === 'MULTI_SELECT' ? (Array.isArray(parsedCorrectAnswers) && parsedCorrectAnswers.length > 0 ? parsedCorrectAnswers : q.correctAnswers || []) : [],
            sections: parsedSections
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

  // ✅ مزامنة صامتة: تُحدِّث IDs الأسئلة من الـ DB بعد كل حفظ ناجح
  // بدون إظهار شاشة التحميل أو تعطيل الـ UI
  const syncQuestionsFromDB = async () => {
    try {
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setQuestions(data.questions?.map((q: any) => {
        let parsedCorrectAnswers = [];
        if (q.type === 'MULTI_SELECT' && q.correctAnswer) {
          try {
            parsedCorrectAnswers = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
          } catch (e) {
            parsedCorrectAnswers = typeof q.correctAnswer === 'string' ? q.correctAnswer.split(',').map((s: string) => s.trim()) : [];
          }
        }
        return {
          ...q,
          options: parseQuestionChoices(q.options),
          correctAnswers: q.type === 'MULTI_SELECT' ? (Array.isArray(parsedCorrectAnswers) && parsedCorrectAnswers.length > 0 ? parsedCorrectAnswers : q.correctAnswers || []) : []
        };
      }) || []);
    } catch (e) {
      // نتجاهل الأخطاء - الـ auto-save التالي سيعيد المحاولة
      console.warn('Silent sync failed:', e);
    }
  };

  const handleAddQuestion = (type: string = 'MCQ') => {
    setCurrentQuestion({
      text: "", type, options: type === 'TRUE_FALSE' ? ["True", "False", "", ""] : ["", "", "", ""],
      correctAnswer: "", points: type === 'TEXT' ? 0 : 1, xpPoints: 10, skill: "Problem Solving", level: "On Level", dok: "",
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
    let parsedSections = q.sections && q.sections.length > 0 ? q.sections : [];
    if (parsedSections.length === 0) {
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
    }

    setCurrentQuestion({ 
      ...q,
      sections: parsedSections.length > 0 ? parsedSections : [{ type: "EXPLANATION", content: "" }],
      // ✅ Restore index so selected option stays highlighted
      correctAnswerIndex: q.type !== 'MULTI_SELECT' && q.type !== 'TRUE_FALSE'
        ? (() => { const opts = Array.isArray(q.options) ? q.options : []; const idx = opts.findIndex((o: string) => o === q.correctAnswer); return idx >= 0 ? idx : null; })()
        : undefined,
      correctAnswerIndices: q.type === 'MULTI_SELECT' && Array.isArray(q.correctAnswers)
        ? (() => { const opts = Array.isArray(q.options) ? q.options : []; return q.correctAnswers.map((ca: string) => opts.findIndex((o: string) => o === ca)).filter((i: number) => i >= 0); })()
        : undefined,
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
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا القسم؟" : "Are you sure you want to delete this section?")) return;
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
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذه الشريحة/السؤال؟" : "Are you sure you want to delete this slide/question?")) return;
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
    const oldOptionValue = newOptions[oIndex];
    newOptions[oIndex] = value;
    
    let updatedQuestion = { ...currentQuestion, options: newOptions };

    if (updatedQuestion.type === "MULTI_SELECT" && Array.isArray(updatedQuestion.correctAnswers) && updatedQuestion.correctAnswers.includes(oldOptionValue) && oldOptionValue !== "") {
      updatedQuestion.correctAnswers = updatedQuestion.correctAnswers.map((a: string) => a === oldOptionValue ? value : a);
    } else if (updatedQuestion.correctAnswerIndex === oIndex || (updatedQuestion.correctAnswer === oldOptionValue && oldOptionValue !== "")) {
      updatedQuestion.correctAnswer = value;
    }

    setCurrentQuestion(updatedQuestion);
  };

  const updateCorrectAnswers = (optionIndex: number) => {
    const question = { ...currentQuestion };

    if (question.type === "TRUE_FALSE") {
      question.correctAnswer = optionIndex === 0 ? "صحيح" : "خطأ";
    } else if (question.type === "MULTI_SELECT") {
      if (!Array.isArray(question.correctAnswers)) question.correctAnswers = [];
      const opt = question.options[optionIndex];
      if (question.correctAnswers.includes(opt)) {
        question.correctAnswers = question.correctAnswers.filter((a: string) => a !== opt);
      } else {
        question.correctAnswers.push(opt);
      }
    } else {
      question.correctAnswer = question.options[optionIndex];
      question.correctAnswerIndex = optionIndex;
    }

    setCurrentQuestion(question);
  };

  const isCorrectAnswer = (question: any, option: string, index?: number) => {
    if (question.type === "MULTI_SELECT") {
      return question.correctAnswers?.includes(option);
    }
    if (question.type === "TRUE_FALSE") {
      let tFn = typeof t !== 'undefined' ? t : (key: string) => key;
      const trueValues = ["True", "true", "صحيح", "صح", "صواب", "1", "Correct", "correct", tFn('schoolAdmin.examsNewPage.correct')];
      const falseValues = ["False", "false", "خطأ", "خاطئ", "غير صحيح", "0", "Incorrect", "incorrect", tFn('schoolAdmin.examsNewPage.incorrect')];

      const optionNorm = String(option || "").trim();
      const correctNorm = String(question.correctAnswer || "").trim();

      const isOptionTrue = trueValues.includes(optionNorm);
      const isOptionFalse = falseValues.includes(optionNorm);
      const isCorrectTrue = trueValues.includes(correctNorm);
      const isCorrectFalse = falseValues.includes(correctNorm);

      if (isOptionTrue && isCorrectTrue) return true;
      if (isOptionFalse && isCorrectFalse) return true;
      return false;
    }
    if (question.correctAnswerIndex !== undefined && index !== undefined && question.correctAnswerIndex === index) {
      return true;
    }
    return question.correctAnswer === option;
  };

  const isSavingRef = useRef(false);

  // Auto-save interval
  const autoSaveDataRef = React.useRef({ showQuestionForm, editingIndex });
  React.useEffect(() => {
    autoSaveDataRef.current = { showQuestionForm, editingIndex };
  }, [showQuestionForm, editingIndex]);

  const handleSubmitRef = React.useRef<any>(null);
  React.useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [examInfo, questions, showQuestionForm, editingIndex, currentQuestion]);

  useEffect(() => {
    if (!isAutoSaveEnabled) return;

    const interval = setInterval(() => {
      const { showQuestionForm, editingIndex } = autoSaveDataRef.current;
      if (!isSavingRef.current && !(showQuestionForm && editingIndex === null)) {
        if (handleSubmitRef.current) {
          handleSubmitRef.current(null, true);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAutoSaveEnabled]);

  const handleSubmit = async (statusOverride: string | null = null, isAutoSave = false) => {
    if (isSavingRef.current) return;

    if (!examInfo.title) {
      if (!isAutoSave) {
        showToast("يرجى إدخال عنوان الامتحان", 'error');
      }
      return;
    }

    if (questions.length === 0) {
      if (!isAutoSave) {
        showToast("يرجى إضافة سؤال واحد على الأقل", 'error');
      }
      return;
    }

    if (!isAutoSave) {
      setSaving(true);
    }
    
    isSavingRef.current = true;
    try {
      const token = localStorage.getItem("school_admin_token");

      // ✅ إذا كان المستخدم يعدل سؤالاً موجوداً أثناء الـ auto-save،
      // نضيف النسخة الحالية للسؤال (المعدَّلة) حتى لا يُحذف من الـ DB
      let questionsForSave = [...questions];
      if (showQuestionForm) {
        if (editingIndex !== null && editingIndex >= 0) {
          questionsForSave[editingIndex] = { ...currentQuestion };
        } else {
          // It's a new question being created
          questionsForSave.push({ ...currentQuestion });
        }
      }

      const questionsPayload = questionsForSave.map(q => {
        let finalExplanation = "[]";
        if (q.sections && q.sections.length > 0) {
          finalExplanation = JSON.stringify(q.sections);
        } else if (q.explanation) {
          finalExplanation = typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation);
        }
        return {
          ...q,
          explanation: finalExplanation,
          correctAnswer: q.type === 'MULTI_SELECT' && Array.isArray(q.correctAnswers) ? JSON.stringify(q.correctAnswers) : q.correctAnswer
        };
      });

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
        if (isAutoSave) {
          setLastAutoSave(new Date());
          const data = await res.json();
          // Update IDs only to avoid overwriting ongoing edits
          setQuestions(prev => prev.map((q, i) => {
            if (!q.id && data.exam?.questions?.[i]?.id) {
              return { ...q, id: data.exam.questions[i].id };
            }
            return q;
          }));
        } else {
          const successMsg = examInfo.type === 'Quiz' 
            ? (language === 'ar' ? "تم تحديث الكويز بنجاح!" : "Quiz updated successfully!")
            : examInfo.type === 'Assignment'
            ? (language === 'ar' ? "تم تحديث التكليف بنجاح!" : "Assignment updated successfully!")
            : (language === 'ar' ? "تم تحديث الامتحان بنجاح!" : "Exam updated successfully!");
          showToast(successMsg, 'success');
          if (courseIdParam || examInfo.courseId) {
            router.push(`/school-admin/courses/edit/${courseIdParam || examInfo.courseId}`);
          } else {
            router.push("/school-admin/exams");
          }
        }
      } else {
        if (!isAutoSave) {
          const err = await res.json();
          showToast(err.error || "خطأ في التحديث", 'error');
        } else {
          console.error("Auto-save failed:", await res.text());
          showToast(language === 'ar' ? "فشل الحفظ التلقائي للاختبار. تأكد من الاتصال ثم احفظ يدوياً." : "Exam auto-save failed. Check your connection, then save manually.", "error");
        }
      }
    } catch (error) {
      if (!isAutoSave) {
        showToast("حدث خطأ غير متوقع", 'error');
      } else {
        console.error("Auto-save error:", error);
        showToast(language === 'ar' ? "فشل الحفظ التلقائي للاختبار. تأكد من الاتصال ثم احفظ يدوياً." : "Exam auto-save failed. Check your connection, then save manually.", "error");
      }
    } finally {
      isSavingRef.current = false;
      if (!isAutoSave) {
        setSaving(false);
      }
    }
  };

  const renderQuestionForm = () => (
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
                              updated.options = ["True", "False", "", ""];
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة' : 'Skill'}</label>
                        <select 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                          value={currentQuestion.skill}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "add_custom") {
                              const newVal = prompt(language === 'ar' ? "أدخل مهارة مخصصة جديدة:" : "Enter custom skill:");
                              if (newVal && newVal.trim()) {
                                const trimmed = newVal.trim();
                                setCustomSkills(prev => Array.from(new Set([...prev, trimmed])));
                                updateCurrentQuestion("skill", trimmed);
                              }
                            } else {
                              updateCurrentQuestion("skill", val);
                            }
                          }}
                        >
                          <option value="General">{language === 'ar' ? 'عام' : 'General'}</option>
                          {allExistingSkills.filter(sk => sk !== "General").map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                          <option value="add_custom" className="text-indigo-600 font-bold">
                            {language === 'ar' ? '+ إضافة مهارة مخصصة...' : '+ Add Custom Skill...'}
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مستوى الصعوبة</label>
                        <input 
                          list="exam-difficulty-options"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                          value={currentQuestion.level || ""}
                          onChange={(e) => updateCurrentQuestion("level", e.target.value)}
                          placeholder="أدخل المستوى..."
                        />
                        <datalist id="exam-difficulty-options">
                          <option value="Foundation">تأسيسي</option>
                          <option value="On Level">في المستوى</option>
                          <option value="Advanced">متقدم</option>
                        </datalist>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DOK</label>
                        <input 
                          list="exam-dok-options"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                          value={currentQuestion.dok || ""}
                          onChange={(e) => updateCurrentQuestion("dok", e.target.value)}
                          placeholder="أدخل DOK..."
                        />
                        <datalist id="exam-dok-options">
                          <option value="DOK 1" />
                          <option value="DOK 2" />
                          <option value="DOK 3" />
                          <option value="DOK 4" />
                        </datalist>
                      </div>

                      {currentQuestion.type !== 'TEXT' && (
                        <>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الدرجة / النقاط</label>
                            <input 
                              type="number"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                              value={currentQuestion.points}
                              onChange={(e) => updateCurrentQuestion("points", parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? '⭐ نقاط XP' : '⭐ XP Points'}</label>
                            <input 
                              type="number"
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                              value={currentQuestion.xpPoints !== undefined ? currentQuestion.xpPoints : 10}
                              onChange={(e) => updateCurrentQuestion("xpPoints", parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </>
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
                        key={`question-text-${editingIndex}-${currentQuestion.id || 'new'}`}
                        value={currentQuestion.text}
                        onChange={(value) => updateCurrentQuestion("text", value)}
                        placeholder="اكتب نص السؤال أو المحتوى التعليمي هنا..."
                      />
                    </div>

                    {/* كتل الشروحات والمحتوى الديناميكية */}
                    <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">{language === 'ar' ? 'شرح الإجابة' : 'Answer Explanation'}</label>
                          <p className="text-slate-400 text-[10px] font-bold mt-0.5">{language === 'ar' ? 'أضف شرحاً تفصيلياً يظهر للطالب بعد تسليم الإجابة في تقرير الاختبار' : 'Add a detailed explanation to appear after submitting the answer in the exam report'}</p>
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
                            {['EXPLANATION'].map(secType => (
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                key={`section-content-${editingIndex}-${idx}`}
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
                            <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isCorrectAnswer(currentQuestion, "True") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                              <div 
                                onClick={() => updateCorrectAnswers(0)}
                                className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isCorrectAnswer(currentQuestion, "True") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                              >
                                {isCorrectAnswer(currentQuestion, "True") && <CheckCircle2 className="w-5 h-5 text-white" />}
                              </div>
                              <span className="bg-transparent flex-1 outline-none font-bold text-slate-700">True</span>
                            </div>
                            <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isCorrectAnswer(currentQuestion, "False") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                              <div 
                                onClick={() => updateCorrectAnswers(1)}
                                className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isCorrectAnswer(currentQuestion, "False") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                              >
                                {isCorrectAnswer(currentQuestion, "False") && <CheckCircle2 className="w-5 h-5 text-white" />}
                              </div>
                              <span className="bg-transparent flex-1 outline-none font-bold text-slate-700">False</span>
                            </div>
                          </>
                        ) : (
                          <>
                            {currentQuestion.options.map((opt: string, oIndex: number) => (
                              <div key={oIndex} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isCorrectAnswer(currentQuestion, opt, oIndex) ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                <div 
                                  onClick={() => updateCorrectAnswers(oIndex)}
                                  className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isCorrectAnswer(currentQuestion, opt, oIndex) ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                                >
                                  {isCorrectAnswer(currentQuestion, opt, oIndex) && <CheckCircle2 className="w-5 h-5 text-white" />}
                                </div>
                                <MathInput 
                                  placeholder={`الخيار ${oIndex + 1}`}
                                  className="bg-transparent flex-1"
                                  value={opt}
                                  onChange={(val) => updateOption(oIndex, val)}
                                />
                                {currentQuestion.options.length > 2 && (
                                  <button onClick={() => {
                                    const newOptions = [...currentQuestion.options];
                                    newOptions.splice(oIndex, 1);
                                    let updatedQ: any = { ...currentQuestion, options: newOptions };
                                    if (updatedQ.correctAnswerIndex !== undefined) {
                                      if (updatedQ.correctAnswerIndex === oIndex) { updatedQ.correctAnswerIndex = null; updatedQ.correctAnswer = ""; }
                                      else if (updatedQ.correctAnswerIndex > oIndex) { updatedQ.correctAnswerIndex = updatedQ.correctAnswerIndex - 1; }
                                    }
                                    setCurrentQuestion(updatedQ);
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
  );

  if (loading) 
  return (
    <DashboardLayout hideSidebar>
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-400">
         <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
         <p className="font-black text-2xl animate-pulse">جاري تحميل بيانات الامتحان...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout hideSidebar>
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
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10 hover:bg-indigo-500/30 transition-all cursor-pointer group"
                  title={language === 'ar' ? "فتح الإعدادات العامة" : "Open General Settings"}
                >
                  <Settings className="w-8 h-8 text-indigo-400 group-hover:rotate-45 transition-transform" />
                </button>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {language === 'ar' ? 'تعديل الامتحان المدرسي' : 'Edit School Exam'}
                </h2>
              </div>
              <p className="text-indigo-200/60 mt-2 text-lg font-medium max-w-2xl leading-relaxed">
                {language === 'ar' ? 'أنت الآن تقوم بتحديث' : 'You are now updating'} " {examInfo.title} ". {language === 'ar' ? 'تأكد من مراجعة كافة الإعدادات والأسئلة بدقة.' : 'Make sure to review all settings and questions carefully.'}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-center">
              <button 
                onClick={() => window.open(`/exams/${id}?preview=true`, "_blank")}
                className="px-8 py-5 rounded-2xl font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3"
              >
                {language === 'ar' ? 'معاينة كطالب' : 'Preview as Student'}
                <Eye className="w-5 h-5" />
              </button>

              <button 
                onClick={() => handleSubmit("DRAFT")}
                disabled={saving}
                className="px-8 py-5 rounded-2xl font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {language === 'ar' ? 'تحويل لمسودة' : 'Change to Draft'}
                <FileText className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => handleSubmit()}
                disabled={saving}
                className="px-10 py-5 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                <Save className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] -mr-64 -mt-64"></div>
        </div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="absolute inset-0 bg-[#0f0f1d]/80 backdrop-blur-xl" onClick={() => setShowSettingsModal(false)}></div>
            <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[35px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
                  <Settings className="w-6 h-6 text-indigo-600" />
                  {language === 'ar' ? "الإعدادات العامة" : "General Settings"}
                </h3>
                <button onClick={() => setShowSettingsModal(false)} className="w-10 h-10 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المواد الدراسية" : "Subjects"}</label>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[170px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <label key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${examInfo.subjects?.includes(cat) ? 'bg-indigo-100 border-indigo-300 text-indigo-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={examInfo.subjects?.includes(cat)}
                            onChange={() => {
                              const cur = examInfo.subjects || [];
                              const updated = cur.includes(cat) ? cur.filter((c: string) => c !== cat) : [...cur, cat];
                              setExamInfo({...examInfo, subjects: updated});
                            }}
                          />
                          {examInfo.subjects?.includes(cat) && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                          <span className="text-xs font-bold">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المراحل الدراسية" : "Grade Levels"}</label>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[120px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                        {GRADES.map(g => {
                          const selected = isGradeSelected(g);
                          const enLabel = GRADE_LABELS[g]?.en;
                          return (
                            <label key={g} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${selected ? 'bg-indigo-100 border-indigo-300 text-indigo-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                              <input type="checkbox" className="hidden" checked={selected} onChange={(e) => {
                                const cur = examInfo.grades || [];
                                if (e.target.checked) {
                                  setExamInfo({...examInfo, grades: Array.from(new Set([...cur, g]))});
                                } else {
                                  setExamInfo({...examInfo, grades: cur.filter((gr: string) => gr !== g && gr !== enLabel)});
                                }
                              }} />
                              {selected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                              <span className="text-xs font-bold">{getGradeDisplay(g)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المدة (بالدقائق)" : "Exam Duration (min)"}</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                          value={examInfo.duration || 30}
                          onChange={(e) => setExamInfo({...examInfo, duration: parseInt(e.target.value) || 30})}
                        />
                        <Clock className="w-4 h-4 text-slate-300 absolute left-3 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "كلمة مرور الاختبار (اختياري)" : "Exam Password (Optional)"}</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. PASS2026"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                        value={examInfo.password || ""}
                        onChange={(e) => setExamInfo({...examInfo, password: e.target.value})}
                      />
                      <Lock className="w-4 h-4 text-slate-300 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'ar' ? "سياسة ظهور نتائج الاختبار" : "Result Visibility Policy"}</label>
                    <div className="flex flex-col gap-3">
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${examInfo.resultVisibility === opt.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                          <input
                            type="radio"
                            className="hidden"
                            checked={examInfo.resultVisibility === opt.id}
                            onChange={() => setExamInfo({...examInfo, resultVisibility: opt.id})}
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${examInfo.resultVisibility === opt.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                            {examInfo.resultVisibility === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-bold text-slate-700 block">{opt.label}</span>
                            <span className="text-[9px] text-slate-400 font-bold block leading-relaxed">{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Date Scheduling */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{language === 'ar' ? "مواعيد الإتاحة" : "Availability Dates"}</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ ووقت البداية" : "Start Date & Time"}</label>
                        <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm" value={examInfo.startDate || ""} onChange={(e) => setExamInfo({ ...examInfo, startDate: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ ووقت النهاية" : "End Date & Time"}</label>
                        <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm" value={examInfo.endDate || ""} onChange={(e) => setExamInfo({ ...examInfo, endDate: e.target.value })} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  {language === 'ar' ? "حفظ وإغلاق الإعدادات" : "Save & Close Settings"}
                </button>
              </div>
            </div>
          </div>
        )}

          {/* Questions Content Area - Full Width */}
          <div className="flex flex-col gap-8">
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
               <label className="text-sm font-black text-slate-400 mb-3 block uppercase tracking-widest">{language === 'ar' ? 'عنوان الامتحان المدرسي' : 'School Exam Title'}</label>
               <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-[25px] px-8 py-6 text-2xl md:text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all text-slate-800"
                placeholder={language === 'ar' ? 'أدخل عنوان الامتحان هنا...' : 'Enter exam title here...'}
                value={examInfo.title || ""}
                onChange={(e) => setExamInfo({...examInfo, title: e.target.value})}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-slate-800">{language === 'ar' ? 'شرائح الامتحان' : 'Exam Slides'} ({questions.length})</h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                  {questions.reduce((sum, q) => sum + (q.points || 0), 0)} {language === 'ar' ? 'نقطة إجمالية' : 'Total Points'}
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
                  <span>{language === 'ar' ? 'استيراد Excel' : 'Import Excel'}</span>
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

              {showQuestionForm && editingIndex === null && renderQuestionForm()}

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
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{q.level === "Easy" || q.level === "Foundation" ? "تأسيسي" : q.level === "Medium" || q.level === "On Level" ? "في المستوى" : "متقدم"} {q.dok ? `• ${q.dok}` : ''} • {q.points} نقطة</span>
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
                          onClick={() => {
                            setPreviewSelectedOptions([]);
                            setPreviewQuestion(q);
                          }}
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
                            <HtmlRenderer html={sanitizeHtml(q.text)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm prose prose-slate max-w-none" />
                            
                            {q.learningOutcome && !/[\u0600-\u06FF]/.test(q.learningOutcome) && (
                              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 w-fit">
                                <Target className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase">ناتج التعلم: {q.learningOutcome}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            {q.type !== 'TEXT' && (
                              <>
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('schoolAdmin.examsNewPage.options')}</h5>
                                <div className="flex flex-col gap-2">
                                  {q.type === "MCQ" || q.type === "MULTI_SELECT" ? (
                                    q.options.filter((o: string) => o.trim() !== "").map((opt: string, i: number) => (
                                      <div key={i} onClick={() => { const updated = [...questions]; const qCopy = { ...updated[index] }; if (qCopy.type === "MULTI_SELECT") { const ans = qCopy.correctAnswers || []; qCopy.correctAnswers = ans.includes(opt) ? ans.filter((a: string) => a !== opt) : [...ans, opt]; } else { qCopy.correctAnswer = qCopy.correctAnswer === opt ? "" : opt; } updated[index] = qCopy; setQuestions(updated); }} className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isCorrectAnswer(q, opt) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'}`}>
                                        {isCorrectAnswer(q, opt) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                                        <HtmlRenderer html={sanitizeHtml(opt)} tag="span" className="font-bold text-sm" />
                                      </div>
                                    ))
                                  ) : (
                                    ["True", "False"].map((opt, i) => (
                                      <div key={i} onClick={() => { const updated = [...questions]; const qCopy = { ...updated[index] }; qCopy.correctAnswer = opt; updated[index] = qCopy; setQuestions(updated); }} className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isCorrectAnswer(q, opt) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200 hover:text-emerald-600'}`}>
                                        {isCorrectAnswer(q, opt) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                                        <span className="font-bold text-sm">{opt === "True" ? (language === 'ar' ? "صحيح" : "True") : (language === 'ar' ? "خطأ" : "False")}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </>
                            )}

                            {q.sections && q.sections.length > 0 && (
                              <div className="flex flex-col gap-2 mt-4">
                                {q.sections.map((sec: any, sIdx: number) => {
                                  const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                                  const Icon = preset.icon;
                                  return (
                                    <div key={sIdx} className={`p-4 rounded-xl border-2 ${preset.container}`}>
                                      <div className={`flex items-center gap-2 mb-2 font-black text-sm uppercase tracking-wider ${preset.badge} w-fit px-3 py-1 rounded-lg`}>
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span>{preset.label}</span>
                                      </div>
                                      <HtmlRenderer html={sanitizeHtml(sec.content)} className="prose prose-sm max-w-none bg-white p-4 rounded-xl mt-2" />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  
                    {showQuestionForm && editingIndex === index && (
                      <div className="border-t-2 border-dashed border-indigo-100 p-6 bg-slate-50/80 mt-4 rounded-b-[30px]">
                        {renderQuestionForm()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Student Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-[100] bg-white w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-300 rtl" dir="rtl">
          <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800">{language === 'ar' ? 'معاينة الطالب' : 'Student Preview'}</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{language === 'ar' ? 'هكذا سيظهر السؤال تماماً في واجهة الطالب' : 'This is exactly how it will appear in the student interface.'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setPreviewSelectedOptions([]);
                  setPreviewQuestion(null);
                }}
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
                      {previewQuestion.skill} | {previewQuestion.level === 'Easy' ? 'سهل' : previewQuestion.level === 'Medium' ? 'متوسط' : 'صعب'}{previewQuestion.dok ? ` | ${previewQuestion.dok}` : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 w-full mt-4">
                    {previewQuestion.standard && !/[\u0600-\u06FF]/.test(previewQuestion.standard) && (
                      <span className="bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2" title={previewQuestion.standard}>
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[150px]">{previewQuestion.standard}</span>
                      </span>
                    )}
                    {previewQuestion.indicator && !/[\u0600-\u06FF]/.test(previewQuestion.indicator) && (
                      <span className="bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2" title={previewQuestion.indicator}>
                        <ListPlus className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[150px]">{previewQuestion.indicator}</span>
                      </span>
                    )}
                    {previewQuestion.learningOutcome && !/[\u0600-\u06FF]/.test(previewQuestion.learningOutcome) && (
                      <span className="bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2" title={previewQuestion.learningOutcome}>
                        <Target className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[150px]">{previewQuestion.learningOutcome}</span>
                      </span>
                    )}
                  </div>

                  <HtmlRenderer 
                    html={sanitizeHtml(previewQuestion.text)}
                    tag="h2"
                    className="text-3xl font-bold text-slate-800 leading-relaxed prose prose-indigo max-w-none"
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

                  <div className="grid grid-cols-2 gap-4">
                    {(previewQuestion.type === "MCQ" || previewQuestion.type === "MULTI_SELECT"
                      ? previewQuestion.options.filter((o: string) => o.trim() !== "")
                      : ["True", "False"]
                    ).map((option: string, i: number) => {
                      const displayLabel = previewQuestion.type === "TRUE_FALSE"
                        ? (option === "True" ? (language === 'ar' ? "صحيح" : "True") : (language === 'ar' ? "خطأ" : "False"))
                        : option;
                      const isSelected = previewSelectedOptions.includes(option);
                      const isCorrect = isCorrectAnswer(previewQuestion, option);
                      
                      let bgClass = "bg-white border-slate-100";
                      let textClass = "text-slate-700";
                      let icon = null;
                      
                      if (isSelected) {
                        if (isCorrect) {
                          bgClass = "bg-emerald-50 border-emerald-500";
                          textClass = "text-emerald-700";
                          icon = <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
                        } else {
                          bgClass = "bg-rose-50 border-rose-500";
                          textClass = "text-rose-700";
                          icon = <X className="w-6 h-6 text-rose-500" />;
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (previewQuestion.type === "MULTI_SELECT") {
                              setPreviewSelectedOptions(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
                            } else {
                              setPreviewSelectedOptions([option]);
                            }
                          }}
                          className={`w-full text-${language === 'ar' ? 'right' : 'left'} p-6 rounded-3xl border-2 hover:shadow-md transition-all flex items-center gap-5 group ${bgClass}`}
                        >
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-rose-500 bg-rose-500') : 'border-slate-200 group-hover:border-indigo-600'}`}>
                            {isSelected ? <div className="text-white font-bold text-sm flex items-center justify-center">{isCorrect ? '✓' : '✗'}</div> : <div className="w-3 h-3 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>}
                          </div>
                          <span className={`text-xl font-bold flex-1 ${textClass}`}><HtmlRenderer html={sanitizeHtml(displayLabel)} tag="span" /></span>
                          {icon}
                        </button>
                      );
                    })}
                  </div>

                  {previewQuestion.sections && previewQuestion.sections.length > 0 && (
                    <div className="mt-8 space-y-4 animate-in fade-in duration-700">
                      {previewQuestion.sections.map((sec: any, sIdx: number) => {
                        const SECTION_STYLE_PRESETS: Record<string, any> = {
                          HINT: { icon: HelpCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: language === 'ar' ? "تلميح" : "Hint" },
                          TIP: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: language === 'ar' ? "نصيحة" : "Tip" },
                          WARNING: { icon: AlertCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: language === 'ar' ? "تحذير" : "Warning" },
                          KEY_INSIGHT: { icon: Sparkles, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: language === 'ar' ? "نقطة هامة" : "Key Insight" },
                          FEEDBACK: { icon: MessageSquare, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: language === 'ar' ? "ملاحظات" : "Feedback" },
                          EXPLANATION: { icon: BookOpen, bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: language === 'ar' ? "شرح مفصل" : "Explanation" }
                        };
                        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                        const Icon = preset.icon;
                        return (
                          <div key={sIdx} className={`p-6 rounded-2xl border-2 ${preset.bg} ${preset.border}`}>
                            <div className={`flex items-center gap-2 mb-3 font-black ${preset.text}`}>
                              <Icon className="w-5 h-5 shrink-0" />
                              <span>{preset.label}</span>
                            </div>
                            <HtmlRenderer html={sanitizeHtml(sec.content)} className={`prose prose-sm max-w-none ${preset.text}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-center mt-auto shrink-0">
               <button 
                onClick={() => {
                  setPreviewSelectedOptions([]);
                  setPreviewQuestion(null);
                }}
                className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
               >
                 {language === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
               </button>
            </div>
          </div>
        )}

        {/* Sticky Floating Save Bar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md text-white px-8 py-4 rounded-3xl shadow-2xl border border-slate-700/50 flex items-center gap-6">
          <span className="text-sm font-bold opacity-80 hidden md:inline">
            {language === 'ar' ? 'هل انتهيت من التعديلات؟' : 'Finished editing?'}
          </span>
          <button 
            onClick={() => handleSubmit()}
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التعديلات الآن' : 'Save Changes Now')}
          </button>
        </div>
      </DashboardLayout>
    );
  }
