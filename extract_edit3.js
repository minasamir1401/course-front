const fs = require('fs');
const content = fs.readFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('lg:grid-cols-'));
if (start > -1) {
  console.log(lines.slice(start - 10, start + 10).join('\n'));
} else {
  console.log('Not found');
}
