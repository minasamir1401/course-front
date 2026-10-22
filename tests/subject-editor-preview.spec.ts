import { test,expect } from '@playwright/test';

for(const prefix of ['super-admin','school-admin'])test(`${prefix}: subject selections update the student cover in course and exam settings`,async({page})=>{
 test.setTimeout(120000);
 const role=prefix==='super-admin'?'SUPER_ADMIN':'SCHOOL_ADMIN';
 await page.addInitScript(({prefix,role})=>{const key=prefix.replace('-','_');const user={id:'editor',name:'Editor',role,schoolId:'school',status:'ACTIVE'};localStorage.setItem('lms_lang','ar');localStorage.setItem(`${key}_user`,JSON.stringify(user));localStorage.setItem(`${key}_token`,'test-session');localStorage.setItem(`${key}_token_expires_at`,String(Date.now()+86400000));},{prefix,role});
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.route('**/api/**',r=>{const url=new URL(r.request().url());const user={id:'editor',role,schoolId:'school',name:'Editor',status:'ACTIVE'};const data=url.pathname.includes('/auth/')||url.pathname.endsWith('/me')?{...user,user}:url.pathname.includes('/schools')?[{id:'school',name:'School'}]:url.pathname.includes('/metadata')?{domains:[],standards:[],indicators:[],outcomes:[]}:[];return r.fulfill({json:data});});
 await page.goto(`/${prefix}/courses/edit`,{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'إظهار إعدادات الكورس',exact:true}).click();
 const subject=page.getByLabel('المادة',{exact:true});await subject.fill('الرياضيات');await expect(page.locator('[data-subject="mathematics"]')).toBeVisible();
 await subject.fill('اللغة العربية');await expect(page.locator('[data-subject="arabic"]')).toBeVisible();await expect(page.locator('[data-subject="mathematics"]')).toHaveCount(0);
 await page.goto(`/${prefix}/exams/new?mode=exam`,{waitUntil:'domcontentloaded'});
 await expect(page.getByText('الغلاف الذي يظهر للطالب',{exact:true})).toBeVisible();
 const math=page.locator('label').filter({hasText:/^الرياضيات$/});const arabic=page.locator('label').filter({hasText:/^اللغة العربية$/});
 await math.click();await expect(page.locator('[data-subject="mathematics"]')).toBeVisible();await math.click();await arabic.click();await expect(page.locator('[data-subject="arabic"]')).toBeVisible();
});
