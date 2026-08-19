const fs = require('fs');
const content = fs.readFileSync('src/app/super-admin/exams/new/page.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex((l, i) => i > 100 && l.includes('return ('));
console.log(lines.slice(start, start + 15).join('\n'));
