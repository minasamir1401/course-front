const fs = require('fs');

function cleanBrokenState(filepath, isSchoolAdmin) {
    let content = fs.readFileSync(filepath, 'utf8');
    let lines = content.split('\n');
    let newLines = [];
    
    let i = 0;
    while (i < lines.length) {
        if (lines[i].includes("<div className=\"flex flex-col gap-6\">")) {
            newLines.push(lines[i]);
            // check if the next lines are the broken state
            let nextLine = lines[i+1] || "";
            let nextNextLine = lines[i+2] || "";
            
            if (nextNextLine.includes("className=\"bg-slate-50") || nextNextLine.includes("</p>")) {
                // We found the broken block! Skip until )}
                let foundEnd = -1;
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim() === ")}") {
                        foundEnd = j;
                        break;
                    }
                }
                
                if (foundEnd !== -1) {
                    i = foundEnd + 1;
                    continue;
                }
            }
        }
        
        newLines.push(lines[i]);
        i++;
    }
    
    fs.writeFileSync(filepath, newLines.join('\n'));
}

cleanBrokenState('D:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/exams/edit/[id]/page.tsx', false);
cleanBrokenState('D:/pj/porj/corse/lms-platform/frontend/src/app/school-admin/exams/edit/[id]/page.tsx', true);
