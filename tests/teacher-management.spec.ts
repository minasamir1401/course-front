import { test, expect } from '@playwright/test';
import { serverSession } from './helpers/serverSession';

async function setup(page: any, role = 'SCHOOL_ADMIN') {
  await serverSession(page, role);
  const user = { id: 'admin', role, schoolId: 'school', name: 'Test admin', specialization: 'الرياضيات' };
  await page.addInitScript((user: any) => {
    localStorage.setItem('lms_lang', 'ar');
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
    localStorage.setItem('school_admin_token', 'cookie_auth');
    localStorage.setItem('school_admin_user', JSON.stringify(user));
  }, user);
  const teacher = { id: 'teacher', name: 'سارة حسن', username: 'sara', grade: 'الصف الأول الابتدائي', subject: 'الرياضيات', role: 'TEACHER', schoolId: 'school', status: 'ACTIVE' };
  await page.route('**/api/**', async (route: any) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user } });
    if (path === '/api/admin/users') return route.fulfill({ json: { users: [teacher], pagination: { total: 1, totalPages: 1 } } });
    if (path === '/api/admin/teacher-options') return route.fulfill({ json: { subjects: ['الرياضيات', 'الفيزياء'], grades: ['الصف الأول الابتدائي'] } });
    if (path === '/api/admin/users/teacher') return route.fulfill({ json: { user: teacher } });
    if (path === '/api/admin/impersonate/teacher') { Object.assign(user, teacher); return route.fulfill({ json: { user } }); }
    if (path === '/api/admin/stop-impersonate') { Object.assign(user, { id: 'admin', role: 'SCHOOL_ADMIN', name: 'Test admin' }); return route.fulfill({ json: { user } }); }
    if (path === '/api/reports/school') return route.fulfill({ json: { teacher: user.role === 'TEACHER', studentsCount: 2, coursesCount: 1, teachersCount: 1, generatedAt: '2026-11-03T10:00:00Z', upcomingExams: [], performanceData: [] } });
    if (path === '/api/certificates') return route.fulfill({ json: { items: [], total: 0 } });
    if (path === '/api/certificates/audience') return route.fulfill({ json: { schoolId: 'school', schools: [{ id: 'school', name: 'School' }], grades: [] } });
    return route.fulfill({ json: {} });
  });
}

test('teacher credentials can be edited; subjects are selected and the modal is above the sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1052, height: 602 }); await setup(page); await page.goto('/school-admin/teachers');
  await page.getByRole('button', { name: 'تعديل بيانات دخول سارة حسن' }).click();
  const dialog = page.getByRole('dialog', { name: 'تعديل بيانات المعلم' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: 'تخصص المدرس' })).toHaveValue('الرياضيات');
  await dialog.getByRole('combobox', { name: 'تخصص المدرس' }).selectOption('الفيزياء');
  await dialog.getByPlaceholder('username').fill('sara.updated');
  await dialog.getByLabel('كلمة المرور').fill('NewPassword123!');
  expect(await dialog.evaluate((node: HTMLElement) => node.parentElement?.parentElement === document.body)).toBe(true);
  expect(await dialog.evaluate((node: HTMLElement) => { const box = node.getBoundingClientRect(); return node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + 50)); })).toBe(true);
  await page.screenshot({ path: '../artifacts/quality-report/teacher-edit-desktop.png', fullPage: true });
  const saved = page.waitForRequest((request: any) => request.url().endsWith('/api/admin/users/teacher') && request.method() === 'PUT');
  await dialog.getByRole('button', { name: 'حفظ التعديلات' }).click();
  expect((await saved).postDataJSON()).toMatchObject({ username: 'sara.updated', password: 'NewPassword123!', subject: 'الفيزياء' });
  await expect(dialog).toBeHidden();
});

test('mobile edit preserves the password when blank and restores focus on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await setup(page); await page.goto('/school-admin/teachers');
  const edit = page.getByRole('button', { name: 'تعديل بيانات دخول سارة حسن' }); await edit.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('كلمة المرور')).toHaveValue('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '../artifacts/quality-report/teacher-edit-mobile.png', fullPage: true });
  await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(edit).toBeFocused();
  await edit.click();
  const saved = page.waitForRequest((request: any) => request.url().endsWith('/api/admin/users/teacher') && request.method() === 'PUT');
  await page.getByRole('dialog').getByRole('button', { name: 'حفظ التعديلات' }).click();
  expect((await saved).postDataJSON()).not.toHaveProperty('password');
});

test('teacher sees certificates and educational tools without student/staff account management', async ({ page }) => {
  await setup(page, 'TEACHER'); await page.goto('/school-admin');
  await expect(page.locator('nav a[href="/school-admin/certificates"]')).toBeAttached();
  await expect(page.locator('nav a[href="/school-admin/competitions"]')).toBeAttached();
  await expect(page.locator('nav a[href="/school-admin/students"]')).toHaveCount(0);
  await expect(page.locator('nav a[href="/school-admin/teachers"]')).toHaveCount(0);
  await page.goto('/school-admin/certificates'); await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('هذه الصفحة غير متاحة لحسابك.')).toHaveCount(0);
});

test('school admin enters and returns from a teacher session without entering credentials', async ({ page }) => {
  await setup(page); await page.goto('/school-admin/teachers');
  const entered = page.waitForRequest(request => request.url().endsWith('/api/admin/impersonate/teacher'));
  await page.getByRole('button', { name: 'الدخول لحساب سارة حسن' }).click();
  expect((await entered).method()).toBe('POST');
  expect((await entered).postData()).toBeNull();
  await expect(page).toHaveURL(/\/school-admin$/);
  const back = page.getByRole('button', { name: 'العودة للإدارة', exact: true });
  await expect(back).toBeVisible();
  const restored = page.waitForResponse(response => response.url().endsWith('/api/admin/stop-impersonate') && response.ok());
  await back.click(); await restored;
  await expect(back).toHaveCount(0);
  await expect(page.locator('nav a[href="/school-admin/teachers"]')).toBeAttached();
});
