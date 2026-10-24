const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const XLSX = require('xlsx');
const { buildQuestionWorkbook, readQuestionImport } = require('../src/lib/questionExcelWorkbook.ts');
const { questionExportRows, planQuestionImport, syncHeaders } = require('../src/lib/questionExcelSync.ts');
const { normalizePersistedExamQuestion } = require('../src/lib/persistedExamQuestion.ts');
const question = { id: 'q1', text: 'السؤال', textEn: 'Question', type: 'MCQ', options: ['أ', 'ب'], optionsEn: ['A', 'B'], correctAnswer: 'أ', correctAnswerEn: 'A', points: 2,
  hint: '<b>تلميح عربي</b>', hintEn: '<i>English hint</i>', explanation: '<p>شرح عربي</p>', explanationEn: '<p>English explanation</p>', skill: 'مهارة محفوظة' };
const options = { canDelete: false, language: 'en' };
for (const language of ['ar', 'en']) test(`real workbook roundtrip preserves both hints and connects English explanation to its editor section (${language})`, () => {
  const workbook = XLSX.read(XLSX.write(buildQuestionWorkbook([question], language), { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' });
  const result = readQuestionImport(workbook, [], false, language, true).questions[0];
  assert.equal(result.hint, question.hint); assert.equal(result.hintEn, question.hintEn);
  assert.equal(result.sections[0].content, question.explanation);
  assert.equal(result.sections[0].contentEn, question.explanationEn);
  assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets.Questions, { header: 1 })[0].length, 25);
});
test('editing only the English explanation updates its section without replacing the Arabic explanation', () => {
  const current = { ...question, sections: [{ id: 'section', type: 'EXPLANATION', content: question.explanation, contentEn: 'Old English', style: 'custom' }] };
  const rows = questionExportRows([current], 'en');
  rows[1][syncHeaders.indexOf('Explanation (En)')] = '<h2>Updated English</h2>';
  const result = planQuestionImport(rows, [current], options).questions[0];
  assert.equal(result.sections[0].contentEn, '<h2>Updated English</h2>');
  assert.equal(result.sections[0].content, question.explanation);
  assert.equal(result.sections[0].style, 'custom');
  assert.equal(result.skill, question.skill);
});
test('blank bilingual hint cells clear hints, while an old workbook without them preserves stored hints', () => {
  const rows = questionExportRows([question], 'en');
  rows[1][23] = ''; rows[1][24] = '';
  const cleared = planQuestionImport(rows, [question], options).questions[0];
  assert.equal(cleared.hint, ''); assert.equal(cleared.hintEn, '');
  const legacy = rows.map(row => row.slice(0, 23));
  const unchanged = planQuestionImport(legacy, [question], options).questions[0];
  assert.equal(unchanged.hint, question.hint); assert.equal(unchanged.hintEn, question.hintEn);
});
test('clearing the English explanation removes stale section English while preserving Arabic', () => {
  const current = { ...question, sections: [{ content: question.explanation, contentEn: question.explanationEn }] };
  const rows = questionExportRows([current], 'en'); rows[1][22] = '';
  const result = planQuestionImport(rows, [current], options).questions[0];
  assert.equal(result.sections[0].contentEn, '');
  assert.equal(result.sections[0].content, question.explanation);
});

test('section-only English is exported and can be explicitly cleared from the workbook', () => {
  const current = { ...question, explanationEn: null, sections: [{ content: question.explanation, contentEn: 'Section English' }] };
  const rows = questionExportRows([current], 'en');
  assert.match(rows[1][22], /Section English/);
  rows[1][22] = '';
  const result = planQuestionImport(rows, [current], options).questions[0];
  assert.equal(result.sections[0].contentEn, '');
  assert.equal(result.sections[0].content, question.explanation);
});
test('previously saved rows with separate English explanation are repaired on read without replacing reviewed section text', () => {
  const result = normalizePersistedExamQuestion({ ...question, sections: [{ id: 's', content: 'شرح معتمد', contentEn: '' }] });
  assert.equal(result.sections[0].content, 'شرح معتمد');
  assert.equal(result.sections[0].contentEn, question.explanationEn);
  const reviewed = normalizePersistedExamQuestion({ ...question, sections: [{ content: 'شرح', contentEn: 'Reviewed translation' }] });
  assert.equal(reviewed.sections[0].contentEn, 'Reviewed translation');
});
test('English-only explanations and full English column labels are supported', () => {
  const rows = [['Question Text (English)', 'Question Type', 'Explanation (English)', 'Hint (English)'], ['Explain', 'TEXT', 'English-only explanation', 'English-only hint']];
  const result = planQuestionImport(rows, [], options).questions[0];
  assert.equal(result.sections[0].contentEn, 'English-only explanation');
  assert.equal(result.hintEn, 'English-only hint');
});
