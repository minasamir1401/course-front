const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const XLSX = require('xlsx');
const { questionExportRows, questionTemplateRows, planQuestionImport } = require('../src/lib/questionExcelSync.ts');
const { buildQuestionWorkbook, readQuestionImport, importModuleQuestions } = require('../src/lib/questionExcelWorkbook.ts');
const q = (id = 'q1') => ({ id, text: '<b>5 + 5?</b>', type: 'MCQ', options: ['8', '10'],
  correctAnswer: '10', points: 1, skill: 'Algebra', explanation: 'Explanation', moduleId: 'm1', subExamId: 's1' });
const opts = { canDelete: true, language: 'en' };
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
test('school admin deletion fails atomically', () => {
  const rows = questionExportRows([q()], 'en'); rows[1][1] = 'DELETE';
  assert.throws(() => planQuestionImport(rows, [q()], { canDelete: false }), /Super Admin/);
  assert.throws(() => planQuestionImport([rows[0]], [q()], { canDelete: false, exportedIds: ['q1'] }), /Super Admin/);
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
  const rows = questionExportRows([q()], 'en'); rows[1][11] = -1;
  assert.throws(() => planQuestionImport(rows, [q()], opts), /Row 2/);
  rows[1][11] = 1; rows[1][9] = 'not an option';
  assert.throws(() => planQuestionImport(rows, [q()], opts), /Correct answer/);
});
test('multi select answers containing commas survive export', () => {
  const current = [{ ...q(), type: 'MULTI_SELECT', options: ['A, B', 'C'], correctAnswer: '["A, B","C"]' }];
  const plan = planQuestionImport(questionExportRows(current, 'en'), current, opts);
  assert.equal(plan.unchanged, 1);
});
test('empty explanation is an explicit clear; hidden fields remain', () => {
  const rows = questionExportRows([q()], 'en'); rows[1][13] = '';
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
  const rows = questionExportRows(current, 'en'); rows[1][3] = 'MCQ'; rows[1][9] = '10';
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
  const rows = questionExportRows(current, 'en'); rows[1][11] = 4;
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
