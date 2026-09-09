import test from 'node:test';
import assert from 'node:assert/strict';
import { remainingExamSeconds } from '../../src/lib/examTimer.ts';
test('countdown uses elapsed time even when a browser tab pauses its timers', () => {
  assert.equal(remainingExamSeconds(10000, 1000), 9);
  assert.equal(remainingExamSeconds(10000, 8500), 2);
  assert.equal(remainingExamSeconds(10000, 15000), 0);
});
