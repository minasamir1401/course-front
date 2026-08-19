const fs = require('fs');

// Append school-admin paths to the existing transform_exams.js script

let content = fs.readFileSync('transform_exams.js', 'utf8');

if (!content.includes("processFile('src/app/school-admin/exams/edit/[id]/page.tsx')")) {
    content += `\nprocessFile('src/app/school-admin/exams/edit/[id]/page.tsx');\nprocessFile('src/app/school-admin/exams/new/page.tsx');\n`;
    fs.writeFileSync('transform_exams.js', content, 'utf8');
}
