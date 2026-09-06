// @ts-nocheck
import { buildQuestionWorkbook, importModuleQuestions } from '@/lib/questionExcelWorkbook';
import { planQuestionImport } from '@/lib/questionExcelSync';
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from "xlsx";
import { useRef } from "react";
import { collectMetadataFromQuestions, mergeAvailableMetadata, normalizeDok } from '@/lib/examQuestionMetadata';
import { canCreateModule } from '@/lib/moduleCreationPolicy';
import { createModuleDraft, upsertModuleDraft } from '@/lib/moduleInlineWorkspace';
export const useModuleManagement = (
  props: any) => {
  const { t } = props;
  const { currentModule, setCurrentModule, modules, setModules, setIsModuleModalOpen, setEditingModuleIndex, setActiveTab, setAvailableMetadata, showToast, language, editingModuleIndex } = props;

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
    if (!file) { resolve([]); return; }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        
        if (rows.length < 2) { showToast(language === 'ar' ? "ملف Excel فارغ أو لا يحتوي على بيانات" : "Excel file is empty or does not contain data rows", "error"); resolve([]); return; }

        const headers = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());
          const idIdx = headers.findIndex(h => h.includes("id") || h.includes("معرف"));
        
        const stdIdx = headers.findIndex(h => h.includes("standard") || h.includes("معيار") || h.includes("المعايير"));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات"));
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات"));
        const domainIdx = headers.findIndex(h => h.includes("domain") || h.includes("مجال") || h.includes("الماجال"));
        const lessonIdx = headers.findIndex(h => h.includes("lesson") || h.includes("درس") || h.includes("الدرس"));

        if (stdIdx === -1 && indIdx === -1 && loIdx === -1 && domainIdx === -1) {
          showToast(t('courseCreate.excelNoHeaderError') || "Could not find matching columns (Standards, Indicators, Outcomes, Domain)", "error");
          return;
        }

        const standardVal = "";
        const indicatorVal = "";
        const outcomeVal = "";
        const domainVal = "";

        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim() !== ""));
        
        let filteredRows = dataRows;
        if (lessonIdx >= 0 && currentModule.title) {
          const currentModuleTitleLower = currentModule.title.trim().toLowerCase();
          const matchingRows = dataRows.filter(r => {
            const rowLesson = String(r[lessonIdx] ?? "").trim().toLowerCase();
            return rowLesson && (currentModuleTitleLower.includes(rowLesson) || rowLesson.includes(currentModuleTitleLower));
          });
          if (matchingRows.length > 0) {
            filteredRows = matchingRows;
          }
        }

        if (filteredRows.length > 0) {
          const standardsList = filteredRows.map(r => stdIdx >= 0 ? String(r[stdIdx] ?? "").trim() : "").filter(Boolean);
          const indicatorsList = filteredRows.map(r => indIdx >= 0 ? String(r[indIdx] ?? "").trim() : "").filter(Boolean);
          const outcomesList = filteredRows.map(r => loIdx >= 0 ? String(r[loIdx] ?? "").trim() : "").filter(Boolean);
          const domainList = filteredRows.map(r => domainIdx >= 0 ? String(r[domainIdx] ?? "").trim() : "").filter(Boolean);

          setAvailableMetadata((prev: any) => mergeAvailableMetadata(prev, {
            domains: Array.from(new Set(domainList)),
            standards: Array.from(new Set(standardsList)),
            indicators: Array.from(new Set(indicatorsList)),
            outcomes: Array.from(new Set(outcomesList))
          }));

          setCurrentModule((prev: any) => ({
            ...prev,
            domain: prev.domain || domainList[0] || "",
            standards: prev.standards || standardsList[0] || "",
            indicators: prev.indicators || indicatorsList[0] || "",
            learningOutcomes: prev.learningOutcomes || outcomesList[0] || ""
          }));
        }

        showToast(t('courseCreate.excelMetadataSuccess') || "Standards, indicator and domain successfully imported from Excel", "success");
      } catch (err) {
        console.error(err);
        showToast(t('courseCreate.excelMetadataError') || "Error reading Excel file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const excelContext = useRef(props);
  excelContext.current = props;
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
    const wsData = [
      ["Module Title", "Standard", "Indicator", "Outcome", "Domain"],
      ["مقدمة في الفيزياء", "Standard 1: Understanding & Comprehension", "Indicator 1: Identifies Basic Concepts", "Outcome 1: Student will be able to...", "الفيزياء"],
      ["مقدمة في الفيزياء", "Standard 2: Application & Analysis", "Indicator 2: Applies Mathematical Laws", "Outcome 2: Student will distinguish between...", "الفيزياء"],
      ["الحركة الموجية", "Standard 3: Critical Thinking", "Indicator 3: Infers Relationships", "Outcome 3: Student will analyze...", "الفيزياء"]
    ];
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
    const wsData = [];
    const headersAr = ['Question ID', 'Question Text', 'الاختبار', 'القسم', 'المجال', 'نواتج التعلم', 'المؤشرات', 'المهارة', 'المهارة الفرعية', 'المهارة الدقيقة', 'الصعوبة', 'عمق المعرفة (DOK)', 'المستوى المعرفي', 'نمط الخطأ', 'Estimated Time'];
    const headersEn = ['Question ID', 'Question Text', 'Exam', 'Section', 'Domain', 'Learning Outcomes', 'Indicators', 'Skill', 'Subskill', 'Micro Skill', 'Difficulty', 'DOK', 'Cognitive', 'Error Pattern', 'Estimated Time'];
    wsData.push(language === 'ar' ? headersAr : headersEn);
    
    if (list.length === 0) {
      if (language === 'ar') {
        wsData.push(['', 'نص السؤال...', 'مقدمة في الفيزياء', 'القسم الاول', 'الفيزياء', 'Student will be able to...', 'Identifies Basic Concepts', 'General', 'Specific', 'Micro', 'Medium', 'DOK 2', 'Application', '', '5 mins']);
      } else {
        wsData.push(['', 'Sample Question...', 'Physics Intro', 'Section One', 'Physics', 'Student will be able to...', 'Identifies Basic Concepts', 'General', 'Specific', 'Micro', 'Medium', 'DOK 2', 'Application', '', '5 mins']);
      }
    } else {
      list.forEach((q: any) => {
        const cleanText = q.text ? q.text.replace(/<[^>]*>?/gm, '').substring(0, 100) : '';
        wsData.push([
          q.id || '',
          cleanText,
          q.course || '',
          q.section || '',
          q.domain || '',
          q.standard || q.learningOutcome || '',
          q.indicator || '',
          q.skill || '',
          q.subskill || '',
          q.microSkill || '',
          q.level || '',
          normalizeDok(q.dok) || q.dok || '',
          q.cognitive || '',
          q.errorPattern || '',
          q.estimatedTime || ''
        ]);
      });
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Advanced Metadata Template');
    XLSX.writeFile(wb, 'advanced_metadata_template.xlsx');
    showToast(language === 'ar' ? 'تم تحميل قالب الميتا داتا المتقدمة بنجاح' : 'Advanced Metadata template downloaded successfully', 'success');
  };

  const handleAdvancedMetadataExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null, source: 'questions' | 'assignments'): Promise<any[]> => {
    return new Promise((resolve) => {
    const file = e.target.files?.[0];
    if (!file) { resolve([]); return; }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        
        if (rows.length < 2) { showToast(language === 'ar' ? "ملف Excel فارغ أو لا يحتوي على بيانات" : "Excel file is empty or does not contain data rows", "error"); resolve([]); return; }

        const headers = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());
          const idIdx = headers.findIndex(h => h.includes("id") || h.includes("معرف"));
        
        const courseIdx = headers.findIndex(h => h.includes("exam") || h.includes("course") || h.includes("اختبار") || h.includes("الاختبار"));
        const sectionIdx = headers.findIndex(h => h.includes("section") || h.includes("قسم") || h.includes("القسم"));
        const domainIdx = headers.findIndex(h => h.includes("domain") || h.includes("مجال") || h.includes("المجال"));
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات") || h.includes("learning") || h.includes("standard") || h.includes("معيار") || h.includes("المعايير"));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات"));
        const skillIdx = headers.findIndex(h => (h.includes("skill") || h.includes("مهارة") || h.includes("المهارة")) && !h.includes("sub") && !h.includes("micro") && !h.includes("فرعية") && !h.includes("دقيقة"));
        const subskillIdx = headers.findIndex(h => h.includes("subskill") || h.includes("فرعية"));
        const microSkillIdx = headers.findIndex(h => h.includes("micro") || h.includes("دقيقة"));
        const levelIdx = headers.findIndex(h => h.includes("difficulty") || h.includes("صعوبة"));
        const dokIdx = headers.findIndex(h => h.includes("dok") || h.includes("عمق") || h.includes("depth"));
        const cognitiveIdx = headers.findIndex(h => h.includes("cognitive") || h.includes("معرفي"));
        const errorPatternIdx = headers.findIndex(h => h.includes("error") || h.includes("خطأ"));
        const timeIdx = headers.findIndex(h => h.includes("time") || h.includes("وقت"));
        let finalTargetList: any[] = [];

        setCurrentModule((prev: any) => {
          const newState = { ...prev };
          let targetList = [];
          let isSubExam = false;

          if (source === 'questions' && activeSubExamIndex !== null && newState.subExams && newState.subExams[activeSubExamIndex]) {
            targetList = [...(newState.subExams[activeSubExamIndex].questions || [])];
            isSubExam = true;
          } else {
            targetList = [...(newState[source] || [])];
          }

          let mappedCount = 0;
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.every(c => String(c).trim() === "")) continue;
            
            let qIndex = -1;
              if (idIdx >= 0 && row[idIdx]) {
                const rowId = String(row[idIdx]).trim();
                qIndex = targetList.findIndex((q: any) => q.id === rowId || String(q.id) === rowId);
              }
              if (qIndex === -1) {
                qIndex = mappedCount;
              }
              let q: any;
              if (qIndex < targetList.length) {
              q = { ...targetList[qIndex] };
            } else {
              q = {
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
              };
              targetList.push(q);
                qIndex = targetList.length - 1;
              }

            if (courseIdx >= 0) q.course = String(row[courseIdx]).trim();
            if (sectionIdx >= 0) q.section = String(row[sectionIdx]).trim();
            if (domainIdx >= 0) q.domain = String(row[domainIdx]).trim();
            if (loIdx >= 0) {
              const loVal = String(row[loIdx]).trim();
              q.learningOutcome = loVal;
              q.standard = loVal;
            }
            if (indIdx >= 0) q.indicator = String(row[indIdx]).trim();
            if (skillIdx >= 0) q.skill = String(row[skillIdx]).trim();
            if (subskillIdx >= 0) q.subskill = String(row[subskillIdx]).trim();
            if (microSkillIdx >= 0) q.microSkill = String(row[microSkillIdx]).trim();
            if (levelIdx >= 0) q.level = String(row[levelIdx]).trim();
            if (dokIdx >= 0) q.dok = normalizeDok(row[dokIdx]) || String(row[dokIdx]).trim();
            if (cognitiveIdx >= 0) q.cognitive = String(row[cognitiveIdx]).trim();
            if (errorPatternIdx >= 0) q.errorPattern = String(row[errorPatternIdx]).trim();
            if (timeIdx >= 0) q.estimatedTime = String(row[timeIdx]).trim();
            
            targetList[qIndex] = q;
            mappedCount++;
          }

          if (isSubExam) {
            newState.subExams[activeSubExamIndex!].questions = targetList;
          } else {
            newState[source] = targetList;
          }

          finalTargetList = targetList;
            return newState;
          });
          setAvailableMetadata((prev: any) => mergeAvailableMetadata(prev, collectMetadataFromQuestions(finalTargetList)));
          showToast(language === 'ar' ? "تم استيراد الميتا داتا المتقدمة بنجاح" : "Advanced Metadata imported successfully", "success");
          resolve(finalTargetList);
        } catch (err) {
        console.error(err);
        showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف Excel" : "Error reading Excel file", "error");
          resolve([]);
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
    });
  };

  const downloadQuestionsTemplate = (type: 'questions' | 'assignments') => {
    XLSX.writeFile(buildQuestionWorkbook(null, language), type === 'assignments' ? 'assignments_template.xlsx' : 'practice_questions_template.xlsx');
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
