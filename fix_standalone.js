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
  if (!fs.existsSync(fullPath)) {
    console.log(`Not found: ${fullPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Add the state if it doesn't exist
  if (!content.includes('const [visibleStandaloneCount')) {
    content = content.replace(
      'const [standaloneQuestions, setStandaloneQuestions] = useState<any[]>([]);',
      'const [standaloneQuestions, setStandaloneQuestions] = useState<any[]>([]);\n  const [visibleStandaloneCount, setVisibleStandaloneCount] = useState(50);'
    );
  }

  // Replace map with slice
  content = content.split('{standaloneQuestions.map').join('{standaloneQuestions.slice(0, visibleStandaloneCount).map');

  // Add Load More button
  const searchPattern = `                  ))}\n                  {standaloneQuestions.length === 0 && (`;
  const replacePattern = `                  ))}\n                  {standaloneQuestions.length > visibleStandaloneCount && (\n                    <div className="col-span-1 md:col-span-2 flex justify-center mt-6">\n                      <button\n                        onClick={(e) => { e.preventDefault(); setVisibleStandaloneCount(prev => prev + 50); }}\n                        className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black hover:bg-indigo-100 hover:scale-105 transition-all shadow-sm"\n                      >\n                        {language === 'ar' ? 'عرض المزيد من الأسئلة' : 'Load More Questions'} ({standaloneQuestions.length - visibleStandaloneCount} {language === 'ar' ? 'متبقي' : 'Remaining'})\n                      </button>\n                    </div>\n                  )}\n                  {standaloneQuestions.length === 0 && (`;
  
  content = content.split(searchPattern).join(replacePattern);

  // If there are different spaces
  const searchPattern2 = `                  ))}\r\n                  {standaloneQuestions.length === 0 && (`;
  const replacePattern2 = `                  ))}\r\n                  {standaloneQuestions.length > visibleStandaloneCount && (\r\n                    <div className="col-span-1 md:col-span-2 flex justify-center mt-6">\r\n                      <button\r\n                        onClick={(e) => { e.preventDefault(); setVisibleStandaloneCount(prev => prev + 50); }}\r\n                        className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black hover:bg-indigo-100 hover:scale-105 transition-all shadow-sm"\r\n                      >\r\n                        {language === 'ar' ? 'عرض المزيد من الأسئلة' : 'Load More Questions'} ({standaloneQuestions.length - visibleStandaloneCount} {language === 'ar' ? 'متبقي' : 'Remaining'})\r\n                      </button>\r\n                    </div>\r\n                  )}\r\n                  {standaloneQuestions.length === 0 && (`;
  
  content = content.split(searchPattern2).join(replacePattern2);

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}
