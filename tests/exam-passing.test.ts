import assert from "node:assert/strict";
import test from "node:test";

import { hasPassedExam } from "../src/lib/examPassing.ts";

test("hasPassedExam rejects one correct answer out of ten even when points reach the passing score", () => {
  assert.equal(hasPassedExam({
    percentage: 60,
    passingScore: 50,
    correctAnswers: 1,
    totalQuestions: 10,
  }), false);
});

test("hasPassedExam accepts five correct answers out of nine when the passing score is met", () => {
  assert.equal(hasPassedExam({
    percentage: 60,
    passingScore: 50,
    correctAnswers: 5,
    totalQuestions: 9,
  }), true);
});
