const fs = require('fs');

function search(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (line.includes('showSettingsSidebar')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
}

search('src/app/super-admin/exams/new/page.tsx');
