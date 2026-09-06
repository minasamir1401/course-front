export { questionExportRows as buildQuestionExportRows } from './questionExcelSync';
import { questionTemplateRows } from './questionExcelSync';
export function buildQuestionTemplateRows(_type: 'questions' | 'assignments', language: string) {
  return questionTemplateRows(language);
}

import { normalizeDok } from './examQuestionMetadata';

export function buildAdvancedMetadataTemplateRows(language: string, list: any[]) {
  const rows = [[
    'Question ID',
    language === 'ar' ? 'الاختبار' : 'Exam',
    language === 'ar' ? 'القسم' : 'Section',
    language === 'ar' ? 'المجال' : 'Domain',
    language === 'ar' ? 'نواتج التعلم' : 'Learning Outcomes',
    language === 'ar' ? 'المؤشرات' : 'Indicators',
    language === 'ar' ? 'المهارة' : 'Skill',
    language === 'ar' ? 'المهارة الفرعية' : 'Subskill',
    language === 'ar' ? 'المهارة الدقيقة' : 'Micro Skill',
    language === 'ar' ? 'الصعوبة' : 'Difficulty',
    language === 'ar' ? 'عمق المعرفة (DOK)' : 'DOK',
    language === 'ar' ? 'المستوى المعرفي' : 'Cognitive',
    language === 'ar' ? 'نمط الخطأ' : 'Error Pattern',
    'Estimated Time',
  ]];

  if (!Array.isArray(list) || list.length === 0) {
    rows.push(language === 'ar'
      ? ['', 'مقدمة في الفيزياء', 'القسم الاول', 'الفيزياء', 'Student will be able to...', 'Identifies Basic Concepts', 'General', 'Specific', 'Micro', 'Medium', 'DOK 2', 'Application', '', '5 mins']
      : ['', 'Physics Intro', 'Section One', 'Physics', 'Student will be able to...', 'Identifies Basic Concepts', 'General', 'Specific', 'Micro', 'Medium', 'DOK 2', 'Application', '', '5 mins']);
    return rows;
  }

  for (const question of list) {
    rows.push([
      question.id || '',
      question.course || '',
      question.section || '',
      question.domain || '',
      question.standard || question.learningOutcome || '',
      question.indicator || '',
      question.skill || '',
      question.subskill || '',
      question.microSkill || '',
      question.level || '',
      normalizeDok(question.dok) || question.dok || '',
      question.cognitive || '',
      question.errorPattern || '',
      question.estimatedTime || '',
    ]);
  }

  return rows;
}
