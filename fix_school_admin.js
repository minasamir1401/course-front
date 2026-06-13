const fs = require('fs');
const f = 'src/app/school-admin/exams/edit/[id]/page.tsx';
if(fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf-8');
  c = c.replace(/filePath\.includes\('super'\) \? "\/super-admin\/exams" : "\/school-admin\/exams"/g, '"/school-admin/exams"');
  fs.writeFileSync(f, c);
}
