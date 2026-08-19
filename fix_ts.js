const fs = require('fs');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add deletedQuestionIds to new/page.tsx if missing
    if (filePath.includes('new/page.tsx') && !content.includes('setDeletedQuestionIds')) {
        content = content.replace(
            /const \[questions, setQuestions\] = useState.*?;\r?\n/g,
            `$&  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);\n`
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed deletedQuestionIds in " + filePath);
    }
}

processFile('src/app/super-admin/exams/new/page.tsx');
