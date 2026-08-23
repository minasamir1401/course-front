// @ts-nocheck

import { ChevronDown, Edit2, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

export const useQuestionLogic = (props: any) => {
  const { currentModule, activeSubExamIndex, setCurrentModule, standaloneQuestions, setStandaloneQuestions, tempQuestion, setTempQuestion, setQuestionSource, setShowQuestionForm, showToast, language, editingQuestionIndex, setEditingQuestionIndex } = props;

// Advanced Question Logic
  
  const [editingStandaloneIndex, setEditingStandaloneIndex] = useState<number | null>(null);

  const handleAddStandaloneQuestion = () => {
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
      skill: "General",
      level: "Medium",
      dok: "",
      standard: "",
      indicator: "",
      learningOutcome: "",
      videoUrl: "",
      sections: [],
      attempts: 1
    });
    setEditingStandaloneIndex(null);
    setQuestionSource('questions');
    setCurrentModule({ ...currentModule, _isStandalone: true });
    setShowQuestionForm(true);
  };

  const handleEditStandaloneQuestion = (index: number) => {
    const item = { ...standaloneQuestions[index] };
    if (!item.options) item.options = ["", "", "", ""];
    if (!item.sections) item.sections = [];
    if (!item.type) item.type = item.label || "MCQ";
    setTempQuestion(item);
    setEditingStandaloneIndex(index);
    setQuestionSource('questions');
    setCurrentModule({ ...currentModule, _isStandalone: true });
    setShowQuestionForm(true);
  };

  const handleSaveStandaloneQuestion = () => {
    if (!tempQuestion.text) {
      showToast(language === 'ar' ? "يرجى إدخال نص السؤال" : "Please enter question text", "error");
      return;
    }
    const itemToSave = { ...tempQuestion, label: tempQuestion.type };
    setStandaloneQuestions((prev: any) => {
      const newList = [...prev];
      if (editingStandaloneIndex !== null) newList[editingStandaloneIndex] = itemToSave;
      else newList.push(itemToSave);
      return newList;
    });
    setShowQuestionForm(false);
    setEditingStandaloneIndex(null);
    setCurrentModule((prev: any) => ({ ...prev, _isStandalone: false }));
    showToast(language === 'ar' ? "تم حفظ السؤال بنجاح" : "Question saved successfully", "success");
  };

  const removeStandaloneQuestion = (index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    setStandaloneQuestions((prev: any) => {
      const newList = [...prev];
      newList.splice(index, 1);
      return newList;
    });
    showToast(language === 'ar' ? "تم حذف السؤال" : "Question deleted", "info");
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
      xpPoints: 10,
      skill: "General",
      level: "Medium",
      dok: "",
      standard: "",
      indicator: "",
      learningOutcome: "",
      videoUrl: "",
      sections: [],
      attempts: 1
    });
    setEditingQuestionIndex(null);
    setCurrentModule((prev: any) => ({ ...prev, _isStandalone: false }));
    setQuestionSource(source);
    setShowQuestionForm(true);
  };

  const handleEditQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    const list = (source === 'questions' && activeSubExamIndex !== null && currentModule.subExams && currentModule.subExams[activeSubExamIndex]) ? (currentModule.subExams[activeSubExamIndex].questions || []) : (currentModule[source] || []);
    const item = { ...list[index] };
    if (!item.options) item.options = ["", "", "", ""];
    if (!item.sections) item.sections = [];
    if (!item.type) item.type = item.label || "MCQ";
    setTempQuestion(item);
    setEditingQuestionIndex(index);
    setCurrentModule((prev: any) => ({ ...prev, _isStandalone: false }));
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

    const itemToSave = {
      ...tempQuestion,
      label: tempQuestion.type // Ensure label is synced with type
    };

    setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
        const newSubExams = [...prev.subExams];
        const newQuestions = [...(newSubExams[activeSubExamIndex].questions || [])];
        if (editingQuestionIndex !== null) newQuestions[editingQuestionIndex] = itemToSave;
        else newQuestions.push(itemToSave);
        newSubExams[activeSubExamIndex] = { ...newSubExams[activeSubExamIndex], questions: newQuestions };
        return { ...prev, subExams: newSubExams };
      } else {
        const newList = [...(prev[source] || [])];
        if (editingQuestionIndex !== null) newList[editingQuestionIndex] = itemToSave;
        else newList.push(itemToSave);
        return { ...prev, [source]: newList };
      }
    });
    setShowQuestionForm(false);
    setEditingQuestionIndex(null);
    showToast(language === 'ar' ? "تم حفظ السؤال في القائمة بنجاح" : "Question saved to list successfully", "success");
  };

  const removeQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
        const newSubExams = [...prev.subExams];
        const newQuestions = [...(newSubExams[activeSubExamIndex].questions || [])];
        newQuestions.splice(index, 1);
        newSubExams[activeSubExamIndex] = { ...newSubExams[activeSubExamIndex], questions: newQuestions };
        return { ...prev, subExams: newSubExams };
      } else {
        const newList = [...(prev[source] || [])];
        newList.splice(index, 1);
        return { ...prev, [source]: newList };
      }
    });
    setExpandedQuestionIndex((expanded) => expanded === index ? null : (expanded !== null && expanded > index ? expanded - 1 : expanded));
    showToast(language === 'ar' ? "تم حذف السؤال" : "Question deleted", "info");
  };

  const moveQuestionForSource = (source: 'assignments' | 'questions', index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
        const newSubExams = [...prev.subExams];
        const newQuestions = [...(newSubExams[activeSubExamIndex].questions || [])];
        if (targetIndex < 0 || targetIndex >= newQuestions.length) return prev;
        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
        newSubExams[activeSubExamIndex] = { ...newSubExams[activeSubExamIndex], questions: newQuestions };
        return { ...prev, subExams: newSubExams };
      } else {
        const newList = [...(prev[source] || [])];
        if (targetIndex < 0 || targetIndex >= newList.length) return prev;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        return { ...prev, [source]: newList };
      }
    });
    setExpandedQuestionIndex((expanded) => expanded === index ? targetIndex : (expanded === targetIndex ? index : expanded));
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
    const list = (currentModule[lessonField] || "").split("\n").filter(Boolean);
    const selectPlaceholder = language === 'ar' ? `اختر ${label}...` : `Select ${label}...`;
    const addCustomLabel = language === 'ar' ? `+ إضافة ${label} مخصص...` : `+ Add Custom ${label}...`;
    const promptEnterLabel = language === 'ar' ? `أدخل ${label} المخصص الجديد:` : `Enter new custom ${label}:`;
    const promptEditLabel = language === 'ar' ? `تعديل ${label} المخصص:` : `Edit custom ${label}:`;
    const confirmDeleteLabel = language === 'ar' ? `هل أنت متأكد من حذف هذا ${label}؟` : `Are you sure you want to delete this ${label}?`;

    return (
      <div className="flex flex-col gap-2 relative">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={currentValue}
            onChange={(e) => updateCurrentQuestionField(field, e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={selectPlaceholder}
            className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-700 font-bold text-xs outline-none min-h-[34px] focus:border-indigo-600 transition-all text-right"
            dir="auto"
          />
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
            className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400 hover:text-indigo-600"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        
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
                          setCurrentModule({ ...currentModule, [lessonField]: newList.join("\n") });
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
                          setCurrentModule({ ...currentModule, [lessonField]: newList.join("\n") });
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
                    const list = (currentModule[lessonField] || "").split("\n").filter(Boolean);
                    if (!list.includes(newVal.trim())) {
                      const newList = [...list, newVal.trim()];
                      setCurrentModule({ ...currentModule, [lessonField]: newList.join("\n") });
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

  

  return {
    editingStandaloneIndex, setEditingStandaloneIndex,
    handleAddStandaloneQuestion, handleEditStandaloneQuestion, handleSaveStandaloneQuestion, removeStandaloneQuestion,
    handleAddQuestionForSource, handleEditQuestionForSource, handleSaveQuestionForSource, removeQuestionForSource, moveQuestionForSource,
    updateCurrentQuestionField, updateQuestionOption, toggleQuestionCorrectAnswer, isQuestionCorrectAnswer,
    addQuestionSection, updateQuestionSectionContent, removeQuestionSection,
    expandedQuestionIndex, setExpandedQuestionIndex,
    renderMetadataDropdown
  };
};
