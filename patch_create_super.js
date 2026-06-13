const fs = require('fs');

const file = 'src/app/super-admin/courses/create/page.tsx';
if (fs.existsSync(file)) {
  let c = fs.readFileSync(file, 'utf-8');

  // 1. Add state variables
  c = c.replace(
    /const \[isLoading, setIsLoading\] = useState\(false\);/,
    `const [isLoading, setIsLoading] = useState(false);
    const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
    const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
    const [createdId, setCreatedId] = useState<string | null>(null);`
  );

  // 2. Add useEffect for auto save
  if (!c.includes('// Auto-save interval')) {
    c = c.replace(
      /const handleSubmit = async \(e: React.FormEvent\) => {/,
      `// Auto-save interval
    useEffect(() => {
      if (!isAutoSaveEnabled) return;
      
      const interval = setInterval(async () => {
        try {
          const token = localStorage.getItem("super_admin_token");
          if (!token) return;

          const lessonsPayload = lessons.map((l) => ({
            title: l.title,
            domain: l.domain || null,
            videoUrl: l.videoUrl || null,
            summary: l.summary || null,
            notes: l.notes || null,
            standards: l.standards || null,
            indicators: l.indicators || null,
            learningOutcomes: l.learningOutcomes || null,
            isVisible: l.isVisible !== undefined ? l.isVisible : true,
            publishDate: l.publishDate ? new Date(l.publishDate).toISOString() : null,
            cutOffDate: l.cutOffDate ? new Date(l.cutOffDate).toISOString() : null,
            attachments: JSON.stringify(l.attachments || []),
            slides: JSON.stringify(l.slides || []),
            questions: JSON.stringify(l.questions || []),
            assignments: JSON.stringify(l.assignments || [])
          }));

          const subjectString = courseData.subjects.join(", ");
          
          const payload = {
            title: courseData.title || "مسودة كورس مركزي بدون عنوان",
            description: courseData.description,
            coverImage: courseData.coverImage || null,
            grades: courseData.grades,
            subject: subjectString || "غير محدد",
            country: courseData.country,
            isCentral: true,
            schoolIds: courseData.schoolIds,
            lessons: lessonsPayload
          };

          const method = createdId ? "PUT" : "POST";
          const url = createdId 
            ? \`\${API_URL}/admin/courses/\${createdId}\`
            : \`\${API_URL}/admin/courses\`;

          const res = await fetch(url, {
            method,
            headers: {
              Authorization: \`Bearer \${token}\`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            if (!createdId && data.course?.id) {
               setCreatedId(data.course.id);
            }
            setLastAutoSave(new Date());
          }
        } catch (err) {
          console.error("Auto save failed", err);
        }
      }, 60000);

      return () => clearInterval(interval);
    }, [isAutoSaveEnabled, createdId, courseData, lessons]);

    const handleSubmit = async (e: React.FormEvent) => {`
    );
  }

  // 3. Add toggle UI to header
  c = c.replace(
    /<button classN[^>]*?bg-gradient-to-r from-indigo-600 to-blue-600[^>]*?>[\s\S]*?<\/button>/,
    `
                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 ml-4">
                    <span className="text-sm font-bold text-slate-600">الحفظ التلقائي</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isAutoSaveEnabled} onChange={(e) => {
                        setIsAutoSaveEnabled(e.target.checked);
                        if (e.target.checked) {
                          showToast("تم تفعيل الحفظ التلقائي (سيتم حفظ مسودة دورياً)", "info");
                        } else {
                          showToast("تم إيقاف الحفظ التلقائي", "info");
                        }
                      }} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {lastAutoSave && (
                    <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span dir="ltr">{lastAutoSave.toLocaleTimeString()}</span>
                      <span>آخر حفظ:</span>
                    </div>
                  )}
                  <button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-12 py-5 rounded-[22px] font-black flex items-center gap-3 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ ونشر الكورس' : 'Save & Publish')}
                    {!isLoading && <Save className="w-6 h-6" />}
                  </button>
                </div>`
  );

  // Note: Ensure we also use createdId in the final handleSubmit!
  c = c.replace(
    /const res = await fetch\(`\$\{API_URL\}\/admin\/courses`, {[\s\S]*?method: "POST",/,
    `
        const method = createdId ? "PUT" : "POST";
        const url = createdId 
          ? \`\${API_URL}/admin/courses/\${createdId}\`
          : \`\${API_URL}/admin/courses\`;

        const res = await fetch(url, {
          method,`
  );

  fs.writeFileSync(file, c);
  console.log('Modified super-admin/courses/create');
}
