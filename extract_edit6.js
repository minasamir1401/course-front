const fs = require('fs');
const content = fs.readFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('return (') && l.length < 20); // likely the main return
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (') && lines[i+1] && lines[i+1].includes('<DashboardLayout>')) {
    console.log(lines.slice(i, i + 40).join('\n'));
    break;
  }
}
