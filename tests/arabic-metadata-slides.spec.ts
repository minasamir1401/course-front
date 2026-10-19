import { test, expect } from '@playwright/test';
import { studentSession, lesson, result } from './helpers/studentWorkspace';
for (const language of ['ar','en']) {
 test(`${language}: slide arrows follow language, respect bounds and leave editing controls alone`,async({page})=>{
  await studentSession(page,language);
  const slides=[{id:'s1',type:'TEXT',title:'Slide One',titleEn:'Slide One',content:'<p dir="rtl">أوجد x<sup>2</sup> - y<sup>2</sup></p>',skill:'حل المعادلات',skillEn:'Solving equations'}, {id:'s2',type:'TEXT',title:'Slide Two',titleEn:'Slide Two',content:'<p>Second content</p>'}, {id:'s3',type:'TEXT',title:'Slide Three',titleEn:'Slide Three',content:'<p>Third content</p>'}];
  await page.route('**/api/lessons/lesson',route=>route.fulfill({json:{...lesson,slides}}));
  await page.goto('/lessons/lesson?courseId=course');
  await page.locator('[data-slide-nav="open"]').click();
  await expect(page.getByText(/1 \/ 3/, { exact: false })).toBeVisible();
  await expect(page.locator('.math-tex').first()).toHaveCSS('direction','ltr');
  const forward=language==='ar'?'ArrowLeft':'ArrowRight',back=language==='ar'?'ArrowRight':'ArrowLeft';
  await page.keyboard.press(back);await expect(page.getByText(/1 \/ 3/, { exact: false })).toBeVisible();
  await page.keyboard.press(forward);await expect(page.getByText('Second content',{exact:true})).toBeVisible();
  await page.evaluate(()=>{const input=document.createElement('input');input.id='keyboard-edit-check';input.value='Editing';document.querySelector('main')?.append(input);input.focus();});
  await page.keyboard.press(forward);await expect(page.getByText('Second content',{exact:true})).toBeVisible();
  await page.evaluate(()=>document.querySelector<HTMLInputElement>('#keyboard-edit-check')?.blur());
  await page.keyboard.press(forward);await expect(page.getByText('Third content',{exact:true})).toBeVisible();
  await page.keyboard.press(forward);await expect(page.getByText('Third content',{exact:true})).toBeVisible();
  await page.keyboard.press(back);await expect(page.getByText('Second content',{exact:true})).toBeVisible();
 });
 test(`${language}: result metadata selects the matching language`,async({page})=>{
  await studentSession(page,language);
  await page.route('**/api/exams/submissions/submission',route=>route.fulfill({json:{...result,answers:result.answers.map(answer=>({...answer,question:{...answer.question,skill:'حل المعادلات',skillEn:'Solving equations',domain:'الجبر',domainEn:'Algebra',cognitive:'Application'}}))}}));
  await page.goto('/exams/result/submission');
  await page.getByRole('button',{name:language==='ar'?'المهارة':'Skill',exact:true}).first().click();
  await expect(page.getByRole('dialog')).toContainText(language==='ar'?'حل المعادلات':'Solving equations');
 });
}
