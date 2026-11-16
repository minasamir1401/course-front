import { metadataColumn, parseLessonMetadataRows } from './lessonMetadataExcel';
import * as XLSX from 'xlsx';
export function downloadSkillTemplate(language: string = 'ar') {
  const isEn = language === 'en';
  const rows = isEn
    ? [{
      title: 'Example activity',
      questionText: 'What is 2 + 2?',
      type: 'MCQ',
      options: '["3","4","5","6"]',
      correctAnswer: 'B',
      points: 10,
      xpPoints: 10,
      difficulty: 'Medium',
      estimatedTime: 60,
      hint: '',
      explanation: '2 + 2 = 4',
    }]
    : [{
      'عنوان النشاط (title)': 'نشاط جمع الأعداد',
      'نص السؤال (questionText)': 'ما ناتج 2 + 2؟',
      'نوع السؤال (type)': 'MCQ',
      'الخيارات (options)': '["3","4","5","6"]',
      'الإجابة الصحيحة (correctAnswer)': '4',
      'النقاط (points)': 10,
      'نقاط الخبرة (xpPoints)': 10,
      'الصعوبة (difficulty)': 'متوسط',
      'الوقت المقدر (estimatedTime)': 60,
      'التلميح (hint)': 'اجمع العددين معاً',
      'الشرح (explanation)': 'ناتج جمع 2 + 2 يساوي 4',
    }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Activities');
  XLSX.writeFile(workbook, isEn ? 'activities-template-en.xlsx' : 'activities-template-ar.xlsx');
}
export function downloadSkillMetadataTemplate() {
  const rows = [['المعايير بالعربية (Standards Ar)', 'المعايير بالإنجليزية (Standards En)', 'المؤشرات بالعربية (Indicators Ar)', 'المؤشرات بالإنجليزية (Indicators En)', 'نواتج التعلم بالعربية (Outcomes Ar)', 'نواتج التعلم بالإنجليزية (Outcomes En)'], ['حل المعادلات', 'Solving equations', 'يعزل المتغير', 'Isolates the variable', 'يحل معادلة خطية', 'Solves a linear equation']];
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Standards'); XLSX.writeFile(workbook, 'skill-standards-bilingual.xlsx');
}
export async function readSkillMetadata(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Maximum file size: 5 MB');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' });
  const parsed = parseLessonMetadataRows(rows);
  const result: Record<string, any> = {};
  for (const [field, key] of [['standards', 'standards'], ['indicators', 'indicators'], ['learningOutcomes', 'outcomes']]) {
    if (parsed[field] !== undefined) result[key] = parsed[field].split('\n').filter(Boolean);
    if (parsed[field + 'En'] !== undefined) result[key + 'En'] = parsed[field + 'En'].split('\n').filter(Boolean);
  }
  // Preserve row-level pairing, including empty cells; independent deduplication loses translations.
  result.translations = {};
  for (const [field, key] of [['standards', 'standards'], ['indicators', 'indicators'], ['learningOutcomes', 'outcomes']]) {
    const ar = metadataColumn(rows[0], field, false), en = metadataColumn(rows[0], field, true);
    for (const row of rows.slice(1)) {
      const base = String(row[ar] ?? '').trim(), translated = String(row[en] ?? '').trim();
      if (base && translated) result.translations[base] = { ar: base, en: translated };
    }
  }
  return result;
}
