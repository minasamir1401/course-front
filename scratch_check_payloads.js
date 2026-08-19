const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/page.tsx',
  'd:/mina/front/src/app/super-admin/exams/new/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let match = content.match(/status: "PUBLISHED",/g);
    console.log(file, match ? match.length : 0);
  }
});
