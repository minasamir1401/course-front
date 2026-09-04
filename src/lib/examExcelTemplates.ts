const questionTemplateHeaders = {
  ar: [
    'نص السؤال',
    'نوع السؤال',
    'الخيار 1',
    'الخيار 2',
    'الخيار 3',
    'الخيار 4',
    'الخيار 5',
    'الإجابة الصحيحة',
    'الإجابات الصحيحة المتعددة',
    'الدرجة',
    'رابط الفيديو',
    'التفسير',
  ],
  en: [
    'Question Text',
    'Question Type',
    'Option 1',
    'Option 2',
    'Option 3',
    'Option 4',
    'Option 5',
    'Correct Answer',
    'Correct Answers',
    'Points',
    'Video URL',
    'Explanation',
  ],
};

export function buildQuestionExportRows(questionsToExport: any[], language: string) {
  const rows = [language === 'ar' ? questionTemplateHeaders.ar : questionTemplateHeaders.en];

  for (const question of questionsToExport || []) {
    let optionsArray = [];
    if (typeof question.options === 'string') {
      try {
        optionsArray = JSON.parse(question.options);
      } catch {
        optionsArray = [question.options];
      }
    } else if (Array.isArray(question.options)) {
      optionsArray = question.options;
    }

    rows.push([
      question.text ? question.text.replace(/<[^>]*>?/gm, '') : '',
      question.questionType || question.type || 'MCQ',
      optionsArray[0] || '',
      optionsArray[1] || '',
      optionsArray[2] || '',
      optionsArray[3] || '',
      optionsArray[4] || '',
      typeof question.correctAnswer === 'string' ? question.correctAnswer : JSON.stringify(question.correctAnswer || ''),
      Array.isArray(question.correctAnswers) ? question.correctAnswers.join(', ') : '',
      question.points || 1,
      question.videoUrl || '',
      question.explanation || '',
    ]);
  }

  return rows;
}

export function buildQuestionTemplateRows(_type: 'questions' | 'assignments', language: string) {
  const rows = [language === 'ar' ? questionTemplateHeaders.ar : questionTemplateHeaders.en];

  rows.push([
    language === 'ar' ? 'ما هو ناتج 5 + 5؟' : 'What is 5 + 5?',
    'MCQ',
    '8', '9', '10', '11', '',
    '10', '', '1',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    language === 'ar' ? 'الجمع الصحيح هو 10 لأن 5 زائد 5 يساوي 10' : '5 + 5 is 10',
  ]);
  rows.push([
    language === 'ar' ? 'الأرض كروية الشكل.' : 'The earth is round.',
    'TRUE_FALSE',
    '', '', '', '', '',
    language === 'ar' ? 'صحيح' : 'True', '', '1',
    '',
    '',
  ]);
  rows.push([
    language === 'ar' ? 'حدد قارات العالم القديم:' : 'Select the ancient world continents:',
    'MULTI_SELECT',
    language === 'ar' ? 'آسيا' : 'Asia',
    language === 'ar' ? 'أوروبا' : 'Europe',
    language === 'ar' ? 'أفريقيا' : 'Africa',
    language === 'ar' ? 'أستراليا' : 'Australia',
    '',
    '',
    language === 'ar' ? 'آسيا, أوروبا, أفريقيا' : 'Asia, Europe, Africa',
    '2',
    '',
    '',
  ]);

  return rows;
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
