import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { serverSession } from './helpers/serverSession';

test.use({ serviceWorkers: 'block' });
test.setTimeout(90000);
test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await mkdir('../artifacts/platform', { recursive: true });
});

test('fixed template prints each selected name and uploads separate student images', async ({ page }) => {
  await serverSession(page, 'SCHOOL_ADMIN');
  await page.addInitScript(() => {
    localStorage.setItem('lms_lang', 'en');
    localStorage.setItem('school_admin_user', JSON.stringify({ id: 'issuer', name: 'Klevro Team', role: 'SCHOOL_ADMIN' }));
    localStorage.setItem('school_admin_token', 'cookie_auth');
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  });
  const students = [{ id: 'z', name: 'Hala Gamal', username: 'hala' }, { id: 'a', name: 'عمر أحمد', username: 'omar' }];
  await page.route('**/api/**', async route => {
    const req = route.request();
    const { pathname, searchParams } = new URL(req.url());
    if (pathname === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'issuer', name: 'Klevro Team', role: 'SCHOOL_ADMIN' } } });
    if (pathname === '/api/certificates/audience') return route.fulfill({ json: { schools: [{ id: 'school', name: 'Klevro Academy' }], schoolId: 'school', grades: [{ value: 'Grade 3', count: 2 }] } });
    if (pathname === '/api/certificates/recipients') return route.fulfill({ json: { items: students, nextCursor: null, total: 2 } });
    if (pathname === '/api/certificates' && req.method() === 'POST') {
      expect(searchParams.get('personalized')).toBe('1');
      const contentType = req.headers()['content-type'];
      const data = await new Response(new Uint8Array(req.postDataBuffer()!), { headers: { 'content-type': contentType } }).formData();
      expect(JSON.parse(String(data.get('studentIds')))).toEqual(['z', 'a']);
      const images = data.getAll('personalized') as File[];
      expect(images).toHaveLength(2);
      expect(images.every(image => image.type === 'image/webp' && image.size > 10000)).toBe(true);
      expect(Buffer.from(await images[0].arrayBuffer()).equals(Buffer.from(await images[1].arrayBuffer()))).toBe(false);
      return route.fulfill({ status: 201, json: { created: 2, duplicates: 0, total: 2 } });
    }
    return route.fulfill({ json: pathname === '/api/certificates' ? { items: [], total: 0 } : {} });
  });
  await page.goto('/school-admin/certificates');
  const grade = page.getByRole('combobox', { name: 'Grade', exact: true });
  await expect(grade).toBeEnabled();
  await grade.selectOption('Grade 3');
  await page.getByRole('checkbox', { name: /Hala/ }).check();
  await page.getByRole('checkbox', { name: /عمر/ }).check();
  await page.getByLabel('Course or achievement', { exact: true }).fill('Math Essentials: Functions and Their Applications');
  await page.getByLabel('Total duration (optional)').fill('8 hours');
  await page.getByLabel('Final score (optional)').fill('95%');
  const proof = page.locator('canvas[role="img"]');
  await expect(proof).toHaveAttribute('aria-label', /Certificate of Completion/);
  await expect.poll(() => proof.evaluate((canvas: HTMLCanvasElement) => canvas.getContext('2d')?.getImageData(750, 500, 1, 1).data[3])).toBe(255);
  const previewPng = await proof.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL('image/png').split(',')[1]);
  await writeFile('../artifacts/platform/klevro-certificate-design.png', Buffer.from(previewPng, 'base64'));
  await page.evaluate(() => {
    const observer = new MutationObserver(() => {
      const frame = document.querySelector<HTMLIFrameElement>('iframe[aria-hidden="true"][tabindex="-1"]');
      if (!frame?.contentWindow) return;
      const win = frame.contentWindow;
      win.print = () => {
        document.body.dataset.printNames = JSON.stringify(Array.from(win.document.images, image => image.alt).sort());
        queueMicrotask(() => win.dispatchEvent(new Event('afterprint')));
      };
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true });
  });
  await page.getByRole('button', { name: 'Print certificate template (2)', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-print-names', JSON.stringify(students.map(student => student.name).sort()));
  await page.getByRole('button', { name: 'Save & send to 2 students', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Sent 2 certificates' })).toBeVisible();
});

test('messages filter conversations, keep an empty thread separate and send to the selected student', async ({ page }) => {
  await serverSession(page, 'SCHOOL_ADMIN');
  await page.addInitScript(() => {
    localStorage.setItem('lms_lang', 'en');
    localStorage.setItem('school_admin_user', JSON.stringify({ id: 'staff', name: 'Teacher', role: 'SCHOOL_ADMIN' }));
    localStorage.setItem('school_admin_token', 'cookie_auth');
    localStorage.setItem('klevro-install-dismissed', String(Date.now()));
  });
  const staff = { id: 'staff', name: 'Teacher' };
  const sara = { id: 'sara', name: 'سارة — طالبة تجريبية', grade: 'Grade 3' };
  const omar = { id: 'omar', name: 'عمر — طالب تجريبي', grade: 'Grade 3' };
  const adam = { id: 'adam', name: 'Adam', grade: 'Grade 3' };
  const build = (id: string, sender: typeof staff, recipient: typeof staff, body: string, createdAt: string, readAt: string | null = null) => ({
    id, senderId: sender.id, sender, recipientId: recipient.id, recipient, body, createdAt, readAt,
  });
  const messages = [
    build('3', sara, staff, 'أحتاج مساعدة في الكسور. كيف أراجعها؟', '2026-11-12T14:20:00Z'),
    build('2', staff, sara, 'راجعي شرح الكسور في الدرس الخامس، ثم جربي حل الواجب مرة أخرى.', '2026-11-12T14:18:00Z'),
    build('1', staff, omar, 'تم استلام الواجب، شكرًا لك.', '2026-11-11T14:00:00Z'),
  ];
  await page.route('**/api/**', async route => {
    const req = route.request();
    const { pathname, searchParams } = new URL(req.url());
    if (pathname === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { ...staff, role: 'SCHOOL_ADMIN' } } });
    if (pathname === '/api/teaching/overview') return route.fulfill({ json: { students: [adam, sara, omar] } });
    if (pathname.startsWith('/api/teaching/students/')) return route.fulfill({ json: { profile: [adam, sara, omar].find(person => pathname.endsWith('/' + person.id)) } });
    if (pathname === '/api/messages' && req.method() === 'POST') {
      const data = req.postDataJSON();
      expect(data.recipientIds).toEqual(['adam']);
      messages.unshift(build('4', staff, adam, data.body, new Date().toISOString()));
      return route.fulfill({ status: 201, json: { delivered: 1 } });
    }
    if (pathname === '/api/messages') {
      const peer = searchParams.get('peerId');
      const items = peer ? messages.filter(message => [message.senderId, message.recipientId].includes(peer)) : messages;
      return route.fulfill({ json: { items, unread: 1, pagination: { pages: 1 } } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto('/school-admin/messages');
  const thread = page.getByRole('region', { name: 'Active conversation' });
  await expect(thread.getByText(/أحتاج مساعدة في الكسور/)).toBeVisible();
  await page.locator('main > div').first().screenshot({ path: '../artifacts/platform/klevro-messages-design.png' });
  await page.getByLabel('Conversation options').click();
  await page.getByRole('button', { name: 'Star conversation' }).click();
  await page.getByRole('button', { name: 'Starred', exact: true }).click();
  const list = page.getByRole('complementary', { name: 'Conversation list' });
  await expect(list.getByRole('button', { name: /سارة/ })).toBeVisible();
  await expect(list.getByRole('button', { name: /عمر/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'New chat' }).click();
  await list.getByRole('button', { name: /Adam/ }).click();
  await expect(thread.getByText('Start the conversation')).toBeVisible();
  await expect(thread.getByText(/أحتاج مساعدة في الكسور/)).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Welcome, Adam!');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(thread.getByText('Welcome, Adam!')).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
