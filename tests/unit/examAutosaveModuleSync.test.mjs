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
    [{ id: "question-1", title: "Question draft" }],
  );

  assert.deepEqual(synced, [{ id: "question-1", title: "Question draft" }]);
});

test("does not overwrite item with index fallback when texts conflict", () => {
  const client = [{ title: "First question" }, { title: "Second question" }];
  const server = [{ id: "s1", title: "Different question 1" }, { id: "s2", title: "Different question 2" }];
  const synced = syncClientItemsWithServerIds(client, server);

  // Both should retain their original object and not steal conflicting IDs
  assert.equal(synced[0].id, undefined);
  assert.equal(synced[1].id, undefined);
});

test("matches exact IDs first regardless of client/server ordering", () => {
  const client = [{ id: "temp-new", title: "Brand new" }, { id: "real-2", title: "Existing" }];
  const server = [{ id: "real-2", title: "Existing" }, { id: "real-new", title: "Brand new" }];
  const synced = syncClientItemsWithServerIds(client, server);

  assert.equal(synced[0].id, "real-new");
  assert.equal(synced[1].id, "real-2");
});

