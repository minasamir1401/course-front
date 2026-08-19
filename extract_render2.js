const fs = require('fs');
const content = fs.readFileSync('src/app/super-admin/exams/new/page.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 1000; i < lines.length; i++) {
  if (lines[i].includes('return (') && lines[i+1] && lines[i+1].includes('<div className="flex-1')) {
    console.log(lines.slice(i - 2, i + 10).join('\n'));
    break;
  }
}
