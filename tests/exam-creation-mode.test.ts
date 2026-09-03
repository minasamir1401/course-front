import assert from "node:assert/strict";
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { isModuleCreationMode } from "../src/lib/examCreationMode.ts";

assert.equal(isModuleCreationMode("SUPER_ADMIN", "/super-admin/exams/new", null), true);
assert.equal(isModuleCreationMode("SCHOOL_ADMIN", "/school-admin/exams/new", null), true);
assert.equal(isModuleCreationMode("SUPER_ADMIN", "/super-admin/exams/new", "exam"), false);
assert.equal(isModuleCreationMode("SCHOOL_ADMIN", "/school-admin/exams/new", "module"), true);

console.log("exam-creation-mode tests passed");
