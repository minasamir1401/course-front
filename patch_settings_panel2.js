const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/new/components/SettingsPanel.tsx',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/components/SettingsPanel.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/components/SettingsPanel.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/components/SettingsPanel.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix the "onChange={() => toggleCourseSubject(cat, e.target.checked)}" missing 'e' bug
    const searchStr = `onChange={() => toggleCourseSubject(cat, e.target.checked)}`;
    const replaceStr = `onChange={(e) => toggleCourseSubject(cat, e.target.checked)}`;

    if (content.includes(searchStr)) {
        content = content.split(searchStr).join(replaceStr);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Patched ' + file);
    } else {
        console.log('Not found in ' + file);
    }
  } else {
      console.log('File does not exist: ' + file);
  }
}
