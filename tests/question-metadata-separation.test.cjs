const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.join(__dirname, '../src', name.slice(2)) : name, ...args); };
const XLSX = require('xlsx');
const { questionMetadataFields } = require('../src/lib/bilingualMetadata.ts');
const { questionExportRows, questionTemplateRows } = require('../src/lib/questionExcelSync.ts');
const { buildQuestionWorkbook, readQuestionImport } = require('../src/lib/questionExcelWorkbook.ts');
const { buildAdvancedMetadataTemplateRows } = require('../src/lib/examExcelTemplates.ts');
const { applyQuestionMetadataRows } = require('../src/lib/questionMetadataExcel.ts');
const { competitionWorkbook, competitionMetadataWorkbook, importCompetitionWorkbook, importCompetitionMetadata } = require('../src/components/competitions/competitionWorkbook.ts');
const fields = [...questionMetadataFields.flatMap(field => [field, field + 'En']), 'level', 'dok', 'cognitive', 'estimatedTime'];
const metadata = Object.fromEntries(fields.map(field => [field, field === 'dok' ? 'DOK 2' : 'value-' + field]));
const question = { id: 'question-1', type: 'MCQ', text: 'Question', textEn: 'Translation', options: ['A', 'B'], correctAnswer: 'B', points: 5, seconds: 45, ...metadata };
const roundtrip = book => XLSX.read(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }));

for (const language of ['ar', 'en']) {
  test(`question template and export exclude all metadata; editing preserves stored fields (${language})`, () => {
    assert.equal(questionTemplateRows(language)[0].length, 23);
    const rows = questionExportRows([question], language);
    assert.equal(rows[0].length, 23);
    for (const value of Object.values(metadata)) assert.equal(rows[1].includes(value), false);
    const book = roundtrip(buildQuestionWorkbook([question], language));
    assert.equal(book.Sheets.Metadata, undefined);
    book.Sheets.Questions.C2.v = 'Edited question';
    const plan = readQuestionImport(book, [question], false, language);
    assert.equal(plan.questions[0].text, 'Edited question');
    for (const field of fields) assert.equal(plan.questions[0][field], metadata[field]);
    const missingTranslations = { ...question, standardEn: '', learningOutcomeEn: 'An outcome only' };
    const partial = buildQuestionWorkbook([missingTranslations], language);
    partial.Sheets.Questions.C2.v = 'Edited with missing translation';
    assert.equal(readQuestionImport(partial, [missingTranslations], false, language).questions[0].standardEn, '');
  });

  test(`separate metadata template roundtrips all fields and matches reordered IDs (${language})`, () => {
    const second = { ...question, id: 'question-2', standard: 'Second standard', learningOutcome: 'Second outcome' };
    const rows = buildAdvancedMetadataTemplateRows(language, [second, question]);
    assert.equal(rows[0].length, 25);
    const result = applyQuestionMetadataRows(rows, [question, second]);
    for (const field of fields) assert.equal(result[0][field], metadata[field]);
    assert.equal(result[1].standard, 'Second standard');
    assert.equal(result[1].learningOutcome, 'Second outcome');
    assert.equal(result[0].text, question.text);
    assert.deepEqual(result[0].options, question.options);
    assert.equal(result[0].points, question.points);
    const blankOutcome = { ...question, learningOutcome: '', learningOutcomeEn: '' };
    assert.equal(applyQuestionMetadataRows(buildAdvancedMetadataTemplateRows(language, [blankOutcome]), [blankOutcome])[0].learningOutcome, '');
  });
}

test('competition question export separates taxonomy and retains hints, explanations and IDs', () => {
  const current = { ...question, metadata: { ...metadata, hint: 'Original hint' }, hint: 'Edited hint', explanation: 'Explanation', sections: [{ type: 'EXPLANATION', content: 'Explanation' }] };
  const book = roundtrip(competitionWorkbook([current], 'en'));
  const rows = XLSX.utils.sheet_to_json(book.Sheets.Questions, { header: 1 });
  assert.equal(rows[0].includes('Metadata JSON'), false);
  const contentIndex = rows[0].indexOf('Content JSON');
  const content = JSON.parse(rows[1][contentIndex]);
  assert.equal(content.hint, 'Edited hint');
  for (const field of fields) assert.equal(Object.hasOwn(content, field), false);
  const imported = importCompetitionWorkbook(book, [current], 'en')[0];
  for (const field of fields) assert.equal(imported[field], metadata[field]);
  assert.deepEqual(imported.metadata, current.metadata);
  assert.equal(imported.explanation, 'Explanation');
  assert.equal(imported.hint, 'Edited hint');
  assert.equal(imported.id, question.id);
  rows[1][0] = ''; rows[1][1] = 'ADD';
  const copy = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(copy, XLSX.utils.aoa_to_sheet(rows), 'Questions');
  const added = importCompetitionWorkbook(copy, [], 'en')[0];
  assert.equal(added.hint, 'Edited hint'); assert.equal(added.explanation, 'Explanation');
  assert.equal(added.domain, undefined);
});

test('competition metadata export keeps every taxonomy field separately from question content', () => {
  const current = { ...question, metadata: { ...metadata } };
  const book = roundtrip(competitionMetadataWorkbook([current], 'ar'));
  assert.deepEqual(book.SheetNames, ['Metadata']);
  const imported = importCompetitionMetadata(book, [current])[0];
  for (const field of fields) assert.equal(imported[field], metadata[field]);
  assert.equal(imported.text, current.text); assert.deepEqual(imported.options, current.options);
  assert.throws(() => importCompetitionMetadata(buildQuestionWorkbook([question], 'en'), [current]), /Invalid metadata headers/);
});
