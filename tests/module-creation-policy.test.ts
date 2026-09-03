import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { canCreateModule } from '../src/lib/moduleCreationPolicy.ts';

assert.equal(canCreateModule([]), true);
assert.equal(canCreateModule([{ id: 'module-1' }]), false);
assert.equal(canCreateModule(null), true);
