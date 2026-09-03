import test from "node:test";
import assert from "node:assert/strict";

import { attachQuestionsToModules } from "../../src/lib/examModuleQuestions.ts";

test("attaches returned questions to their matching child exam", () => {
  const modules = [
    {
      id: "module-1",
      questions: [],
      subExams: [{ id: "sub-exam-1", questions: [] }],
    },
  ];
  const questions = [
    { id: "question-1", moduleId: "module-1", subExamId: "sub-exam-1" },
    { id: "question-2", moduleId: "module-1", subExamId: "sub-exam-1" },
  ];

  const hydrated = attachQuestionsToModules(modules, questions);

  assert.equal(hydrated[0].questions.length, 0);
  assert.deepEqual(
    hydrated[0].subExams[0].questions.map((question) => question.id),
    ["question-1", "question-2"],
  );
});

test("keeps direct module questions separate from child exam questions", () => {
  const modules = [{ id: "module-1", subExams: [{ id: "sub-exam-1" }] }];
  const questions = [
    { id: "module-question", moduleId: "module-1", subExamId: null },
    { id: "sub-exam-question", moduleId: "module-1", subExamId: "sub-exam-1" },
  ];

  const hydrated = attachQuestionsToModules(modules, questions);

  assert.deepEqual(hydrated[0].questions.map((question) => question.id), ["module-question"]);
  assert.deepEqual(hydrated[0].subExams[0].questions.map((question) => question.id), ["sub-exam-question"]);
});
