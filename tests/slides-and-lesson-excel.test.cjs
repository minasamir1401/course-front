const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const originalRequire = module.require.bind(module);
  module.require = name => originalRequire(name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name);
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    filename,
  );
};

const XLSX = require('xlsx');
const {
  pipeTextToHtmlTable,
  extractHtmlTablesToPipeText,
  convertInlineTableTags,
  buildSlidesWorkbook,
  planSlidesImport,
  readSlidesImport,
  buildFullLessonWorkbook,
  importFullLessonWorkbook,
  handleFullLessonExcelImport,
} = require('../src/lib/slidesExcelWorkbook.ts');
const {
  buildLessonMetadataExportRows,
  parseLessonMetadataRows,
} = require('../src/lib/lessonMetadataExcel.ts');

const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function roundtripWorkbook(wb) {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return XLSX.read(buf, { type: 'buffer' });
}

test('HTML table helpers convert between pipe syntax, [TABLE] tags, and safe HTML tables', () => {
  const html = pipeTextToHtmlTable('Quantity & Sign | Unit <SI>\nForce | Newton');
  assert.match(html, /<table/i);
  assert.match(html, /Quantity &amp; Sign/);
  assert.match(html, /Unit &lt;SI&gt;/);

  const tagged = convertInlineTableTags('Summary line\n[TABLE]\nA | B\n1 | 2\n[/TABLE]');
  assert.match(tagged, /<table/i);
  assert.match(tagged, /Summary line/);

  const extracted = extractHtmlTablesToPipeText(tagged);
  assert.match(extracted.tablePipe, /A \| B/);
  assert.match(extracted.tablePipe, /1 \| 2/);
  assert.equal(extracted.cleanHtml.includes('<table>'), false);
});

test('slides template workbooks are bilingual, emoji-free, and import all slide and interactive types', () => {
  for (const lang of ['ar', 'en']) {
    const templateWb = roundtripWorkbook(buildSlidesWorkbook(null, lang));
    assert.ok(templateWb.Sheets.Slides);
    assert.ok(templateWb.Sheets['Reference Guide']);

    const guideRows = XLSX.utils.sheet_to_json(templateWb.Sheets['Reference Guide'], { header: 1, defval: '' });
    for (const row of guideRows) {
      for (const cell of row) {
        assert.equal(EMOJI_PATTERN.test(String(cell)), false, `Emoji found in Reference Guide: ${cell}`);
      }
    }

    const plan = readSlidesImport(templateWb, [], false, lang);
    assert.ok(plan.added >= 4, `Expected template slides to import, got ${plan.added}`);
    assert.ok(plan.slides.some(s => s.type === 'TEXT' && /<table/i.test(String(s.content || ''))));
    assert.ok(plan.slides.some(s => s.label === 'MCQ'));
    assert.ok(plan.slides.some(s => s.label === 'MATCHING'));
    assert.ok(plan.slides.some(s => s.label === 'GROUP_SORTING'));
  }
});

test('slides export and import preserves synced IDs without duplicating or deleting when deletion is disabled', () => {
  const existingSlides = [
    {
      id: 'slide-1',
      type: 'TEXT',
      label: 'CONTENT',
      title: 'الشرح الأول',
      titleEn: 'First Explanation',
      content: '<p>شرح</p><table><thead><tr><th>Col1</th><th>Col2</th></tr></thead><tbody><tr><td>V1</td><td>V2</td></tr></tbody></table>',
      contentEn: '<p>Explanation</p>',
    },
    {
      id: 'slide-2',
      type: 'QUESTION',
      label: 'MCQ',
      title: 'سؤال',
      content: 'اختر الصح',
      options: ['أ', 'ب'],
      correctAnswer: 'أ',
      points: 3,
    },
  ];

  const wb = roundtripWorkbook(buildSlidesWorkbook(existingSlides, 'ar'));
  assert.ok(wb.Sheets['Sync IDs']);

  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Slides, { header: 1, defval: '' });
  const plan = planSlidesImport([rows[0], rows[1]], existingSlides, { canDelete: false, language: 'ar' });
  assert.deepEqual(plan.slides.map(s => s.id), ['slide-1', 'slide-2']);
  assert.equal(plan.added, 0);
  assert.equal(plan.updated + plan.unchanged, 1);
  assert.deepEqual(plan.deletedIds, []);
});

test('lessonMetadataExcel exports and re-imports bilingual metadata accurately', () => {
  const lesson = {
    title: 'قوانين نيوتن',
    titleEn: "Newton's Laws",
    domain: 'الفيزياء',
    domainEn: 'Physics',
    standards: 'معيار الحركة',
    standardsEn: 'Motion Standard',
    indicators: 'مؤشر التسارع',
    indicatorsEn: 'Acceleration Indicator',
    learningOutcomes: 'يحل مسائل القانون الثاني',
    learningOutcomesEn: 'Solves 2nd Law problems',
    summary: 'ملخص الدرس',
    summaryEn: 'Lesson summary',
    notes: 'ملاحظات',
    notesEn: 'Teacher notes',
    videoUrl: 'https://example.com/v.mp4',
    duration: 1200,
  };

  const rows = buildLessonMetadataExportRows(lesson, 'ar');
  const parsed = parseLessonMetadataRows(rows, 'قوانين نيوتن');
  assert.equal(parsed.domain, 'الفيزياء');
  assert.equal(parsed.domainEn, 'Physics');
  assert.equal(parsed.standardsEn, 'Motion Standard');
  assert.equal(parsed.indicatorsEn, 'Acceleration Indicator');
  assert.equal(parsed.learningOutcomesEn, 'Solves 2nd Law problems');
  assert.equal(parsed.videoUrl, 'https://example.com/v.mp4');
  assert.equal(parsed.duration, 1200);

  assert.throws(() => parseLessonMetadataRows(rows, 'Different Lesson Title'));
});

test('buildFullLessonWorkbook and importFullLessonWorkbook roundtrip a complete bilingual lesson with zero emojis', () => {
  const fullTemplate = roundtripWorkbook(buildFullLessonWorkbook(null, 'ar'));
  for (const sheetName of ['Metadata', 'Slides', 'Questions', 'Assignments', 'Reference Guide']) {
    assert.ok(fullTemplate.Sheets[sheetName], `Missing template sheet: ${sheetName}`);
  }

  const guideRows = XLSX.utils.sheet_to_json(fullTemplate.Sheets['Reference Guide'], { header: 1, defval: '' });
  for (const row of guideRows) {
    for (const cell of row) {
      assert.equal(EMOJI_PATTERN.test(String(cell)), false, `Emoji found in Reference Guide: ${cell}`);
    }
  }

  const sampleLesson = {
    title: 'الدرس الأول: الحركة',
    titleEn: 'Lesson 1: Motion',
    domain: 'الميكانيكا',
    domainEn: 'Mechanics',
    standards: 'فهم الحركة',
    standardsEn: 'Understand motion',
    indicators: 'يحسب السرعة',
    indicatorsEn: 'Calculates speed',
    learningOutcomes: 'يميز بين السرعة والتسارع',
    learningOutcomesEn: 'Distinguishes speed and acceleration',
    summary: 'ملخص كامل',
    notes: 'ملاحظة مهمة',
    videoUrl: 'https://example.com/motion.mp4',
    duration: 1500,
    slides: [
      {
        id: 'sl-1',
        type: 'TEXT',
        label: 'CONTENT',
        title: 'مقدمة الجدول',
        titleEn: 'Table Intro',
        content: '<p>شرح</p><table><thead><tr><th>Quantity</th><th>Unit</th></tr></thead><tbody><tr><td>Speed</td><td>m/s</td></tr></tbody></table>',
        contentEn: '<p>Explanation</p>',
      },
    ],
    questions: [
      {
        id: 'q-1',
        type: 'MCQ',
        text: 'ما وحدة السرعة؟',
        textEn: 'What is the unit of speed?',
        options: ['m/s', 'kg'],
        optionsEn: ['m/s', 'kg'],
        correctAnswer: 'm/s',
        points: 2,
      },
    ],
    assignments: [
      {
        id: 'a-1',
        type: 'TRUE_FALSE',
        text: 'السرعة كمية متجهة لها مقدار واتجاه',
        textEn: 'Velocity has magnitude and direction',
        options: ['صحيح', 'خطأ'],
        correctAnswer: 'صحيح',
        points: 1,
      },
    ],
  };

  const exported = roundtripWorkbook(buildFullLessonWorkbook(sampleLesson, 'en'));
  assert.ok(exported.Sheets['Sync IDs']);

  const imported = importFullLessonWorkbook(exported, { slides: [], questions: [], assignments: [] }, 'en');
  assert.equal(imported.isContentLoaded, true);
  assert.equal(imported.title, 'الدرس الأول: الحركة');
  assert.equal(imported.domainEn, 'Mechanics');
  assert.equal(imported.standardsEn, 'Understand motion');
  assert.equal(imported.slides.length, 1);
  assert.match(imported.slides[0].content, /<table/i);
  assert.equal(imported.questions.length, 1);
  assert.equal(imported.questions[0].textEn, 'What is the unit of speed?');
  assert.equal(imported.assignments.length, 1);
});

test('handleFullLessonExcelImport protects existing open lesson when importing a differently named lesson', async () => {
  const gravitationWb = buildFullLessonWorkbook({
    title: 'Gravitation',
    domain: 'Physics',
    slides: [{ id: 'g-1', type: 'TEXT', label: 'CONTENT', title: 'Gravity Intro', content: '<p>F = G*m1*m2/r^2</p>' }],
    questions: [],
    assignments: [],
  }, 'en');
  const fileBuffer = XLSX.write(gravitationWb, { type: 'array', bookType: 'xlsx' });
  const mockEvent = {
    target: {
      files: [{ name: 'gravitation.xlsx', arrayBuffer: async () => fileBuffer }],
      value: 'C:\\fakepath\\gravitation.xlsx',
    },
  };

  let appliedLesson = null;
  const openExistingLesson = {
    id: 'wep-existing-id',
    updatedAt: '2026-11-15T10:00:00.000Z',
    title: 'Work, Energy & Power',
    slides: [{ id: 'wep-slide', title: 'Old slide' }],
  };

  const originalWindow = global.window;
  global.window = { confirm: () => true };
  try {
    await handleFullLessonExcelImport(
      mockEvent,
      () => openExistingLesson,
      (nextLesson) => { appliedLesson = nextLesson; },
      'en',
    );
  } finally {
    global.window = originalWindow;
  }

  assert.ok(appliedLesson);
  assert.equal(appliedLesson.title, 'Gravitation');
  assert.equal(appliedLesson.id, undefined);
  assert.equal(appliedLesson.updatedAt, undefined);
  assert.ok(appliedLesson.newLessonId);
  assert.equal(appliedLesson.isContentLoaded, true);
  assert.equal(openExistingLesson.id, 'wep-existing-id');
  assert.equal(openExistingLesson.title, 'Work, Energy & Power');
});
