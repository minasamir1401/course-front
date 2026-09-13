import * as XLSX from 'xlsx';
import { buildQuestionWorkbook } from './questionExcelWorkbook';
import { planQuestionImport } from './questionExcelSync';

type Toast = (message: string, type: string) => void;

export function exportQuestionsToExcel(questions: any[], filename = 'questions_export.xlsx', language = 'ar', showToast: Toast = () => {}) {
  if (!questions?.length) {
    showToast(language === 'ar' ? 'لا توجد أسئلة لتصديرها' : 'No questions to export', 'error');
    return;
  }
  try {
    XLSX.writeFile(buildQuestionWorkbook(questions, language), filename);
    showToast(language === 'ar' ? 'تم تصدير الأسئلة للتعديل' : 'Questions exported for editing', 'success');
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), 'error');
  }
}

export function downloadQuestionsTemplate(type: 'questions' | 'assignments', language: string = 'ar', showToast: Toast) {
  const filename = language === 'ar'
    ? (type === 'assignments' ? 'قالب_التكليفات_ثنائي_اللغة.xlsx' : 'قالب_الأسئلة_ثنائي_اللغة.xlsx')
    : (type === 'assignments' ? 'assignments_bilingual_template.xlsx' : 'bilingual_questions_template.xlsx');
  XLSX.writeFile(buildQuestionWorkbook(null, language), filename);
  showToast(language === 'ar' ? 'تم تحميل القالب ثنائي اللغة مع التعليمات والأمثلة' : 'Bilingual template downloaded with instructions and examples', 'success');
}

// Legacy callers can still parse addition-only sheets. IDs must belong to current.
export function parseQuestionsFromExcel(rows: any[][], current: any[] = []) {
  return planQuestionImport(rows, current, { canDelete: false }).questions;
}
