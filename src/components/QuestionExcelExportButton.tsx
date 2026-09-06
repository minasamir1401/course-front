"use client";

import * as XLSX from 'xlsx';
import { buildQuestionWorkbook } from '@/lib/questionExcelWorkbook';

export function QuestionExcelExportButton({ questions, language }: { questions: any[]; language: string }) {
  return <button type="button" disabled={!questions.length}
    className="px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 font-bold text-xs disabled:opacity-40"
    onClick={() => {
      try { XLSX.writeFile(buildQuestionWorkbook(questions, language), 'questions_edit.xlsx'); }
      catch (error) { window.alert(error instanceof Error ? error.message : String(error)); }
    }}>
    {language === 'ar' ? 'تصدير الأسئلة للتعديل' : 'Export questions for editing'}
  </button>;
}
