const fs = require('fs');

function search(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let found = false;
  lines.forEach((line, index) => {
    if (line.includes('showSettingsSidebar')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
      found = true;
    }
  });
  if (!found) console.log('Not found in ' + file);
}

search('src/app/super-admin/exams/edit/[id]/page.tsx');
