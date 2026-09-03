import assert from "node:assert/strict";
import test from "node:test";

import { getQuestionCollectionTargets, getStandaloneQuestionCollectionTargets } from "../src/lib/examQuestionCollection.ts";

test("getQuestionCollectionTargets exposes every child exam as a collection target", () => {
  assert.deepEqual(getQuestionCollectionTargets({
    subExams: [
      { id: "exam-1", title: "اختبار أول" },
      { id: "exam-2", title: "اختبار ثانٍ" },
    ],
  }), [
    { id: "exam-1", title: "اختبار أول" },
    { id: "exam-2", title: "اختبار ثانٍ" },
  ]);
});

test("getStandaloneQuestionCollectionTargets lists child exams from every module", () => {
  assert.deepEqual(getStandaloneQuestionCollectionTargets([
    { id: "module-1", title: "الموديول الأول", subExams: [{ id: "exam-1", title: "اختبار أول" }] },
    { id: "module-2", title: "الموديول الثاني", subExams: [{ id: "exam-2", title: "اختبار ثانٍ" }] },
  ]), [
    { moduleId: "module-1", moduleTitle: "الموديول الأول", id: "exam-1", title: "اختبار أول" },
    { moduleId: "module-2", moduleTitle: "الموديول الثاني", id: "exam-2", title: "اختبار ثانٍ" },
  ]);
});
