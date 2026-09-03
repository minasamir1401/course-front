import test from "node:test";
import assert from "node:assert/strict";

import {
  getModuleQuestionCardCounts,
  getModuleScopedQuestionsCount,
  getStandaloneQuestionsCount,
} from "../../src/lib/standaloneQuestionCount.ts";

test("counts direct module questions and child exam questions without double counting aggregated module totals", () => {
  const count = getModuleScopedQuestionsCount({
    questionsCount: 10,
    _count: { questions: 2 },
    subExams: [
      { questionsCount: 4 },
      { questionsCount: 6 },
    ],
  });

  assert.equal(count, 12);
});

test("derives standalone questions from exam total after subtracting module-owned questions once", () => {
  const count = getStandaloneQuestionsCount({
    _count: { questions: 14 },
    modules: [
      {
        questionsCount: 10,
        _count: { questions: 2 },
        subExams: [
          { questionsCount: 4 },
          { questionsCount: 6 },
        ],
      },
    ],
  });

  assert.equal(count, 2);
});

test("keeps module and unassigned question counts distinct on a module card", () => {
  assert.deepEqual(
    getModuleQuestionCardCounts(0, 10),
    { moduleQuestions: 0, standaloneQuestions: 10 },
  );
});
