const fs = require('fs');
const content = fs.readFileSync('src/app/super-admin/exams/new/page.tsx', 'utf8');
console.log(content.split('\n').length);
