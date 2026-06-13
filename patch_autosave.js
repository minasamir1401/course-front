const fs = require('fs');

const examFiles = [
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

const courseFiles = [
  'src/app/super-admin/courses/edit/page.tsx',
  'src/app/school-admin/courses/edit/page.tsx'
];

// Helper to inject code
function injectAutoSaveExam(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf-8');

  // 1. Add states if not present
  if (!code.includes('isAutoSaveEnabled')) {
    code = code.replace(
      /const \[saving, setSaving\] = useState\(false\);/,
      `const [saving, setSaving] = useState(false);\n  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);\n  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);`
    );
  }

  // 2. Modify handleSubmit to take isAutoSave
  if (!code.includes('isAutoSave = false')) {
    code = code.replace(
      /const handleSubmit = async \(statusOverride: string \| null = null\) => {/,
      `const handleSubmit = async (statusOverride: string | null = null, isAutoSave = false) => {`
    );
    
    // Replace the success navigation logic
    code = code.replace(
      /if \(res\.ok\) {\s*showToast\("تم تحديث الاختبار بنجاح!", 'success'\);\s*router\.push\("\/.*?"\);\s*}/,
      `if (res.ok) {\n        if (!isAutoSave) {\n          showToast("تم تحديث الاختبار بنجاح!", 'success');\n          router.push(filePath.includes('super') ? "/super-admin/exams" : "/school-admin/exams");\n        } else {\n          setLastAutoSave(new Date());\n        }\n      }`
    );
  }

  // 3. Add useEffect for auto-save
  if (!code.includes('Auto-save interval')) {
    code = code.replace(
      /useEffect\(\(\) => {\n\s*fetchData\(\);\n\s*}, \[id\]\);/,
      `useEffect(() => {
    fetchData();
  }, [id]);

  // Auto-save interval
  useEffect(() => {
    if (!isAutoSaveEnabled || !id || id === 'new') return;
    const interval = setInterval(() => {
      handleSubmit("DRAFT", true);
    }, 60000);
    return () => clearInterval(interval);
  }, [id, isAutoSaveEnabled, examInfo, questions]);`
    );
  }

  // 4. Add UI Toggle
  if (!code.includes('isAutoSaveEnabled')) {
     const toggleHtml = `
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 mr-4">
                <span className="text-sm font-bold text-white">الحفظ التلقائي</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isAutoSaveEnabled} onChange={(e) => setIsAutoSaveEnabled(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              {lastAutoSave && <span className="text-xs text-slate-400 font-bold mr-4 mt-4">آخر حفظ: {lastAutoSave.toLocaleTimeString()}</span>}
`;
     code = code.replace(
       /<button\s+onClick=\{\(\) => handleSubmit\("DRAFT"\)\}/,
       toggleHtml + `\n              <button\n                onClick={() => handleSubmit("DRAFT")}`
     );
  }

  fs.writeFileSync(filePath, code);
}

function injectAutoSaveCourse(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf-8');

  // Add state if not present
  if (!code.includes('isAutoSaveEnabled')) {
    code = code.replace(
      /const \[lastAutoSave, setLastAutoSave\] = useState<Date \| null>\(null\);/,
      `const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);\n  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);`
    );
  }

  // Add toggle logic in auto-save effect
  if (code.includes('if (!courseId || courseId === \'new\') return;')) {
    code = code.replace(
      /if \(!courseId \|\| courseId === 'new'\) return;/,
      `if (!isAutoSaveEnabled || !courseId || courseId === 'new') return;`
    );
    // add isAutoSaveEnabled to dependency array
    code = code.replace(
      /}, \[courseId, title, domain, summary, thumbnailUrl, category, level, isVisible, requirements, tags, lessons, publishDate, price, pricingType\]\);/,
      `}, [courseId, title, domain, summary, thumbnailUrl, category, level, isVisible, requirements, tags, lessons, publishDate, price, pricingType, isAutoSaveEnabled]);`
    );
  }

  // Add UI Toggle
  if (!code.includes('الحفظ التلقائي')) {
     const toggleHtml = `
                <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 ml-4 hidden md:flex">
                  <span className="text-sm font-bold text-slate-600">الحفظ التلقائي</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isAutoSaveEnabled} onChange={(e) => setIsAutoSaveEnabled(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
`;
     code = code.replace(
       /{lastAutoSave && \(/,
       toggleHtml + `\n                {lastAutoSave && (`
     );
  }

  fs.writeFileSync(filePath, code);
}

examFiles.forEach(injectAutoSaveExam);
courseFiles.forEach(injectAutoSaveCourse);
