const fs = require('fs');
const path = require('path');

const files = [
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Extract the MINA SHORTCUT block
  const startIndex = content.indexOf('// MINA SHORTCUT STATES');
  const endIndexStr = '// END MINA SHORTCUT';
  const endIndex = content.indexOf(endIndexStr);

  if (startIndex !== -1 && endIndex !== -1) {
    const blockToMove = content.substring(startIndex, endIndex + endIndexStr.length);
    // Remove it from its current location
    content = content.replace(blockToMove, '');
    
    // Find where standaloneQuestions is declared
    const targetStr = 'const [standaloneQuestions, setStandaloneQuestions] = useState<any[]>([]);';
    const targetStrAlternate = 'const [standaloneQuestions, setStandaloneQuestions] = useState<any[]>([]);';
    
    if (content.includes(targetStr)) {
      content = content.replace(targetStr, targetStr + '\n' + blockToMove);
    }
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Fixed ${relPath}`);
}
