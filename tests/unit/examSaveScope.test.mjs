import test from "node:test";
import assert from "node:assert/strict";

import { buildExamSavePayload } from "../../src/lib/examSaveScope.ts";

test("child exam saves keep question updates but never submit the modules collection", () => {
  const payload = buildExamSavePayload({
    title: "Parent assessment",
    modules: [{ id: "module-1", subExams: [{ id: "child-1" }] }],
    questions: [{ id: "question-1", moduleId: "module-1", subExamId: "child-1" }],
  }, { moduleId: "module-1", subExamId: "child-1" });

  assert.deepEqual(payload.questions, [{ id: "question-1", moduleId: "module-1", subExamId: "child-1" }]);
  assert.equal("modules" in payload, false);
});

test("whole assessment saves continue to submit their modules collection", () => {
  const modules = [{ id: "module-1", subExams: [{ id: "child-1" }] }];
  const payload = buildExamSavePayload({ title: "Parent assessment", modules, questions: [] }, {});

  assert.deepEqual(payload.modules, modules);
});
