const fs = require('fs');

function fixSyntaxSchoolAdmin(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let lines = content.split('\n');
    let newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("            <div className=\"flex flex-col gap-6\">") || lines[i].includes("                <div className=\"flex flex-col gap-6\">")) {
            let foundEnd = -1;
            for(let j = i; j < lines.length; j++) {
                if (lines[j].trim() === ")}") {
                    foundEnd = j;
                    break;
                }
            }
            if (foundEnd !== -1) {
                // Just delete the whole block unconditionally because it's unique
                i = foundEnd;
                continue;
            }
        }
        
        // Let's also check for `{questions.length === 0 && !showQuestionForm && (` which might have been left open
        if (lines[i].includes("{questions.length === 0 && !showQuestionForm && (")) {
            // we should remove this line too, it's just opening a broken condition
            continue;
        }

        newLines.push(lines[i]);
    }
    fs.writeFileSync(filepath, newLines.join('\n'));
}

fixSyntaxSchoolAdmin('D:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/exams/edit/[id]/page.tsx');
fixSyntaxSchoolAdmin('D:/pj/porj/corse/lms-platform/frontend/src/app/school-admin/exams/edit/[id]/page.tsx');
