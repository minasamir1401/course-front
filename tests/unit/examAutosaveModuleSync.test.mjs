import test from "node:test";
import assert from "node:assert/strict";

import { syncClientItemsWithServerIds } from "../../src/lib/examAutosaveModuleSync.ts";

test("preserves a missing module collection as an empty list during autosave sync", () => {
  const synced = syncClientItemsWithServerIds(undefined, [{ id: "server-item-1" }]);

  assert.deepEqual(synced, []);
});

test("keeps client content while applying returned server IDs", () => {
  const synced = syncClientItemsWithServerIds(
    [{ id: "draft-1", title: "Question draft" }],
    [{ id: "question-1" }],
  );

  assert.deepEqual(synced, [{ id: "question-1", title: "Question draft" }]);
});
