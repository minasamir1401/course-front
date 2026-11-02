const fs = require('fs');

const filesToPatch = [
    'd:/mina/front/src/app/super-admin/exams/new/hooks/useExamState.ts',
    'd:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useExamState.ts',
];

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace API_URL/schools with API_URL/admin/schools
    if (content.includes('\${API_URL}/schools')) {
        content = content.replace(/\$\{API_URL\}\/schools/g, '${API_URL}/admin/schools');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Patched API URL in', file);
    } else {
        console.log('API URL already patched or not found in', file);
    }
});
