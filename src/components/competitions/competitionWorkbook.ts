import * as XLSX from 'xlsx';
import { readQuestionImport } from '@/lib/questionExcelWorkbook';
import { applyQuestionMetadataRows } from '@/lib/questionMetadataExcel';
import { buildAdvancedMetadataTemplateRows } from '@/lib/examExcelTemplates';
import { normalizeCompetitionQuestion, questionForSave, newCompetitionQuestion, competitionTypes, type CompetitionQuestion } from './authoring';

const headers = ['Question ID', 'Action', 'Type', 'Question Text (Ar)', 'Question Text (En)', 'Options JSON', 'Options En JSON', 'Correct Answer JSON', 'Correct Answer En JSON', 'Points', 'Seconds', 'Group', 'Content JSON'];
const contentFields = ['sections', 'imageUrl', 'videoUrl', 'explanation', 'hint', 'tip', 'keyInsight'].flatMap(field => [field, field + 'En']);
const parse = (value: any, fallback?: any) => { if (value === '' || value === undefined || value === null) return fallback; try { return JSON.parse(String(value)); } catch { throw new Error('Invalid JSON / صيغة JSON غير صحيحة'); } };
export function competitionWorkbook(questions: CompetitionQuestion[] | null, language: string) {
  const examples = [
    { ...newCompetitionQuestion(), text: '٢ + ٢ = ؟', textEn: '2 + 2 = ?', options: ['4', '3'], correctAnswer: '4', points: 10 },
    { ...newCompetitionQuestion('TRUE_FALSE'), text: 'الأرض كوكب', textEn: 'Earth is a planet', options: ['True', 'False'], correctAnswer: 'True', points: 5 },
    { ...newCompetitionQuestion('MULTI_SELECT'), text: 'اختر الأعداد الزوجية', textEn: 'Choose the even numbers', options: ['2', '3', '4'], correctAnswer: ['2', '4'], points: 15 },
  ];
  const records = (questions || examples).map(question => {
    const q = questionForSave(question);
    const content = Object.fromEntries(contentFields.map(field => [field, q[field] ?? q.metadata?.[field]]).filter(([, value]) => value !== undefined));
    return [questions ? q.id : '', questions ? 'UPDATE' : 'ADD', q.type, q.text, q.textEn || '', JSON.stringify(q.options), q.optionsEn ? JSON.stringify(q.optionsEn) : '', JSON.stringify(q.correctAnswer), q.correctAnswerEn != null ? JSON.stringify(q.correctAnswerEn) : '', q.points, q.seconds, q.group || '', JSON.stringify(content)];
  });
  const workbook = XLSX.utils.book_new(); const sheet = XLSX.utils.aoa_to_sheet([headers, ...records]); sheet['!cols'] = headers.map(header => ({ wch: /JSON|Text/.test(header) ? 45 : 22 })); XLSX.utils.book_append_sheet(workbook, sheet, 'Questions');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([[language === 'ar' ? 'اترك ID فارغًا وAction=ADD للإضافة؛ UPDATE يحافظ على المعرف؛ DELETE يحذف السؤال من مسودة المسابقة فقط. الدرجة من 1 إلى 10000، والوقت من 5 إلى 3600 ثانية. Content JSON للشرح والتلميحات والوسائط فقط. التصنيفات والمهارات والصعوبة في نموذج الميتا داتا المنفصل المرتبط بمعرف السؤال.' : 'Leave ID blank and use ADD for new questions. UPDATE keeps the ID; DELETE removes a question from this competition draft only. Points: 1–10000. Seconds: 5–3600. Content JSON contains explanations, hints and media only. Taxonomies, skills and difficulty use the separate Metadata Template linked by Question ID.'], ['Types', ...competitionTypes.map(type => type[0])], ['JSON examples', '["Choice A","Choice B"]', '"Choice A"', '["Choice A","Choice C"]']]), 'Instructions');
  return workbook;
}
export function importCompetitionWorkbook(workbook: XLSX.WorkBook, current: CompetitionQuestion[], language: string) {
  const sheet = workbook.Sheets.Questions || workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  if (rows.length < 2) throw new Error('Empty workbook / الملف فارغ');
  const names = rows[0].map(value => String(value).trim());
  if (!names.includes('Options JSON')) {
    const plan = readQuestionImport(workbook, current.map(questionForSave), true, language);
    return plan.questions.map(normalizeCompetitionQuestion);
  }
  const get = (row: any[], name: string) => names.includes(name) ? row[names.indexOf(name)] : undefined;
  const result = current.map(question => ({ ...question })); const seen = new Set<string>();
  for (const row of rows.slice(1).filter(row => row.some(value => String(value).trim()))) {
    const action = String(get(row, 'Action') || 'ADD').trim().toUpperCase();
    const id = String(get(row, 'Question ID') || '').trim();
    if (!['ADD', 'UPDATE', 'DELETE'].includes(action) || (id && seen.has(id))) throw new Error('Invalid action or duplicate ID / إجراء غير صحيح أو معرف مكرر');
    if (id) seen.add(id);
    const index = result.findIndex(question => question.id === id);
    if (action !== 'ADD' && index < 0) throw new Error('Unknown question ID; export again / معرف السؤال غير موجود؛ أعد التصدير');
    if (action === 'DELETE') { result.splice(index, 1); continue; }
    const content = parse(get(row, 'Content JSON'), {});
    if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('Invalid content JSON / بيانات محتوى السؤال غير صالحة');
    const question = normalizeCompetitionQuestion({ ...(action === 'UPDATE' ? result[index] : {}), ...Object.fromEntries(contentFields.filter(field => Object.prototype.hasOwnProperty.call(content, field)).map(field => [field, content[field]])), id: action === 'UPDATE' ? id : undefined, type: get(row, 'Type') || 'MCQ', text: get(row, 'Question Text (Ar)'), textEn: get(row, 'Question Text (En)'), options: parse(get(row, 'Options JSON'), []), optionsEn: parse(get(row, 'Options En JSON')), correctAnswer: parse(get(row, 'Correct Answer JSON'), ''), correctAnswerEn: parse(get(row, 'Correct Answer En JSON')), points: Number(get(row, 'Points') || 100), seconds: Number(get(row, 'Seconds') || 30), metadata: parse(get(row, 'Metadata JSON'), action === 'UPDATE' ? result[index].metadata : {}), group: get(row, 'Group') || '' });
    if (!competitionTypes.some(type => type[0] === question.type) || !question.text.trim() || !Number.isInteger(question.points) || question.points < 1 || question.points > 10000 || !Number.isInteger(question.seconds) || question.seconds < 5 || question.seconds > 3600) throw new Error('Invalid question details / راجع نوع السؤال ونصه ودرجته ووقته');
    if (action === 'UPDATE') result[index] = question; else result.push(question);
  }
  if (result.length > 500) throw new Error('Maximum 500 questions / الحد الأقصى 500 سؤال');
  return result;
}
export function competitionMetadataWorkbook(questions: CompetitionQuestion[], language = 'en') {
  const workbook = XLSX.utils.book_new();
  const templateRows = buildAdvancedMetadataTemplateRows(language, questions.map(question => ({ ...question.metadata, ...question })));
  const rows = questions.length ? templateRows : templateRows.slice(0, 1);
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = rows[0].map(() => ({ wch: 32 }));
  XLSX.utils.book_append_sheet(workbook, sheet, 'Metadata');
  return workbook;
}
export function importCompetitionMetadata(workbook: XLSX.WorkBook, questions: CompetitionQuestion[]): CompetitionQuestion[] {
  const sheet = workbook.Sheets.Metadata || workbook.Sheets[workbook.SheetNames[0]];
  return applyQuestionMetadataRows(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }), questions) as CompetitionQuestion[];
}
