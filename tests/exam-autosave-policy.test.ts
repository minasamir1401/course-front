import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { canRunExamAutosave } from '../src/lib/examAutosavePolicy.ts';

assert.equal(
  canRunExamAutosave({
    isAutoSaveEnabled: true,
    isLoading: false,
    isInitialLoad: false,
    isManualSubmit: false,
    activeExamId: '',
    allowCreateWithoutId: false,
  }),
  false,
);

assert.equal(
  canRunExamAutosave({
    isAutoSaveEnabled: true,
    isLoading: false,
    isInitialLoad: false,
    isManualSubmit: false,
    activeExamId: 'exam-1',
    allowCreateWithoutId: false,
  }),
  true,
);

assert.equal(
  canRunExamAutosave({
    isAutoSaveEnabled: true,
    isLoading: false,
    isInitialLoad: true,
    isManualSubmit: false,
    activeExamId: 'exam-1',
    allowCreateWithoutId: false,
  }),
  false,
);

assert.equal(
  canRunExamAutosave({
    isAutoSaveEnabled: true,
    isLoading: false,
    isInitialLoad: false,
    isManualSubmit: true,
    activeExamId: 'exam-1',
    allowCreateWithoutId: false,
  }),
  false,
);
