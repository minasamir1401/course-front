const fs = require('fs');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // The buggy text we have right now:
  // <input
  //   type="datetime-local"
  // {activeTab === 'assignments' && renderQuestionsBuilder('assignments')}
  
  // We need to replace the missing code.
  
  let targetRegex = /<input\s*type="datetime-local"\s*\{activeTab === 'assignments'/g;
  let lines = content.split('\n');
  
  let cutOffDateIndex = lines.findIndex(l => l.includes('تاريخ الإيقاف') || l.includes('Cut-off Date'));
  let inputStart = lines.findIndex((l, i) => i > cutOffDateIndex && l.includes('<input'));
  let nextActiveTab = lines.findIndex((l, i) => i > inputStart && l.includes("activeTab === 'assignments'"));
  
  if (inputStart > -1 && nextActiveTab > -1) {
    let before = lines.slice(0, inputStart + 1);
    let after = lines.slice(nextActiveTab);
    
    let replacement = [
      `                            type="datetime-local"`,
      `                            value={currentLesson.cutOffDate || ""}`,
      `                            onChange={(e) => setCurrentLesson({...currentLesson, cutOffDate: e.target.value})}`,
      `                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-red-500 transition-all"`,
      `                          />`,
      `                       </div>`,
      `                    </div>`,
      `                  </div>`,
      `                )}`,
      ``,
      `                {activeTab === 'slides' && renderSlidesBuilder('slides')}`,
      ``
    ];
    
    let newContent = before.concat(replacement, after).join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log("Fixed", filePath);
  }
}

fix('src/app/school-admin/courses/create/page.tsx');
