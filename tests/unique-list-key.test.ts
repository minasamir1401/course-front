import assert from 'node:assert/strict';
import { getUniqueListKey } from '../src/lib/uniqueListKey.ts';

const seen = new Map<string, number>();
assert.equal(getUniqueListKey('1787344213993.1638', 0, seen), '1787344213993.1638');
assert.equal(getUniqueListKey('1787344213993.1638', 1, seen), '1787344213993.1638-1');
assert.equal(getUniqueListKey(undefined, 2, seen), 'row-2');
