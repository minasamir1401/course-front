export type UiLang = 'ar' | 'en';

export interface QuestionLike {
  type?: string | null;
  label?: string | null;
  text?: string | null;
  textEn?: string | null;
  explanation?: string | null;
  explanationEn?: string | null;
  options?: unknown;
  optionsEn?: unknown;
  correctAnswer?: string | null;
  correctAnswerEn?: string | null;
}

const ARABIC_RE = /[\u0600-\u06FF]/;
const ENGLISH_RE = /[a-zA-Z]/;

function stripHtmlAndLatex(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g, ' ')
    .trim();
}

export function hasArabicText(value: unknown): boolean {
  return ARABIC_RE.test(stripHtmlAndLatex(value));
}

export function hasEnglishProse(value: unknown): boolean {
  return ENGLISH_RE.test(stripHtmlAndLatex(value));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? ''));
  }
  return [];
}

/**
 * Resolves the initial display/edit language for a question.
 * Prioritizes `uiLanguage` when both Arabic and English content exist or when neutral,
 * and falls back to Arabic unless only English prose is present.
 */
export function resolvePreferredQuestionLang(
  question: QuestionLike | null | undefined,
  uiLanguage?: string
): UiLang {
  const defaultLang: UiLang = uiLanguage === 'en' ? 'en' : 'ar';
  if (!question) {
    return defaultLang;
  }

  const arOptions = toStringArray(question.options);
  const enOptions = toStringArray(question.optionsEn);
  const isTrueFalse = question.type === 'TRUE_FALSE' || question.label === 'TRUE_FALSE';

  const hasAr =
    hasArabicText(question.text) ||
    hasArabicText(question.explanation) ||
    hasArabicText(question.correctAnswer) ||
    arOptions.some(hasArabicText);

  const hasDedicatedEn =
    hasEnglishProse(question.textEn) ||
    hasEnglishProse(question.explanationEn) ||
    (!isTrueFalse &&
      (hasEnglishProse(question.correctAnswerEn) || enOptions.some(hasEnglishProse)));

  const hasPrimaryOnlyEn =
    !hasAr &&
    (hasEnglishProse(question.text) ||
      hasEnglishProse(question.explanation) ||
      (!isTrueFalse &&
        (hasEnglishProse(question.correctAnswer) || arOptions.some(hasEnglishProse))));

  const hasEn = hasDedicatedEn || hasPrimaryOnlyEn;

  if (hasAr && hasEn) {
    return defaultLang;
  }
  if (hasAr) {
    return 'ar';
  }
  if (hasEn) {
    return 'en';
  }
  return defaultLang;
}

export function getTrueFalseDefaults(language?: string): {
  options: [string, string];
  correctAnswer: string;
  optionsEn: [string, string];
  correctAnswerEn: string;
} {
  const isEn = language === 'en';
  return {
    options: isEn ? ['True', 'False'] : ['صحيح', 'خطأ'],
    correctAnswer: isEn ? 'True' : 'صحيح',
    optionsEn: ['True', 'False'],
    correctAnswerEn: 'True',
  };
}
