const fs = require('fs');
const content = fs.readFileSync('src/components/Header.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('onMenuClick') && l.includes('<button'));
if (start > -1) {
  console.log(lines.slice(start - 5, start + 10).join('\n'));
} else {
  console.log('Not found');
}
