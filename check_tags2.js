const fs = require('fs');

function checkTags(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    let lines = content.split('\n');
    let stack = [];
    
    // start from the fragment
    let started = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes("{!showQuestionForm && (")) {
            started = true;
        }
        if (started) {
            let openDivs = (line.match(/<div(\s|>)/g) || []).length;
            let closeDivs = (line.match(/<\/div>/g) || []).length;
            let openFrag = (line.match(/<>/g) || []).length;
            let closeFrag = (line.match(/<\/>/g) || []).length;
            
            for(let j=0; j<openDivs; j++) stack.push('div');
            for(let j=0; j<openFrag; j++) stack.push('frag');
            
            for(let j=0; j<closeDivs; j++) {
                if (stack[stack.length-1] === 'div') stack.pop();
                else console.log("Mismatch close div at line " + (i+1) + ": stack top is " + stack[stack.length-1]);
            }
            for(let j=0; j<closeFrag; j++) {
                if (stack[stack.length-1] === 'frag') stack.pop();
                else console.log("Mismatch close frag at line " + (i+1) + ": stack top is " + stack[stack.length-1]);
            }
            
            if (line.trim() === ")}") {
                console.log("End of block at line " + (i+1) + ". Stack length:", stack.length, stack);
                break;
            }
        }
    }
}
checkTags('D:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/exams/edit/[id]/page.tsx');
