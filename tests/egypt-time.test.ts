import assert from 'node:assert/strict';
import test from 'node:test';
import { formatEgyptDateTime, parseEgyptDate, toEgyptInput } from '../src/lib/egyptTime.ts';
test('Cairo display and datetime-local round trip preserve the original instant', () => {
  const date = '2026-10-15T22:30:00Z';
  assert.equal(toEgyptInput(date), '2026-10-16T01:30');
  assert.equal(parseEgyptDate(toEgyptInput(date)).toISOString(), '2026-10-15T22:30:00.000Z');
  assert.match(formatEgyptDateTime(date, 'en'), /16 Oct 2026/);
  assert.equal(formatEgyptDateTime(null), '—');
});
