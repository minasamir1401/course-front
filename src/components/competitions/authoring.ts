export const competitionTypes = [
  ['MCQ', 'اختيار من متعدد', 'Multiple choice'], ['TRUE_FALSE', 'صح وخطأ', 'True / false'], ['MULTI_SELECT', 'اختيارات متعددة', 'Multiple answers'], ['TEXT', 'إجابة قصيرة', 'Short answer'],
  ['MATCHING', 'توصيل', 'Matching'], ['DRAG_DROP_FILL', 'أكمل بالسحب', 'Drag & fill'], ['GROUP_SORTING', 'تصنيف المجموعات', 'Group sorting'], ['CLOCK', 'الساعة', 'Clock'], ['MIND_MAP', 'خريطة ذهنية', 'Mind map'], ['VIDEO_CHECKPOINT', 'أسئلة الفيديو', 'Video checkpoints'], ['NUMBER_LINE', 'خط الأعداد', 'Number line'], ['SWIPE_SORT', 'تصنيف البطاقات', 'Swipe sorting'], ['MAZE', 'المتاهة', 'Maze'], ['WORD_SEARCH', 'البحث عن الكلمات', 'Word search'], ['GEOGEBRA', 'جيوجبرا', 'GeoGebra'], ['FLASH_CARD', 'البطاقات التعليمية', 'Flash cards'], ['MEMORY_GAME', 'لعبة الذاكرة', 'Memory game'], ['WORD_SCRAMBLE', 'ترتيب حروف الكلمة', 'Word scramble'], ['SENTENCE_REORDER', 'ترتيب الجملة', 'Sentence reorder'], ['MATH_EQUATION', 'المعادلات الرياضية', 'Math equations'], ['SEQUENCE_ORDER', 'ترتيب التسلسل', 'Sequence order'], ['CROSSWORD', 'الكلمات المتقاطعة', 'Crossword'], ['COUNT_OBJECTS', 'عد العناصر', 'Count objects'], ['IMAGE_LABEL', 'تسمية الصورة', 'Image labels'], ['COLOR_MATCH', 'توصيل الألوان', 'Color matching'],
];
export type CompetitionQuestion = Record<string, any> & { id: string; type: string; text: string; points: number; seconds: number };
export type CompetitionOptions = { schools: { id: string; name: string }[]; subjects: string[]; grades: string[]; courses: { id: string; title: string }[]; exams: { id: string; title: string }[] };
export const blankCompetition = () => ({ title: '', titleEn: '', description: '', descriptionEn: '', schoolId: '', grade: '', subject: '', opensAt: '', closesAt: '', mode: 'SELF_PACED', scoringMode: 'POINTS', sourceKind: 'GENERAL', sourceId: '', teams: false, capacity: 200, publicBoard: false, prizeLabel: '', prizePlaces: 3 });
export function newCompetitionQuestion(type = 'MCQ'): CompetitionQuestion { return { id: crypto.randomUUID(), type, text: '', textEn: '', options: { choices: ['', '', '', ''] }, correctAnswer: '', points: 100, seconds: 30 }; }
export function normalizeCompetitionQuestion(question: any): CompetitionQuestion {
  const parse = (value: any) => { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return value; } };
  const rawOptions = parse(question.options) || [];
  const options = ['MCQ', 'MULTI_SELECT'].includes(question.type || 'MCQ') && !Array.isArray(rawOptions) ? rawOptions.choices || [] : rawOptions;
  const rawOptionsEn = parse(question.optionsEn);
  const rawAnswer = question.correctAnswer ?? (Array.isArray(options) ? options[question.correctIndex] : '');
  // Numeric/boolean-looking option labels are text in the exam editor, in both languages.
  const normalizeAnswer = (value: any) => ['MCQ', 'TRUE_FALSE', 'TEXT'].includes(question.type || 'MCQ') ? String(value ?? '') : parse(value);
  const correctAnswer = normalizeAnswer(rawAnswer);
  const metadata = question.metadata || {};
  const explanation = question.explanation ?? metadata.explanation;
  return { ...metadata, ...question, id: question.id || crypto.randomUUID(), type: question.type || 'MCQ', text: question.text || '', options, optionsEn: rawOptionsEn?.choices || rawOptionsEn, correctAnswer, ...(question.type === 'MULTI_SELECT' ? { correctAnswers: correctAnswer } : {}), correctAnswerEn: question.correctAnswerEn == null ? question.correctAnswerEn : normalizeAnswer(question.correctAnswerEn), sections: question.sections || metadata.sections || (explanation ? [{ id: crypto.randomUUID(), type: 'EXPLANATION', content: explanation, contentEn: question.explanationEn ?? metadata.explanationEn }] : []), points: question.points ?? 100, seconds: question.seconds ?? 30 };
}
export function questionForSave(question: CompetitionQuestion): CompetitionQuestion {
  const parse = (value: any) => { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return value; } };
  const next: CompetitionQuestion = { ...question, options: parse(question.options), optionsEn: parse(question.optionsEn), correctAnswer: parse(question.correctAnswer), correctAnswerEn: parse(question.correctAnswerEn) };
  if (['MCQ', 'MULTI_SELECT'].includes(next.type)) {
    if (next.type === 'MCQ') {
      next.correctAnswer = String(question.correctAnswer ?? '');
      if (question.correctAnswerEn !== undefined && question.correctAnswerEn !== null) next.correctAnswerEn = String(question.correctAnswerEn);
    }
    next.options = Array.isArray(next.options) ? next.options : next.options?.choices || [];
    next.optionsEn = Array.isArray(next.optionsEn) ? next.optionsEn : next.optionsEn?.choices;
    if (next.type === 'MULTI_SELECT' && question.correctAnswers) next.correctAnswer = question.correctAnswers;
    const filled = next.options.map((option: string, index: number) => option.trim() ? index : -1).filter((index: number) => index >= 0);
    if (next.optionsEn) next.optionsEn = filled.map((index: number) => next.optionsEn[index]);
    next.options = filled.map((index: number) => next.options[index]);
    if (next.optionsEn?.every((option: string) => !option.trim())) delete next.optionsEn;
  }
  return next;
}
export const competitionLocalDate = (date: string | null) => date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(date)).replace(' ', 'T') : '';
