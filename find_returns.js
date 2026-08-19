const fs = require('fs');
const lines = fs.readFileSync('src/app/school-admin/courses/create/page.tsx', 'utf8').split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    count++;
  }
}
