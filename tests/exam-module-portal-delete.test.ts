import assert from 'node:assert/strict';

const normalizeId = (value: unknown) => String(value ?? '');

const removeSubExam = (modules: any[], moduleId: string | number, subExamId: string | number) =>
  modules.map((module) =>
    normalizeId(module.id) === normalizeId(moduleId)
      ? {
          ...module,
          subExams: (module.subExams || []).filter(
            (subExam: any) => normalizeId(subExam.id) !== normalizeId(subExamId),
          ),
        }
      : module,
  );

assert.deepEqual(
  removeSubExam(
    [
      {
        id: 10,
        subExams: [{ id: 1, title: 'A' }, { id: '2', title: 'B' }],
      },
    ],
    '10',
    '1',
  )[0].subExams,
  [{ id: '2', title: 'B' }],
);

assert.deepEqual(
  removeSubExam(
    [
      {
        id: '10',
        subExams: [{ id: 1, title: 'A' }, { id: '2', title: 'B' }],
      },
    ],
    10,
    2,
  )[0].subExams,
  [{ id: 1, title: 'A' }],
);
