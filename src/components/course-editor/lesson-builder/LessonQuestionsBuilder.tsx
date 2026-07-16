"use client";

import React, { useState } from "react";
import { 
  Plus, Trash2, HelpCircle, Upload, Download, Edit2, CheckCircle2, 
  Lightbulb, TriangleAlert, ChevronDown, ChevronUp, Save, X, BookOpen, Target, FileText
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";
import { useNotification } from "@/context/NotificationContext";
import MathInput from "@/components/MathInput";
import { normalizeAnswerGlobal } from "@/components/LessonSubComponents";
import HtmlRenderer from "@/components/HtmlRenderer";
import { parseJson } from "./parseJson";
import { getSectionStylePresets } from "./constants";

interface LessonQuestionsBuilderProps {
  source: 'assignments' | 'questions';
  currentLesson: any;
  setCurrentLesson: (lesson: any) => void;
  language: string;
  assignmentsExcelRef: React.RefObject<HTMLInputElement | null>;
  questionsExcelRef: React.RefObject<HTMLInputElement | null>;
  handleAssignmentsExcelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleQuestionsExcelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExcelUpload: (type: 'questions' | 'metadata' | 'assignments') => void;
  downloadQuestionsTemplate: (type: 'questions' | 'assignments') => void;
  showQuestionForm: boolean;
  setShowQuestionForm: (show: boolean) => void;
  editingQuestionIndex: number | null;
  setEditingQuestionIndex: (idx: number | null) => void;
  tempQuestion: any;
  setTempQuestion: (q: any) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}

export const LessonQuestionsBuilder: React.FC<LessonQuestionsBuilderProps> = ({
  source,
  currentLesson,
  setCurrentLesson,
  language,
  assignmentsExcelRef,
  questionsExcelRef,
  handleAssignmentsExcelChange,
  handleQuestionsExcelChange,
  handleExcelUpload,
  downloadQuestionsTemplate,
  showQuestionForm,
  setShowQuestionForm,
  editingQuestionIndex,
  setEditingQuestionIndex,
  tempQuestion,
  setTempQuestion,
  openDropdownId,
  setOpenDropdownId
}) => {
  const { showToast } = useNotification();
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);
    const [isQuestionStandardOpen, setIsQuestionStandardOpen] = useState(false);
  const [isQuestionIndicatorOpen, setIsQuestionIndicatorOpen] = useState(false);
  const [isQuestionOutcomeOpen, setIsQuestionOutcomeOpen] = useState(false);
  const [questionSource, setQuestionSource] = useState<'assignments' | 'questions'>(source);

  const QUESTION_TYPES = [
    { id: "MCQ", label: language === 'ar' ? "اختيار من متعدد" : "Multiple Choice" },
    { id: "TRUE_FALSE", label: language === 'ar' ? "صح وخطأ" : "True / False" },
    { id: "MULTI_SELECT", label: language === 'ar' ? "اختيار متعدد" : "Multi Select" }
  ];

  const SECTION_STYLE_PRESETS: any = getSectionStylePresets(language);

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
      xpPoints: 10,
      skill: "Problem Solving",
      level: "On Level",
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
    if (tempQuestion.type === 'TRUE_FALSE') {
      return normalizeAnswerGlobal(tempQuestion.correctAnswer) === normalizeAnswerGlobal(opt);
    }
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
                            {q.level || "Medium"} {q.dok ? `• ${q.dok}` : ''} • {q.points || 1} {language === 'ar' ? 'درجة' : 'pts'}
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
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'معاينة السؤال:' : 'Question Preview:'}</h5>
                              {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(q.type) ? (
                                <div className="space-y-2">
                                  {Array.isArray(q.options) && q.options.filter(Boolean).map((opt: string, oIdx: number) => {
                                    const isCorrect = q.type === 'MULTI_SELECT'
                                      ? (q.correctAnswers || []).includes(opt)
                                      : q.correctAnswer === opt;
                                    return (
                                      <div key={oIdx} className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-bold transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-100 text-slate-600'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                                          {isCorrect ? '✓' : ''}
                                        </div>
                                        <span className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-[10px] text-indigo-600 shrink-0">
                                          {getOptionLetter(oIdx, language)}
                                        </span>
                                        <HtmlRenderer html={cleanOptionText(opt)} tag="span" className="flex-1 break-words whitespace-normal min-w-0 !leading-relaxed" />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : q.type === 'FLASH_CARD' ? (
                                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-2 font-bold text-right" dir="rtl">
                                  <p className="text-slate-800"><span className="text-indigo-650">🎴 {language === 'ar' ? 'الوجه الأمامي (السؤال):' : 'Front (Question):'}</span> {parseJson(q.options, {front: ""}).front || q.text}</p>
                                  <p className="text-slate-800"><span className="text-indigo-650">✨ {language === 'ar' ? 'الوجه الخلفي (الإجابة):' : 'Back (Answer):'}</span> {parseJson(q.options, {back: ""}).back || q.correctAnswer}</p>
                                </div>
                              ) : (
                                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-1.5 font-bold text-right" dir="rtl">
                                  <p className="text-slate-400">{language === 'ar' ? `نوع النشاط: ${q.type}` : `Activity Type: ${q.type}`}</p>
                                  <p className="text-slate-800"><span className="text-emerald-600">✓ {language === 'ar' ? 'الإجابة النموذجية:' : 'Correct Answer:'}</span> {typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer || "")}</p>
                                </div>
                              )}
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
                        updated.options = ["True", "False", "", ""];
                        updated.correctAnswer = "True";
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
                    {["Problem Solving", "Reasoning", "Number Sense", "Algebraic Thinking", "Geometry", "Data Analysis", "Observation", "Investigation", "Scientific Reasoning", "Data Interpretation", "Experiment Design", "Main Idea", "Inference", "Vocabulary in Context", "Author's Purpose", "Supporting Details"].map(sk => (
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
                    <option value="Foundation">{language === 'ar' ? 'تأسيسي' : 'Foundation'}</option>
                    <option value="On Level">{language === 'ar' ? 'في المستوى' : 'On Level'}</option>
                    <option value="Advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'عمق المعرفة (DOK)' : 'Depth of Knowledge (DOK)'}</label>
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                    value={tempQuestion.dok || ""}
                    onChange={(e) => updateCurrentQuestionField("dok", e.target.value)}
                  >
                    <option value="">{language === 'ar' ? 'بلا تحديد' : 'None'}</option>
                    <option value="DOK 1">DOK 1</option>
                    <option value="DOK 2">DOK 2</option>
                    <option value="DOK 3">DOK 3</option>
                    <option value="DOK 4">DOK 4</option>
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

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? '⭐ نقاط XP' : '⭐ XP Points'}</label>
                  <input 
                    type="number"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                    value={tempQuestion.xpPoints !== undefined ? tempQuestion.xpPoints : 10}
                    onChange={(e) => updateCurrentQuestionField("xpPoints", parseInt(e.target.value) || 0)}
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
                      {["True", "False"].map((opt) => (
                        <div key={opt} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer(opt) ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                          <div 
                            onClick={() => setTempQuestion({ ...tempQuestion, options: ["True", "False", "", ""], correctAnswer: opt })}
                            className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer(opt) ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                          >
                            {isQuestionCorrectAnswer(opt) && <CheckCircle2 className="w-5 h-5 text-white" />}
                          </div>
                          <span className="font-bold text-slate-700">{opt}</span>
                        </div>
                      ))}
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
                          <span className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-xs text-indigo-600 shrink-0 select-none">
                            {getOptionLetter(oIndex, language)}
                          </span>
                          <MathInput 
                            value={opt}
                            onChange={(val) => updateQuestionOption(oIndex, val)}
                            placeholder={language === 'ar' ? `الخيار ${oIndex + 1} (بدون أ، ب، ج)` : `Option ${oIndex + 1} (no A, B, C)`}
                            className="bg-transparent flex-1 font-bold text-slate-700 placeholder:text-slate-300 text-sm"
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
