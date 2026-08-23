import assert from 'node:assert/strict';
import {
  selectEditableModule,
  selectEditableSubExamIndex,
} from '../src/lib/examEditorSelection.ts';

const currentModule = { id: 'module-1', subExams: [{ id: 'sub-1', attemptsAllowed: 3 }] };
const resolvedModule = { id: 'module-1', subExams: [{ id: 'sub-1', attemptsAllowed: 1 }] };

assert.equal(selectEditableModule('module-1', resolvedModule, currentModule), currentModule);
assert.equal(selectEditableModule('module-2', resolvedModule, currentModule), resolvedModule);
assert.equal(selectEditableSubExamIndex(2, 0), 2);
assert.equal(selectEditableSubExamIndex(-1, 0), 0);
assert.equal(selectEditableSubExamIndex(-1, null), -1);
