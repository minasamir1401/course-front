import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { normalizeQuestionOptions } from '../src/lib/questionOptions.ts';

assert.deepEqual(
  normalizeQuestionOptions('["Mouth", "Stomach", "Intestine"]'),
  ['Mouth', 'Stomach', 'Intestine'],
);

assert.deepEqual(
  normalizeQuestionOptions({ 0: 'Mouth', 1: 'Stomach' }),
  ['Mouth', 'Stomach'],
);

assert.deepEqual(
  normalizeQuestionOptions(null),
  ['', '', '', ''],
);

assert.deepEqual(
  normalizeQuestionOptions('not-json'),
  ['', '', '', ''],
);
