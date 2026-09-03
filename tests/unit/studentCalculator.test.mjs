import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateCalculatorExpression,
  formatCalculatorValue,
} from "../../src/lib/studentCalculator.ts";

test("calculator handles arithmetic precedence and parentheses", () => {
  assert.equal(evaluateCalculatorExpression("2 + 3 * 4"), 14);
  assert.equal(evaluateCalculatorExpression("(2 + 3) * 4"), 20);
});

test("calculator supports scientific functions and constants", () => {
  assert.equal(evaluateCalculatorExpression("sqrt(81) + 2^3"), 17);
  assert.equal(evaluateCalculatorExpression("sin(pi / 2)", { angleMode: "RAD" }), 1);
  assert.equal(evaluateCalculatorExpression("cos(60)", { angleMode: "DEG" }), 0.5);
});

test("calculator supports percent and absolute value", () => {
  assert.equal(evaluateCalculatorExpression("200 * 15%"), 30);
  assert.equal(evaluateCalculatorExpression("abs(-9) + 50%"), 9.5);
});

test("calculator formats floating-point results cleanly", () => {
  assert.equal(formatCalculatorValue(0.30000000000000004), "0.3");
});

test("calculator rejects unsafe or malformed expressions", () => {
  assert.throws(() => evaluateCalculatorExpression("alert(1)"));
  assert.throws(() => evaluateCalculatorExpression("2 +"));
});
