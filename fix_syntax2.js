const fs = require('fs');

function fixSyntaxSchoolAdmin(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let lines = content.split('\n');
    let newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("<div className=\"flex flex-col gap-6\">")) {
            // Find the closing )}
            let foundEnd = -1;
            for(let j = i; j < lines.length; j++) {
                if (lines[j].trim() === ")}") {
                    foundEnd = j;
                    break;
                }
            }
            if (foundEnd !== -1) {
                // Check if this is the broken block
                if (lines[i+2] && lines[i+2].includes("className=\"bg-slate-50 hover:bg-slate-100 text-slate-800")) {
                    i = foundEnd;
                    continue;
                }
            }
        }
        newLines.push(lines[i]);
    }
    fs.writeFileSync(filepath, newLines.join('\n'));
}

function fixSyntaxSuperAdmin(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let lines = content.split('\n');
    let newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("<div className=\"flex flex-col gap-6\">")) {
            let foundEnd = -1;
            for(let j = i; j < lines.length; j++) {
                if (lines[j].trim() === ")}") {
                    foundEnd = j;
                    break;
                }
            }
            if (foundEnd !== -1) {
                // Check if this is the broken block
                if (lines[i+2] && lines[i+2].includes("</p>")) {
                    i = foundEnd;
                    continue;
                }
            }
        }
        newLines.push(lines[i]);
    }
    fs.writeFileSync(filepath, newLines.join('\n'));
}

fixSyntaxSuperAdmin('D:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/exams/edit/[id]/page.tsx');
fixSyntaxSchoolAdmin('D:/pj/porj/corse/lms-platform/frontend/src/app/school-admin/exams/edit/[id]/page.tsx');
