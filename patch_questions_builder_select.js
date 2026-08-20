const fs = require('fs');

function convertSelectToCustomSelect(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if missing
    if (!content.includes('CustomSelect')) {
        content = content.replace(/(import .* from 'lucide-react';)/, `$1\nimport { CustomSelect } from '@/components/ui/CustomSelect';`);
    }

    // Question Type
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{tempQuestion\.type\}[\s\S]*?onChange=\{\(e\) => \{([\s\S]*?)\}\}[\s\S]*?<\/select>/, (match, className, onChangeBody) => {
        return `<CustomSelect 
                    className="${className}"
                    value={tempQuestion.type}
                    onChange={(val) => {
                      const newType = val;
                      const updated = { ...tempQuestion, type: newType };
                      if (newType === "TRUE_FALSE") {
                        updated.options = language === 'ar' ? ["صحيح", "خطأ", "", ""] : ["True", "False", "", ""];
                        updated.correctAnswer = language === 'ar' ? "صحيح" : "True";
                      } else if (tempQuestion.type === "TRUE_FALSE") {
                        updated.options = ["", "", "", ""];
                        updated.correctAnswer = "";
                      }
                      setTempQuestion(updated);
                    }}
                    options={QUESTION_TYPES.map(type => ({ value: type.id, label: type.labelEn }))}
                    placeholder={language === 'ar' ? 'اختر النوع...' : 'Select Type...'}
                  />`;
    });

    // Domain
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{tempQuestion\.domain \|\| ""\}\s*onChange=\{\(e\) => updateCurrentQuestionField\("domain", e\.target\.value\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                    className="${className}"
                    value={tempQuestion.domain || ""}
                    onChange={(val) => updateCurrentQuestionField("domain", val)}
                    options={(availableMetadata.domains || []).map(d => ({ value: d, label: d }))}
                    placeholder={language === 'ar' ? 'اختر المجال...' : 'Select Domain...'}
                  />`;
    });

    // Standard
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{tempQuestion\.standard \|\| ""\}\s*onChange=\{\(e\) => updateCurrentQuestionField\("standard", e\.target\.value\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                    className="${className}"
                    value={tempQuestion.standard || ""}
                    onChange={(val) => updateCurrentQuestionField("standard", val)}
                    options={(availableMetadata.standards || []).map(s => ({ value: s, label: s }))}
                    placeholder={language === 'ar' ? 'اختر المعيار...' : 'Select Standard...'}
                  />`;
    });

    // Indicator
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{tempQuestion\.indicator \|\| ""\}\s*onChange=\{\(e\) => updateCurrentQuestionField\("indicator", e\.target\.value\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                    className="${className}"
                    value={tempQuestion.indicator || ""}
                    onChange={(val) => updateCurrentQuestionField("indicator", val)}
                    options={(availableMetadata.indicators || []).map(i => ({ value: i, label: i }))}
                    placeholder={language === 'ar' ? 'اختر المؤشر...' : 'Select Indicator...'}
                  />`;
    });

    // Skill
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{tempQuestion\.skill \|\| ""\}\s*onChange=\{\(e\) => updateCurrentQuestionField\("skill", e\.target\.value\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                    className="${className}"
                    value={tempQuestion.skill || ""}
                    onChange={(val) => updateCurrentQuestionField("skill", val)}
                    options={(availableMetadata.skills || []).map(s => ({ value: s, label: s }))}
                    placeholder={language === 'ar' ? 'اختر المهارة...' : 'Select Skill...'}
                  />`;
    });

    // Target Grade / Grade Target
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{tempQuestion\.gradeTarget \|\| ""\}\s*onChange=\{\(e\) => updateCurrentQuestionField\("gradeTarget", e\.target\.value\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                    className="${className}"
                    value={tempQuestion.gradeTarget || ""}
                    onChange={(val) => updateCurrentQuestionField("gradeTarget", val)}
                    options={(examData.grades || []).map(g => ({ value: g, label: g }))}
                    placeholder={language === 'ar' ? 'اختر الصف...' : 'Select Grade...'}
                  />`;
    });

    // Difficulty / Level
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{tempQuestion\.level\}\s*onChange=\{\(e\) => updateCurrentQuestionField\("level", e\.target\.value\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                    className="${className}"
                    value={tempQuestion.level || "Medium"}
                    onChange={(val) => updateCurrentQuestionField("level", val)}
                    options={[
                      { value: "Easy", label: language === 'ar' ? 'سهل' : 'Easy' },
                      { value: "Medium", label: language === 'ar' ? 'متوسط' : 'Medium' },
                      { value: "Hard", label: language === 'ar' ? 'صعب' : 'Hard' },
                      { value: "Very Hard", label: language === 'ar' ? 'صعب جداً' : 'Very Hard' }
                    ]}
                    placeholder={language === 'ar' ? 'اختر الصعوبة...' : 'Select Difficulty...'}
                  />`;
    });

    // DOK
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{tempQuestion\.dok \|\| ""\}\s*onChange=\{\(e\) => updateCurrentQuestionField\("dok", e\.target\.value\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                    className="${className}"
                    value={tempQuestion.dok || ""}
                    onChange={(val) => updateCurrentQuestionField("dok", val)}
                    options={[
                      { value: "Level 1: Recall", label: "Level 1: Recall" },
                      { value: "Level 2: Skill/Concept", label: "Level 2: Skill/Concept" },
                      { value: "Level 3: Strategic Thinking", label: "Level 3: Strategic Thinking" },
                      { value: "Level 4: Extended Thinking", label: "Level 4: Extended Thinking" }
                    ]}
                    placeholder={language === 'ar' ? 'اختر عمق المعرفة...' : 'Select DOK...'}
                  />`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

convertSelectToCustomSelect('d:/mina/front/src/app/super-admin/exams/edit/[id]/components/QuestionsBuilder.tsx');
console.log('Successfully replaced all selects in QuestionsBuilder.tsx');
