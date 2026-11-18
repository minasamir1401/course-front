const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const originalRequire = module.require.bind(module);
  module.require = (name) =>
    originalRequire(name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name);
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const XLSX = require('xlsx');
const { questionExportRows, questionTemplateRows, planQuestionImport } = require('../src/lib/questionExcelSync.ts');
const { buildQuestionWorkbook, readQuestionImport, importModuleQuestions } = require('../src/lib/questionExcelWorkbook.ts');
const { resolvePreferredQuestionLang, getTrueFalseDefaults } = require('../src/lib/questionLanguage.ts');
const { cleanOptionText } = require('../src/lib/utils.ts');
const {
  stripOptionPrefix,
  isOptionMatch,
  resolveSingleOptionIndexForValue,
  resolveSingleCorrectOptionIndex,
  isAnswerCorrect,
} = require('../src/lib/answerEvaluation.ts');
const { normalizePersistedExamQuestion } = require('../src/lib/persistedExamQuestion.ts');
const { buildInitialCourseSectionMeta, populateBilingualQuestionDraft } = require('../src/lib/questionDraftHelpers.ts');
const q = (id = 'q1') => ({ id, text: '<b>5 + 5?</b>', type: 'MCQ', options: ['8', '10'],
  correctAnswer: '10', points: 1, skill: 'Algebra', explanation: 'Explanation', moduleId: 'm1', subExamId: 's1' });
const opts = { canDelete: true, language: 'en' };
const column = (rows, name) => rows[0].indexOf(name);
for (const lang of ['ar', 'en']) {
  test('workbook roundtrip preserves identity, rich text and metadata: ' + lang, () => {
    const current = [q()];
    const bytes = XLSX.write(buildQuestionWorkbook(current, lang), { type: 'buffer', bookType: 'xlsx' });
    const plan = readQuestionImport(XLSX.read(bytes), current, true, lang);
    assert.equal(plan.unchanged, 1);
    assert.equal(plan.updated, 0);
    assert.strictEqual(plan.questions[0], current[0]);
  });
  test('update and add in one file: ' + lang, () => {
    const current = [q()];
    const rows = questionExportRows(current, lang);
    rows[1][2] = 'Updated question';
    rows.push(questionTemplateRows(lang)[1]);
    const plan = planQuestionImport(rows, current, opts);
    assert.equal(plan.updated, 1); assert.equal(plan.added, 1);
    assert.equal(plan.questions[0].id, 'q1');
    assert.equal(plan.questions[0].skill, 'Algebra');
    assert.equal(plan.questions[0].moduleId, 'm1');
    assert.equal(plan.questions[0].text, 'Updated question');
  });
}
test('exported row deletion affects only exported IDs, preserves newer questions', () => {
  const current = [q(), q('q2'), q('newer')];
  const rows = questionExportRows([q()], 'en');
  const plan = planQuestionImport(rows, current, { ...opts, exportedIds: ['q1', 'q2'] });
  assert.deepEqual(plan.deletedIds, ['q2']);
  assert.deepEqual(plan.questions.map(q => q.id), ['q1', 'newer']);
});
test('locked deletion policy rejects Excel deletion atomically', () => {
  const rows = questionExportRows([q()], 'en'); rows[1][1] = 'DELETE';
  assert.throws(() => planQuestionImport(rows, [q()], { canDelete: false }), /الحذف مقفل/);
  assert.throws(() => planQuestionImport([rows[0]], [q()], { canDelete: false, exportedIds: ['q1'] }), /الحذف مقفل/);
});

test('open policy permits explicit and missing-row deletions for any authorized editor', () => {
  const rows = questionExportRows([q()], 'en'); rows[1][1] = 'DELETE';
  assert.deepEqual(planQuestionImport(rows, [q()], opts).deletedIds, ['q1']);
  assert.deepEqual(planQuestionImport([rows[0]], [q()], { ...opts, exportedIds: ['q1'] }).deletedIds, ['q1']);
});

test('copy mode creates new question IDs while preserving all existing questions', () => {
  const current = [q('existing')];
  const plan = readQuestionImport(buildQuestionWorkbook([q('foreign')], 'en'), current, false, 'en', true);
  assert.equal(plan.added, 1);
  assert.equal(plan.updated, 0);
  assert.deepEqual(plan.deletedIds, []);
  assert.strictEqual(plan.questions[0], current[0]);
  assert.notEqual(plan.questions[1].id, 'foreign');
});

test('copy mode never turns DELETE rows into deletions of another list', () => {
  const rows = questionExportRows([q('foreign')], 'en'); rows[1][1] = 'DELETE';
  assert.throws(() => planQuestionImport(rows, [q()], { ...opts, importAsNew: true }), /DELETE/);
});
test('old templates add; partial old exports never delete missing questions', () => {
  const rows = [['Question', 'Option 1', 'Option 2', 'Correct Answer', 'Points'], ['New?', 'A', 'B', 'B', 1]];
  const plan = planQuestionImport(rows, [q()], opts);
  assert.equal(plan.added, 1); assert.equal(plan.questions.length, 2);
  const partial = planQuestionImport(questionExportRows([q()], 'en'), [q(), q('q2')], opts);
  assert.equal(partial.questions.length, 2); assert.equal(partial.deletedIds.length, 0);
});
test('duplicate and foreign IDs are rejected; no matching by position or text', () => {
  const rows = questionExportRows([q(), q()], 'en');
  assert.throws(() => planQuestionImport(rows, [q()], opts), /Duplicate/);
  assert.throws(() => planQuestionImport(questionExportRows([q('foreign')], 'en'), [q()], opts), /not in this list/);
});
test('missing ID column in sync export is rejected', () => {
  const rows = questionExportRows([q()], 'en').map(row => row.slice(2));
  assert.throws(() => planQuestionImport(rows, [q()], { ...opts, exportedIds: ['q1'] }), /Question ID column/);
});
test('malformed rows report their number and never partially apply', () => {
  const rows = questionExportRows([q()], 'en'); rows[1][column(rows, 'Points')] = -1;
  assert.throws(() => planQuestionImport(rows, [q()], opts), /Row 2/);
  rows[1][column(rows, 'Points')] = 1; rows[1][column(rows, 'Correct Answer (Ar)')] = 'not an option';
  assert.throws(() => planQuestionImport(rows, [q()], opts), /Correct answer/);
});
test('multi select answers containing commas survive export', () => {
  const current = [{ ...q(), type: 'MULTI_SELECT', options: ['A, B', 'C'], correctAnswer: '["A, B","C"]' }];
  const plan = planQuestionImport(questionExportRows(current, 'en'), current, opts);
  assert.equal(plan.unchanged, 1);
});
test('empty explanation is an explicit clear; hidden fields remain', () => {
  const rows = questionExportRows([q()], 'en'); rows[1][column(rows, 'Explanation (Ar)')] = '';
  const plan = planQuestionImport(rows, [q()], opts);
  assert.equal(plan.questions[0].clearExplanation, true);
  assert.deepEqual(plan.questions[0].sections, []);
  assert.equal(plan.questions[0].skill, 'Algebra');
});
test('unsupported types and complex options cannot silently lose data', () => {
  const current = [{ ...q(), type: 'MATCHING' }];
  assert.throws(() => planQuestionImport(questionExportRows(current, 'en'), current, opts), /question type/);
  assert.throws(() => questionExportRows([{ ...q(), options: { nested: true } }], 'en'), /complex/);
});
test('cancelled preview does not change editor state', async () => {
  let writes = 0;
  global.window = { confirm: () => false };
  const wb = buildQuestionWorkbook([q()], 'en');
  const bytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const ctx = { currentModule: { questions: [q()] }, language: 'en', showToast() {},
    setCurrentModule() { writes++; }, setDeletedQuestionIds() { writes++; } };
  await importModuleQuestions({ target: { files: [{ arrayBuffer: async () => bytes }], value: 'x' } }, null, 'questions', () => ctx, true);
  assert.equal(writes, 0);
});
test('scope change while reading file refuses import', async () => {
  const messages = []; let writes = 0;
  const ctx = { currentModule: { questions: [q()] }, language: 'en', showToast: m => messages.push(m),
    setCurrentModule() { writes++; } };
  const bytes = XLSX.write(buildQuestionWorkbook([q()], 'en'), { type: 'buffer', bookType: 'xlsx' });
  await importModuleQuestions({ target: { files: [{ arrayBuffer: async () => {
    ctx.currentModule = { questions: [q('different')] }; return bytes;
  } }], value: 'x' } }, null, 'questions', () => ctx, true);
  assert.equal(writes, 0); assert.match(messages[0], /list changed/);
});
test('legacy lesson template uses one-based answers and supports TEXT', () => {
  const headers = ['Question Prompt (نص السؤال)', 'Type (MCQ/TRUE_FALSE/TEXT/MULTI_SELECT)',
    'Option 1 / Answer', 'Option 2', 'Option 3', 'Option 4',
    'Correct Answer (1-4 or comma separated for MULTI)', 'Explanation / Tip / Solution Note', 'Points'];
  const plan = planQuestionImport([headers, ['Force?', 'MCQ', 'Newton', 'Joule', '', '', '1', 'Hint', 2],
    ['Write a report', 'TEXT', '', '', '', '', '', '', 10]], [], opts);
  assert.equal(plan.questions[0].correctAnswer, 'Newton');
  assert.equal(plan.questions[1].type, 'TEXT');
});
test('changing MULTI_SELECT to MCQ clears old multiple answers', () => {
  const current = [{ ...q(), type: 'MULTI_SELECT', correctAnswers: ['8', '10'] }];
  const rows = questionExportRows(current, 'en');
  rows[1][column(rows, 'Question Type')] = 'MCQ';
  rows[1][column(rows, 'Correct Answer (Ar)')] = '10';
  const plan = planQuestionImport(rows, current, opts);
  assert.deepEqual(plan.questions[0].correctAnswers, []);
  assert.equal(plan.questions[0].correctAnswer, '10');
});
test('existing letter answers are accepted', () => {
  const current = [{ ...q(), correctAnswer: 'B' }];
  assert.equal(planQuestionImport(questionExportRows(current, 'en'), current, opts).unchanged, 1);
});
test('changing only points preserves custom title and explanation section formatting', () => {
  const sections = [{ type: 'EXPLANATION', content: 'Explanation', style: 'custom' }];
  const current = [{ ...q(), title: 'Custom title', sections }];
  const rows = questionExportRows(current, 'en'); rows[1][column(rows, 'Points')] = 4;
  const plan = planQuestionImport(rows, current, opts);
  assert.equal(plan.questions[0].title, 'Custom title');
  assert.strictEqual(plan.questions[0].sections, sections);
  assert.equal(plan.questions[0].points, 4);
});
test('confirmed child import tracks deletions and preserves sibling object', async () => {
  const sibling = { id: 'sibling', questions: [q('sibling-question')] };
  const current = { id: 'module', subExams: [{ id: 'selected', questions: [q(), q('q2')] }, sibling] };
  const ctx = { currentModule: current, language: 'en', showToast() {}, deleted: [],
    setCurrentModule(fn) { this.currentModule = fn(this.currentModule); },
    setDeletedQuestionIds(fn) { this.deleted = fn(this.deleted); } };
  const wb = buildQuestionWorkbook([q(), q('q2')], 'en');
  wb.Sheets.Questions = XLSX.utils.aoa_to_sheet(questionExportRows([{ ...q(), text: 'Edited' }], 'en'));
  const bytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  global.window = { confirm: () => true };
  await importModuleQuestions({ target: { files: [{ arrayBuffer: async () => bytes }], value: 'x' } }, 0, 'questions', () => ctx, true);
  assert.equal(ctx.currentModule.subExams[0].questions[0].text, 'Edited');
  assert.strictEqual(ctx.currentModule.subExams[1], sibling);
  assert.deepEqual(ctx.deleted, ['q2']);
  assert.equal(current.subExams[0].questions.length, 2);
});
test('template or addition rows without ID or with dummy sequence ID succeed without requiring ID', () => {
  const current = [q('q1')];
  // Case 1: User fills template row, leaves ID blank, and Action is UPDATE or empty
  const templateRow = questionTemplateRows('en')[1];
  templateRow[1] = 'UPDATE'; // Accidental UPDATE action by user
  const plan1 = planQuestionImport([questionTemplateRows('en')[0], templateRow], current, opts);
  assert.equal(plan1.added, 1);

  // Case 2: User typed sequence number 1 in ID column with ADD action
  const addWithDummyId = [...templateRow];
  addWithDummyId[0] = '1';
  addWithDummyId[1] = 'ADD';
  const plan2 = planQuestionImport([questionTemplateRows('en')[0], addWithDummyId], current, opts);
  assert.equal(plan2.added, 1);
});

test('adding a copy of an exported ID never deletes the original question', () => {
  const rows = questionExportRows([q()], 'en'); rows[1][1] = 'ADD';
  const plan = planQuestionImport(rows, [q()], { ...opts, exportedIds: ['q1'] });
  assert.equal(plan.added, 1);
  assert.deepEqual(plan.deletedIds, []);
  assert.equal(plan.questions[0].id, 'q1');
});

test('foreign exported workbook previews copying and applies new IDs only after confirmation', async t => {
  const originalWindow = global.window; t.after(() => { global.window = originalWindow; });
  const wb = buildQuestionWorkbook([q('foreign')], 'en');
  const bytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const current = { questions: [q('existing')] };
  let preview = ''; let error;
  const ctx = { currentModule: current, language: 'en', showToast(message, type) { if (type === 'error') error = message; },
    setCurrentModule(fn) { this.currentModule = fn(this.currentModule); } };
  const input = () => ({ target: { files: [{ arrayBuffer: async () => bytes }], value: 'x' } });
  global.window = { confirm: message => { preview = message; return false; } };
  await importModuleQuestions(input(), null, 'questions', () => ctx, false);
  assert.match(preview, /new copies with new IDs/);
  assert.strictEqual(ctx.currentModule, current);
  global.window.confirm = () => true;
  await importModuleQuestions(input(), null, 'questions', () => ctx, false);
  assert.equal(error, undefined);
  assert.equal(ctx.currentModule.questions.length, 2);
  assert.equal(ctx.currentModule.questions[0].id, 'existing');
  assert.notEqual(ctx.currentModule.questions[1].id, 'foreign');
});

test('Arabic TRUE_FALSE and MCQ import/export preserve Arabic options and answers', () => {
  const tfQuestion = {
    id: 'tf-ar-1',
    type: 'TRUE_FALSE',
    text: 'الشمس أكبر من الأرض',
    options: ['صحيح', 'خطأ'],
    optionsEn: ['True', 'False'],
    correctAnswer: 'صحيح',
    correctAnswerEn: 'True',
    points: 2,
  };
  const exportedRows = questionExportRows([tfQuestion], 'ar');
  const importedPlan = planQuestionImport(exportedRows, [tfQuestion], { canDelete: true, language: 'ar' });
  assert.equal(importedPlan.questions[0].correctAnswer, 'صحيح');
  assert.deepEqual(importedPlan.questions[0].options, ['صحيح', 'خطأ']);

  const addedRows = questionExportRows([tfQuestion], 'ar');
  addedRows[1][1] = 'ADD';
  const addedPlan = planQuestionImport(addedRows, [], { canDelete: true, language: 'ar' });
  assert.equal(addedPlan.questions[0].correctAnswer, 'صحيح');
  assert.deepEqual(addedPlan.questions[0].options, ['صحيح', 'خطأ']);

  const combinedArRows = [
    ['النوع', 'نص السؤال بالعربية', 'الخيارات بالعربية', 'الإجابة الصحيحة بالعربية', 'Options (En)', 'Correct Answer (En)'],
    ['MCQ', 'ما عاصمة الأردن؟', 'عمّان | إربد | العقبة', 'عمّان', '', ''],
    ['TRUE_FALSE', 'الأرض مسطحة', '', 'خطأ', 'True | False', 'False'],
  ];
  const combinedPlan = planQuestionImport(combinedArRows, [], { canDelete: true, language: 'ar' });
  assert.deepEqual(combinedPlan.questions[0].options, ['عمّان', 'إربد', 'العقبة']);
  assert.equal(combinedPlan.questions[0].correctAnswer, 'عمّان');
  assert.deepEqual(combinedPlan.questions[1].options, ['صحيح', 'خطأ']);
  assert.equal(combinedPlan.questions[1].correctAnswer, 'خطأ');
});

test('resolvePreferredQuestionLang and getTrueFalseDefaults honor Arabic content and UI language', () => {
  assert.equal(
    resolvePreferredQuestionLang({
      type: 'TRUE_FALSE',
      text: 'العدد $7$ أولي',
      options: ['صحيح', 'خطأ'],
      optionsEn: ['True', 'False'],
    }, 'en'),
    'ar'
  );
  assert.equal(
    resolvePreferredQuestionLang({
      type: 'MCQ',
      text: 'اختر الإجابة الصحيحة',
      textEn: 'Choose the right answer',
    }, 'ar'),
    'ar'
  );
  assert.equal(
    resolvePreferredQuestionLang({
      type: 'MCQ',
      text: 'اختر الإجابة الصحيحة',
      textEn: 'Choose the right answer',
    }, 'en'),
    'en'
  );
  assert.equal(
    resolvePreferredQuestionLang({
      type: 'MCQ',
      textEn: 'Solve $x + 1 = 3$',
      optionsEn: ['1', '2'],
    }, 'ar'),
    'en'
  );
  assert.equal(resolvePreferredQuestionLang({ type: 'MCQ', text: '' }, 'ar'), 'ar');
  assert.equal(resolvePreferredQuestionLang({ type: 'MCQ', text: '' }, 'en'), 'en');

  assert.deepEqual(getTrueFalseDefaults('ar'), {
    options: ['صحيح', 'خطأ'],
    correctAnswer: 'صحيح',
    optionsEn: ['True', 'False'],
    correctAnswerEn: 'True',
  });
  assert.deepEqual(getTrueFalseDefaults('en'), {
    options: ['True', 'False'],
    correctAnswer: 'True',
    optionsEn: ['True', 'False'],
    correctAnswerEn: 'True',
  });
});

test('excel import prioritizes exact option text over 1-based index/letter fallbacks', () => {
  const numRows = [
    ['Question Text (En)', 'Question Type', 'Option 1 (En)', 'Option 2 (En)', 'Option 3 (En)', 'Option 4 (En)', 'Correct Answer (En)'],
    ['What is 2 + 2?', 'MCQ', '4', '2', '6', '8', '4'],
  ];
  const numPlan = planQuestionImport(numRows, [], opts);
  assert.equal(numPlan.questions[0].correctAnswer, '4');
  assert.equal(numPlan.questions[0].correctAnswerEn, '4');
  assert.equal(numPlan.questions[0].correctAnswerIndex, 0);

  const exportedNum = questionExportRows(numPlan.questions, 'en');
  const reimportedNum = planQuestionImport(exportedNum, numPlan.questions, opts);
  assert.equal(reimportedNum.questions[0].correctAnswerEn, '4');

  const varRows = [
    ['Question Text (En)', 'Question Type', 'Option 1 (En)', 'Option 2 (En)', 'Option 3 (En)', 'Option 4 (En)', 'Correct Answer (En)'],
    ['Which variable is first?', 'MCQ', 'b', 'a', 'x', 'y', 'b'],
  ];
  const varPlan = planQuestionImport(varRows, [], opts);
  assert.equal(varPlan.questions[0].correctAnswer, 'b');
  assert.equal(varPlan.questions[0].correctAnswerEn, 'b');
  assert.equal(varPlan.questions[0].correctAnswerIndex, 0);

  const decRows = [
    ['Question Text (En)', 'Question Type', 'Option 1 (En)', 'Option 2 (En)', 'Option 3 (En)', 'Option 4 (En)', 'Correct Answer (En)'],
    ['Choose 1.5', 'MCQ', '1.5', '2.5', '3.5', '4.5', '1.5'],
  ];
  const decPlan = planQuestionImport(decRows, [], opts);
  assert.equal(decPlan.questions[0].correctAnswer, '1.5');
  assert.equal(decPlan.questions[0].correctAnswerIndex, 0);
});

test('negative numbers, decimals, and algebraic subtraction expressions are never stripped or confused with indices', () => {
  assert.equal(stripOptionPrefix('1.5'), '1.5');
  assert.equal(cleanOptionText('1.5'), '1.5');
  assert.equal(cleanOptionText('x - 2'), 'x - 2');
  assert.equal(cleanOptionText('a - b'), 'a - b');
  assert.equal(cleanOptionText('B) x - 2'), 'x - 2');

  const negQuestion = {
    type: 'MCQ',
    options: ['0', '1', '2', '-2'],
    correctAnswer: '-2',
  };
  assert.equal(isOptionMatch('-2', '2', 2), false);
  assert.equal(isOptionMatch('-2', '-2', 3), true);
  assert.equal(resolveSingleOptionIndexForValue('-2', ['0', '1', '2', '-2']), 3);
  assert.equal(isAnswerCorrect(negQuestion, '-2'), true);
  assert.equal(isAnswerCorrect(negQuestion, '2'), false);
});

test('Point Q / Point S collision repair and single-choice index resolution never highlight two options', () => {
  const collidedQuestion = {
    id: 'q-points',
    type: 'MCQ',
    text: 'ما النقطة (-3, 2)؟',
    textEn: 'Which point represents the ordered pair (-3, 2)?',
    options: ['النقطة ع', 'النقطة س', 'النقطة ر', 'النقطة س'],
    optionsEn: ['Point P', 'Point Q', 'Point R', 'Point S'],
    correctAnswer: 'النقطة س',
    explanationEn: 'Step 4: This location is point Q. Option D (Point S) is incorrect.',
  };

  assert.equal(resolveSingleCorrectOptionIndex(collidedQuestion, true), 1);

  const repaired = normalizePersistedExamQuestion(collidedQuestion);
  assert.equal(new Set(repaired.options).size, 4);
  assert.equal(repaired.correctAnswerIndex, 1);
  assert.equal(repaired.correctAnswerEn, 'Point Q');
  assert.equal(repaired.correctAnswer, repaired.options[1]);
  assert.equal(resolveSingleCorrectOptionIndex(repaired, true), 1);
  assert.equal(resolveSingleCorrectOptionIndex(repaired, false), 1);
});

test('bilingual courseEn and sectionEn metadata drafting and Excel update preserve English without leaking Arabic', () => {
  assert.deepEqual(
    buildInitialCourseSectionMeta({ title: 'Digital SAT', titleEn: '' }, { title: 'Mathematics', titleEn: '' }),
    { course: 'Digital SAT', courseEn: 'Digital SAT', section: 'Mathematics', sectionEn: 'Mathematics' }
  );
  assert.deepEqual(
    buildInitialCourseSectionMeta({ title: 'سات الرقمية', titleEn: 'Digital SAT' }, { title: 'الرياضيات', titleEn: '' }),
    { course: 'سات الرقمية', courseEn: 'Digital SAT', section: 'الرياضيات', sectionEn: '' }
  );

  const draft = populateBilingualQuestionDraft({
    type: 'MCQ',
    text: 'Find x',
    course: 'سات الرقمية',
    section: 'الرياضيات',
    domain: 'Algebra',
    options: ['x', 'y'],
    optionsEn: ['x', 'y'],
    correctAnswer: 'x',
  });
  assert.equal(draft.courseEn, undefined);
  assert.equal(draft.sectionEn, undefined);
  assert.equal(draft.domainEn, 'Algebra');
  assert.equal(draft.correctAnswerIndex, 0);

  const existing = {
    ...q('q-meta'),
    course: 'سات الرقمية',
    courseEn: 'Digital SAT',
    section: 'الرياضيات',
    sectionEn: 'Math',
  };
  const exportRows = questionExportRows([existing], 'en');
  exportRows[1][column(exportRows, 'Question Text (En)')] = 'Updated question en';
  const imported = planQuestionImport(exportRows, [existing], opts);
  assert.equal(imported.questions[0].course, 'سات الرقمية');
  assert.equal(imported.questions[0].courseEn, 'Digital SAT');
  assert.equal(imported.questions[0].section, 'الرياضيات');
  assert.equal(imported.questions[0].sectionEn, 'Math');
});
