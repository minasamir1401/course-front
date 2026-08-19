const fs = require('fs');

let lines = fs.readFileSync('src/app/school-admin/courses/create/page.tsx', 'utf8').split('\n');

let questions = 0;
let colons = 0;

for (let i = 1174; i < 1500; i++) {
  let l = lines[i];
  if (!l) continue;
  
  // A naive check:
  // count ? that are not in strings or comments
  // Actually, let's just print lines with ? or : and check manually.
  let hasQ = l.includes('?');
  let hasC = l.includes(':');
  
  if (hasQ && !hasC) {
    console.log("Line " + (i+1) + " has ? but no : ->", l.trim());
  }
}
