import { serverSession } from './helpers/serverSession';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import ts from 'typescript';

for (const language of ['ar', 'en']) test('modern student arena: audible outcomes, mute/re-enable, timer and completion (' + language + ')', async ({ page }) => {
  test.setTimeout(90000);
  const ar = language === 'ar', text = (a: string, e: string) => ar ? a : e;
  await page.setViewportSize({ width: 1480, height: 676 });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await serverSession(page);
  await page.addInitScript(language => {
    localStorage.setItem('lms_user', JSON.stringify({ id: 'student', role: 'STUDENT', schoolId: 'own' }));
    localStorage.setItem('lms_token', 'cookie_auth'); localStorage.setItem('lms_lang', language);
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
    const probe = { frequencies: [] as number[], contexts: [] as AudioContext[], immediateStops: 0 };
    (window as any).__gameAudio = probe;
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor() { super(); probe.contexts.push(this); }
      createOscillator() {
        const oscillator = super.createOscillator();
        const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency), stop = oscillator.stop.bind(oscillator);
        oscillator.frequency.setValueAtTime = (value, at) => { probe.frequencies.push(value); return set(value, at); };
        oscillator.stop = at => { if (at === undefined) probe.immediateStops++; stop(at); };
        return oscillator;
      }
    };
  }, language);
  let joined = false, index = 0, startedAt: string | null = null, score = 0, correct = 0;
  let feedback: any = null, prefs = { sound: false, motion: false, publicName: true };
  const questions = [
    { id: 'q1', type: 'MCQ', text: 'ما ناتج ٢ + ٣؟', textEn: 'What is 2 + 3?', options: ['٤', '٥', '٦', '٧'], optionsEn: ['4', '5', '6', '7'], correct: 1 },
    { id: 'q2', type: 'MULTI_SELECT', text: 'اختر الأعداد الزوجية', textEn: 'Choose the even numbers', options: ['٢', '٣', '٤'], optionsEn: ['2', '3', '4'], correct: [0, 2] },
    { id: 'q3', type: 'TEXT', text: 'اكتب العدد أربعة', textEn: 'Write the number four', options: [], correct: '4' },
    { id: 'q4', type: 'TRUE_FALSE', text: 'الأرض كوكب.', textEn: 'Earth is a planet.', options: ['True', 'False'], correct: 0 },
  ];
  const state = () => ({
    room: { id: 'room', title: 'تحدّي أبطال الرياضيات', titleEn: 'Math champions challenge', description: 'كل سؤال فرصة جديدة للتعلّم والإنجاز', descriptionEn: 'Every question is a chance to learn and achieve', mode: 'SELF_PACED', status: 'OPEN', scoringMode: 'POINTS', questionCount: 4, participants: 8 },
    policy: { enabled: true, sound: true, motion: false, leaderboard: true }, serverNow: new Date().toISOString(),
    entry: joined ? { id: 'entry', currentIndex: index, score, correct, rank: 2, finishedAt: index >= 4 ? new Date().toISOString() : null } : null,
    question: joined && startedAt && index < 4 ? { ...questions[index], index, startedAt, seconds: 45, points: 100, correct: undefined } : null,
    feedback, leaders: [{ rank: 1, name: 'مريم', correct: 3, score: 300 }, { rank: 2, name: 'أحمد', correct, score, isMe: true }, { rank: 3, name: 'عمر', correct: 1, score: 100 }],
  });
  await page.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'student', role: 'STUDENT', schoolId: 'own' } } });
    if (path === '/api/competitions/profile') { if (req.method() === 'PUT') prefs = { ...prefs, ...req.postDataJSON() }; return route.fulfill({ json: { profile: prefs } }); }
    if (path === '/api/competitions/room/join') joined = true;
    if (path === '/api/competitions/room/start-question') startedAt = new Date().toISOString();
    if (path === '/api/competitions/room/answer') {
      const body = req.postDataJSON(), q = questions[index];
      const good = index === 0 ? body.selectedIndex === 1 : index === 1 ? Array.isArray(body.answer) && body.answer.length === 2 : index === 2 ? body.answer === '4' : body.selectedIndex === 0;
      score += good ? 100 : 0; correct += good ? 1 : 0;
      feedback = { questionId: q.id, correct: good, points: good ? 100 : 0, correctAnswer: index === 0 ? '٥' : index === 1 ? ['٢', '٤'] : index === 2 ? '4' : 'True', correctAnswerEn: index === 0 ? '5' : index === 1 ? ['2', '4'] : index === 2 ? '4' : 'True' };
      index++; startedAt = null;
    }
    if (path.startsWith('/api/competitions/room')) return route.fulfill({ json: state() });
    return route.fulfill({ json: {} });
  });
  const frequencies = () => page.evaluate(() => (window as any).__gameAudio.frequencies as number[]);
  await page.goto('/competitions/room');
  await expect(page.getByRole('heading', { name: text('جاهز تتحدّى نفسك؟', 'Ready to challenge yourself?') })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__gameAudio.contexts.length)).toBe(0);
  await page.getByRole('button', { name: text('تشغيل الصوت', 'Enable sound'), exact: true }).click();
  await page.getByRole('button', { name: text('تجربة الصوت', 'Test sound'), exact: true }).click();
  await expect.poll(async () => (await frequencies()).includes(783.99)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__gameAudio.contexts[0].state)).toBe('running');
  expect(prefs.publicName).toBe(true);
  await page.getByRole('button', { name: text('انضم للمنافسة', 'Join competition'), exact: true }).click();
  await page.getByRole('button', { name: text('ابدأ السؤال الأول', 'Start first question'), exact: true }).click();
  await expect(page.getByRole('region', { name: text('سؤال التحدي', 'Challenge question') })).toBeVisible();
  const lastChoice = await page.locator('[data-answer-option]').last().boundingBox();
  expect(lastChoice!.y + lastChoice!.height).toBeLessThanOrEqual(676);
  await page.screenshot({ path: '../artifacts/competition-play-' + language + '-desktop.png', fullPage: true });
  for (const width of [320, 390, 768, 1480]) { await page.setViewportSize({ width, height: 1000 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  const audit = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: '../artifacts/competition-play-' + language + '-mobile.png', fullPage: true });
  await page.evaluate(() => { (window as any).__gameAudio.frequencies = []; });
  await page.getByRole('button', { name: ar ? '٤' : '4', exact: true }).click();
  await expect(page.getByRole('status', { name: text('نتيجة الإجابة', 'Answer result') })).toContainText(text('مش مشكلة', 'Keep going'));
  const feedbackAudit = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(feedbackAudit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await expect.poll(async () => (await frequencies()).includes(392)).toBe(true);
  await page.getByRole('button', { name: text('كتم الصوت', 'Mute sound'), exact: true }).click();
  const mutedCount = (await frequencies()).length;
  await page.getByRole('button', { name: text('السؤال التالي', 'Next question'), exact: true }).click();
  await page.getByRole('checkbox', { name: ar ? '٢' : '2', exact: true }).check();
  await page.getByRole('checkbox', { name: ar ? '٤' : '4', exact: true }).check();
  await page.getByRole('button', { name: text('تأكيد الإجابة', 'Submit answer'), exact: true }).click();
  await expect(page.getByRole('status', { name: text('نتيجة الإجابة', 'Answer result') })).toContainText(text('إجابة رائعة', 'Great answer'));
  expect((await frequencies()).length).toBe(mutedCount);
  await page.getByRole('button', { name: text('تشغيل الصوت', 'Enable sound'), exact: true }).click();
  await page.getByRole('button', { name: text('السؤال التالي', 'Next question'), exact: true }).click();
  await page.getByRole('textbox', { name: text('إجابتك', 'Your answer'), exact: true }).fill('4');
  await page.evaluate(() => { (window as any).__gameAudio.frequencies = []; });
  await page.getByRole('button', { name: text('تأكيد الإجابة', 'Submit answer'), exact: true }).click();
  await expect.poll(async () => (await frequencies()).includes(1046.5)).toBe(true);
  await page.getByRole('button', { name: text('السؤال التالي', 'Next question'), exact: true }).click();
  await page.getByRole('button', { name: ar ? 'صحيح' : 'True', exact: true }).click();
  await expect(page.getByText('300 ' + text('نقطة منافسات', 'competition points'), { exact: true })).toBeVisible();
  await expect.poll(async () => (await frequencies()).includes(1318.51)).toBe(true);
  await expect(page.getByRole('heading', { name: text('أداء رائع… تستاهل الاحتفال!', 'Great performance. Time to celebrate!') })).toBeVisible();
  const finalAudit = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(finalAudit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await page.screenshot({ path: '../artifacts/competition-play-' + language + '-finish.png', fullPage: true });
});

test('game sound engine renders distinct non-silent, unclipped audio for every outcome', async ({ page }) => {
  const compiled = ts.transpileModule(fs.readFileSync('src/components/competitions/gameAudio.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const output = await page.evaluate(async source => {
    const exported: any = {}; new Function('exports', source)(exported);
    const result: any = {};
    for (const cue of ['start', 'select', 'correct', 'incorrect', 'warning', 'victory', 'complete']) {
      const audio = new OfflineAudioContext(1, 105600, 48000);
      exported.scheduleGameCue(audio, cue);
      const samples = (await audio.startRendering()).getChannelData(0);
      let peak = 0, energy = 0, last = 0;
      for (let index = 0; index < samples.length; index++) { const sample = samples[index]; peak = Math.max(peak, Math.abs(sample)); energy += sample * sample; if (Math.abs(sample) > .001) last = index; }
      result[cue] = { peak, rms: Math.sqrt(energy / samples.length), duration: last / 48000 };
    }
    return result;
  }, compiled);
  for (const metrics of Object.values(output) as any[]) { expect(metrics.peak).toBeGreaterThan(.025); expect(metrics.peak).toBeLessThan(.95); expect(metrics.rms).toBeGreaterThan(.001); }
  expect(output.victory.duration).toBeGreaterThan(output.correct.duration);
  expect(output.correct.duration).not.toBe(output.incorrect.duration);
  expect(output.select.duration).toBeLessThan(.15);
});

test('last five seconds play warning tones and submit a timed-out answer once', async ({ page }) => {
  let answerCalls = 0, start = 0;
  await serverSession(page);
  await page.addInitScript(() => {
    localStorage.setItem('lms_user', JSON.stringify({ id: 'student', role: 'STUDENT' })); localStorage.setItem('lms_token', 'cookie_auth'); localStorage.setItem('lms_lang', 'en'); localStorage.setItem('klevro-install-dismissed', String(Date.now()));
    (window as any).__warningTones = [];
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = original.call(this), set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
      oscillator.frequency.setValueAtTime = (value, at) => { (window as any).__warningTones.push(value); return set(value, at); };
      return oscillator;
    };
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'student', role: 'STUDENT' } } });
    if (path === '/api/competitions/profile') return route.fulfill({ json: { profile: { sound: true, motion: false } } });
    if (path === '/api/competitions/room/answer') { answerCalls++; expect(route.request().postDataJSON().selectedIndex).toBeNull(); }
    if (path.startsWith('/api/competitions/room')) {
      start ||= Date.now();
      return route.fulfill({ json: { room: { id: 'room', title: 'Timer challenge', mode: 'SELF_PACED', status: 'OPEN', questionCount: 1 }, policy: { enabled: true, sound: true, motion: false }, serverNow: new Date().toISOString(), entry: { id: 'entry', score: 0, correct: 0, currentIndex: answerCalls ? 1 : 0, finishedAt: answerCalls ? new Date().toISOString() : null }, question: answerCalls ? null : { id: 'q', text: 'Wait for the timer', type: 'MCQ', options: ['A', 'B'], index: 0, seconds: 7, startedAt: new Date(start).toISOString() }, feedback: answerCalls ? { questionId: 'q', correct: false, points: 0, correctAnswer: 'B' } : null } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto('/competitions/room');
  await page.getByRole('button', { name: 'Test sound', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__warningTones.includes(1046.5)), { timeout: 7000 }).toBe(true);
  await expect.poll(() => answerCalls, { timeout: 10000 }).toBe(1);
  await expect(page.getByText('0 competition points', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Test sound', exact: true }).click();
  expect(answerCalls).toBe(1);
});
