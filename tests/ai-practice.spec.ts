import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { studentSession } from './helpers/studentWorkspace';
import type { AiPracticeData } from '../src/lib/aiPractice';

function fixture(ar = true): AiPracticeData {
  return { messageId: 'practice-message', version: 1, title: ar ? 'النسب المئوية — جرّب بنفسك' : 'Percentages — try it yourself', introduction: ar ? 'تدريب قصير على حساب النسبة والخصم، خطوة بخطوة.' : 'Practise percentages and discounts, one step at a time.', layout: 'step',
    questions: [
      { id: 'q1', type: 'single_choice', prompt: ar ? 'ما قيمة \\(25\\%\\) من 200 جنيه؟' : 'What is \\(25\\%\\) of 200?', options: [{ id: 'o1', text: '50' }, { id: 'o2', text: '25' }, { id: 'o3', text: '100' }], hint: ar ? '25% تعني الربع. اقسم المبلغ على أربعة.' : '25% is one quarter. Divide the amount by four.' },
      { id: 'q2', type: 'multiple_choice', prompt: ar ? 'اختر كل الكسور التي تساوي 50%.' : 'Select every fraction equal to 50%.', options: [{ id: 'o1', text: '\\(\\frac{1}{2}\\)' }, { id: 'o2', text: '\\(\\frac{1}{4}\\)' }, { id: 'o3', text: '\\(\\frac{2}{4}\\)' }], hint: ar ? 'حوّل الكسر إلى عدد عشري.' : 'Convert each fraction to a decimal.' },
      { id: 'q3', type: 'short_answer', prompt: ar ? 'سعر الحقيبة 200 جنيه. بعد خصم 25%، كم تدفع؟ اكتب العدد فقط.' : 'A bag costs 200. After a 25% discount, how much do you pay? Enter the number only.', options: [], hint: ar ? 'احسب الخصم ثم اطرحه من السعر الأصلي.' : 'Find the discount, then subtract it from the original price.' },
    ], score: { answered: 0, total: 3, correct: 0, completed: false, percent: 0 } };
}
async function setup(page: Page, ar = true, failFirst = false) {
  await studentSession(page, ar ? 'ar' : 'en');
  await page.addInitScript(() => localStorage.setItem('klevro-install-dismissed', String(Date.now())));
  await page.route('**/api/auth/me', route => route.fulfill({ json: { authenticated: true, user: { id: 'me', name: 'Student', role: 'STUDENT', schoolId: 'school' } } }));
  let practice = fixture(ar), failures = failFirst ? 1 : 0;
  const submissions: Array<{ questionId: string; answer: string | string[] }> = [];
  await page.route('**/api/ai/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/config')) return route.fulfill({ json: { enabled: true, starterPrompts: [] } });
    if (path.endsWith('/chat')) return route.fulfill({ json: { conversationId: 'thread', messageId: practice.messageId, model: 'test-fixture', content: practice.title, practice } });
    if (path.endsWith('/answer')) {
      const body = route.request().postDataJSON(); submissions.push(body);
      if (failures-- > 0) return route.fulfill({ status: 503, json: { error: ar ? 'تعذر حفظ الإجابة. أعد المحاولة.' : 'Could not save your answer. Try again.' } });
      const question = practice.questions.find(item => item.id === body.questionId)!;
      const correct = question.id === 'q1' ? body.answer[0] === 'o1' : question.id === 'q2' ? [...body.answer].sort().join(',') === 'o1,o3' : body.answer === '150';
      question.result = { submittedAnswer: body.answer, isCorrect: correct, answeredAt: new Date().toISOString(), correctAnswer: question.id === 'q1' ? '50' : question.id === 'q2' ? '1/2, 2/4' : '150', explanation: ar ? 'الخصم يساوي ربع السعر: 200 ÷ 4 = 50. السعر بعد الخصم: 200 − 50 = 150.' : 'The discount is one quarter: 200 ÷ 4 = 50. The final price is 200 − 50 = 150.' };
      const answered = practice.questions.filter(item => item.result), count = answered.filter(item => item.result!.isCorrect).length;
      practice = { ...practice, score: { answered: answered.length, total: 3, correct: count, completed: answered.length === 3, percent: Math.round(count / 3 * 100) } };
      return route.fulfill({ json: { practice } });
    }
    if (path === '/api/ai/practice/practice-message') return route.fulfill({ json: { practice } });
    if (path.endsWith('/conversations')) return route.fulfill({ json: { conversations: [{ id: 'thread', title: ar ? 'تدريب محفوظ' : 'Saved practice' }] } });
    if (path.endsWith('/conversations/thread')) return route.fulfill({ json: { id: 'thread', messages: [{ id: practice.messageId, role: 'assistant', content: practice.title, model: 'test-fixture', practice }] } });
    return route.fulfill({ json: {} });
  });
  await page.goto('/assistant?lessonId=lesson');
  const chat = page.getByRole('region', { name: ar ? 'محادثة مع مساعد Klevro' : 'Chat with Klevro assistant' });
  await chat.getByRole('textbox', { name: ar ? 'رسالتك للمساعد' : 'Your message' }).fill(ar ? 'اعملي 3 أسئلة تدريب' : 'Create 3 practice questions');
  await chat.getByRole('button', { name: ar ? 'إرسال' : 'Send', exact: true }).click();
  const card = chat.getByRole('region', { name: ar ? 'تدريب تفاعلي' : 'Interactive practice', exact: true });
  await expect(card).toBeVisible();
  return { card, chat, submissions };
}

for (const ar of [true, false]) test(`interactive practice answers, explanations, result and saved conversation ${ar ? 'ar' : 'en'}`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1191, height: 1000 });
  const { card, chat, submissions } = await setup(page, ar, true);
  const confirm = () => card.getByRole('button', { name: ar ? 'تأكيد الإجابة' : 'Confirm answer', exact: true });
  await expect(confirm()).toBeDisabled();
  await expect(card.locator('.katex')).not.toHaveCount(0);
  await expect(card.locator('[data-question=q2]')).toHaveCount(0);
  await card.getByText(ar ? 'محتاج تلميح؟' : 'Need a hint?', { exact: true }).click();
  await expect(card).toContainText(ar ? 'اقسم المبلغ' : 'Divide the amount');
  await card.getByRole('radio').nth(1).check();
  await confirm().click();
  await expect(card.getByRole('alert')).toContainText(ar ? 'تعذر حفظ' : 'Could not save');
  await expect(card.getByRole('radio').nth(1)).toBeChecked();
  await confirm().click();
  await expect(card.getByRole('status')).toContainText(ar ? 'محاولة مفيدة' : 'Good effort');
  await expect(card.getByRole('status').locator('bdi').last()).toHaveAttribute('dir', 'ltr');
  await expect(card.getByRole('radio').first()).toBeDisabled();
  await expect(card).toContainText(ar ? 'الإجابة الصحيحة: 50' : 'Correct answer: 50');
  if (ar) {
    await page.setViewportSize({ width: 1191, height: 1500 });
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: '../artifacts/ai-practice/question-feedback-desktop.png' });
    await page.setViewportSize({ width: 390, height: 1500 });
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: '../artifacts/ai-practice/question-feedback-mobile.png' });
    await page.setViewportSize({ width: 1191, height: 1000 });
  }
  await card.getByRole('button', { name: ar ? 'التالي' : 'Next', exact: true }).click();
  await card.getByRole('checkbox').nth(0).check();
  await card.getByRole('checkbox').nth(2).check();
  await confirm().click();
  await expect(card.getByRole('status')).toContainText(ar ? 'إجابة صحيحة' : 'Correct.');
  await card.getByRole('button', { name: ar ? 'التالي' : 'Next', exact: true }).click();
  await card.getByRole('textbox', { name: ar ? 'إجابة السؤال 3' : 'Answer to question 3' }).fill('150');
  await card.getByRole('textbox').press('Enter');
  await expect(card.getByRole('region', { name: ar ? 'نتيجة التدريب' : 'Practice result' })).toContainText('67');
  if (ar) {
    await page.setViewportSize({ width: 1191, height: 1500 });
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: '../artifacts/ai-practice/practice-result-desktop.png' });
    await page.setViewportSize({ width: 1191, height: 1000 });
  }
  expect(submissions).toEqual([{ questionId: 'q1', answer: ['o2'] }, { questionId: 'q1', answer: ['o2'] }, { questionId: 'q2', answer: ['o1', 'o3'] }, { questionId: 'q3', answer: '150' }]);
  await card.getByRole('button', { name: ar ? 'كل الأسئلة' : 'All questions', exact: true }).click();
  await expect(card.locator('[data-question]')).toHaveCount(3);
  const accessibility = await new AxeBuilder({ page }).include('[aria-label="' + (ar ? 'تدريب تفاعلي' : 'Interactive practice') + '"]').analyze();
  expect(accessibility.violations).toEqual([]);
  for (const width of [1191, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await card.scrollIntoViewIfNeeded();
    expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await chat.getByRole('button', { name: ar ? 'محادثة جديدة' : 'New conversation', exact: true }).click();
  await chat.getByRole('button', { name: ar ? 'سجل المحادثات' : 'Conversation history', exact: true }).click();
  await chat.getByRole('button', { name: ar ? 'تدريب محفوظ' : 'Saved practice', exact: true }).click();
  const restored = chat.getByRole('region', { name: ar ? 'تدريب تفاعلي' : 'Interactive practice', exact: true });
  await expect(restored).toContainText('67');
  await restored.getByRole('button', { name: ar ? 'تدريب جديد' : 'New practice', exact: true }).click();
  await expect(chat.getByRole('textbox', { name: ar ? 'رسالتك للمساعد' : 'Your message' })).toHaveValue(ar ? /تدريب جديد مشابه/ : /new interactive practice/);
});

test('practice content is escaped, cannot run model HTML or turn options into links', async ({ page }) => {
  await setup(page);
  const malicious = fixture();
  malicious.questions[0].prompt = '<img src=x onerror="window.practiceXss=1">';
  malicious.questions[0].options[0].text = '<a href="javascript:alert(1)">اختيار</a>';
  malicious.questions[0].hint = '<script>window.practiceXss=1</script>';
  await page.route('**/api/ai/conversations/thread', route => route.fulfill({ json: { messages: [{ id: 'practice-message', role: 'assistant', content: '', practice: malicious }] } }));
  await page.getByRole('button', { name: 'محادثة جديدة', exact: true }).click();
  await page.getByRole('button', { name: 'سجل المحادثات', exact: true }).click();
  await page.getByRole('button', { name: 'تدريب محفوظ', exact: true }).click();
  const card = page.getByRole('region', { name: 'تدريب تفاعلي', exact: true });
  await expect(card).toContainText('<img');
  await expect(card.locator('img, script, a')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { practiceXss?: number }).practiceXss)).toBeUndefined();
});
