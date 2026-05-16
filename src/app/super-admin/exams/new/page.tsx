"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Save, Plus, Trash2, Image as ImageIcon, CheckCircle, HelpCircle, 
  ArrowRight, Settings, ListPlus, Globe, Layout, Loader2, 
  Clock, Lock, Calendar, Eye, EyeOff, FileText, AlertCircle,
  Bold, Italic, Underline, List, ListOrdered, AlignRight, Code,
  ChevronDown, ChevronUp, Edit3, Play, GripVertical, X, CheckCircle2, Target
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

import { API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";

export default function SuperAdminNewExamPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [fetchingSchools, setFetchingSchools] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // UI States
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
    resultVisibility: "SHOW_SCORE",
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

  const QUESTION_TYPES = [
    { id: "MCQ", label: "اختيار من متعدد", desc: "اختر إجابة واحدة صحيحة" },
    { id: "TRUE_FALSE", label: "صح وخطأ", desc: "حدد إذا كانت العبارة صحيحة أم خاطئة" },
    { id: "MULTI_SELECT", label: "اختيار متعدد", desc: "اختر جميع الإجابات الصحيحة" }
  ];

  const [questions, setQuestions] = useState<any[]>([]);

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
  const SKILLS = [
    "Math", "Physics", "Chemistry", "Biology", "Geology", "Mechanics",
    "History", "Geography", "Philosophy", "Psychology", "Economics", "Statistics",
    "Computer Science", "Arabic", "English", "French", "German", "Italian",
    "Religious Education", "National Education", "SAT Reading", "SAT Writing"
  ];

  const INDICATORS = [
    "المؤشر 1.1: فهم النص المسموع",
    "المؤشر 2.1: تحليل الأفكار الرئيسية",
    "المؤشر 3.1: تطبيق القواعد النحوية",
    "المؤشر 4.1: تنظيم الفقرات",
    "المؤشر 5.1: استنتاج النتائج"
  ];

  const LEARNING_OUTCOMES = [
    "الناتج 1: يميز بين أنواع النصوص",
    "الناتج 2: يعبر عن أفكاره بوضوح",
    "الناتج 3: يستخدم لغة سليمة",
    "الناتج 4: يربط بين المفاهيم",
    "الناتج 5: يقيم المحتوى بمهارة"
  ];

  const STANDARDS = [
    "المعيار 1: المعرفة والفهم",
    "المعيار 2: التطبيق والتحليل",
    "المعيار 3: التركيب والتقويم",
    "المعيار 4: التفكير النقدي",
    "المعيار 5: حل المشكلات"
  ];

  const VISIBILITY_OPTIONS = [
    { id: "SHOW_SCORE", label: "الدرجة فقط", desc: "سيرى الطالب مجموع درجاته فقط", icon: Eye },
    { id: "SHOW_ANSWERS", label: "الإجابات الصحيحة", desc: "سيتمكن الطالب من مراجعة كل إجابة مع النموذج الصحيح", icon: CheckCircle },
    { id: "SHOW_MARK_ONLY", label: "الصح والغلط", desc: "سيرى الطالب إذا كانت إجابته صحيحة أم خاطئة بدون معرفة النموذج الصحيح", icon: HelpCircle },
    { id: "HIDE_ALL", label: "إخفاء النتائج بالكامل", desc: "لن تظهر أي نتائج حتى تقوم بتغيير هذه السياسة", icon: EyeOff },
  ];

  const [currentQuestion, setCurrentQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "Math", level: "Medium",
    standard: "",
    learningOutcome: "",
    explanation: "", imageUrl: "", correctAnswers: [],
  });

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

  const handleAddQuestion = () => {
    setCurrentQuestion({
      text: "", type: "MCQ", options: ["", "", "", ""],
      correctAnswer: "", points: 1, skill: "Math", level: "Medium",
      standard: "",
      learningOutcome: "",
      explanation: "", imageUrl: "", correctAnswers: [],
    });
    setEditingIndex(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion({ ...questions[index] });
    setEditingIndex(index);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion.text) {
      showToast("يرجى إدخال نص السؤال", "error");
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

  const handleSubmit = async (status: string = "PUBLISHED") => {
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
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...examInfo, status, questions }),
      });

      if (res.ok) {
        showToast(status === "DRAFT" ? "تم حفظ المسودة بنجاح!" : "تم نشر الامتحان بنجاح!", 'success');
        router.push("/super-admin/exams");
      } else {
        let errMessage = "خطأ في الإضافة";
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
      <div className="max-w-7xl mx-auto flex flex-col gap-10 pb-20 rtl" dir="rtl">
        {/* Command Center Header */}
        <div className="bg-[#0f0f1d] p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden border border-white/5">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-right">
              <div className="flex items-center gap-4 justify-center lg:justify-start mb-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                  <ListPlus className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  إنشاء امتحان احترافي
                </h2>
              </div>
              <p className="text-slate-400 mt-2 text-lg font-medium max-w-2xl leading-relaxed">
                صمم امتحاناتك المركزية بدقة عالية، تحكم في المواعيد، كلمات السر، وسياسات النتائج لجميع المدارس.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-center">
              <button 
                onClick={() => handleSubmit("DRAFT")}
                disabled={saving}
                className="px-8 py-5 rounded-2xl font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                حفظ كمسودة
                <FileText className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => handleSubmit("PUBLISHED")}
                disabled={saving}
                className="px-10 py-5 rounded-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-900/40 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? "جاري المعالجة..." : "نشر الامتحان"}
                <Globe className="w-6 h-6" />
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
                الإعدادات الأساسية
              </h3>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المواد (Subjects)</label>
                  <select 
                    multiple
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-black text-xs focus:ring-2 focus:ring-indigo-500/20 min-h-[120px]"
                    value={examInfo.subjects}
                    onChange={(e) => {
                       const values = Array.from(e.target.selectedOptions, option => option.value);
                       setExamInfo({...examInfo, subjects: values});
                    }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="py-1">{cat}</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400 font-bold px-1">استخدم Ctrl للاختيار المتعدد</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المراحل الدراسية</label>
                    <select 
                      multiple
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none font-bold text-black text-xs focus:ring-2 focus:ring-indigo-500/20 min-h-[120px]"
                      value={examInfo.grades}
                      onChange={(e) => {
                         const values = Array.from(e.target.selectedOptions, option => option.value);
                         setExamInfo({...examInfo, grades: values});
                      }}
                    >
                      {GRADES.map(g => <option key={g} value={g} className="py-1">{g}</option>)}
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
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">كلمة سر الامتحان (اختياري)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="مثال: SAT2026"
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

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">سياسة عرض النتائج</label>
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
                          <span className={`text-sm font-black ${examInfo.resultVisibility === opt.id ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.label}</span>
                          <span className="text-[10px] font-bold text-slate-400">{opt.desc}</span>
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
                الجدولة والتحكم
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

            {/* School Selection Card */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
                  <Globe className="w-6 h-6 text-indigo-600" />
                  المدارس المستهدفة
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setExamInfo({...examInfo, isCentral: true})}
                  className={`py-3 rounded-xl font-bold text-xs transition-all ${examInfo.isCentral ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500'}`}
                >
                  جميع المدارس (مركزي)
                </button>
                <button 
                  onClick={() => setExamInfo({...examInfo, isCentral: false})}
                  className={`py-3 rounded-xl font-bold text-xs transition-all ${!examInfo.isCentral ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500'}`}
                >
                  اختيار مدارس محددة
                </button>
              </div>

              {!examInfo.isCentral && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {fetchingSchools ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <span className="text-xs font-bold">جاري تحميل قائمة المدارس...</span>
                    </div>
                  ) : fetchError ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4 text-center bg-red-50 rounded-2xl border border-red-100">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-red-900">{fetchError}</p>
                        <p className="text-[10px] text-red-600 font-bold">تأكد من اتصالك بالسيرفر أو تشغيل الـ Backend</p>
                      </div>
                      <button 
                        onClick={fetchSchools}
                        className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : schools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Globe className="w-8 h-8 text-slate-300" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-600">لا توجد مدارس مضافة</p>
                        <p className="text-[10px] text-slate-400 font-bold">لم نجد أي مدارس في قاعدة البيانات حالياً</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اختر المدارس من القائمة:</label>
                      <select 
                        multiple
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 outline-none font-bold text-black text-sm focus:ring-2 focus:ring-indigo-500/20 min-h-[150px] appearance-none cursor-pointer"
                        value={examInfo.schoolIds}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value);
                          setExamInfo({...examInfo, schoolIds: values});
                        }}
                      >
                        {schools.map((school: any) => (
                          <option key={school.id} value={school.id} className="py-2 px-4 rounded-xl hover:bg-indigo-50 my-1">
                            {school.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-between items-center px-2">
                        <p className="text-[9px] text-slate-400 font-bold">اضغط Ctrl للاختيار المتعدد</p>
                        <button onClick={handleSelectAll} className="text-[10px] font-black text-indigo-600 hover:underline">
                          {examInfo.schoolIds.length === schools.length ? "إلغاء الكل" : "تحديد كافة المدارس"}
                        </button>
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
               <label className="text-sm font-black text-slate-400 mb-3 block uppercase tracking-widest">عنوان الامتحان</label>
               <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-[25px] px-8 py-6 text-2xl md:text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all text-slate-800"
                placeholder="أدخل عنوان الامتحان هنا..."
                value={examInfo.title}
                onChange={(e) => setExamInfo({...examInfo, title: e.target.value})}
              />
            </div>

            {/* Questions List Header */}
            <div className="flex justify-between items-center px-4">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-slate-800">الأسئلة ({questions.length})</h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                  {questions.reduce((sum, q) => sum + (q.points || 0), 0)} نقطة إجمالية
                </span>
              </div>
              <button 
                onClick={handleAddQuestion}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus className="w-5 h-5" />
                إضافة سؤال جديد
              </button>
            </div>

            {/* Questions Management Flow */}
            <div className="flex flex-col gap-6">
              {questions.length === 0 && !showQuestionForm && (
                <div className="bg-white rounded-[40px] border-4 border-dashed border-slate-100 p-20 flex flex-col items-center justify-center text-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-[35px] flex items-center justify-center text-slate-200">
                    <HelpCircle className="w-12 h-12" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 mb-2">لا توجد أسئلة بعد</h4>
                    <p className="text-slate-400 font-medium max-w-sm">ابدأ بإضافة أول سؤال لامتحانك الآن لتظهر لك قائمة الأسئلة هنا.</p>
                  </div>
                  <button 
                    onClick={handleAddQuestion}
                    className="bg-[#0f0f1d] text-white px-10 py-5 rounded-3xl font-black hover:scale-105 transition-all shadow-2xl"
                  >
                    أنشئ أول سؤال
                  </button>
                </div>
              )}

              {/* Question Form (Add/Edit) */}
              {showQuestionForm && (
                <div className="bg-white rounded-[40px] border-2 border-indigo-500 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center">
                    <h4 className="text-white font-black flex items-center gap-3">
                      <Edit3 className="w-5 h-5" />
                      {editingIndex !== null ? `تعديل السؤال رقم ${editingIndex + 1}` : "إضافة سؤال جديد"}
                    </h4>
                    <button 
                      onClick={() => setShowQuestionForm(false)}
                      className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-8 md:p-12 space-y-8">
                    {/* Metadata Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المؤشر (Indicator)</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-xs text-black outline-none"
                          value={currentQuestion.indicator || ""}
                          onChange={(e) => updateCurrentQuestion("indicator", e.target.value)}
                        >
                          <option value="">اختر المؤشر...</option>
                          {INDICATORS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نواتج التعلم (Learning Outcomes)</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-xs text-black outline-none"
                          value={currentQuestion.learningOutcome || ""}
                          onChange={(e) => updateCurrentQuestion("learningOutcome", e.target.value)}
                        >
                          <option value="">اختر ناتج التعلم...</option>
                          {LEARNING_OUTCOMES.map(lo => <option key={lo} value={lo}>{lo}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Form Content */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[30px] border border-slate-100">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نوع السؤال</label>
                        <select 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none"
                          value={currentQuestion.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const updated = { ...currentQuestion, type: newType };
                            if (newType === "TRUE_FALSE") {
                              updated.options = ["صحيح", "خطأ", "", ""];
                            } else if (currentQuestion.type === "TRUE_FALSE") {
                              updated.options = ["", "", "", ""];
                            }
                            setCurrentQuestion(updated);
                          }}
                        >
                          {QUESTION_TYPES.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المعيار (Standard)</label>
                        <select 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none"
                          value={currentQuestion.standard}
                          onChange={(e) => updateCurrentQuestion("standard", e.target.value)}
                        >
                          <option value="">اختر المعيار...</option>
                          {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المهارة</label>
                        <select 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none"
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
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none"
                          value={currentQuestion.level}
                          onChange={(e) => updateCurrentQuestion("level", e.target.value)}
                        >
                          <option value="Easy">سهل</option>
                          <option value="Medium">متوسط</option>
                          <option value="Hard">صعب</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">النقاط</label>
                        <input 
                          type="number"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none"
                          value={currentQuestion.points}
                          onChange={(e) => updateCurrentQuestion("points", parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نص السؤال</label>
                      <RichTextEditor
                        value={currentQuestion.text}
                        onChange={(value) => updateCurrentQuestion("text", value)}
                        placeholder="اكتب نص السؤال بدقة هنا..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ناتج التعلم</label>
                        <input 
                          type="text"
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm"
                          placeholder="مثال: فهم قوانين الحركة النيوتنية..."
                          value={currentQuestion.learningOutcome || ""}
                          onChange={(e) => updateCurrentQuestion("learningOutcome", e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">شرح الإجابة</label>
                        <RichTextEditor 
                          value={currentQuestion.explanation || ""}
                          onChange={(value) => updateCurrentQuestion("explanation", value)}
                          placeholder="اشرح لماذا هذه الإجابة هي الصحيحة..."
                          className="!bg-slate-50 !border-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                className="bg-transparent flex-1 outline-none font-bold text-slate-700 placeholder:text-slate-300"
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
                          <div onClick={() => setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, ""] })} className="flex items-center justify-center gap-2 p-5 rounded-[22px] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer text-indigo-600 font-bold">
                            <Plus className="w-5 h-5" />
                            إضافة خيار
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                      <button 
                        onClick={() => setShowQuestionForm(false)}
                        className="px-8 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                      >
                        إلغاء
                      </button>
                      <button 
                        onClick={handleSaveQuestion}
                        className="px-10 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
                      >
                        حفظ السؤال في القائمة
                        <Save className="w-5 h-5" />
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
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{q.level === "Easy" ? "سهل" : q.level === "Medium" ? "متوسط" : "صعب"} • {q.points} نقطة</span>
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

                    {/* Expanded Content */}
                    {expandedIndex === index && (
                      <div className="px-8 pb-8 pt-4 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">محتوى السؤال:</h5>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: q.text }} />
                            
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
            {/* Modal Header */}
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

            {/* Modal Content - Student View Mockup */}
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
                    dangerouslySetInnerHTML={{ __html: previewQuestion.text }}
                  />

                  {previewQuestion.imageUrl && (
                    <img
                      src={previewQuestion.imageUrl}
                      alt="Question"
                      className="max-w-full rounded-[30px] border border-slate-100 shadow-xl"
                    />
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

            {/* Modal Footer */}
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
