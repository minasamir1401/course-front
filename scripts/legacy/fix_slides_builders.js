const fs = require('fs');

const goodSourceFile = 'src/app/school-admin/exams/new/components/SlidesBuilder.tsx';
const goodCode = fs.readFileSync(goodSourceFile, 'utf-8');
const lines = goodCode.split('\n');

let braces = 0;
let endIndex = -1;
lines.forEach((l, i) => {
  const open = (l.match(/\{/g) || []).length;
  const close = (l.match(/\}/g) || []).length;
  braces += (open - close);
  if (braces === 0 && endIndex === -1 && i > 10) {
    endIndex = i;
  }
});

if (endIndex === -1) endIndex = lines.length - 1;

// We want to slice from 0 to endIndex (inclusive of endIndex)
const properCode = lines.slice(0, endIndex + 1).join('\n');

const targets = [
  'src/app/super-admin/exams/new/components/SlidesBuilder.tsx',
  'src/app/super-admin/exams/edit/[id]/components/SlidesBuilder.tsx',
  'src/app/school-admin/exams/new/components/SlidesBuilder.tsx',
  'src/app/school-admin/exams/edit/[id]/components/SlidesBuilder.tsx'
];

targets.forEach(target => {
  if (fs.existsSync(target)) {
    fs.writeFileSync(target, properCode);
    console.log('Fixed:', target);
  } else {
    console.log('Not found:', target);
  }
});

console.log('All SlidesBuilders fixed!');
