export const questionMetadataFields = ['course', 'section', 'domain', 'standard', 'learningOutcome', 'indicator', 'skill', 'subskill', 'microSkill', 'errorPattern'] as const;
export const lessonMetadataFields = ['domain', 'standards', 'indicators', 'learningOutcomes'] as const;
const labels: Record<string, [string, string]> = {
  foundation: ['تأسيسي', 'Foundation'], easy: ['سهل', 'Easy'], on_level: ['في المستوى', 'On level'], medium: ['متوسط', 'Medium'], advanced: ['متقدم', 'Advanced'], hard: ['صعب', 'Hard'],
  knowledge: ['معرفة', 'Knowledge'], remember: ['تذكر', 'Remember'], understand: ['فهم', 'Understand'], application: ['تطبيق', 'Application'], apply: ['تطبيق', 'Apply'], reasoning: ['استدلال', 'Reasoning'], analyze: ['تحليل', 'Analyze'], evaluate: ['تقييم', 'Evaluate'], create: ['ابتكار', 'Create'],
  'problem solving': ['حل المشكلات', 'Problem Solving'], 'number sense': ['الحس العددي', 'Number Sense'], 'algebraic thinking': ['التفكير الجبري', 'Algebraic Thinking'], geometry: ['الهندسة', 'Geometry'], 'data analysis': ['تحليل البيانات', 'Data Analysis'], observation: ['الملاحظة', 'Observation'], investigation: ['الاستقصاء', 'Investigation'], 'scientific reasoning': ['الاستدلال العلمي', 'Scientific Reasoning'], 'data interpretation': ['تفسير البيانات', 'Data Interpretation'], 'experiment design': ['تصميم التجارب', 'Experiment Design'], 'main idea': ['الفكرة الرئيسية', 'Main Idea'], inference: ['الاستنتاج', 'Inference'], 'vocabulary in context': ['المفردات في السياق', 'Vocabulary in Context'], "author's purpose": ['غرض الكاتب', "Author's Purpose"], 'supporting details': ['التفاصيل الداعمة', 'Supporting Details'],
};
export function metadataLabel(value: unknown, language: string): string {
  if (value && typeof value === 'object') {
    const pair = value as Record<string, string>;
    return pair[language] || pair.ar || pair.en || '';
  }
  const text = String(value ?? '').trim();
  const normalized = text.toLowerCase().replace(/[_-]/g, ' ');
  const match = Object.entries(labels).find(([key, pair]) => key.replace(/[_-]/g, ' ') === normalized || pair.some(label => label.toLowerCase() === normalized));
  if (match) return match[1][language === 'ar' ? 0 : 1];
  const dok = text.match(/^(?:DOK|عمق المعرفة)\s*([1-4])$/i);
  if (dok) return language === 'ar' ? `عمق المعرفة ${dok[1]}` : `DOK ${dok[1]}`;
  return text;
}
export function questionMetadata(item: any, field: string, language: string): string {
  return metadataLabel(language === 'en' ? item?.[`${field}En`] || item?.[field] : item?.[`${field}Ar`] || item?.[field] || item?.[`${field}En`], language);
}
/** Include only supplied translations so older clients do not erase them. */
export function lessonTranslationPayload(lesson: any) {
  return Object.fromEntries(lessonMetadataFields.filter(field => lesson?.[`${field}En`] !== undefined).map(field => [`${field}En`, lesson[`${field}En`]]));
}
