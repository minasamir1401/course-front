"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Save, Plus, Trash2, Image as ImageIcon, CheckCircle, HelpCircle, 
  ArrowRight, Settings, ListPlus, Globe, Layout, Loader2, 
  Clock, Lock, Calendar, Eye, EyeOff, FileText, AlertCircle,
  Bold, Italic, Underline, List, ListOrdered, AlignRight, Code,
  ChevronDown, ChevronUp, Edit2, Edit3, Play, GripVertical, X, CheckCircle2, Target,
  Info, Sparkles, BookOpen, MessageSquare, Upload, Download
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import * as XLSX from 'xlsx';
import VideoPlayer from "@/components/VideoPlayer";

import { API_URL } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Suspense } from "react";
import { useNotification } from "@/context/NotificationContext";
import MathInput from "@/components/MathInput";
import HtmlRenderer from "@/components/HtmlRenderer";

export default function SuperAdminNewExamPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-slate-400">
           <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="font-black text-2xl animate-pulse">جاري التحميل...</p>
        </div>
      </DashboardLayout>
    }>
      <SuperAdminNewExamPageContent />
    </Suspense>
  );
}

function SuperAdminNewExamPageContent() {
    const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('courseId');
  const typeParam = searchParams.get('type');
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [fetchingSchools, setFetchingSchools] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // UI States
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const SECTION_STYLE_PRESETS: Record<string, {
    icon: any;
    label: string;
    container: string;
    badge: string;
  }> = {
    HINT: {
      icon: HelpCircle,
      label: "Hint",
      container: "bg-yellow-50/70 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-700",
    },
    TIP: {
      icon: Info,
      label: "Tip",
      container: "bg-sky-50/70 border-sky-200",
      badge: "bg-sky-100 text-sky-700",
    },
    WARNING: {
      icon: AlertCircle,
      label: "Warning",
      container: "bg-rose-50/70 border-rose-200",
      badge: "bg-rose-100 text-rose-700",
    },
    KEY_INSIGHT: {
      icon: Sparkles,
      label: "Key Insight",
      container: "bg-indigo-50/70 border-indigo-200",
      badge: "bg-indigo-100 text-indigo-700",
    },
    FEEDBACK: {
      icon: MessageSquare,
      label: "Feedback",
      container: "bg-emerald-50/70 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
    },
    EXPLANATION: {
      icon: BookOpen,
      label: "Explanation",
      container: "bg-amber-50/70 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
    },
  };

  const getDefaultDates = () => {
    const start = new Date();
    start.setHours(start.getHours() + 20);
    const end = new Date(start);
    end.setHours(end.getHours() + 20);
    return {
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16)
    };
  };

    const [examInfo, setExamInfo] = useState<any>({
    title: "",
    description: "",
    category: "اللغة العربية",
    type: "Exam",
    duration: 60,
    passingScore: 50,
    isCentral: true,
    schoolIds: [],
    showAnswers: true,
    resultVisibility: "SHOW_ANSWERS",
    password: "",
    startDate: getDefaultDates().start,
    endDate: getDefaultDates().end,
    attemptsAllowed: 1,
    status: "PUBLISHED",
    grades: ["الصف الأول الثانوي"],
    subjects: ["اللغة العربية"],
    skill: "Math",
    level: "Medium",
  });

  useEffect(() => {
    if (typeParam) {
      setExamInfo((prev: any) => ({ ...prev, type: typeParam }));
    }
    if (courseIdParam) {
      setExamInfo((prev: any) => ({ ...prev, courseId: courseIdParam }));
    }
  }, [typeParam, courseIdParam]);

  const QUESTION_TYPES = [
    { id: "MCQ", label: "Multiple Choice (MCQ)", desc: "Select one correct answer" },
    { id: "TRUE_FALSE", label: "True / False", desc: "Select true or false statement" },
    { id: "MULTI_SELECT", label: "Multi-Select", desc: "Select one or more correct answers" },
    { id: "TEXT", label: "Text Slide", desc: "A text block for explanation or summary (No answer required)" }
  ];

  const [questions, setQuestions] = useState<any[]>([]);

    const CATEGORIES = language === 'ar' ? [
    "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
    "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
    "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
    "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
    "SAT Math", "SAT English"
  ] : [
    "Arabic", "English", "French", "German", "Italian",
    "Mathematics", "Physics", "Chemistry", "Biology", "Geology", "Mechanics",
    "History", "Geography", "Philosophy", "Psychology", "Economics", "Statistics",
    "Religious Education", "National Education", "Computer Science",
    "SAT Math", "SAT English"
  ];
  const GRADES = language === 'ar' ? [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ] : [
    "Grade 1 Elementary", "Grade 2 Elementary", "Grade 3 Elementary",
    "Grade 4 Elementary", "Grade 5 Elementary", "Grade 6 Elementary",
    "Grade 1 Middle School", "Grade 2 Middle School", "Grade 3 Middle School",
    "Grade 1 High School", "Grade 2 High School", "Grade 3 High School"
  ];
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

  const INDICATORS = [
    "Indicator 1.1: Listening Comprehension",
    "Indicator 2.1: Analyzing Main Ideas",
    "Indicator 3.1: Applying Grammar Rules",
    "Indicator 4.1: Paragraph Structure",
    "Indicator 5.1: Drawing Conclusions"
  ];

  const VISIBILITY_OPTIONS = [
    { id: "SHOW_SCORE", label: "Score Only", desc: "Student will only see their total score", icon: Eye },
    { id: "SHOW_ANSWERS", label: "Show Correct Answers", desc: "Student can review each question with the correct model answer", icon: CheckCircle },
    { id: "SHOW_MARK_ONLY", label: "Show Correct/Incorrect Only", desc: "Student will see which answers were right or wrong, but not the correct model", icon: HelpCircle },
    { id: "HIDE_ALL", label: "Hide All Results", desc: "No results will be shown until you change this policy", icon: EyeOff },
  ];

  const [customLearningOutcomes, setCustomLearningOutcomes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("custom_learning_outcomes_exams");
      return saved ? JSON.parse(saved) : [
        "Outcome 1: Distinguish Text Types",
        "Outcome 2: Express Ideas Clearly",
        "Outcome 3: Use Accurate Language",
        "Outcome 4: Connect Key Concepts",
        "Outcome 5: Evaluate Content Critically"
      ];
    }
    return [
      "Outcome 1: Distinguish Text Types",
      "Outcome 2: Express Ideas Clearly",
      "Outcome 3: Use Accurate Language",
      "Outcome 4: Connect Key Concepts",
      "Outcome 5: Evaluate Content Critically"
    ];
  });

  const [customStandards, setCustomStandards] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("custom_standards_exams");
      return saved ? JSON.parse(saved) : [
        "Standard 1: Knowledge and Understanding",
        "Standard 2: Application and Analysis",
        "Standard 3: Synthesis and Evaluation",
        "Standard 4: Critical Thinking",
        "Standard 5: Problem Solving"
      ];
    }
    return [
      "Standard 1: Knowledge and Understanding",
      "Standard 2: Application and Analysis",
      "Standard 3: Synthesis and Evaluation",
      "Standard 4: Critical Thinking",
      "Standard 5: Problem Solving"
    ];
  });

  const [customIndicators, setCustomIndicators] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("custom_indicators_exams");
      return saved ? JSON.parse(saved) : [
        "Indicator 1.1: Listening Comprehension",
        "Indicator 2.1: Analyzing Main Ideas",
        "Indicator 3.1: Applying Grammar Rules",
        "Indicator 4.1: Paragraph Structure",
        "Indicator 5.1: Drawing Conclusions"
      ];
    }
    return [
      "Indicator 1.1: Listening Comprehension",
      "Indicator 2.1: Analyzing Main Ideas",
      "Indicator 3.1: Applying Grammar Rules",
      "Indicator 4.1: Paragraph Structure",
      "Indicator 5.1: Drawing Conclusions"
    ];
  });

  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [isIndicatorOpen, setIsIndicatorOpen] = useState(false);
  const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "Math", level: "Medium",
    standard: "",
    indicator: "",
    learningOutcome: "",
    videoUrl: "",
    sections: [{ type: "EXPLANATION", content: "" }], imageUrl: "", correctAnswers: [],
  });

  useEffect(() => {
    localStorage.setItem("custom_standards_exams", JSON.stringify(customStandards));
  }, [customStandards]);

  useEffect(() => {
    localStorage.setItem("custom_indicators_exams", JSON.stringify(customIndicators));
  }, [customIndicators]);

  useEffect(() => {
    localStorage.setItem("custom_learning_outcomes_exams", JSON.stringify(customLearningOutcomes));
  }, [customLearningOutcomes]);

  const questionsExcelRef = useRef<HTMLInputElement>(null);

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
          showToast("No valid questions found in the file", "error");
          return;
        }

        const newStds = Array.from(new Set(parsed.map(q => q.standard).filter(Boolean)));
        const newInds = Array.from(new Set(parsed.map(q => q.indicator).filter(Boolean)));
        const newLos = Array.from(new Set(parsed.map(q => q.learningOutcome).filter(Boolean)));

        setCustomStandards(prev => Array.from(new Set([...prev, ...newStds])));
        setCustomIndicators(prev => Array.from(new Set([...prev, ...newInds])));
        setCustomLearningOutcomes(prev => Array.from(new Set([...prev, ...newLos])));

        setQuestions(prev => [...prev, ...parsed]);

        showToast(`Successfully imported ${parsed.length} questions`, "success");
      } catch (err) {
        console.error(err);
        showToast("Error reading Excel file", "error");
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
        "What is 5 + 5?",
        "MCQ",
        "8", "9", "10", "11", "",
        "10", "", "1", "Math",
        "Standard 1: Operations",
        "Indicator 1.1: Addition",
        "Outcome 1: Solve additions",
        "Easy",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "5 + 5 equals 10"
      ],
      [
        "The earth is round.",
        "TRUE_FALSE",
        "", "", "", "", "",
        "True", "", "1", "General",
        "Standard 2: Earth Shape",
        "Indicator 2.1: Planets",
        "Outcome 2: Physical shape",
        "Easy", "", ""
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions Template");
    XLSX.writeFile(wb, "exams_questions_template.xlsx");
    showToast("Questions template downloaded successfully", "success");
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setFetchingSchools(true);
    setFetchError("");
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("lms_token") || localStorage.getItem("token");
      const schoolsRes = await fetch(`${API_URL}/admin/schools?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const schoolsData = await schoolsRes.json();
      
      if (schoolsRes.ok) {
        const schoolsList = Array.isArray(schoolsData) ? schoolsData : (schoolsData.schools || []);
        setSchools(schoolsList);
      } else {
        setFetchError("فشل في جلب قائمة المدارس");
      }
    } catch (e) {
      console.error(e);
      setFetchError("خطأ في الاتصال بالسيرفر");
    } finally {
      setFetchingSchools(false);
    }
  };

  const handleAddQuestion = (type: string = 'MCQ') => {
    setCurrentQuestion({
      text: "", type, options: type === 'TRUE_FALSE' ? ["صحيح", "خطأ", "", ""] : ["", "", "", ""],
      correctAnswer: "", points: type === 'TEXT' ? 0 : 1, skill: "Math", level: "Medium",
      standard: "",
      learningOutcome: "",
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
      showToast("Please enter the slide/question text or content", "error");
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

  const handleSelectAll = () => {
    if (examInfo.schoolIds.length === schools.length) {
      setExamInfo({...examInfo, schoolIds: []});
    } else {
      setExamInfo({...examInfo, schoolIds: schools.map(s => s.id)});
    }
  };

  const toggleSubject = (subject: string) => {
    const currentSubjects = examInfo.subjects || [];
    const nextSubjects = currentSubjects.includes(subject)
      ? currentSubjects.filter((item: string) => item !== subject)
      : [...currentSubjects, subject];

    setExamInfo({
      ...examInfo,
      subjects: nextSubjects,
      category: nextSubjects[0] || ""
    });
  };

    // Auto-save interval
  useEffect(() => {
    if (!isAutoSaveEnabled) return;
    
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("super_admin_token");
        if (!token) return;

        const questionsPayload = questions.map(q => ({
          ...q,
          explanation: JSON.stringify(q.sections || [])
        }));
        
        const payload = {
          ...examInfo,
          title: examInfo.title || (language === 'ar' 
            ? (examInfo.type === 'ASSIGNMENT' ? "مسودة تكليف بدون عنوان" : "مسودة اختبار بدون عنوان")
            : (examInfo.type === 'ASSIGNMENT' ? "Untitled Assignment Draft" : "Untitled Exam Draft")),
          category: examInfo.subjects?.[0] || "غير محدد",
          status: "DRAFT",
          questions: questionsPayload
        };

        const method = createdId ? "PUT" : "POST";
        const url = createdId 
          ? `${API_URL}/exams/${createdId}`
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
          if (!createdId && data.exam?.id) {
             setCreatedId(data.exam.id);
          }
          setLastAutoSave(new Date());
        }
      } catch (err) {
        console.error("Auto save failed", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAutoSaveEnabled, createdId, examInfo, questions, language]);

  const handleSubmit = async (status: string = "PUBLISHED") => {
    if (!examInfo.title) {
      showToast("Please enter the exam title", 'error');
      return;
    }

    if (!examInfo.subjects || examInfo.subjects.length === 0) {
      showToast("Please select at least one subject", 'error');
      return;
    }

    if (questions.length === 0) {
      showToast("Please add at least one question or slide", 'error');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("super_admin_token");
      const questionsPayload = questions.map(q => ({
        ...q,
        explanation: JSON.stringify(q.sections || [])
      }));

            const method = createdId ? "PUT" : "POST";
      const url = createdId ? `${API_URL}/exams/${createdId}` : `${API_URL}/exams`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...examInfo, category: examInfo.subjects[0], status, questions: questionsPayload }),
      });

      if (res.ok) {
        showToast(status === "DRAFT" ? "Draft saved successfully!" : "Exam published successfully!", 'success');
        router.push("/super-admin/exams");
      } else {
        let errMessage = "Failed to add exam";
        try {
          const err = await res.json();
          errMessage = err.error || errMessage;
        } catch (e) {
          if (res.status === 413) errMessage = "حجم البيانات كبير جداً (Payload Too Large). يرجى تقليل حجم الصور المستخدمة.";
          else errMessage = `خطأ في الخادم: ${res.status}`;
        }
        showToast(errMessage, 'error');
      }
    } catch (error) {
      console.error("Exam save error:", error);
      showToast("حدث خطأ غير متوقع. يرجى التحقق من اتصالك.", 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
        <DashboardLayout>
      <div className={`max-w-7xl mx-auto flex flex-col gap-10 pb-20 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Command Center Header */}
        <div className="bg-[#0f0f1d] p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden border border-white/5">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-4 justify-center lg:justify-start mb-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                  <ListPlus className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  Create Central Exam
                </h2>
              </div>
              <p className="text-slate-400 mt-2 text-lg font-medium max-w-2xl leading-relaxed">
                Design your central exams with high precision. Control scheduling, passwords, and result policies for all target schools.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-center">
                            <button 
                onClick={() => handleSubmit("DRAFT")}
                disabled={saving}
                className="px-8 py-5 rounded-2xl font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <span>{language === 'ar' ? "حفظ كمسودة" : "Save as Draft"}</span>
                <FileText className="w-5 h-5 shrink-0" />
              </button>
              
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 mr-4">
                <span className="text-sm font-bold text-white">{language === 'ar' ? "الحفظ التلقائي" : "Auto Save"}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isAutoSaveEnabled} onChange={(e) => {
                    setIsAutoSaveEnabled(e.target.checked);
                    if (e.target.checked) {
                      showToast(language === 'ar' ? "تم تفعيل الحفظ التلقائي (سيتم حفظ مسودة دورياً)" : "Auto-save enabled (will save draft periodically)", "info");
                    } else {
                      showToast(language === 'ar' ? "تم إيقاف الحفظ التلقائي" : "Auto-save disabled", "info");
                    }
                  }} />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              {lastAutoSave && (
                <div className="text-xs font-bold text-white/70 bg-white/5 px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span dir="ltr">{lastAutoSave.toLocaleTimeString()}</span>
                  <span>{language === 'ar' ? "آخر حفظ:" : "Last Auto Save:"}</span>
                </div>
              )}
              
              <button 
                onClick={() => handleSubmit("PUBLISHED")}
                disabled={saving}
                className="px-10 py-5 rounded-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-900/40 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                                <span>{saving ? "Processing..." : (language === 'ar' ? (examInfo.type === 'ASSIGNMENT' ? "نشر التكليف" : "نشر الاختبار") : (examInfo.type === 'ASSIGNMENT' ? "Publish Assignment" : "Publish Exam"))}</span>
                <Globe className="w-6 h-6 shrink-0" />
              </button>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-[120px] -ml-48 -mb-48"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* General Info Card */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-8">
                            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg border-b border-slate-50 pb-6">
                <Settings className="w-6 h-6 text-indigo-600" />
                {language === 'ar' ? "الإعدادات العامة" : "General Settings"}
              </h3>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المواد الدراسية" : "Subjects"}</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[170px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <label key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${examInfo.subjects.includes(cat) ? 'bg-indigo-100 border-indigo-300 text-indigo-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <input
                           type="checkbox"
                           className="hidden"
                           checked={examInfo.subjects.includes(cat)}
                           onChange={() => toggleSubject(cat)}
                        />
                        {examInfo.subjects.includes(cat) && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        <span className="text-xs font-bold">{cat}</span>
                      </label>
                    ))}
                  </div>
                                    <p className="text-[9px] text-slate-400 font-bold px-1">
                    {language === 'ar' 
                      ? (examInfo.type === 'ASSIGNMENT' ? "يمكنك اختيار أكثر من مادة لهذا التكليف." : "يمكنك اختيار أكثر من مادة لهذا الاختبار.") 
                      : (examInfo.type === 'ASSIGNMENT' ? "You can select multiple subjects for this assignment." : "You can select multiple subjects for this exam.")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المراحل الدراسية" : "Grade Levels"}</label>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-[120px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                      {GRADES.map(g => (
                        <label key={g} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${examInfo.grades.includes(g) ? 'bg-indigo-100 border-indigo-300 text-indigo-900 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          <input type="checkbox" className="hidden" checked={examInfo.grades.includes(g)} onChange={(e) => {
                            if(e.target.checked) setExamInfo({...examInfo, grades: [...examInfo.grades, g]});
                            else setExamInfo({...examInfo, grades: examInfo.grades.filter((gr: string) => gr !== g)});
                          }} />
                          {examInfo.grades.includes(g) && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                          <span className="text-xs font-bold">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? (examInfo.type === 'ASSIGNMENT' ? "المدة (بالدقائق)" : "مدة الاختبار (بالدقائق)") : (examInfo.type === 'ASSIGNMENT' ? "Duration (min)" : "Exam Duration (min)")}</label>
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
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? (examInfo.type === 'ASSIGNMENT' ? "كلمة مرور التكليف (اختياري)" : "كلمة مرور الاختبار (اختياري)") : (examInfo.type === 'ASSIGNMENT' ? "Assignment Password (Optional)" : "Exam Password (Optional)")}</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. SAT2026"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                      value={examInfo.password}
                      onChange={(e) => setExamInfo({...examInfo, password: e.target.value})}
                    />
                    <Lock className="w-4 h-4 text-slate-300 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill</label>
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

                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'ar' ? (examInfo.type === 'ASSIGNMENT' ? "سياسة ظهور التقييم للطلاب" : "سياسة ظهور نتائج الاختبار") : (examInfo.type === 'ASSIGNMENT' ? "Submission & Grading Policy" : "Result Visibility Policy")}</label>
                  <div className="flex flex-col gap-3">
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${examInfo.resultVisibility === opt.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <input 
                          type="radio" 
                          name="resultVisibility" 
                          value={opt.id}
                          checked={examInfo.resultVisibility === opt.id}
                          onChange={(e) => setExamInfo({...examInfo, resultVisibility: e.target.value})}
                          className="hidden"
                        />
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${examInfo.resultVisibility === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>
                          <opt.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black ${examInfo.resultVisibility === opt.id ? 'text-indigo-900' : 'text-slate-700'}`}>{language === 'ar' ? (opt.id === 'SHOW_SCORE' ? "الدرجة فقط" : opt.id === 'SHOW_ANSWERS' ? "عرض الإجابات الصحيحة" : opt.id === 'SHOW_MARK_ONLY' ? "عرض صح/خطأ فقط" : "إخفاء جميع النتائج") : opt.label}</span>
                           <span className="text-[10px] font-bold text-slate-400">{language === 'ar' ? (opt.id === 'SHOW_SCORE' ? "سيرى الطالب الدرجة النهائية فقط" : opt.id === 'SHOW_ANSWERS' ? "يمكن للطالب مراجعة كل سؤال مع نموذج الإجابة الصحيحة" : opt.id === 'SHOW_MARK_ONLY' ? "سيرى الطالب الإجابات الصحيحة والخاطئة فقط، دون عرض نموذج الإجابة الصحيحة" : "لن يتم عرض أي نتائج أو درجات للطلاب حتى تقوم بتغيير هذه السياسة") : opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling Card */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-8">
                            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg border-b border-slate-50 pb-6">
                <Calendar className="w-6 h-6 text-indigo-600" />
                {language === 'ar' ? "الجدولة والتحكم" : "Scheduling & Control"}
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ ووقت البدء" : "Start Date"}</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      value={examInfo.startDate}
                      onChange={(e) => setExamInfo({...examInfo, startDate: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ ووقت الانتهاء" : "End Date"}</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      value={examInfo.endDate}
                      onChange={(e) => setExamInfo({...examInfo, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المحاولات المسموح بها" : "Allowed Attempts"}</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                    value={examInfo.attemptsAllowed}
                    onChange={(e) => setExamInfo({...examInfo, attemptsAllowed: parseInt(e.target.value)})}
                  >
                                        <option value={1}>{language === 'ar' ? "محاولة واحدة فقط" : "1 Attempt Only"}</option>
                    <option value={2}>{language === 'ar' ? "محاولتان" : "2 Attempts"}</option>
                    <option value={3}>{language === 'ar' ? "3 محاولات" : "3 Attempts"}</option>
                    <option value={999}>{language === 'ar' ? "غير محدود" : "Unlimited"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* School Selection Card */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
                  <Globe className="w-6 h-6 text-indigo-600" />
                  {language === 'ar' ? "المدارس المستهدفة" : "Target Schools"}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                                <button 
                  onClick={() => setExamInfo({...examInfo, isCentral: true})}
                  className={`py-3 rounded-xl font-bold text-xs transition-all ${examInfo.isCentral ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500'}`}
                >
                  {language === 'ar' ? "جميع المدارس (مركزي)" : "All Schools (Central)"}
                </button>
                <button 
                  onClick={() => setExamInfo({...examInfo, isCentral: false})}
                  className={`py-3 rounded-xl font-bold text-xs transition-all ${!examInfo.isCentral ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500'}`}
                >
                  {language === 'ar' ? "مدارس محددة" : "Specific Schools"}
                </button>
              </div>

              {!examInfo.isCentral && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {fetchingSchools ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                            <span className="text-xs font-bold">{language === 'ar' ? "جاري تحميل المدارس المستهدفة..." : "Loading target schools..."}</span>
                    </div>
                  ) : fetchError ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4 text-center bg-red-50 rounded-2xl border border-red-100">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-red-900">{fetchError}</p>
                        <p className="text-[10px] text-red-600 font-bold">Please check your server connection.</p>
                      </div>
                      <button 
                        onClick={fetchSchools}
                        className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        Retry
                      </button>
                    </div>
                  ) : schools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Globe className="w-8 h-8 text-slate-300" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-600">No schools added</p>
                        <p className="text-[10px] text-slate-400 font-bold">No schools found in the database.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center px-2 mb-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "اختر المدارس من القائمة:" : "Select schools from list:"}</label>
                        <button onClick={handleSelectAll} className="text-[10px] font-black text-indigo-600 hover:underline">
                          {examInfo.schoolIds.length === schools.length ? (language === 'ar' ? "إلغاء تحديد الكل" : "Deselect All") : (language === 'ar' ? "تحديد جميع المدارس" : "Select All Schools")}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {schools.map((school: any) => (
                          <label key={school.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${examInfo.schoolIds.includes(school.id) ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-transparent hover:border-slate-200'}`}>
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${examInfo.schoolIds.includes(school.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'}`}>
                              {examInfo.schoolIds.includes(school.id) && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className={`text-xs font-bold ${examInfo.schoolIds.includes(school.id) ? 'text-indigo-900' : 'text-slate-600'}`}>{school.name}</span>
                            <input type="checkbox" className="hidden" checked={examInfo.schoolIds.includes(school.id)} onChange={(e) => {
                              if(e.target.checked) setExamInfo({...examInfo, schoolIds: [...examInfo.schoolIds, school.id]});
                              else setExamInfo({...examInfo, schoolIds: examInfo.schoolIds.filter((id: string) => id !== school.id)});
                            }} />
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Questions Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                              <label className="text-sm font-black text-slate-400 mb-3 block uppercase tracking-widest">{language === 'ar' ? (examInfo.type === 'ASSIGNMENT' ? "عنوان التكليف" : "عنوان الاختبار") : (examInfo.type === 'ASSIGNMENT' ? "Assignment Title" : "Exam Title")}</label>
               <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-[25px] px-8 py-6 text-2xl md:text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all text-slate-800"
                                placeholder={language === 'ar' ? (examInfo.type === 'ASSIGNMENT' ? "أدخل عنوان التكليف هنا..." : "أدخل عنوان الاختبار هنا...") : (examInfo.type === 'ASSIGNMENT' ? "Enter assignment title here..." : "Enter exam title here...")}
                value={examInfo.title}
                onChange={(e) => setExamInfo({...examInfo, title: e.target.value})}
              />
            </div>

            {/* Questions List Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-slate-800">Exam Slides ({questions.length})</h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                  {questions.reduce((sum, q) => sum + (q.points || 0), 0)} total points
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
                  <span>{language === 'ar' ? "استيراد من إكسيل" : "Import Excel"}</span>
                </button>
                <button 
                  onClick={downloadQuestionsTemplate}
                  className="flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm border border-sky-200 whitespace-nowrap shrink-0 cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{language === 'ar' ? "تحميل نموذج" : "Template"}</span>
                </button>
                <button 
                  onClick={() => handleAddQuestion('TEXT')}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>{language === 'ar' ? "شريحة نصية" : "Text Slide"}</span>
                </button>
                <button 
                  onClick={() => handleAddQuestion('MCQ')}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap shrink-0 cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4 shrink-0 text-white" />
                  <span>{language === 'ar' ? "شريحة سؤال" : "Question Slide"}</span>
                </button>
              </div>
            </div>

            {/* Questions Management Flow */}
            <div className="flex flex-col gap-6">
              {questions.length === 0 && !showQuestionForm && (
                <div className="bg-white rounded-[40px] border-4 border-dashed border-slate-100 p-20 flex flex-col items-center justify-center text-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-[35px] flex items-center justify-center text-slate-200">
                    <HelpCircle className="w-12 h-12" />
                  </div>
                  <div>
                                    <h4 className="text-2xl font-black text-slate-800 mb-2">{language === 'ar' ? "لا توجد شرائح بعد" : "No slides yet"}</h4>
                <p className="text-slate-400 font-medium max-w-sm">
                  {language === 'ar' 
                    ? (examInfo.type === 'ASSIGNMENT' ? "ابدأ بإضافة أول شريحة نصية أو شريحة سؤال لهذا التكليف." : "ابدأ بإضافة أول شريحة نصية أو شريحة سؤال لهذا الاختبار.") 
                    : (examInfo.type === 'ASSIGNMENT' ? "Start by adding your first text slide or question slide for this assignment." : "Start by adding your first text slide or question slide for this exam.")}
                </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAddQuestion('TEXT')}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-800 px-10 py-5 rounded-3xl font-black hover:scale-105 transition-all shadow-md border border-slate-200 whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-6 h-6 shrink-0 text-slate-600" />
                      <span>{language === 'ar' ? "إضافة شريحة نصية" : "Add Text Slide"}</span>
                    </button>
                    <button 
                      onClick={() => handleAddQuestion('MCQ')}
                      className="bg-[#0f0f1d] hover:bg-[#16162a] text-white px-10 py-5 rounded-3xl font-black hover:scale-105 transition-all shadow-2xl whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-6 h-6 shrink-0 text-indigo-400" />
                      <span>{language === 'ar' ? "إضافة شريحة سؤال" : "Add Question Slide"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Question Form (Add/Edit) */}
              {showQuestionForm && (
                <div className="bg-white rounded-[40px] border-2 border-indigo-500 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center">
                    <h4 className="text-white font-black flex items-center gap-3">
                      <Edit3 className="w-5 h-5" />
                                            {editingIndex !== null ? (language === 'ar' ? `تعديل الشريحة #${editingIndex + 1}` : `Edit Slide #${editingIndex + 1}`) : (language === 'ar' ? "إضافة شريحة جديدة" : "Add New Slide")}
                    </h4>
                    <button 
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نوع الشريحة" : "Slide Type"}</label>
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

                      {/* Custom Standard with CRUD */}
                                            <div className="flex flex-col gap-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المعيار" : "Standard"}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsStandardOpen(!isStandardOpen);
                            setIsIndicatorOpen(false);
                            setIsOutcomeOpen(false);
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold text-xs outline-none text-right flex justify-between items-center cursor-pointer min-h-[34px]"
                        >
                                                    <span className="truncate">{currentQuestion.standard || (language === 'ar' ? "اختر المعيار..." : "Select Standard...")}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        
                        {isStandardOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsStandardOpen(false)}></div>
                            <div className="absolute top-full left-0 z-50 w-72 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
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
                                        const newVal = prompt("Edit Custom Standard:", opt);
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
                                  const newVal = prompt("Enter new custom standard:");
                                  if (newVal && newVal.trim()) {
                                    setCustomStandards(prev => [...prev, newVal.trim()]);
                                    updateCurrentQuestion("standard", newVal.trim());
                                    setIsStandardOpen(false);
                                  }
                                }}
                                className="w-full text-center py-2 text-indigo-600 font-black text-xs hover:bg-indigo-50 border-t border-dashed border-slate-100 rounded-b-xl flex items-center justify-center gap-1 mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Custom Standard</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Custom Indicator with CRUD */}
                                            <div className="flex flex-col gap-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المؤشر" : "Indicator"}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsIndicatorOpen(!isIndicatorOpen);
                            setIsStandardOpen(false);
                            setIsOutcomeOpen(false);
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold text-xs outline-none text-right flex justify-between items-center cursor-pointer min-h-[34px]"
                        >
                                                    <span className="truncate">{currentQuestion.indicator || (language === 'ar' ? "اختر المؤشر..." : "Select Indicator...")}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        
                        {isIndicatorOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsIndicatorOpen(false)}></div>
                            <div className="absolute top-full left-0 z-50 w-72 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
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
                                        const newVal = prompt("Edit Custom Indicator:", opt);
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
                                  const newVal = prompt("Enter new custom indicator:");
                                  if (newVal && newVal.trim()) {
                                    setCustomIndicators(prev => [...prev, newVal.trim()]);
                                    updateCurrentQuestion("indicator", newVal.trim());
                                    setIsIndicatorOpen(false);
                                  }
                                }}
                                className="w-full text-center py-2 text-indigo-600 font-black text-xs hover:bg-indigo-50 border-t border-dashed border-slate-100 rounded-b-xl flex items-center justify-center gap-1 mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Custom Indicator</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Custom Learning Outcome with CRUD */}
                                            <div className="flex flex-col gap-2 relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "ناتج التعلم" : "Learning Outcome"}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOutcomeOpen(!isOutcomeOpen);
                            setIsStandardOpen(false);
                            setIsIndicatorOpen(false);
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold text-xs outline-none text-right flex justify-between items-center cursor-pointer min-h-[34px]"
                        >
                          <span className="truncate">{currentQuestion.learningOutcome || "Select Learning Outcome..."}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        
                        {isOutcomeOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOutcomeOpen(false)}></div>
                            <div className="absolute top-full left-0 z-50 w-72 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
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
                                        const newVal = prompt("Edit Custom Learning Outcome:", opt);
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
                                  const newVal = prompt("Enter new custom outcome:");
                                  if (newVal && newVal.trim()) {
                                    setCustomLearningOutcomes(prev => [...prev, newVal.trim()]);
                                    updateCurrentQuestion("learningOutcome", newVal.trim());
                                    setIsOutcomeOpen(false);
                                  }
                                }}
                                className="w-full text-center py-2 text-indigo-600 font-black text-xs hover:bg-indigo-50 border-t border-dashed border-slate-100 rounded-b-xl flex items-center justify-center gap-1 mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Custom Outcome</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill</label>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "مستوى الصعوبة" : "Difficulty Level"}</label>
                        <select 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                          value={currentQuestion.level}
                          onChange={(e) => updateCurrentQuestion("level", e.target.value)}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      {currentQuestion.type !== 'TEXT' && (
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</label>
                          <input 
                            type="number"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                            value={currentQuestion.points}
                            onChange={(e) => updateCurrentQuestion("points", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional Video Link (YouTube/Vimeo)</label>
                        <input 
                          type="url"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white min-h-[34px]"
                          value={currentQuestion.videoUrl || ""}
                          onChange={(e) => updateCurrentQuestion("videoUrl", e.target.value)}
                          placeholder="Paste video URL here..."
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Content / Question Text</label>
                      <RichTextEditor
                        value={currentQuestion.text}
                        onChange={(value) => updateCurrentQuestion("text", value)}
                        placeholder="Write the slide text or question prompt here..."
                      />
                    </div>

                    {/* Dynamic Explanation Blocks */}
                    <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Answer Explanations & Content Blocks</label>
                          <p className="text-slate-400 text-[10px] font-bold mt-0.5">Add Hints, Tips, Warnings, or detailed Explanations for this slide/question</p>
                        </div>
                        <div className="relative" data-dropdown-root="true">
                          <button 
                            type="button"
                            onClick={() => setOpenDropdownId(openDropdownId === 'question-sections' ? null : 'question-sections')}
                            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border border-indigo-100"
                          >
                            <Plus className="w-4 h-4" /> Add Block
                          </button>
                          <div className={`absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 ${openDropdownId === 'question-sections' ? "block" : "hidden"}`}>
                            {['EXPLANATION', 'HINT', 'TIP', 'WARNING', 'KEY_INSIGHT'].map(secType => (
                              <button
                                key={secType}
                                type="button"
                                onClick={() => {
                                   addSection(secType);
                                   setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2"
                              >
                                {React.createElement(SECTION_STYLE_PRESETS[secType]?.icon || FileText, { className: "w-4 h-4" })}
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
                                placeholder={`Write ${preset.label.toLowerCase()} content here...`}
                                className="!bg-white !border-slate-200"
                              />
                            </div>
                          );
                        })}
                        {(currentQuestion.sections || []).length === 0 && (
                          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-bold">
                            No explanations or content blocks added yet. Click "Add Block" to insert a Hint, Tip, Warning, etc.
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
                              <span className="bg-transparent flex-1 outline-none font-bold text-slate-700">True</span>
                            </div>
                            <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isCorrectAnswer(currentQuestion, "خطأ") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                              <div 
                                onClick={() => updateCorrectAnswers(1)}
                                className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isCorrectAnswer(currentQuestion, "خطأ") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                              >
                                {isCorrectAnswer(currentQuestion, "خطأ") && <CheckCircle className="w-5 h-5 text-white" />}
                              </div>
                              <span className="bg-transparent flex-1 outline-none font-bold text-slate-700">False</span>
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
                                 <MathInput 
                                   placeholder={`Option ${oIndex + 1}`}
                                   className="bg-transparent flex-1"
                                   value={opt}
                                   onChange={(val) => updateOption(oIndex, val)}
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
                            <div onClick={() => setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, ""] })} className="flex items-center justify-center gap-2 p-5 rounded-[22px] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer text-indigo-600 font-bold">
                              <Plus className="w-5 h-5" />
                              Add Option
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                                            <button
                        onClick={() => setShowQuestionForm(false)}
                        className="px-8 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all whitespace-nowrap shrink-0"
                      >
                        {language === 'ar' ? "إلغاء" : "Cancel"}
                      </button>
                      <button 
                        onClick={handleSaveQuestion}
                        className="px-10 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 whitespace-nowrap shrink-0"
                      >
                                                <span>{language === 'ar' ? "حفظ الشريحة" : "Save Slide"}</span>
                        <Save className="w-5 h-5 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Questions List */}
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{QUESTION_TYPES.find(t => t.id === q.type)?.label}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{q.level} • {q.points} {q.points === 1 ? "point" : "points"}</span>
                            {q.standard && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{q.standard}</span>}
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
                          title={expandedIndex === index ? "Collapse" : "Expand"}
                        >
                          {expandedIndex === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => setPreviewQuestion(q)}
                          className="w-10 h-10 bg-indigo-50 text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                          title={language === 'ar' ? "معاينة الطالب" : "Student Preview"}
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleEditQuestion(index)}
                          className="w-10 h-10 bg-blue-50 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                          title={language === 'ar' ? "تعديل" : "Edit"}
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => removeQuestion(index)}
                          className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                          title={language === 'ar' ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedIndex === index && (
                      <div className="px-8 pb-8 pt-4 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                                                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "محتوى الشريحة:" : "Slide Content:"}</h5>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.text) }} />
                            
                            {q.learningOutcome && (
                              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 w-fit">
                                <Target className="w-4 h-4" />
                                                                <span className="text-[10px] font-black uppercase">{language === 'ar' ? "ناتج التعلم:" : "Learning Outcome:"} {q.learningOutcome}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                                                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "الخيارات:" : "Options:"}</h5>
                            <div className="flex flex-col gap-2">
                              {q.type === "MCQ" || q.type === "MULTI_SELECT" ? (
                                q.options.filter((o: string) => o).map((opt: string, i: number) => (
                                  <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 ${isCorrectAnswer(q, opt) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                    {isCorrectAnswer(q, opt) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                                    <span className="font-bold text-sm">{opt}</span>
                                  </div>
                                ))
                              ) : q.type === "TRUE_FALSE" ? (
                                ["True", "False"].map((opt, i) => {
                                  const isCorrect = isCorrectAnswer(q, opt === "True" ? "صحيح" : "خطأ");
                                  return (
                                    <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                      {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                                      <span className="font-bold text-sm">{opt}</span>
                                    </div>
                                  );
                                })
                              ) : (
                                                          <div className="text-xs font-bold text-slate-400">{language === 'ar' ? "شريحة محتوى (لا تتطلب إجابات)" : "Content slide (No answers required)"}</div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 ltr" dir="ltr">
          <div className="absolute inset-0 bg-[#0f0f1d]/80 backdrop-blur-xl" onClick={() => setPreviewQuestion(null)}></div>
          <div className="relative bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-[50px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800">Student Preview</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">This is exactly how it will appear in the student interface.</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewQuestion(null)}
                className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - Student View Mockup */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 md:p-16">
               <div className="max-w-2xl mx-auto space-y-12">
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      {QUESTION_TYPES.find(t => t.id === previewQuestion.type)?.label || previewQuestion.type}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                      {previewQuestion.skill} | {previewQuestion.level}
                    </span>
                  </div>

                  {previewQuestion.learningOutcome && (
                    <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 w-fit">
                      <Target className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest">{language === 'ar' ? "ناتج التعلم:" : "Learning Outcome:"} {previewQuestion.learningOutcome}</span>
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
                    <div className="relative w-full aspect-video rounded-[30px] overflow-hidden shadow-xl border border-slate-100">
                      <VideoPlayer url={previewQuestion.videoUrl} />
                    </div>
                  )}

                  {previewQuestion.type !== "TEXT" && (
                    <div className="flex flex-col gap-4">
                      {(previewQuestion.type === "MCQ" || previewQuestion.type === "MULTI_SELECT" ? previewQuestion.options : ["True", "False"]).filter((o: string) => o).map((option: string, i: number) => (
                        <button
                          key={i}
                          className="w-full text-left p-6 rounded-3xl border-2 border-slate-100 bg-white hover:border-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center gap-5 group"
                        >
                          <div className="w-7 h-7 rounded-full border-2 border-slate-200 group-hover:border-indigo-600 flex items-center justify-center transition-all">
                            <div className="w-3 h-3 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>
                          </div>
                          <span className="text-xl font-bold text-slate-700 group-hover:text-indigo-900"><HtmlRenderer html={option} tag="span" /></span>
                        </button>
                      ))}
                    </div>
                  )}
               </div>
            </div>

                         {/* Modal Footer */}
             <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                <button 
                 onClick={() => setPreviewQuestion(null)}
                 className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
                >
                  {language === 'ar' ? "إغلاق المعاينة" : "Close Preview"}
                </button>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


