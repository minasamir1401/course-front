import test from "node:test";
import assert from "node:assert/strict";

import { getExamSessionToken } from "../../src/lib/examSession.ts";

const buildStorage = (values) => ({
  getItem(key) {
    return key in values ? values[key] : null;
  },
});

test("preview result requests prefer admin tokens over an active student token", () => {
  const token = getExamSessionToken(
    buildStorage({
      lms_token: "student-token",
      school_admin_token: "school-token",
    }),
    { preferAdmin: true },
  );

  assert.equal(token, "school-token");
});

test("student result requests still prefer the student token by default", () => {
  const token = getExamSessionToken(
    buildStorage({
      lms_token: "student-token",
      super_admin_token: "super-token",
    }),
  );

  assert.equal(token, "student-token");
});
