import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
const ts = require('typescript');

function createStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => { store.clear(); },
  };
}

function loadTs(file, mocks = {}) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  const dependencies = (name) => (name in mocks ? mocks[name] : name.endsWith('.css') ? {} : require(name));
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})')(dependencies, module, module.exports);
  return module.exports;
}

test('autoTranslatePreference defaults to true, persists toggles, and dispatches change events', () => {
  const storage = createStorage();
  const dispatched = [];
  const prevWindow = globalThis.window;
  const prevStorage = globalThis.localStorage;
  const prevCustomEvent = globalThis.CustomEvent;

  globalThis.localStorage = storage;
  globalThis.CustomEvent = class MockCustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
  globalThis.window = {
    localStorage: storage,
    dispatchEvent: (evt) => {
      dispatched.push(evt);
      return true;
    },
  };

  try {
    const pref = loadTs('../../src/lib/autoTranslatePreference.ts');
    assert.equal(pref.getAutoTranslateEnabled(), true);
    pref.setAutoTranslateEnabled(false);
    assert.equal(pref.getAutoTranslateEnabled(), false);
    pref.setAutoTranslateEnabled(true);
    assert.equal(pref.getAutoTranslateEnabled(), true);
    assert.deepEqual(
      dispatched.map((e) => ({ type: e.type, detail: e.detail })),
      [
        { type: pref.AUTO_TRANSLATE_EVENT, detail: false },
        { type: pref.AUTO_TRANSLATE_EVENT, detail: true },
      ],
    );
  } finally {
    globalThis.window = prevWindow;
    globalThis.localStorage = prevStorage;
    globalThis.CustomEvent = prevCustomEvent;
  }
});

test('detectSlideLanguage ignores default placeholder Arabic titles when slide body is English', () => {
  const { detectSlideLanguage, isDefaultSlideTitle } = loadTs('../../src/lib/slideLanguage.ts');

  assert.equal(isDefaultSlideTitle('محتوى جديد'), true);
  assert.equal(isDefaultSlideTitle('سؤال جديد'), true);
  assert.equal(
    detectSlideLanguage({ title: 'محتوى جديد', content: '<p>Cell respiration converts glucose into ATP.</p>' }, 'ar'),
    'en',
  );
  assert.equal(
    detectSlideLanguage({ title: 'سؤال جديد', content: 'Which organelle produces ATP?' }, 'ar'),
    'en',
  );
  assert.equal(
    detectSlideLanguage({ title: 'محتوى جديد', content: '<p>التنفس الخلوي ينتج الطاقة.</p>' }, 'en'),
    'ar',
  );
});

async function withMockedTranslateApi(responder, fn) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init?.body || '{}');
    const items = Array.isArray(body.texts) ? body.texts : [body.text || ''];
    const translations = items.map((t) => responder(t, body.from, body.to, body));
    return {
      ok: true,
      status: 200,
      json: async () => (Array.isArray(body.texts) ? { translations } : { translatedText: translations[0] }),
    };
  };
  try {
    return await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function loadManualAutoTranslateModule() {
  const path = require('node:path');
  const libRoot = path.resolve(new URL('../../src/lib', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const srcRoot = path.resolve(new URL('../../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const cache = new Map();

  const loadByAbs = (absFile) => {
    if (cache.has(absFile)) return cache.get(absFile);
    const source = fs.readFileSync(absFile, 'utf8');
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const mod = { exports: {} };
    cache.set(absFile, mod.exports);
    const dir = path.dirname(absFile);
    const req = (name) => {
      if (name === './api' || name === '@/lib/api') return { API_URL: 'http://localhost:5000/api' };
      if (name.startsWith('./') || name.startsWith('../') || name.startsWith('@/')) {
        const base = name.startsWith('@/')
          ? path.resolve(srcRoot, name.slice(2))
          : path.resolve(dir, name);
        for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return loadByAbs(candidate);
          }
        }
      }
      return require(name);
    };
    vm.runInThisContext('(function(require,module,exports){' + code + '\n})')(req, mod, mod.exports);
    return mod.exports;
  };

  return {
    manual: loadByAbs(path.join(libRoot, 'manualAutoTranslate.ts')),
    service: loadByAbs(path.join(libRoot, 'translationService.ts')),
  };
}

test('manual auto-translation handles EN-in-AR-tab recovery, interactive payloads, image rescue, unchanged fallback detection, and large HTML chunking', async () => {
  const { manual, service } = loadManualAutoTranslateModule();

  // 1. Smart direction recovery + image rescue + hint/sections + MATCHING payload
  await withMockedTranslateApi(
    (raw, from, to) => {
      if (from === 'en' && to === 'ar') {
        if (raw.includes('Plants convert light energy')) return 'تُحوِّل النباتات الطاقة الضوئية إلى طاقة كيميائية';
        if (raw.includes('chloroplast')) return 'البلاستيدة الخضراء';
        if (raw.includes('mitochondria')) return 'الميتوكوندريا';
        if (raw.includes('Match each organelle')) return 'طابق كل عضية بوظيفتها';
        if (raw === 'Chloroplast') return 'البلاستيدة الخضراء';
        if (raw === 'Mitochondria') return 'الميتوكوندريا';
        if (raw === 'Photosynthesis') return 'البناء الضوئي';
        if (raw === 'Respiration') return 'التنفس الخلوي';
        if (raw.includes('Hint in English')) return 'تلميح باللغة العربية';
        if (raw.includes('Biology')) return 'الأحياء';
        return `عربي: ${raw}`;
      }
      return raw;
    },
    async () => {
      const slideRes = await manual.translateSingleSlideItem(
        {
          id: 's1',
          type: 'TEXT',
          title: 'محتوى جديد',
          content: '<p><img src="/uploads/cell.png" /> Plants convert light energy</p>',
          hint: 'Hint in English',
          skill: 'Biology',
        },
        'ar',
      );
      assert.equal(slideRes.targetLang, 'ar');
      assert.equal(slideRes.changed, true);
      assert.match(slideRes.updated.content, /\/uploads\/cell\.png/);
      assert.match(slideRes.updated.content, /تُحوِّل النباتات/);
      assert.match(slideRes.updated.contentEn, /Plants convert light energy/);
      assert.equal(slideRes.updated.hint, 'تلميح باللغة العربية');
      assert.equal(slideRes.updated.hintEn, 'Hint in English');
      assert.equal(slideRes.updated.skill, 'الأحياء');
      assert.equal(slideRes.updated.skillEn, 'Biology');

      const matchingQ = await manual.translateSingleQuestionItem(
        {
          id: 'q1',
          type: 'MATCHING',
          text: '',
          textEn: 'Match each organelle',
          options: JSON.stringify({ left: ['Chloroplast', 'Mitochondria'], right: ['Photosynthesis', 'Respiration'] }),
          correctAnswer: JSON.stringify({ Chloroplast: 'Photosynthesis', Mitochondria: 'Respiration' }),
        },
        'en',
      );
      assert.equal(matchingQ.changed, true);
      assert.equal(matchingQ.updated.text, 'طابق كل عضية بوظيفتها');
      const parsedOpts = JSON.parse(matchingQ.updated.options);
      assert.deepEqual(parsedOpts.left, ['البلاستيدة الخضراء', 'الميتوكوندريا']);
      assert.deepEqual(parsedOpts.right, ['البناء الضوئي', 'التنفس الخلوي']);
      const parsedAns = JSON.parse(matchingQ.updated.correctAnswer);
      assert.equal(parsedAns['البلاستيدة الخضراء'], 'البناء الضوئي');

      // TRUE_FALSE activity translation
      const tfActivity = await manual.translateSingleActivityItem(
        {
          id: 'a1',
          type: 'TRUE_FALSE',
          title: 'Energy Check',
          questionText: '<p><img src="/uploads/tf.png" /> The mitochondria releases ATP.</p>',
          options: ['True', 'False'],
          correctAnswer: 'True',
        },
        'ar',
      );
      assert.equal(tfActivity.changed, true);
      assert.match(tfActivity.updated.questionText, /\/uploads\/tf\.png/);
      assert.deepEqual(tfActivity.updated.options, ['صحيح', 'خطأ']);

      // Full draft translation
      const translatedLesson = await manual.autoTranslateLessonDraftForSave({
        domain: 'Cell Biology',
        standards: 'BIO-1.1 Understand cells',
        slides: [{ id: 's2', type: 'TEXT', title: 'محتوى جديد', contentEn: '<p>Chloroplasts capture sunlight.</p>', content: '<p>Chloroplasts capture sunlight.</p>' }],
        questions: [],
        assignments: [],
      });
      assert.equal(translatedLesson.domain, 'الأحياء');
      assert.match(translatedLesson.slides[0].content, /عربي:/);
    },
  );

  // 2. Unchanged echo detection must report changed: false
  await withMockedTranslateApi(
    (raw) => raw,
    async () => {
      const noChangeRes = await manual.translateSingleSlideItem(
        {
          id: 's3',
          type: 'TEXT',
          title: 'Water Cycle',
          content: '<p>Evaporation happens in sunlight.</p>',
        },
        'ar',
      );
      assert.equal(noChangeRes.hasTranslatableSource, true);
      assert.equal(noChangeRes.changed, false);
    },
  );

  // 3. Oversized HTML > 11000 chars chunks via batch without dropping content
  const longParas = Array.from({ length: 180 }, (_, idx) => `<p>Paragraph number ${idx + 1} explains cellular metabolism.</p>`).join('');
  await withMockedTranslateApi(
    (raw) => raw.replace(/Paragraph/g, 'الفقرة'),
    async () => {
      const translatedLong = await service.translateText(longParas, 'en', 'ar');
      assert.match(translatedLong, /الفقرة number 1 /);
      assert.match(translatedLong, /الفقرة number 180 /);
    },
  );
});

test('browser DOM tests verify syncRichTextFormatting (block styles, single-word spans, images, safety guard) and sanitizeEditorHtml', async () => {
  const { syncRichTextFormatting } = loadTs('../../src/lib/bilingualRichText.ts');
  const sanitizeCode = ts.transpileModule(
    fs.readFileSync(new URL('../../src/lib/sanitize.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const editorHtmlCode = ts.transpileModule(
    fs.readFileSync(new URL('../../src/lib/editorHtml.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } },
  ).outputText;

  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ path: require.resolve('dompurify/dist/purify.js') });

    const syncFnSource = syncRichTextFormatting.toString();

    const results = await page.evaluate(({ fnStr, sanitizeCjs, editorCjs }) => {
      const runSync = eval(`(${fnStr})`);

      const runModule = (code, deps) => {
        const mod = { exports: {} };
        const req = (name) => deps[name];
        new Function('require', 'module', 'exports', code)(req, mod, mod.exports);
        return mod.exports;
      };
      const sanitizeMod = runModule(sanitizeCjs, { 'isomorphic-dompurify': { sanitize: (x, cfg) => window.DOMPurify.sanitize(x, cfg) } });
      const { sanitizeEditorHtml } = runModule(editorCjs, {
        dompurify: window.DOMPurify,
        './sanitize': sanitizeMod,
      });

      // 1. Block alignment & style sync
      const blockSynced = runSync(
        '<p>Hello world</p>',
        '<p style="text-align: center; color: rgb(220, 38, 38);">Hello world</p>',
        '<p>مرحبا بالعالم</p>',
      );

      // 2. Partial single-word bold + highlight sync (snapped to Arabic word boundary)
      const wordSynced = runSync(
        '<p>Plants capture energy daily</p>',
        '<p>Plants <mark style="background-color: rgb(254, 240, 138);"><b>capture</b></mark> energy daily</p>',
        '<p>تمتص النباتات الطاقة يومياً</p>',
      );

      // 3. Heading switch (p -> h2)
      const headingSynced = runSync(
        '<p>Introduction</p>',
        '<h2>Introduction</h2>',
        '<p>مقدمة</p>',
      );

      // 4. Image-only slide resize/align sync
      const imgOnlySynced = runSync(
        '<p><img src="/img/a.png" data-align="left" style="width: 300px;" /></p>',
        '<p><img src="/img/a.png" data-align="center" style="width: 520px; border-radius: 12px;" /></p>',
        '<p><img src="/img/a.png" data-align="left" style="width: 300px;" /></p>',
      );

      // 5. Wording edit guard: must NOT clobber Arabic when English wording changed
      const wordingGuard = runSync(
        '<p>Original English</p>',
        '<p style="color: red;">Modified English</p>',
        '<p>النص العربي الأصلي</p>',
      );

      // 6. sanitizeEditorHtml keeps safe styles + math-ltr while removing scripts and fixed overlays
      const dirty = '<div class="fixed inset-0 editor-content" style="position: fixed; background-color: #fef08a;" onclick="alert(1)"><span class="math-ltr">x &lt; y</span><img src="/a.png" style="display: block; border-radius: 12px;" /><script>evil()</script></div>';
      const cleaned = sanitizeEditorHtml(dirty);

      return { blockSynced, wordSynced, headingSynced, imgOnlySynced, wordingGuard, cleaned };
    }, { fnStr: syncFnSource, sanitizeCjs: sanitizeCode, editorCjs: editorHtmlCode });

    assert.match(results.blockSynced, /text-align:\s*center/);
    assert.match(results.blockSynced, /color:\s*rgb\(220,\s*38,\s*38\)/);
    assert.match(results.blockSynced, /مرحبا بالعالم/);

    assert.match(results.wordSynced, /<mark[^>]*background-color:\s*rgb\(254,\s*240,\s*138\)/);
    assert.match(results.wordSynced, /<b>.*<\/b>/);
    assert.match(results.wordSynced, /النباتات/);
    assert.doesNotMatch(results.wordSynced, /capture/);

    assert.match(results.headingSynced, /^<h2>.*مقدمة.*<\/h2>$/);

    assert.match(results.imgOnlySynced, /data-align="center"/);
    assert.match(results.imgOnlySynced, /width:\s*520px/);
    assert.match(results.imgOnlySynced, /border-radius:\s*12px/);

    assert.equal(results.wordingGuard, '<p>النص العربي الأصلي</p>');

    assert.match(results.cleaned, /class="[^"]*math-ltr/);
    assert.match(results.cleaned, /background-color:\s*rgb\(254,\s*240,\s*138\)|background-color:\s*#fef08a/);
    assert.match(results.cleaned, /border-radius:\s*12px/);
    assert.match(results.cleaned, /display:\s*block/);
    assert.doesNotMatch(results.cleaned, /<script/);
    assert.doesNotMatch(results.cleaned, /position:\s*fixed/);
    assert.doesNotMatch(results.cleaned, /\beditor-content\b/);
    assert.doesNotMatch(results.cleaned, /\bfixed\b/);
  } finally {
    await browser.close();
  }
});

test('LessonSubComponents bilingual grading grades English and Arabic answers accurately', () => {
  const React = { createElement: () => null };
  const sub = loadTs('../../src/components/LessonSubComponents.tsx', {
    react: React,
    'react-dom': { createPortal: (x) => x },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/components/HtmlRenderer': () => null,
    '@/components/InteractiveTag': { InteractiveTag: () => null },
    '@/components/AnimatedFeedback': () => null,
  });

  // MCQ with paired Arabic/English options where only Arabic correctAnswer is stored
  const mcq = {
    type: 'MCQ',
    options: ['الميتوكوندريا', 'النواة', 'الريبوسوم'],
    optionsEn: ['Mitochondria', 'Nucleus', 'Ribosome'],
    correctAnswer: 'الميتوكوندريا',
  };
  assert.equal(sub.isSingleOptionCorrect(mcq, 'Mitochondria', 'en'), true);
  assert.equal(sub.isSingleOptionCorrect(mcq, 'Nucleus', 'en'), false);
  assert.equal(sub.isSingleOptionCorrect(mcq, 'الميتوكوندريا', 'ar'), true);

  // MULTI_SELECT bilingual grading
  const multi = {
    type: 'MULTI_SELECT',
    options: ['الأكسجين', 'ثاني أكسيد الكربون', 'النيتروجين'],
    optionsEn: ['Oxygen', 'Carbon dioxide', 'Nitrogen'],
    correctAnswers: ['الأكسجين', 'ثاني أكسيد الكربون'],
  };
  assert.equal(sub.isMultiAnswerCorrect(multi, ['Oxygen', 'Carbon dioxide'], 'en'), true);
  assert.equal(sub.isMultiAnswerCorrect(multi, ['Oxygen'], 'en'), false);

  // TRUE_FALSE bilingual grading
  assert.equal(sub.isSingleOptionCorrect({ type: 'TRUE_FALSE', correctAnswer: 'صحيح' }, 'True', 'en'), true);
  assert.equal(sub.isSingleOptionCorrect({ type: 'TRUE_FALSE', correctAnswer: 'False' }, 'خطأ', 'ar'), true);

  // MATCHING JSON bilingual grading
  const matching = {
    type: 'MATCHING',
    correctAnswer: JSON.stringify({ 'بلاستيدة': 'بناء ضوئي' }),
    correctAnswerEn: JSON.stringify({ Chloroplast: 'Photosynthesis' }),
  };
  assert.equal(sub.checkAdvancedCorrect(matching, JSON.stringify({ Chloroplast: 'Photosynthesis' }), 'en'), true);
  assert.equal(sub.checkAdvancedCorrect(matching, JSON.stringify({ 'بلاستيدة': 'بناء ضوئي' }), 'ar'), true);
});

test('useExamSubmit honors AutoTranslateToggle for both super-admin and school-admin exam saves', async () => {
  for (const role of ['super-admin', 'school-admin']) {
    for (const enabled of [true, false]) {
      let submitted = null;
      const prevStorage = globalThis.localStorage;
      globalThis.localStorage = { getItem: () => 'cookie_auth' };
      try {
        const { useExamSubmit } = loadTs(`../../src/app/${role}/exams/new/hooks/useExamSubmit.ts`, {
          '@/lib/api': {
            API_URL: 'http://localhost/api',
            apiFetch: async (_url, init) => {
              submitted = JSON.parse(init.body);
              return Response.json({ exam: { id: 'exam-1' } });
            },
          },
          '@/lib/examEditingPayload': loadTs('../../src/lib/examEditingPayload.ts'),
          '@/lib/moduleCreationWorkflow': { buildCreatedModulePortalHref: () => null },
          '@/lib/autoTranslatePreference': { getAutoTranslateEnabled: () => enabled },
          '@/lib/manualAutoTranslate': { questionNeedsArabicTranslation: (q) => Boolean(q?.textEn && !q?.text) },
          '@/lib/excelAutoTranslate': {
            autoTranslateQuestionsList: async (qs) => qs.map((q) => ({ ...q, text: `عربي: ${q.textEn || q.text}` })),
          },
        });

        await useExamSubmit({
          examData: { title: 'Physics Exam', duration: 30, passingScore: 50, grades: ['G10'], subjects: ['Physics'] },
          modules: [],
          standaloneQuestions: [{ id: 'q-1', text: '', textEn: 'What is velocity?', type: 'MCQ' }],
          manualSubmitRef: { current: false },
          autoSaveGenerationRef: { current: 0 },
          autoSaveTimerRef: { current: null },
          autoSaveWriteQueueRef: { current: Promise.resolve() },
          createdIdRef: { current: null },
          setIsLoading: () => {},
          showToast: () => {},
          language: 'ar',
          router: { push: () => {} },
          moduleMode: false,
        }).handleSubmit({ preventDefault() {} });

        assert.equal(submitted.autoTranslate, enabled);
        assert.equal(submitted.questions[0].text, enabled ? 'عربي: What is velocity?' : '');
      } finally {
        if (prevStorage === undefined) delete globalThis.localStorage;
        else globalThis.localStorage = prevStorage;
      }
    }
  }
});

test('security hardening: image-utils, rescueMissingImages, sanitizeEditorHtml, and syncRichTextFormatting block XSS and CSS/URL injection', async () => {
  const imageUtils = loadTs('../../src/lib/image-utils.ts', {
    './api': { API_URL: 'http://localhost/api' },
    './imageUploadPolicy': { assertSupportedImageUpload: () => {} },
  });

  // 1. Unsafe image URL rejection & attribute escaping
  assert.equal(imageUtils.isSafeImageUrl('/uploads/diagram.png'), true);
  assert.equal(imageUtils.isSafeImageUrl('https://cdn.example.com/a.webp'), true);
  assert.equal(imageUtils.isSafeImageUrl('data:image/png;base64,AAAA'), true);
  assert.equal(imageUtils.isSafeImageUrl('javascript:alert(1)'), false);
  assert.equal(imageUtils.isSafeImageUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(imageUtils.isSafeImageUrl('/uploads/a.png" onerror="alert(1)'), false);
  assert.equal(imageUtils.isSafeImageUrl('//evil.example.com/x.png'), false);

  const extracted = imageUtils.extractImageUrls(
    '<img src="javascript:alert(1)" /><img src="data:image/svg+xml;base64,PHN2Zw==" /><img src="/uploads/safe.png" />',
  );
  assert.deepEqual(extracted, ['/uploads/safe.png']);

  assert.equal(imageUtils.insertImageIntoHtml('<p>Keep</p>', 'javascript:alert(1)'), '<p>Keep</p>');
  const insertedSafe = imageUtils.insertImageIntoHtml('<p>Body</p>', 'https://cdn.example.com/ok.png?v=1&w=2');
  assert.match(insertedSafe, /src="https:\/\/cdn\.example\.com\/ok\.png\?v=1&amp;w=2"/);

  // 2. rescueMissingImages ignores unsafe URLs while rescuing safe images
  const { manual } = loadManualAutoTranslateModule();
  await withMockedTranslateApi(
    () => 'النص المترجم',
    async () => {
      const res = await manual.translateSingleSlideItem(
        {
          id: 'sec-1',
          type: 'TEXT',
          title: 'Slide',
          content: '<p><img src="javascript:alert(9)" /><img src="/uploads/good.png" /> Translate this text</p>',
        },
        'ar',
      );
      assert.doesNotMatch(res.updated.content, /javascript:/i);
      assert.match(res.updated.content, /\/uploads\/good\.png/);
    },
  );

  // 3. DOM checks for sanitizeEditorHtml CSS value stripping across all properties & syncRichTextFormatting attribute/CSS filtering
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ path: require.resolve('dompurify/dist/purify.js') });
    const sanitizeCode = ts.transpileModule(
      fs.readFileSync(new URL('../../src/lib/sanitize.ts', import.meta.url), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } },
    ).outputText;
    const editorHtmlCode = ts.transpileModule(
      fs.readFileSync(new URL('../../src/lib/editorHtml.ts', import.meta.url), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } },
    ).outputText;
    const { syncRichTextFormatting } = loadTs('../../src/lib/bilingualRichText.ts');
    const syncFnSource = syncRichTextFormatting.toString();

    const domRes = await page.evaluate(({ fnStr, sanitizeCjs, editorCjs }) => {
      const runSync = eval(`(${fnStr})`);
      const runModule = (code, deps) => {
        const mod = { exports: {} };
        new Function('require', 'module', 'exports', code)((n) => deps[n], mod, mod.exports);
        return mod.exports;
      };
      const sanitizeMod = runModule(sanitizeCjs, { 'isomorphic-dompurify': { sanitize: (x, cfg) => window.DOMPurify.sanitize(x, cfg) } });
      const { sanitizeEditorHtml } = runModule(editorCjs, { dompurify: window.DOMPurify, './sanitize': sanitizeMod });

      const cleanCss = sanitizeEditorHtml(
        '<p style="color: rgb(37, 99, 235); background-color: url(https://evil.test/track.png); border-color: expression(alert(1));">Styled</p>',
      );
      const syncedSafe = runSync(
        '<p>Hello</p>',
        '<p style="color: rgb(37, 99, 235); position: fixed; top: 0px;">Hello</p>',
        '<h2 onclick="alert(1)" href="javascript:alert(2)" style="position: fixed; z-index: 9999;">مرحبا</h2>',
      );
      const cleanSyncedTagSwitch = runSync(
        '<p>Hello</p>',
        '<h2>Hello</h2>',
        '<p onclick="alert(1)" style="position: fixed; background-color: url(https://evil.test/x);">مرحبا</p>',
      );
      return { cleanCss, syncedSafe, cleanSyncedTagSwitch };
    }, { fnStr: syncFnSource, sanitizeCjs: sanitizeCode, editorCjs: editorHtmlCode });

    assert.match(domRes.cleanCss, /color:\s*rgb\(37,\s*99,\s*235\)/);
    assert.doesNotMatch(domRes.cleanCss, /url\(|expression\(/i);

    assert.doesNotMatch(domRes.syncedSafe, /position:\s*fixed/i);
    assert.match(domRes.syncedSafe, /color:\s*rgb\(37,\s*99,\s*235\)/);

    assert.doesNotMatch(domRes.cleanSyncedTagSwitch, /onclick|position:\s*fixed|url\(/i);
    assert.match(domRes.cleanSyncedTagSwitch, /^<h2[^>]*>مرحبا<\/h2>$/);
  } finally {
    await browser.close();
  }
});
