export const DEFAULT_SLIDE_TITLES = new Set([
  'محتوى جديد',
  'سؤال جديد',
  'New Content',
  'New Question',
]);

const ARABIC_LETTER_RE = /[\u0621-\u064A\u0671-\u06D3]/;
const LATIN_LETTER_RE = /[a-zA-Z]/;

export function cleanVisibleText(str?: unknown): string {
  return String(str ?? '')
    .replace(/<math\b[^>]*>[\s\S]*?<\/math>/gi, ' ')
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?:\\.|[^$\n])+\$/g, ' ')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#\d+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasArabicLetters(str?: unknown): boolean {
  return ARABIC_LETTER_RE.test(cleanVisibleText(str));
}

export function isEnglishOnlyText(str?: unknown): boolean {
  const clean = cleanVisibleText(str);
  return LATIN_LETTER_RE.test(clean) && !ARABIC_LETTER_RE.test(clean);
}

export function isDefaultSlideTitle(title?: unknown): boolean {
  const clean = cleanVisibleText(title);
  return !clean || DEFAULT_SLIDE_TITLES.has(clean);
}

function stringifyOptionsText(options: unknown): string {
  if (!options) return '';
  if (Array.isArray(options)) return options.map((entry) => cleanVisibleText(typeof entry === 'string' ? entry : JSON.stringify(entry))).join(' ');
  if (typeof options === 'string') return cleanVisibleText(options);
  return cleanVisibleText(JSON.stringify(options));
}

export function detectSlideLanguage(block: any, uiLanguage = 'ar'): 'ar' | 'en' {
  const fallback: 'ar' | 'en' = uiLanguage === 'en' ? 'en' : 'ar';
  if (!block) return fallback;

  const body = cleanVisibleText(block.content || block.text || '');
  const bodyEn = cleanVisibleText(block.contentEn || block.textEn || '');
  const rawTitle = cleanVisibleText(block.title);
  const titleClean = isDefaultSlideTitle(rawTitle) ? '' : rawTitle;
  const rawTitleEn = cleanVisibleText(block.titleEn);
  const titleEnClean = isDefaultSlideTitle(rawTitleEn) ? '' : rawTitleEn;

  const isTf = block.label === 'TRUE_FALSE' || block.type === 'TRUE_FALSE';
  const optsJoined = !isTf ? stringifyOptionsText(block.options) : '';
  const optsEnJoined = !isTf ? stringifyOptionsText(block.optionsEn) : '';

  const sectionsAr = Array.isArray(block.sections)
    ? block.sections.map((s: any) => cleanVisibleText(s?.content || s?.text)).join(' ')
    : '';
  const sectionsEn = Array.isArray(block.sections)
    ? block.sections.map((s: any) => cleanVisibleText(s?.contentEn || s?.textEn)).join(' ')
    : '';

  const allAr = `${body} ${titleClean} ${optsJoined} ${sectionsAr}`.trim();
  const allEn = `${bodyEn} ${titleEnClean} ${optsEnJoined} ${sectionsEn}`.trim();

  const hasAr = ARABIC_LETTER_RE.test(allAr);
  const hasEn = isEnglishOnlyText(allEn) || (isEnglishOnlyText(allAr) && !hasAr);

  if (hasEn && !hasAr) return 'en';
  if (hasAr && !hasEn) return 'ar';

  if (ARABIC_LETTER_RE.test(body)) return 'ar';
  if (isEnglishOnlyText(body)) return 'en';

  if (titleClean) {
    if (ARABIC_LETTER_RE.test(titleClean)) return 'ar';
    if (isEnglishOnlyText(titleClean)) return 'en';
  }

  return fallback;
}
