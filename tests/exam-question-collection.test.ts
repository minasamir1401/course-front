import assert from "node:assert/strict";
import test from "node:test";

import { collectQuestionsIntoSubExam } from "../src/lib/examQuestionCollection.ts";

test("collectQuestionsIntoSubExam moves module and standalone questions without duplicates", () => {
  const result = collectQuestionsIntoSubExam({
    module: {
      id: "module-1",
      questions: [{ id: "module-question", text: "Module question" }],
      subExams: [{
        id: "sub-exam-1",
        questions: [{ id: "existing-question", text: "Already in exam" }],
      }],
    },
    subExamId: "sub-exam-1",
    standaloneQuestions: [
      { id: "standalone-question", text: "Standalone question" },
      { id: "existing-question", text: "Already in exam" },
    ],
  });

  assert.deepEqual(
    result.module.subExams[0].questions.map((question: any) => question.id),
    ["existing-question", "module-question", "standalone-question"],
  );
  assert.deepEqual(result.module.questions, []);
  assert.deepEqual(result.standaloneQuestions, []);
  assert.deepEqual(result.movedQuestionIds, ["module-question", "standalone-question"]);
});
