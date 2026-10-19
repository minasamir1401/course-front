import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { buildDraftModules } from '../src/lib/examEditingPayload.ts';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const ts = require('typescript');
require.extensions['.ts'] = (module: any, filename: string) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { buildAdvancedMetadataTemplateRows, buildQuestionTemplateRows } = require('../src/lib/examExcelTemplates.ts');
const { questionTemplateRows, syncHeaders } = require('../src/lib/questionExcelSync.ts');

const persistedModule = {
  id: 'module-1',
  title: 'Grammar',
  questions: [],
  subExams: [
    {
      id: 'sub-1',
      title: 'Draft 1',
      questions: [],
    },
  ],
};

const editedCurrentModule = {
  ...persistedModule,
  subExams: [
    {
      id: 'sub-1',
      title: 'Draft 1',
      questions: [
        { id: 'q-1', text: 'Question 1' },
        { id: 'q-2', text: 'Question 2' },
        { id: 'q-3', text: 'Question 3' },
      ],
    },
  ],
};

const mergedModules = buildDraftModules({
  modules: [persistedModule],
  currentModule: editedCurrentModule,
  editingModuleIndex: 0,
  isModuleModalOpen: false,
});

assert.equal(mergedModules[0].subExams[0].questions.length, 3);

const questionTemplateHeaders = buildQuestionTemplateRows('questions', 'en')[0];
assert.deepEqual(questionTemplateHeaders, questionTemplateRows('en')[0]);
assert.deepEqual(questionTemplateHeaders, syncHeaders);

const advancedMetadataHeaders = buildAdvancedMetadataTemplateRows('en', [])[0];
assert.equal(advancedMetadataHeaders.includes('Question Text'), false);
assert.equal(advancedMetadataHeaders.includes('Question ID'), true);
