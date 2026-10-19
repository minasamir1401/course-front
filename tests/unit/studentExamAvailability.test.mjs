import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
const module={exports:{}};
const code=ts.transpileModule(fs.readFileSync(new URL('../../src/lib/studentExamAvailability.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInThisContext('(function(exports){'+code+'})')(module.exports);
const {studentExamAvailability:status,latestStudentSubmission:latest}=module.exports;
const now=Date.parse('2026-10-17T12:00Z');
test('parent dates prevent starting a child even if the child itself is open',()=>{
 assert.equal(status({attemptsAllowed:2},[],{startDate:'2099-01-01'},now),'UPCOMING');
 assert.equal(status({attemptsAllowed:2},[],{endDate:'2020-01-01'},now),'CLOSED');
});
test('a parent stays available while another child still has attempts',()=>{
 const exam={attemptsAllowed:1,modules:[{subExams:[{id:'a',attemptsAllowed:1},{id:'b',attemptsAllowed:1}]}]};
 assert.equal(status(exam,[{id:'s',subExamId:'a'}],undefined,now),'AVAILABLE');
 assert.equal(status(exam,[{id:'s',subExamId:'a'},{id:'s2',subExamId:'b'}],undefined,now),'COMPLETED');
});
test('unlimited and expired attempts have distinct availability',()=>{
 assert.equal(status({attemptsAllowed:999},Array(1000).fill({id:'s'}),undefined,now),'AVAILABLE');
 assert.equal(status({attemptsAllowed:1,cutOffDate:'2020-01-01'},[{id:'s'}],undefined,now),'CLOSED');
});
test('latest result is chosen by date and missing identities cannot form result links',()=>{
 assert.equal(latest([{id:'older',createdAt:'2020-01-01'},{createdAt:'2099-01-01'},{id:'latest',createdAt:'2026-01-01'}]).id,'latest');
 assert.equal(latest([]),undefined);
});
