const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/new/page.tsx',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/page.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/page.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    const searchStr = `const renderQuestionsBuilderProps = () => (
    <QuestionsBuilder`;

    const replaceStr = `const renderQuestionsBuilderProps = (source: 'assignments' | 'questions') => (
    <QuestionsBuilder  
      source={source}`;

    if (content.includes(searchStr)) {
        content = content.replace(searchStr, replaceStr);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Patched ' + file);
    } else {
        // Fallback search with variable whitespace
        const regex = /const renderQuestionsBuilderProps = \(\) => \(\s*<QuestionsBuilder/g;
        if (regex.test(content)) {
            content = content.replace(regex, `const renderQuestionsBuilderProps = (source: 'assignments' | 'questions') => (\n    <QuestionsBuilder\n      source={source}`);
            fs.writeFileSync(file, content, 'utf8');
            console.log('Patched via regex ' + file);
        } else {
            console.log('Not found in ' + file);
        }
    }
  }
}
