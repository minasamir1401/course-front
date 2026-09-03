import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { buildDraftModules } from '../src/lib/examEditingPayload.ts';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import {
  buildAdvancedMetadataTemplateRows,
  buildQuestionTemplateRows,
} from '../src/lib/examExcelTemplates.ts';

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
assert.deepEqual(questionTemplateHeaders, [
  'Question Text',
  'Question Type',
  'Option 1',
  'Option 2',
  'Option 3',
  'Option 4',
  'Option 5',
  'Correct Answer',
  'Correct Answers',
  'Points',
  'Video URL',
  'Explanation',
]);

const advancedMetadataHeaders = buildAdvancedMetadataTemplateRows('en', [])[0];
assert.equal(advancedMetadataHeaders.includes('Question Text'), false);
assert.equal(advancedMetadataHeaders.includes('Question ID'), true);
