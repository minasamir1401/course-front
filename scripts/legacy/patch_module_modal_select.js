const fs = require('fs');

function convertSelectToCustomSelect(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if missing
    if (!content.includes('CustomSelect')) {
        content = content.replace(/(import .* from 'lucide-react';)/, `$1\nimport { CustomSelect } from '@/components/ui/CustomSelect';`);
    }

    // Domain
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{currentModule\.domain \|\| ""\}\s*onChange=\{\(e\) => setCurrentModule\(\{\.\.\.currentModule, domain: e\.target\.value\}\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                            className="${className}"
                            value={currentModule.domain || ""}
                            onChange={(val) => setCurrentModule({...currentModule, domain: val})}
                            options={(availableMetadata.domains || []).map(d => ({ value: d, label: d }))}
                            placeholder={t('courseCreate.selectDomain') || "Select Domain..."}
                          />`;
    });

    // Standards
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{currentModule\.standards \|\| ""\}\s*onChange=\{\(e\) => setCurrentModule\(\{\.\.\.currentModule, standards: e\.target\.value\}\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                            className="${className}"
                            value={currentModule.standards || ""}
                            onChange={(val) => setCurrentModule({...currentModule, standards: val})}
                            options={(availableMetadata.standards || []).map(s => ({ value: s, label: s }))}
                            placeholder={t('courseCreate.selectStandard') || "Select Standard..."}
                          />`;
    });

    // Indicators
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{currentModule\.indicators \|\| ""\}\s*onChange=\{\(e\) => setCurrentModule\(\{\.\.\.currentModule, indicators: e\.target\.value\}\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                            className="${className}"
                            value={currentModule.indicators || ""}
                            onChange={(val) => setCurrentModule({...currentModule, indicators: val})}
                            options={(availableMetadata.indicators || []).map(i => ({ value: i, label: i }))}
                            placeholder={t('courseCreate.selectIndicator') || "Select Indicator..."}
                          />`;
    });

    // Learning Outcomes
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{currentModule\.learningOutcomes \|\| ""\}\s*onChange=\{\(e\) => setCurrentModule\(\{\.\.\.currentModule, learningOutcomes: e\.target\.value\}\)\}[\s\S]*?<\/select>/, (match, className) => {
        return `<CustomSelect 
                            className="${className}"
                            value={currentModule.learningOutcomes || ""}
                            onChange={(val) => setCurrentModule({...currentModule, learningOutcomes: val})}
                            options={(availableMetadata.outcomes || []).map(o => ({ value: o, label: o }))}
                            placeholder={t('courseCreate.selectOutcome') || "Select Learning Outcome..."}
                          />`;
    });

    // Attachments Type
    content = content.replace(/<select[\s\S]*?className="([^"]+)"\s*value=\{att\.type\}\s*onChange=\{\(e\) => \{([\s\S]*?)\}\}[\s\S]*?<\/select>/, (match, className, onChangeBody) => {
        return `<CustomSelect 
                                  className="${className}"
                                  value={att.type}
                                  onChange={(val) => {
                                    const atts = [...currentModule.attachments];
                                    atts[attIdx].type = val;
                                    setCurrentModule({...currentModule, attachments: atts});
                                  }}
                                  options={[
                                    { value: "PDF", label: "PDF" },
                                    { value: "PPT", label: "PPT" },
                                    { value: "DOC", label: "DOC" },
                                    { value: "XLS", label: "XLS" },
                                    { value: "IMAGE", label: "IMAGE" }
                                  ]}
                                  placeholder="Type"
                                />`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

convertSelectToCustomSelect('d:/mina/front/src/app/super-admin/exams/edit/[id]/components/ModuleModal.tsx');
console.log('Successfully replaced all selects in ModuleModal.tsx');
