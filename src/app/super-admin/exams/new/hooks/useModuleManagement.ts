import { applyQuestionMetadataRows } from '@/lib/questionMetadataExcel';
import { metadataColumn, parseLessonMetadataRows } from '@/lib/lessonMetadataExcel';
// @ts-nocheck
import { buildQuestionWorkbook, importModuleQuestions } from '@/lib/questionExcelWorkbook';
import { planQuestionImport } from '@/lib/questionExcelSync';
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from "xlsx";
import { useRef, useEffect } from "react";
import { collectMetadataFromQuestions, mergeAvailableMetadata, normalizeDok } from '@/lib/examQuestionMetadata';
import { buildCourseMetadataTemplateRows, buildAdvancedMetadataTemplateRows } from '@/lib/examExcelTemplates';
import { canCreateModule } from '@/lib/moduleCreationPolicy';
import { createModuleDraft, upsertModuleDraft } from '@/lib/moduleInlineWorkspace';
export const useModuleManagement = (
  props: any) => {
  const { t } = props;
  const { currentModule, setCurrentModule, modules, setModules, setIsModuleModalOpen, setEditingModuleIndex, setActiveTab, setAvailableMetadata, showToast, language, editingModuleIndex } = props;

const latestMetadataModule = useRef(currentModule);
  useEffect(() => { latestMetadataModule.current = currentModule; }, [currentModule]);

const openAddModuleModal = () => {
    if (!canCreateModule(modules)) {
      showToast(language === 'ar' ? 'يوجد موديول بالفعل. أضف اختبارات داخل الموديول الحالي.' : 'A module already exists. Add exams inside the current module.', 'info');
      return;
    }
    setEditingModuleIndex(null);
    setCurrentModule(createModuleDraft(language));
    setActiveTab('info');
    setIsModuleModalOpen(true);
  };

  const openEditModuleModal = (index: number) => {
    setEditingModuleIndex(index);
    const lessonToEdit = { ...modules[index] };
    if (lessonToEdit.content === undefined || lessonToEdit.content === null) lessonToEdit.content = "";
    if (!lessonToEdit.slides || lessonToEdit.slides.length === 0) lessonToEdit.slides = [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", sections: [] }];
    if (!lessonToEdit.questions) lessonToEdit.questions = [];
    setCurrentModule(lessonToEdit);
    setActiveTab('info');
    setIsModuleModalOpen(true);
  };

  const saveModule = () => {
    if (!currentModule.title) {
      showToast(t('courseCreate.lessonTitleRequired') || "Lesson title is required", "error");
      return;
    }
    setModules(upsertModuleDraft(modules, currentModule, editingModuleIndex));
    setIsModuleModalOpen(false);
  };

  const metadataExcelRef = useRef<HTMLInputElement>(null);
  const advancedMetadataExcelRef = useRef<HTMLInputElement>(null);
  const questionsExcelRef = useRef<HTMLInputElement>(null);
  const assignmentsExcelRef = useRef<HTMLInputElement>(null);

    const exportQuestionsToExcel = (questions: any[], filename = 'questions_export.xlsx') => {
      try { XLSX.writeFile(buildQuestionWorkbook(questions, language), filename); }
      catch (error) { showToast(error instanceof Error ? error.message : String(error), 'error'); }
    };

  const parseQuestionsFromExcel = (rows: any[][]) => planQuestionImport(rows, [], { canDelete: false, language }).questions;

  const handleMetadataExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        if (latestMetadataModule.current !== currentModule) throw new Error(language === "ar" ? "تغير الموديول. أعد الاستيراد." : "The module changed. Import again.");
        const wb = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
        const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
        const imported = parseLessonMetadataRows(rows, currentModule.title);
        setAvailableMetadata((prev: any) => mergeAvailableMetadata(prev, {
          domains: [imported.domain, imported.domainEn].filter(Boolean),
          standards: [imported.standards, imported.standardsEn].filter(Boolean),
          indicators: [imported.indicators, imported.indicatorsEn].filter(Boolean),
          outcomes: [imported.learningOutcomes, imported.learningOutcomesEn].filter(Boolean)
        }));
        setCurrentModule((prev: any) => ({ ...prev, ...imported }));
        showToast(language === 'ar' ? 'تم استيراد البيانات باللغتين' : 'Bilingual metadata imported', 'success');
      } catch (error: any) { showToast(error.message, 'error'); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const excelContext = useRef(props);
  useEffect(() => {
    excelContext.current = props;
  });
  const handleQuestionsExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null) =>
    importModuleQuestions(e, activeSubExamIndex, 'questions', () => excelContext.current, true);
  const handleAssignmentsExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null) =>
    importModuleQuestions(e, activeSubExamIndex, 'assignments', () => excelContext.current, true);

  const handleExcelUpload = (type: 'questions' | 'metadata' | 'assignments' | 'advancedMetadata') => {
    if (type === 'metadata') {
      metadataExcelRef.current?.click();
    } else if (type === 'advancedMetadata') {
      advancedMetadataExcelRef.current?.click();
    } else if (type === 'questions') {
      questionsExcelRef.current?.click();
    } else if (type === 'assignments') {
      assignmentsExcelRef.current?.click();
    }
  };

  const downloadMetadataTemplate = () => {
    const wsData = buildCourseMetadataTemplateRows(language);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metadata Template");
    XLSX.writeFile(wb, "course_metadata_template.xlsx");
    showToast(language === 'ar' ? "تم تحميل نموذج المعايير بنجاح" : "Metadata template downloaded successfully", "success");
  };

  const downloadAdvancedMetadataTemplate = (activeSubExamIndex: number | null, source: 'questions' | 'assignments' = 'questions') => {
    let list = [];
    if (source === 'questions' && activeSubExamIndex !== null && currentModule.subExams && currentModule.subExams[activeSubExamIndex]) {
      list = currentModule.subExams[activeSubExamIndex].questions || [];
    } else {
      list = currentModule[source] || [];
    }
    const wsData = buildAdvancedMetadataTemplateRows(list, language);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Advanced Metadata Template');
    XLSX.writeFile(wb, 'advanced_metadata_template.xlsx');
    showToast(language === 'ar' ? 'تم تحميل قالب الميتا داتا المتقدمة بنجاح' : 'Advanced Metadata template downloaded successfully', 'success');
  };

  const handleAdvancedMetadataExcelChange = async (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null, source: 'questions' | 'assignments'): Promise<any[]> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return [];
    try {
      const data = await file.arrayBuffer();
      if (latestMetadataModule.current !== currentModule) throw new Error(language === 'ar' ? 'تغير الموديول. أعد الاستيراد.' : 'The module changed. Import again.');
      const wb = XLSX.read(data, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
      const child = source === 'questions' && activeSubExamIndex !== null ? currentModule.subExams?.[activeSubExamIndex] : null;
      const target = child?.questions || currentModule[source] || [];
      const imported = applyQuestionMetadataRows(rows, target);
      setCurrentModule((prev: any) => {
        const live = child ? prev.subExams?.[activeSubExamIndex!]?.questions || [] : prev[source] || [];
        const updated = applyQuestionMetadataRows(rows, live);
        return child ? { ...prev, subExams: prev.subExams.map((item: any, i: number) => i === activeSubExamIndex ? { ...item, questions: updated } : item) } : { ...prev, [source]: updated };
      });
      setAvailableMetadata((prev: any) => mergeAvailableMetadata(prev, collectMetadataFromQuestions(imported)));
      showToast(language === 'ar' ? 'تم تحديث Metadata باللغتين' : 'Bilingual metadata updated', 'success');
      return imported;
    } catch (error: any) { showToast(error.message, 'error'); return []; }
  };

  const downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    const filename = language === 'ar'
      ? (type === 'assignments' ? 'قالب_التكليفات_ثنائي_اللغة.xlsx' : 'قالب_الأسئلة_ثنائي_اللغة.xlsx')
      : (type === 'assignments' ? 'assignments_bilingual_template.xlsx' : 'bilingual_questions_template.xlsx');
    XLSX.writeFile(buildQuestionWorkbook(null, language), filename);
    showToast(language === 'ar' ? 'تم تحميل القالب ثنائي اللغة بنجاح' : 'Bilingual template downloaded successfully', 'success');
  };
  const addBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'MCQ', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    setCurrentModule((prev: any) => ({
      ...prev,
      [source]: [...(prev[source] || []), newBlock]
    }));
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'MCQ', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 0, newBlock);
      return { ...prev, [source]: newSlides };
    });
    showToast("Slide inserted successfully", "success");
  };

  const moveBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, direction: 'UP' | 'DOWN') => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSlides.length) return prev;
      [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
      return { ...prev, [source]: newSlides };
    });
  };



  
  const handleRemoveModule = (index: number) => {
    const confirmMessage = language === 'ar' ? "هل أنت متأكد من حذف هذه الوحدة؟" : "Are you sure you want to delete this module?";
    if (confirm(confirmMessage)) {
      const newModules = [...modules];
      newModules.splice(index, 1);
      setModules(newModules);
    }
  };

  return {
    openAddModuleModal, openEditModuleModal, handleRemoveModule, saveModule, exportQuestionsToExcel, parseQuestionsFromExcel, handleMetadataExcelChange, handleQuestionsExcelChange, handleAssignmentsExcelChange, handleExcelUpload, downloadMetadataTemplate, metadataExcelRef, advancedMetadataExcelRef, questionsExcelRef, assignmentsExcelRef, handleAdvancedMetadataExcelChange, downloadAdvancedMetadataTemplate, downloadQuestionsTemplate
  };
};
