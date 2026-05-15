"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ArrowLeft, Plus, Trash2, Video, FileText, 
  HelpCircle, BookOpen, Save, Layers, Edit2, X,
  ChevronDown, ChevronUp, Play, Layout, Target, 
  CheckCircle2, AlertCircle, Upload, Download, Settings,
  Eye, Monitor, ListOrdered, FileJson
} from "lucide-react";
import * as XLSX from 'xlsx';
import RichTextEditor from "@/components/RichTextEditor";
import { compressImage } from "@/lib/image-utils";


export default function CreateCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const schoolIdParam = searchParams.get('schoolId');

  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    coverImage: "",
    grades: ["الصف الأول الثانوي"] as string[],
    subject: "",
    country: "مصر",
    isCentral: !schoolIdParam, // true if no specific school, false if schoolId provided
    schoolId: schoolIdParam || ""
  });

  const [lessons, setLessons] = useState<any[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  // Lesson State
  const [currentLesson, setCurrentLesson] = useState<any>({
    title: "",
    videoUrl: "",
    summary: "",
    notes: "",
    standards: "",
    indicators: "",
    learningOutcomes: "",
    slides: [
      { id: Date.now(), title: "المقدمة", content: "" }
    ],
    questions: [], // Now using the advanced card logic
    attachments: []
  });

  // UI States for Lesson Modal
  const [activeTab, setActiveTab] = useState<'info' | 'slides' | 'exercises' | 'attachments'>('info');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [tempQuestion, setTempQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "General", level: "Medium",
    learningOutcome: "", explanation: "", correctAnswers: [], attempts: 1
  });

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

  const SKILLS = ["General", "Critical Thinking", "Problem Solving", "Analysis", "Application"];

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
        setSchools(Array.isArray(data) ? data : []);
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
      videoUrl: "",
      summary: "",
      notes: "",
      standards: "",
      indicators: "",
      learningOutcomes: "",
      slides: [{ id: Date.now(), title: "المقدمة", content: "" }],
      questions: [],
      attachments: []
    });
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (index: number) => {
    setEditingLessonIndex(index);
    const lessonToEdit = { ...lessons[index] };
    if (!lessonToEdit.slides) lessonToEdit.slides = [{ id: Date.now(), title: "المقدمة", content: "" }];
    if (!lessonToEdit.questions) lessonToEdit.questions = [];
    setCurrentLesson(lessonToEdit);
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const saveLesson = () => {
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
  };

  // Excel Upload hidden as requested
  const handleExcelUpload = (type: 'questions' | 'metadata') => {
    showToast("هذه الميزة غير متوفرة حالياً", "info");
  };

  const addSlide = () => {
    setCurrentLesson({
      ...currentLesson,
      slides: [...currentLesson.slides, { id: Date.now(), title: `شريحة جديدة ${currentLesson.slides.length + 1}`, content: "" }]
    });
  };

  const updateSlide = (index: number, field: string, value: any) => {
    const newSlides = [...currentLesson.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setCurrentLesson({ ...currentLesson, slides: newSlides });
  };

  const removeSlide = (index: number) => {
    if (currentLesson.slides.length === 1) return;
    const newSlides = [...currentLesson.slides];
    newSlides.splice(index, 1);
    setCurrentLesson({ ...currentLesson, slides: newSlides });
  };

  // Advanced Question Logic
  const handleAddQuestion = () => {
    setTempQuestion({
      text: "", type: "MCQ", options: ["", "", "", ""],
      correctAnswer: "", points: 1, skill: "General", level: "Medium",
      learningOutcome: "", explanation: "", correctAnswers: [], attempts: 1
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

  const removeQuestion = (index: number) => {
    const newQuestions = [...currentLesson.questions];
    newQuestions.splice(index, 1);
    setCurrentLesson({ ...currentLesson, questions: newQuestions });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.title) {
      showToast("يرجى إدخال عنوان الكورس", "error");
      return;
    }
    
    setIsLoading(true);
    const token = localStorage.getItem("super_admin_token");
    
    try {
      const res = await fetch(`${API_URL}/school/courses`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...courseData,
          lessons: lessons.map(l => ({
            ...l,
            attachments: JSON.stringify(l.attachments || []),
            slides: JSON.stringify(l.slides || []),
            questions: JSON.stringify(l.questions || [])
          }))
        })
      });

      if (res.ok) {
        showToast("تم إنشاء الكورس بنجاح", 'success');
        router.push(`/super-admin/courses`);
      } else {
        const data = await res.json();
        showToast(data.error || "فشل إنشاء الكورس", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالخادم", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div dir="rtl">
        {isLessonModalOpen ? (
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 w-full rounded-[40px] shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-slate-900 p-8 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Monitor className="w-8 h-8" />
                    {editingLessonIndex !== null ? `تعديل الدرس: ${currentLesson.title}` : "تصميم درس جديد"}
                  </h3>
                  <p className="text-slate-400 mt-1 font-bold">قم ببناء محتوى الدرس والأهداف والتدريبات</p>
                </div>
                <button onClick={() => setIsLessonModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                {[
                  { id: 'info', label: 'الأهداف والبيانات', icon: Target },
                  { id: 'slides', label: 'محتوى الشرح (Slides)', icon: Layout },
                  { id: 'exercises', label: 'التدريبات والأسئلة', icon: HelpCircle },
                  { id: 'attachments', label: 'المرفقات', icon: FileText },
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
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">عنوان الدرس</label>
                        <input 
                          type="text" 
                          value={currentLesson.title}
                          onChange={(e) => setCurrentLesson({...currentLesson, title: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                          placeholder="مثال: القوة والحركة في بعد واحد"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">رابط الفيديو (YouTube)</label>
                        <input 
                          type="text" 
                          value={currentLesson.videoUrl}
                          onChange={(e) => setCurrentLesson({...currentLesson, videoUrl: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-rose-600 transition-all text-left"
                          placeholder="https://youtube.com/..."
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-[30px] space-y-8">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          <Target className="w-6 h-6 text-indigo-600" />
                          المعايير والمخرجات
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">المعايير (Standards)</label>
                          <input 
                            list="standards-list"
                            value={currentLesson.standards}
                            onChange={(e) => setCurrentLesson({...currentLesson, standards: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600"
                            placeholder="اختر أو اكتب المعايير..."
                          />
                          <datalist id="standards-list">
                            <option value="معيار 1: الفهم والاستيعاب" />
                            <option value="معيار 2: التطبيق والتحليل" />
                            <option value="معيار 3: التفكير النقدي" />
                          </datalist>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المؤشرات (Indicators)</label>
                          <input 
                            list="indicators-list"
                            value={currentLesson.indicators}
                            onChange={(e) => setCurrentLesson({...currentLesson, indicators: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600"
                            placeholder="اختر أو اكتب المؤشرات..."
                          />
                          <datalist id="indicators-list">
                            <option value="مؤشر 1: يحدد المفاهيم الأساسية" />
                            <option value="مؤشر 2: يطبق القوانين الرياضية" />
                            <option value="مؤشر 3: يستنتج العلاقات" />
                          </datalist>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نواتج التعلم (LOs)</label>
                          <input 
                            list="los-list"
                            value={currentLesson.learningOutcomes}
                            onChange={(e) => setCurrentLesson({...currentLesson, learningOutcomes: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600"
                            placeholder="اختر أو اكتب نواتج التعلم..."
                          />
                          <datalist id="los-list">
                            <option value="ناتج 1: أن يكون الطالب قادراً على..." />
                            <option value="ناتج 2: أن يميز الطالب بين..." />
                            <option value="ناتج 3: أن يحلل الطالب..." />
                          </datalist>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'slides' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <Layout className="w-6 h-6 text-indigo-600" />
                        شرائح المحتوى والشرح
                      </h4>
                      <button 
                        onClick={addSlide}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg"
                      >
                        <Plus className="w-5 h-5" />
                        إضافة شريحة
                      </button>
                    </div>

                    <div className="space-y-6">
                      {currentLesson.slides.map((slide: any, sIdx: number) => (
                        <div key={slide.id} className="bg-slate-50 border border-slate-100 rounded-[30px] overflow-hidden group">
                          <div className="bg-slate-100/50 p-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg">{sIdx + 1}</span>
                              <input 
                                type="text"
                                value={slide.title}
                                onChange={(e) => updateSlide(sIdx, 'title', e.target.value)}
                                className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1"
                                placeholder="عنوان الشريحة"
                              />
                            </div>
                            <button 
                              onClick={() => removeSlide(sIdx)}
                              className="text-red-500 hover:text-red-600 p-2 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="p-6">
                            <RichTextEditor 
                              value={slide.content}
                              onChange={(val) => updateSlide(sIdx, 'content', val)}
                              placeholder="ابدأ بكتابة محتوى الشرح، يمكنك إضافة صور ومعادلات..."
                              className="!bg-white !border-slate-100"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'exercises' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="text-xl font-black text-slate-900">تدريبات الدرس</h4>
                        <p className="text-slate-400 text-sm font-bold">تمارين تفاعلية تظهر للطالب أثناء دراسة المحتوى</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => showToast("جاري فتح بنك الأسئلة المركزي...", "info")} 
                          className="bg-orange-50 text-orange-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                        >
                          <BookOpen className="w-5 h-5" /> بنك الأسئلة
                        </button>
                        <button 
                          onClick={handleAddQuestion}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          إضافة سؤال
                        </button>
                      </div>
                    </div>

                    {showQuestionForm && (
                      <div className="bg-slate-50 border-2 border-indigo-600 rounded-[35px] p-8 space-y-8 animate-in zoom-in-95 duration-300 mb-10">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                          <h5 className="text-lg font-black text-slate-900 flex items-center gap-3">
                            <Edit2 className="w-6 h-6 text-indigo-600" />
                            {editingQuestionIndex !== null ? "تعديل السؤال" : "إضافة سؤال جديد للتدريبات"}
                          </h5>
                          <button onClick={() => setShowQuestionForm(false)} className="text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نوع السؤال</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.type}
                              onChange={(e) => setTempQuestion({...tempQuestion, type: e.target.value, options: e.target.value === "TRUE_FALSE" ? ["صحيح", "خطأ", "", ""] : ["", "", "", ""]})}
                            >
                              {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المستوى</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.level}
                              onChange={(e) => setTempQuestion({...tempQuestion, level: e.target.value})}
                            >
                              <option value="Easy">سهل</option>
                              <option value="Medium">متوسط</option>
                              <option value="Hard">صعب</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الدرجة</label>
                            <input 
                              type="number"
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.points}
                              onChange={(e) => setTempQuestion({...tempQuestion, points: parseInt(e.target.value)})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ناتج التعلم (LO)</label>
                            <input 
                              type="text"
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.learningOutcome}
                              onChange={(e) => setTempQuestion({...tempQuestion, learningOutcome: e.target.value})}
                              placeholder="مثال: LO-101"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المحاولات</label>
                            <input 
                              type="number"
                              min="1"
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.attempts || 1}
                              onChange={(e) => setTempQuestion({...tempQuestion, attempts: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نص السؤال</label>
                          <RichTextEditor 
                            value={tempQuestion.text}
                            onChange={(val) => setTempQuestion({...tempQuestion, text: val})}
                            placeholder="اكتب السؤال هنا..."
                            className="!bg-white !border-slate-100"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">تفسير الإجابة (Explanation)</label>
                          <textarea 
                            value={tempQuestion.explanation}
                            onChange={(e) => setTempQuestion({...tempQuestion, explanation: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 text-sm min-h-[80px] outline-none focus:border-indigo-600"
                            placeholder="اشرح لماذا هذه الإجابة صحيحة..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {tempQuestion.type !== "TRUE_FALSE" ? (
                            tempQuestion.options.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${tempQuestion.correctAnswer === opt && opt !== "" ? 'bg-emerald-50 border-emerald-600' : 'bg-slate-50 border-slate-100'}`}>
                                <div 
                                  onClick={() => setTempQuestion({...tempQuestion, correctAnswer: opt})}
                                  className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center ${tempQuestion.correctAnswer === opt && opt !== "" ? 'bg-white border-emerald-400' : 'bg-slate-200 border-white'}`}
                                >
                                  {tempQuestion.correctAnswer === opt && opt !== "" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                </div>
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const opts = [...tempQuestion.options];
                                    opts[oIdx] = e.target.value;
                                    setTempQuestion({...tempQuestion, options: opts});
                                  }}
                                  className={`bg-transparent flex-1 outline-none font-bold ${tempQuestion.correctAnswer === opt && opt !== "" ? 'text-white' : 'text-slate-900'}`}
                                  placeholder={`الخيار ${oIdx + 1}`}
                                />
                              </div>
                            ))
                          ) : (
                            ["صحيح", "خطأ"].map((opt, oIdx) => (
                              <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${tempQuestion.correctAnswer === opt ? 'bg-emerald-600 border-emerald-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div 
                                  onClick={() => setTempQuestion({...tempQuestion, correctAnswer: opt})}
                                  className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center ${tempQuestion.correctAnswer === opt ? 'bg-white border-emerald-400' : 'bg-slate-200 border-white'}`}
                                >
                                  {tempQuestion.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                </div>
                                <span className={`font-bold ${tempQuestion.correctAnswer === opt ? 'text-white' : 'text-slate-900'}`}>{opt}</span>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex justify-end gap-4">
                          <button onClick={() => setShowQuestionForm(false)} className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                          <button onClick={handleSaveQuestion} className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20">حفظ السؤال</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {currentLesson.questions.map((q: any, index: number) => (
                        <div key={index} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex justify-between items-center hover:bg-slate-100 transition-all group shadow-sm">
                          <div className="flex items-center gap-6 overflow-hidden">
                            <span className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm">{index + 1}</span>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{q.type}</span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{q.level} • {q.points} pts</span>
                              </div>
                              <div className="text-slate-700 font-bold truncate max-w-xl" dangerouslySetInnerHTML={{ __html: q.text.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...' }} />
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditQuestion(index)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => removeQuestion(index)} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))}
                      {currentLesson.questions.length === 0 && !showQuestionForm && (
                        <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-[40px]">
                           <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                           <p className="text-slate-400 font-bold">لا يوجد أسئلة لهذا الدرس حتى الآن.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xl font-black text-slate-900">الملفات والمرفقات</h4>
                        <button 
                          onClick={() => setCurrentLesson({...currentLesson, attachments: [...(currentLesson.attachments || []), { name: "", url: "", type: "PDF" }]})}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          إضافة ملف
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
                                placeholder="اسم الملف"
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
                                  placeholder="رابط الملف الخارجي (URL)"
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
                  إلغاء التغييرات
                </button>
                <button 
                  onClick={saveLesson}
                  className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3"
                >
                  تأكيد وحفظ الدرس
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100">
                  <ArrowLeft className="w-7 h-7" />
                </button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">إنشاء كورس تعليمي</h1>
                  <p className="text-slate-400 text-lg mt-1 font-bold">صمم تجربة تعلم متكاملة لطلابك</p>
                </div>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-12 py-5 rounded-[22px] font-black flex items-center gap-3 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? "جاري النشر..." : "حفظ ونشر الكورس"}
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
                    إعدادات الكورس
                  </h2>
                  
                  <div className="space-y-6 relative z-10">
                    {/* Cover Image Upload */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">صورة الغلاف</label>
                      <div className="relative group cursor-pointer">
                        {courseData.coverImage ? (
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-400 transition-all">
                            <img src={courseData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                                <button onClick={() => setCourseData({...courseData, coverImage: ""})} className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 transition-all shadow-lg"><Trash2 className="w-5 h-5" /></button>
                                <label className="p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 transition-all cursor-pointer shadow-lg">
                                  <Upload className="w-5 h-5" />
                                  <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (re) => {
                                        const result = re.target?.result as string;
                                        if(confirm("هل تريد اعتماد هذه الصورة كغلاف؟")) {
                                           setCourseData({...courseData, coverImage: result});
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
                            <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600">رفع غلاف الكورس</span>
                            <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                       const reader = new FileReader();
                                       reader.onload = (re) => {
                                          const result = re.target?.result as string;
                                          if(confirm("هل تريد اعتماد هذه الصورة كغلاف؟")) {
                                             setCourseData({...courseData, coverImage: result});
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
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">عنوان الكورس</label>
                      <input 
                        type="text" 
                        value={courseData.title}
                        onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                        placeholder="مثال: الرياضيات المتقدمة"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">وصف الكورس</label>
                      <textarea 
                        value={courseData.description}
                        onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all min-h-[120px] resize-none"
                        placeholder="نبذة مختصرة عن أهداف الكورس..."
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الدولة</label>
                        <select 
                          value={courseData.country}
                          onChange={(e) => setCourseData({...courseData, country: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all appearance-none"
                        >
                          <option value="مصر">مصر</option>
                          <option value="السعودية">السعودية</option>
                          <option value="الإمارات">الإمارات</option>
                          <option value="الكويت">الكويت</option>
                          <option value="قطر">قطر</option>
                          <option value="عمان">عمان</option>
                          <option value="البحرين">البحرين</option>
                          <option value="الأردن">الأردن</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المراحل الدراسية المستهدفة</label>
                        <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl min-h-[100px]">
                           {GRADES.map(g => (
                             <button
                               key={g}
                               type="button"
                               onClick={() => {
                                  const currentGrades = courseData.grades;
                                  if (currentGrades.includes(g)) {
                                     setCourseData({...courseData, grades: currentGrades.filter(x => x !== g)});
                                  } else {
                                     setCourseData({...courseData, grades: [...currentGrades, g]});
                                  }
                               }}
                               className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                                  courseData.grades.includes(g) 
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                  : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200'
                               }`}
                             >
                               {g}
                             </button>
                           ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold px-2">يمكنك اختيار أكثر من مرحلة دراسية لهذا الكورس.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المادة / التخصص</label>
                        <input 
                          type="text" 
                          value={courseData.subject}
                          onChange={(e) => setCourseData({...courseData, subject: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                          placeholder="مثال: فيزياء"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نطاق الكورس</label>
                      <select 
                        value={courseData.schoolId}
                        onChange={(e) => setCourseData({...courseData, schoolId: e.target.value, isCentral: !e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all appearance-none"
                      >
                        <option value="" className="bg-white text-slate-900">كورس مركزي (لكافة المدارس)</option>
                        {Array.isArray(schools) && schools.map(s => <option key={s.id} value={s.id} className="bg-white text-slate-900">{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[40px] flex items-center gap-6">
                   <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <ListOrdered className="w-8 h-8" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900">محتوى الكورس</h4>
                      <p className="text-indigo-600 font-bold">{lessons.length} دروس مكتملة حتى الآن</p>
                   </div>
                </div>
              </div>

              {/* Right Side: Lessons Management */}
              <div className="lg:col-span-8 space-y-8">
                <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                    <Layers className="w-8 h-8 text-indigo-600" />
                    هيكل الدروس والمحاضرات
                  </h3>
                  <button 
                    onClick={openAddLessonModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    <Plus className="w-6 h-6" />
                    إضافة درس جديد
                  </button>
                </div>

                {lessons.length === 0 ? (
                  <div className="bg-white border-4 border-dashed border-slate-100 rounded-[50px] p-24 text-center group cursor-pointer hover:border-indigo-500/20 transition-all" onClick={openAddLessonModal}>
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all">
                      <Monitor className="w-12 h-12 text-slate-300 group-hover:text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">ابدأ ببناء كورس أحلامك!</h3>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-lg">لم يتم إضافة أي دروس بعد. قم بإضافة دروس تتضمن فيديو، شرائح شرح، وتدريبات تفاعلية.</p>
                    <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20">
                      إضافة الدرس الأول الآن
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
                        <h3 className="font-black text-slate-900 text-2xl mb-4 truncate leading-tight group-hover:text-indigo-600 transition-colors">{lesson.title || "درس بدون عنوان"}</h3>
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-400">
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <Monitor className={`w-4 h-4 ${lesson.slides?.length ? 'text-indigo-600' : 'text-slate-300'}`} />
                            {lesson.slides?.length || 0} شرائح شرح
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <HelpCircle className={`w-4 h-4 ${lesson.questions?.length ? 'text-amber-500' : 'text-slate-300'}`} />
                            {lesson.questions?.length || 0} تدريبات
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
