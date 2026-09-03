import assert from "node:assert/strict";
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { getModuleEditorTabs } from "../src/lib/moduleEditorTabs.ts";

assert.deepEqual(
  getModuleEditorTabs({ moduleMode: true, hasActiveSubExam: false, language: "ar" }).map((tab) => tab.id),
  ["info", "scheduling"],
);

assert.deepEqual(
  getModuleEditorTabs({ moduleMode: false, hasActiveSubExam: true, language: "ar" }).map((tab) => tab.id),
  ["exercises"],
);

assert.deepEqual(
  getModuleEditorTabs({ moduleMode: false, hasActiveSubExam: false, language: "en" }).map((tab) => tab.label),
  ["Module Info", "Scheduling & Visibility"],
);

assert.deepEqual(
  getModuleEditorTabs({ moduleMode: false, hasActiveSubExam: false, language: "ar" }).map((tab) => tab.label),
  ["معلومات الموديول", "الجدولة والظهور"],
);

console.log("module-editor-tabs tests passed");
