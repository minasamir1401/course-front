const fs = require('fs');

const file = 'src/app/super-admin/exams/new/page.tsx';
if (fs.existsSync(file)) {
  let c = fs.readFileSync(file, 'utf-8');

  // 1. Add state variables
  c = c.replace(
    /const \[saving, setSaving\] = useState\(false\);/,
    `const [saving, setSaving] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);`
  );

  // 2. Add useEffect for auto save
  if (!c.includes('// Auto-save interval')) {
    c = c.replace(
      /const handleSubmit = async \(status: string = "PUBLISHED"\) => {/,
      `// Auto-save interval
  useEffect(() => {
    if (!isAutoSaveEnabled) return;
    
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("super_admin_token");
        if (!token) return;

        const questionsPayload = questions.map(q => ({
          ...q,
          explanation: JSON.stringify(q.sections || [])
        }));
        
        const payload = {
          ...examInfo,
          title: examInfo.title || "مسودة اختبار بدون عنوان",
          category: examInfo.subjects?.[0] || "غير محدد",
          status: "DRAFT",
          questions: questionsPayload
        };

        const method = createdId ? "PUT" : "POST";
        const url = createdId 
          ? \`\${API_URL}/exams/\${createdId}\`
          : \`\${API_URL}/exams\`;

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
          if (!createdId && data.exam?.id) {
             setCreatedId(data.exam.id);
          }
          setLastAutoSave(new Date());
        }
      } catch (err) {
        console.error("Auto save failed", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAutoSaveEnabled, createdId, examInfo, questions]);

  const handleSubmit = async (status: string = "PUBLISHED") => {`
    );
  }

  // 3. Add toggle UI to header
  c = c.replace(
    /<button[^>]*?onClick=\{\(\) => handleSubmit\("PUBLISHED"\)\}[^>]*?>[\s\S]*?<\/button>/,
    `              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 mr-4">
                <span className="text-sm font-bold text-white">الحفظ التلقائي</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isAutoSaveEnabled} onChange={(e) => {
                    setIsAutoSaveEnabled(e.target.checked);
                    if (e.target.checked) {
                      showToast("تم تفعيل الحفظ التلقائي (سيتم حفظ مسودة دورياً)", "info");
                    } else {
                      showToast("تم إيقاف الحفظ التلقائي", "info");
                    }
                  }} />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              {lastAutoSave && (
                <div className="text-xs font-bold text-white/70 bg-white/5 px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span dir="ltr">{lastAutoSave.toLocaleTimeString()}</span>
                  <span>آخر حفظ:</span>
                </div>
              )}
              <button 
                onClick={() => handleSubmit("PUBLISHED")}
                disabled={saving}
                className="px-10 py-5 rounded-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-900/40 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <span>{saving ? "Processing..." : "نشر الاختبار"}</span>
                <Globe className="w-6 h-6 shrink-0" />
              </button>`
  );

  // Note: Ensure we also use createdId in the final handleSubmit!
  c = c.replace(
    /const res = await fetch\(`\$\{API_URL\}\/exams`, {[\s\S]*?method: "POST",/,
    `
        const method = createdId ? "PUT" : "POST";
        const url = createdId 
          ? \`\${API_URL}/exams/\${createdId}\`
          : \`\${API_URL}/exams\`;

        const res = await fetch(url, {
          method,`
  );

  fs.writeFileSync(file, c);
  console.log('Modified super-admin/exams/new');
}
