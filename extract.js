const fs = require('fs');

const content = fs.readFileSync('src/app/super-admin/exams/new/page.tsx', 'utf8');
const lines = content.split('\n');
const index = lines.findIndex(l => l.includes('showSettingsSidebar') && l.includes('useState'));

console.log('useState lines:');
console.log(lines.slice(index - 2, index + 3).join('\n'));

const renderIndex = lines.findIndex((l, i) => i > index && l.includes('showSettingsSidebar') && l.includes('button'));
if (renderIndex > -1) {
  console.log('\nRender lines:');
  console.log(lines.slice(renderIndex - 5, renderIndex + 15).join('\n'));
}
