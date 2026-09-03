import assert from 'node:assert/strict';
import { findSelectedSubExamLocation } from '../src/lib/selectedSubExam.ts';

const modules = [
  {
    id: 'module-1',
    subExams: [{ id: 101 }, { id: '102' }],
  },
  {
    id: 'module-2',
    subExams: [{ id: '201' }],
  },
];

assert.deepEqual(findSelectedSubExamLocation(modules, '101'), {
  moduleIndex: 0,
  subExamIndex: 0,
});

assert.deepEqual(findSelectedSubExamLocation(modules, 102), {
  moduleIndex: 0,
  subExamIndex: 1,
});

assert.deepEqual(findSelectedSubExamLocation(modules, '201'), {
  moduleIndex: 1,
  subExamIndex: 0,
});

assert.equal(findSelectedSubExamLocation(modules, '999'), null);
assert.equal(findSelectedSubExamLocation([], '101'), null);
