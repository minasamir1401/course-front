// @ts-nocheck
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from "xlsx";
import { useRef } from "react";
import {
  buildAdvancedMetadataTemplateRows,
  buildQuestionExportRows,
  buildQuestionTemplateRows,
} from '@/lib/examExcelTemplates';
export const useModuleManagement = (
  props: any) => {
  const { t } = props;
  const { currentModule, setCurrentModule, modules, setModules, setIsModuleModalOpen, setEditingModuleIndex, setActiveTab, setAvailableMetadata, showToast, language, editingModuleIndex } = props;

const openAddModuleModal = () => {
    setEditingModuleIndex(null);
    setCurrentModule({
      title: "",
      domain: "",
      content: "",
      videoUrl: "",
      summary: "",
      notes: "",
      standards: "",
      indicators: "",
      learningOutcomes: "",
      isVisible: true,
      publishDate: "",
      cutOffDate: "",
      slides: [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", videoUrl: "", sections: [] }],
      questions: [],
      assignments: [],
      attachments: []
    });
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
    const newLessons = [...modules];
    if (editingModuleIndex !== null) {
      newLessons[editingModuleIndex] = currentModule;
    } else {
      newLessons.push(currentModule);
    }
    setModules(newLessons);
    setIsModuleModalOpen(false);
  };

  const metadataExcelRef = useRef<HTMLInputElement>(null);
  const advancedMetadataExcelRef = useRef<HTMLInputElement>(null);
  const questionsExcelRef = useRef<HTMLInputElement>(null);
  const assignmentsExcelRef = useRef<HTMLInputElement>(null);

    const exportQuestionsToExcel = (questionsToExport: any[], filename = 'questions_export.xlsx') => {
    if (!questionsToExport || questionsToExport.length === 0) {
      showToast(language === 'ar' ? 'لا توجد أسئلة لتصديرها' : 'No questions to export', 'error');
      return;
    }

    const wsData = buildQuestionExportRows(questionsToExport, language);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, filename);
    showToast(language === 'ar' ? 'تم تصدير الأسئلة بنجاح' : 'Questions exported successfully', 'success');
  };

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
    const dokIdx = headers.findIndex(h => h.includes("dok"));
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
      
      let level = diffIdx >= 0 ? String(row[diffIdx] ?? "").trim() : "On_Level";
      if (level.toLowerCase().includes("easy") || level.toLowerCase().includes("foundation") || level.includes("سهل") || level.includes("تأسيسي")) level = "Foundation";
      else if (level.toLowerCase().includes("hard") || level.toLowerCase().includes("advanced") || level.includes("صعب") || level.includes("متقدم")) level = "Advanced";
      else level = "On_Level";

      const dokRaw = dokIdx >= 0 ? String(row[dokIdx] ?? "").trim() : "";
      const dok = ["DOK 1", "DOK 2", "DOK 3", "DOK 4"].includes(dokRaw) ? dokRaw : "";

      const explanation = expIdx >= 0 ? String(row[expIdx] ?? "").trim() : "";
      const sections = explanation ? [{ id: Date.now() + Math.random(), type: "EXPLANATION", content: explanation }] : [];

      parsed.push({
        id: Date.now() + Math.random(),
        type: "QUESTION",
        label: qType,
        title: qText.substring(0, 30) + "...",
        content: qText,
        text: qText,
        options,
        correctAnswer,
        correctAnswers,
        points,
        skill,
        standard,
        indicator,
        learningOutcome,
        level,
        dok,
        videoUrl,
        sections
      });
    }
    return parsed;
  };

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

          setAvailableMetadata({
            domains: Array.from(new Set(domainList)),
            standards: Array.from(new Set(standardsList)),
            indicators: Array.from(new Set(indicatorsList)),
            outcomes: Array.from(new Set(outcomesList))
          });

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

  const handleQuestionsExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null) => {
    const file = e.target.files?.[0];
    if (!file) { return; }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        
        const parsed = parseQuestionsFromExcel(rows);
        if (parsed.length === 0) {
          showToast(language === 'ar' ? "لم يتم العثور على أسئلة صالحة في الملف" : "No valid questions found in the file", "error");
          return;
        }

        const newStds = Array.from(new Set(parsed.map(q => q.standard).filter(Boolean)));
        const newInds = Array.from(new Set(parsed.map(q => q.indicator).filter(Boolean)));
        const newLos = Array.from(new Set(parsed.map(q => q.learningOutcome).filter(Boolean)));

        const currentStds = (currentModule.standards || "").split("\n").filter(Boolean);
        const currentInds = (currentModule.indicators || "").split("\n").filter(Boolean);
        const currentLos = (currentModule.learningOutcomes || "").split("\n").filter(Boolean);

        const updatedStds = Array.from(new Set([...currentStds, ...newStds])).join("\n");
        const updatedInds = Array.from(new Set([...currentInds, ...newInds])).join("\n");
        const updatedLos = Array.from(new Set([...currentLos, ...newLos])).join("\n");

        setCurrentModule((prev: any) => {
          const isSubExam = activeSubExamIndex !== null;
          const targetList = isSubExam ? (prev.subExams[activeSubExamIndex].questions || []) : (prev.questions || []);
          const newState = { ...prev };
          if (isSubExam) {
            newState.subExams[activeSubExamIndex].questions = [...targetList, ...parsed];
          } else {
            newState.questions = [...targetList, ...parsed];
          }
          newState.standards = updatedStds;
          newState.indicators = updatedInds;
          newState.learningOutcomes = updatedLos;
          return newState;
        });

        showToast(
          language === 'ar' 
            ? `تم استيراد ${parsed.length} سؤال بنجاح` 
            : `Imported ${parsed.length} questions successfully`, 
          "success"
        );
      } catch (err) {
        console.error(err);
        showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف Excel" : "Error reading Excel file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleAssignmentsExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null) => {
    const file = e.target.files?.[0];
    if (!file) { return; }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        
        const parsed = parseQuestionsFromExcel(rows);
        if (parsed.length === 0) {
          showToast(language === 'ar' ? "لم يتم العثور على واجبات صالحة في الملف" : "No valid assignments found in the file", "error");
          return;
        }

        const newStds = Array.from(new Set(parsed.map(q => q.standard).filter(Boolean)));
        const newInds = Array.from(new Set(parsed.map(q => q.indicator).filter(Boolean)));
        const newLos = Array.from(new Set(parsed.map(q => q.learningOutcome).filter(Boolean)));

        const currentStds = (currentModule.standards || "").split("\n").filter(Boolean);
        const currentInds = (currentModule.indicators || "").split("\n").filter(Boolean);
        const currentLos = (currentModule.learningOutcomes || "").split("\n").filter(Boolean);

        const updatedStds = Array.from(new Set([...currentStds, ...newStds])).join("\n");
        const updatedInds = Array.from(new Set([...currentInds, ...newInds])).join("\n");
        const updatedLos = Array.from(new Set([...currentLos, ...newLos])).join("\n");

        setCurrentModule((prev: any) => {
          const isSubExam = activeSubExamIndex !== null;
          const targetList = isSubExam ? (prev.subExams[activeSubExamIndex].assignments || []) : (prev.assignments || []);
          const newState = { ...prev };
          if (isSubExam) {
            newState.subExams[activeSubExamIndex].assignments = [...targetList, ...parsed];
          } else {
            newState.assignments = [...targetList, ...parsed];
          }
          newState.standards = updatedStds;
          newState.indicators = updatedInds;
          newState.learningOutcomes = updatedLos;
          return newState;
        });

        showToast(
          language === 'ar' 
            ? `تم استيراد ${parsed.length} واجب بنجاح` 
            : `Imported ${parsed.length} assignments successfully`, 
          "success"
        );
      } catch (err) {
        console.error(err);
        showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف Excel" : "Error reading Excel file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

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
    const wsData = buildAdvancedMetadataTemplateRows(language, list);
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
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج"));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات"));
        const skillIdx = headers.findIndex(h => (h.includes("skill") || h.includes("مهارة") || h.includes("المهارة")) && !h.includes("sub") && !h.includes("micro") && !h.includes("فرعية") && !h.includes("دقيقة"));
        const subskillIdx = headers.findIndex(h => h.includes("subskill") || h.includes("فرعية"));
        const microSkillIdx = headers.findIndex(h => h.includes("micro") || h.includes("دقيقة"));
        const levelIdx = headers.findIndex(h => h.includes("difficulty") || h.includes("صعوبة"));
        const dokIdx = headers.findIndex(h => h.includes("dok") || h.includes("عمق"));
        const cognitiveIdx = headers.findIndex(h => h.includes("cognitive") || h.includes("معرفي"));
        const errorPatternIdx = headers.findIndex(h => h.includes("error") || h.includes("خطأ"));
        const timeIdx = headers.findIndex(h => h.includes("time") || h.includes("وقت"));

        setCurrentModule((prev: any) => {
          const newState = { ...prev };
          let targetList = [];
          let isSubExam = false;
            let finalTargetList: any[] = [];

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
            if (loIdx >= 0) q.standard = String(row[loIdx]).trim(); // standard in UI maps to Learning Outcomes
            if (indIdx >= 0) q.indicator = String(row[indIdx]).trim();
            if (skillIdx >= 0) q.skill = String(row[skillIdx]).trim();
            if (subskillIdx >= 0) q.subskill = String(row[subskillIdx]).trim();
            if (microSkillIdx >= 0) q.microSkill = String(row[microSkillIdx]).trim();
            if (levelIdx >= 0) q.level = String(row[levelIdx]).trim();
            if (dokIdx >= 0) q.dok = String(row[dokIdx]).trim();
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
    const wsData = buildQuestionTemplateRows(type, language);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions Template");
    const filename = type === 'assignments' ? "assignments_template.xlsx" : "practice_questions_template.xlsx";
    XLSX.writeFile(wb, filename);
    showToast(
      language === 'ar' 
        ? "تم تحميل نموذج الأسئلة الاسترشادي بنجاح" 
        : "Questions template downloaded successfully", 
      "success"
    );
  };

  const addBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    setCurrentModule((prev: any) => ({
      ...prev,
      [source]: [...(prev[source] || []), newBlock]
    }));
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: `New Content`, content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: `New Question`, content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
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
