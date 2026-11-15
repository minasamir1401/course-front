import * as XLSX from 'xlsx';
import { buildMasterReferenceGuideRows } from './excelReferenceGuide';
import { questionExportRows, questionTemplateRows, planQuestionImport } from './questionExcelSync';
import { buildLessonMetadataExportRows, parseLessonMetadataRows } from './lessonMetadataExcel';

export type SlideBlock = Record<string, any>;

const INTERACTIVE_QUESTION_TYPES = new Set([
  'MATCHING',
  'DRAG_DROP_FILL',
  'GROUP_SORTING',
  'NUMBER_LINE',
  'CLOCK',
  'MIND_MAP',
  'VIDEO_CHECKPOINT',
  'SWIPE_SORT',
  'MAZE',
  'WORD_SEARCH',
  'GEOGEBRA',
  'FLASH_CARD',
  'MEMORY_GAME',
  'WORD_SCRAMBLE',
  'SENTENCE_REORDER',
  'MATH_EQUATION',
  'SEQUENCE_ORDER',
  'CROSSWORD',
  'COUNT_OBJECTS',
  'IMAGE_LABEL',
  'COLOR_MATCH',
]);

const TEXT_SLIDE_KINDS = new Set(['CONTENT', 'EXAMPLE', 'SUMMARY', 'HINT', 'EXPLANATION']);

const key = (v: unknown) => String(v ?? '').trim();

const normalizeHeader = (v: unknown) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\(\)\[\]\-_/]/g, ' ')
    .replace(/\s+/g, ' ');

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const decodeBasicEntities = (str: string) =>
  str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"');

const stripTags = (html: string) => decodeBasicEntities(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

export function pipeTextToHtmlTable(pipeText: string): string {
  const raw = String(pipeText || '').trim();
  if (!raw) return '';
  if (/<table[\s>]/i.test(raw)) return raw;

  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && l.includes('|') && !/^[\s|:-]+$/.test(l));

  if (lines.length === 0) return '';

  const parseRow = (line: string) =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());

  const headerCells = parseRow(lines[0]);
  const bodyRows = lines.slice(1).map(parseRow);

  const ths = headerCells
    .map(c => `<th class="border border-slate-300 bg-indigo-50 px-3 py-2 font-bold text-slate-900">${escapeHtml(c)}</th>`)
    .join('');
  const trs = bodyRows
    .map(
      row =>
        `<tr>${headerCells
          .map((_, idx) => `<td class="border border-slate-300 px-3 py-2 text-slate-700">${escapeHtml(row[idx] ?? '')}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  return `<table class="w-full border-collapse border border-slate-300 my-3"><thead><tr>${ths}</tr></thead>${trs ? `<tbody>${trs}</tbody>` : ''}</table>`;
}

export function extractHtmlTablesToPipeText(html: string): { cleanHtml: string; tablePipe: string } {
  const raw = String(html || '');
  if (!/<table[\s>]/i.test(raw)) {
    return { cleanHtml: raw, tablePipe: '' };
  }

  const extractedTables: string[] = [];
  const cleanHtml = raw.replace(/<table[\s\S]*?<\/table>/gi, tableMatch => {
    const rowMatches = tableMatch.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    const lines = rowMatches
      .map(tr => {
        const cellMatches = tr.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
        return cellMatches.map(cell => stripTags(cell).replace(/\|/g, '/')).join(' | ');
      })
      .filter(Boolean);
    if (lines.length > 0) extractedTables.push(lines.join('\n'));
    return '';
  });

  return {
    cleanHtml: cleanHtml.trim(),
    tablePipe: extractedTables.join('\n\n'),
  };
}

export function convertInlineTableTags(content: string): string {
  const raw = String(content || '');
  if (!/\[TABLE\]/i.test(raw)) return raw;
  return raw.replace(/\[TABLE\]([\s\S]*?)\[\/TABLE\]/gi, (_m, inner) => pipeTextToHtmlTable(inner));
}

const parseJsonSafe = (val: unknown, fallback: any = null) => {
  if (val == null || val === '') return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(String(val));
  } catch {
    return fallback;
  }
};

export function formatInteractiveForExcel(block: SlideBlock, lang: 'ar' | 'en'): string {
  const label = String(block.label || block.type || '').toUpperCase();
  const rawOptions = lang === 'en' && block.optionsEn ? block.optionsEn : block.options;
  const parsedOpts = parseJsonSafe(rawOptions, rawOptions);
  const rawCorrect = lang === 'en' && block.correctAnswerEn ? block.correctAnswerEn : block.correctAnswer;
  const parsedCorrect = parseJsonSafe(rawCorrect, rawCorrect);

  if (label === 'MATCHING' || label === 'MEMORY_GAME' || label === 'COLOR_MATCH' || label === 'CROSSWORD') {
    if (parsedOpts && typeof parsedOpts === 'object' && Array.isArray(parsedOpts.left) && Array.isArray(parsedOpts.right)) {
      return parsedOpts.left
        .map((leftVal: string, idx: number) => `${leftVal} = ${parsedOpts.right[idx] ?? ''}`)
        .filter(Boolean)
        .join(' | ');
    }
    if (parsedCorrect && typeof parsedCorrect === 'object' && !Array.isArray(parsedCorrect)) {
      const entries = Object.entries(parsedCorrect);
      if (entries.length) return entries.map(([k, v]) => `${k} = ${v}`).join(' | ');
    }
  }

  if (label === 'GROUP_SORTING') {
    if (parsedOpts && typeof parsedOpts === 'object' && Array.isArray(parsedOpts.groups) && Array.isArray(parsedOpts.items)) {
      return parsedOpts.groups
        .map((g: any, gIdx: number) => {
          const gName = typeof g === 'string' ? g : g?.name || `Group ${gIdx + 1}`;
          const gId = typeof g === 'string' ? g : g?.id ?? gName;
          const items = parsedOpts.items
            .filter((it: any) => it?.groupId === gId || it?.group === gName || parsedCorrect?.[it?.id] === gId)
            .map((it: any) => (typeof it === 'string' ? it : it?.text || it?.label || ''))
            .filter(Boolean);
          return `${gName}: ${items.join(', ')}`;
        })
        .join(' | ');
    }
  }

  if (label === 'FLASH_CARD') {
    if (Array.isArray(parsedOpts)) {
      const pairs = parsedOpts.map((c: any) =>
        typeof c === 'object' && c ? `${c.front ?? c.q ?? ''} = ${c.back ?? c.a ?? ''}` : String(c),
      );
      if (pairs.length) return pairs.join(' | ');
    }
  }

  if (rawOptions && typeof rawOptions === 'string' && !['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'TEXT', 'ESSAY'].includes(label)) {
    return rawOptions;
  }
  if (parsedOpts && typeof parsedOpts === 'object' && !Array.isArray(parsedOpts)) {
    return JSON.stringify(parsedOpts);
  }
  return '';
}

export function parseInteractiveFromExcel(
  kind: string,
  cellText: string,
  optionsList: string[],
  correctText: string,
): { options: any; correctAnswer: any } {
  const upperKind = kind.toUpperCase();
  const trimmedCell = key(cellText);

  const maybeJson = parseJsonSafe(trimmedCell, null);
  if (maybeJson && typeof maybeJson === 'object') {
    return {
      options: JSON.stringify(maybeJson),
      correctAnswer: correctText || (upperKind === 'DRAG_DROP_FILL' ? JSON.stringify(optionsList.filter(Boolean)) : JSON.stringify({})),
    };
  }

  if (['MATCHING', 'MEMORY_GAME', 'COLOR_MATCH', 'CROSSWORD'].includes(upperKind) && trimmedCell.includes('=')) {
    const pairs = trimmedCell
      .split(/\||\r?\n/)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const eqIdx = part.indexOf('=');
        return eqIdx >= 0 ? [part.slice(0, eqIdx).trim(), part.slice(eqIdx + 1).trim()] : [part, ''];
      });
    const left = pairs.map(p => p[0]);
    const right = pairs.map(p => p[1]);
    const map: Record<string, string> = {};
    pairs.forEach(([l, r]) => {
      if (l) map[l] = r;
    });
    return {
      options: JSON.stringify({ left, right }),
      correctAnswer: correctText || JSON.stringify(map),
    };
  }

  if (upperKind === 'GROUP_SORTING' && trimmedCell.includes(':')) {
    const groupParts = trimmedCell
      .split(/\||\r?\n/)
      .map(p => p.trim())
      .filter(Boolean);
    const groups: string[] = [];
    const items: { id: string; text: string; group: string }[] = [];
    const answerMap: Record<string, string> = {};

    groupParts.forEach((part, gIdx) => {
      const colonIdx = part.indexOf(':');
      const gName = colonIdx >= 0 ? part.slice(0, colonIdx).trim() : `Group ${gIdx + 1}`;
      const rawItems = (colonIdx >= 0 ? part.slice(colonIdx + 1) : part)
        .split(/[,،]/)
        .map(s => s.trim())
        .filter(Boolean);
      groups.push(gName);
      rawItems.forEach((itemText, iIdx) => {
        const id = `item_${gIdx}_${iIdx}`;
        items.push({ id, text: itemText, group: gName });
        answerMap[id] = gName;
      });
    });

    return {
      options: JSON.stringify({ groups, items }),
      correctAnswer: correctText || JSON.stringify(answerMap),
    };
  }

  if (upperKind === 'FLASH_CARD' && trimmedCell.includes('=')) {
    const cards = trimmedCell
      .split(/\||\r?\n/)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const eqIdx = part.indexOf('=');
        return {
          front: eqIdx >= 0 ? part.slice(0, eqIdx).trim() : part,
          back: eqIdx >= 0 ? part.slice(eqIdx + 1).trim() : '',
        };
      });
    return {
      options: JSON.stringify(cards),
      correctAnswer: correctText || '',
    };
  }

  if (upperKind === 'DRAG_DROP_FILL') {
    const choices = optionsList.length
      ? optionsList
      : trimmedCell
          .split(/\||[,،]/)
          .map(s => s.trim())
          .filter(Boolean);
    const ansArr = correctText
      ? correctText.split(/\||[,،]/).map(s => s.trim()).filter(Boolean)
      : choices;
    return {
      options: JSON.stringify({ sentence: '', choices }),
      correctAnswer: JSON.stringify(ansArr),
    };
  }

  if (['SEQUENCE_ORDER', 'SENTENCE_REORDER', 'WORD_SCRAMBLE', 'SWIPE_SORT', 'NUMBER_LINE', 'MATH_EQUATION'].includes(upperKind)) {
    const choices = optionsList.length
      ? optionsList
      : trimmedCell
          .split(/\||\r?\n|[,،]/)
          .map(s => s.trim())
          .filter(Boolean);
    return {
      options: JSON.stringify({ choices }),
      correctAnswer: correctText || JSON.stringify(choices),
    };
  }

  if (upperKind === 'CLOCK') {
    return {
      options: JSON.stringify({ minuteStep: 5 }),
      correctAnswer: correctText || trimmedCell || '12:00',
    };
  }

  return {
    options: trimmedCell || (optionsList.length ? JSON.stringify({ choices: optionsList }) : JSON.stringify({ choices: [] })),
    correctAnswer: correctText,
  };
}

export const slideBilingualHeaders = [
  'معرف الشريحة (Slide ID)',
  'الإجراء (Action: ADD/UPDATE/DELETE)',
  'نوع الشريحة (Block Type: TEXT/QUESTION)',
  'تصنيف الشريحة / نوع السؤال (Slide Kind)',
  'عنوان الشريحة بالعربية (Title - Ar)',
  'عنوان الشريحة بالإنجليزية (Title - En)',
  'محتوى الشرح / نص السؤال بالعربية (Content - Ar)',
  'محتوى الشرح / نص السؤال بالإنجليزية (Content - En)',
  'الجدول بالعربية (Table - Ar: Col1 | Col2)',
  'الجدول بالإنجليزية (Table - En: Col1 | Col2)',
  'رابط الفيديو (Video URL)',
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
  'البيانات التفاعلية بالعربية (Interactive Data - Ar)',
  'البيانات التفاعلية بالإنجليزية (Interactive Data - En)',
  'النقاط (Points)',
  'التفسير بالعربية (Explanation - Ar)',
  'التفسير بالإنجليزية (Explanation - En)',
  'المجال بالعربية (Domain - Ar)',
  'المجال بالإنجليزية (Domain - En)',
  'المعيار بالعربية (Standard - Ar)',
  'المعيار بالإنجليزية (Standard - En)',
  'المؤشر بالعربية (Indicator - Ar)',
  'المؤشر بالإنجليزية (Indicator - En)',
  'ناتج التعلم بالعربية (Outcome - Ar)',
  'ناتج التعلم بالإنجليزية (Outcome - En)',
  'المهارة بالعربية (Skill - Ar)',
  'المهارة بالإنجليزية (Skill - En)',
  'مستوى الصعوبة (Difficulty)',
  'عمق المعرفة (DOK)',
  'Sections JSON',
];

export const slideSyncHeaders = [
  'Slide ID',
  'Action',
  'Block Type',
  'Slide Kind',
  'Title (Ar)',
  'Title (En)',
  'Content (Ar)',
  'Content (En)',
  'Table (Ar)',
  'Table (En)',
  'Video URL',
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
  'Interactive Data (Ar)',
  'Interactive Data (En)',
  'Points',
  'Explanation (Ar)',
  'Explanation (En)',
  'Domain (Ar)',
  'Domain (En)',
  'Standard (Ar)',
  'Standard (En)',
  'Indicator (Ar)',
  'Indicator (En)',
  'Outcome (Ar)',
  'Outcome (En)',
  'Skill (Ar)',
  'Skill (En)',
  'Difficulty',
  'DOK',
  'Sections JSON',
];

const toArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(x => String(x ?? ''));
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map(x => String(x ?? '')) : [];
      } catch {
        return [];
      }
    }
  }
  return [];
};

export function slidesExportRows(slides: SlideBlock[], language: string): any[][] {
  const headers = language === 'en' ? slideSyncHeaders : slideBilingualHeaders;
  return [
    headers,
    ...slides.map(slide => {
      const blockType = String(slide.type || 'TEXT').toUpperCase() === 'QUESTION' ? 'QUESTION' : 'TEXT';
      const slideKind = String(slide.label || (blockType === 'QUESTION' ? 'MCQ' : 'CONTENT')).toUpperCase();

      const arSplit = extractHtmlTablesToPipeText(slide.content ?? slide.text ?? '');
      const enSplit = extractHtmlTablesToPipeText(slide.contentEn ?? slide.textEn ?? '');

      const optsAr = blockType === 'QUESTION' && ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(slideKind)
        ? toArray(slide.options)
        : [];
      const optsEn = blockType === 'QUESTION' && ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(slideKind)
        ? toArray(slide.optionsEn)
        : [];

      const correctAr = Array.isArray(slide.correctAnswers) && slide.correctAnswers.length
        ? JSON.stringify(slide.correctAnswers)
        : Array.isArray(slide.correctAnswer)
        ? JSON.stringify(slide.correctAnswer)
        : String(slide.correctAnswer ?? '');
      const correctEn = Array.isArray(slide.correctAnswersEn) && slide.correctAnswersEn.length
        ? JSON.stringify(slide.correctAnswersEn)
        : Array.isArray(slide.correctAnswerEn)
        ? JSON.stringify(slide.correctAnswerEn)
        : String(slide.correctAnswerEn ?? '');

      const interactiveAr = blockType === 'QUESTION' ? formatInteractiveForExcel(slide, 'ar') : '';
      const interactiveEn = blockType === 'QUESTION' ? formatInteractiveForExcel(slide, 'en') : '';

      const sectionsArr = Array.isArray(slide.sections) ? slide.sections : [];
      const explanationAr = slide.explanation || sectionsArr.find((s: any) => s.type === 'EXPLANATION')?.content || '';
      const explanationEn = slide.explanationEn || sectionsArr.find((s: any) => s.type === 'EXPLANATION')?.contentEn || '';

      return [
        key(slide.id),
        slide.id != null && key(slide.id) ? 'UPDATE' : 'ADD',
        blockType,
        slideKind,
        slide.title ?? '',
        slide.titleEn ?? '',
        arSplit.cleanHtml,
        enSplit.cleanHtml,
        arSplit.tablePipe,
        enSplit.tablePipe,
        slide.videoUrl ?? '',
        ...Array.from({ length: 5 }, (_, i) => optsAr[i] ?? ''),
        ...Array.from({ length: 5 }, (_, i) => optsEn[i] ?? ''),
        correctAr,
        correctEn,
        interactiveAr,
        interactiveEn,
        slide.points ?? 1,
        explanationAr,
        explanationEn,
        slide.domain ?? '',
        slide.domainEn ?? '',
        slide.standard ?? '',
        slide.standardEn ?? '',
        slide.indicator ?? '',
        slide.indicatorEn ?? '',
        slide.learningOutcome ?? '',
        slide.learningOutcomeEn ?? '',
        slide.skill ?? '',
        slide.skillEn ?? '',
        slide.level ?? '',
        slide.dok ?? '',
        sectionsArr.length ? JSON.stringify(sectionsArr) : '',
      ];
    }),
  ];
}

export function slidesTemplateRows(language: string): any[][] {
  const sampleSlides: SlideBlock[] = [
    {
      type: 'TEXT',
      label: 'CONTENT',
      title: 'مقدمة الدرس والمفاهيم الأساسية',
      titleEn: 'Lesson Introduction & Core Concepts',
      content: 'تعرّف على المفهوم الأساسي وأهم تطبيقاته اليومية. المعادلة الأساسية: $E = mc^2$',
      contentEn: 'Explore the core concept and its real-world applications. Key formula: $E = mc^2$',
      domain: 'العلوم والفيزياء',
      domainEn: 'Science & Physics',
      skill: 'الفهم المفاهيمي',
      skillEn: 'Conceptual Understanding',
    },
    {
      type: 'TEXT',
      label: 'EXAMPLE',
      title: 'مثال تطبيقي مع جدول مقارنة',
      titleEn: 'Worked Example with Comparison Table',
      content:
        'يوضح الجدول التالي الفرق بين الكمية القياسية والمتجهة:' +
        pipeTextToHtmlTable('المقارنة | الكمية القياسية | الكمية المتجهة\nالتعريف | مقدار فقط | مقدار واتجاه\nمثال | الكتلة (kg) | القوة (N)'),
      contentEn:
        'The table below compares scalar and vector quantities:' +
        pipeTextToHtmlTable('Comparison | Scalar Quantity | Vector Quantity\nDefinition | Magnitude only | Magnitude & direction\nExample | Mass (kg) | Force (N)'),
    },
    {
      type: 'TEXT',
      label: 'SUMMARY',
      title: 'ملخص النقاط الرئيسية',
      titleEn: 'Key Takeaways Summary',
      content: 'تأكد من مراجعة الجدول والمعادلات قبل حل التدريبات المدمجة.',
      contentEn: 'Review the summary table and formulas before attempting inline questions.',
    },
    {
      type: 'QUESTION',
      label: 'MCQ',
      title: 'سؤال اختيار من متعدد مدمج',
      titleEn: 'Inline Multiple Choice Question',
      content: 'أي الكميات التالية كمية متجهة؟',
      contentEn: 'Which of the following is a vector quantity?',
      options: ['الكتلة', 'الزمن', 'القوة', 'درجة الحرارة'],
      optionsEn: ['Mass', 'Time', 'Force', 'Temperature'],
      correctAnswer: 'القوة',
      correctAnswerEn: 'Force',
      points: 1,
      explanation: 'القوة لها مقدار واتجاه محدد لذلك فهي كمية متجهة.',
      explanationEn: 'Force has both magnitude and direction, making it a vector quantity.',
    },
    {
      type: 'QUESTION',
      label: 'TRUE_FALSE',
      title: 'سؤال صح أو خطأ',
      titleEn: 'Inline True / False Question',
      content: 'تقاس القوة في النظام الدولي بوحدة النيوتن.',
      contentEn: 'Force is measured in Newtons in the SI system.',
      options: ['صحيح', 'خطأ'],
      optionsEn: ['True', 'False'],
      correctAnswer: 'True',
      correctAnswerEn: 'True',
      points: 1,
    },
    {
      type: 'QUESTION',
      label: 'MULTI_SELECT',
      title: 'سؤال اختيارات متعددة',
      titleEn: 'Inline Multi-Select Question',
      content: 'اختر جميع الكميات القياسية فيما يلي:',
      contentEn: 'Select all scalar quantities below:',
      options: ['الكتلة', 'الإزاحة', 'الحجم', 'التسارع'],
      optionsEn: ['Mass', 'Displacement', 'Volume', 'Acceleration'],
      correctAnswers: ['الكتلة', 'الحجم'],
      correctAnswersEn: ['Mass', 'Volume'],
      points: 2,
    },
    {
      type: 'QUESTION',
      label: 'MATCHING',
      title: 'سؤال التوصيل التفاعلي',
      titleEn: 'Interactive Matching Question',
      content: 'صل كل كمية فيزيائية بوحدة قياسها المناسبة:',
      contentEn: 'Match each physical quantity to its SI unit:',
      options: JSON.stringify({ left: ['القوة', 'الكتلة', 'الزمن'], right: ['نيوتن', 'كيلوجرام', 'ثانية'] }),
      optionsEn: JSON.stringify({ left: ['Force', 'Mass', 'Time'], right: ['Newton', 'Kilogram', 'Second'] }),
      correctAnswer: JSON.stringify({ القوة: 'نيوتن', الكتلة: 'كيلوجرام', الزمن: 'ثانية' }),
      correctAnswerEn: JSON.stringify({ Force: 'Newton', Mass: 'Kilogram', Time: 'Second' }),
      points: 3,
    },
    {
      type: 'QUESTION',
      label: 'GROUP_SORTING',
      title: 'سؤال تصنيف المجموعات',
      titleEn: 'Interactive Group Sorting Question',
      content: 'صنّف العناصر التالية إلى فلزات ولافلزات:',
      contentEn: 'Classify the following elements into Metals and Non-Metals:',
      options: JSON.stringify({
        groups: ['الفلزات', 'اللافلزات'],
        items: [
          { id: 'item_0_0', text: 'حديد', group: 'الفلزات' },
          { id: 'item_0_1', text: 'نحاس', group: 'الفلزات' },
          { id: 'item_1_0', text: 'أكسجين', group: 'اللافلزات' },
        ],
      }),
      optionsEn: JSON.stringify({
        groups: ['Metals', 'Non-Metals'],
        items: [
          { id: 'item_0_0', text: 'Iron', group: 'Metals' },
          { id: 'item_0_1', text: 'Copper', group: 'Metals' },
          { id: 'item_1_0', text: 'Oxygen', group: 'Non-Metals' },
        ],
      }),
      correctAnswer: JSON.stringify({ item_0_0: 'الفلزات', item_0_1: 'الفلزات', item_1_0: 'اللافلزات' }),
      correctAnswerEn: JSON.stringify({ item_0_0: 'Metals', item_0_1: 'Metals', item_1_0: 'Non-Metals' }),
      points: 3,
    },
  ];
  return slidesExportRows(sampleSlides, language);
}

export function buildSlidesWorkbook(slides: SlideBlock[] | null, language: string = 'ar'): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const rows = slides ? slidesExportRows(slides, language) : slidesTemplateRows(language);
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = rows[0].map((_, idx) => {
    if (idx === 0) return { wch: 20 };
    if (idx === 1 || idx === 2 || idx === 3) return { wch: 18 };
    if (idx >= 6 && idx <= 9) return { wch: 42 };
    if (idx >= 23 && idx <= 24) return { wch: 36 };
    return { wch: 24 };
  });
  XLSX.utils.book_append_sheet(wb, sheet, 'Slides');

  const guideRows = buildMasterReferenceGuideRows(language);
  const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
  guideSheet['!cols'] = [{ wch: 32 }, { wch: 62 }, { wch: 58 }];
  XLSX.utils.book_append_sheet(wb, guideSheet, 'Reference Guide');

  if (slides) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['Slide Sync v1'],
        ['Slide ID'],
        ...slides.map(s => [String(s.id ?? '')]).filter(r => r[0]),
      ]),
      'Sync IDs',
    );
  }

  return wb;
}

export function downloadSlidesWorkbook(
  slides: SlideBlock[] | null,
  language: string = 'ar',
  lessonTitle: string = '',
) {
  const wb = buildSlidesWorkbook(slides, language);
  const safeName = String(lessonTitle || 'lesson').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').slice(0, 40) || 'lesson';
  const filename = slides
    ? (language === 'ar' ? `تصدير_شرائح_${safeName}.xlsx` : `${safeName}_slides_backup.xlsx`)
    : (language === 'ar' ? 'قالب_ودليل_الشرح_والجداول.xlsx' : 'slides_and_tables_bilingual_template.xlsx');
  XLSX.writeFile(wb, filename);
}

export function planSlidesImport(
  rows: any[][],
  currentSlides: SlideBlock[],
  options: { canDelete: boolean; exportedIds?: string[]; language?: string; importAsNew?: boolean },
) {
  const ar = options.language !== 'en';
  const fail = (en: string, arabic: string): never => {
    throw new Error(ar ? arabic : en);
  };

  if (!rows || rows.length < 2) fail('Slides sheet is empty.', 'ورقة الشرائح فارغة.');

  const headersNorm = (rows[0] || []).map(normalizeHeader);
  const findCol = (predicate: (h: string, idx: number) => boolean) => headersNorm.findIndex((h, idx) => predicate(h, idx));
  const isEn = (h: string) => /\b(?:en|english)\b/.test(h) || /[إا]نجل/.test(h);

  const idIdx = findCol(h => h.includes('slide id') || h.includes('معرف الشريحة') || h === 'id');
  const actionIdx = findCol(h => h.includes('action') || h.includes('الإجراء') || h.includes('الاجراء'));
  const blockTypeIdx = findCol(h => h.includes('block type') || h.includes('نوع الشريحة'));
  const kindIdx = findCol(h => h.includes('slide kind') || h.includes('تصنيف الشريحة') || h === 'kind' || h === 'type');
  const titleEnIdx = findCol(h => isEn(h) && (h.includes('title') || h.includes('عنوان الشريحة')));
  const titleIdx = findCol((h, idx) => idx !== titleEnIdx && !h.includes('lesson') && (h.includes('title') || h.includes('عنوان الشريحة') || h === 'عنوان'));
  const contentEnIdx = findCol(h => isEn(h) && (h.includes('content') || h.includes('محتوى') || h.includes('الشرح')));
  const contentIdx = findCol((h, idx) => idx !== contentEnIdx && (h.includes('content') || h.includes('محتوى') || h.includes('الشرح')));
  const tableEnIdx = findCol(h => isEn(h) && (h.includes('table') || h.includes('الجدول') || h.includes('جدول')));
  const tableIdx = findCol((h, idx) => idx !== tableEnIdx && (h.includes('table') || h.includes('الجدول') || h.includes('جدول')));
  const videoIdx = findCol(h => h.includes('video') || h.includes('فيديو'));
  const pointsIdx = findCol(h => h.includes('point') || h.includes('نقاط') || h.includes('درجة'));
  const interactiveEnIdx = findCol(h => isEn(h) && (h.includes('interactive') || h.includes('البيانات التفاعلية')));
  const interactiveIdx = findCol((h, idx) => idx !== interactiveEnIdx && (h.includes('interactive') || h.includes('البيانات التفاعلية')));
  const expEnIdx = findCol(h => isEn(h) && (h.includes('explanation') || h.includes('التفسير')));
  const expIdx = findCol((h, idx) => idx !== expEnIdx && (h.includes('explanation') || h.includes('التفسير')));
  const sectionsJsonIdx = findCol(h => h.includes('sections json') || h === 'sections');

  const optEnCols = [1, 2, 3, 4, 5].map(n => findCol(h => isEn(h) && h.includes(String(n)) && (h.includes('option') || h.includes('خيار') || h.includes('الخيار'))));
  const optArCols = [1, 2, 3, 4, 5].map((n, i) => findCol((h, idx) => !optEnCols.includes(idx) && h.includes(String(n)) && (h.includes('option') || h.includes('خيار') || h.includes('الخيار'))));
  const correctEnIdx = findCol(h => isEn(h) && (h.includes('correct answer') || h.includes('الإجابة الصحيحة') || h.includes('الاجابة الصحيحة')));
  const correctArIdx = findCol((h, idx) => idx !== correctEnIdx && (h.includes('correct answer') || h.includes('الإجابة الصحيحة') || h.includes('الاجابة الصحيحة')));

  const metaCols = {
    domain: findCol(h => !isEn(h) && (h.includes('domain') || h.includes('المجال'))),
    domainEn: findCol(h => isEn(h) && (h.includes('domain') || h.includes('المجال'))),
    standard: findCol(h => !isEn(h) && (h.includes('standard') || h.includes('المعيار'))),
    standardEn: findCol(h => isEn(h) && (h.includes('standard') || h.includes('المعيار'))),
    indicator: findCol(h => !isEn(h) && (h.includes('indicator') || h.includes('المؤشر'))),
    indicatorEn: findCol(h => isEn(h) && (h.includes('indicator') || h.includes('المؤشر'))),
    learningOutcome: findCol(h => !isEn(h) && (h.includes('outcome') || h.includes('ناتج'))),
    learningOutcomeEn: findCol(h => isEn(h) && (h.includes('outcome') || h.includes('ناتج'))),
    skill: findCol(h => !isEn(h) && (h.includes('skill') || h.includes('المهارة'))),
    skillEn: findCol(h => isEn(h) && (h.includes('skill') || h.includes('المهارة'))),
    level: findCol(h => h.includes('difficulty') || h.includes('الصعوبة') || h === 'level'),
    dok: findCol(h => h.includes('dok') || h.includes('عمق المعرفة')),
  };

  if (titleIdx < 0 && titleEnIdx < 0 && contentIdx < 0 && contentEnIdx < 0 && tableIdx < 0) {
    fail('Missing Slide Title or Content columns.', 'أعمدة عنوان الشريحة أو محتوى الشرح غير موجودة.');
  }

  const currentById = new Map(currentSlides.map(s => [key(s.id), s]));
  const seen = new Set<string>();
  const updates = new Map<string, SlideBlock>();
  const added: SlideBlock[] = [];
  const deleted = new Set<string>();
  let updated = 0;
  let unchanged = 0;

  for (const [offset, row] of rows.slice(1).entries()) {
    if (!row.some(cell => key(cell))) continue;
    const rowFail = (en: string, arabic: string): never => fail(`Row ${offset + 2}: ${en}`, `الصف ${offset + 2}: ${arabic}`);

    const rawId = options.importAsNew || idIdx < 0 ? '' : key(row[idIdx]);
    const action = actionIdx < 0 ? '' : key(row[actionIdx]).toUpperCase();
    if (!['', 'ADD', 'UPDATE', 'DELETE', 'إضافة', 'تعديل', 'حذف'].includes(action)) {
      rowFail('Invalid Action.', 'الإجراء غير صحيح.');
    }
    if (rawId && seen.has(rawId)) rowFail('Duplicate Slide ID.', 'معرف الشريحة مكرر.');

    if (['DELETE', 'حذف'].includes(action)) {
      if (!options.canDelete) fail('الحذف مقفل / Slide deletion is locked.', 'الحذف مقفل / Slide deletion is locked.');
      if (options.importAsNew) rowFail('Cannot copy a workbook with DELETE rows.', 'لا يمكن نسخ ملف يحتوي على صفوف DELETE.');
      if (!rawId) rowFail('Deletion requires Slide ID.', 'الحذف يتطلب معرف الشريحة.');
      if (!currentById.has(rawId)) rowFail('Slide ID is not in this lesson.', 'معرف الشريحة لا ينتمي لهذا الدرس.');
      seen.add(rawId);
      deleted.add(rawId);
      continue;
    }

    const isExplicitAdd = ['ADD', 'إضافة'].includes(action);
    const isExplicitUpdate = ['UPDATE', 'تعديل'].includes(action);
    const isAddition = !rawId || isExplicitAdd || (!isExplicitUpdate && !currentById.has(rawId));
    const id = isAddition ? '' : rawId;
    if (!isAddition && id && !currentById.has(id)) {
      rowFail('Slide ID is not in this lesson. Export again.', 'معرف الشريحة لا ينتمي لهذا الدرس. أعد التصدير.');
    }
    if (rawId) seen.add(rawId);

    const prev = id ? currentById.get(id) : undefined;
    const slide: SlideBlock = {
      ...(prev || { id: Date.now() + Math.random() + offset * 0.001, sections: [] }),
    };
    if (isAddition && (!rawId || !currentById.has(rawId) || options.importAsNew)) {
      slide.id = prev ? prev.id : Date.now() + Math.random() + offset * 0.001;
    }

    const rawKind = kindIdx >= 0 ? key(row[kindIdx]).toUpperCase() : String(prev?.label || 'CONTENT').toUpperCase();
    const rawBlockType = blockTypeIdx >= 0 ? key(row[blockTypeIdx]).toUpperCase() : '';
    const inferredBlockType =
      rawBlockType === 'QUESTION' || rawKind === 'MCQ' || rawKind === 'TRUE_FALSE' || rawKind === 'MULTI_SELECT' || rawKind === 'TEXT' || rawKind === 'ESSAY' || INTERACTIVE_QUESTION_TYPES.has(rawKind)
        ? 'QUESTION'
        : 'TEXT';
    slide.type = rawBlockType === 'TEXT' && TEXT_SLIDE_KINDS.has(rawKind) ? 'TEXT' : inferredBlockType;
    slide.label = rawKind || (slide.type === 'QUESTION' ? 'MCQ' : 'CONTENT');

    const titleAr = titleIdx >= 0 ? String(row[titleIdx] ?? '').trim() : '';
    const titleEn = titleEnIdx >= 0 ? String(row[titleEnIdx] ?? '').trim() : '';
    slide.title = titleAr || titleEn || prev?.title || '';
    if (titleEn || prev?.titleEn) slide.titleEn = titleEn || prev?.titleEn || '';

    const rawContentAr = contentIdx >= 0 ? String(row[contentIdx] ?? '').trim() : '';
    const rawContentEn = contentEnIdx >= 0 ? String(row[contentEnIdx] ?? '').trim() : '';
    const tableHtmlAr = tableIdx >= 0 ? pipeTextToHtmlTable(String(row[tableIdx] ?? '')) : '';
    const tableHtmlEn = tableEnIdx >= 0 ? pipeTextToHtmlTable(String(row[tableEnIdx] ?? '')) : '';

    const mergedContentAr = [convertInlineTableTags(rawContentAr), tableHtmlAr].filter(Boolean).join(rawContentAr && tableHtmlAr ? '\n' : '');
    const mergedContentEn = [convertInlineTableTags(rawContentEn), tableHtmlEn].filter(Boolean).join(rawContentEn && tableHtmlEn ? '\n' : '');

    slide.content = mergedContentAr || mergedContentEn || '';
    slide.text = slide.content;
    if (mergedContentEn || contentEnIdx >= 0) {
      slide.contentEn = mergedContentEn || '';
      slide.textEn = slide.contentEn;
    }
    if (videoIdx >= 0) slide.videoUrl = key(row[videoIdx]);

    if (slide.type === 'QUESTION') {
      const optsAr = optArCols.map(i => (i >= 0 ? String(row[i] ?? '').trim() : '')).filter(Boolean);
      const optsEn = optEnCols.map(i => (i >= 0 ? String(row[i] ?? '').trim() : '')).filter(Boolean);
      const ansAr = correctArIdx >= 0 ? String(row[correctArIdx] ?? '').trim() : '';
      const ansEn = correctEnIdx >= 0 ? String(row[correctEnIdx] ?? '').trim() : '';
      const interAr = interactiveIdx >= 0 ? String(row[interactiveIdx] ?? '').trim() : '';
      const interEn = interactiveEnIdx >= 0 ? String(row[interactiveEnIdx] ?? '').trim() : '';

      if (INTERACTIVE_QUESTION_TYPES.has(slide.label)) {
        const parsedAr = parseInteractiveFromExcel(slide.label, interAr || interEn, optsAr, ansAr || ansEn);
        slide.options = parsedAr.options;
        slide.correctAnswer = parsedAr.correctAnswer;
        if (interEn || optsEn.length || ansEn) {
          const parsedEn = parseInteractiveFromExcel(slide.label, interEn || interAr, optsEn, ansEn || ansAr);
          slide.optionsEn = parsedEn.options;
          slide.correctAnswerEn = parsedEn.correctAnswer;
        }
      } else if (slide.label === 'TRUE_FALSE') {
        slide.options = optsAr.length ? optsAr : ['صحيح', 'خطأ'];
        slide.optionsEn = optsEn.length ? optsEn : ['True', 'False'];
        slide.correctAnswer = ansAr || ansEn || 'True';
        slide.correctAnswerEn = ansEn || (slide.correctAnswer === 'صحيح' ? 'True' : slide.correctAnswer === 'خطأ' ? 'False' : slide.correctAnswer);
      } else if (slide.label === 'MULTI_SELECT') {
        slide.options = optsAr.length ? optsAr : optsEn;
        if (optsEn.length) slide.optionsEn = optsEn;
        const parseMulti = (val: string, opts: string[]) => {
          const arr = parseJsonSafe(val, null);
          if (Array.isArray(arr)) return arr.map(String);
          return val.split(/[,،]/).map(s => s.trim()).filter(Boolean).map(tok => {
            const n = Number(tok);
            return Number.isInteger(n) && n >= 1 && opts[n - 1] ? opts[n - 1] : tok;
          });
        };
        slide.correctAnswers = parseMulti(ansAr || ansEn, slide.options || []);
        slide.correctAnswersEn = parseMulti(ansEn || ansAr, slide.optionsEn || slide.options || []);
        slide.correctAnswer = JSON.stringify(slide.correctAnswers);
        slide.correctAnswerEn = JSON.stringify(slide.correctAnswersEn);
      } else {
        slide.options = optsAr.length ? optsAr : optsEn;
        if (optsEn.length) slide.optionsEn = optsEn;
        const resolveAns = (val: string, opts: string[]) => {
          const n = Number(val);
          return Number.isInteger(n) && n >= 1 && opts[n - 1] ? opts[n - 1] : val;
        };
        slide.correctAnswer = resolveAns(ansAr || ansEn, slide.options || []);
        slide.correctAnswerEn = resolveAns(ansEn || ansAr, slide.optionsEn || slide.options || []);
      }

      if (pointsIdx >= 0) {
        const pts = Number(row[pointsIdx]);
        if (!Number.isNaN(pts) && pts >= 0) slide.points = pts;
      }
    }

    for (const [mKey, mIdx] of Object.entries(metaCols)) {
      if (mIdx >= 0) {
        const mVal = String(row[mIdx] ?? '').trim();
        if (mVal) slide[mKey] = mVal;
      }
    }

    const rawSections = sectionsJsonIdx >= 0 ? parseJsonSafe(row[sectionsJsonIdx], null) : null;
    if (Array.isArray(rawSections)) {
      slide.sections = rawSections;
    } else {
      const expArVal = expIdx >= 0 ? String(row[expIdx] ?? '').trim() : '';
      const expEnVal = expEnIdx >= 0 ? String(row[expEnIdx] ?? '').trim() : '';
      if (expArVal || expEnVal) {
        slide.explanation = expArVal;
        slide.explanationEn = expEnVal;
        const existingSections = Array.isArray(slide.sections) ? slide.sections.filter((s: any) => s.type !== 'EXPLANATION') : [];
        slide.sections = [...existingSections, { id: Date.now() + Math.random(), type: 'EXPLANATION', content: expArVal || expEnVal, contentEn: expEnVal }];
      }
    }

    if (prev) {
      if (JSON.stringify(prev) === JSON.stringify(slide)) {
        unchanged++;
      } else {
        updates.set(id, slide);
        updated++;
      }
    } else {
      added.push(slide);
    }
  }

  if (options.exportedIds?.length && !options.importAsNew) {
    for (const oldId of options.exportedIds) {
      if (!seen.has(oldId)) {
        if (!options.canDelete) fail('الحذف مقفل / Slide deletion is locked.', 'الحذف مقفل / Slide deletion is locked.');
        deleted.add(oldId);
      }
    }
  }

  const nextSlides: SlideBlock[] = [];
  for (const existing of currentSlides) {
    const k = key(existing.id);
    if (deleted.has(k)) continue;
    nextSlides.push(updates.get(k) || existing);
  }
  nextSlides.push(...added);

  return {
    slides: nextSlides,
    added: added.length,
    updated,
    unchanged,
    deletedIds: [...deleted],
  };
}

export function readSlidesImport(
  wb: XLSX.WorkBook,
  currentSlides: SlideBlock[],
  canDelete: boolean,
  language: string,
  importAsNew = false,
) {
  const sheetName = wb.SheetNames.find(n => /^slides?$/i.test(n) || /slides backup|شرائح/i.test(n)) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });

  let exportedIds: string[] | undefined;
  if (wb.Sheets['Sync IDs'] && !importAsNew) {
    const manifest = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['Sync IDs'], { header: 1, defval: '' });
    if (manifest[0]?.[0] === 'Slide Sync v1' && manifest[1]?.[0] === 'Slide ID') {
      exportedIds = manifest.slice(2).map(r => String(r[0] ?? '').trim()).filter(Boolean);
    }
  }

  return planSlidesImport(rows, currentSlides, { canDelete, exportedIds, language, importAsNew });
}

export async function importLessonSlides(
  e: { target: HTMLInputElement },
  getContext: () => any,
  canDelete: boolean,
) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const start = getContext();
  const { language = 'ar', showToast } = start;
  const snapshot = JSON.stringify(start.currentLesson);
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const ctx = getContext();
    if (ctx.isLoadingContent || JSON.stringify(ctx.currentLesson) !== snapshot) {
      throw new Error(language === 'ar' ? 'تغيرت بيانات الدرس أثناء القراءة. أعد المحاولة.' : 'Lesson changed while reading file. Import again.');
    }
    const existingSlides = Array.isArray(ctx.currentLesson?.slides) ? ctx.currentLesson.slides : [];
    const plan = readSlidesImport(wb, existingSlides, canDelete, language);
    const summary = language === 'ar'
      ? `مراجعة استيراد الشرائح: إضافة ${plan.added}، تعديل ${plan.updated}، حذف ${plan.deletedIds.length}، بدون تغيير ${plan.unchanged}.\nهل تريد التطبيق؟`
      : `Slides import preview: ${plan.added} added, ${plan.updated} updated, ${plan.deletedIds.length} deleted, ${plan.unchanged} unchanged.\nApply changes?`;
    if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(summary)) return;
    ctx.setCurrentLesson((prev: any) => ({ ...prev, slides: plan.slides }));
    showToast?.(language === 'ar' ? 'تم استيراد شرائح الشرح بنجاح' : 'Explanation slides imported successfully', 'success');
  } catch (error) {
    showToast?.(error instanceof Error ? error.message : String(error), 'error');
  }
}

const safeQuestionsExportRows = (list: any[], language: string): any[][] => {
  const simple: any[] = [];
  const complex: any[] = [];
  for (const item of list) {
    const rawOpts = typeof item.options === 'string' ? parseJsonSafe(item.options, item.options) : item.options;
    const isSimple =
      (rawOpts == null || Array.isArray(rawOpts)) &&
      (!Array.isArray(rawOpts) || (rawOpts.length <= 5 && rawOpts.every((o: any) => typeof o === 'string')));
    if (isSimple) simple.push(item);
    else complex.push(item);
  }
  if (complex.length === 0) {
    return questionExportRows(list, language);
  }
  // Fallback via slides schema when interactive questions exist so full-lesson backup never throws.
  return slidesExportRows(
    list.map(q => ({ ...q, type: 'QUESTION', label: q.type || q.label || 'MCQ', content: q.text ?? q.content ?? '', contentEn: q.textEn ?? q.contentEn ?? '' })),
    language,
  );
};

export function buildFullLessonWorkbook(lesson: any | null, language: string = 'ar'): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const isTemplate = !lesson;

  const metaRows = buildLessonMetadataExportRows(
    lesson || {
      title: 'الدرس 1: قوانين الحركة والجدول المقارن',
      titleEn: 'Lesson 1: Laws of Motion & Comparison',
      domain: 'الفيزياء والميكانيكا',
      domainEn: 'Physics & Mechanics',
      standards: 'فهم العلاقة بين القوة والكتلة والتسارع',
      standardsEn: 'Understand the relationship between force, mass, and acceleration',
      indicators: 'يحل الطالب تطبيقات القانون الثاني لنيوتن',
      indicatorsEn: "Applies Newton's Second Law to numerical problems",
      learningOutcomes: 'يستنتج العلاقة الطردية بين القوة المحصلة والتسارع',
      learningOutcomesEn: 'Infers direct proportionality between net force and acceleration',
      summary: 'شرح القوانين مع أمثلة تفاعلية وجدول وحدات القياس',
      summaryEn: 'Laws explanation with worked examples and SI units table',
      notes: 'ملاحظة للمعلم: ابدأ بجدول الوحدات قبل حل المسائل.',
      notesEn: 'Teacher note: Start with the SI units table before problems.',
      videoUrl: 'https://youtube.com/watch?v=example',
      duration: 1800,
    },
    language,
  );
  const metaSheet = XLSX.utils.aoa_to_sheet(metaRows);
  metaSheet['!cols'] = metaRows[0].map(() => ({ wch: 28 }));
  XLSX.utils.book_append_sheet(wb, metaSheet, 'Metadata');

  const slideRows = isTemplate ? slidesTemplateRows(language) : slidesExportRows(lesson.slides || [], language);
  const slidesSheet = XLSX.utils.aoa_to_sheet(slideRows);
  slidesSheet['!cols'] = slideRows[0].map((_, idx) => (idx >= 6 && idx <= 9 ? { wch: 40 } : { wch: 24 }));
  XLSX.utils.book_append_sheet(wb, slidesSheet, 'Slides');

  const qRows = isTemplate ? questionTemplateRows(language) : safeQuestionsExportRows(lesson.questions || [], language);
  const qSheet = XLSX.utils.aoa_to_sheet(qRows);
  qSheet['!cols'] = qRows[0].map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(wb, qSheet, 'Questions');

  const aRows = isTemplate ? questionTemplateRows(language) : safeQuestionsExportRows(lesson.assignments || [], language);
  const aSheet = XLSX.utils.aoa_to_sheet(aRows);
  aSheet['!cols'] = aRows[0].map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(wb, aSheet, 'Assignments');

  const guideRows = buildMasterReferenceGuideRows(language);
  const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
  guideSheet['!cols'] = [{ wch: 32 }, { wch: 62 }, { wch: 58 }];
  XLSX.utils.book_append_sheet(wb, guideSheet, 'Reference Guide');

  if (lesson) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['Slide Sync v1'],
        ['Slide ID'],
        ...(lesson.slides || []).map((s: any) => [String(s.id ?? '')]).filter((r: string[]) => r[0]),
      ]),
      'Sync IDs',
    );
  }

  return wb;
}

const parseQuestionSheet = (sheet: XLSX.WorkSheet, currentList: any[], language: string) => {
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  if (rows.length < 2) return currentList;
  const headersNorm = (rows[0] || []).map(normalizeHeader);
  const isSlideSchema = headersNorm.some(h => h.includes('block type') || h.includes('slide kind'));
  if (isSlideSchema) {
    const res = planSlidesImport(rows, [], { canDelete: false, language, importAsNew: true });
    return res.slides.map(s => ({
      id: s.id,
      type: s.label || 'MCQ',
      text: s.content || s.text || s.title || '',
      textEn: s.contentEn || s.textEn || s.titleEn || '',
      options: s.options || [],
      optionsEn: s.optionsEn,
      correctAnswer: s.correctAnswer ?? '',
      correctAnswerEn: s.correctAnswerEn,
      correctAnswers: s.correctAnswers,
      correctAnswersEn: s.correctAnswersEn,
      points: s.points ?? 1,
      explanation: s.explanation || '',
      explanationEn: s.explanationEn || '',
      domain: s.domain || '',
      domainEn: s.domainEn || '',
      standard: s.standard || '',
      standardEn: s.standardEn || '',
      indicator: s.indicator || '',
      indicatorEn: s.indicatorEn || '',
      skill: s.skill || '',
      skillEn: s.skillEn || '',
      level: s.level || '',
      dok: s.dok || '',
      sections: s.sections || [],
    }));
  }
  return planQuestionImport(rows, currentList, { canDelete: false, language, importAsNew: currentList.length === 0 }).questions;
};

export function importFullLessonWorkbook(wb: XLSX.WorkBook, currentLesson: any, language: string = 'ar'): any {
  const next = { ...(currentLesson || {}) };

  const metaSheetName = wb.SheetNames.find(n => /meta/i.test(n) || /البيانات/i.test(n));
  if (metaSheetName) {
    const metaRows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[metaSheetName], { header: 1, defval: '' });
    if (metaRows.length >= 2) {
      try {
        const parsedMeta = parseLessonMetadataRows(metaRows, '');
        Object.assign(next, parsedMeta);
      } catch {
        // Ignore non-matching metadata headers gracefully if another sheet matched
      }
    }
  }

  const slidesSheetName = wb.SheetNames.find(n => /^slides$/i.test(n) || /slides backup|شرائح/i.test(n));
  if (slidesSheetName) {
    const slideRows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[slidesSheetName], { header: 1, defval: '' });
    if (slideRows.length >= 2) {
      const slidePlan = planSlidesImport(slideRows, Array.isArray(next.slides) ? next.slides : [], {
        canDelete: false,
        language,
        importAsNew: true,
      });
      next.slides = slidePlan.slides;
    }
  }

  const questionsSheetName = wb.SheetNames.find(n => /^questions/i.test(n) || /questions backup|تدريبات|أسئلة/i.test(n));
  if (questionsSheetName) {
    next.questions = parseQuestionSheet(wb.Sheets[questionsSheetName], Array.isArray(next.questions) ? next.questions : [], language);
  }

  const assignmentsSheetName = wb.SheetNames.find(n => /^assignments/i.test(n) || /واجبات/i.test(n));
  if (assignmentsSheetName) {
    next.assignments = parseQuestionSheet(wb.Sheets[assignmentsSheetName], Array.isArray(next.assignments) ? next.assignments : [], language);
  }

  // Fallback for single-sheet Course/Lesson Export format (from /api/school/export/lesson/:id)
  if (!slidesSheetName && !questionsSheetName && wb.SheetNames[0]) {
    const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    if (rows.length > 0 && ('Lesson Title' in rows[0] || 'Lesson Slides' in rows[0])) {
      const first = rows[0];
      if (first['Lesson Title']) next.title = String(first['Lesson Title']);
      if (first['Lesson Title (En)']) next.titleEn = String(first['Lesson Title (En)']);
      if (first['Lesson Domain']) next.domain = String(first['Lesson Domain']);
      if (first['Lesson Domain (En)']) next.domainEn = String(first['Lesson Domain (En)']);
      if (first['Lesson Summary']) next.summary = String(first['Lesson Summary']);
      if (first['Lesson Notes']) next.notes = String(first['Lesson Notes']);
      if (first['Lesson Video URL']) next.videoUrl = String(first['Lesson Video URL']);
      if (first['Lesson Standards']) next.standards = String(first['Lesson Standards']);
      if (first['Lesson Indicators']) next.indicators = String(first['Lesson Indicators']);
      if (first['Lesson Learning Outcomes']) next.learningOutcomes = String(first['Lesson Learning Outcomes']);
      const slidesJson = rows.map(r => String(r['Slides JSON (Lossless)'] || '')).join('').trim();
      const questionsJson = rows.map(r => String(r['Questions JSON (Lossless)'] || '')).join('').trim();
      const assignmentsJson = rows.map(r => String(r['Assignments JSON (Lossless)'] || '')).join('').trim();
      if (slidesJson) {
        const parsed = parseJsonSafe(slidesJson, null);
        if (Array.isArray(parsed)) next.slides = parsed;
      }
      if (questionsJson) {
        const parsed = parseJsonSafe(questionsJson, null);
        if (Array.isArray(parsed)) next.questions = parsed;
      }
      if (assignmentsJson) {
        const parsed = parseJsonSafe(assignmentsJson, null);
        if (Array.isArray(parsed)) next.assignments = parsed;
      }
    }
  }

  next.isContentLoaded = true;
  return next;
}

export function downloadFullLessonWorkbook(
  lesson: any | null,
  language: string = 'ar',
  lessonTitle: string = '',
) {
  const wb = buildFullLessonWorkbook(lesson, language);
  const safeName = String(lessonTitle || lesson?.title || 'lesson').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').slice(0, 40) || 'lesson';
  const filename = lesson
    ? (language === 'ar' ? `نسخة_احتياطية_الدرس_${safeName}.xlsx` : `lesson_${safeName}_full_backup.xlsx`)
    : (language === 'ar' ? 'قالب_ودليل_الدرس_الشامل_والجداول.xlsx' : 'full_lesson_bilingual_template_and_guide.xlsx');
  XLSX.writeFile(wb, filename);
}

export async function handleFullLessonExcelImport(
  e: { target: HTMLInputElement },
  getLesson: () => any,
  applyLesson: (nextLesson: any) => void,
  language: string = 'ar',
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void,
) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const baseLesson = getLesson();
    const blankBase = {
      title: '',
      domain: '',
      content: '',
      videoUrl: '',
      summary: '',
      notes: '',
      standards: '',
      indicators: '',
      learningOutcomes: '',
      isVisible: true,
      publishDate: '',
      cutOffDate: '',
      slides: [],
      questions: [],
      assignments: [],
      attachments: [],
    };

    const currentTitle = String(baseLesson?.title || '').trim();
    const hasExistingLesson = Boolean(baseLesson?.id || (baseLesson?.newLessonId && currentTitle));
    const asNewLesson = importFullLessonWorkbook(wb, blankBase, language);
    const importedTitle = String(asNewLesson?.title || '').trim();

    if (hasExistingLesson && importedTitle && currentTitle && importedTitle.toLowerCase() !== currentTitle.toLowerCase()) {
      const shouldImportAsNew = typeof window === 'undefined' || typeof window.confirm !== 'function'
        ? true
        : window.confirm(
            language === 'ar'
              ? `عنوان الدرس في الملف ("${importedTitle}") يختلف عن الدرس المفتوح حالياً ("${currentTitle}").\n\nاضغط موافق لتحميله كدرس جديد منفصل بدون المساس بالدرس القديم، أو إلغاء للتراجع.`
              : `The Excel file is for a different lesson ("${importedTitle}") than the open lesson ("${currentTitle}").\n\nClick OK to load it as a separate new lesson without modifying the existing one, or Cancel to abort.`
          );
      if (!shouldImportAsNew) {
        showToast?.(
          language === 'ar' ? 'تم إلغاء الاستيراد للحفاظ على الدرس الحالي' : 'Import cancelled to keep the existing lesson',
          'info',
        );
        return;
      }
      applyLesson({
        ...asNewLesson,
        id: undefined,
        updatedAt: undefined,
        newLessonId: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : undefined,
        isContentLoaded: true,
      });
      showToast?.(
        language === 'ar'
          ? `تم تجهيز "${importedTitle}" كدرس جديد بدون استبدال الدرس القديم — اضغط تحديث وحفظ لإضافته.`
          : `"${importedTitle}" loaded as a new lesson — click Update & Save to add it without replacing "${currentTitle}".`,
        'info',
      );
      return;
    }

    const nextLesson = importFullLessonWorkbook(wb, baseLesson, language);
    applyLesson(nextLesson);
    showToast?.(
      language === 'ar'
        ? 'تم استيراد بيانات الدرس والشرائح والأسئلة من الإكسيل بنجاح'
        : 'Full lesson (metadata, slides, questions, assignments) imported successfully',
      'success',
    );
  } catch (error) {
    showToast?.(error instanceof Error ? error.message : String(error), 'error');
  }
}
