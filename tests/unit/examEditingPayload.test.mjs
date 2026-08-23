import test from "node:test";
import assert from "node:assert/strict";

import { buildExamSubmissionPayload } from "../../src/lib/examEditingPayload.ts";

test("buildExamSubmissionPayload keeps standalone questions in the final payload", () => {
  const result = buildExamSubmissionPayload({
    modules: [
      {
        id: "module-1",
        title: "Module 1",
        questions: [{ id: "module-question", text: "Inside module" }],
        subExams: [],
      },
    ],
    standaloneQuestions: [{ id: "standalone-question", text: "Standalone question" }],
  });

  assert.equal(result.modulesPayload.length, 1);
  assert.equal(result.allQuestions.length, 2);

  const standaloneQuestion = result.allQuestions.find((question) => question.id === "standalone-question");
  assert.ok(standaloneQuestion);
  assert.equal(standaloneQuestion.moduleId, null);
  assert.equal(standaloneQuestion.subExamId, null);
});
