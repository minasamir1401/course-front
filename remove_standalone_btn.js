const fs = require('fs');
const path = require('path');

const files = [
  'src/app/super-admin/exams/new/page.tsx',
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/new/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // We are searching for the block:
  /*
                  <button 
                    onClick={handleAddStandaloneQuestion}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    {language === 'ar' ? 'إضافة سؤال حر' : 'Add Standalone Question'}
                  </button>
  */
  
  // We can use a regex to remove this button completely.
  const regex = /<button\s*onClick=\{handleAddStandaloneQuestion\}[\s\S]*?<\/button>/g;
  content = content.replace(regex, '');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${relPath} (removed standalone question button)`);
}
