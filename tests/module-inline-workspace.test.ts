import assert from "node:assert/strict";
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { createModuleDraft, upsertModuleDraft } from "../src/lib/moduleInlineWorkspace.ts";

const draft = createModuleDraft("ar");
assert.equal(draft.title, "");
assert.equal(draft.isVisible, true);
assert.equal(draft.slides.length, 1);

const firstModule = { ...draft, title: "Mechanics" };
assert.deepEqual(upsertModuleDraft([], firstModule, null), [firstModule]);

const updatedModule = { ...firstModule, title: "Advanced Mechanics" };
assert.deepEqual(
  upsertModuleDraft([firstModule], updatedModule, 0),
  [updatedModule],
);

console.log("module-inline-workspace tests passed");
