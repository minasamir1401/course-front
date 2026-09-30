import test from "node:test";
import assert from "node:assert/strict";

import { syncClientItemsWithServerIds } from "../../src/lib/examAutosaveModuleSync.ts";
import {
  buildExamSubmissionPayload,
  deduplicateSubmissionQuestions,
  pruneDuplicateStandaloneQuestions,
} from "../../src/lib/examEditingPayload.ts";

test("نفس السؤال في موديولين: preserves identical question in two distinct modules", () => {
  const moduleA = {
    id: "module-alpha-123456789012345678",
    title: "Module Alpha",
    questions: [
      {
        id: "temp-q-a",
        text: "ما هي عاصمة مصر؟",
        options: ["القاهرة", "الإسكندرية", "أسوان"],
      },
    ],
    subExams: [],
  };

  const moduleB = {
    id: "module-beta-1234567890123456789",
    title: "Module Beta",
    questions: [
      {
        id: "temp-q-b",
        text: "ما هي عاصمة مصر؟",
        options: ["القاهرة", "الإسكندرية", "أسوان"],
      },
    ],
    subExams: [],
  };

  const result = buildExamSubmissionPayload({
    modules: [moduleA, moduleB],
    standaloneQuestions: [],
  });

  assert.equal(result.modulesPayload.length, 2);
  // Both questions must be kept because they belong to different modules
  assert.equal(result.allQuestions.length, 2);
  assert.equal(result.allQuestions[0].text, "ما هي عاصمة مصر؟");
  assert.equal(result.allQuestions[1].text, "ما هي عاصمة مصر؟");
  assert.equal(result.allQuestions[0].moduleId, moduleA.id);
  assert.equal(result.allQuestions[1].moduleId, moduleB.id);
});

test("سؤال مشال من الـpayload قبل سؤال محفوظ: prevents index fallback from stealing saved question ID", () => {
  const persistedId = "cuid-saved-question-99999999999999999";
  
  // Client state: Question A (removed from payload) sits at index 0, saved Question B sits at index 1
  const clientItems = [
    {
      id: "temp-removed-question",
      text: "سؤال غير محفوظ تم استبعاده من الحفظ",
      options: ["أ", "ب"],
    },
    {
      id: persistedId,
      text: "سؤال محفوظ أصلي في قاعدة البيانات",
      options: ["1", "2"],
    },
  ];

  // Server response only contains the saved question at index 0
  const serverItems = [
    {
      id: persistedId,
      text: "سؤال محفوظ أصلي في قاعدة البيانات",
      options: ["1", "2"],
    },
  ];

  const synced = syncClientItemsWithServerIds(clientItems, serverItems);

  // Question A at index 0 must NOT receive the persisted ID via index fallback
  assert.notEqual(
    synced[0].id,
    persistedId,
    "Unsaved client question must never take the server ID of a saved question via index fallback",
  );
  assert.equal(synced[0].id, "temp-removed-question");

  // Question B at index 1 must keep its correct persisted ID
  assert.equal(synced[1].id, persistedId);

  // When submitting payload, Question B retains its identity and text
  const deduped = deduplicateSubmissionQuestions(synced);
  const savedQuestionInPayload = deduped.find((q) => q.id === persistedId);
  assert.ok(savedQuestionInPayload, "Saved question must be present in payload");
  assert.equal(
    savedQuestionInPayload.text,
    "سؤال محفوظ أصلي في قاعدة البيانات",
    "Saved question text must never be overwritten by the unsaved question",
  );
});

test("standalone vs module: prunes duplicate standalone copy when already present in a module", () => {
  const moduleQ = {
    id: "cuid-mod-question-0000000000000001",
    text: "سؤال مشترك بين الموديول والأسئلة المستقلة",
    options: ["نعم", "لا"],
  };

  const standaloneQ = {
    id: "temp-standalone-dup",
    text: "سؤال مشترك بين الموديول والأسئلة المستقلة",
    options: ["نعم", "لا"],
  };

  const moduleItem = {
    id: "module-gamma-123456789012345678",
    title: "Module Gamma",
    questions: [moduleQ],
    subExams: [],
  };

  const payload = buildExamSubmissionPayload({
    modules: [moduleItem],
    standaloneQuestions: [standaloneQ],
  });

  // The standalone duplicate copy is pruned from standalone questions
  assert.equal(payload.cleanedStandaloneQuestions.length, 0);
  // The module copy is retained
  assert.equal(payload.allQuestions.length, 1);
  assert.equal(payload.allQuestions[0].id, moduleQ.id);
});

test("text + options matching correctly disambiguates questions with same text but different options", () => {
  const clientItems = [
    { text: "سؤال حسابي", options: ["10", "20"] },
    { text: "سؤال حسابي", options: ["30", "40"] },
  ];

  const serverItems = [
    { id: "cuid-server-item-options-3040000000", text: "سؤال حسابي", options: ["30", "40"] },
    { id: "cuid-server-item-options-1020000000", text: "سؤال حسابي", options: ["10", "20"] },
  ];

  const synced = syncClientItemsWithServerIds(clientItems, serverItems);

  assert.equal(synced[0].id, "cuid-server-item-options-1020000000");
  assert.equal(synced[1].id, "cuid-server-item-options-3040000000");
});
