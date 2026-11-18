const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const XLSX = require('xlsx');

require.extensions['.ts'] = (module, filename) => {
  const originalRequire = module.require.bind(module);
  module.require = (name) =>
    originalRequire(name.startsWith('@/') ? path.resolve(__dirname, '../../src', name.slice(2)) : name);
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    filename,
  );
};

const { translateBatch } = require('../../src/lib/translationService.ts');
const {
  isEnglishWithoutArabic,
  hasArabicVisibleText,
  autoTranslateLessonMetadata,
  autoTranslateSlidesList,
  autoTranslateQuestionsList,
  autoTranslateLessonWorkbook,
  autoTranslateSkillMetadata,
  importLessonMetadataFromExcelFile,
} = require('../../src/lib/excelAutoTranslate.ts');
const {
  importLessonSlides,
  handleFullLessonExcelImport,
} = require('../../src/lib/slidesExcelWorkbook.ts');
const { resolveSingleCorrectOptionIndex } = require('../../src/lib/answerEvaluation.ts');
const {
  importModuleQuestions,
} = require('../../src/lib/questionExcelWorkbook.ts');

function withMockTranslateFetch(fn) {
  return async (t) => {
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init) => {
      const body = JSON.parse(init?.body || '{}');
      calls.push(body);
      const translations = (body.texts || []).map((text) => {
        if (!text || !text.trim()) return text;
        // Preserve protected math/HTML spans identically when simulating /api/translate.
        return text.replace(
          /(<[^>]+>|\$\$[\s\S]*?\$\$|\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?:\\.|[^$\n])+\$|__[A-Z_]+_\d+__)|([^<$\\]+)/g,
          (full, protectedTok, prose) => {
            if (protectedTok) return protectedTok;
            if (!prose || !/[A-Za-z]/.test(prose)) return prose || '';
            return `عربي[${prose.trim()}]`;
          },
        );
      });
      return new Response(JSON.stringify({ translations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    try {
      await fn(t, calls);
    } finally {
      globalThis.fetch = originalFetch;
    }
  };
}

test('isEnglishWithoutArabic ignores pure LaTeX, HTML tags, [TABLE] markers, and uppercase curriculum codes', () => {
  assert.equal(isEnglishWithoutArabic('$x^2 + \\frac{1}{2}$'), false);
  assert.equal(isEnglishWithoutArabic('$$\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}$$'), false);
  assert.equal(isEnglishWithoutArabic('<strong>النص العربي فقط</strong>'), false);
  assert.equal(isEnglishWithoutArabic('[TABLE]\n$x$ | $y$\n1 | 2\n[/TABLE]'), false);
  assert.equal(isEnglishWithoutArabic('MATH.7.NS.3', 'metadata'), false);
  assert.equal(isEnglishWithoutArabic('DOK 2', 'metadata'), false);
  assert.equal(isEnglishWithoutArabic('Find $x$ in the table below'), true);
  assert.equal(isEnglishWithoutArabic('Two-step linear equations', 'metadata'), true);
  assert.equal(hasArabicVisibleText('<strong>اختبار</strong>'), true);
});

test('translateBatch chunks large batches (>45 items) and splits oversized HTML tables (>120 runs) compliantly', withMockTranslateFetch(async (_t, calls) => {
  const many = Array.from({ length: 100 }, (_, i) => `Question item ${i + 1}`);
  const translatedMany = await translateBatch(many, 'en', 'ar');
  assert.equal(translatedMany.length, 100);
  assert.equal(translatedMany[0], 'عربي[Question item 1]');
  assert.equal(translatedMany[99], 'عربي[Question item 100]');
  assert.ok(calls.length >= 3);
  for (const c of calls) {
    assert.ok(c.texts.length <= 45);
  }

  const bigRows = Array.from({ length: 150 }, (_, i) => `<tr><td>Cell ${i + 1}</td><td>$x_${i + 1}$</td></tr>`).join('');
  const bigHtml = `<table>${bigRows}</table>`;
  const [translatedHtml] = await translateBatch([bigHtml], 'en', 'ar');
  assert.match(translatedHtml, /^<table>/);
  assert.match(translatedHtml, /<\/table>$/);
  assert.ok(translatedHtml.includes('<td>عربي[Cell 1]</td>'));
  assert.ok(translatedHtml.includes('<td>عربي[Cell 150]</td>'));
  assert.ok(translatedHtml.includes('$x_150$'));
}));

test('autoTranslateLessonMetadata and importLessonMetadataFromExcelFile translate English sheets while preserving codes and existing Arabic', withMockTranslateFetch(async () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Lesson Title (En)', 'Domain (En)', 'Standard (En)', 'Indicator (En)', 'Learning Outcome (En)', 'Summary (En)'],
    ['Pythagorean Theorem', 'Geometry', 'MATH.8.G.7\nApply theorem to right triangles', 'Calculate $c = \\sqrt{a^2+b^2}$', 'Students find missing side', 'Right triangle relationship'],
  ]), 'Metadata');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const mockFile = { arrayBuffer: async () => buf };

  const md = await importLessonMetadataFromExcelFile(mockFile);
  assert.equal(md.titleEn, 'Pythagorean Theorem');
  assert.ok(md.title.includes('عربي[Pythagorean Theorem]'));
  assert.equal(md.domainEn, 'Geometry');
  assert.ok(md.domain.includes('عربي[Geometry]'));
  assert.ok(md.standards.includes('MATH.8.G.7'));
  assert.ok(md.standards.includes('عربي[Apply theorem to right triangles]'));
  assert.ok(md.indicators.includes('$c = \\sqrt{a^2+b^2}$'));

  const preserved = await autoTranslateLessonMetadata({ domain: 'الهندسة الفضائية', domainEn: 'Spatial Geometry' });
  assert.equal(preserved.domain, 'الهندسة الفضائية');
  assert.equal(preserved.domainEn, 'Spatial Geometry');
}));

test('autoTranslateSlidesList preserves [TABLE], single-letter table symbols, HTML tables, and LaTeX', withMockTranslateFetch(async () => {
  const slides = [
    {
      id: 's1',
      title: 'Force & Motion',
      content: 'Intro text with $F = ma$\n[TABLE]\nQuantity | Symbol | Unit\nForce | F | Newton\n[/TABLE]',
      hint: 'Check SI unit',
      sections: [{ id: 'sec-1', type: 'EXPLANATION', content: 'Solve \\begin{cases} x = 1 \\\\ y = 2 \\end{cases}' }],
    },
  ];
  const [tr] = await autoTranslateSlidesList(slides);
  assert.ok(tr.title.includes('عربي[Force & Motion]'));
  assert.equal(tr.titleEn, 'Force & Motion');
  assert.ok(tr.content.includes('[TABLE]'));
  assert.ok(tr.content.includes('[/TABLE]'));
  assert.ok(tr.content.includes('$F = ma$'));
  assert.ok(tr.content.includes('عربي[Quantity] | F | عربي[Unit]') || (tr.content.includes('عربي[Force]') && tr.content.includes('| F |') && tr.content.includes('عربي[Newton]')));
  assert.ok(tr.sections[0].content.includes('\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}'));
}));

test('importLessonSlides supports Table (En)-only sheets and handleFullLessonExcelImport translates full English workbook', withMockTranslateFetch(async () => {
  // 1. Slides sheet with ONLY Title (En) and Table (En)
  const slidesWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(slidesWb, XLSX.utils.aoa_to_sheet([
    ['Order', 'Slide Type', 'Title (En)', 'Table (En)'],
    [1, 'TEXT', 'Scalar vs Vector', 'Type | Example\nScalar | Mass'],
  ]), 'Slides');
  const slidesBuf = XLSX.write(slidesWb, { type: 'array', bookType: 'xlsx' });

  let lessonState = { title: 'Physics Lesson', slides: [] };
  const originalWindow = globalThis.window;
  globalThis.window = { confirm: () => true };
  try {
    await importLessonSlides(
      { target: { files: [{ name: 'slides.xlsx', arrayBuffer: async () => slidesBuf }], value: 'slides.xlsx' } },
      () => ({
        language: 'en',
        currentLesson: lessonState,
        setCurrentLesson: (updater) => {
          lessonState = typeof updater === 'function' ? updater(lessonState) : updater;
        },
        showToast: () => {},
      }),
      false,
    );
    assert.equal(lessonState.slides.length, 1);
    assert.ok(lessonState.slides[0].title.includes('عربي[Scalar vs Vector]'));
    assert.ok(lessonState.slides[0].content.includes('عربي[Mass]'));
    assert.match(lessonState.slides[0].contentEn, /<table/i);

    // 2. Full Lesson Workbook
    const fullWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(fullWb, XLSX.utils.aoa_to_sheet([
      ['Lesson Title (En)', 'Domain (En)', 'Summary (En)'],
      ['Energy Conservation', 'Physics', 'Total energy remains constant'],
    ]), 'Metadata');
    XLSX.utils.book_append_sheet(fullWb, XLSX.utils.aoa_to_sheet([
      ['Order', 'Slide Type', 'Title (En)', 'Content (En)'],
      [1, 'TEXT', 'Potential Energy', '<p>Formula: $PE = mgh$</p>'],
    ]), 'Slides');
    XLSX.utils.book_append_sheet(fullWb, XLSX.utils.aoa_to_sheet([
      ['Question Text (En)', 'Question Type', 'Option 1 (En)', 'Option 2 (En)', 'Correct Answer (En)'],
      ['Unit of energy?', 'MCQ', 'Joule', 'Watt', 'Joule'],
    ]), 'Questions');
    const fullBuf = XLSX.write(fullWb, { type: 'array', bookType: 'xlsx' });

    let applied = null;
    await handleFullLessonExcelImport(
      { target: { files: [{ name: 'energy.xlsx', arrayBuffer: async () => fullBuf }], value: 'energy.xlsx' } },
      () => ({ title: '', slides: [], questions: [], assignments: [] }),
      (next) => { applied = next; },
      'en',
    );
    assert.ok(applied);
    assert.ok(applied.title.includes('عربي[Energy Conservation]'));
    assert.equal(applied.titleEn, 'Energy Conservation');
    assert.equal(applied.domainEn, 'Physics');
    assert.ok(applied.domain.includes('عربي[Physics]'));
    assert.ok(applied.slides[0].content.includes('$PE = mgh$'));
    assert.ok(applied.questions[0].text.includes('عربي[Unit of energy?]'));
    assert.equal(applied.questions[0].correctAnswer, applied.questions[0].options[0]);
    assert.equal(applied.questions[0].correctAnswerEn, 'Joule');
  } finally {
    globalThis.window = originalWindow;
  }
}));

test('autoTranslateQuestionsList & importModuleQuestions translate MCQ, TRUE_FALSE, MULTI_SELECT, MATCHING & competition metadata', withMockTranslateFetch(async () => {
  const qs = await autoTranslateQuestionsList([
    {
      id: 'c1',
      type: 'TRUE_FALSE',
      text: 'Water boils at $100^\\circ C$',
      options: ['True', 'False'],
      correctAnswer: 'true',
      metadata: { standard: 'SCI.5.1', skill: 'Observation' },
    },
    {
      id: 'c2',
      type: 'MULTI_SELECT',
      text: 'Pick noble gases',
      options: ['Helium', 'Oxygen', 'Neon'],
      correctAnswers: ['Helium', 'Neon'],
      correctAnswer: '["Helium","Neon"]',
    },
  ]);

  assert.deepEqual(qs[0].options, ['صحيح', 'خطأ']);
  assert.deepEqual(qs[0].optionsEn, ['True', 'False']);
  assert.equal(qs[0].correctAnswer, 'True');
  assert.equal(qs[0].standard, 'SCI.5.1');
  assert.ok(qs[0].skill.includes('عربي[Observation]'));
  assert.ok(qs[0].metadata.skill.includes('عربي[Observation]'));
  assert.deepEqual(qs[1].correctAnswers, ['عربي[Helium]', 'عربي[Neon]']);
  assert.deepEqual(qs[1].correctAnswersEn, ['Helium', 'Neon']);

  // Workbook question upload flow
  const qWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(qWb, XLSX.utils.aoa_to_sheet([
    ['Question Text (En)', 'Question Type', 'Option 1 (En)', 'Option 2 (En)', 'Correct Answer (En)', 'Explanation (En)'],
    ['Derivative of $x^2$?', 'MCQ', '$2x$', 'Two times constant', '$2x$', 'Apply power rule'],
  ]), 'Questions');
  const qBuf = XLSX.write(qWb, { type: 'array', bookType: 'xlsx' });
  let mod = { questions: [] };
  const originalWindow = globalThis.window;
  globalThis.window = { confirm: () => true };
  try {
    await importModuleQuestions(
      { target: { files: [{ arrayBuffer: async () => qBuf }], value: 'q.xlsx' } },
      null,
      'questions',
      () => ({
        currentModule: mod,
        language: 'en',
        showToast: () => {},
        setCurrentModule: (fn) => { mod = fn(mod); },
      }),
      false,
    );
  } finally {
    globalThis.window = originalWindow;
  }
  assert.equal(mod.questions.length, 1);
  assert.ok(mod.questions[0].text.includes('$x^2$'));
  assert.ok(mod.questions[0].text.includes('عربي[Derivative of]'));
  assert.equal(mod.questions[0].options[0], '$2x$');
  assert.ok(mod.questions[0].explanation.includes('عربي[Apply power rule]'));
}));

test('autoTranslateSkillMetadata translates English skill metadata and preserves code identifiers', withMockTranslateFetch(async () => {
  const result = await autoTranslateSkillMetadata({
    domain: 'Mathematics',
    standards: ['MATH.4.NF.1', 'Recognize equivalent fractions'],
    indicators: ['Generate visual models'],
    outcomes: ['Compare two fractions'],
    translations: {},
  });
  assert.ok(result.domain.includes('عربي[Mathematics]'));
  assert.equal(result.domainEn, 'Mathematics');
  assert.ok(result.standards.includes('MATH.4.NF.1'));
  const translatedStd = result.standards.find((s) => s !== 'MATH.4.NF.1');
  assert.ok(translatedStd.includes('عربي[Recognize equivalent fractions]'));
  assert.equal(result.translations[translatedStd], 'Recognize equivalent fractions');
}));

test('autoTranslateQuestionsList disambiguates Point Q / Point S collisions and avoids false index fallback for numeric and single-letter options', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init?.body || '{}');
    const texts = Array.isArray(body.texts) ? body.texts : [];
    return new Response(JSON.stringify({
      translations: texts.map((text) => {
        if (text === 'Point Q' || text === 'Point S') return 'النقطة س';
        if (text === 'Point P') return 'النقطة ص';
        if (text === 'Point R') return 'النقطة ر';
        return `عربي[${text}]`;
      }),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const translated = await autoTranslateQuestionsList([
      {
        type: 'MCQ',
        textEn: 'Which point represents (-3, 2)?',
        optionsEn: ['Point P', 'Point Q', 'Point R', 'Point S'],
        correctAnswerEn: 'Point Q',
      },
      {
        type: 'MCQ',
        textEn: 'What is 2 + 2?',
        optionsEn: ['4', '2', '6', '8'],
        correctAnswerEn: '4',
      },
      {
        type: 'MCQ',
        textEn: 'Pick lowercase variable b',
        optionsEn: ['b', 'a', 'x', 'y'],
        correctAnswerEn: 'b',
      },
    ]);

    assert.equal(new Set(translated[0].options).size, 4);
    assert.equal(translated[0].correctAnswerEn, 'Point Q');
    assert.equal(translated[0].correctAnswer, translated[0].options[1]);
    assert.equal(resolveSingleCorrectOptionIndex(translated[0], true), 1);

    assert.equal(translated[1].correctAnswer, '4');
    assert.equal(translated[1].correctAnswerEn, '4');
    assert.equal(resolveSingleCorrectOptionIndex(translated[1], true), 0);

    assert.equal(translated[2].correctAnswer, translated[2].options[0]);
    assert.notEqual(translated[2].correctAnswer, translated[2].options[1]);
    assert.notEqual(translated[2].correctAnswer, 'B');
    assert.equal(translated[2].correctAnswerEn, 'b');
    assert.equal(resolveSingleCorrectOptionIndex(translated[2], true), 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
