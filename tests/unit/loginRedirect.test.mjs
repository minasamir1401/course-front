import test from 'node:test';
import assert from 'node:assert/strict';
import { safeLoginNext } from '../../src/lib/loginRedirect.ts';

test('login next keeps internal destinations and canonicalizes dot segments', () => {
  assert.equal(safeLoginNext('/dashboard?tab=results#latest', 'https://app.example.test'), '/dashboard?tab=results#latest');
  assert.equal(safeLoginNext('/courses/../dashboard', 'https://app.example.test'), '/dashboard');
});
test('login next rejects external URLs, backslashes, controls, and normalized network paths', () => {
  for (const value of [null, '', 'https://evil.test', '//evil.test', '/\\evil.test', '/\n/evil.test', '/\t/evil.test', '/foo/..//evil.test', 'javascript:alert(1)', '/dashboard\r']) {
    assert.equal(safeLoginNext(value, 'https://app.example.test'), null, String(value));
  }
});
