const fs = require('fs');

function convertSelectToCustomSelect(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if missing
    if (!content.includes('CustomSelect')) {
        content = content.replace(/(import .* from 'lucide-react';)/, `$1\nimport { CustomSelect } from '@/components/ui/CustomSelect';`);
    }

    // Country
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{examData\.country\}\s*onChange=\{\(e\) => setExamData\(\{\.\.\.examData, country: e\.target\.value\}\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                          className="${className}"
                          value={examData.country}
                          onChange={(val) => setExamData({...examData, country: val})}
                          options={[
                            { value: "مصر", label: language === 'ar' ? 'مصر' : 'Egypt' },
                            { value: "السعودية", label: language === 'ar' ? 'السعودية' : 'Saudi Arabia' },
                            { value: "الإمارات", label: language === 'ar' ? 'الإمارات' : 'UAE' },
                            { value: "الكويت", label: language === 'ar' ? 'الكويت' : 'Kuwait' },
                            { value: "قطر", label: language === 'ar' ? 'قطر' : 'Qatar' },
                            { value: "عمان", label: language === 'ar' ? 'عمان' : 'Oman' },
                            { value: "البحرين", label: language === 'ar' ? 'البحرين' : 'Bahrain' },
                            { value: "الأردن", label: language === 'ar' ? 'الأردن' : 'Jordan' }
                          ]}
                        />`;
    });

    // Result Visibility
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{examData\.resultVisibility\}\s*onChange=\{\(e\) => setExamData\(\{\.\.\.examData, resultVisibility: e\.target\.value\}\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                        className="${className}"
                        value={examData.resultVisibility}
                        onChange={(val) => setExamData({...examData, resultVisibility: val})}
                        options={[
                          { value: "SHOW_SCORE", label: language === 'ar' ? "إظهار النتيجة فقط" : "Show Score Only" },
                          { value: "SHOW_SCORE_ANSWERS", label: language === 'ar' ? "إظهار النتيجة والإجابات" : "Show Score & Answers" },
                          { value: "HIDDEN", label: language === 'ar' ? "إخفاء النتيجة" : "Hidden" }
                        ]}
                      />`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

convertSelectToCustomSelect('d:/mina/front/src/app/school-admin/exams/edit/[id]/components/SettingsPanel.tsx');
console.log('Successfully replaced all selects in SettingsPanel.tsx');
