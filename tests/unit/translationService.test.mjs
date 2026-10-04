import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const servicePath = fileURLToPath(new URL('../../src/lib/translationService.ts', import.meta.url));

function loadTranslationService(mockFetch) {
  const code = ts.transpileModule(fs.readFileSync(servicePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const localRequire = (id) => {
    if (id === './api') return { API_URL: 'http://localhost:3000/api' };
    return require(id);
  };
  new Function('require', 'module', 'exports', 'fetch', code)(
    localRequire,
    mod,
    mod.exports,
    mockFetch
  );
  return mod.exports;
}

test('translateText masks base64 media before network call and restores it in result', async () => {
  let capturedBody = null;
  const mockFetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      translatedText: capturedBody.text.replace('مرحبا', 'Hello')
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const { translateText } = loadTranslationService(mockFetch);
  const input = '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" /> مرحبا بالعالم</p>';
  const result = await translateText(input, 'ar', 'en');

  assert.ok(capturedBody.text.includes('__CLIENT_MEDIA_0__'));
  assert.ok(!capturedBody.text.includes('data:image/png;base64'));
  assert.ok(result.includes('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='));
  assert.ok(result.includes('Hello'));
});

test('translateBatch masks base64 media across multiple batch items and restores them', async () => {
  let capturedBody = null;
  const mockFetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      translations: capturedBody.texts.map(t => t.replace('سؤال', 'Question'))
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const { translateBatch } = loadTranslationService(mockFetch);
  const inputs = [
    '<p><img src="data:image/jpeg;base64,/9j/4AAQSkZJRg==" /> سؤال 1</p>',
    'سؤال 2 بدون صور'
  ];
  const results = await translateBatch(inputs, 'ar', 'en');

  assert.ok(capturedBody.texts[0].includes('__CLIENT_MEDIA_0__'));
  assert.ok(!capturedBody.texts[0].includes('data:image/jpeg;base64'));
  assert.ok(results[0].includes('data:image/jpeg;base64,/9j/4AAQSkZJRg=='));
  assert.ok(results[0].includes('Question 1'));
  assert.ok(results[1].includes('Question 2'));
});
