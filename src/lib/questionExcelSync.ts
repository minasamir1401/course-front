import { isOptionMatch } from './answerEvaluation';
type Question = Record<string, any>;
export const syncHeaders = ['Question ID', 'Action', 'Question Text', 'Question Type',
  'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5',
  'Correct Answer', 'Correct Answers', 'Points', 'Video URL', 'Explanation'];
const arabicHeaders = ['Question ID', 'Action', 'نص السؤال', 'نوع السؤال',
  'الخيار 1', 'الخيار 2', 'الخيار 3', 'الخيار 4', 'الخيار 5',
  'الإجابة الصحيحة', 'الإجابات الصحيحة المتعددة', 'الدرجة', 'رابط الفيديو', 'التفسير'];
const key = (v: unknown) => String(v ?? '').trim();
const array = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};

export function questionExportRows(questions: Question[], language: string): any[][] {
  return [language === 'ar' ? arabicHeaders : syncHeaders, ...questions.map(q => {
    const options = array(q.options);
    const rawOptions = typeof q.options === 'string' ? (() => { try { return JSON.parse(q.options); } catch { return q.options; } })() : q.options;
    if ((rawOptions != null && !Array.isArray(rawOptions)) || options.length > 5 || options.some(o => typeof o !== 'string')) {
      throw new Error('Edit complex options in the question editor. / عدّل الاختيارات المركبة من محرر الأسئلة.');
    }
    return [key(q.id), q.id ? 'UPDATE' : 'ADD', q.text ?? q.content ?? '',
      q.questionType || (q.type === 'QUESTION' ? q.label : q.type) || 'MCQ',
      ...Array.from({ length: 5 }, (_, i) => options[i] ?? ''),
      Array.isArray(q.correctAnswer) ? JSON.stringify(q.correctAnswer) : q.correctAnswer ?? '',
      JSON.stringify(array(q.correctAnswers).length ? array(q.correctAnswers)
        : (q.type === 'MULTI_SELECT' || q.label === 'MULTI_SELECT') ? array(q.correctAnswer) : []),
      q.points ?? 1, q.videoUrl ?? '', q.explanation ?? (q.sections?.length ? JSON.stringify(q.sections) : '')];
  })];
}

export function questionTemplateRows(language: string): any[][] {
  return questionExportRows([{ text: language === 'ar' ? 'ما ناتج 5 + 5؟' : 'What is 5 + 5?',
    type: 'MCQ', options: ['8', '9', '10', '11'], correctAnswer: '10', points: 1 },
    { text: language === 'ar' ? 'الأرض كروية الشكل.' : 'The Earth is spherical.',
      type: 'TRUE_FALSE', options: [], correctAnswer: 'True', points: 1 },
    { text: language === 'ar' ? 'اختر الأعداد الزوجية.' : 'Select the even numbers.',
      type: 'MULTI_SELECT', options: ['2', '3', '4', '5'], correctAnswers: ['2', '4'], points: 2 },
    { text: language === 'ar' ? 'اكتب تقريرًا قصيرًا عن موضوع الدرس.' : 'Write a short report about the lesson.',
      type: 'TEXT', options: [], correctAnswer: '', points: 1 },
  ], language);
}

export function planQuestionImport(rows: any[][], current: Question[], options: {
  canDelete: boolean; exportedIds?: string[]; language?: string;
}) {
  const ar = options.language === 'ar';
  const fail = (en: string, arabic: string): never => { throw new Error(ar ? arabic : en); };
  const headers = (rows[0] || []).map(h => key(h).toLowerCase());
  const index = (...names: string[]) => headers.findIndex(h => names.includes(h));
  const idIndex = index('question id', 'معرف السؤال', 'رقم السؤال');
  const actionIndex = index('action', 'الإجراء');
  const textIndex = index('question text', 'question', 'نص السؤال', 'السؤال', 'question prompt (نص السؤال)', 'assignment prompt (نص التكليف)');
  if (textIndex < 0) fail('Missing Question Text column.', 'عمود نص السؤال غير موجود.');
  const currentById = new Map(current.map(q => [key(q.id), q]));
  const seen = new Set<string>();
  const updates = new Map<string, Question>();
  const added: Question[] = [];
  const deleted = new Set<string>();
  let updated = 0;
  let unchanged = 0;
  for (const [offset, row] of rows.slice(1).entries()) {
    if (!row.some(c => key(c))) continue;
    const rowFail = (en: string, arabic: string): never => fail(`Row ${offset + 2}: ${en}`, `الصف ${offset + 2}: ${arabic}`);
    const id = idIndex < 0 ? '' : key(row[idIndex]);
    const action = actionIndex < 0 ? '' : key(row[actionIndex]).toUpperCase();
    if (!['', 'ADD', 'UPDATE', 'DELETE', 'إضافة', 'تعديل', 'حذف'].includes(action)) rowFail('Invalid Action.', 'الإجراء غير صحيح.');
    if (id && seen.has(id)) rowFail('Duplicate Question ID.', 'رقم السؤال مكرر.');
    if (id && !currentById.has(id)) rowFail('Question ID is not in this list. Export again.', 'رقم السؤال لا ينتمي للقائمة الحالية. أعد التصدير.');
    if (id) seen.add(id);
    if (['DELETE', 'حذف'].includes(action)) {
      if (!id) rowFail('Deletion requires Question ID.', 'الحذف يحتاج رقم السؤال.');
      deleted.add(id); continue;
    }
    if (id && ['ADD', 'إضافة'].includes(action)) rowFail('Leave Question ID blank for additions.', 'اترك رقم السؤال فارغًا عند الإضافة.');
    if (!id && ['UPDATE', 'تعديل'].includes(action)) rowFail('Update requires Question ID.', 'التعديل يحتاج رقم السؤال.');
    const previous = id ? currentById.get(id)! : undefined;
    const q: Question = { ...(previous || { points: 1, skill: 'General', options: [], correctAnswer: '', correctAnswers: [] }) };
    q.text = String(row[textIndex] ?? '');
    if (!key(q.text)) rowFail('Question text is required.', 'نص السؤال مطلوب.');
    const typeIndex = index('question type', 'type', 'نوع السؤال', 'النوع', 'type (mcq/true_false/text/multi_select)');
    let type = typeIndex < 0 ? (previous?.type === 'QUESTION' ? previous.label : previous?.type) || 'MCQ' : key(row[typeIndex]).toUpperCase();
    if (['صح وخطأ', 'صح أو خطأ', 'T/F'].includes(type)) type = 'TRUE_FALSE';
    if (!['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'TEXT'].includes(type)) rowFail('Use the editor for this question type.', 'هذا النوع يُعدّل من محرر الأسئلة.');
    q.type = type;
    q.label = type;
    if (previous?.questionType) q.questionType = type;
    q.content = q.text;
    q.title = previous?.title ?? q.text.substring(0, 30);
    const optionIndices = Array.from({ length: 5 }, (_, i) => index(`option ${i + 1}`, `الخيار ${i + 1}`, ...(i === 0 ? ['option 1 / answer'] : [])));
    if (optionIndices.some(i => i >= 0)) {
      q.options = optionIndices.map((i, n) => i < 0 ? array(previous?.options)[n] ?? '' : String(row[i] ?? ''));
      while (q.options.length && !key(q.options[q.options.length - 1])) q.options.pop();
    } else q.options = array(q.options);
    const legacyAnswerIndex = index('correct answer (1-4 or comma separated for multi)');
    const correctIndex = index('correct answer', 'الإجابة الصحيحة', 'الاجابه الصحيحه', 'correct answer (1-4 or comma separated for multi)');
    if (correctIndex >= 0) q.correctAnswer = String(row[correctIndex] ?? '');
    const multiIndex = index('correct answers', 'الإجابات الصحيحة المتعددة', 'الإجابات الصحيحة');
    if (multiIndex >= 0) {
      const value = key(row[multiIndex]);
      q.correctAnswers = value.startsWith('[') ? array(value) : value.split(',').map(key).filter(Boolean);
    } else if (type === 'MULTI_SELECT') q.correctAnswers = array(q.correctAnswers).length ? array(q.correctAnswers) : array(q.correctAnswer);
    if (legacyAnswerIndex >= 0 && type !== 'TRUE_FALSE') {
      const resolve = (v: string) => /^[1-5]$/.test(v) ? q.options[Number(v) - 1] ?? v : v;
      if (type === 'MULTI_SELECT') q.correctAnswers = String(row[legacyAnswerIndex] ?? '').split(',').map(v => resolve(v.trim())).filter(Boolean);
      else q.correctAnswer = resolve(q.correctAnswer);
    }
    if (type !== 'MULTI_SELECT') q.correctAnswers = [];
    const pointsIndex = index('points', 'الدرجة', 'النقاط', 'الدرجه');
    if (pointsIndex >= 0) {
      const points = key(row[pointsIndex]) === '' ? previous?.points ?? 1 : Number(row[pointsIndex]);
      if (!Number.isInteger(points) || points < 1) rowFail('Points must be a positive integer.', 'الدرجة يجب أن تكون عددًا صحيحًا موجبًا.');
      q.points = points;
    }
    const videoIndex = index('video url', 'رابط الفيديو');
    if (videoIndex >= 0) q.videoUrl = String(row[videoIndex] ?? '');
    const metadataFields: Record<string, string[]> = {
      skill: ['skill', 'المهارة'], standard: ['standard', 'المعيار'],
      learningOutcome: ['learning outcome', 'learning outcomes', 'نواتج التعلم'],
      indicator: ['indicator', 'indicators', 'المؤشر', 'المؤشرات'],
      level: ['difficulty', 'difficulty level', 'الصعوبة'], dok: ['dok', 'عمق المعرفة'],
    };
    let metadataChanged = false;
    for (const [field, names] of Object.entries(metadataFields)) {
      const i = index(...names);
      if (i >= 0) {
        q[field] = String(row[i] ?? '');
        if (q[field] !== previous?.[field]) metadataChanged = true;
      }
    }
    if (index(...metadataFields.learningOutcome) >= 0) q.standard = q.learningOutcome;
    else if (index(...metadataFields.standard) >= 0) q.learningOutcome = q.standard;
    const expIndex = index('explanation', 'التفسير', 'الشرح', 'explanation / tip / solution note');
    if (expIndex >= 0 && (!previous || String(row[expIndex] ?? '') !== questionExportRows([previous], 'en')[1][13])) {
      q.explanation = String(row[expIndex] ?? '');
      q.clearExplanation = q.explanation === '';
      q.sections = array(q.explanation);
      if (!q.sections.length && q.explanation) q.sections = [{ type: 'EXPLANATION', content: q.explanation }];
    }
    if (['MCQ', 'MULTI_SELECT'].includes(type) && q.options.filter((o: any) => key(o)).length < 2) rowFail('At least two options are required.', 'مطلوب اختياران على الأقل.');
    if (type === 'MCQ' && !q.options.some((o: string, i: number) => isOptionMatch(q.correctAnswer, o, i))) rowFail('Correct answer must match an option.', 'الإجابة الصحيحة يجب أن تطابق أحد الاختيارات.');
    if (type === 'MULTI_SELECT') {
      if (!q.correctAnswers.length || q.correctAnswers.some((a: any) => !q.options.some((o: string, i: number) => isOptionMatch(a, o, i)))) rowFail('Correct answers must match options.', 'الإجابات الصحيحة يجب أن تطابق الاختيارات.');
      q.correctAnswer = JSON.stringify(q.correctAnswers);
    }
    if (type === 'TRUE_FALSE' && !['true', 'false', 'صحيح', 'خطأ', 'صح', 'صواب', 'خاطئ', 'غير صحيح', '1', '0'].includes(key(q.correctAnswer).toLowerCase())) rowFail('Choose True or False.', 'الإجابة يجب أن تكون صحيح أو خطأ.');
    if (previous) {
      if (!metadataChanged && JSON.stringify(questionExportRows([previous], 'en')[1]) === JSON.stringify(questionExportRows([q], 'en')[1])) { unchanged++; updates.set(id, previous); }
      else { updated++; updates.set(id, q); }
    } else added.push({ ...q, id: Date.now() + Math.random() });
  }
  if (options.exportedIds?.length && idIndex < 0) fail('Do not remove Question ID column.', 'لا تحذف عمود رقم السؤال.');
  for (const id of options.exportedIds || []) {
    if (!currentById.has(id)) fail('Export is stale or from another list. Export again.', 'الملف قديم أو لقائمة أخرى. أعد التصدير.');
    if (!seen.has(id)) deleted.add(id);
  }
  if (deleted.size && !options.canDelete) fail('Only Super Admin can delete saved questions. Restore removed rows or ask Super Admin.', 'حذف الأسئلة المحفوظة متاح للسوبر أدمن فقط. أعد الصفوف المحذوفة أو اطلب منه تنفيذ الاستيراد.');
  if (!seen.size && !added.length && !deleted.size) fail('No questions found.', 'لم يتم العثور على أسئلة.');
  return { questions: [...current.filter(q => !deleted.has(key(q.id))).map(q => updates.get(key(q.id)) || q), ...added],
    deletedIds: [...deleted], added: added.length, updated, unchanged };
}
