const fs = require('fs');
for (const file of [
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx',
  'src/app/super-admin/exams/new/page.tsx',
  'src/app/school-admin/exams/new/page.tsx'
]) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text: "", type, moduleId, options:/g, 'text: "", type, options:');
  fs.writeFileSync(file, content);
}
