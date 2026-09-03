import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { resolveEditModuleAutoOpenIndex } from '../src/lib/editModuleAutopen.ts';

const modules = [
  { id: 'module-1', title: 'Grammar' },
  { id: 'module-2', title: 'Reading' },
];

assert.equal(
  resolveEditModuleAutoOpenIndex({
    workflowView: 'full-editor',
    editModuleId: 'module-2',
    handledEditModuleId: null,
    modules,
  }),
  null,
);

assert.equal(
  resolveEditModuleAutoOpenIndex({
    workflowView: 'full-editor',
    editModuleId: 'module-2',
    handledEditModuleId: 'module-2',
    modules,
  }),
  null,
);

assert.equal(
  resolveEditModuleAutoOpenIndex({
    workflowView: 'module-portal',
    editModuleId: 'module-2',
    handledEditModuleId: null,
    modules,
  }),
  null,
);

assert.equal(
  resolveEditModuleAutoOpenIndex({
    workflowView: 'full-editor',
    editModuleId: 'missing-module',
    handledEditModuleId: null,
    modules,
  }),
  null,
);

assert.equal(
  resolveEditModuleAutoOpenIndex({
    workflowView: 'full-editor',
    editModuleId: 'stale-local-id',
    handledEditModuleId: null,
    modules: [{ id: 'server-module-1', title: 'Only Module' }],
  }),
  null,
);
