import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';

for (const language of ['ar', 'en']) test(`competition downloads separate question and metadata templates (${language})`, async ({ page }) => {
  test.setTimeout(60000);
  const ar = language === 'ar';
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(language => {
    localStorage.setItem('super_admin_token', 'cookie_auth');
    localStorage.setItem('super_admin_user', JSON.stringify({ id: 'admin', role: 'SUPER_ADMIN' }));
    localStorage.setItem('lms_lang', language);
  }, language);
  let saved: any;
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN' } } });
    if (path === '/api/competitions/manage/options') return route.fulfill({ json: { subjects: [], grades: [], schools: [], courses: [], exams: [] } });
    if (path === '/api/competitions/manage/room' && route.request().method() === 'PATCH') { saved = route.request().postDataJSON(); return route.fulfill({ json: { id: 'room' } }); }
    if (path === '/api/competitions/room') return route.fulfill({ json: { admin: true, room: { id: 'room', title: 'Excel test', status: 'DRAFT', mode: 'SELF_PACED', sourceKind: 'GENERAL' }, questions: [{ id: 'q1', type: 'MCQ', text: 'Test question', options: ['A', 'B'], correctAnswer: 'B', points: 5, seconds: 30, metadata: { domain: 'الجبر', domainEn: 'Algebra', standard: 'معيار', learningOutcome: 'ناتج', hint: 'Hint' } }] } });
    return route.fulfill({ json: [] });
  });
  await page.goto('/super-admin/competitions/room/edit');
  const downloadBook = async (name: string) => {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name, exact: true }).click();
    return XLSX.readFile((await (await download).path())!);
  };
  const template = await downloadBook(ar ? 'نموذج الأسئلة' : 'Questions template');
  const questionRows = XLSX.utils.sheet_to_json<any[]>(template.Sheets.Questions, { header: 1 });
  expect(questionRows[0]).not.toContain('Metadata JSON');
  const exported = await downloadBook(ar ? 'تصدير الأسئلة للتعديل' : 'Export questions for editing');
  const exportedRows = XLSX.utils.sheet_to_json<any[]>(exported.Sheets.Questions, { header: 1 });
  expect(exportedRows[1][exportedRows[0].indexOf('Content JSON')]).not.toContain('Algebra');
  const metadata = await downloadBook(ar ? 'نموذج الميتا داتا' : 'Metadata template');
  expect(metadata.SheetNames).toEqual(['Metadata']);
  const rows = XLSX.utils.sheet_to_json<any[]>(metadata.Sheets.Metadata, { header: 1, defval: '' });
  expect(rows[0]).toHaveLength(25);
  expect(rows[1][0]).toBe('q1');
  const domainColumn = rows[0].findIndex((name: string) => ar ? name === 'المجال بالإنجليزية' : name === 'Domain (En)');
  rows[1][domainColumn] = 'Geometry';
  metadata.Sheets.Metadata = XLSX.utils.aoa_to_sheet(rows);
  await page.locator('input[type=file]').nth(1).setInputFiles({ name: 'metadata.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: XLSX.write(metadata, { type: 'buffer', bookType: 'xlsx' }) });
  await page.getByRole('button', { name: ar ? 'حفظ الأسئلة' : 'Save questions', exact: true }).click();
  await expect.poll(() => saved?.questions?.[0]?.domainEn).toBe('Geometry');
  expect(saved.questions[0]).toMatchObject({ id: 'q1', text: 'Test question', correctAnswer: 'B', points: 5, domain: 'الجبر', hint: 'Hint' });
});
