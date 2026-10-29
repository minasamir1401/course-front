import { test, expect } from '@playwright/test';
import { serverSession } from './helpers/serverSession';
import { buildSubmissionSnapshot, historicalSubmission, snapshotQuestion } from '../../back/src/utils/submissionSnapshot';

const questions = [
  { id: 'q1', order: 0, text: '<p><strong>Question 1-January International 2017</strong></p><p>ما <font color="#dc2626" >نصف القطر</font> لدائرة مركزها (0, 2) وتقطع محور الصادات عند (0, -10) و(0, 14)؟</p>', textEn: '<p><strong>Question 1-January International 2017</strong></p><p>In the xy-plane, what is the<font color="#dc2626" > radius</font> of the circle with center (0, 2) and y-intercepts (0, -10) and (0, 14)?</p>', options: ['10', '12', '13', '14'], correctAnswer: '12' },
  { id: 'q2', order: 1, text: '<p>Question 2</p><p>كم يساوي 3 + 4؟</p>', textEn: '<p>Question 2</p><p>What is 3 + 4?</p>', options: ['7', '8'], correctAnswer: '7' },
  { id: 'q3', order: 2, text: '<p>Question 3</p><p>كم يساوي 6 × 2؟</p>', textEn: '<p>Question 3</p><p>What is 6 × 2?</p>', options: ['12', '10'], correctAnswer: '12' },
  { id: 'q4', order: 3, text: '<p><strong>Question 4-College Board</strong></p><p>دائرة <font color="#dc2626">محيطها</font> 31π سنتيمترًا. ما قطرها؟</p>', textEn: '<p><strong>Question 4-College Board</strong></p><p>A circle has a <font color="#dc2626">circumference</font> of 31π centimeters. What is the <font color="#dc2626">diameter</font>, in centimeters, of the circle?</p>', options: ['15.5', '31', '62', '31π'], correctAnswer: '31' },
].map(question => ({ ...question, type: 'MCQ', points: 1, optionsEn: question.options, explanation: '<font color="#2563eb">شرح الإجابة</font>', explanationEn: '<font color="#2563eb">Worked explanation</font>', hint: '<font color="#dc2626">راجع المعطيات</font>', hintEn: '<font color="#dc2626">Review the given values</font>' }));

for (const language of ['ar', 'en']) test(`preview colours and result sequence survive answering question four first ${language}`, async ({ page }) => {
  const ar = language === 'ar';
  await serverSession(page, 'SUPER_ADMIN');
  await page.addInitScript(language => { localStorage.setItem('lms_lang', language); localStorage.setItem('super_admin_token', 'cookie_auth'); localStorage.setItem('super_admin_user', JSON.stringify({ id: 'admin', role: 'SUPER_ADMIN' })); localStorage.setItem('klevro-install-dismissed', String(Date.now())); }, language);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const assessment = { id: 'exam', title: 'اختبار ترتيب الأسئلة والألوان', titleEn: 'Question order and colours', type: 'Exam', duration: 30, passingScore: 50, attemptsAllowed: 3, status: 'PUBLISHED', resultVisibility: 'SHOW_ALL', modules: [], questions };
  let submission: Record<string, unknown> | undefined;
  let submittedAnswers: Array<{ questionId: string; selectedAnswer: string }> = [];
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: { authenticated: true, user: { id: 'admin', role: 'SUPER_ADMIN' } } });
    if (path === '/api/exams/exam') return route.fulfill({ json: assessment });
    if (path.endsWith('/submit')) {
      submittedAnswers = route.request().postDataJSON().answers;
      const byId = new Map(submittedAnswers.map(answer => [answer.questionId, answer.selectedAnswer]));
      // Exercise the backend's actual history reconstruction against an unordered relation.
      const rawAnswers = [3, 0, 2, 1].map(index => ({ id: `a${index}`, questionId: questions[index].id, selectedAnswer: byId.get(questions[index].id) || '', isCorrect: byId.get(questions[index].id) === questions[index].correctAnswer, question: questions[index], questionSnapshot: snapshotQuestion(questions[index]) }));
      const reportSnapshot = buildSubmissionSnapshot(assessment, null, {}, questions, rawAnswers, 100, 0);
      const history = historicalSubmission({ answers: rawAnswers, reportSnapshot, totalScore: 4, percentage: 100 });
      submission = { id: 'preview-order', createdAt: new Date().toISOString(), exam: { ...assessment, totalPoints: 4 }, user: { name: 'Preview author' }, answers: history.answers, reportSnapshot, totalScore: history.totalScore, percentage: history.percentage, correctAnswers: 4, totalQuestions: 4, passed: true, historicalSnapshot: true, earnedXP: 0 };
      return route.fulfill({ json: { submissionId: 'preview-order' } });
    }
    if (path === '/api/exams/submissions/preview-order') return route.fulfill({ json: submission });
    return route.fulfill({ json: {} });
  });
  await page.setViewportSize({ width: 1191, height: 900 });
  await page.goto('/exams/exam?preview=true');
  await page.getByRole('button', { name: ar ? 'ابدأ الامتحان الآن' : 'Start Exam Now', exact: true }).click();
  const question = page.locator('[data-exam-question]');
  await expect(question.locator('font').first()).toHaveCSS('color', 'rgb(220, 38, 38)');
  await expect(question).not.toContainText('<font');
  await page.getByRole('button', { name: ar ? 'إظهار التلميح' : 'Show Hint', exact: true }).click();
  await expect(question.locator('font').last()).toHaveCSS('color', 'rgb(220, 38, 38)');
  await question.screenshot({ path: `../artifacts/exam-preview-order/coloured-question-${language}.png` });
  const navigation = page.getByRole('navigation', { name: ar ? 'أسئلة الاختبار' : 'Exam questions', exact: true });
  for (const [index, answer] of [[3, '31'], [0, '12'], [1, '7'], [2, '12']] as const) {
    await navigation.getByRole('button').nth(index).click();
    await question.getByRole('button', { name: new RegExp(`(?:^|\\s)${answer}(?:$|\\s)`) }).first().click();
  }
  await navigation.getByRole('button').nth(3).click();
  await page.getByRole('button', { name: ar ? 'تسليم الامتحان النهائي' : 'Submit Final Exam', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: ar ? 'نعم، قم بالتسليم الآن' : 'Yes, Submit Now', exact: true }).click();
  await expect(page).toHaveURL(/\/exams\/result\/preview-order/);
  await expect(page.getByRole('article')).toHaveCount(4);
  expect(submittedAnswers.map(answer => answer.questionId)).toEqual(['q4', 'q1', 'q2', 'q3']);
  expect(await page.getByRole('article').evaluateAll(elements => elements.map(element => element.getAttribute('data-question-id')))).toEqual(['q1', 'q2', 'q3', 'q4']);
  await expect(page.getByRole('article', { name: ar ? 'مراجعة السؤال 4' : 'Review question 4', exact: true })).toContainText('Question 4-College Board');
  const first = page.getByRole('article').first();
  await expect(first).toContainText('Question 1-January International 2017');
  await expect(first.locator('font').first()).toHaveCSS('color', 'rgb(220, 38, 38)');
  await expect(first).not.toContainText('<font');
  await first.screenshot({ path: `../artifacts/exam-preview-order/result-first-${language}.png` });
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
