const fs = require('fs');
['src/app/super-admin/exams/new/page.tsx', 'src/app/super-admin/exams/edit/[id]/page.tsx'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const start = lines.findIndex(l => l.includes('max-w-[1600px]'));
  console.log(`\n--- ${file} ---`);
  if (start > -1) {
    console.log(lines.slice(start - 2, start + 12).join('\n'));
  } else {
    console.log('Not found');
  }
});
