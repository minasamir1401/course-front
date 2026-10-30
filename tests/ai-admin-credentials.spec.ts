import { test, expect, Page } from '@playwright/test';
import { serverSession } from './helpers/serverSession';

async function setup(page: Page, language = 'ar', kind = 'GROQ') {
  await serverSession(page, 'SUPER_ADMIN');
  await page.addInitScript(language => { localStorage.setItem('lms_lang', language); localStorage.setItem('super_admin_token', 'cookie_auth'); localStorage.setItem('super_admin_user', JSON.stringify({ id: 'admin', role: 'SUPER_ADMIN' })); localStorage.setItem('klevro-install-dismissed', String(Date.now())); }, language);
  const providers = [1, 2].map(id => ({ id: `p${id}`, name: `Connection ${id}`, kind, model: kind === 'GEMINI' ? 'gemini-3.1-flash-lite' : 'openai/gpt-oss-120b', baseUrl: kind === 'GEMINI' ? 'https://generativelanguage.googleapis.com/v1beta/openai' : 'https://api.groq.com/openai/v1', allowPublic: true, allowStudent: false, enabled: true, requestCount: 1, failureCount: 0 }));
  const requests: { path: string; method: string; body?: Record<string, unknown> }[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname, method = route.request().method();
    requests.push({ path, method, ...(method === 'POST' || method === 'PATCH' ? { body: route.request().postDataJSON() } : {}) });
    if (path.includes('/auth/')) return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN' } } });
    if (path === '/api/ai/admin/settings') return route.fulfill({ json: { settings: { enabled: true, publicEnabled: true, instructions: '', publicInfo: 'Klevro' }, providers, encryptionConfigured: true } });
    if (path.endsWith('/credential')) return route.fulfill({ json: { apiKey: path.includes('/p1/') ? 'synthetic-old-key-one' : 'synthetic-old-key-two' } });
    if (path.endsWith('/models')) return route.fulfill({ json: { models: (kind === 'GEMINI' ? ['gemini-3.1-flash-lite', 'gemini-2.5-flash'] : ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']).map(id => ({ id, name: id, free: null })) } });
    if (path === '/api/ai/admin/providers' && method === 'POST') {
      const body = route.request().postDataJSON();
      const { apiKey: _key, ...settings } = body;
      const provider = { id: 'p3', ...settings, requestCount: 0, failureCount: 0 };
      providers.push(provider); return route.fulfill({ status: 201, json: { provider } });
    }
    if (/\/providers\/p[12]$/.test(path) && method === 'PATCH') { const body = route.request().postDataJSON(); const provider = providers[path.endsWith('p1') ? 0 : 1]; Object.assign(provider, Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'apiKey'))); return route.fulfill({ json: { provider } }); }
    return route.fulfill({ json: {} });
  });
  await page.goto('/super-admin/settings');
  const workspace = page.getByRole('region', { name: language === 'ar' ? 'إعدادات المساعد الذكي' : 'AI assistant settings' });
  await expect(workspace).toBeVisible();
  return { workspace, requests };
}

for (const language of ['ar', 'en']) test(`edit retains a masked saved key, reveals only on demand and saves without resending it ${language}`, async ({ page }) => {
  const ar = language === 'ar';
  const { workspace, requests } = await setup(page, language);
  await expect(page.getByRole('heading', { name: /قراءة تقدم الطلاب|Student learning insights/ })).toHaveCount(0);
  expect(requests.some(item => item.path === '/api/ai/admin/students')).toBe(false);
  await workspace.getByRole('button', { name: ar ? 'تعديل' : 'Edit', exact: true }).first().click();
  await expect(workspace.getByRole('heading', { name: ar ? 'تعديل الاتصال' : 'Edit connection', exact: true })).toBeVisible();
  const key = workspace.getByLabel(ar ? 'المفتاح المحفوظ' : 'Saved API key', { exact: true });
  await expect(key).toHaveAttribute('type', 'password');
  await expect(key).toHaveJSProperty('readOnly', true);
  await expect(key).toHaveValue('••••••••••••••••');
  const model = workspace.getByRole('combobox', { name: ar ? 'اختر نموذجًا من قائمة المزوّد' : 'Choose a provider model', exact: true });
  await expect(model).toBeEnabled();
  await expect(model).toHaveValue('openai/gpt-oss-120b');
  expect(requests.filter(item => item.path.endsWith('/credential'))).toHaveLength(0);
  expect(requests.some(item => item.path === '/api/ai/admin/providers/p1/models' && item.method === 'GET')).toBe(true);
  await workspace.getByRole('button', { name: ar ? 'إظهار المفتاح' : 'Show key', exact: true }).click();
  await expect(key).toHaveAttribute('type', 'text');
  await expect(key).toHaveValue('synthetic-old-key-one');
  await workspace.getByRole('button', { name: ar ? 'إخفاء المفتاح' : 'Hide key', exact: true }).click();
  await expect(key).toHaveValue('••••••••••••••••');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('synthetic-old-key-one');
  await model.selectOption('openai/gpt-oss-20b');
  await workspace.getByRole('button', { name: ar ? 'حفظ الاتصال المشفّر' : 'Save encrypted connection', exact: true }).click();
  await expect.poll(() => requests.filter(item => item.method === 'PATCH').length).toBe(1);
  const saved = requests.find(item => item.method === 'PATCH')!.body!;
  expect(saved.model).toBe('openai/gpt-oss-20b');
  expect(saved.apiKey).toBe('');
  expect(JSON.stringify(saved)).not.toContain('synthetic-old-key-one');
  await expect(workspace.getByLabel(ar ? 'المفتاح السري' : 'Secret API key', { exact: true })).toHaveValue('');
});

test('replacement and cancellation keep the old credential out of model requests and another editor', async ({ page }) => {
  const { workspace, requests } = await setup(page);
  await workspace.getByRole('button', { name: 'تعديل', exact: true }).first().click();
  await workspace.getByRole('button', { name: 'إظهار المفتاح', exact: true }).click();
  await expect(workspace.getByLabel('المفتاح المحفوظ', { exact: true })).toHaveValue('synthetic-old-key-one');
  await workspace.getByRole('button', { name: 'تغيير المفتاح', exact: true }).click();
  const replacement = workspace.getByLabel('المفتاح السري', { exact: true });
  await expect(replacement).toHaveValue('');
  await replacement.fill('synthetic-replacement-key');
  await expect(workspace.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true })).toBeEnabled();
  expect(requests.find(item => item.path === '/api/ai/admin/models')!.body!.apiKey).toBe('synthetic-replacement-key');
  await workspace.getByRole('button', { name: 'الاحتفاظ بالمفتاح الحالي', exact: true }).click();
  await expect(workspace.getByLabel('المفتاح المحفوظ', { exact: true })).toHaveValue('••••••••••••••••');
  await expect(workspace.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true })).toHaveValue('openai/gpt-oss-120b');
  await workspace.getByRole('button', { name: 'تعديل', exact: true }).nth(1).click();
  await expect(workspace.getByLabel('اسم الاتصال', { exact: true })).toHaveValue('Connection 2');
  await expect(workspace.getByLabel('المفتاح المحفوظ', { exact: true })).toHaveValue('••••••••••••••••');
  await workspace.getByRole('button', { name: 'إظهار المفتاح', exact: true }).click();
  await expect(workspace.getByLabel('المفتاح المحفوظ', { exact: true })).toHaveValue('synthetic-old-key-two');
  await workspace.getByRole('button', { name: 'تغيير المفتاح', exact: true }).click();
  await workspace.getByLabel('المفتاح السري', { exact: true }).fill('synthetic-new-key-two');
  const model = workspace.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true });
  await expect(model).toBeEnabled(); await model.selectOption('openai/gpt-oss-20b');
  await workspace.getByRole('button', { name: 'حفظ الاتصال المشفّر', exact: true }).click();
  await expect.poll(() => requests.some(item => item.path === '/api/ai/admin/providers/p2' && item.method === 'PATCH')).toBe(true);
  expect(requests.find(item => item.path === '/api/ai/admin/providers/p2' && item.method === 'PATCH')!.body).toMatchObject({ apiKey: 'synthetic-new-key-two', model: 'openai/gpt-oss-20b' });
  await expect(workspace.getByLabel('المفتاح السري', { exact: true })).toHaveValue('');
});

test('a delayed reveal from a previous connection never appears in the next connection', async ({ page }) => {
  const { workspace } = await setup(page);
  let pending: Parameters<Parameters<Page['route']>[1]>[0] | undefined;
  await page.route('**/api/ai/admin/providers/p1/credential', route => { pending = route; });
  await workspace.getByRole('button', { name: 'تعديل', exact: true }).first().click();
  await workspace.getByRole('button', { name: 'إظهار المفتاح', exact: true }).click();
  await expect.poll(() => !!pending).toBe(true);
  await workspace.getByRole('button', { name: 'تعديل', exact: true }).nth(1).click();
  await expect(workspace.getByLabel('اسم الاتصال', { exact: true })).toHaveValue('Connection 2');
  await pending!.fulfill({ json: { apiKey: 'synthetic-late-private-key' } });
  await expect(workspace.getByLabel('المفتاح المحفوظ', { exact: true })).toHaveValue('••••••••••••••••');
  await expect(workspace.getByRole('button', { name: 'إظهار المفتاح', exact: true })).toBeEnabled();
});

test('saved-key editor fits the narrow viewport and requires a new credential for a different API URL', async ({ page }) => {
  await page.setViewportSize({ width: 816, height: 900 });
  const { workspace, requests } = await setup(page);
  await workspace.getByRole('button', { name: 'تعديل', exact: true }).first().click();
  await expect(workspace.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true })).toBeEnabled();
  for (const width of [816, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await workspace.getByLabel('المفتاح المحفوظ', { exact: true }).scrollIntoViewIfNeeded();
    expect(await workspace.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `../artifacts/ai-admin-credentials/saved-key-${width}.png` });
  }
  await workspace.getByLabel('رابط API المتوافق مع OpenAI', { exact: true }).fill('https://new-provider.example/v1');
  await expect(workspace.getByLabel('المفتاح السري', { exact: true })).toBeEmpty();
  await expect(workspace.getByRole('button', { name: 'إظهار المفتاح', exact: true })).toHaveCount(0);
  await expect(workspace.getByRole('button', { name: 'جلب النماذج المتاحة', exact: true })).toBeDisabled();
  expect(requests.filter(item => item.path === '/api/ai/admin/models')).toHaveLength(0);
});

for (const language of ['ar', 'en']) test(`another Gemini key copies edited settings, clears secrets and creates a separate connection ${language}`, async ({ page }) => {
  const ar = language === 'ar';
  const { workspace, requests } = await setup(page, language, 'GEMINI');
  await workspace.getByRole('button', { name: ar ? 'تعديل' : 'Edit', exact: true }).first().click();
  const model = workspace.getByRole('combobox', { name: ar ? 'اختر نموذجًا من قائمة المزوّد' : 'Choose a provider model', exact: true });
  await expect(model).toBeEnabled();
  await model.selectOption('gemini-2.5-flash');
  await workspace.getByLabel(ar ? 'مكان استخدام هذا النموذج' : 'Use this model for', { exact: true }).selectOption('both');
  await workspace.getByRole('button', { name: ar ? 'إظهار المفتاح' : 'Show key', exact: true }).click();
  await expect(workspace.getByLabel(ar ? 'المفتاح المحفوظ' : 'Saved API key', { exact: true })).toHaveValue('synthetic-old-key-one');
  await workspace.getByRole('button', { name: ar ? 'إضافة مفتاح آخر بنفس الإعدادات' : 'Add another key with these settings', exact: true }).click();
  const key = workspace.getByLabel(ar ? 'المفتاح السري' : 'Secret API key', { exact: true });
  await expect(key).toBeEmpty();
  await expect(key).toBeFocused();
  await expect(workspace.getByLabel(ar ? 'المزوّد' : 'Provider', { exact: true })).toHaveValue('GEMINI');
  await expect(workspace.getByLabel(ar ? 'رابط API المتوافق مع OpenAI' : 'OpenAI-compatible base URL', { exact: true })).toHaveValue('https://generativelanguage.googleapis.com/v1beta/openai');
  await expect(workspace.getByLabel(ar ? 'مكان استخدام هذا النموذج' : 'Use this model for', { exact: true })).toHaveValue('both');
  const save = workspace.getByRole('button', { name: ar ? 'حفظ الاتصال المشفّر' : 'Save encrypted connection', exact: true });
  await expect(save).toBeDisabled();
  await key.fill('synthetic-additional-gemini-key');
  await expect(model).toHaveValue('gemini-2.5-flash');
  await expect(save).toBeEnabled(); await save.click();
  await expect.poll(() => requests.filter(item => item.path === '/api/ai/admin/providers' && item.method === 'POST').length).toBe(1);
  const payload = requests.find(item => item.path === '/api/ai/admin/providers' && item.method === 'POST')!.body!;
  expect(payload).toMatchObject({ kind: 'GEMINI', model: 'gemini-2.5-flash', apiKey: 'synthetic-additional-gemini-key', enabled: true, allowPublic: true, allowStudent: true });
  expect(payload.name).not.toBe('Connection 1');
  expect(requests.filter(item => item.method === 'PATCH')).toHaveLength(0);
  await expect(workspace.locator('article')).toHaveCount(3);
  await expect(key).toBeEmpty();
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toMatch(/synthetic-(old-key|additional-gemini)/);
});

test('copy from a connection card validates the new key model and supports cancellation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const { workspace, requests } = await setup(page, 'ar', 'GEMINI');
  await page.route('**/api/ai/admin/models', route => route.fulfill({ json: { models: [{ id: 'gemini-2.5-flash', name: 'Other model', free: null }] } }));
  await workspace.getByRole('button', { name: 'إضافة مفتاح آخر', exact: true }).first().click();
  await workspace.getByLabel('المفتاح السري', { exact: true }).fill('synthetic-different-gemini-key');
  const model = workspace.getByRole('combobox', { name: 'اختر نموذجًا من قائمة المزوّد', exact: true });
  await expect(model).toBeEnabled(); await expect(model).toHaveValue('');
  await expect(workspace.getByRole('status').filter({ hasText: 'النموذج المنسوخ غير متاح' })).toBeVisible();
  await expect(workspace.getByRole('button', { name: 'حفظ الاتصال المشفّر', exact: true })).toBeDisabled();
  expect(requests.filter(item => item.path.endsWith('/credential') || item.path.includes('/p1/models'))).toHaveLength(0);
  expect(await workspace.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await model.selectOption('gemini-2.5-flash');
  await expect(workspace.getByRole('button', { name: 'حفظ الاتصال المشفّر', exact: true })).toBeEnabled();
  await workspace.getByRole('button', { name: 'إلغاء إضافة المفتاح', exact: true }).click();
  await expect(workspace.getByLabel('المفتاح السري', { exact: true })).toBeEmpty();
  await expect(workspace.getByLabel('المزوّد', { exact: true })).toHaveValue('GROQ');
  expect(requests.filter(item => item.method === 'PATCH' || item.path === '/api/ai/admin/providers' && item.method === 'POST')).toHaveLength(0);
});
