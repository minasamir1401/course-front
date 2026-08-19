const fs = require('fs');
const content = fs.readFileSync('src/app/super-admin/exams/new/page.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex((l, i) => i > 100 && l.includes('return (') && lines[i+1] && lines[i+1].includes('<div'));
console.log(lines.slice(start - 2, start + 10).join('\n'));
