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
        
        const stdArIdx = headers.findIndex(h => (h.includes("standard") || h.includes("معيار") || h.includes("المعايير")) && (h.includes("ar") || h.includes("عرب")));
        const stdEnIdx = headers.findIndex(h => (h.includes("standard") || h.includes("معيار") || h.includes("المعايير")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const stdIdx = headers.findIndex(h => h.includes("standard") || h.includes("معيار") || h.includes("المعايير"));

        const indArIdx = headers.findIndex(h => (h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات")) && (h.includes("ar") || h.includes("عرب")));
        const indEnIdx = headers.findIndex(h => (h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات"));

        const loArIdx = headers.findIndex(h => (h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات")) && (h.includes("ar") || h.includes("عرب")));
        const loEnIdx = headers.findIndex(h => (h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات"));

        const domainArIdx = headers.findIndex(h => (h.includes("domain") || h.includes("مجال") || h.includes("الماجال")) && (h.includes("ar") || h.includes("عرب")));
        const domainEnIdx = headers.findIndex(h => (h.includes("domain") || h.includes("مجال") || h.includes("الماجال")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const domainIdx = headers.findIndex(h => h.includes("domain") || h.includes("مجال") || h.includes("الماجال"));

        const lessonArIdx = headers.findIndex(h => (h.includes("lesson") || h.includes("درس") || h.includes("الدرس")) && (h.includes("ar") || h.includes("عرب")));
        const lessonEnIdx = headers.findIndex(h => (h.includes("lesson") || h.includes("درس") || h.includes("الدرس")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const lessonIdx = headers.findIndex(h => h.includes("lesson") || h.includes("درس") || h.includes("الدرس"));

        if (stdIdx === -1 && indIdx === -1 && loIdx === -1 && domainIdx === -1) {
          showToast(t('courseCreate.excelNoHeaderError') || "Could not find matching columns (Standards, Indicators, Outcomes, Domain)", "error");
          return;
        }

        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim() !== ""));
        
        let filteredRows = dataRows;
        if (currentModule.title) {
          const currentModuleTitleLower = currentModule.title.trim().toLowerCase();
          const matchingRows = dataRows.filter(r => {
            const rowLessonAr = lessonArIdx >= 0 ? String(r[lessonArIdx] ?? "").trim().toLowerCase() : "";
            const rowLessonEn = lessonEnIdx >= 0 ? String(r[lessonEnIdx] ?? "").trim().toLowerCase() : "";
            const rowLesson = lessonIdx >= 0 ? String(r[lessonIdx] ?? "").trim().toLowerCase() : "";
            return (rowLessonAr && (currentModuleTitleLower.includes(rowLessonAr) || rowLessonAr.includes(currentModuleTitleLower))) ||
              (rowLessonEn && (currentModuleTitleLower.includes(rowLessonEn) || rowLessonEn.includes(currentModuleTitleLower))) ||
              (rowLesson && (currentModuleTitleLower.includes(rowLesson) || rowLesson.includes(currentModuleTitleLower)));
          });
          if (matchingRows.length > 0) {
            filteredRows = matchingRows;
          }
        }

        if (filteredRows.length > 0) {
          const pickVal = (r: any[], arIdx: number, enIdx: number, fallbackIdx: number) => {
            const arVal = arIdx >= 0 ? String(r[arIdx] ?? "").trim() : "";
            const enVal = enIdx >= 0 ? String(r[enIdx] ?? "").trim() : "";
            const fbVal = fallbackIdx >= 0 ? String(r[fallbackIdx] ?? "").trim() : "";
            if (language === 'en') {
              return enVal || arVal || fbVal;
            }
            return arVal || enVal || fbVal;
          };

          const standardsList = filteredRows.map(r => pickVal(r, stdArIdx, stdEnIdx, stdIdx)).filter(Boolean);
          const indicatorsList = filteredRows.map(r => pickVal(r, indArIdx, indEnIdx, indIdx)).filter(Boolean);
          const outcomesList = filteredRows.map(r => pickVal(r, loArIdx, loEnIdx, loIdx)).filter(Boolean);
          const domainList = filteredRows.map(r => pickVal(r, domainArIdx, domainEnIdx, domainIdx)).filter(Boolean);

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

        const courseArIdx = headers.findIndex(h => (h.includes("exam") || h.includes("course") || h.includes("اختبار")) && (h.includes("ar") || h.includes("عرب")));
        const courseEnIdx = headers.findIndex(h => (h.includes("exam") || h.includes("course") || h.includes("اختبار")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const courseIdx = headers.findIndex(h => h.includes("exam") || h.includes("course") || h.includes("اختبار"));

        const sectionArIdx = headers.findIndex(h => (h.includes("section") || h.includes("قسم")) && (h.includes("ar") || h.includes("عرب")));
        const sectionEnIdx = headers.findIndex(h => (h.includes("section") || h.includes("قسم")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const sectionIdx = headers.findIndex(h => h.includes("section") || h.includes("قسم"));

        const domainArIdx = headers.findIndex(h => (h.includes("domain") || h.includes("مجال")) && (h.includes("ar") || h.includes("عرب")));
        const domainEnIdx = headers.findIndex(h => (h.includes("domain") || h.includes("مجال")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const domainIdx = headers.findIndex(h => h.includes("domain") || h.includes("مجال"));

        const loArIdx = headers.findIndex(h => (h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("standard") || h.includes("معيار")) && (h.includes("ar") || h.includes("عرب")));
        const loEnIdx = headers.findIndex(h => (h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("standard") || h.includes("معيار")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("learning") || h.includes("standard") || h.includes("معيار"));

        const indArIdx = headers.findIndex(h => (h.includes("indicator") || h.includes("مؤشر")) && (h.includes("ar") || h.includes("عرب")));
        const indEnIdx = headers.findIndex(h => (h.includes("indicator") || h.includes("مؤشر")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر"));

        const skillArIdx = headers.findIndex(h => (h.includes("skill") || h.includes("مهارة")) && !h.includes("sub") && !h.includes("micro") && !h.includes("فرعية") && !h.includes("دقيقة") && (h.includes("ar") || h.includes("عرب")));
        const skillEnIdx = headers.findIndex(h => (h.includes("skill") || h.includes("مهارة")) && !h.includes("sub") && !h.includes("micro") && !h.includes("فرعية") && !h.includes("دقيقة") && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const skillIdx = headers.findIndex(h => (h.includes("skill") || h.includes("مهارة")) && !h.includes("sub") && !h.includes("micro") && !h.includes("فرعية") && !h.includes("دقيقة"));

        const subskillArIdx = headers.findIndex(h => (h.includes("subskill") || h.includes("فرعية")) && (h.includes("ar") || h.includes("عرب")));
        const subskillEnIdx = headers.findIndex(h => (h.includes("subskill") || h.includes("فرعية")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const subskillIdx = headers.findIndex(h => h.includes("subskill") || h.includes("فرعية"));

        const microSkillArIdx = headers.findIndex(h => (h.includes("micro") || h.includes("دقيقة")) && (h.includes("ar") || h.includes("عرب")));
        const microSkillEnIdx = headers.findIndex(h => (h.includes("micro") || h.includes("دقيقة")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
        const microSkillIdx = headers.findIndex(h => h.includes("micro") || h.includes("دقيقة"));

        const levelIdx = headers.findIndex(h => h.includes("difficulty") || h.includes("صعوبة") || h.includes("level"));
        const dokIdx = headers.findIndex(h => h.includes("dok") || h.includes("عمق") || h.includes("depth"));
        const cognitiveIdx = headers.findIndex(h => h.includes("cognitive") || h.includes("معرفي"));

        const errorPatternArIdx = headers.findIndex(h => (h.includes("error") || h.includes("خطأ")) && (h.includes("ar") || h.includes("عرب")));
        const errorPatternEnIdx = headers.findIndex(h => (h.includes("error") || h.includes("خطأ")) && (h.includes("en") || h.includes("إنجل") || h.includes("انجل")));
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

            const readVal = (idx: number) => idx >= 0 && row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '';

            const courseAr = readVal(courseArIdx) || readVal(courseIdx);
            const courseEn = readVal(courseEnIdx);
            if (courseAr) q.course = courseAr;
            if (courseEn) q.courseEn = courseEn;

            const sectionAr = readVal(sectionArIdx) || readVal(sectionIdx);
            const sectionEn = readVal(sectionEnIdx);
            if (sectionAr) q.section = sectionAr;
            if (sectionEn) q.sectionEn = sectionEn;

            const domainAr = readVal(domainArIdx) || readVal(domainIdx);
            const domainEn = readVal(domainEnIdx);
            if (domainAr) q.domain = domainAr;
            if (domainEn) q.domainEn = domainEn;
            if (!q.domain && domainEn) q.domain = domainEn;

            const loAr = readVal(loArIdx) || readVal(loIdx);
            const loEn = readVal(loEnIdx);
            if (loAr) { q.learningOutcome = loAr; q.standard = loAr; }
            if (loEn) { q.learningOutcomeEn = loEn; q.standardEn = loEn; }
            if (!q.learningOutcome && loEn) { q.learningOutcome = loEn; q.standard = loEn; }

            const indAr = readVal(indArIdx) || readVal(indIdx);
            const indEn = readVal(indEnIdx);
            if (indAr) q.indicator = indAr;
            if (indEn) q.indicatorEn = indEn;
            if (!q.indicator && indEn) q.indicator = indEn;

            const skillAr = readVal(skillArIdx) || readVal(skillIdx);
            const skillEn = readVal(skillEnIdx);
            if (skillAr) q.skill = skillAr;
            if (skillEn) q.skillEn = skillEn;
            if (!q.skill && skillEn) q.skill = skillEn;

            const subskillAr = readVal(subskillArIdx) || readVal(subskillIdx);
            const subskillEn = readVal(subskillEnIdx);
            if (subskillAr) q.subskill = subskillAr;
            if (subskillEn) q.subskillEn = subskillEn;
            if (!q.subskill && subskillEn) q.subskill = subskillEn;

            const microAr = readVal(microSkillArIdx) || readVal(microSkillIdx);
            const microEn = readVal(microSkillEnIdx);
            if (microAr) q.microSkill = microAr;
            if (microEn) q.microSkillEn = microEn;
            if (!q.microSkill && microEn) q.microSkill = microEn;

            const lvl = readVal(levelIdx);
            if (lvl) q.level = lvl;

            const dokVal = readVal(dokIdx);
            if (dokVal) q.dok = normalizeDok(dokVal) || dokVal;

            const cog = readVal(cognitiveIdx);
            if (cog) q.cognitive = cog;

            const epAr = readVal(errorPatternArIdx) || readVal(errorPatternIdx);
            const epEn = readVal(errorPatternEnIdx);
            if (epAr) q.errorPattern = epAr;
            if (epEn) q.errorPatternEn = epEn;
            if (!q.errorPattern && epEn) q.errorPattern = epEn;

            const tVal = readVal(timeIdx);
            if (tVal) q.estimatedTime = tVal;
            
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
