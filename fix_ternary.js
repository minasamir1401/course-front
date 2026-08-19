const fs = require('fs');

function fixTernary(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace `{isLessonModalOpen ? (` with `{isLessonModalOpen && (`
  content = content.replace(/\{isLessonModalOpen \? \(/g, '{isLessonModalOpen && (');
  
  // Replace `) : (` with `)} {!isLessonModalOpen && (`
  content = content.replace(/\) : \(\r?\n\s*<div className="animate-in fade-in duration-500">/g, ')}\n      {!isLessonModalOpen && (\n  <div className="animate-in fade-in duration-500">');
  
  // Notice that the end of file `)}` is ALREADY there, closing the second `&& (`!
  // Wait, if it was `isLessonModalOpen ? ( ... ) : ( ... )}`,
  // now it is `{isLessonModalOpen && ( ... )} {!isLessonModalOpen && ( ... )}`
  // so the last `)}` will close `{!isLessonModalOpen && (` perfectly!
  
  fs.writeFileSync(filePath, content);
  console.log("Replaced ternary in", filePath);
}

fixTernary('src/app/school-admin/courses/create/page.tsx');
fixTernary('src/app/super-admin/courses/create/page.tsx');
