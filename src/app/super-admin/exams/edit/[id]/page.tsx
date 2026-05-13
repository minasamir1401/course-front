"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Save, Plus, Trash2, Image as ImageIcon, CheckCircle, HelpCircle,
  ArrowRight, Settings, ListPlus, Globe, Layout, Loader2,
  Clock, Lock, Calendar, Eye, EyeOff, FileText, AlertCircle, BookOpen, ChevronLeft,
  ChevronDown, ChevronUp, Edit3, Play, X, CheckCircle2, Target
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import RichTextEditor from "@/components/RichTextEditor";


export default function SuperAdminEditExamPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [fetchingSchools, setFetchingSchools] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // UI States
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<any>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Unified settings collapsed state
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);

  const [examInfo, setExamInfo] = useState<any>({
    title: "",
    description: "",
    category: "SAT Math",
    type: "Exam",
    duration: 60,
    passingScore: 50,
    isCentral: true,
    schoolIds: [],
    showAnswers: true,
    resultVisibility: "SHOW_SCORE",
    password: "",
    startDate: "",
    endDate: "",
    attemptsAllowed: 1,
    status: "PUBLISHED",
    grade: "Grade 1",
    skill: "Math",
    level: "Medium",
  });

  const [questions, setQuestions] = useState<any[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "Math", level: "Medium",
    learningOutcome: "",
    explanation: "", imageUrl: "", correctAnswers: [],
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
    { id: "MCQ", label: "اختيار من متعدد", desc: "اختر إجابة واحدة صحيحة" },
    { id: "TRUE_FALSE", label: "صح وخطأ", desc: "حدد إذا كانت العبارة صحيحة أم خاطئة" },
    { id: "MULTI_SELECT", label: "اختيار متعدد", desc: "اختر جميع الإجابات الصحيحة" }
  ];

  const SKILLS = [
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
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setFetchingSchools(true);
    setFetchError("");
    try {
      const token = localStorage.getItem("super_admin_token");

      // Fetch Schools
      const schoolsRes = await fetch(`${API_URL}/admin/schools`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const schoolsData = await schoolsRes.json();
      if (schoolsRes.ok && Array.isArray(schoolsData)) {
        setSchools(schoolsData);
      } else {
        setFetchError("فشل في جلب قائمة المدارس");
      }

      // Fetch Exam
      const examRes = await fetch(`${API_URL}/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const examData = await examRes.json();

      if (examRes.ok) {
        setExamInfo({
          ...examData,
          schoolIds: examData.schools?.map((s: any) => s.id) || [],
          grade: examData.grade || "Grade 1",
          category: examData.category || "SAT Math",
          resultVisibility: examData.resultVisibility || "SHOW_SCORE",
          attemptsAllowed: examData.attemptsAllowed || 1,
          password: examData.password || "",
          skill: examData.skill || "Math",
          level: examData.level || "Medium",
          startDate: examData.startDate ? new Date(examData.startDate).toISOString().slice(0, 16) : "",
          endDate: examData.endDate ? new Date(examData.endDate).toISOString().slice(0, 16) : "",
        });
        setQuestions(examData.questions?.map((q: any) => {
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
      setFetchError("خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
      setFetchingSchools(false);
    }
  };

  const handleAddQuestion = () => {
    setCurrentQuestion({
      text: "", type: "MCQ", options: ["", "", "", ""],
      correctAnswer: "", points: 1, skill: "Math", level: "Medium",
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

  const handleSubmit = async (statusOverride: string | null = null) => {
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
      const res = await fetch(`${API_URL}/exams/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...examInfo,
          status: statusOverride || examInfo.status,
          questions
        }),
      });

      if (res.ok) {
        showToast("تم تحديث الامتحان بنجاح!", 'success');
        router.push("/super-admin/exams");
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
      <div className="max-w-7xl mx-auto flex flex-col gap-10 pb-20 rtl lg:mr-10" dir="rtl">
        {/* Command Center Header */}
        <div className="bg-[#05050a] p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden border border-white/5">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-right">
              <div className="flex items-center gap-4 justify-center lg:justify-start mb-4">
                <button
                  onClick={() => router.back()}
                  className="p-3 bg-slate-900 rounded-2xl border border-white/10 hover:bg-slate-800 transition-all text-white mr-2"
                >
                  <ChevronLeft className="w-6 h-6 rotate-180" />
                </button>
                <div className="p-3 bg-indigo-900 rounded-2xl border border-indigo-500/30">
                  <Settings className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  تعديل الامتحان
                </h2>
              </div>
              <p className="text-indigo-300 mt-2 text-lg font-medium max-w-2xl leading-relaxed">
                أنت الآن في وضع التعديل المتقدم. يمكنك تحديث كافة الخصائص والأسئلة لهذا الامتحان.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-center">
              <button
                onClick={() => handleSubmit("DRAFT")}
                disabled={saving}
                className="px-8 py-5 rounded-2xl font-bold bg-slate-900 text-white border border-white/10 hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50"
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
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/40 blur-[150px] -mr-64 -mt-64"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* ── UNIFIED EXAM SETTINGS PANEL ── */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-500">
              <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">إعدادات الامتحان</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">توزيع، مواعيد، وسياسات</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettingsCollapsed(!settingsCollapsed)}
                  className="text-[10px] font-black px-4 py-2 rounded-xl bg-white border border-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  {settingsCollapsed ? (
                    <><Edit3 className="w-3.5 h-3.5" /> تعديل الإعدادات</>
                  ) : (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> حفظ الإعدادات</>
                  )}
                </button>
              </div>

              {settingsCollapsed ? (
                /* ── COMPACT SUMMARY VIEW ── */
                <div className="p-8 space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between group">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">النشر:</span>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${examInfo.isCentral ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                        {examInfo.isCentral ? '🌐 مركزي' : `🏫 ${examInfo.schoolIds?.length || 0} مدارس`}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400">التصنيف:</span>
                        <span className="text-xs font-black text-slate-700">{examInfo.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400">المدة:</span>
                        <span className="text-xs font-black text-slate-700">{examInfo.duration} دقيقة</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-50 pt-4">
                      {examInfo.startDate && (
                        <div className="flex items-center gap-3 text-slate-500">
                          <Play className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-bold">{new Date(examInfo.startDate).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      )}
                      {examInfo.endDate && (
                        <div className="flex items-center gap-3 text-slate-500">
                          <X className="w-3 h-3 text-red-400" />
                          <span className="text-[10px] font-bold">{new Date(examInfo.endDate).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400">السياسة:</span>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">
                          {VISIBILITY_OPTIONS.find(o => o.id === examInfo.resultVisibility)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── EXPANDED FULL FORM VIEW ── */
                <div className="p-8 space-y-10 custom-scrollbar max-h-[70vh] overflow-y-auto">

                  {/* 1. Distribution */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">نطاق التوزيع</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      <button onClick={() => setExamInfo({ ...examInfo, isCentral: true })}
                        className={`py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${examInfo.isCentral ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}>
                        مركزي
                      </button>
                      <button onClick={() => setExamInfo({ ...examInfo, isCentral: false })}
                        className={`py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${!examInfo.isCentral ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}>
                        مدارس
                      </button>
                    </div>
                    {!examInfo.isCentral && (
                      <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto custom-scrollbar bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                        {fetchingSchools ? (
                          <div className="flex items-center gap-2 py-4 text-indigo-600 justify-center"><Loader2 className="w-4 h-4 animate-spin" /><span className="font-bold text-[10px]">جاري التحميل...</span></div>
                        ) : schools.map((school: any) => (
                          <label key={school.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${examInfo.schoolIds?.includes(school.id) ? 'bg-white border-indigo-500' : 'bg-white border-transparent opacity-60 hover:opacity-100'}`}>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${examInfo.schoolIds?.includes(school.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-100 border-slate-200'}`}>
                              {examInfo.schoolIds?.includes(school.id) && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={examInfo.schoolIds?.includes(school.id)} onChange={() => { const newIds = examInfo.schoolIds?.includes(school.id) ? examInfo.schoolIds.filter((sid: string) => sid !== school.id) : [...(examInfo.schoolIds || []), school.id]; setExamInfo({ ...examInfo, schoolIds: newIds }); }} />
                            <span className="text-[11px] font-black text-slate-700">{school.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* 2. General Config */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Layout className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">إعدادات الامتحان</h4>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المادة</label>
                      <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm appearance-none" value={examInfo.category} onChange={(e) => setExamInfo({ ...examInfo, category: e.target.value })}>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المرحلة</label>
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm appearance-none" value={examInfo.grade} onChange={(e) => setExamInfo({ ...examInfo, grade: e.target.value })}>
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المدة</label>
                        <div className="relative">
                          <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm" value={examInfo.duration || 0} onChange={(e) => setExamInfo({ ...examInfo, duration: parseInt(e.target.value) })} />
                          <Clock className="w-4 h-4 text-slate-300 absolute left-3 top-3.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">كلمة السر</label>
                      <div className="relative">
                        <input type="text" placeholder="اختياري..." className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm" value={examInfo.password || ""} onChange={(e) => setExamInfo({ ...examInfo, password: e.target.value })} />
                        <Lock className="w-4 h-4 text-slate-300 absolute left-3 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* 3. Timing */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">المواعيد</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">وقت البدء</label>
                        <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm" value={examInfo.startDate || ""} onChange={(e) => setExamInfo({ ...examInfo, startDate: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">وقت الانتهاء</label>
                        <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm" value={examInfo.endDate || ""} onChange={(e) => setExamInfo({ ...examInfo, endDate: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* 4. Results */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">سياسة النتائج</h4>
                    </div>
                    <div className="flex flex-col gap-2">
                      <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 text-sm appearance-none" value={examInfo.resultVisibility} onChange={(e) => setExamInfo({ ...examInfo, resultVisibility: e.target.value })}>
                        {VISIBILITY_OPTIONS.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                      </select>
                      <p className="text-[10px] font-bold text-slate-400 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        {VISIBILITY_OPTIONS.find(opt => opt.id === examInfo.resultVisibility)?.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSettingsCollapsed(true)}
                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5" /> حفظ كافة الإعدادات
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Questions Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {!showQuestionForm && (
              <>
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                  <label className="text-sm font-black text-slate-400 mb-3 block uppercase tracking-widest">عنوان الامتحان</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[25px] px-8 py-6 text-2xl md:text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all text-slate-800"
                    placeholder="أدخل عنوان الامتحان هنا..."
                    value={examInfo.title || ""}
                    onChange={(e) => setExamInfo({ ...examInfo, title: e.target.value })}
                  />
                </div>

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

                <div className="flex flex-col gap-6">
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
              </>
            )}

            {showQuestionForm && (
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col rtl" dir="rtl">
                {/* Internal Editor Header */}
                <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">
                        {editingIndex !== null ? `تعديل السؤال رقم ${editingIndex + 1}` : "إضافة سؤال جديد"}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowQuestionForm(false)} className="px-4 py-2 rounded-lg font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all text-sm">إلغاء</button>
                    <button onClick={handleSaveQuestion} className="px-6 py-2 rounded-lg font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm flex items-center gap-2">
                      <Save className="w-4 h-4" /> حفظ السؤال
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-10">
                  {/* Settings Toolbar Inside Column */}
                  <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase">النوع:</label>
                      <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-xs" value={currentQuestion.type} onChange={(e) => {
                        const newType = e.target.value;
                        const updated = { ...currentQuestion, type: newType };
                        if (newType === "TRUE_FALSE") updated.options = ["صحيح", "خطأ", "", ""];
                        setCurrentQuestion(updated);
                      }}>
                        {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase">الصعوبة:</label>
                      <select className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-xs" value={currentQuestion.level} onChange={(e) => updateCurrentQuestion("level", e.target.value)}>
                        <option value="Easy">سهل</option>
                        <option value="Medium">متوسط</option>
                        <option value="Hard">صعب</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase">النقاط:</label>
                      <input type="number" className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-bold text-xs w-20" value={currentQuestion.points} onChange={(e) => updateCurrentQuestion("points", parseInt(e.target.value))} />
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-4">
                    <label className="text-lg font-black text-slate-800 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</span>
                      نص السؤال
                    </label>
                    <div className="border-2 rounded-[25px] border-slate-100 focus-within:border-indigo-500 transition-all">
                      <RichTextEditor value={currentQuestion.text} onChange={(v) => updateCurrentQuestion("text", v)} placeholder="اكتب السؤال هنا..." />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <label className="text-lg font-black text-slate-800 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">2</span>
                      الخيارات
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.type === "TRUE_FALSE" ? (
                        ["صحيح", "خطأ"].map((opt, i) => (
                          <div key={i} onClick={() => updateCorrectAnswers(i)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isCorrectAnswer(currentQuestion, opt) ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                            <span className="font-bold">{opt}</span>
                          </div>
                        ))
                      ) : (
                        currentQuestion.options.map((opt: string, i: number) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${isCorrectAnswer(currentQuestion, opt) && opt ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent'}`}>
                            <div onClick={() => updateCorrectAnswers(i)} className={`w-6 h-6 rounded-full border-2 cursor-pointer ${isCorrectAnswer(currentQuestion, opt) && opt ? 'bg-emerald-500 border-emerald-200' : 'bg-white border-slate-300'}`} />
                            <input type="text" className="bg-transparent flex-1 outline-none font-bold text-sm" placeholder={`الخيار ${i + 1}`} value={opt} onChange={(e) => updateOption(i, e.target.value)} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Learning Outcome & Explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-slate-800">ناتج التعلم</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm" placeholder="الهدف من السؤال..." value={currentQuestion.learningOutcome || ""} onChange={(e) => updateCurrentQuestion("learningOutcome", e.target.value)} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-slate-800">شرح الإجابة</label>
                      <div className="border border-slate-100 rounded-xl">
                        <RichTextEditor value={currentQuestion.explanation || ""} onChange={(v) => updateCurrentQuestion("explanation", v)} placeholder="لماذا هذه الإجابة صحيحة؟" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                    <button onClick={() => setShowQuestionForm(false)} className="px-8 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
                    <button onClick={handleSaveQuestion} className="px-10 py-3 rounded-xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all">حفظ السؤال</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Question Modal */}


      {/* Student Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-y-0 left-0 lg:right-[300px] right-0 z-[100] flex items-center justify-center p-4 md:p-10 rtl" dir="rtl">
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
