import { isOptionMatch } from './answerEvaluation';

type Question = Record<string, any>;

export const bilingualHeaders = [
  'معرف السؤال (Question ID)',
  'الإجراء (Action: ADD/UPDATE/DELETE)',
  'نص السؤال بالعربية (Question Text - Ar)',
  'نص السؤال بالإنجليزية (Question Text - En)',
  'نوع السؤال (Question Type: MCQ/TRUE_FALSE/MULTI_SELECT/TEXT)',
  'الخيار 1 بالعربية (Option 1 - Ar)',
  'الخيار 2 بالعربية (Option 2 - Ar)',
  'الخيار 3 بالعربية (Option 3 - Ar)',
  'الخيار 4 بالعربية (Option 4 - Ar)',
  'الخيار 5 بالعربية (Option 5 - Ar)',
  'الخيار 1 بالإنجليزية (Option 1 - En)',
  'الخيار 2 بالإنجليزية (Option 2 - En)',
  'الخيار 3 بالإنجليزية (Option 3 - En)',
  'الخيار 4 بالإنجليزية (Option 4 - En)',
  'الخيار 5 بالإنجليزية (Option 5 - En)',
  'الإجابة الصحيحة بالعربية (Correct Answer - Ar)',
  'الإجابة الصحيحة بالإنجليزية (Correct Answer - En)',
  'الإجابات المتعددة بالعربية (Correct Answers - Ar)',
  'الإجابات المتعددة بالإنجليزية (Correct Answers - En)',
  'الدرجة (Points)',
  'رابط الفيديو (Video URL)',
  'التفسير بالعربية (Explanation - Ar)',
  'التفسير بالإنجليزية (Explanation - En)'
];

export const syncHeaders = [
  'Question ID',
  'Action',
  'Question Text (Ar)',
  'Question Text (En)',
  'Question Type',
  'Option 1 (Ar)',
  'Option 2 (Ar)',
  'Option 3 (Ar)',
  'Option 4 (Ar)',
  'Option 5 (Ar)',
  'Option 1 (En)',
  'Option 2 (En)',
  'Option 3 (En)',
  'Option 4 (En)',
  'Option 5 (En)',
  'Correct Answer (Ar)',
  'Correct Answer (En)',
  'Correct Answers (Ar)',
  'Correct Answers (En)',
  'Points',
  'Video URL',
  'Explanation (Ar)',
  'Explanation (En)'
];

const key = (v: unknown) => String(v ?? '').trim();
const array = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function questionExportRows(questions: Question[], language: string): any[][] {
  const headers = language === 'en' ? syncHeaders : bilingualHeaders;
  return [headers, ...questions.map(q => {
    const options = array(q.options);
    const optionsEn = array(q.optionsEn);
    const rawOptions = typeof q.options === 'string' ? (() => { try { return JSON.parse(q.options); } catch { return q.options; } })() : q.options;
    if ((rawOptions != null && !Array.isArray(rawOptions)) || options.length > 5 || options.some(o => typeof o !== 'string')) {
      throw new Error('Edit complex options in the question editor. / عدّل الاختيارات المركبة من محرر الأسئلة.');
    }

    const arCorrect = Array.isArray(q.correctAnswer) ? JSON.stringify(q.correctAnswer) : (q.correctAnswer ?? '');
    let enCorrect = q.correctAnswerEn ?? '';
    if (!enCorrect && arCorrect && options.length && optionsEn.length) {
      const idx = options.findIndex((o: string, i: number) => isOptionMatch(arCorrect, o, i));
      if (idx >= 0 && optionsEn[idx]) enCorrect = optionsEn[idx];
    }

    const arMulti = array(q.correctAnswers).length ? array(q.correctAnswers)
      : (q.type === 'MULTI_SELECT' || q.label === 'MULTI_SELECT') ? array(q.correctAnswer) : [];
    let enMulti = array(q.correctAnswersEn);
    if (!enMulti.length && arMulti.length && options.length && optionsEn.length) {
      enMulti = arMulti.map((a: string) => {
        const idx = options.findIndex((o: string, i: number) => isOptionMatch(a, o, i));
        return idx >= 0 && optionsEn[idx] ? optionsEn[idx] : a;
      });
    }

    return [
      key(q.id),
      q.id ? 'UPDATE' : 'ADD',
      q.text ?? q.content ?? '',
      q.textEn ?? '',
      q.questionType || (q.type === 'QUESTION' ? q.label : q.type) || 'MCQ',
      ...Array.from({ length: 5 }, (_, i) => options[i] ?? ''),
      ...Array.from({ length: 5 }, (_, i) => optionsEn[i] ?? ''),
      arCorrect,
      enCorrect,
      arMulti.length ? JSON.stringify(arMulti) : '',
      enMulti.length ? JSON.stringify(enMulti) : '',
      q.points ?? 1,
      q.videoUrl ?? '',
      q.explanation ?? (q.sections?.length ? JSON.stringify(q.sections) : ''),
      q.explanationEn ?? ''
    ];
  })];
}

export function questionTemplateRows(language: string): any[][] {
  return questionExportRows([
    {
      text: 'ما هي عاصمة المملكة العربية السعودية؟',
      textEn: 'What is the capital of Saudi Arabia?',
      type: 'MCQ',
      options: ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة'],
      optionsEn: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca'],
      correctAnswer: 'الرياض',
      correctAnswerEn: 'Riyadh',
      points: 1,
      explanation: 'الرياض هي العاصمة الرسمية للمملكة العربية السعودية وأكبر مدنها.',
      explanationEn: 'Riyadh is the official capital and largest city of Saudi Arabia.'
    },
    {
      text: 'تدور الأرض حول الشمس مرة واحدة كل عام.',
      textEn: 'The Earth revolves around the Sun once every year.',
      type: 'TRUE_FALSE',
      options: ['صحيح', 'خطأ'],
      optionsEn: ['True', 'False'],
      correctAnswer: 'True',
      correctAnswerEn: 'True',
      points: 1,
      explanation: 'تستغرق دورة الأرض حول الشمس حوالي 365.25 يوماً.',
      explanationEn: 'The Earth takes approximately 365.25 days to complete one orbit around the Sun.'
    },
    {
      text: 'أيٌّ من اللغات التالية تعتبر من لغات البرمجة الشائعة لتطوير الويب؟',
      textEn: 'Which of the following languages are commonly used for web development?',
      type: 'MULTI_SELECT',
      options: ['جافاسكريبت', 'فوتوشوب', 'بايثون', 'إكسل'],
      optionsEn: ['JavaScript', 'Photoshop', 'Python', 'Excel'],
      correctAnswers: ['جافاسكريبت', 'بايثون'],
      correctAnswersEn: ['JavaScript', 'Python'],
      points: 2,
      explanation: 'جافاسكريبت وبايثون لغات برمجة، بينما فوتوشوب وإكسل برامج تطبيقية.',
      explanationEn: 'JavaScript and Python are programming languages, whereas Photoshop and Excel are software tools.'
    },
    {
      text: 'اكتب فقرة موجزة توضح فيها أهمية الذكاء الاصطناعي في تحسين جودة التعليم.',
      textEn: 'Write a brief paragraph explaining the importance of AI in improving education quality.',
      type: 'TEXT',
      options: [],
      optionsEn: [],
      correctAnswer: '',
      correctAnswerEn: '',
      points: 5,
      explanation: 'يساعد الذكاء الاصطناعي على تخصيص التعلم وتوفير تقييمات فورية للطلاب.',
      explanationEn: 'AI helps personalize learning and provides instant feedback to students.'
    }
  ], language);
}

export function planQuestionImport(rows: any[][], current: Question[], options: {
  canDelete: boolean; exportedIds?: string[]; language?: string;
}) {
  const ar = options.language !== 'en';
  const fail = (en: string, arabic: string): never => { throw new Error(ar ? arabic : en); };

  const normalize = (str: unknown) =>
    String(str ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\(\)\[\]\-_/]/g, ' ')
      .replace(/\s+/g, ' ');

  const headersNorm = (rows[0] || []).map(normalize);
  const findCol = (predicate: (h: string, raw: string, idx: number) => boolean): number => {
    return headersNorm.findIndex((h, idx) => predicate(h, String(rows[0][idx] ?? ''), idx));
  };

  const isEnHeader = (h: string) => /\ben\b/.test(h) || h.includes('إنجليزي') || h.includes('انجليزي');
  const isIdHeader = (h: string) => h.includes('question id') || h.includes('معرف') || h.includes('رقم السؤال') || h === 'id';

  const idIndex = findCol(h => isIdHeader(h));
  const actionIndex = findCol(h => h.includes('action') || h.includes('الإجراء') || h.includes('الاجراء'));

  const textEnIndex = findCol((h) =>
    !isIdHeader(h) && isEnHeader(h) && (
      h.includes('question text') ||
      h.includes('نص السؤال') ||
      h.includes('السؤال') ||
      h.includes('prompt') ||
      h === 'text en'
    )
  );

  const textIndex = findCol((h, _, idx) => {
    if (idx === textEnIndex || isIdHeader(h)) return false;
    return (
      h.includes('question text ar') ||
      h.includes('نص السؤال') ||
      h.includes('question prompt') ||
      h.includes('assignment prompt') ||
      (h.includes('question text') && !isEnHeader(h)) ||
      (h.includes('السؤال') && !isEnHeader(h)) ||
      h === 'question'
    );
  });

  const effectiveTextIndex = textIndex >= 0 ? textIndex : textEnIndex;
  if (effectiveTextIndex < 0) fail('Missing Question Text column.', 'عمود نص السؤال غير موجود.');

  const typeIndex = findCol(h => h.includes('question type') || h.includes('نوع السؤال') || h.includes('النوع') || h === 'type');

  const optionEnIndices = [1, 2, 3, 4, 5].map(num => findCol(h => {
    const hasNum = h.includes(String(num));
    const isOpt = h.includes('option') || h.includes('الخيار') || h.includes('خيار');
    return hasNum && isEnHeader(h) && isOpt;
  }));

  const optionIndices = [1, 2, 3, 4, 5].map((num) => findCol((h, _, colIdx) => {
    if (optionEnIndices.includes(colIdx)) return false;
    const hasNum = h.includes(String(num));
    const isOpt = h.includes('option') || h.includes('الخيار') || h.includes('خيار');
    return hasNum && isOpt;
  }));

  const correctEnIndex = findCol(h => {
    const isCorrect = h.includes('correct answer') || h.includes('الإجابة الصحيحة') || h.includes('الاجابة الصحيحة') || h.includes('الاجابه الصحيحه');
    const isMulti = h.includes('answers') || h.includes('متعددة') || h.includes('multi');
    return isCorrect && isEnHeader(h) && !isMulti;
  });

  const correctIndex = findCol((h, _, colIdx) => {
    if (colIdx === correctEnIndex) return false;
    const isCorrect = h.includes('correct answer') || h.includes('الإجابة الصحيحة') || h.includes('الاجابة الصحيحة') || h.includes('الاجابه الصحيحه');
    const isMulti = h.includes('answers') || h.includes('متعددة') || h.includes('multi');
    return isCorrect && !isMulti;
  });

  const multiEnIndex = findCol(h => {
    const isMulti = h.includes('correct answers') || h.includes('الإجابات المتعددة') || h.includes('الإجابات الصحيحة المتعددة') || h.includes('الاجابات المتعددة');
    return isMulti && isEnHeader(h);
  });

  const multiIndex = findCol((h, _, colIdx) => {
    if (colIdx === multiEnIndex) return false;
    const isMulti = h.includes('correct answers') || h.includes('الإجابات المتعددة') || h.includes('الإجابات الصحيحة المتعددة') || h.includes('الاجابات المتعددة');
    return isMulti;
  });

  const pointsIndex = findCol(h => h.includes('point') || h.includes('درجة') || h.includes('نقاط') || h.includes('درجه'));
  const videoIndex = findCol(h => h.includes('video') || h.includes('فيديو'));

  const expEnIndex = findCol(h => {
    const isExp = h.includes('explanation') || h.includes('التفسير') || h.includes('الشرح');
    return isExp && isEnHeader(h);
  });

  const expIndex = findCol((h, _, colIdx) => {
    if (colIdx === expEnIndex) return false;
    return h.includes('explanation') || h.includes('التفسير') || h.includes('الشرح');
  });

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
      deleted.add(id);
      continue;
    }
    if (id && ['ADD', 'إضافة'].includes(action)) rowFail('Leave Question ID blank for additions.', 'اترك رقم السؤال فارغًا عند الإضافة.');
    if (!id && ['UPDATE', 'تعديل'].includes(action)) rowFail('Update requires Question ID.', 'التعديل يحتاج رقم السؤال.');

    const previous = id ? currentById.get(id)! : undefined;
    const q: Question = { ...(previous || { points: 1, skill: 'General', options: [], correctAnswer: '', correctAnswers: [] }) };

    q.text = textIndex >= 0 ? String(row[textIndex] ?? '').trim() : '';
    if (textEnIndex >= 0) {
      const val = String(row[textEnIndex] ?? '').trim();
      q.textEn = val || null;
    } else if (q.text && /[a-zA-Z]/.test(q.text) && !/[\u0600-\u06FF]/.test(q.text)) {
      q.textEn = q.text;
    }

    if (!q.text && q.textEn) {
      q.text = q.textEn;
    }
    if (!key(q.text)) rowFail('Question text is required.', 'نص السؤال مطلوب.');

    let type = typeIndex < 0 ? (previous?.type === 'QUESTION' ? previous.label : previous?.type) || 'MCQ' : key(row[typeIndex]).toUpperCase();
    if (['صح وخطأ', 'صح أو خطأ', 'T/F', 'صحيح أو خطأ'].includes(type)) type = 'TRUE_FALSE';
    if (['اختيار من متعدد', 'MULTIPLE CHOICE'].includes(type)) type = 'MCQ';
    if (['اختيارات متعددة', 'إجابات متعددة'].includes(type)) type = 'MULTI_SELECT';
    if (['نصي', 'مقالي'].includes(type)) type = 'TEXT';

    if (!['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'TEXT'].includes(type)) {
      rowFail('Use the editor for this question type.', 'هذا النوع يُعدّل من محرر الأسئلة.');
    }
    q.type = type;
    q.label = type;
    if (previous?.questionType) q.questionType = type;
    q.content = q.text;
    q.title = previous?.title ?? q.text.substring(0, 30);

    let arOptions: string[] = [];
    if (optionIndices.some(i => i >= 0)) {
      arOptions = optionIndices.map((i, n) => i < 0 ? array(previous?.options)[n] ?? '' : String(row[i] ?? ''));
      while (arOptions.length && !key(arOptions[arOptions.length - 1])) arOptions.pop();
    } else if (previous?.options) {
      arOptions = array(previous.options);
    }

    let enOptions: string[] = [];
    if (optionEnIndices.some(i => i >= 0)) {
      enOptions = optionEnIndices.map((i, n) => i < 0 ? array(previous?.optionsEn)[n] ?? '' : String(row[i] ?? ''));
      while (enOptions.length && !key(enOptions[enOptions.length - 1])) enOptions.pop();
    } else if (previous?.optionsEn) {
      enOptions = array(previous.optionsEn);
    }

    if (!arOptions.length && enOptions.length) {
      arOptions = [...enOptions];
    }
    if (!enOptions.length && arOptions.some(o => /[a-zA-Z]/.test(o) && !/[\u0600-\u06FF]/.test(o))) {
      enOptions = [...arOptions];
    }

    q.options = arOptions;
    q.optionsEn = enOptions.length ? enOptions : null;

    const rawCorrectAr = correctIndex >= 0 ? key(row[correctIndex]) : '';
    const rawCorrectEn = correctEnIndex >= 0 ? key(row[correctEnIndex]) : '';

    const resolveOptIndex = (val: string): number => {
      if (!val) return -1;
      if (/^[1-5]$/.test(val)) return Number(val) - 1;
      const upper = val.toUpperCase();
      const letterIdx = ['A', 'B', 'C', 'D', 'E'].indexOf(upper);
      if (letterIdx >= 0) return letterIdx;
      const arLetterIdx = ['أ', 'ب', 'ج', 'د', 'هـ'].indexOf(val);
      if (arLetterIdx >= 0) return arLetterIdx;

      const arMatch = q.options.findIndex((o: string, i: number) => isOptionMatch(val, o, i));
      if (arMatch >= 0) return arMatch;

      const enMatch = (q.optionsEn || []).findIndex((o: string, i: number) => isOptionMatch(val, o, i));
      if (enMatch >= 0) return enMatch;

      return -1;
    };

    if (type === 'MCQ') {
      let matchedIndex = -1;
      if (rawCorrectAr) matchedIndex = resolveOptIndex(rawCorrectAr);
      if (matchedIndex < 0 && rawCorrectEn) matchedIndex = resolveOptIndex(rawCorrectEn);

      if (matchedIndex >= 0) {
        q.correctAnswer = q.options[matchedIndex] ?? rawCorrectAr;
        q.correctAnswerEn = q.optionsEn?.[matchedIndex] ?? (rawCorrectEn || null);
      } else {
        q.correctAnswer = rawCorrectAr || rawCorrectEn;
        q.correctAnswerEn = rawCorrectEn || (rawCorrectAr && /[a-zA-Z]/.test(rawCorrectAr) ? rawCorrectAr : null);
      }
    } else if (type === 'TRUE_FALSE') {
      const ansStr = (rawCorrectAr || rawCorrectEn).toLowerCase();
      const isTrue = ['true', 'صحيح', 'صح', 'صواب', '1'].includes(ansStr);
      const isFalse = ['false', 'خطأ', 'خاطئ', 'غير صحيح', '0'].includes(ansStr);
      if (isTrue) {
        q.correctAnswer = 'True';
        q.correctAnswerEn = 'True';
        if (!q.options.length) q.options = ['صحيح', 'خطأ'];
        if (!q.optionsEn) q.optionsEn = ['True', 'False'];
      } else if (isFalse) {
        q.correctAnswer = 'False';
        q.correctAnswerEn = 'False';
        if (!q.options.length) q.options = ['صحيح', 'خطأ'];
        if (!q.optionsEn) q.optionsEn = ['True', 'False'];
      } else {
        rowFail('Choose True or False.', 'الإجابة يجب أن تكون صحيح أو خطأ.');
      }
    } else if (type === 'MULTI_SELECT') {
      const parseItems = (str: string): string[] => {
        if (!str) return [];
        if (str.startsWith('[')) {
          try {
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed.map(key).filter(Boolean) : [];
          } catch {
            return [];
          }
        }
        return str.split(',').map(key).filter(Boolean);
      };

      let itemsAr = parseItems(multiIndex >= 0 ? key(row[multiIndex]) : rawCorrectAr);
      let itemsEn = parseItems(multiEnIndex >= 0 ? key(row[multiEnIndex]) : rawCorrectEn);

      itemsAr = itemsAr.map(val => {
        const idx = resolveOptIndex(val);
        return idx >= 0 && q.options[idx] ? q.options[idx] : val;
      });

      if (itemsEn.length) {
        itemsEn = itemsEn.map(val => {
          const idx = resolveOptIndex(val);
          return idx >= 0 && q.optionsEn?.[idx] ? q.optionsEn[idx] : val;
        });
      } else if (q.optionsEn?.length && itemsAr.length) {
        itemsEn = itemsAr.map(val => {
          const idx = q.options.findIndex((o: string, i: number) => isOptionMatch(val, o, i));
          return idx >= 0 && q.optionsEn[idx] ? q.optionsEn[idx] : val;
        }).filter(Boolean);
      }

      q.correctAnswers = itemsAr;
      q.correctAnswersEn = itemsEn.length ? itemsEn : null;
      q.correctAnswer = JSON.stringify(itemsAr);
      if (itemsEn.length) q.correctAnswerEn = JSON.stringify(itemsEn);
    } else {
      q.correctAnswer = rawCorrectAr || rawCorrectEn;
      q.correctAnswerEn = rawCorrectEn || null;
      q.correctAnswers = [];
      q.correctAnswersEn = null;
    }

    if (type !== 'MULTI_SELECT') {
      q.correctAnswers = [];
      q.correctAnswersEn = null;
    }

    if (pointsIndex >= 0) {
      const points = key(row[pointsIndex]) === '' ? previous?.points ?? 1 : Number(row[pointsIndex]);
      if (!Number.isInteger(points) || points < 1) rowFail('Points must be a positive integer.', 'الدرجة يجب أن تكون عددًا صحيحًا موجبًا.');
      q.points = points;
    }

    if (videoIndex >= 0) q.videoUrl = String(row[videoIndex] ?? '');

    const metadataFields: Record<string, string[]> = {
      skill: ['skill', 'المهارة'],
      standard: ['standard', 'المعيار'],
      learningOutcome: ['learning outcome', 'learning outcomes', 'نواتج التعلم'],
      indicator: ['indicator', 'indicators', 'المؤشر', 'المؤشرات'],
      level: ['difficulty', 'difficulty level', 'الصعوبة'],
      dok: ['dok', 'عمق المعرفة'],
    };
    let metadataChanged = false;
    for (const [field, names] of Object.entries(metadataFields)) {
      const i = findCol(h => names.some(n => h.includes(normalize(n))));
      if (i >= 0) {
        q[field] = String(row[i] ?? '');
        if (q[field] !== previous?.[field]) metadataChanged = true;
      }
    }
    if (findCol(h => ['learning outcome', 'نواتج التعلم'].some(n => h.includes(normalize(n)))) >= 0) {
      q.standard = q.learningOutcome;
    } else if (findCol(h => ['standard', 'المعيار'].some(n => h.includes(normalize(n)))) >= 0) {
      q.learningOutcome = q.standard;
    }

    if (expIndex >= 0) {
      q.explanation = String(row[expIndex] ?? '').trim();
      q.clearExplanation = q.explanation === '';
      q.sections = array(q.explanation);
      if (!q.sections.length && q.explanation) q.sections = [{ type: 'EXPLANATION', content: q.explanation }];
    }
    if (expEnIndex >= 0) {
      const val = String(row[expEnIndex] ?? '').trim();
      q.explanationEn = val || null;
    } else if (q.explanation && /[a-zA-Z]/.test(q.explanation) && !/[\u0600-\u06FF]/.test(q.explanation)) {
      q.explanationEn = q.explanation;
    }
    if (!q.explanation && q.explanationEn) {
      q.explanation = q.explanationEn;
      q.sections = [{ type: 'EXPLANATION', content: q.explanation }];
    }

    if (['MCQ', 'MULTI_SELECT'].includes(type)) {
      const optCount = Math.max(q.options.filter((o: any) => key(o)).length, (q.optionsEn || []).filter((o: any) => key(o)).length);
      if (optCount < 2) rowFail('At least two options are required.', 'مطلوب اختياران على الأقل.');
    }

    if (type === 'MCQ') {
      const matchesAr = q.options.some((o: string, i: number) => isOptionMatch(q.correctAnswer, o, i));
      const matchesEn = (q.optionsEn || []).some((o: string, i: number) => isOptionMatch(q.correctAnswerEn || q.correctAnswer, o, i));
      if (!matchesAr && !matchesEn) {
        rowFail('Correct answer must match an option.', 'الإجابة الصحيحة يجب أن تطابق أحد الاختيارات.');
      }
    }

    if (type === 'MULTI_SELECT') {
      if (!q.correctAnswers.length) rowFail('Correct answers must match options.', 'الإجابات الصحيحة يجب أن تطابق الاختيارات.');
      const matchesAr = q.correctAnswers.every((a: any) => q.options.some((o: string, i: number) => isOptionMatch(a, o, i)));
      const matchesEn = (q.correctAnswersEn || []).length
        ? (q.correctAnswersEn || []).every((a: any) => (q.optionsEn || []).some((o: string, i: number) => isOptionMatch(a, o, i)))
        : true;
      if (!matchesAr && !matchesEn) {
        rowFail('Correct answers must match options.', 'الإجابات الصحيحة يجب أن تطابق الاختيارات.');
      }
      q.correctAnswer = JSON.stringify(q.correctAnswers);
    }

    if (previous) {
      if (!metadataChanged && JSON.stringify(questionExportRows([previous], 'en')[1]) === JSON.stringify(questionExportRows([q], 'en')[1])) {
        unchanged++;
        updates.set(id, previous);
      } else {
        updated++;
        updates.set(id, q);
      }
    } else {
      added.push({ ...q, id: Date.now() + Math.random() });
    }
  }

  if (options.exportedIds?.length && idIndex < 0) fail('Do not remove Question ID column.', 'لا تحذف عمود رقم السؤال.');
  for (const id of options.exportedIds || []) {
    if (!currentById.has(id)) fail('Export is stale or from another list. Export again.', 'الملف قديم أو لقائمة أخرى. أعد التصدير.');
    if (!seen.has(id)) deleted.add(id);
  }

  if (deleted.size && !options.canDelete) fail('Only Super Admin can delete saved questions. Restore removed rows or ask Super Admin.', 'حذف الأسئلة المحفوظة متاح للسوبر أدمن فقط. أعد الصفوف المحذوفة أو اطلب منه تنفيذ الاستيراد.');
  if (!seen.size && !added.length && !deleted.size) fail('No questions found.', 'لم يتم العثور على أسئلة.');

  return {
    questions: [...current.filter(q => !deleted.has(key(q.id))).map(q => updates.get(key(q.id)) || q), ...added],
    deletedIds: [...deleted],
    added: added.length,
    updated,
    unchanged
  };
}
