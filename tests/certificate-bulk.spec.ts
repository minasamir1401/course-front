import { serverSession } from './helpers/serverSession';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.use({ serviceWorkers: 'block' });
const certificate = { id: 'cert', title: 'Academic award', message: null, fileName: 'award.pdf', mimeType: 'application/pdf', byteSize: 14, createdAt: '2026-10-21T10:00:00Z', revokedAt: null, student: { name: 'Adam', username: 'adam' }, school: { name: 'School One' }, issuer: { name: 'Admin' } };
for (const role of ['SCHOOL_ADMIN', 'SUPER_ADMIN']) for (const language of ['ar', 'en']) test(`${role} selects grade students, sends and revokes certificates ${language}`, async ({ page }) => {
  test.setTimeout(120000);
  const ar = language === 'ar'; const superAdmin = role === 'SUPER_ADMIN';
  await page.setViewportSize({ width: 390, height: 920 });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await serverSession(page, role as 'SUPER_ADMIN' | 'SCHOOL_ADMIN');
  await page.addInitScript(({ role, language }) => {
    const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : 'school_admin';
    localStorage.setItem(`${prefix}_user`, JSON.stringify({ id: 'admin', role, name: 'Admin', schoolId: role === 'SCHOOL_ADMIN' ? 'one' : null }));
    localStorage.setItem(`${prefix}_token`, 'cookie_auth'); localStorage.setItem('lms_lang', language); localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  }, { role, language });
  let sends = 0, revoked = false, pages = 0; const received: string[][] = [];
  await page.route('**/api/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role, schoolId: superAdmin ? null : 'one' } } });
    if (path === '/api/certificates/audience') {
      const schoolId = superAdmin ? url.searchParams.get('schoolId') : 'one';
      return route.fulfill({ json: { schools: superAdmin ? [{ id: 'one', name: 'School One' }, { id: 'two', name: 'School Two' }] : [{ id: 'one', name: 'School One' }], schoolId, grades: schoolId ? [{ value: 'G1', count: 42 }, { value: 'G2', count: 1 }] : [] } });
    }
    if (path === '/api/certificates/recipients') {
      pages++;
      expect(url.searchParams.get('schoolId')).toBe(superAdmin ? 'two' : 'one');
      if (url.searchParams.get('grade') === 'G2') return route.fulfill({ json: { items: [{ id: 'other-grade', name: 'Other grade student', username: 'other' }], total: 1, nextCursor: null } });
      const last = url.searchParams.has('cursor');
      return route.fulfill({ json: { items: last ? [{ id: 'student-40', name: 'Adam', username: 'adam' }, { id: 'student-41', name: 'Mariam', username: 'mariam' }] : Array.from({ length: 40 }, (_, i) => ({ id: `student-${i}`, name: `Student ${i}`, username: `user${i}` })), total: 42, nextCursor: last ? null : 'student-39' } });
    }
    if (path === '/api/certificates' && req.method() === 'POST') {
      const body = req.postDataBuffer()!.toString(); expect(req.headers()['content-type']).toContain('multipart/form-data');
      expect(body).toContain('Academic award');
      const ids = JSON.parse(body.match(/name="studentIds"\r\n\r\n([^\r]+)/)![1]) as string[];
      expect(body).toContain(`name="schoolId"\r\n\r\n${superAdmin ? 'two' : 'one'}`); expect(body).toContain('name="grade"\r\n\r\nG1');
      received.push(ids); sends++;
      return route.fulfill({ status: sends === 1 ? 201 : 200, json: { created: sends === 1 ? ids.length : 0, duplicates: sends === 1 ? 0 : ids.length, total: ids.length } });
    }
    if (path === '/api/certificates/cert' && req.method() === 'DELETE') { revoked = true; return route.fulfill({ json: { success: true } }); }
    if (path === '/api/certificates') return route.fulfill({ json: { items: sends ? [{ ...certificate, revokedAt: revoked ? '2026-10-21T12:00:00Z' : null }] : [], total: sends ? 1 : 0 } });
    return route.fulfill({ json: {} });
  });
  await page.goto(superAdmin ? '/super-admin/certificates' : '/school-admin/certificates');
  const grade = page.getByRole('combobox', { name: ar ? 'الصف الدراسي' : 'Grade', exact: true });
  if (superAdmin) { await expect(grade).toBeDisabled(); await page.getByRole('combobox', { name: ar ? 'المدرسة' : 'School', exact: true }).selectOption('two'); }
  else await expect(page.getByRole('combobox', { name: 'School', exact: true })).toHaveCount(0);
  await expect(grade).toBeEnabled(); await grade.selectOption('G1');
  const list = page.getByRole('group', { name: ar ? 'قائمة الطلاب' : 'Student list', exact: true });
  await expect(list.getByRole('checkbox')).toHaveCount(42); expect(pages).toBeGreaterThanOrEqual(2);
  const selectAll = page.getByRole('checkbox', { name: ar ? 'تحديد كل طلاب الصف' : 'Select all grade students', exact: true });
  await selectAll.check(); await expect(page.getByRole('status').filter({ hasText: ar ? '42 محدد من 42' : '42 of 42 selected' })).toBeVisible();
  await grade.selectOption('G2'); await expect(list.getByRole('checkbox')).toHaveCount(1); await expect(list.getByRole('checkbox')).not.toBeChecked();
  await grade.selectOption('G1'); await expect(list.getByRole('checkbox')).toHaveCount(42);
  const search = page.getByRole('searchbox', { name: ar ? 'البحث في طلاب الصف' : 'Search grade students' });
  await search.fill('Adam'); await list.getByRole('checkbox', { name: /Adam/ }).check();
  await expect(page.getByRole('status').filter({ hasText: ar ? '1 محدد من 42' : '1 of 42 selected' })).toBeVisible();
  await selectAll.check(); await expect(page.getByRole('status').filter({ hasText: ar ? '42 محدد من 42' : '42 of 42 selected' })).toBeVisible();
  await page.getByRole('button', { name: ar ? 'إلغاء التحديد' : 'Clear selection', exact: true }).click();
  await list.getByRole('checkbox', { name: /Adam/ }).check(); await search.fill('Mariam'); await list.getByRole('checkbox', { name: /Mariam/ }).check(); await search.fill('');
  for (const width of [320, 390, 768, 1536]) { await page.setViewportSize({ width, height: 920 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  await expect(page.locator('html')).toHaveAttribute('dir', ar ? 'rtl' : 'ltr');
  const audit = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  await page.screenshot({ path: `../artifacts/platform/certificate-picker-${role}-${language}-1536.png`, fullPage: true });
  const send = () => page.getByRole('button', { name: ar ? 'حفظ وإرسال إلى 2 طالب' : 'Save & send to 2 students', exact: true });
  await page.getByLabel(ar ? 'عنوان الشهادة' : 'Certificate title', { exact: true }).fill('Academic award'); await page.locator('input[type=file]').setInputFiles({ name: 'award.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await send().click(); await expect(page.getByRole('status').filter({ hasText: ar ? 'تم إرسال 2 شهادة' : 'Sent 2 certificates' })).toBeVisible();
  expect(received[0].sort()).toEqual(['student-40', 'student-41']);
  await expect(list.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await list.getByRole('checkbox', { name: /Adam/ }).check(); await list.getByRole('checkbox', { name: /Mariam/ }).check();
  await page.getByLabel(ar ? 'عنوان الشهادة' : 'Certificate title', { exact: true }).fill('Academic award'); await page.locator('input[type=file]').setInputFiles({ name: 'award.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await send().click(); await expect(page.getByRole('status').filter({ hasText: ar ? 'المحفوظة مسبقًا: 2' : 'Already saved: 2' })).toBeVisible();
  await page.getByRole('button', { name: ar ? 'إلغاء الشهادة' : 'Revoke certificate', exact: true }).click(); await page.getByRole('button', { name: ar ? 'تأكيد الإلغاء' : 'Confirm revocation', exact: true }).click(); await expect.poll(() => revoked).toBe(true);
  await page.setViewportSize({ width: 390, height: 920 }); await page.screenshot({ path: `../artifacts/platform/certificate-picker-${role}-${language}-390.png`, fullPage: true });
});

test('large grade sends preserve completed batches and retry only the remaining students', async ({ page }) => {
  test.setTimeout(90000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await serverSession(page, 'SCHOOL_ADMIN');
  await page.addInitScript(() => {
    localStorage.setItem('school_admin_user', JSON.stringify({ id: 'admin', role: 'SCHOOL_ADMIN', name: 'Admin', schoolId: 'one' })); localStorage.setItem('school_admin_token', 'cookie_auth'); localStorage.setItem('lms_lang', 'en'); localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  });
  const students = Array.from({ length: 101 }, (_, i) => ({ id: `s${i}`, name: `Student ${i}`, username: `user${i}` })); const batches: string[][] = [];
  await page.route('**/api/**', route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SCHOOL_ADMIN', schoolId: 'one' } } });
    if (path === '/api/certificates/audience') return route.fulfill({ json: { schools: [{ id: 'one', name: 'School One' }], schoolId: 'one', grades: [{ value: 'G1', count: 101 }] } });
    if (path === '/api/certificates/recipients') return route.fulfill({ json: { items: students, nextCursor: null, total: 101 } });
    if (path === '/api/certificates' && req.method() === 'POST') {
      const ids = JSON.parse(req.postDataBuffer()!.toString().match(/name="studentIds"\r\n\r\n([^\r]+)/)![1]) as string[]; batches.push(ids);
      return route.fulfill({ status: batches.length === 2 ? 500 : 201, json: batches.length === 2 ? { error: 'Connection failed' } : { created: ids.length, duplicates: 0, total: ids.length } });
    }
    if (path === '/api/certificates') return route.fulfill({ json: { items: [], total: 0 } });
    return route.fulfill({ json: {} });
  });
  await page.goto('/school-admin/certificates'); const grade = page.getByRole('combobox', { name: 'Grade', exact: true }); await expect(grade).toBeEnabled(); await grade.selectOption('G1');
  await page.getByRole('checkbox', { name: 'Select all grade students', exact: true }).check();
  await page.getByLabel('Certificate title', { exact: true }).fill('Academic award'); await page.locator('input[type=file]').setInputFiles({ name: 'award.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await page.getByRole('button', { name: 'Save & send to 101 students', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Saved for 100 of 101 students.' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '1 of 101 selected' })).toBeVisible();
  expect(batches[0]).toHaveLength(100); expect(batches[1]).toHaveLength(1);
  await page.getByRole('button', { name: 'Save & send to 1 students', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Sent 1 certificates' })).toBeVisible(); expect(batches[2]).toEqual(batches[1]);
  expect(batches[0]).not.toContain(batches[2][0]);
});
