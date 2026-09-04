import * as XLSX from 'xlsx';
import {
  buildQuestionExportRows,
  buildQuestionTemplateRows,
} from '@/lib/examExcelTemplates';
import { normalizeDok } from '@/lib/examQuestionMetadata';

export const exportQuestionsToExcel = (
  questionsToExport: any[], 
  filename = 'questions_export.xlsx',
  language: string,
  showToast: (msg: string, type: string) => void
) => {
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

export const parseQuestionsFromExcel = (rows: any[][]) => {
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
  const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("مخرج") || h.includes("ناتج") || h.includes("التعلم") || h.includes("learning"));
  const diffIdx = headers.findIndex(h => h.includes("difficulty") || h.includes("صعوبة") || h.includes("الصعوبة"));
  const dokIdx = headers.findIndex(h => h.includes("dok") || h.includes("عمق") || h.includes("depth"));
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
    const rawStandard = stdIdx >= 0 ? String(row[stdIdx] ?? "").trim() : "";
    const indicator = indIdx >= 0 ? String(row[indIdx] ?? "").trim() : "";
    const rawLearningOutcome = loIdx >= 0 ? String(row[loIdx] ?? "").trim() : "";
    const finalOutcome = rawLearningOutcome || rawStandard;
    const standard = finalOutcome;
    const learningOutcome = finalOutcome;
    const videoUrl = videoIdx >= 0 ? String(row[videoIdx] ?? "").trim() : "";
    
    let level = diffIdx >= 0 ? String(row[diffIdx] ?? "").trim() : "On_Level";
    if (level.toLowerCase().includes("easy") || level.toLowerCase().includes("foundation") || level.includes("سهل") || level.includes("تأسيسي")) level = "Foundation";
    else if (level.toLowerCase().includes("hard") || level.toLowerCase().includes("advanced") || level.includes("صعب") || level.includes("متقدم")) level = "Advanced";
    else level = "On_Level";

    const dokRaw = dokIdx >= 0 ? String(row[dokIdx] ?? "").trim() : "";
    const dok = normalizeDok(dokRaw) || dokRaw;

    const explanation = expIdx >= 0 ? String(row[expIdx] ?? "").trim() : "";
    const sections = explanation ? [{ id: Date.now() + Math.random(), type: "EXPLANATION", content: explanation }] : [];

    parsed.push({
      id: Date.now() + Math.random(),
      type: "MCQ",
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

export const downloadMetadataTemplate = (language: string, showToast: (msg: string, type: string) => void) => {
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

export const downloadQuestionsTemplate = (type: 'questions' | 'assignments', language: string, showToast: (msg: string, type: string) => void) => {
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
