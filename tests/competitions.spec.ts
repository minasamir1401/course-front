import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession } from './helpers/studentWorkspace';
// Functional API mocks must not be bypassed by service-worker-originated requests.
test.use({ serviceWorkers: 'block' });
const settings = { enabled: true, publicBoard: false, sound: true, motion: true, leaderboard: true };
const summary = { id: 'room', title: 'تحدي الرياضيات', titleEn: 'Math challenge', description: 'Learn and compete', mode: 'SELF_PACED', status: 'OPEN', teams: false, questionCount: 2, participants: 1, capacity: 200, currentIndex: -1, prizePlaces: 3, sourceKind: 'COURSE', schoolName: 'School' };
for (const language of ['ar', 'en']) test(`real play flow and bilingual competition pages ${language}`, async ({ page }) => {
  test.setTimeout(120000); await studentSession(page, language); await page.route('https://fonts.googleapis.com/**', r => r.abort()); await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  let joined = false, active = false, index = 0, score = 0, savedProfile = false;
  const state = () => ({ room: summary, policy: settings, serverNow: new Date().toISOString(), admin: false, entry: joined ? { id: 'entry', score, correct: index, currentIndex: index, rank: 1, team: 0, finishedAt: index === 2 ? new Date().toISOString() : null, answered: false } : null,
    question: active && index < 2 ? { id: `q${index}`, text: '٢ + ٢ = ؟', textEn: '2 + 2 = ?', options: ['٤', '٣', '٥', '٦'], optionsEn: ['4', '3', '5', '6'], index, seconds: 30, startedAt: new Date().toISOString() } : null,
    feedback: index ? { questionId: `q${index - 1}`, correct: true, points: 140, correctIndex: 0 } : null, leaders: joined ? [{ rank: 1, name: 'Adam', score, correct: index, isMe: true }] : [], teamScores: [] });
  await page.route('**/api/competitions**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/profile')) { if (route.request().method() === 'PUT') savedProfile = true; return route.fulfill({ json: { profile: { sound: false, motion: false, publicName: false }, policy: settings } }); }
    if (path.endsWith('/leaderboard')) return route.fulfill({ json: { enabled: true, items: [], period: 'WEEK' } });
    if (path === '/api/competitions') return route.fulfill({ json: { items: [summary], policy: settings } });
    if (path.endsWith('/join')) joined = true;
    if (path.endsWith('/start-question')) active = true;
    if (path.endsWith('/answer')) { expect(route.request().postDataJSON().selectedIndex).toBe(0); expect(route.request().postDataJSON().score).toBeUndefined(); index++; score += 140; active = false; }
    return route.fulfill({ json: state() });
  });
  await page.route('**/api/auth/me', r => r.fulfill({ json: { authenticated: true, user: { id: 'me', role: 'STUDENT' } } }));
  await page.goto('/competitions'); await expect(page.getByRole('heading', { name: language === 'ar' ? summary.title : summary.titleEn, exact: true })).toBeVisible();
  await page.getByRole('button', { name: language === 'ar' ? 'حفظ التفضيلات' : 'Save preferences', exact: true }).click(); await expect.poll(() => savedProfile).toBe(true);
  for (const width of [320, 390, 768, 1536]) { await page.setViewportSize({ width, height: 920 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  await page.getByRole('link', { name: language === 'ar' ? 'افتح المنافسة' : 'Open competition', exact: true }).click();
  await expect(page).toHaveURL(/\/competitions\/room$/, { timeout: 30000 });
  await page.getByRole('button', { name: language === 'ar' ? 'انضم للمنافسة' : 'Join competition', exact: true }).click();
  await page.getByRole('button', { name: language === 'ar' ? 'ابدأ السؤال الأول' : 'Start first question', exact: true }).click();
  await expect(page.getByRole('heading', { name: language === 'ar' ? '٢ + ٢ = ؟' : '2 + 2 = ?', exact: true })).toBeVisible();
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await page.setViewportSize({ width: 390, height: 920 }); await page.screenshot({ path: `../artifacts/competitions/play-${language}-390.png`, fullPage: true });
  await page.getByRole('button', { name: language === 'ar' ? '٤' : '4', exact: true }).click();
  await page.getByRole('button', { name: language === 'ar' ? 'السؤال التالي' : 'Next question', exact: true }).click(); await page.getByRole('button', { name: language === 'ar' ? '٤' : '4', exact: true }).click();
  await expect(page.getByText(language === 'ar' ? '280 نقطة منافسات' : '280 competition points', { exact: true })).toBeVisible(); await expect.poll(() => index).toBe(2);
});
test('install invitation opens immediately, returns after thirty minutes and stops once installed', async ({ page }) => {
  test.setTimeout(90000); await page.route('https://fonts.googleapis.com/**', r => r.abort()); await page.route('**/api/public/competitions/**', r => r.fulfill({ json: { enabled: false, items: [] } }));
  await page.clock.install({ time: new Date('2026-10-21T12:00:00Z') }); await page.goto('/'); const invite = page.getByRole('complementary', { name: 'تثبيت تطبيق Klevro', exact: true });
  await expect(invite).toBeVisible(); await page.getByRole('button', { name: 'لاحقًا', exact: true }).click(); await expect(invite).toBeHidden();
  await page.clock.fastForward(29 * 60000); await expect(invite).toBeHidden(); await page.clock.fastForward(60000); await expect(invite).toBeVisible();
  await page.getByRole('button', { name: 'إخفاء دعوة التثبيت', exact: true }).click(); await page.reload(); await expect(invite).toBeHidden(); await page.clock.fastForward(30 * 60000); await expect(invite).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); await expect(invite).toBeHidden(); await page.clock.fastForward(60 * 60000); await expect(invite).toBeHidden();
  await page.reload(); await expect(invite).toBeHidden();
  await page.goto('/login'); await expect(page.locator('a[href="/#account-help"]')).toHaveCount(0);
});
test('live competition follows the host, displays teams and accepts an answer once', async ({ page }) => {
  test.setTimeout(60000); await studentSession(page, 'en'); await page.route('https://fonts.googleapis.com/**', r => r.abort()); await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  let joined = false, started = false, answered = false, submissions = 0; const startedAt = new Date().toISOString();
  const state = () => ({ room: { ...summary, mode: 'LIVE', teams: true, currentIndex: started ? 0 : -1 }, policy: settings, serverNow: new Date().toISOString(), entry: joined ? { score: answered ? 140 : 0, correct: answered ? 1 : 0, currentIndex: 0, rank: 1, team: 1, finishedAt: null, answered } : null, question: started ? { id: 'live-q', text: 'Question', textEn: 'Live question', options: ['A', 'B'], seconds: 60, index: 0, startedAt } : null, feedback: answered ? { questionId: 'live-q', correct: true, points: 140, correctIndex: 0 } : null, leaders: joined ? [{ rank: 1, name: 'Adam', score: answered ? 140 : 0, correct: answered ? 1 : 0, team: 1 }] : [], teamScores: [{ team: 1, score: answered ? 140 : 0, members: 1 }] });
  await page.route('**/api/competitions**', route => { const path = new URL(route.request().url()).pathname; if (path.endsWith('/profile')) return route.fulfill({ json: { profile: { sound: false, motion: false }, policy: settings } }); if (path.endsWith('/join')) joined = true; if (path.endsWith('/answer')) { submissions++; answered = true; } return route.fulfill({ json: state() }); });
  await page.goto('/competitions/room'); await page.getByRole('button', { name: 'Join competition', exact: true }).click(); await expect(page.getByRole('heading', { name: 'You’re in the lobby', exact: true })).toBeVisible();
  started = true; await expect(page.getByRole('heading', { name: 'Live question', exact: true })).toBeVisible({ timeout: 10000 }); await page.getByRole('button', { name: 'A', exact: true }).click(); await expect(page.getByRole('status').filter({ hasText: 'Well done!' })).toBeVisible(); await expect(page.getByRole('button', { name: 'A', exact: true })).toBeDisabled(); expect(submissions).toBe(1); await expect(page.getByText('Team 2: 140 points · 1 players', { exact: true })).toBeVisible();
});
test('public leaderboard renders actual API rows and responds to period selection', async ({ page }) => {
  test.setTimeout(60000); await page.route('https://fonts.googleapis.com/**', r => r.abort()); await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now()))); const periods: string[] = [];
  await page.route('**/api/public/competitions/leaderboard*', route => { periods.push(new URL(route.request().url()).searchParams.get('period') || ''); return route.fulfill({ json: { enabled: true, items: ['Adam', 'Mina', 'Sara', 'Omar', 'Nour'].map((name, index) => ({ rank: index + 1, name, school: `School ${index + 1}`, score: 800 - index * 100, correct: 4, competitions: 2 })) } }); });
  await page.goto('/'); const board = page.getByRole('region', { name: 'لوحة متصدري المنافسات', exact: true }); await expect(board.getByRole('heading', { name: 'Adam', exact: true })).toBeVisible(); await expect(board.locator('article')).toHaveCount(5); await board.getByRole('button', { name: 'هذا الشهر', exact: true }).click(); await expect.poll(() => periods.includes('MONTH')).toBe(true);
  for (const width of [390, 1264]) { await page.setViewportSize({ width, height: 920 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await board.scrollIntoViewIfNeeded(); await page.screenshot({ path: `../artifacts/competitions/public-${width}.png`, fullPage: true }); }
});
