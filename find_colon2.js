const fs = require('fs');
let lines = fs.readFileSync('src/app/school-admin/courses/create/page.tsx', 'utf8').split('\n');

for (let i = 1003; i <= 1174; i++) {
  let l = lines[i];
  if (!l) continue;
  let hasQ = l.includes('?');
  let hasC = l.includes(':');
  
  if (hasQ && !hasC) {
    console.log("Line " + (i+1) + " has ? but no : ->", l.trim());
  }
}
