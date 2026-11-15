import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import { chromium } from '@playwright/test';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(file,mocks={}) {
  const source=fs.readFileSync(new URL(file,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  const dependencies=name=>name in mocks ? mocks[name] : name.endsWith('.css') ? {} : require(name);
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(dependencies,module,module.exports);
  return module.exports;
}
const sanitization = load('../../src/lib/sanitize.ts');
const {processHtml}=load('../../src/components/HtmlRenderer.tsx',{'../lib/richTextMath':load('../../src/lib/richTextMath.ts'),'../lib/sanitize':sanitization,'../lib/utils':{resolveMediaUrl:x=>x}});

test('calculator matrices retain rows, brackets and canonical LaTeX through sanitization and rendering', () => {
 for (const environment of ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix', 'smallmatrix', 'array']) {
   const formula = `\\begin{${environment}}${environment === 'array' ? '{cc}' : ''}1&-2\\\\3&4\\end{${environment}}`;
   for (const source of [`\\({\\Large ${formula}}\\textstyle\\)`, `$$${formula}$$`]) {
     const rendered = processHtml(sanitization.sanitizeHtml(source));
     assert.match(rendered, /class="katex/);
     assert.match(rendered, /<mtable/);
     assert.equal((rendered.match(/<mtr>/g) || []).length, 2);
     assert.equal((rendered.match(/<mtd>/g) || []).length, 4);
     assert.doesNotMatch(rendered, /katex-error|\\text\{ (?:bmatrix|array)/);
     assert.ok(rendered.includes(formula.replace(/&/g, '&amp;')), environment);
   }
 }
});

test('the reported A minus B answer choices retain all four matrix entries after a save round trip', () => {
 const matrices = [String.raw`2&2\\7&-2`, String.raw`4&-6\\3&4`, String.raw`4&2\\3&-2`, String.raw`2&-6\\3&4`];
 const choices = matrices.map(entries => `\\({\\Large \\begin{bmatrix}${entries}\\end{bmatrix}}\\textstyle\\)`);
 const saved = JSON.parse(JSON.stringify({ options: choices, correctAnswer: choices[1] }));
 assert.equal(saved.correctAnswer, choices[1]);
 for (const choice of saved.options) {
   const rendered = processHtml(sanitization.sanitizeHtml(choice));
   assert.match(rendered, /class="katex"/);
   assert.equal((rendered.match(/<mtr>/g) || []).length, 2);
   assert.equal((rendered.match(/<mtd>/g) || []).length, 4);
   assert.doesNotMatch(rendered, /katex-error/);
 }
});

test('browser sanitization keeps complete direct and calculator inequalities and removes executable HTML', async () => {
 const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
 try {
   const page = await browser.newPage();
   await page.addScriptTag({ path: require.resolve('dompurify/dist/purify.js') });
   for (const expression of ['x<y', 'x<y>z', 'x<y && y>z', '-10 < x <= -2', 'x>=-10', 'x ≤ -2', 'x>y', 'x < bound > z']) {
     for (const source of [expression, `<p dir="rtl">${expression}</p>`]) {
       const clean = await page.evaluate(input => DOMPurify.sanitize(input), sanitization.sanitizeHtml(source));
       await page.locator('body').evaluate((body, html) => { body.innerHTML = html; }, processHtml(clean));
       assert.equal(await page.locator('body').textContent(), expression);
       assert.equal(await page.locator('.math-ltr').first().evaluate(el => getComputedStyle(el).direction), 'ltr');
     }
   }
   for (const formula of ['{\\Large y<-10}\\textstyle', '-10<x\\leq-2', 'x<y<z', 'y', '-10']) {
     const clean = await page.evaluate(input => DOMPurify.sanitize(input), sanitization.sanitizeHtml(`\\(${formula}\\)`));
     await page.locator('body').evaluate((body, html) => { body.innerHTML = html; }, processHtml(clean));
     assert.equal(await page.locator('.katex').count(), 1);
     assert.equal(await page.locator('annotation').textContent(), formula);
   }
   const hostile = '<img src=x onerror="window.mathInjected=true"><script>window.mathInjected=true</script>';
   const clean = await page.evaluate(input => DOMPurify.sanitize(input), sanitization.sanitizeHtml(hostile));
   await page.locator('body').evaluate((body, html) => { body.innerHTML = html; }, processHtml(clean));
   assert.equal(await page.locator('body script,body [onerror]').count(), 0);
   assert.equal(await page.evaluate(() => window.mathInjected), undefined);
 } finally { await browser.close(); }
});
test('lazy HTML images use responsive optimization while preserving content layout', () => {
 const rendered = processHtml('<img src="/uploads/example.webp" alt="Diagram" data-align="center" style="width:50%;height:auto" />');
 assert.match(rendered, /srcset="[^"]*_next\/image/);
 assert.match(rendered, /loading="lazy"/);
 assert.match(rendered, /sizes="\(max-width: 768px\) 100vw, 700px"/);
 assert.match(rendered, /style="width:50%;height:auto"/);
 assert.match(rendered, /data-align="center"/);
 const offline = processHtml('<img src="data:image/webp;base64,AAAA" />');
 assert.match(offline, /src="data:image\/webp;base64,AAAA"/);
 assert.doesNotMatch(offline, /_next\/image/);
});
test('fractions inside explicit math render once with no nested delimiters or KaTeX error',()=>{
 for(const html of [
   String.raw`\(x=\ln(18/5)\)`,
   String.raw`$x=\ln(18/5)$`,
   String.raw`\[x=\ln(18/5)\]`,
   String.raw`\(x=(\ln(\(\frac{18}{5}))\)`,
   String.raw`x=(\ln(\(\frac{18}{5}))\)`,
   String.raw`\(A(t) = 800(1.15)^t, approximately 1399mg\)`,
   String.raw`$A(t) = 800(0.85)^t, approximately 418mg$`
 ]) {
   const rendered=processHtml(html); assert.match(rendered,/katex/); assert.doesNotMatch(rendered,/katex-error/); assert.doesNotMatch(rendered,/\\\(/);
 }
 assert.match(processHtml('Fraction 4/5'),/katex/);
});
test('HTML attributes and images remain intact while math renders',()=>{
 const html=processHtml('<img src="/uploads/image.webp" data-number="18/5" loading="lazy">','eager');
 assert.match(html,/data-number="18\/5"/); assert.match(html,/loading="eager"/); assert.match(html,/srcset=/); assert.doesNotMatch(html,/loading="lazy"/);
});
test('both new exam save hooks publish standalone and nested questions',async()=>{
 for(const role of ['super-admin','school-admin']) {
  let submitted;
  const api={API_URL:'http://localhost/api',apiFetch:async(_url,init)=>{submitted=JSON.parse(init.body);return Response.json({exam:{id:'created'}});}};
  const editing=load('../../src/lib/examEditingPayload.ts');
  const {useExamSubmit}=load('../../src/app/'+role+'/exams/new/hooks/useExamSubmit.ts',{'@/lib/api':api,'@/lib/examEditingPayload':editing,'@/lib/moduleCreationWorkflow':{buildCreatedModulePortalHref:()=>null}});
  const old=globalThis.localStorage;globalThis.localStorage={getItem:()=> 'cookie_auth'};
  try {
   await useExamSubmit({examData:{title:'Standalone',duration:60,passingScore:0,grades:['Grade'],subjects:['Math']},modules:[],standaloneQuestions:[{text:'Question one',id:'q-one'}],manualSubmitRef:{current:false},autoSaveGenerationRef:{current:0},autoSaveTimerRef:{current:null},autoSaveWriteQueueRef:{current:Promise.resolve()},createdIdRef:{current:null},setIsLoading:()=>{},showToast:message=>{if(message?.includes('Failed'))throw Error(message);},language:'en',router:{push:()=>{}},moduleMode:false}).handleSubmit({preventDefault:()=>{}});
   assert.equal(submitted.questions.length,1);assert.equal(submitted.questions[0].text,'Question one');assert.equal(submitted.status,'PUBLISHED');
  } finally { if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old; }
 }
});

test('rapid first-save clicks send only one creation request for both admin roles', async () => {
 for (const role of ['super-admin', 'school-admin']) {
  let calls = 0, complete;
  const response = new Promise(resolve => { complete = resolve; });
  const api = { API_URL: 'http://localhost/api', apiFetch: async () => { calls++; return response; } };
  const { useExamSubmit } = load('../../src/app/' + role + '/exams/new/hooks/useExamSubmit.ts', {
   '@/lib/api': api, '@/lib/examEditingPayload': load('../../src/lib/examEditingPayload.ts'), '@/lib/moduleCreationWorkflow': { buildCreatedModulePortalHref: () => null },
  });
  const old = globalThis.localStorage; globalThis.localStorage = { getItem: () => 'cookie_auth' };
  try {
   const props = { examData: { title: 'Exam', duration: 60, passingScore: 0, grades: ['Grade'], subjects: ['Math'] }, modules: [], standaloneQuestions: [{ id: 123, text: 'Question one' }], manualSubmitRef: { current: false }, autoSaveGenerationRef: { current: 0 }, autoSaveTimerRef: { current: null }, autoSaveWriteQueueRef: { current: Promise.resolve() }, createdIdRef: { current: null }, setIsLoading: () => {}, showToast: () => {}, language: 'en', router: { push: () => {} } };
   const { handleSubmit } = useExamSubmit(props);
   const first = handleSubmit({ preventDefault() {} });
   const second = handleSubmit({ preventDefault() {} });
   await Promise.resolve();
   assert.equal(calls, 1);
   complete(Response.json({ exam: { id: 'saved' } }));
   await Promise.all([first, second]);
   assert.equal(props.createdIdRef.current, 'saved');
  } finally { if (old === undefined) delete globalThis.localStorage; else globalThis.localStorage = old; }
 }
});

test('new exam autosave synchronizes nested and standalone question IDs for the next save', async () => {
 for (const role of ['super-admin', 'school-admin']) {
  let timer, submitted;
  const editing = load('../../src/lib/examEditingPayload.ts');
  const sync = load('../../src/lib/examAutosaveModuleSync.ts');
  const serverQuestions = [
   { id: 'saved-nested', text: 'Nested question', moduleId: 'saved-module', subExamId: 'saved-child' },
   { id: 'saved-standalone', text: 'Standalone question', moduleId: null, subExamId: null },
  ];
  const { useExamAutosave } = load('../../src/app/' + role + '/exams/new/hooks/useExamAutosave.ts', {
   react: { useEffect: fn => fn() },
   '@/lib/api': { API_URL: 'http://localhost/api', apiFetch: async (_url, init) => { submitted = JSON.parse(init.body); return Response.json({ exam: { id: 'saved-exam' }, modules: [{ id: 'saved-module', subExams: [{ id: 'saved-child', title: 'Child' }] }], questions: serverQuestions }); } },
   '@/lib/examEditingPayload': editing,
   '@/lib/examAutosavePolicy': load('../../src/lib/examAutosavePolicy.ts'),
   '@/lib/examModuleQuestions': load('../../src/lib/examModuleQuestions.ts'),
   '@/lib/persistedExamQuestion': { normalizePersistedExamQuestions: questions => questions },
   '@/lib/examAutosaveIdSync': load('../../src/lib/examAutosaveIdSync.ts'),
   '@/lib/examAutosaveModuleSync': sync,
  });
  const oldStorage = globalThis.localStorage, oldTimeout = globalThis.setTimeout;
  globalThis.localStorage = { getItem: () => 'cookie_auth' };
  globalThis.setTimeout = callback => { timer = callback; return 1; };
  try {
   const question = { id: 3, text: 'Nested question' };
   const props = { isAutoSaveEnabled: true, createdId: 'saved-exam', createdIdRef: { current: 'saved-exam' }, examData: { title: 'Exam' }, modules: [{ id: 1, title: 'Module', questions: [question], subExams: [{ id: 2, title: 'Child', questions: [question, { ...question }] }] }], standaloneQuestions: [{ id: 4, text: 'Standalone question' }], manualSubmitRef: { current: false }, lastAutoSaveSnapshotRef: { current: null }, autoSaveGenerationRef: { current: 0 }, autoSaveWriteQueueRef: { current: Promise.resolve() }, autoSaveTimerRef: { current: null }, setModules: value => { props.modules = value; }, setStandaloneQuestions: value => { props.standaloneQuestions = value; }, setLastAutoSave() {}, showToast: message => { throw new Error(message); }, language: 'en' };
   useExamAutosave(props);
   timer();
   await props.autoSaveWriteQueueRef.current;
   assert.equal(submitted.questions.length, 2);
   assert.equal(props.modules[0].id, 'saved-module');
   assert.equal(props.modules[0].subExams[0].id, 'saved-child');
   assert.equal(props.modules[0].subExams[0].questions[0].id, 'saved-nested');
   assert.equal(props.standaloneQuestions[0].id, 'saved-standalone');
   const next = editing.buildExamSubmissionPayload(props);
   assert.deepEqual(next.allQuestions.map(question => question.id), ['saved-nested', 'saved-standalone']);
  } finally { globalThis.setTimeout = oldTimeout; if (oldStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = oldStorage; }
 }
});
test('upload proxy streams before upstream finishes and does not cache 404s',async t=>{
 const helpers=load('../../src/lib/apiProxy.ts');
 const route=load('../../src/app/uploads/[...path]/route.ts',{'@/lib/apiProxy':helpers});
 const req=new Request('http://localhost/uploads/test.webp');req.nextUrl=new URL(req.url);
 let controller; const body=new ReadableStream({start(c){controller=c;c.enqueue(new Uint8Array([1,2]));}});
 t.mock.method(globalThis,'fetch',async()=>new Response(body,{headers:{'content-type':'image/webp'}}));
 const res=await route.GET(req,{params:Promise.resolve({path:['test.webp']})});
 const reader=res.body.getReader();assert.deepEqual((await reader.read()).value,new Uint8Array([1,2]));controller.close();await reader.read();
 globalThis.fetch=async()=>new Response('missing',{status:404}); const missing=await route.GET(req,{params:Promise.resolve({path:['missing']})});assert.equal(missing.headers.get('Cache-Control'),'no-store');await missing.text();
 globalThis.fetch=async()=>new Response(null,{status:304});const conditional=await route.GET(req,{params:Promise.resolve({path:['test.webp']})});assert.equal(conditional.status,304);assert.equal(conditional.body,null);
});

test('legacy math fallback spans render from their canonical LaTeX without exposing injected HTML',()=>{
 const {buildRichTextMathHtml}=load('../../src/lib/richTextMath.ts');
 const result=processHtml(buildRichTextMathHtml(String.raw`x^2-y^2=\frac{1}{4}`,'normal','1em',false));
 assert.match(result,/class="katex"/);assert.doesNotMatch(result,/katex-error/);assert.match(result,/data-latex=/);
 const hostile=processHtml(buildRichTextMathHtml(String.raw`\badcommand <img src=x onerror=alert(1)>`,'normal','1em',false));
 assert.doesNotMatch(hostile,/<img src=x/);
});


test('font tags with color or styling attributes remain intact through sanitization and rendering', () => {
 const input = 'In the xy-plane, what is the<font color="#dc2626" > radius</font> of the circle?';
 const sanitized = sanitization.sanitizeHtml(input);
 const rendered = processHtml(sanitized);
 assert.doesNotMatch(sanitized, /&lt;font/);
 assert.match(sanitized, /<font color="#dc2626"\s*>/);
 assert.match(rendered, /<font color="#dc2626"\s*>/);
});

test('HtmlRenderer bounds KaTeX rule dimensions and macro expansions via maxSize and maxExpand', () => {
 const hugeRule = processHtml(String.raw`\(\rule{100em}{100em}\)`);
 assert.match(hugeRule, /class="katex"/);
 assert.match(hugeRule, /border-right-width:15em/);
 assert.match(hugeRule, /border-top-width:15em/);
 const recursiveMacro = processHtml(String.raw`\(\def\a{\a\a}\a\)`);
 assert.doesNotMatch(recursiveMacro, /class="katex"/);
 assert.match(recursiveMacro, /\\def\\a\{\\a\\a\}\\a/);
});

const bilingual = load('../../src/lib/bilingualMetadata.ts');
const egyptTime = load('../../src/lib/egyptTime.ts');
const persistence = load('../../src/lib/courseCreatePersistence.ts', { './bilingualMetadata': bilingual, './egyptTime': egyptTime });
const lessonSummary = load('../../src/lib/courseLessonSummary.ts', { './bilingualMetadata': bilingual, './courseCreatePersistence': persistence });

test('buildCourseLessonSummary preserves videoUrl, duration, metadata, and English translations', () => {
 const { buildCourseLessonSummary } = lessonSummary;
 const summary = buildCourseLessonSummary({
  id: 'lesson-1',
  courseId: 'course-1',
  title: 'Algebra Basics',
  domain: 'Algebra',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  summary: 'Intro summary',
  notes: 'Teacher notes',
  standards: 'S1',
  indicators: 'I1',
  learningOutcomes: 'LO1',
  domainEn: 'Algebra EN',
  standardsEn: 'S1 EN',
  indicatorsEn: 'I1 EN',
  learningOutcomesEn: 'LO1 EN',
  duration: 420,
  slides: [{ id: 's1' }, { id: 's2' }],
 });
 assert.equal(summary.videoUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
 assert.equal(summary.duration, 420);
 assert.equal(summary.notes, 'Teacher notes');
 assert.equal(summary.standards, 'S1');
 assert.equal(summary.indicators, 'I1');
 assert.equal(summary.learningOutcomes, 'LO1');
 assert.equal(summary.domainEn, 'Algebra EN');
 assert.equal(summary.standardsEn, 'S1 EN');
 assert.equal(summary.indicatorsEn, 'I1 EN');
 assert.equal(summary.learningOutcomesEn, 'LO1 EN');
 assert.equal(summary.slidesCount, 2);
 assert.equal(summary.isContentLoaded, false);
 assert.equal(buildCourseLessonSummary({ slides: '[{"id":"slide","sections":[{"id":"section"}]}]' }).slidesCount, 1);
});

test('courseCreatePersistence serializes lessons with isContentLoaded, enforces non-central school-admin payloads, and merges server IDs', () => {
 assert.equal(persistence.toSafeCourseDateIso('invalid-date'), null);
 assert.ok(persistence.toSafeCourseDateIso('2026-05-01T10:00'));

 const serialized = persistence.serializeCourseLessonForSave({
  title: 'Lesson 1',
  videoUrl: 'https://youtu.be/abc',
  notes: 'Notes',
  standards: 'Std 1',
  indicators: 'Ind 1',
  learningOutcomes: 'LO 1',
  slides: [{ id: 1, title: 'Slide 1', content: 'Hello' }],
  questions: [{ text: 'Q1?' }],
 }, 0);
 assert.equal(serialized.isContentLoaded, true);
 assert.equal(serialized.videoUrl, 'https://youtu.be/abc');
 assert.equal(serialized.notes, 'Notes');
 assert.equal(JSON.parse(serialized.slides).length, 1);
 assert.equal(JSON.parse(serialized.questions).length, 1);

 const schoolAdminPayload = persistence.buildCourseSavePayload(
  { title: 'School Course', grades: ['G1'], subjects: ['Math'], isCentral: true, schoolIds: [] },
  [{ title: 'Lesson 1', slides: [{ id: 1 }] }],
  'SCHOOL_ADMIN'
 );
 assert.equal(schoolAdminPayload.isCentral, false);
 assert.equal('schoolId' in schoolAdminPayload, false);

 const superAdminCentralPayload = persistence.buildCourseSavePayload(
  { title: 'Central Course', grades: ['G1'], subjects: ['Math'], isCentral: true, schoolIds: [] },
  [{ title: 'Lesson 1', slides: [{ id: 1 }] }],
  'SUPER_ADMIN'
 );
 assert.equal(superAdminCentralPayload.isCentral, true);

 const merged = persistence.mergeServerSavedLessons(
  [{ newLessonId: 'srv-lesson-1', title: 'Lesson 1', slides: [{ id: 1, title: 'Slide 1' }], questions: [], assignments: [], attachments: [] }],
  [{ id: 'srv-lesson-1', title: 'Lesson 1', slides: '[{"id":1,"title":"Slide 1"}]', questions: '[]', assignments: '[]', attachments: '[]' }]
 );
 assert.equal(merged.length, 1);
 assert.equal(merged[0].id, 'srv-lesson-1');
 assert.equal(merged[0].isContentLoaded, true);
 assert.equal(merged[0].slides.length, 1);
});

test('lesson identity stays stable across a reorder, identical names, and late save responses', () => {
 const old = { id: 'old', title: 'Physics', slides: Array.from({ length: 97 }, (_, id) => ({ id })) };
 const draft = persistence.withCourseLessonKey({ title: old.title, slides: [{ id: 'intro' }] });
 const submitted = persistence.stageCourseLesson([old], draft);
 assert.deepEqual(submitted, [old, draft]);
 assert.equal(persistence.serializeCourseLessonForSave(draft).newLessonId, draft.newLessonId);
 assert.equal(persistence.serializeCourseLessonForSave(draft).id, undefined);
 const changed = { ...draft, title: 'Saved again while the first request was pending' };
 const merged = persistence.mergeServerSavedLessons([changed, old], [
  { ...old, updatedAt: '2026-11-15T10:40:00Z' },
  { id: draft.newLessonId, title: old.title, slides: draft.slides },
 ], submitted);
 assert.equal(merged[0].slides.length, 97);
 assert.equal(merged[1].id, draft.newLessonId);
 assert.equal(merged[1].title, changed.title);
 assert.equal(merged[1].newLessonId, undefined);
 const summaryOnly = persistence.mergeServerSavedLessons([draft], [old], submitted);
 assert.equal(summaryOnly[0].id, old.id);
 assert.equal(summaryOnly[0].slides.length, 97);
 assert.equal(summaryOnly[1], draft);
 assert.equal(persistence.stageCourseLesson([draft], old), null);
});

test('the course editor never assigns the last saved lesson ID to an open new draft', async t => {
 const state = [];
 let slot = 0;
 const react = {
  createContext: () => ({ Provider: () => null }),
  useState(value) {
   const index = slot++;
   if (!(index in state)) state[index] = typeof value === 'function' ? value() : value;
   return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
  },
  useRef(value) {
   const index = slot++;
   return state[index] ??= { current: value };
  },
  useCallback: value => value,
  useEffect: () => {},
 };
 const requests = [];
 const oldLesson = { id: 'old-id', title: 'Work, Energy & Power', slidesCount: 97, isContentLoaded: false, slides: [], questions: [], assignments: [], attachments: [] };
 let respond;
 const { CourseEditorProvider } = load('../../src/components/course-editor/CourseEditorContext.tsx', {
  react,
  'next/navigation': { useSearchParams: () => new URLSearchParams('id=course-1'), useRouter: () => ({ push() {} }) },
  '@/lib/bilingualMetadata': bilingual,
  '@/lib/egyptTime': egyptTime,
  '@/lib/courseCreatePersistence': persistence,
  '@/lib/courseLessonSummary': lessonSummary,
  '@/hooks/useDeletionPolicy': { useDeletionPolicy: () => true },
  '@/context/NotificationContext': { useNotification: () => ({ showToast: (_, level) => assert.notEqual(level, 'error') }) },
  '@/contexts/LanguageContext': { useLanguage: () => ({ language: 'en' }) },
  '@/lib/offlineSync': { captureOfflineOwner: () => null, offlineSync: { getDraftStorageKey: () => null, removeByUrl: async () => {} } },
  '@/lib/api': { API_URL: '/api', apiFetch: async (url, options) => {
   if (!options.method) return new Response(JSON.stringify({ id: 'course-1', title: 'Physics', updatedAt: '2026-11-15T10:00:00Z', lessons: [] }));
   requests.push({ url, body: JSON.parse(options.body) });
   return new Promise(resolve => { respond = resolve; });
  } },
 });
 const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
 Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'fixture-session' } });
 t.after(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
 });
 const render = () => { slot = 0; return CourseEditorProvider({ role: 'SUPER_ADMIN', children: null }).props.value; };
 let editor = render();
 await editor.fetchCourseData('fixture-session', 'course-1');
 editor.setLessons([oldLesson]);
 editor.openAddLessonModal();
 editor = render();
 editor.setCurrentLesson(lesson => ({ ...lesson, title: 'Gravitation' }));
 editor = render();
 await editor.handleSubmit(undefined, true);
 assert.equal(requests.length, 0);
 assert.equal(render().currentLesson.id, undefined);

 const saving = editor.saveLesson();
 await Promise.resolve();
 const sent = requests[0].body.lessons;
 assert.equal(sent[0].id, oldLesson.id);
 assert.equal(sent[0].slides, undefined);
 assert.equal(sent[1].id, undefined);
 assert.equal(sent[1].title, 'Gravitation');
 assert.ok(sent[1].newLessonId);
 editor.setCurrentLesson(lesson => ({ ...lesson, title: 'Updated during save' }));
 editor = render();
 respond(new Response(JSON.stringify({ updatedAt: '2026-11-15T10:40:00Z', lessons: [
  { ...oldLesson, slides: Array.from({ length: 97 }, (_, id) => ({ id })) },
  { id: sent[1].newLessonId, title: 'Gravitation', slides: sent[1].slides },
 ] })));
 await saving;
 editor = render();
 assert.equal(editor.lessons[0].title, oldLesson.title);
 assert.equal(editor.lessons[0].slidesCount, 97);
 assert.equal(editor.currentLesson.id, sent[1].newLessonId);
 assert.equal(editor.currentLesson.title, 'Updated during save');
 assert.equal(editor.hasUnsavedChanges, true);
});

test('saving a lesson closes and resets the modal, blocks autosave on open modals, and keeps existing lessons intact when adding or importing another lesson', async t => {
 const state = [];
 let slot = 0;
 const react = {
  createContext: () => ({ Provider: () => null }),
  useState(value) {
   const index = slot++;
   if (!(index in state)) state[index] = typeof value === 'function' ? value() : value;
   return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
  },
  useRef(value) {
   const index = slot++;
   return state[index] ??= { current: value };
  },
  useCallback: value => value,
  useEffect: () => {},
 };
 const requests = [];
 let versionCounter = 1;
 let serverLessons = [];
 const { CourseEditorProvider } = load('../../src/components/course-editor/CourseEditorContext.tsx', {
  react,
  'next/navigation': { useSearchParams: () => new URLSearchParams('id=physics-course'), useRouter: () => ({ push() {} }) },
  '@/lib/bilingualMetadata': bilingual,
  '@/lib/egyptTime': egyptTime,
  '@/lib/courseCreatePersistence': persistence,
  '@/lib/courseLessonSummary': lessonSummary,
  '@/hooks/useDeletionPolicy': { useDeletionPolicy: () => true },
  '@/context/NotificationContext': { useNotification: () => ({ showToast: (_, level) => assert.notEqual(level, 'error') }) },
  '@/contexts/LanguageContext': { useLanguage: () => ({ language: 'en' }) },
  '@/lib/offlineSync': { captureOfflineOwner: () => null, offlineSync: { getDraftStorageKey: () => null, removeByUrl: async () => {} } },
  '@/lib/api': { API_URL: '/api', apiFetch: async (url, options) => {
   if (!options?.method) {
    return new Response(JSON.stringify({ id: 'physics-course', title: 'Physics', updatedAt: '2026-11-15T10:00:00.000Z', lessons: [] }));
   }
   const body = JSON.parse(options.body);
   requests.push({ url, body });
   serverLessons = body.lessons.map(l => ({
    ...l,
    id: l.id || l.newLessonId,
    updatedAt: `2026-11-15T10:00:0${versionCounter}.000Z`,
   }));
   versionCounter += 1;
   return new Response(JSON.stringify({
    updatedAt: `2026-11-15T10:00:0${versionCounter}.000Z`,
    lessons: serverLessons,
   }));
  } },
 });
 const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
 Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'fixture-session' } });
 t.after(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
 });

 const render = () => { slot = 0; return CourseEditorProvider({ role: 'SUPER_ADMIN', children: null }).props.value; };
 let editor = render();
 await editor.fetchCourseData('fixture-session', 'physics-course');
 editor = render();

 // 1. Add and save Lesson 1 ("Work, Energy & Power")
 editor.openAddLessonModal();
 editor = render();
 editor.setCurrentLesson(prev => ({ ...prev, title: 'Work, Energy & Power' }));
 editor = render();
 await editor.saveLesson();
 editor = render();

 assert.equal(editor.isLessonModalOpen, false);
 assert.equal(editor.currentLesson.id, undefined);
 assert.equal(editor.currentLesson.title, '');
 assert.equal(editor.lessons.length, 1);
 const firstLessonId = editor.lessons[0].id;
 assert.equal(editor.lessons[0].title, 'Work, Energy & Power');

 // 2. Reopen Lesson 1 and confirm autosave is blocked while modal is open even though lesson has an id
 editor.setCurrentLesson({ ...editor.lessons[0], title: 'Edited In Modal' });
 editor.setIsLessonModalOpen(true);
 editor = render();
 const requestsBeforeAuto = requests.length;
 await editor.handleSubmit(undefined, true);
 assert.equal(requests.length, requestsBeforeAuto);
 editor.setIsLessonModalOpen(false);
 editor = render();

 // 3. Add Lesson 2 ("Gravitation") and verify Lesson 1 stays intact
 editor.openAddLessonModal();
 editor = render();
 editor.setCurrentLesson(prev => ({ ...prev, title: 'Gravitation' }));
 editor = render();
 await editor.saveLesson();
 editor = render();

 assert.equal(editor.lessons.length, 2);
 assert.equal(editor.lessons[0].id, firstLessonId);
 assert.equal(editor.lessons[0].title, 'Work, Energy & Power');
 assert.equal(editor.lessons[1].title, 'Gravitation');
 assert.notEqual(editor.lessons[1].id, firstLessonId);

 // 4. Import a third lesson via addImportedLesson -> gets a distinct newLessonId and preserves previous lessons
 editor.addImportedLesson({ title: 'Optics', slides: [{ id: 'opt-1', type: 'TEXT', content: '<p>Light</p>' }] });
 editor = render();
 assert.equal(editor.lessons.length, 3);
 assert.equal(editor.lessons[2].id, undefined);
 assert.ok(editor.lessons[2].newLessonId);
 assert.equal(editor.lessons[2].isContentLoaded, true);
 assert.equal(editor.lessons[0].title, 'Work, Energy & Power');
 assert.equal(editor.lessons[1].title, 'Gravitation');
});

test('CourseEditorContext sets originalTitle on openEditLessonModal and rolls back optimistic lessons on 400 error', async t => {
 const state = [];
 let slot = 0;
 const react = {
  createContext: () => ({ Provider: () => null }),
  useState(value) {
   const index = slot++;
   if (!(index in state)) state[index] = typeof value === 'function' ? value() : value;
   return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
  },
  useRef(value) {
   const index = slot++;
   return state[index] ??= { current: value };
  },
  useCallback: value => value,
  useEffect: () => {},
 };
 let failNextSave = false;
 const { CourseEditorProvider } = load('../../src/components/course-editor/CourseEditorContext.tsx', {
  react,
  'next/navigation': { useSearchParams: () => new URLSearchParams('id=physics-course'), useRouter: () => ({ push() {} }) },
  '@/lib/bilingualMetadata': bilingual,
  '@/lib/egyptTime': egyptTime,
  '@/lib/courseCreatePersistence': persistence,
  '@/lib/courseLessonSummary': lessonSummary,
  '@/hooks/useDeletionPolicy': { useDeletionPolicy: () => true },
  '@/context/NotificationContext': { useNotification: () => ({ showToast: () => {} }) },
  '@/contexts/LanguageContext': { useLanguage: () => ({ language: 'en' }) },
  '@/lib/offlineSync': { captureOfflineOwner: () => null, offlineSync: { getDraftStorageKey: () => null, removeByUrl: async () => {} } },
  '@/lib/api': { API_URL: '/api', apiFetch: async (_url, options) => {
   if (!options?.method) {
    return new Response(JSON.stringify({
     id: 'physics-course',
     title: 'Physics',
     updatedAt: '2026-11-15T10:00:00.000Z',
     lessons: [{ id: 'wep-id', title: 'Work, Energy & Power', slides: [], questions: [], assignments: [], attachments: [] }],
    }));
   }
   if (failNextSave) {
    return new Response(JSON.stringify({ error: 'Rejected by server' }), { status: 400 });
   }
   const body = JSON.parse(options.body);
   return new Response(JSON.stringify({ updatedAt: '2026-11-15T10:01:00.000Z', lessons: body.lessons }));
  } },
 });
 const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
 Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'fixture-session' } });
 t.after(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
 });

 const render = () => { slot = 0; return CourseEditorProvider({ role: 'SUPER_ADMIN', children: null }).props.value; };
 let editor = render();
 await editor.fetchCourseData('fixture-session', 'physics-course');
 editor = render();

 await editor.openEditLessonModal(0);
 editor = render();
 assert.equal(editor.currentLesson.originalTitle, 'Work, Energy & Power');

 failNextSave = true;
 editor.openAddLessonModal();
 editor = render();
 editor.setCurrentLesson(prev => ({ ...prev, title: 'Gravitation' }));
 editor = render();
 await editor.saveLesson();
 editor = render();

 assert.equal(editor.lessons.length, 1);
 assert.equal(editor.lessons[0].title, 'Work, Energy & Power');
});
