const fs = require('fs');
const path = require('path');
const schoolAdminPath = path.join('d:', 'pj', 'porj', 'corse', 'lms-platform', 'frontend', 'src', 'app', 'school-admin', 'exams', 'new', 'page.tsx');
const superAdminPath = path.join('d:', 'pj', 'porj', 'corse', 'lms-platform', 'frontend', 'src', 'app', 'super-admin', 'exams', 'new', 'page.tsx');

let content = fs.readFileSync(schoolAdminPath, 'utf8');

content = content.replace(/SchoolAdminNewExamPage/g, 'SuperAdminNewExamPage');
content = content.replace(/SchoolAdminNewExamPageContent/g, 'SuperAdminNewExamPageContent');

content = content.replace(/school_token/g, 'super_admin_token');
content = content.replace(/\$\{API_URL\}\/school\/exams/g, '${API_URL}/exams');
content = content.replace(/\/school-admin\/exams/g, '/super-admin/exams');

const stateInit = `
  const [schools, setSchools] = useState<any[]>([]);
  useEffect(() => {
    fetchSchools();
  }, []);
  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem("super_admin_token");
      if (!token) return;
      const res = await fetch(\`\${API_URL}/admin/schools\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : (data.schools || []));
      }
    } catch (e) {
      console.error(e);
    }
  };
`;
content = content.replace(/const \[examInfo, setExamInfo\] = useState<any>\(\{/g, stateInit + '\n  const [examInfo, setExamInfo] = useState<any>({');

const targetingUI = `
            {/* Target Schools Card */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col gap-8">
              <h3 className={\`font-black text-slate-800 flex items-center gap-3 text-lg border-b border-slate-50 pb-6 \${language === 'ar' ? 'text-right' : 'text-left'}\`}>
                <Globe className="w-6 h-6 text-indigo-600" />
                {language === 'ar' ? 'استهداف المدارس' : 'Target Schools'}
              </h3>
              
              <div className="space-y-6">
                <label className="flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all border-slate-100 hover:border-indigo-300 bg-white group">
                  <div className={\`w-12 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 \${examInfo.isCentral ? 'bg-indigo-500' : 'bg-slate-200'}\`}>
                    <div className={\`w-4 h-4 rounded-full bg-white transition-transform \${examInfo.isCentral ? 'translate-x-6' : 'translate-x-0'}\`} />
                  </div>
                  <div>
                    <span className="block font-black text-slate-800 text-sm mb-0.5 group-hover:text-indigo-600 transition-colors">
                      {language === 'ar' ? 'امتحان مركزي (Central)' : 'Central Exam'}
                    </span>
                    <span className="block text-xs font-bold text-slate-400">
                      {language === 'ar' ? 'متاح لجميع المدارس تلقائياً' : 'Available for all schools automatically'}
                    </span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={examInfo.isCentral}
                    onChange={(e) => setExamInfo({...examInfo, isCentral: e.target.checked, schoolIds: e.target.checked ? [] : examInfo.schoolIds})}
                  />
                </label>

                {!examInfo.isCentral && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'تحديد المدارس' : 'Select Schools'}</label>
                    {schools.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold text-sm">
                        {language === 'ar' ? 'لا توجد مدارس متاحة' : 'No schools available'}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[300px] overflow-y-auto flex flex-col gap-2">
                        {schools.map(school => (
                          <label key={school.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200">
                            <input
                              type="checkbox"
                              checked={examInfo.schoolIds.includes(school.id)}
                              onChange={(e) => {
                                const newIds = e.target.checked 
                                  ? [...examInfo.schoolIds, school.id]
                                  : examInfo.schoolIds.filter(id => id !== school.id);
                                setExamInfo({ ...examInfo, schoolIds: newIds });
                              }}
                              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600"
                            />
                            <span className="text-sm font-bold text-slate-700">{school.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
`;

content = content.replace(/\{\/\* Results Policy Card \*\/\}/, targetingUI + '\n            {/* Results Policy Card */}');

fs.writeFileSync(superAdminPath, content);
console.log('Successfully cloned and modified school-admin new exam page to super-admin.');
