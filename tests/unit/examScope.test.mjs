import test from "node:test";
import assert from "node:assert/strict";

import { resolveExamEditScope } from "../../src/lib/examScope.ts";

test("resolveExamEditScope keeps school-scoped exams out of central mode when the API returns schools instead of schoolIds", () => {
  const scope = resolveExamEditScope({
    isCentral: false,
    schoolId: "school-a",
    schools: [{ id: "school-a" }],
  });

  assert.equal(scope.isCentral, false);
  assert.deepEqual(scope.schoolIds, ["school-a"]);
});

test("resolveExamEditScope keeps central exams without attached schools", () => {
  const scope = resolveExamEditScope({
    isCentral: true,
    schools: [{ id: "school-a" }],
  });

  assert.equal(scope.isCentral, true);
  assert.deepEqual(scope.schoolIds, []);
});
