const fs = require('fs');
const path = require('path');
const directories = [
  'src/app/super-admin/exams/new/components/ModuleModal.tsx',
  'src/app/super-admin/exams/edit/[id]/components/ModuleModal.tsx',
  'src/app/school-admin/exams/new/components/ModuleModal.tsx',
  'src/app/school-admin/exams/edit/[id]/components/ModuleModal.tsx'
];
directories.forEach(file => {
  const fullPath = path.join('d:/mina/front', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Find the youtube block
    const lines = content.split(/\r?\n/);
    
    const youtubeLabelIndex = lines.findIndex(l => l.includes("YouTube Video URL"));
    if (youtubeLabelIndex !== -1) {
        // The block is:
        // <div>
        //   <label ...
        //   <input ...
        //   ...
        // </div>
        // Assuming the <div> is 1 line above the label, and </div> is 7 lines below.
        let startIndex = youtubeLabelIndex - 1;
        while(startIndex > 0 && !lines[startIndex].includes('<div>')) {
            startIndex--;
        }
        let endIndex = youtubeLabelIndex + 1;
        while(endIndex < lines.length && !lines[endIndex].includes('</div>')) {
            endIndex++;
        }
        
        // Let's remove from startIndex to endIndex
        lines.splice(startIndex, endIndex - startIndex + 1);
        console.log(`Removed youtube block from ${fullPath}`);
    }
    
    const lessonContentIndex = lines.findIndex(l => l.includes("Lesson Content"));
    if (lessonContentIndex !== -1) {
        // The block is:
        // <div className="space-y-3">
        //   <label ...
        //   </label>
        //   <textarea
        //   ...
        //   />
        // </div>
        let startIndex = lessonContentIndex - 1;
        while(startIndex > 0 && !lines[startIndex].includes('<div className="space-y-3">')) {
            startIndex--;
        }
        let endIndex = lessonContentIndex + 1;
        while(endIndex < lines.length && !lines[endIndex].includes('</div>')) {
            endIndex++;
        }
        
        // Remove this block
        lines.splice(startIndex, endIndex - startIndex + 1);
        console.log(`Removed lesson content block from ${fullPath}`);
    }

    fs.writeFileSync(fullPath, lines.join('\n'));
  }
});
