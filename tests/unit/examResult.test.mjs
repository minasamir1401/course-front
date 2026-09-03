import test from "node:test";
import assert from "node:assert/strict";

import { getSubmissionTotalPoints } from "../../src/lib/examResult.ts";

test("getSubmissionTotalPoints falls back to answered question points when the admin payload omits exam.totalPoints", () => {
  const total = getSubmissionTotalPoints({
    exam: {},
    answers: [
      { question: { points: 1 } },
      { question: { points: 1 } },
      { question: { points: 1 } },
      { question: { points: 1 } },
    ],
  });

  assert.equal(total, 4);
});

test("getSubmissionTotalPoints prefers the scoped total returned by the API", () => {
  const total = getSubmissionTotalPoints({
    exam: { totalPoints: 6 },
    answers: [{ question: { points: 1 } }],
  });

  assert.equal(total, 6);
});
