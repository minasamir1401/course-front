const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const originalRequire = module.require.bind(module);
  module.require = name => originalRequire(name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name);
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const XLSX = require('xlsx');
const { readQuestionImport } = require('../src/lib/questionExcelWorkbook.ts');
for (const role of ['super-admin', 'school-admin']) {
  for (const page of ['new', 'edit/[id]']) {
    test(role + '/' + page + ': download and export produce importable workbooks', () => {
      const api = require('../src/app/' + role + '/exams/' + page + '/utils/examExcelUtils.ts');
      const original = XLSX.writeFile;
      const downloads = [];
      XLSX.writeFile = (wb, name) => downloads.push({ wb: XLSX.read(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })), name });
      try {
        for (const language of ['ar', 'en']) {
          for (const kind of ['questions', 'assignments']) {
            api.downloadQuestionsTemplate(kind, language, () => {});
            const { wb, name } = downloads.at(-1);
            assert.ok(wb.Sheets.Instructions);
            assert.ok(name.includes(kind === 'questions' ? 'questions' : 'assignments'));
            const plan = readQuestionImport(wb, [], false, language);
            assert.equal(plan.added, 4);
            assert.deepEqual(plan.questions.map(q => q.type), ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'TEXT']);
          }
        }
        const current = [{ id: 'persisted-id', text: 'Question?', type: 'MCQ', options: ['A', 'B'], correctAnswer: 'B', points: 1 }];
        api.exportQuestionsToExcel(current, 'edit.xlsx', 'ar', () => {});
        const { wb } = downloads.at(-1);
        assert.ok(wb.Sheets['Sync IDs']);
        assert.equal(readQuestionImport(wb, current, true, 'ar').unchanged, 1);
      } finally { XLSX.writeFile = original; }
    });
  }
}
