import assert from 'node:assert/strict';
import { getCreatorLabel, getExamAudienceLabel, getCreatedAtLabel, getUpdatedAtLabel } from '../src/lib/examModulePresentation.ts';

assert.equal(
  getExamAudienceLabel({ isCentral: false, schools: [{ name: 'مدرسة النيل' }, { name: 'مدرسة المستقبل' }] }, 'ar'),
  'مدرسة النيل، مدرسة المستقبل',
);

assert.equal(
  getExamAudienceLabel({ isCentral: true }, 'en'),
  'Central',
);

assert.match(getCreatedAtLabel('2026-08-27T09:48:00.000Z', 'en'), /^Created: .+$/);
assert.match(getUpdatedAtLabel('2026-08-27T09:48:00.000Z', 'en'), /^Last updated: .+$/);
assert.equal(getCreatorLabel('Mina', 'en'), 'Created by: Mina');
assert.equal(getCreatorLabel('', 'ar'), 'أنشأه: غير مسجل');

console.log('exam-module-presentation tests passed');
