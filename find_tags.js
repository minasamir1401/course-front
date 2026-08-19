const fs = require('fs');
let lines = fs.readFileSync('src/app/school-admin/courses/create/page.tsx', 'utf8').split('\n');

let openTags = [];

// Let's start from 1174
for (let i = 1174; i <= 1504; i++) {
  let l = lines[i];
  if (!l) continue;
  
  // A naive tag parser
  // This will fail on self-closing tags like <input /> but we'll manually ignore them.
  let regex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
  let match;
  while ((match = regex.exec(l)) !== null) {
    let tag = match[1];
    let isSelfClosing = match[0].endsWith('/>');
    let isClosing = match[0].startsWith('</');
    
    if (isSelfClosing) continue;
    
    // Ignore self-closing ones that don't have /> (like <input>, <br>, <img>)
    if (['input', 'img', 'br', 'hr'].includes(tag)) continue;
    
    if (isClosing) {
      if (openTags.length > 0 && openTags[openTags.length - 1].tag === tag) {
        openTags.pop();
      } else {
        console.log(`Line ${i+1}: Found closing tag </${tag}> but last opened was <${openTags.length ? openTags[openTags.length - 1].tag : 'NONE'}>`);
      }
    } else {
      openTags.push({ tag, line: i+1 });
    }
  }
}

console.log("Unclosed tags:", openTags);
