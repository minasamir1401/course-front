const fs = require('fs');
const files = [
  'src/app/school-admin/courses/edit/page.tsx',
  'src/app/super-admin/courses/edit/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx',
  'src/app/super-admin/exams/edit/[id]/page.tsx'
];

files.forEach(f => {
  if(fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf-8');
    c = c.replace(/showToast\("تم تفعيل الحفظ التلقائي \(سيتم حفظ مسودة دورياً\)", "warning"\);/g, 'showToast("تم تفعيل الحفظ التلقائي (سيتم حفظ مسودة دورياً)", "info");');
    fs.writeFileSync(f, c);
  }
});
