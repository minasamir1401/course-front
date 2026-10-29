import { serverSession } from './helpers/serverSession';
import { test, expect, Page } from '@playwright/test';
import { studentSession, course, lesson } from './helpers/studentWorkspace';

const evidence = { sampleSize: 3, strengths: [{ name: 'الجبر', percent: 90, total: 10 }], needsPractice: [{ name: 'المصفوفات', percent: 40, total: 5, evidenceLevel: 'SUFFICIENT' }], nextLessons: [{ id: 'lesson', title: 'مراجعة المصفوفات', courseTitle: 'الرياضيات', href: '/lessons/lesson?courseId=course' }], recentExams: [{ title: 'اختبار الجبر', percentage: 65, date: '2026-10-27' }], completedLessons: 2, availableLessons: 5, explanation: 'Based on released results.' };
const insight = { student: { name: 'Student' }, insight: { evidence, narrative: null, generatedAt: '2026-10-27T10:00:00Z' } };

async function aiRoutes(page: Page) {
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/ai/**', r => {
    const path = new URL(r.request().url()).pathname;
    if (path.endsWith('/config')) return r.fulfill({ json: { enabled: true, starterPrompts: [] } });
    if (path.endsWith('/insight')) return r.fulfill({ json: insight });
    if (path.endsWith('/analyze')) return r.fulfill({ json: { ...insight, insight: { ...insight.insight, narrative: 'ابدأ بمراجعة المصفوفات، ثم حل مثالًا تدريبيًا.' } } });
    if (path.endsWith('/conversations')) return r.fulfill({ json: { conversations: [] } });
    if (path === '/api/ai/public/chat') return r.fulfill({ json: { model: 'openai/gpt-oss-120b', content: 'أهلًا! ابدأ بتسجيل الدخول إلى حسابك، ثم افتح مقرراتك ودروسك. ستجد تقدمك في لوحة التحكم والتقارير.' } });
    if (path.endsWith('/chat')) return r.fulfill({ json: { conversationId: 'thread', model: 'openai/gpt-oss-120b', content: 'أهلًا. آخر نتيجة مسجّلة لك 65%. راجع المصفوفات أولًا.', sources: [{ label: 'نتائجك وتقدّمك المسجّل' }] } });
    return r.fulfill({ json: {} });
  });
}
async function studentAi(page: Page, language = 'ar') {
  await studentSession(page, language);
  await page.route('**/api/auth/me', r => r.fulfill({ json: { authenticated: true, user: { id: 'me', name: 'Student', role: 'STUDENT', schoolId: 'school' } } }));
  await aiRoutes(page);
}

for (const language of ['ar', 'en']) test(`homepage AI entry opens the same chat on desktop and mobile ${language}`, async ({ page }) => {
  await page.addInitScript(lang => { localStorage.setItem('lms_lang', lang); localStorage.setItem('klevro-install-dismissed', String(Date.now())); }, language);
  await aiRoutes(page);
  for (const width of [1191, 390]) {
    await page.setViewportSize({ width, height: 676 });
    await page.goto('/');
    const launcher = page.getByRole('button', { name: language === 'ar' ? 'افتح مساعد Klevro' : 'Open Klevro assistant', exact: true });
    await expect(launcher).toBeInViewport();
    await expect(launcher.locator('span').first()).toBeVisible();
    await page.getByRole('button', { name: language === 'ar' ? 'اسأل مساعد Klevro' : 'Ask Klevro AI', exact: true }).click();
    await expect(launcher).toHaveAttribute('aria-expanded', 'true');
    const close = page.getByRole('button', { name: language === 'ar' ? 'إغلاق المساعد' : 'Close assistant', exact: true });
    await expect(close).toBeInViewport();
    await close.click();
    await launcher.click();
    await expect(close).toBeInViewport();
    await close.click();
    expect(new URL(page.url()).pathname).toBe('/');
  }
});

test('public assistant entries respect the administrator disabled setting', async ({ page }) => {
  await aiRoutes(page);
  await page.route('**/api/ai/public/config', route => route.fulfill({ json: { enabled: false } }));
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('button', { name: /افتح مساعد Klevro|Open Klevro assistant|اسأل مساعد Klevro|Ask Klevro AI/ })).toHaveCount(0);
});

test('public assistant explains the platform with no personal context or account endpoint', async ({ page }) => {
  const privateCalls: string[] = [];
  await page.addInitScript(() => localStorage.setItem('lms_lang', 'ar'));
  await aiRoutes(page);
  page.on('request', request => { if (/\/api\/ai\/(student|chat|conversations)/.test(request.url())) privateCalls.push(request.url()); });
  await page.goto('/');
  await page.getByRole('button', { name: 'افتح مساعد Klevro', exact: true }).click();
  await expect(page.getByRole('button', { name: 'إغلاق المساعد', exact: true })).toBeInViewport();
  const chat = page.getByRole('region', { name: 'محادثة مع مساعد Klevro' });
  await expect(chat).toContainText('كل ما تحتاج تعرفه عن المنصة');
  await chat.getByRole('textbox', { name: 'رسالتك للمساعد' }).fill('إزاي أبدأ؟');
  await chat.getByRole('button', { name: 'إرسال', exact: true }).click();
  await expect(chat).toContainText('أهلًا!');
  expect(privateCalls).toEqual([]);
  await page.screenshot({ path: '../artifacts/ai-assistant/public-desktop.png', fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'إغلاق المساعد', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '../artifacts/ai-assistant/public-mobile.png', fullPage: false });
});

test('provider failure preserves the public chat draft without claiming the backend is offline, then retries successfully', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lms_lang', 'ar'));
  await aiRoutes(page);
  let calls = 0;
  await page.route('**/api/ai/public/chat', route => {
    calls++;
    return calls === 1
      ? route.fulfill({ status: 503, json: { code: 'AI_UNAVAILABLE', error: 'اتصالات الذكاء الاصطناعي المتاحة لا تستجيب حاليًا.' } })
      : route.fulfill({ json: { content: 'المساعد يعمل الآن، يمكنك متابعة سؤالك.', model: 'test' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'افتح مساعد Klevro', exact: true }).click();
  const chat = page.getByRole('region', { name: 'محادثة مع مساعد Klevro' });
  const input = chat.getByRole('textbox', { name: 'رسالتك للمساعد' });
  await input.fill('كيف أستفيد من دروسي؟');
  await chat.getByRole('button', { name: 'إرسال', exact: true }).click();
  await expect(chat).toContainText('اتصالات الذكاء الاصطناعي المتاحة لا تستجيب حاليًا.');
  await expect(input).toHaveValue('كيف أستفيد من دروسي؟');
  await expect(page.getByText(/تعذّر الوصول للخادم|قد تحتاج التغييرات المعلقة إلى مراجعة/)).toHaveCount(0);
  await chat.getByRole('button', { name: 'إرسال', exact: true }).click();
  await expect(chat).toContainText('المساعد يعمل الآن');
  await expect(input).toHaveValue('');
  expect(calls).toBe(2);
});

test('floating chat expands on the same page and preserves messages, draft and conversation when minimised', async ({ page }) => {
  await studentAi(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'افتح مساعد Klevro', exact: true }).click();
  const chat = page.getByRole('region', { name: 'محادثة مع مساعد Klevro' });
  const input = chat.getByRole('textbox', { name: 'رسالتك للمساعد' });
  await input.fill('حلل نتيجتي');
  await chat.getByRole('button', { name: 'إرسال', exact: true }).click();
  await expect(chat).toContainText('آخر نتيجة مسجّلة لك');
  await input.fill('رسالة لسه بكتبها');
  const url = page.url();
  const compact = await page.locator('#klevro-assistant').boundingBox();
  await chat.getByRole('button', { name: 'تكبير المحادثة', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'مساعد Klevro المكبّر' });
  await expect(dialog).toBeVisible();
  const expanded = await dialog.boundingBox();
  expect(expanded!.width).toBeGreaterThan(compact!.width * 2);
  expect(expanded!.height).toBeGreaterThan(compact!.height);
  expect(page.url()).toBe(url);
  await expect(input).toHaveValue('رسالة لسه بكتبها');
  await expect(chat).toContainText('آخر نتيجة مسجّلة لك');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await chat.getByRole('button', { name: 'سجل المحادثات', exact: true }).focus();
  await page.keyboard.press('Shift+Tab');
  expect(await chat.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(chat.getByRole('button', { name: 'تكبير المحادثة', exact: true })).toBeVisible();
  await expect(input).toHaveValue('رسالة لسه بكتبها');
  await page.setViewportSize({ width: 390, height: 844 });
  await chat.getByRole('button', { name: 'تكبير المحادثة', exact: true }).click();
  const mobile = await dialog.boundingBox();
  expect(mobile!.height).toBe(844); expect(mobile!.width).toBe(390);
  await expect(chat.getByRole('button', { name: 'تصغير المحادثة', exact: true })).toBeInViewport();
  await chat.getByRole('button', { name: 'تصغير المحادثة', exact: true }).click();
  const request = page.waitForRequest(r => r.url().endsWith('/api/ai/chat') && r.method() === 'POST');
  await chat.getByRole('button', { name: 'إرسال', exact: true }).click();
  expect((await request).postDataJSON().conversationId).toBe('thread');
  expect(page.url()).toBe(url);
});

test('learning insight prioritises practice with readable progress bars and responsive lesson cards', async ({ page }) => {
  await studentAi(page);
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.route('**/api/ai/student/insight', r => r.fulfill({ json: { insight: { evidence: {
    ...evidence,
    strengths: [{ name: 'استخدام اللغة', percent: 78, total: 9 }, { name: 'الفهم والتحليل', percent: 78, total: 9 }],
    needsPractice: [{ name: 'الجمع', percent: 13, total: 15, evidenceLevel: 'SUFFICIENT' }, { name: 'الطرح', percent: 0, total: 8, evidenceLevel: 'SUFFICIENT' }, { name: 'الضرب', percent: 14, total: 2, evidenceLevel: 'LIMITED' }],
    nextLessons: ['الطرح', 'الجمع', 'الضرب'].map((name, index) => ({ id: `l${index}`, title: `مراجعة ${name}`, courseTitle: 'أساسيات الحساب', href: `/lessons/l${index}?courseId=math` })),
  } } } }));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/dashboard');
  const card = page.getByRole('region', { name: 'تحليل تقدّمك وخطة المذاكرة' });
  await expect(card.getByRole('heading', { name: 'نراجع الطرح؟' })).toBeVisible();
  await expect(card.getByRole('link', { name: 'افتح درس المراجعة' })).toHaveAttribute('href', '/lessons/l0?courseId=math');
  await expect(card.getByRole('meter', { name: 'الطرح' })).toHaveAttribute('aria-valuenow', '0');
  await expect(card.getByRole('meter', { name: 'استخدام اللغة' })).toHaveAttribute('aria-valuenow', '78');
  await expect(card.getByText('مؤشر أولي · إجابات قليلة')).toBeVisible();
  const previewStyle = 'nav, [aria-label="افتح مساعد Klevro"] { visibility: hidden !important; }';
  await card.screenshot({ path: '../artifacts/ai-assistant/insight-redesign-desktop.png', style: previewStyle });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await card.screenshot({ path: '../artifacts/ai-assistant/insight-redesign-mobile.png', style: previewStyle });
});

for (const path of ['/dashboard', '/reports']) for (const language of ['ar', 'en']) test(`generated study summary is structured, copyable and restored on ${path} ${language}`, async ({ page }) => {
  await studentAi(page, language);
  await page.addInitScript(() => {
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).copiedStudyPlan = text; } } });
  });
  const ar = language === 'ar';
  const titles = ar ? ['ملخص تقدّمك', 'نقاط قوتك', 'أولويات المراجعة', 'خطوات تبدأ بيها'] : ['Your progress', 'Your strengths', 'Practice priorities', 'Your next steps'];
  const narrative = ar
    ? 'عندك بداية كويسة في الجبر، والمصفوفات هي أولويتك في المراجعة.\n\n## ملخص تقدّمك\nآخر نتيجة متاحة لك **65%**. المؤشرات مبنية على التقييمات المتاحة فقط.\n\n## نقاط قوتك\n- الجبر: **90%** من إجاباتك المسجلة.\n- استمر في تطبيق الأفكار اللي فهمتها.\n\n## أولويات المراجعة\nراجع المصفوفات، حيث دقة إجاباتك **40%**.\n\n## خطوات تبدأ بيها\n1. افتح [مراجعة المصفوفات](/lessons/lesson?courseId=course).\n2. افهم الفكرة الأساسية وطبّق مثالًا مشابهًا.\n3. ناقش الخطوة الصعبة مع مساعدك.'
    : 'You have a good start in algebra. Matrices are your next practice priority.\n\n## Your progress\nYour latest released score is **65%**. This summary uses released results only.\n\n## Your strengths\n- Algebra: **90%** accuracy in your recorded answers.\n- Keep applying the ideas you understand.\n\n## Practice priorities\nPractise matrices, where your recorded accuracy is **40%**.\n\n## Your next steps\n1. Open [matrix practice](/lessons/lesson?courseId=course).\n2. Review one concept and work through a similar example.\n3. Discuss the difficult step with your assistant.';
  let saved = insight, pending: any, requests = 0;
  await page.route('**/api/ai/student/insight', r => r.fulfill({ json: saved }));
  await page.route('**/api/ai/student/insight/analyze', r => { pending = r; requests++; });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(path);
  await page.getByRole('button', { name: ar ? 'حضّر لي خطة بالمساعد' : 'Create my AI study plan', exact: true }).click();
  const panel = page.getByRole('region', { name: ar ? 'ملخصك الدراسي وخطة المذاكرة' : 'Your study summary and plan' });
  await expect(panel).toHaveAttribute('aria-busy', 'true');
  await expect(panel.getByRole('status')).toContainText(ar ? 'بنجهّز' : 'Preparing');
  await expect.poll(() => Boolean(pending)).toBe(true);
  expect(pending.request().postDataJSON().language).toBe(language);
  saved = { ...insight, insight: { ...insight.insight, narrative, generatedAt: '2026-10-27T16:00:00Z' } } as any;
  await pending.fulfill({ json: saved });
  await expect(panel).toHaveAttribute('aria-busy', 'false');
  await expect(panel.getByRole('article')).toHaveCount(4);
  for (const title of titles) await expect(panel.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(panel.locator('ol>li')).toHaveCount(3);
  await expect(panel.getByRole('link')).toHaveAttribute('href', '/lessons/lesson?courseId=course');
  await panel.getByRole('button', { name: ar ? 'نسخ الملخص' : 'Copy summary', exact: true }).click();
  expect(await page.evaluate(() => (window as any).copiedStudyPlan)).toBe(narrative);
  if (ar) await panel.screenshot({ path: `../artifacts/ai-assistant/study-summary-${path.slice(1)}-desktop.png`, style: 'nav, [aria-label="افتح مساعد Klevro"]{visibility:hidden!important}' });
  await panel.getByRole('button', { name: ar ? 'طي الملخص' : 'Collapse summary', exact: true }).click();
  await expect(panel.getByRole('article')).toHaveCount(0);
  await panel.getByRole('button', { name: ar ? 'عرض الملخص' : 'Show summary', exact: true }).click();
  expect(requests).toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (ar) await panel.screenshot({ path: `../artifacts/ai-assistant/study-summary-${path.slice(1)}-mobile.png`, style: 'nav, [aria-label="افتح مساعد Klevro"]{visibility:hidden!important}' });
  await page.reload();
  await expect(panel).toContainText(ar ? 'محفوظ في حسابك' : 'Saved to your account');
  await panel.getByRole('button', { name: ar ? 'عرض الملخص' : 'Show summary', exact: true }).click();
  await expect(panel.getByRole('article')).toHaveCount(4); expect(requests).toBe(1);
});

for (const language of ['ar', 'en']) test(`AI navigation links render as action buttons and repair inline code without changing real code ${language}`, async ({ page }) => {
  await studentAi(page, language);
  const ar = language === 'ar';
  const login = ar ? 'تسجيل الدخول' : 'Log in', reports = ar ? 'تقارير الأداء' : 'Reports', lessonTitle = ar ? 'راجع درس الكسور' : 'Review fractions';
  const content = `**${ar ? 'ابدأ من هنا' : 'Start here'}**\n\n1. \`[${login}](/login)\`\n2. [${reports}](/reports)\n3. \`[${lessonTitle}](/lessons/review?courseId=course&section=1)\`\n4. \`/dashboard\`\n\n\`const score = 62\`\n\n\`[Unsafe](javascript:alert(1))\`\n\n\`\`\`markdown\n[${login}](/login)\n\`\`\``;
  await page.route('**/api/ai/chat', route => route.fulfill({ json: { model: 'test', content } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/assistant');
  await page.getByRole('textbox', { name: ar ? 'رسالتك للمساعد' : 'Your message' }).fill('Links');
  await page.getByRole('button', { name: ar ? 'إرسال' : 'Send', exact: true }).click();
  const reply = page.locator('[class*="markdown"]').last();
  await expect(reply.getByRole('link')).toHaveCount(4);
  await expect(reply.getByRole('link', { name: login, exact: true })).toHaveAttribute('href', '/login');
  await expect(reply.getByRole('link', { name: lessonTitle, exact: true })).toHaveAttribute('href', '/lessons/review?courseId=course&section=1');
  await expect(reply.locator('code').filter({ hasText: 'const score = 62' })).toBeVisible();
  await expect(reply.locator('pre code')).toContainText(`[${login}](/login)`);
  await expect(reply.locator('a[href^="javascript"], a[href^="https:"], button')).toHaveCount(0);
  for (const link of await reply.getByRole('link').all()) {
    expect(await link.evaluate(el => ({ display: getComputedStyle(el).display, height: el.getBoundingClientRect().height }))).toMatchObject({ display: 'inline-flex' });
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(40);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await reply.screenshot({ path: `../artifacts/ai-assistant/link-actions-${language}-mobile.png` });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await reply.screenshot({ path: `../artifacts/ai-assistant/link-actions-${language}-desktop.png` });
  await reply.getByRole('link', { name: reports, exact: true }).focus();
  await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/reports$/);
});

test('assistant renders legacy flat tables, friendly lesson links, lists and math without executing HTML', async ({ page }) => {
  await studentAi(page);
  const content = '&#x20;اختار الدرس المناسب لك. | رقم | عنوان الدرس | الرابط | |---|-------------|--------| | 1 | مراجعة الجمع | [/lessons/0da779fb-e8ca-4ec2-9ec5-0c26fd351473]\\(#/lessons/0da779fb-e8ca-4ec2-9ec5-0c26fd351473) | | 2 | مراجعة الطرح | [افتح الطرح](#/lessons/subtract?courseId=math) | **مثال توضيحي**: نبدأ بفكرة بسيطة.\n\n1. افهم الفكرة.\n2. طبّق المثال.\n\n\\(A=\\begin{bmatrix}3 & -2\\\\5 & 1\\end{bmatrix}\\)\n\n[صفحة الامتحانات](/exams) [الإشعارات](/notifications) [رابط غير آمن](javascript:alert(1)) ![صورة](https://untrusted.example/tracker.png)\n<script>window.aiInjected=true</script>\n\n```html\n<img src=x onerror=alert(1)>\n```';
  const remoteCalls: string[] = [];
  page.on('request', request => { if (request.url().includes('untrusted.example')) remoteCalls.push(request.url()); });
  await page.route('**/api/ai/chat', r => r.fulfill({ json: { model: 'test', content } }));
  await page.goto('/assistant');
  await page.getByRole('textbox', { name: 'رسالتك للمساعد' }).fill('اشرح لي الدرس');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  const chat = page.getByRole('region', { name: 'محادثة مع مساعد Klevro' });
  await expect(chat.getByRole('table')).toBeVisible();
  await expect(chat.getByRole('row')).toHaveCount(3);
  await expect(chat.getByRole('link', { name: 'افتح الدرس', exact: true })).toHaveAttribute('href', '/lessons/0da779fb-e8ca-4ec2-9ec5-0c26fd351473');
  await expect(chat.getByRole('link', { name: 'افتح الطرح' })).toHaveAttribute('href', '/lessons/subtract?courseId=math');
  await expect(chat.getByRole('link', { name: 'صفحة الامتحانات', exact: true })).toHaveAttribute('href', '/exams');
  await expect(chat.getByRole('link', { name: 'الإشعارات', exact: true })).toHaveAttribute('href', '/notifications');
  await expect(chat.locator('ol>li')).toHaveCount(2);
  await expect(chat.locator('.katex')).toHaveCount(1);
  await expect(chat.locator('a[href^="javascript"], script, img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).aiInjected)).toBeUndefined(); expect(remoteCalls).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await chat.screenshot({ path: '../artifacts/ai-assistant/reply-markdown-mobile.png' });
  await page.route('**/api/ai/chat', r => r.fulfill({ json: { model: 'test', content: '<img src="https://untrusted.example/standalone.png" onerror="window.aiInjected=true">' } }));
  await page.getByRole('textbox', { name: 'رسالتك للمساعد' }).fill('اختبار آخر');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  await expect(chat).toContainText('standalone.png');
  await expect(chat.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).aiInjected)).toBeUndefined(); expect(remoteCalls).toEqual([]);
});

for (const language of ['ar', 'en']) test(`student assistant and persisted learning insight ${language}`, async ({ page }) => {
  await studentAi(page, language);
  await page.goto('/dashboard');
  await expect(page.getByRole('region', { name: language === 'ar' ? 'تحليل تقدّمك وخطة المذاكرة' : 'Your learning insights and study plan' })).toBeVisible();
  await page.getByRole('button', { name: language === 'ar' ? 'حضّر لي خطة بالمساعد' : 'Create my AI study plan', exact: true }).click();
  await expect(page.getByText('ابدأ بمراجعة المصفوفات، ثم حل مثالًا تدريبيًا.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: language === 'ar' ? 'افتح مساعد Klevro' : 'Open Klevro assistant', exact: true }).click();
  const message = page.getByRole('textbox', { name: language === 'ar' ? 'رسالتك للمساعد' : 'Your message' });
  await message.fill('حلّل نتيجة آخر امتحان');
  const sent = page.waitForRequest(r => r.url().endsWith('/api/ai/chat') && r.method() === 'POST');
  await page.getByRole('button', { name: language === 'ar' ? 'إرسال' : 'Send', exact: true }).click();
  const payload = (await sent).postDataJSON();
  expect(payload.message).toBe('حلّل نتيجة آخر امتحان'); expect(payload.userId).toBeUndefined(); expect(payload.audio).toBeUndefined();
  await expect(page.getByText('أهلًا. آخر نتيجة مسجّلة لك 65%. راجع المصفوفات أولًا.', { exact: true })).toBeVisible();
  await page.screenshot({ path: `../artifacts/ai-assistant/student-${language}.png`, fullPage: false });
});

test('browser-native voice requests consent for online recognition, sends editable text and reads using a local voice', async ({ page }) => {
  await studentAi(page);
  await page.addInitScript(() => {
    class Recognition {
      static async available() { return 'unavailable'; }
      lang = ''; continuous = false; interimResults = false;
      onstart: any; onend: any; onresult: any;
      start() { this.onstart?.(); this.onresult?.({ resultIndex: 0, results: [{ 0: { transcript: 'اشرح لي المصفوفات' }, isFinal: true }] }); this.onend?.(); }
      stop() { this.onend?.(); } abort() {}
    }
    (window as any).SpeechRecognition = Recognition;
    (window as any).SpeechSynthesisUtterance = class { text: string; constructor(text: string) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [{ name: 'Local Arabic', lang: 'ar-EG', localService: true }], cancel() {}, speak(utterance: any) { (window as any).readText = utterance.text; } } });
  });
  await page.goto('/assistant');
  await page.getByRole('button', { name: 'التحدث للمساعد', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'إذن استخدام التعرف الصوتي عبر المتصفح' })).toBeVisible();
  await page.getByRole('button', { name: 'متابعة عبر المتصفح', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'رسالتك للمساعد' })).toHaveValue('اشرح لي المصفوفات');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  await page.getByText('إعدادات الصوت', { exact: true }).click();
  await page.getByRole('combobox', { name: 'صوت قراءة الرد' }).selectOption('device');
  await page.getByRole('button', { name: 'قراءة الرد بصوت', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).readText)).toContain('آخر نتيجة');
  expect(await page.locator('input[type=file]').count()).toBe(0);
});

test('voice consent is remembered across microphone clicks, languages and reloads and can be revoked', async ({ page }) => {
  await studentAi(page);
  await page.addInitScript(() => {
    (window as any).voiceStarts = 0;
    class Recognition {
      static async available() { return 'unavailable'; }
      onstart: any; onend: any;
      start() { (window as any).voiceStarts++; this.onstart?.(); this.onend?.(); }
      stop() { this.onend?.(); } abort() {}
    }
    (window as any).SpeechRecognition = Recognition;
  });
  await page.goto('/assistant');
  const mic = page.getByRole('button', { name: 'التحدث للمساعد', exact: true });
  const consent = page.getByRole('dialog', { name: 'إذن استخدام التعرف الصوتي عبر المتصفح' });
  await mic.click();
  await expect(consent).toBeVisible();
  await consent.getByRole('button', { name: 'إلغاء', exact: true }).click();
  expect(await page.evaluate(() => (window as any).voiceStarts)).toBe(0);
  await mic.click();
  await consent.getByRole('button', { name: 'متابعة عبر المتصفح', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).voiceStarts)).toBe(1);
  await mic.click();
  await expect.poll(() => page.evaluate(() => (window as any).voiceStarts)).toBe(2);
  await expect(consent).toHaveCount(0);
  await page.getByRole('combobox', { name: 'لغة الصوت' }).selectOption('en-US');
  await mic.click();
  await expect.poll(() => page.evaluate(() => (window as any).voiceStarts)).toBe(3);
  await page.reload();
  expect(await page.evaluate(() => (window as any).voiceStarts)).toBe(0);
  await mic.click();
  await expect.poll(() => page.evaluate(() => (window as any).voiceStarts)).toBe(1);
  await expect(consent).toHaveCount(0);
  await page.getByText('إعدادات الصوت', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'السماح بخدمة تحويل الصوت لنص الخاصة بالمتصفح' }).uncheck();
  await mic.click();
  await expect(consent).toBeVisible();
  expect(await page.evaluate(() => (window as any).voiceStarts)).toBe(1);
});

test('device reply speech reads every sentence in bounded chunks and ignores cancelled playback events', async ({ page }) => {
  await studentAi(page);
  const longReply = 'نراجع المصفوفات خطوة بخطوة، ونحل الأمثلة بهدوء. '.repeat(18) + 'وصلنا لنهاية الرد.';
  await page.route('**/api/ai/chat', r => r.fulfill({ json: { content: longReply, model: 'test' } }));
  await page.addInitScript(() => {
    localStorage.setItem('klevro:reply-voice:v1', 'device');
    (window as any).utterances = [];
    (window as any).SpeechSynthesisUtterance = class { text: string; constructor(text: string) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [{ name: 'Arabic Natural', lang: 'ar-EG', localService: true }], cancel() {},
      speak(utterance: any) { (window as any).utterances.push(utterance); },
    } });
  });
  await page.goto('/assistant');
  await page.getByRole('textbox', { name: 'رسالتك للمساعد' }).fill('اشرح الدرس');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  const read = page.getByRole('button', { name: 'قراءة الرد بصوت', exact: true });
  await read.click();
  expect(await page.evaluate(() => (window as any).utterances.length)).toBe(1);
  await page.evaluate(() => {
    let index = 0;
    while (index < (window as any).utterances.length && index < 100) (window as any).utterances[index++].onend();
  });
  await expect(read).toBeVisible();
  const spoken = await page.evaluate(() => (window as any).utterances.map((utterance: any) => utterance.text));
  expect(spoken.length).toBeGreaterThan(1); expect(spoken.every((part: string) => part.length <= 180)).toBe(true);
  expect(spoken.join(' ')).toBe(longReply);
  await read.click();
  const count = await page.evaluate(() => (window as any).utterances.length);
  await page.getByRole('button', { name: 'إيقاف القراءة', exact: true }).click();
  await page.evaluate(() => (window as any).utterances.at(-1).onend());
  expect(await page.evaluate(() => (window as any).utterances.length)).toBe(count);
});

test('AI reply voice plays one complete audio file, reuses it and releases playback on stop', async ({ page }) => {
  await studentAi(page);
  const samples = 16000, wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) wav.writeInt16LE(Math.round(Math.sin(index * 2 * Math.PI * 440 / 8000) * 300), 44 + index * 2);
  let requests = 0, payload: any;
  await page.route('**/api/ai/speech', r => { requests++; payload = r.request().postDataJSON(); return r.fulfill({ body: wav, contentType: 'audio/wav' }); });
  await page.addInitScript(() => {
    const BrowserAudio = window.Audio;
    (window as any).audioPlayers = []; (window as any).revokedAudioUrls = [];
    (window as any).Audio = function(src: string) { const player = new BrowserAudio(src); (window as any).audioPlayers.push(player); return player; };
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url: string) => { (window as any).revokedAudioUrls.push(url); revoke(url); };
  });
  await page.goto('/assistant');
  await page.getByRole('textbox', { name: 'رسالتك للمساعد' }).fill('اشرح الدرس');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  const read = page.getByRole('button', { name: 'قراءة الرد بصوت', exact: true });
  await read.click();
  await expect.poll(() => page.evaluate(() => (window as any).audioPlayers[0]?.paused)).toBe(false);
  expect(payload.language).toBe('ar-EG'); expect(payload.text).toContain('آخر نتيجة'); expect(payload.apiKey).toBeUndefined();
  await expect(read).toBeVisible();
  expect(requests).toBe(1);
  await read.click();
  await expect.poll(() => page.evaluate(() => (window as any).audioPlayers[1]?.paused)).toBe(false);
  await page.getByRole('button', { name: 'إيقاف القراءة', exact: true }).click();
  expect(requests).toBe(1);
  expect(await page.evaluate(() => (window as any).audioPlayers.every((player: HTMLAudioElement) => player.paused && !player.hasAttribute('src')))).toBe(true);
  expect(await page.evaluate(() => (window as any).revokedAudioUrls.length)).toBe(2);
});

test('AI voice terms failures fall back explicitly and cancelling preparation never plays a late response', async ({ page }) => {
  await studentAi(page);
  await page.addInitScript(() => {
    (window as any).localReadCount = 0; (window as any).audioCreated = 0;
    (window as any).SpeechSynthesisUtterance = class { text: string; constructor(text: string) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [{ name: 'Arabic', lang: 'ar-EG', localService: true }], cancel() {}, speak() { (window as any).localReadCount++; },
    } });
    (window as any).Audio = function() { (window as any).audioCreated++; };
  });
  await page.route('**/api/ai/speech', r => r.fulfill({ status: 503, json: { code: 'SPEECH_TERMS_REQUIRED' } }));
  await page.goto('/assistant');
  await page.getByRole('textbox', { name: 'رسالتك للمساعد' }).fill('اشرح الدرس');
  await page.getByRole('button', { name: 'إرسال', exact: true }).click();
  await page.getByRole('button', { name: 'قراءة الرد بصوت', exact: true }).click();
  await expect(page.getByText(/الصوت الاحترافي يحتاج قبول شروط/)).toBeVisible();
  expect(await page.evaluate(() => (window as any).localReadCount)).toBe(1);
  await page.getByRole('button', { name: 'إيقاف القراءة', exact: true }).click();
  let pending: any;
  await page.route('**/api/ai/speech', r => { pending = r; });
  await page.getByRole('button', { name: 'قراءة الرد بصوت', exact: true }).click();
  await expect(page.getByText('بجهز الصوت الاحترافي…', { exact: true })).toBeVisible();
  await expect.poll(() => Boolean(pending)).toBe(true);
  await page.getByRole('button', { name: 'إيقاف القراءة', exact: true }).click();
  await pending.fulfill({ body: Buffer.from('late audio'), contentType: 'audio/wav' }).catch(() => {});
  expect(await page.evaluate(() => (window as any).audioCreated)).toBe(0);
  expect(await page.evaluate(() => (window as any).localReadCount)).toBe(1);
});

test.describe('microphone permissions policy', () => {
  test('page allows a permitted microphone and still blocks camera access', async ({ browser, baseURL }) => {
    const mediaBrowser = await browser.browserType().launch({
      executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
      args: ['--use-fake-device-for-media-stream'],
    });
    try {
      const context = await mediaBrowser.newContext({ baseURL });
      const page = await context.newPage();
      await studentAi(page);
      await context.grantPermissions(['microphone']);
      const response = await page.goto('/assistant');
      expect(response?.headers()['permissions-policy']).toContain('microphone=(self)');
      const capture = await page.evaluate(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tracks = stream.getAudioTracks();
        const active = tracks.length === 1 && tracks[0].readyState === 'live';
        stream.getTracks().forEach(track => track.stop());
        return { active, camera: (document as any).featurePolicy.allowsFeature('camera') };
      });
      expect(capture).toEqual({ active: true, camera: false });
    } finally { await mediaBrowser.close(); }
  });
});

test('live voice spectrum follows real audio samples and releases its microphone on stop and chat close', async ({ page }) => {
  await studentAi(page);
  await page.addInitScript(() => {
    class Recognition {
      static async available() { return 'available'; }
      onstart: any; onend: any;
      start() { this.onstart?.(); } stop() { this.onend?.(); } abort() { this.onend?.(); }
    }
    (window as any).SpeechRecognition = Recognition;
    const AudioEngine = window.AudioContext;
    (window as any).meterContexts = [];
    (window as any).AudioContext = class extends AudioEngine {
      constructor() { super(); (window as any).meterContexts.push(this); }
    };
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      const audio = new AudioEngine();
      const tone = audio.createOscillator(), gain = audio.createGain(), output = audio.createMediaStreamDestination();
      tone.frequency.value = 440; gain.gain.value = 0;
      tone.connect(gain).connect(output); tone.start(); await audio.resume();
      (window as any).testSignal = { audio, gain, tone, stream: output.stream };
      return output.stream;
    } });
  });
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'افتح مساعد Klevro', exact: true }).click();
  await page.getByRole('button', { name: 'التحدث للمساعد', exact: true }).click();
  const spectrum = page.getByRole('group', { name: 'ترددات صوت الميكروفون المباشرة' });
  await expect(spectrum).toHaveAttribute('data-state', 'live');
  await expect(spectrum).toHaveAttribute('data-level', 'quiet');
  const quietPixels = await spectrum.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.evaluate(() => { (window as any).testSignal.gain.gain.value = 0.3; });
  await expect(spectrum).toHaveAttribute('data-level', 'speaking');
  const loudPixels = await spectrum.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  expect(loudPixels).not.toBe(quietPixels);
  await page.screenshot({ path: '../artifacts/ai-assistant/live-voice-spectrum-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'إيقاف الميكروفون', exact: true })).toBeInViewport();
  await page.screenshot({ path: '../artifacts/ai-assistant/live-voice-spectrum-mobile.png' });
  await page.evaluate(() => { (window as any).testSignal.gain.gain.value = 0; });
  await expect(spectrum).toHaveAttribute('data-level', 'quiet');
  await page.getByRole('button', { name: 'إيقاف الميكروفون', exact: true }).click();
  await expect(spectrum).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as any).testSignal.stream.getTracks().every((track: MediaStreamTrack) => track.readyState === 'ended'))).toBe(true);
  await page.evaluate(async () => { (window as any).testSignal.tone.stop(); await (window as any).testSignal.audio.close(); });
  await page.getByRole('button', { name: 'التحدث للمساعد', exact: true }).click();
  await expect(spectrum).toHaveAttribute('data-state', 'live');
  await page.getByRole('button', { name: 'إغلاق المساعد', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).testSignal.stream.getTracks().every((track: MediaStreamTrack) => track.readyState === 'ended') && (window as any).meterContexts.every((audio: AudioContext) => audio.state === 'closed'))).toBe(true);
  await page.evaluate(async () => { (window as any).testSignal.tone.stop(); await (window as any).testSignal.audio.close(); });
});

test('voice spectrum releases a late microphone permission result and preserves dictation when analysis is unavailable', async ({ page }) => {
  await studentAi(page);
  await page.addInitScript(() => {
    class Recognition {
      static async available() { return 'available'; }
      onstart: any; onend: any;
      start() { this.onstart?.(); } stop() { this.onend?.(); } abort() { this.onend?.(); }
    }
    (window as any).SpeechRecognition = Recognition;
    (window as any).micRequests = 0;
    (window as any).meterResolvers = [];
    (window as any).lateTracksStopped = 0;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: () => {
      (window as any).micRequests++;
      if ((window as any).denyMeter) return Promise.reject(new DOMException('Denied', 'NotAllowedError'));
      return new Promise(resolve => { (window as any).meterResolvers.push(() => resolve({ getTracks: () => [{ stop() { (window as any).lateTracksStopped++; } }] })); });
    } });
  });
  await page.goto('/assistant');
  await page.getByRole('button', { name: 'التحدث للمساعد', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).micRequests)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'إيقاف الميكروفون', exact: true }).click();
  await page.evaluate(() => (window as any).meterResolvers.forEach((resolve: () => void) => resolve()));
  await expect.poll(() => page.evaluate(() => (window as any).lateTracksStopped === (window as any).micRequests)).toBe(true);
  await page.evaluate(() => { (window as any).denyMeter = true; });
  await page.getByRole('button', { name: 'التحدث للمساعد', exact: true }).click();
  const spectrum = page.getByRole('group', { name: 'ترددات صوت الميكروفون المباشرة' });
  await expect(spectrum).toHaveAttribute('data-state', 'unavailable');
  await expect(spectrum.locator('canvas')).toBeHidden();
  await expect(spectrum).toContainText('يمكنك متابعة الإملاء الصوتي');
  await expect(page.getByRole('button', { name: 'إيقاف الميكروفون', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'إيقاف الميكروفون', exact: true }).click();
});

for (const language of ['ar', 'en']) test(`voice failures give actionable errors and release recording state ${language}`, async ({ page }) => {
  await studentAi(page, language);
  await page.addInitScript(() => {
    class Recognition {
      static async available() { return 'unavailable'; }
      onstart: any; onerror: any; onend: any;
      start() {
        const code = (window as any).voiceFailure;
        if (code === 'SecurityError') throw new DOMException('Blocked', code);
        this.onstart?.(); this.onerror?.({ error: code });
      }
      stop() { this.onend?.(); } abort() {}
    }
    (window as any).SpeechRecognition = Recognition;
  });
  await page.goto('/assistant');
  const mic = page.getByRole('button', { name: language === 'ar' ? 'التحدث للمساعد' : 'Speak to assistant', exact: true });
  for (const code of ['not-allowed', 'network', 'audio-capture', 'no-speech', 'language-not-supported', 'service-not-allowed', 'SecurityError']) {
    await page.evaluate(code => { (window as any).voiceFailure = code; }, code);
    await mic.click();
    if (code === 'not-allowed') await page.getByRole('button', { name: language === 'ar' ? 'متابعة عبر المتصفح' : 'Continue with browser', exact: true }).click();
    const alert = page.getByRole('region', { name: language === 'ar' ? 'محادثة مع مساعد Klevro' : 'Chat with Klevro assistant' }).getByRole('alert');
    await expect(alert).toContainText(`(${code === 'SecurityError' ? 'policy-blocked' : code})`);
    if (code === 'network' || code === 'service-not-allowed') await expect(alert).toContainText('Chrome');
    await expect(mic).toBeVisible();
    await expect(page.getByRole('button', { name: language === 'ar' ? 'إرسال' : 'Send', exact: true })).toBeDisabled();
  }
});

test('assistant is hidden on assessment, skills, activities and game routes and on lesson quizzes', async ({ page }) => {
  await studentAi(page);
  for (const path of ['/exams', '/exams/exam', '/activities', '/competitions']) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'افتح مساعد Klevro', exact: true })).toHaveCount(0);
  }
  await page.goto('/lessons/lesson?courseId=course');
  await expect(page.getByRole('button', { name: 'افتح مساعد Klevro', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /اختبر نفسك|اختبرني|التدريبات|الاختبار|تقييم|Quiz/ }).click();
  await expect(page.getByRole('button', { name: 'افتح مساعد Klevro', exact: true })).toHaveCount(0);
});

for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN']) test(`${role}: full lesson workspace saves dedicated AI guidance`, async ({ page }) => {
  const prefix = role === 'SUPER_ADMIN' ? 'super-admin' : 'school-admin';
  const key = role === 'SUPER_ADMIN' ? 'super_admin' : 'school_admin';
  let saved: any;
  await serverSession(page, role);
  await page.addInitScript(({ key, role }) => { localStorage.setItem('lms_lang', 'ar'); localStorage.setItem(`${key}_token`, 'cookie_auth'); localStorage.setItem(`${key}_user`, JSON.stringify({ id: 'admin', role, schoolId: 'school' })); }, { key, role });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/**', r => {
    const path = new URL(r.request().url()).pathname;
    if (path.includes('/auth/')) return r.fulfill({ json: { authenticated: true, user: { id: 'admin', role, schoolId: 'school' } } });
    if (path.includes('/ai/guidance/')) { if (r.request().method() === 'PUT') saved = r.request().postDataJSON(); return r.fulfill({ json: { guidance: saved || { enabled: true, instructions: '', referenceText: '', starterPrompts: [] } } }); }
    if (path === '/api/courses/course') return r.fulfill({ json: { ...course, grade: 'Grade 3', grades: '["Grade 3"]', subject: 'Math', schoolId: 'school', lessons: [{ ...lesson, title: 'درس المصفوفات', isContentLoaded: true }] } });
    if (path === '/api/lessons/lesson') return r.fulfill({ json: { ...lesson, title: 'درس المصفوفات' } });
    if (path.endsWith('deletion-policy')) return r.fulfill({ json: { allowContentDeletion: false } });
    return r.fulfill({ json: [] });
  });
  await page.goto(`/${prefix}/courses/lesson?id=course&lessonId=lesson`);
  await expect(page.getByRole('heading', { name: 'درس المصفوفات', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'المساعد التعليمي', exact: true }).click();
  await page.getByRole('textbox', { name: 'توجيهات الشرح والتعامل مع الطالب', exact: true }).fill('اشرح المصفوفات بالعربي وبمثال من الدرس.');
  await page.getByRole('button', { name: 'حفظ توجيهات المساعد', exact: true }).click();
  await expect.poll(() => saved?.instructions).toBe('اشرح المصفوفات بالعربي وبمثال من الدرس.');
  await expect(page.getByText('تم حفظ التوجيهات', { exact: true })).toBeVisible();
  await page.screenshot({ path: `../artifacts/ai-assistant/lesson-${prefix}.png`, fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('tab', { name: 'المساعد التعليمي', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'توجيهات الشرح والتعامل مع الطالب', exact: true })).toHaveValue('اشرح المصفوفات بالعربي وبمثال من الدرس.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `../artifacts/ai-assistant/lesson-${prefix}-mobile.png`, fullPage: false });
});

test('admin settings show genuine probe failures and success, and persist availability only after saving', async ({ page }) => {
  await serverSession(page, 'SUPER_ADMIN');
  await page.addInitScript(() => { localStorage.setItem('lms_lang', 'ar'); localStorage.setItem('klevro-install-dismissed', String(Date.now())); });
  let saved = { enabled: false, publicEnabled: false, publicInfo: 'Approved reference', instructions: 'Saved guidance' };
  const providers = [1, 2].map(id => ({ id: `p${id}`, name: `Connection ${id}`, kind: 'GROQ', model: 'openai/gpt-oss-120b', baseUrl: 'https://api.groq.com/openai/v1', enabled: true, allowPublic: true, requestCount: 0, failureCount: 0, lastStatus: null as number | null }));
  const probes: string[] = [];
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes('/auth/')) return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN' } } });
    if (path === '/api/ai/admin/settings') {
      if (route.request().method() === 'PUT') saved = route.request().postDataJSON();
      return route.fulfill({ json: { settings: saved, providers, encryptionConfigured: true } });
    }
    if (/\/providers\/p[12]\/test$/.test(path)) {
      probes.push(path); const first = path.includes('/p1/');
      providers[first ? 0 : 1].lastStatus = first ? 429 : 200;
      return route.fulfill({ json: { test: { ok: !first, code: first ? 'AI_PROVIDER_RATE_LIMIT' : 'AI_PROVIDER_OK', status: first ? 429 : 200, message: first ? 'وصل الاتصال لحد المزوّد المؤقت.' : 'استجاب النموذج لهذا الاتصال بنجاح.', checkedAt: new Date().toISOString(), latencyMs: 250, ...(first ? { retryAfterSeconds: 45 } : { reply: 'OK' }) } } });
    }
    return route.fulfill({ json: path.endsWith('/students') ? { students: [] } : {} });
  });
  await page.goto('/super-admin/settings');
  const workspace = page.getByRole('region', { name: 'إعدادات المساعد الذكي' });
  await expect(workspace.getByText('لم يُختبر بعد', { exact: true })).toHaveCount(2);
  await workspace.getByRole('button', { name: 'اختبار الاتصال', exact: true }).first().click();
  await expect(workspace).toContainText('الاختبار لم ينجح');
  await expect(workspace).toContainText('HTTP 429');
  await expect(workspace).toContainText('45 ثانية');
  expect(probes).toHaveLength(1);
  await workspace.getByRole('button', { name: 'اختبار الاتصال', exact: true }).nth(1).click();
  await expect(workspace).toContainText('الاختبار نجح');
  await expect(workspace).toContainText('رد النموذج: OK');
  await workspace.getByLabel('تفعيل مساعد الطلاب', { exact: true }).check();
  await expect(workspace).toContainText('تغييرات لم تُحفظ بعد');
  expect(saved.enabled).toBe(false);
  await workspace.getByRole('button', { name: 'حفظ إعدادات المساعد', exact: true }).click();
  await expect(workspace).toContainText('تم حفظ إعدادات المساعد.');
  await page.reload();
  await expect(workspace.getByLabel('تفعيل مساعد الطلاب', { exact: true })).toBeChecked();
  await expect(workspace).toContainText('الإعدادات المعروضة محفوظة على الخادم');
  await expect(workspace).toContainText('HTTP 429');
  await expect(workspace).toContainText('HTTP 200');
});

test('super admin adds a provider without persisting plaintext credentials in browser storage', async ({ page }) => {
  const providers: any[] = []; let submitted: any;
  await serverSession(page, 'SUPER_ADMIN');
  await page.addInitScript(() => { localStorage.setItem('lms_lang', 'ar'); localStorage.setItem('super_admin_token', 'cookie_auth'); localStorage.setItem('super_admin_user', JSON.stringify({ id: 'admin', role: 'SUPER_ADMIN' })); });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('**/api/**', r => {
    const path = new URL(r.request().url()).pathname;
    if (path.includes('/auth/')) return r.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN' } } });
    if (path === '/api/ai/admin/settings') return r.fulfill({ json: { settings: { enabled: false, publicEnabled: false, publicInfo: 'Klevro', instructions: '' }, providers, encryptionConfigured: true } });
    if (path === '/api/ai/admin/models' || path === '/api/ai/admin/providers/p1/models') return r.fulfill({ json: { models: [{ id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', free: null }, { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', free: null }] } });
    if (path === '/api/ai/admin/providers') { submitted = r.request().postDataJSON(); const provider = { id: 'p1', name: submitted.name, model: submitted.model, kind: submitted.kind, baseUrl: submitted.baseUrl, allowPublic: submitted.allowPublic, allowStudent: submitted.allowStudent, requestCount: 0, failureCount: 0, enabled: true }; providers.push(provider); return r.fulfill({ json: { provider }, status: 201 }); }
    if (path === '/api/ai/admin/providers/p1' && r.request().method() === 'PATCH') { submitted = r.request().postDataJSON(); Object.assign(providers[0], Object.fromEntries(Object.entries(submitted).filter(([key]) => ['model', 'allowStudent', 'allowPublic', 'name', 'baseUrl'].includes(key)))); return r.fulfill({ json: { provider: providers[0] } }); }
    return r.fulfill({ json: path.endsWith('/students') ? { students: [] } : {} });
  });
  await page.goto('/super-admin/settings');
  await page.getByLabel('اسم الاتصال', { exact: true }).fill('Groq 1');
  await page.getByLabel('المفتاح السري', { exact: true }).fill('synthetic-private-key');
  await expect(page.getByRole('textbox', { name: 'اسم النموذج', exact: true })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true })).toBeEnabled();
  await page.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true }).selectOption('openai/gpt-oss-20b');
  await page.getByRole('combobox', { name: 'مكان استخدام هذا النموذج', exact: true }).selectOption('public');
  await page.getByRole('button', { name: 'حفظ الاتصال المشفّر', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Groq 1', exact: true })).toBeVisible();
  expect(submitted.model).toBe('openai/gpt-oss-20b');
  expect(submitted.allowPublic).toBe(true);
  expect(submitted.allowStudent).toBe(false);
  await expect(page.getByRole('combobox', { name: 'مكان الاستخدام — Groq 1', exact: true })).toHaveValue('public');
  await expect(page.getByLabel('المفتاح السري', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('synthetic-private-key');
  await page.getByRole('button', { name: 'تعديل', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true })).toBeEnabled();
  await page.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true }).selectOption('openai/gpt-oss-120b');
  await page.getByRole('button', { name: 'حفظ الاتصال المشفّر', exact: true }).click();
  await expect.poll(() => providers[0].model).toBe('openai/gpt-oss-120b');
  await page.getByRole('combobox', { name: 'مكان الاستخدام — Groq 1', exact: true }).selectOption('student');
  await expect.poll(() => providers[0].allowPublic).toBe(false);
  expect(providers[0].allowStudent).toBe(true);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'مكان الاستخدام — Groq 1', exact: true })).toHaveValue('student');
  await page.getByRole('combobox', { name: 'مكان الاستخدام — Groq 1', exact: true }).selectOption('both');
  await expect.poll(() => providers[0].allowPublic).toBe(true);
  expect(providers[0].allowStudent).toBe(true);
  await page.screenshot({ path: '../artifacts/ai-assistant/admin-settings.png', fullPage: false });
});

test('automatic catalogs ignore stale responses and never forward a key after changing providers', async ({ page }) => {
  await serverSession(page, 'SUPER_ADMIN');
  await page.addInitScript(() => { localStorage.setItem('lms_lang', 'ar'); localStorage.setItem('klevro-install-dismissed', String(Date.now())); });
  let pendingGroq: any; const requests: any[] = [];
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes('/auth/')) return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN' } } });
    if (path === '/api/ai/admin/settings') return route.fulfill({ json: { settings: { enabled: false, publicEnabled: false, publicInfo: '', instructions: '' }, providers: [], encryptionConfigured: true } });
    if (path === '/api/ai/admin/models') {
      const body = route.request().postDataJSON(); requests.push(body);
      if (body.kind === 'GROQ') { pendingGroq = route; return; }
      return route.fulfill({ json: { models: [{ id: 'new-provider-model', name: 'New provider model', free: null }] } });
    }
    return route.fulfill({ json: path.endsWith('/students') ? { students: [] } : {} });
  });
  await page.goto('/super-admin/settings');
  const key = page.getByLabel('المفتاح السري', { exact: true });
  const picker = page.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true });
  await expect(picker).toBeDisabled();
  await key.fill('synthetic-groq-credential');
  await expect.poll(() => !!pendingGroq).toBe(true);
  await page.getByRole('combobox', { name: 'المزوّد', exact: true }).selectOption('OPENAI');
  await expect(key).toHaveValue('');
  await pendingGroq.fulfill({ json: { models: [{ id: 'stale-groq-model', name: 'Stale model', free: null }] } });
  await expect(picker).toBeDisabled();
  await key.fill('synthetic-openai-credential');
  await expect(picker).toBeEnabled();
  await expect(picker.locator('option')).toHaveCount(2);
  await expect(picker).not.toContainText('stale-groq-model');
  await picker.selectOption('new-provider-model');
  expect(requests).toHaveLength(2);
  expect(requests[0]).toMatchObject({ kind: 'GROQ', apiKey: 'synthetic-groq-credential' });
  expect(requests[1]).toMatchObject({ kind: 'OPENAI', apiKey: 'synthetic-openai-credential' });
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toMatch(/synthetic-(groq|openai)-credential/);
});
