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

export function downloadQuestionsTemplate(type: 'questions' | 'assignments', language: string, showToast: Toast) {
  XLSX.writeFile(buildQuestionWorkbook(null, language), type === 'assignments' ? 'assignments_template.xlsx' : 'practice_questions_template.xlsx');
  showToast(language === 'ar' ? 'تم تحميل القالب الجديد مع التعليمات والأمثلة' : 'Template downloaded with instructions and examples', 'success');
}

// Legacy callers can still parse addition-only sheets. IDs must belong to current.
export function parseQuestionsFromExcel(rows: any[][], current: any[] = []) {
  return planQuestionImport(rows, current, { canDelete: false }).questions;
}
