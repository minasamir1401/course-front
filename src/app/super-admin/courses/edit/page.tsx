"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import { 
  ArrowLeft, Plus, Trash2, Video, FileText, 
  HelpCircle, BookOpen, Save, Layers, Edit2, X,
  ChevronDown, ChevronUp, Play, Layout, Target, 
  CheckCircle2, AlertCircle, Upload, Download, Settings,
  Eye, Monitor, ListOrdered, FileJson
} from "lucide-react";
import * as XLSX from 'xlsx';
import RichTextEditor from "@/components/RichTextEditor";


export default function EditCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const courseId = searchParams.get('id');
  const schoolIdParam = searchParams.get('schoolId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    grade: "الصف الأول الثانوي",
    subject: "",
    isCentral: false,
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
    slides: [{ id: Date.now(), title: "المقدمة", content: "" }],
    questions: [],
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
        setSchools(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch schools");
    }
  };

  const fetchCourseData = async (token: string, id: string) => {
    try {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourseData({
          title: data.title,
          description: data.description || "",
          grade: data.grade || "الصف الأول الثانوي",
          subject: data.subject || "",
          isCentral: data.isCentral,
          schoolId: data.schoolId || ""
        });
        
        setLessons(data.lessons.map((l: any) => {
          let parsedQuestions = [];
          let parsedAttachments = [];
          let parsedSlides = [];
          
          try {
            parsedQuestions = typeof l.questions === 'string' ? JSON.parse(l.questions) : (l.questions || []);
          } catch (e) { parsedQuestions = []; }
          
          try {
            parsedAttachments = typeof l.attachments === 'string' ? JSON.parse(l.attachments) : (l.attachments || []);
          } catch (e) { parsedAttachments = []; }

          try {
            parsedSlides = typeof l.slides === 'string' ? JSON.parse(l.slides) : (l.slides || []);
          } catch (e) { parsedSlides = [{ id: Date.now(), title: "المقدمة", content: "" }]; }

          return {
            ...l,
            questions: Array.isArray(parsedQuestions) ? parsedQuestions : [],
            attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
            slides: Array.isArray(parsedSlides) && parsedSlides.length ? parsedSlides : [{ id: Date.now(), title: "المقدمة", content: "" }]
          };
        }));
      }
    } catch (error) {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setIsLoading(false);
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
      title: "", videoUrl: "", summary: "", notes: "", standards: "", indicators: "", learningOutcomes: "",
      slides: [{ id: Date.now(), title: "المقدمة", content: "" }],
      questions: [], attachments: []
    });
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (index: number) => {
    setEditingLessonIndex(index);
    const lessonToEdit = { ...lessons[index] };
    if (!lessonToEdit.slides || lessonToEdit.slides.length === 0) lessonToEdit.slides = [{ id: Date.now(), title: "المقدمة", content: "" }];
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

  const handleExcelUpload = (type: 'questions' | 'metadata') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          if (type === 'questions') {
            const newQuestions = data.map((row: any) => ({
              id: Date.now() + Math.random(),
              text: row['السؤال'] || row['Question'] || "",
              type: row['النوع'] || row['Type'] || "MCQ",
              options: [row['أ'] || row['A'], row['ب'] || row['B'], row['ج'] || row['C'], row['د'] || row['D']].filter(Boolean),
              correctAnswer: row['الإجابة'] || row['Answer'] || "",
              explanation: row['التفسير'] || row['Explanation'] || "",
              points: parseInt(row['النقاط'] || row['Points']) || 1,
              learningOutcome: row['الناتج'] || row['Outcome'] || "",
              level: row['المستوى'] || row['Level'] || "Medium",
              skill: row['المهارة'] || row['Skill'] || "General"
            }));
            setCurrentLesson((prev: any) => ({
              ...prev,
              questions: [...prev.questions, ...newQuestions]
            }));
            showToast(`تم استيراد ${newQuestions.length} سؤال بنجاح`, "success");
          } else {
            const firstRow: any = data[0];
            if (firstRow) {
              setCurrentLesson((prev: any) => ({
                ...prev,
                standards: firstRow['المعايير'] || firstRow['Standards'] || prev.standards,
                indicators: firstRow['المؤشرات'] || firstRow['Indicators'] || prev.indicators,
                learningOutcomes: firstRow['نواتج_التعلم'] || firstRow['Outcomes'] || prev.learningOutcomes
              }));
              showToast("تم استيراد البيانات التعريفية بنجاح", "success");
            }
          }
        } catch (error) {
          showToast("خطأ في قراءة ملف Excel", "error");
        }
      };
      reader.readAsBinaryString(file);
    };
    input.click();
  };

  const addSlide = () => {
    setCurrentLesson({
      ...currentLesson,
      slides: [...(currentLesson.slides || []), { id: Date.now(), title: `شريحة جديدة ${(currentLesson.slides?.length || 0) + 1}`, content: "" }]
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.title) {
      showToast("يرجى إدخال عنوان الكورس", "error");
      return;
    }
    
    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");
    
    try {
      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
        method: 'PUT',
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
        showToast("تم تحديث الكورس بنجاح", 'success');
        router.push(`/super-admin/courses`);
      } else {
        const data = await res.json();
        showToast(data.error || "فشل تحديث الكورس", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالخادم", 'error');
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
                  { id: 'slides', label: 'محتوى الشرح (Slides)', icon: Layout },
                  { id: 'exercises', label: 'التدريبات والأسئلة', icon: HelpCircle },
                  { id: 'attachments', label: 'المرفقات', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all ${
                      activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-8 sm:p-12 overflow-y-auto max-h-[70vh] custom-scrollbar bg-white">
                {activeTab === 'info' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-3 block">عنوان الدرس</label>
                        <input 
                          type="text" 
                          value={currentLesson.title || ""}
                          onChange={(e) => setCurrentLesson({...currentLesson, title: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-3 block">رابط الفيديو (YouTube)</label>
                        <input 
                          type="text" 
                          value={currentLesson.videoUrl || ""}
                          onChange={(e) => setCurrentLesson({...currentLesson, videoUrl: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 transition-all text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-[30px] space-y-8">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <Target className="w-6 h-6 text-indigo-600" />
                        المعايير والمخرجات
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المعايير (Standards)</label>
                          <input 
                            list="standards-list"
                            value={currentLesson.standards || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, standards: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                            placeholder="اختر أو اكتب معياراً..."
                          />
                          <datalist id="standards-list">
                            <option value="معايير وزارة التربية والتعليم" />
                            <option value="المعايير الدولية (IGCSE)" />
                            <option value="المعايير الأمريكية (SAT)" />
                            <option value="معايير التفكير النقدي" />
                            <option value="معايير البحث العلمي" />
                          </datalist>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المؤشرات (Indicators)</label>
                          <input 
                            list="indicators-list"
                            value={currentLesson.indicators || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, indicators: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                            placeholder="اختر أو اكتب مؤشراً..."
                          />
                          <datalist id="indicators-list">
                            <option value="قدرة الطالب على الاستنتاج" />
                            <option value="سرعة حل المسائل الرياضية" />
                            <option value="دقة الفهم القرائي" />
                            <option value="مهارة تحليل البيانات" />
                            <option value="استيعاب المفاهيم المجردة" />
                          </datalist>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">نواتج التعلم (Learning Outcomes)</label>
                          <input 
                            list="outcomes-list"
                            value={currentLesson.learningOutcomes || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, learningOutcomes: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                            placeholder="اختر أو اكتب ناتجاً للتعلم..."
                          />
                          <datalist id="outcomes-list">
                            <option value="أن يتعرف الطالب على المفاهيم الأساسية" />
                            <option value="أن يطبق الطالب القوانين الرياضية بنجاح" />
                            <option value="أن يستنتج الطالب العلاقة بين المتغيرات" />
                            <option value="أن يحلل الطالب النصوص الأدبية بدقة" />
                            <option value="أن يقيم الطالب الحجج والأدلة العلمية" />
                          </datalist>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'slides' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-black text-slate-900">شرائح المحتوى</h4>
                      <button onClick={addSlide} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /> إضافة شريحة</button>
                    </div>
                    {currentLesson.slides.map((slide: any, sIdx: number) => (
                      <div key={slide.id} className="bg-white border border-slate-200 rounded-[30px] overflow-hidden group hover:border-indigo-200 transition-all shadow-sm">
                        <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-100">
                          <div className="flex items-center gap-4">
                            <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white">{sIdx + 1}</span>
                            <input type="text" value={slide.title} onChange={(e) => updateSlide(sIdx, 'title', e.target.value)} className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1" />
                          </div>
                          <button onClick={() => removeSlide(sIdx)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                          <RichTextEditor value={slide.content} onChange={(val) => updateSlide(sIdx, 'content', val)} className="!bg-white !border-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'exercises' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-black text-slate-900">تدريبات الدرس</h4>
                      <div className="flex gap-3">
                         <button onClick={() => handleExcelUpload('questions')} className="bg-emerald-50 text-emerald-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"><Download className="w-5 h-5" /> استيراد Excel</button>
                         <button onClick={handleAddQuestion} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /> إضافة سؤال</button>
                      </div>
                    </div>

                    {showQuestionForm && (
                      <div className="bg-white border-2 border-indigo-600 rounded-[35px] p-8 space-y-8 animate-in zoom-in-95 duration-300 shadow-xl">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">نوع السؤال</label>
                             <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.type} onChange={(e) => setTempQuestion({...tempQuestion, type: e.target.value, options: e.target.value === "TRUE_FALSE" ? ["صحيح", "خطأ", "", ""] : ["", "", "", ""]})}>
                               {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المستوى</label>
                             <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.level} onChange={(e) => setTempQuestion({...tempQuestion, level: e.target.value})}>
                               <option value="Easy">سهل</option><option value="Medium">متوسط</option><option value="Hard">صعب</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الدرجة</label>
                             <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.points} onChange={(e) => setTempQuestion({...tempQuestion, points: parseInt(e.target.value)})} placeholder="الدرجة" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ناتج التعلم (LO)</label>
                             <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.learningOutcome} onChange={(e) => setTempQuestion({...tempQuestion, learningOutcome: e.target.value})} placeholder="ناتج التعلم" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المحاولات</label>
                             <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.attempts || 1} onChange={(e) => setTempQuestion({...tempQuestion, attempts: parseInt(e.target.value)})} />
                          </div>
                        </div>
                        <RichTextEditor value={tempQuestion.text} onChange={(val) => setTempQuestion({...tempQuestion, text: val})} placeholder="نص السؤال..." className="!bg-white !border-slate-100" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {tempQuestion.type !== "TRUE_FALSE" ? tempQuestion.options.map((opt: string, oIdx: number) => (
                             <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${tempQuestion.correctAnswer === opt && opt !== "" ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent'}`}>
                               <div onClick={() => setTempQuestion({...tempQuestion, correctAnswer: opt})} className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center ${tempQuestion.correctAnswer === opt && opt !== "" ? 'bg-emerald-500 border-white' : 'bg-white border-slate-200'}`}>{tempQuestion.correctAnswer === opt && opt !== "" && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                               <input type="text" value={opt} onChange={(e) => { const opts = [...tempQuestion.options]; opts[oIdx] = e.target.value; setTempQuestion({...tempQuestion, options: opts}); }} className="bg-transparent flex-1 outline-none text-slate-900 font-bold" placeholder={`الخيار ${oIdx + 1}`} />
                             </div>
                           )) : ["صحيح", "خطأ"].map((opt, oIdx) => (
                             <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${tempQuestion.correctAnswer === opt ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent'}`}>
                               <div onClick={() => setTempQuestion({...tempQuestion, correctAnswer: opt})} className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center ${tempQuestion.correctAnswer === opt ? 'bg-emerald-500 border-white' : 'bg-white border-slate-200'}`}>{tempQuestion.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                               <span className="text-slate-900 font-bold">{opt}</span>
                             </div>
                           ))}
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">تفسير الإجابة (Explanation)</label>
                          <textarea 
                            value={tempQuestion.explanation}
                            onChange={(e) => setTempQuestion({...tempQuestion, explanation: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all resize-none h-24"
                            placeholder="اشرح للطالب سبب كون هذه الإجابة هي الصحيحة..."
                          />
                        </div>
                        <div className="flex justify-end gap-4">
                           <button onClick={() => setShowQuestionForm(false)} className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                           <button onClick={handleSaveQuestion} className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">حفظ السؤال</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                       {currentLesson.questions.map((q: any, index: number) => (
                         <div key={index} className="bg-white border border-slate-100 rounded-3xl p-6 flex justify-between items-center group hover:border-indigo-200 transition-all shadow-sm">
                            <div className="flex items-center gap-6 overflow-hidden">
                               <span className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 font-black border border-slate-100">{index + 1}</span>
                               <div className="text-slate-900 font-bold truncate max-w-xl" dangerouslySetInnerHTML={{ __html: q.text.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...' }} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleEditQuestion(index)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                               <button onClick={() => { const nq = [...currentLesson.questions]; nq.splice(index, 1); setCurrentLesson({...currentLesson, questions: nq}); }} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center">
                        <h4 className="text-xl font-black text-slate-900">الملفات المرفقة</h4>
                        <button onClick={() => setCurrentLesson({...currentLesson, attachments: [...(currentLesson.attachments || []), { name: "", url: "", type: "PDF" }]})} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"><Plus className="w-5 h-5" /> إضافة ملف</button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(currentLesson.attachments || []).map((att: any, attIdx: number) => (
                          <div key={attIdx} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 hover:border-indigo-100 transition-all shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                              <button onClick={() => { const atts = [...currentLesson.attachments]; atts.splice(attIdx, 1); setCurrentLesson({...currentLesson, attachments: atts}); }} className="text-red-500 hover:text-red-700 p-2 transition-colors"><Trash2 size={20} /></button>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">اسم الملف</label>
                              <input type="text" value={att.name} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].name = e.target.value; setCurrentLesson({...currentLesson, attachments: atts}); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-600" placeholder="مثال: كتاب الفيزياء الأساسي" />
                            </div>
                            <div className="flex gap-3">
                               <div className="w-32 space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">النوع</label>
                                  <select value={att.type} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].type = e.target.value; setCurrentLesson({...currentLesson, attachments: atts}); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-xs outline-none focus:border-indigo-600"><option value="PDF">PDF</option><option value="PPT">PPT</option><option value="IMAGE">IMAGE</option></select>
                               </div>
                               <div className="flex-1 space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 text-left" dir="ltr">URL</label>
                                  <input type="text" value={att.url} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].url = e.target.value; setCurrentLesson({...currentLesson, attachments: atts}); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-600 text-xs outline-none text-left font-mono focus:border-indigo-600" dir="ltr" placeholder="https://..." />
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
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>
                  <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 relative z-10"><Settings className="w-6 h-6 text-indigo-600" /> إعدادات الكورس</h2>
                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest block px-1">عنوان الكورس</label><input type="text" value={courseData.title} onChange={(e) => setCourseData({...courseData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all" /></div>
                    <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest block px-1">وصف الكورس</label><textarea value={courseData.description} onChange={(e) => setCourseData({...courseData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 min-h-[120px] resize-none transition-all" /></div>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest block px-1">المرحلة الدراسية</label><select value={courseData.grade} onChange={(e) => setCourseData({...courseData, grade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none appearance-none focus:border-indigo-600 transition-all">{GRADES.map(g => <option key={g} value={g} className="bg-white text-slate-900">{g}</option>)}</select></div>
                      <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest block px-1">المادة</label><input type="text" value={courseData.subject} onChange={(e) => setCourseData({...courseData, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all" /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><Layers className="w-8 h-8 text-indigo-600" /> الدروس والمحاضرات</h3>
                  <button onClick={openAddLessonModal} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-600/20"><Plus size={24} /> إضافة درس</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lessons.map((lesson, index) => (
                    <div key={index} className="bg-white border border-slate-100 rounded-[40px] p-8 hover:border-indigo-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
                       <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100">{index + 1}</div>
                          <div className="flex gap-2">
                             <button onClick={() => openEditLessonModal(index)} className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center border border-blue-100 transition-all"><Edit2 size={20} /></button>
                             <button onClick={() => handleRemoveLesson(index)} className="w-12 h-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center border border-red-100 transition-all"><Trash2 size={20} /></button>
                          </div>
                       </div>
                       <h3 className="font-black text-slate-900 text-2xl mb-4 truncate group-hover:text-indigo-600 transition-colors">{lesson.title}</h3>
                       <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100"><Monitor size={16} /> {lesson.slides?.length || 0} شرائح</div>
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100"><HelpCircle size={16} /> {lesson.questions?.length || 0} تدريبات</div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
