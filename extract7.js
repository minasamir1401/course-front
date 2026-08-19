const fs = require('fs');
const content = fs.readFileSync('src/app/super-admin/exams/new/page.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(25, 45).join('\n'));
