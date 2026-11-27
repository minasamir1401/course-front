import { translateBatch } from './translationService';
import {
  autoTranslateLessonMetadata,
  autoTranslateQuestionsList,
  autoTranslateSlidesList,
  disambiguateTranslatedOptions,
  hasArabicVisibleText,
  hasMixedEnglishHtmlBlocks,
  isEnglishWithoutArabic,
} from './excelAutoTranslate';
import { translateMetadataFields } from './questionMetadataTranslation';
import { escapeHtmlAttr, extractImageUrls, isSafeImageUrl } from './image-utils';
import {
  cleanVisibleText,
  hasArabicLetters,
  isDefaultSlideTitle,
  isEnglishOnlyText,
} from './slideLanguage';

const ARABIC_LETTER_RE = /[\u0621-\u064A\u0671-\u06D3]/;

function rescueMissingImages(sourceHtml: string, translatedHtml: string): string {
  const srcImgs = extractImageUrls(sourceHtml);
  if (!srcImgs.length || !translatedHtml) return translatedHtml;
  const missing = srcImgs.filter((url) => isSafeImageUrl(url) && !translatedHtml.includes(url));
  if (!missing.length) return translatedHtml;
  const tags = missing
    .map(
      (url) =>
        `<p><img loading="lazy" decoding="async" src="${escapeHtmlAttr(url)}" data-align="center" style="max-width: 100%; height: auto; border-radius: 12px; margin: 10px auto; display: block;" /></p>`,
    )
    .join('');
  return `${tags}\n${translatedHtml}`;
}

function tryParseJson(value: unknown): { parsed: any; wasJsonString: boolean } {
  if (typeof value !== 'string') return { parsed: value, wasJsonString: false };
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('[') && !trimmed.startsWith('{'))) {
    return { parsed: value, wasJsonString: false };
  }
  try {
    return { parsed: JSON.parse(trimmed), wasJsonString: true };
  } catch {
    return { parsed: value, wasJsonString: false };
  }
}

function collectStringsAny(value: unknown, out: Set<string>, excludeKeys = new Set(['id', 'type', 'label', 'videoUrl', 'image', 'imageUrl', 'iframeUrl', 'materialId', 'ggbBase64', 'perspective'])): void {
  if (typeof value === 'string') {
    if (value.trim()) out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectStringsAny(v, out, excludeKeys));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (excludeKeys.has(k)) continue;
      collectStringsAny(v, out, excludeKeys);
    }
  }
}

function mapStringsAny(value: unknown, dict: Map<string, string>, excludeKeys = new Set(['id', 'type', 'label', 'videoUrl', 'image', 'imageUrl', 'iframeUrl', 'materialId', 'ggbBase64', 'perspective'])): any {
  if (typeof value === 'string') {
    return dict.get(value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => mapStringsAny(v, dict, excludeKeys));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (excludeKeys.has(k)) {
        out[k] = v;
      } else {
        out[k] = mapStringsAny(v, dict, excludeKeys);
      }
    }
    return out;
  }
  return value;
}

function collectAnswerKeysAndValues(ans: unknown, out: Set<string>): void {
  if (typeof ans === 'string') {
    if (ans.trim() && !/^[A-F]$/i.test(ans.trim()) && !/^(true|false)$/i.test(ans.trim())) out.add(ans);
  } else if (Array.isArray(ans)) {
    ans.forEach((v) => collectAnswerKeysAndValues(v, out));
  } else if (ans && typeof ans === 'object') {
    for (const [k, v] of Object.entries(ans)) {
      if (k.trim()) out.add(k);
      collectAnswerKeysAndValues(v, out);
    }
  }
}

function mapAnswerWithDict(ans: unknown, dict: Map<string, string>, srcOptsArr?: string[], trOptsArr?: string[]): any {
  const norm = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const findByOptIndex = (raw: string): string | undefined => {
    if (!srcOptsArr?.length || !trOptsArr?.length) return undefined;
    const idx = srcOptsArr.findIndex((o) => norm(o) === norm(raw));
    return idx >= 0 && trOptsArr[idx] ? trOptsArr[idx] : undefined;
  };
  if (typeof ans === 'string') {
    return findByOptIndex(ans) ?? dict.get(ans) ?? ans;
  }
  if (Array.isArray(ans)) {
    return ans.map((v) => (typeof v === 'string' ? (findByOptIndex(v) ?? dict.get(v) ?? v) : v));
  }
  if (ans && typeof ans === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(ans)) {
      const nextK = dict.get(k) ?? k;
      out[nextK] = typeof v === 'string' ? (dict.get(v) ?? v) : mapAnswerWithDict(v, dict);
    }
    return out;
  }
  return ans;
}

async function translateOptionsAndAnswersSingle(
  srcOptsVal: unknown,
  srcAnsVal: unknown,
  srcMultiAns: unknown[] | undefined,
  from: 'ar' | 'en',
  to: 'ar' | 'en',
  itemType = '',
): Promise<{
  options: any;
  correctAnswer: any;
  correctAnswers?: any[];
  changed: boolean;
}> {
  const { parsed: rawOpts, wasJsonString: optsWasJson } = tryParseJson(srcOptsVal);
  const { parsed: rawAns, wasJsonString: ansWasJson } = tryParseJson(srcAnsVal);
  const rewrapOpts = (v: any) => (optsWasJson ? JSON.stringify(v) : v);
  const rewrapAns = (v: any) => (ansWasJson ? JSON.stringify(v) : v);

  if (itemType.toUpperCase() === 'TRUE_FALSE') {
    const tfOpts = to === 'ar' ? ['صحيح', 'خطأ'] : ['True', 'False'];
    const ansLower = String(rawAns ?? '').trim().toLowerCase();
    const canonicalAns = ['true', 'صح', 'صحيح', 'صواب', '1'].includes(ansLower)
      ? 'True'
      : ['false', 'خطأ', 'خاطئ', 'غير صحيح', '0'].includes(ansLower)
        ? 'False'
        : rawAns;
    return {
      options: rewrapOpts(tfOpts),
      correctAnswer: canonicalAns,
      changed: true,
    };
  }

  // Array of string choices (MCQ / MULTI_SELECT)
  if (Array.isArray(rawOpts) && rawOpts.every((v) => typeof v === 'string')) {
    const nonEmptyCount = rawOpts.filter((o) => cleanVisibleText(o).length > 0).length;
    if (nonEmptyCount === 0) {
      return { options: srcOptsVal, correctAnswer: srcAnsVal, correctAnswers: srcMultiAns, changed: false };
    }
    const translatedRaw = await translateBatch(rawOpts, from, to);
    const trOpts = disambiguateTranslatedOptions(rawOpts, translatedRaw);
    const changed = trOpts.some((val, i) => val !== rawOpts[i] && (!to || to !== 'ar' || ARABIC_LETTER_RE.test(cleanVisibleText(val)) || !isEnglishOnlyText(val)));

    const dict = new Map<string, string>();
    rawOpts.forEach((o, i) => {
      if (o && trOpts[i]) dict.set(o, trOpts[i]);
    });

    const nextCorrectAnswer = Array.isArray(rawAns)
      ? rewrapAns(mapAnswerWithDict(rawAns, dict, rawOpts, trOpts))
      : typeof rawAns === 'string' && rawAns.trim()
        ? mapAnswerWithDict(rawAns, dict, rawOpts, trOpts)
        : rawAns;

    const nextCorrectAnswers = Array.isArray(srcMultiAns)
      ? srcMultiAns.map((a) => mapAnswerWithDict(String(a ?? ''), dict, rawOpts, trOpts))
      : undefined;

    return {
      options: rewrapOpts(trOpts),
      correctAnswer: nextCorrectAnswer,
      correctAnswers: nextCorrectAnswers,
      changed,
    };
  }

  // Interactive object/array structures (MATCHING, GROUP_SORTING, DRAG_DROP_FILL, FLASH_CARD, etc.)
  const uniqueStrings = new Set<string>();
  collectStringsAny(rawOpts, uniqueStrings);
  collectAnswerKeysAndValues(rawAns, uniqueStrings);
  if (Array.isArray(srcMultiAns)) {
    srcMultiAns.forEach((v) => collectAnswerKeysAndValues(v, uniqueStrings));
  }

  const stringList = Array.from(uniqueStrings);
  if (stringList.length === 0) {
    return { options: srcOptsVal, correctAnswer: srcAnsVal, correctAnswers: srcMultiAns, changed: false };
  }

  const translatedList = await translateBatch(stringList, from, to);
  const dict = new Map<string, string>();
  let anyChanged = false;
  stringList.forEach((orig, idx) => {
    const out = translatedList[idx] ?? orig;
    dict.set(orig, out);
    if (out !== orig) anyChanged = true;
  });

  const nextOpts = mapStringsAny(rawOpts, dict);
  const nextAns = mapAnswerWithDict(rawAns, dict);
  const nextMulti = Array.isArray(srcMultiAns) ? srcMultiAns.map((v) => mapAnswerWithDict(v, dict)) : undefined;

  return {
    options: rewrapOpts(nextOpts),
    correctAnswer: rewrapAns(nextAns),
    correctAnswers: nextMulti,
    changed: anyChanged,
  };
}

function didTranslationSucceed(source: string, translated: string, to: 'ar' | 'en'): boolean {
  if (!source || !cleanVisibleText(source)) return false;
  if (!translated || !translated.trim()) return false;
  if (translated !== source) {
    return to === 'ar' ? (hasArabicLetters(translated) || !isEnglishOnlyText(translated)) : true;
  }
  return to === 'ar' ? hasArabicLetters(translated) : isEnglishOnlyText(translated);
}

export function slideNeedsArabicTranslation(slide: any): boolean {
  if (!slide || typeof slide !== 'object') return false;
  const arBody = slide.content || slide.text || '';
  const enBody = slide.contentEn || slide.textEn || '';
  const arTitle = isDefaultSlideTitle(slide.title) ? '' : (slide.title || '');
  const enTitle = isDefaultSlideTitle(slide.titleEn) ? '' : (slide.titleEn || '');

  if (isEnglishWithoutArabic(arBody) || hasMixedEnglishHtmlBlocks(arBody)) return true;
  if (!hasArabicVisibleText(arBody) && isEnglishWithoutArabic(enBody)) return true;
  if (isEnglishWithoutArabic(arTitle) || (!hasArabicVisibleText(arTitle) && isEnglishWithoutArabic(enTitle))) return true;

  for (const field of ['hint', 'explanation', 'tip', 'keyInsight']) {
    const arVal = slide[field] || '';
    const enVal = slide[`${field}En`] || '';
    if (isEnglishWithoutArabic(arVal) || hasMixedEnglishHtmlBlocks(arVal)) return true;
    if (!hasArabicVisibleText(arVal) && isEnglishWithoutArabic(enVal)) return true;
  }

  if (Array.isArray(slide.sections)) {
    for (const sec of slide.sections) {
      const arSec = sec?.content ?? sec?.text ?? '';
      const enSec = sec?.contentEn ?? sec?.textEn ?? '';
      if (isEnglishWithoutArabic(arSec) || hasMixedEnglishHtmlBlocks(arSec)) return true;
      if (!hasArabicVisibleText(arSec) && isEnglishWithoutArabic(enSec)) return true;
    }
  }

  const label = String(slide.label || slide.type || '').toUpperCase();
  if (label !== 'TRUE_FALSE') {
    const optsStr = typeof slide.options === 'string' ? slide.options : JSON.stringify(slide.options ?? '');
    const optsEnStr = typeof slide.optionsEn === 'string' ? slide.optionsEn : JSON.stringify(slide.optionsEn ?? '');
    if (isEnglishWithoutArabic(optsStr) || (!hasArabicVisibleText(optsStr) && isEnglishWithoutArabic(optsEnStr))) {
      return true;
    }
  }

  for (const mf of ['domain', 'standard', 'indicator', 'learningOutcome', 'skill']) {
    const arMeta = slide[mf] || '';
    const enMeta = slide[`${mf}En`] || '';
    if (isEnglishWithoutArabic(arMeta, 'metadata')) return true;
    if (!hasArabicVisibleText(arMeta) && isEnglishWithoutArabic(enMeta, 'metadata')) return true;
  }

  return false;
}

export function questionNeedsArabicTranslation(q: any): boolean {
  if (!q || typeof q !== 'object') return false;
  const arText = q.text || '';
  const enText = q.textEn || '';
  if (isEnglishWithoutArabic(arText) || hasMixedEnglishHtmlBlocks(arText)) return true;
  if (!hasArabicVisibleText(arText) && isEnglishWithoutArabic(enText)) return true;

  for (const field of ['hint', 'explanation', 'tip', 'keyInsight']) {
    const arVal = q[field] || '';
    const enVal = q[`${field}En`] || '';
    if (isEnglishWithoutArabic(arVal) || hasMixedEnglishHtmlBlocks(arVal)) return true;
    if (!hasArabicVisibleText(arVal) && isEnglishWithoutArabic(enVal)) return true;
  }

  if (Array.isArray(q.sections)) {
    for (const sec of q.sections) {
      const arSec = sec?.content ?? sec?.text ?? '';
      const enSec = sec?.contentEn ?? sec?.textEn ?? '';
      if (isEnglishWithoutArabic(arSec) || hasMixedEnglishHtmlBlocks(arSec)) return true;
      if (!hasArabicVisibleText(arSec) && isEnglishWithoutArabic(enSec)) return true;
    }
  }

  const qType = String(q.type || q.label || '').toUpperCase();
  if (qType !== 'TRUE_FALSE') {
    const optsStr = typeof q.options === 'string' ? q.options : JSON.stringify(q.options ?? '');
    const optsEnStr = typeof q.optionsEn === 'string' ? q.optionsEn : JSON.stringify(q.optionsEn ?? '');
    if (isEnglishWithoutArabic(optsStr) || (!hasArabicVisibleText(optsStr) && isEnglishWithoutArabic(optsEnStr))) {
      return true;
    }
  }

  return false;
}

export function activityNeedsArabicTranslation(activity: any): boolean {
  if (!activity || typeof activity !== 'object') return false;
  const pairs: [string, string, 'content' | 'metadata'][] = [
    ['title', 'titleEn', 'content'],
    ['questionText', 'questionTextEn', 'content'],
    ['explanation', 'explanationEn', 'content'],
    ['hint', 'hintEn', 'content'],
    ['tip', 'tipEn', 'content'],
    ['keyInsight', 'keyInsightEn', 'content'],
    ['standard', 'standardEn', 'metadata'],
    ['indicator', 'indicatorEn', 'metadata'],
    ['learningOutcome', 'learningOutcomeEn', 'metadata'],
    ['skill', 'skillEn', 'metadata'],
  ];
  for (const [arKey, enKey, kind] of pairs) {
    const arVal = activity[arKey] || '';
    const enVal = activity[enKey] || '';
    if (isEnglishWithoutArabic(arVal, kind) || (kind === 'content' && hasMixedEnglishHtmlBlocks(arVal))) return true;
    if (!hasArabicVisibleText(arVal) && isEnglishWithoutArabic(enVal, kind)) return true;
  }
  const type = String(activity.type || '').toUpperCase();
  if (type !== 'TRUE_FALSE') {
    const optsStr = typeof activity.options === 'string' ? activity.options : JSON.stringify(activity.options ?? '');
    const optsEnStr = typeof activity.optionsEn === 'string' ? activity.optionsEn : JSON.stringify(activity.optionsEn ?? '');
    if (isEnglishWithoutArabic(optsStr) || (!hasArabicVisibleText(optsStr) && isEnglishWithoutArabic(optsEnStr))) {
      return true;
    }
  }
  return false;
}

export function lessonNeedsArabicTranslation(lesson: any): boolean {
  if (!lesson || typeof lesson !== 'object') return false;
  const metaPairs: [string, string, 'content' | 'metadata'][] = [
    ['domain', 'domainEn', 'metadata'],
    ['standards', 'standardsEn', 'metadata'],
    ['indicators', 'indicatorsEn', 'metadata'],
    ['learningOutcomes', 'learningOutcomesEn', 'metadata'],
  ];
  for (const [arKey, enKey, kind] of metaPairs) {
    const arVal = lesson[arKey] || '';
    const enVal = lesson[enKey] || '';
    if (!hasArabicVisibleText(arVal) && isEnglishWithoutArabic(enVal, kind)) return true;
    if (isEnglishWithoutArabic(arVal, kind)) return true;
  }
  if (Array.isArray(lesson.slides) && lesson.slides.some(slideNeedsArabicTranslation)) return true;
  if (Array.isArray(lesson.questions) && lesson.questions.some(questionNeedsArabicTranslation)) return true;
  if (Array.isArray(lesson.assignments) && lesson.assignments.some(questionNeedsArabicTranslation)) return true;
  return false;
}

export async function autoTranslateLessonDraftForSave<T extends Record<string, any>>(lesson: T): Promise<T> {
  if (!lesson || typeof lesson !== 'object' || !lessonNeedsArabicTranslation(lesson)) return lesson;

  const sanitizeForSlides = (slides: any[]) =>
    slides.map((slide) => {
      if (!slide || typeof slide !== 'object') return slide;
      // Do not allow default placeholder title to pass as existing Arabic if body is English.
      if (isDefaultSlideTitle(slide.title) && !hasArabicLetters(slide.content || slide.text || '') && isEnglishOnlyText(slide.contentEn || slide.textEn || slide.content || slide.text || '')) {
        return { ...slide, title: '' };
      }
      return slide;
    });

  const [slides, questions, assignments, translatedMeta] = await Promise.all([
    Array.isArray(lesson.slides) && lesson.slides.some(slideNeedsArabicTranslation)
      ? autoTranslateSlidesList(sanitizeForSlides(lesson.slides))
      : Promise.resolve(lesson.slides),
    Array.isArray(lesson.questions) && lesson.questions.some(questionNeedsArabicTranslation)
      ? autoTranslateQuestionsList(lesson.questions)
      : Promise.resolve(lesson.questions),
    Array.isArray(lesson.assignments) && lesson.assignments.some(questionNeedsArabicTranslation)
      ? autoTranslateQuestionsList(lesson.assignments)
      : Promise.resolve(lesson.assignments),
    autoTranslateLessonMetadata({
      domain: lesson.domain,
      domainEn: lesson.domainEn,
      standards: lesson.standards,
      standardsEn: lesson.standardsEn,
      indicators: lesson.indicators,
      indicatorsEn: lesson.indicatorsEn,
      learningOutcomes: lesson.learningOutcomes,
      learningOutcomesEn: lesson.learningOutcomesEn,
    }),
  ]);

  return {
    ...lesson,
    ...(translatedMeta.domain !== undefined ? { domain: translatedMeta.domain } : {}),
    ...(translatedMeta.domainEn !== undefined ? { domainEn: translatedMeta.domainEn } : {}),
    ...(translatedMeta.standards !== undefined ? { standards: translatedMeta.standards } : {}),
    ...(translatedMeta.standardsEn !== undefined ? { standardsEn: translatedMeta.standardsEn } : {}),
    ...(translatedMeta.indicators !== undefined ? { indicators: translatedMeta.indicators } : {}),
    ...(translatedMeta.indicatorsEn !== undefined ? { indicatorsEn: translatedMeta.indicatorsEn } : {}),
    ...(translatedMeta.learningOutcomes !== undefined ? { learningOutcomes: translatedMeta.learningOutcomes } : {}),
    ...(translatedMeta.learningOutcomesEn !== undefined ? { learningOutcomesEn: translatedMeta.learningOutcomesEn } : {}),
    slides,
    questions,
    assignments,
  } as T;
}

export async function translateSingleSlideItem(
  block: any,
  activeLang: 'ar' | 'en',
): Promise<{ updated: any; targetLang: 'ar' | 'en'; changed: boolean; hasTranslatableSource: boolean }> {
  if (!block) return { updated: block, targetLang: activeLang, changed: false, hasTranslatableSource: false };

  // Smart direction recovery: if teacher typed English in Arabic tab (often with default Arabic title), translate EN -> AR.
  const bodyAr = block.content || block.text || '';
  const bodyEn = block.contentEn || block.textEn || '';
  const nonDefaultTitle = isDefaultSlideTitle(block.title) ? '' : (block.title || '');
  const optsRaw = typeof block.options === 'string' ? block.options : JSON.stringify(block.options ?? '');
  const isActuallyEnglishInArTab =
    activeLang === 'ar'
    && !hasArabicLetters(bodyAr)
    && !hasArabicLetters(nonDefaultTitle)
    && (isEnglishOnlyText(bodyAr) || isEnglishOnlyText(bodyEn) || isEnglishOnlyText(nonDefaultTitle) || isEnglishOnlyText(optsRaw));

  const from: 'ar' | 'en' = isActuallyEnglishInArTab ? 'en' : activeLang;
  const to: 'ar' | 'en' = from === 'ar' ? 'en' : 'ar';

  const srcTitle = from === 'ar'
    ? (isDefaultSlideTitle(block.title) ? '' : (block.title || ''))
    : (block.titleEn || (isEnglishOnlyText(nonDefaultTitle) ? nonDefaultTitle : ''));
  const srcContent = from === 'ar'
    ? (block.content || block.text || '')
    : (block.contentEn || block.textEn || (isEnglishOnlyText(bodyAr) ? bodyAr : ''));

  const extraFields = ['hint', 'explanation', 'tip', 'keyInsight'] as const;
  const srcExtras = extraFields.map((f) =>
    from === 'ar'
      ? (block[f] || '')
      : (block[`${f}En`] || (isEnglishOnlyText(block[f]) ? block[f] : '')),
  );

  const sectionsList = Array.isArray(block.sections) ? block.sections : [];
  const srcSections: string[] = sectionsList.map((sec: any) =>
    from === 'ar'
      ? String(sec?.content || sec?.text || '')
      : String(sec?.contentEn || sec?.textEn || (isEnglishOnlyText(sec?.content || sec?.text) ? (sec?.content || sec?.text) : '')),
  );

  const baseTexts = [srcTitle, srcContent, ...srcExtras, ...srcSections];
  const hasAnyBaseSource = baseTexts.some((t) => cleanVisibleText(t).length > 0);
  const srcOpts = from === 'ar'
    ? block.options
    : (block.optionsEn !== undefined && block.optionsEn !== null && !(Array.isArray(block.optionsEn) && block.optionsEn.length === 0)
      ? block.optionsEn
      : block.options);
  const srcAns = from === 'ar'
    ? block.correctAnswer
    : (block.correctAnswerEn !== undefined && block.correctAnswerEn !== null && block.correctAnswerEn !== ''
      ? block.correctAnswerEn
      : block.correctAnswer);
  const srcMulti = from === 'ar'
    ? block.correctAnswers
    : (Array.isArray(block.correctAnswersEn) && block.correctAnswersEn.length > 0 ? block.correctAnswersEn : block.correctAnswers);

  const hasOptionsSource = block.type === 'QUESTION' && cleanVisibleText(typeof srcOpts === 'string' ? srcOpts : JSON.stringify(srcOpts ?? '')).length > 0;
  if (!hasAnyBaseSource && !hasOptionsSource) {
    return { updated: block, targetLang: to, changed: false, hasTranslatableSource: false };
  }

  const [baseTranslations, optsResult, metaPatch] = await Promise.all([
    hasAnyBaseSource ? translateBatch(baseTexts, from, to) : Promise.resolve(baseTexts),
    block.type === 'QUESTION'
      ? translateOptionsAndAnswersSingle(srcOpts, srcAns, srcMulti, from, to, String(block.label || block.type || ''))
      : Promise.resolve({ options: block.options, correctAnswer: block.correctAnswer, correctAnswers: block.correctAnswers, changed: false }),
    translateMetadataFields(block, to).catch(() => ({} as Record<string, string>)),
  ]);

  let cursor = 0;
  const trTitle = baseTranslations[cursor++] || '';
  let trContent = rescueMissingImages(srcContent, baseTranslations[cursor++] || '');
  const trExtras = extraFields.map((_, idx) => rescueMissingImages(srcExtras[idx] || '', baseTranslations[cursor++] || ''));
  const trSections = srcSections.map((srcSec, idx) => rescueMissingImages(srcSec, baseTranslations[cursor + idx] || ''));

  let anyChanged = optsResult.changed || Object.keys(metaPatch).length > 0;
  if (didTranslationSucceed(srcTitle, trTitle, to)) anyChanged = true;
  if (didTranslationSucceed(srcContent, trContent, to)) anyChanged = true;
  srcExtras.forEach((s, i) => { if (didTranslationSucceed(s, trExtras[i], to)) anyChanged = true; });
  srcSections.forEach((s, i) => { if (didTranslationSucceed(s, trSections[i], to)) anyChanged = true; });

  const updated: any = { ...block, ...metaPatch };

  if (to === 'en') {
    if (trTitle) updated.titleEn = trTitle;
    if (trContent) {
      updated.contentEn = trContent;
      updated.textEn = trContent;
    }
    extraFields.forEach((f, i) => { if (trExtras[i]) updated[`${f}En`] = trExtras[i]; });
    if (block.type === 'QUESTION') {
      updated.optionsEn = optsResult.options;
      if (optsResult.correctAnswer !== undefined) updated.correctAnswerEn = optsResult.correctAnswer;
      if (optsResult.correctAnswers !== undefined) updated.correctAnswersEn = optsResult.correctAnswers;
    }
    if (sectionsList.length > 0) {
      updated.sections = sectionsList.map((sec: any, i: number) => ({
        ...sec,
        contentEn: trSections[i] || sec.contentEn || sec.content || '',
      }));
    }
  } else {
    if (!updated.titleEn && srcTitle) updated.titleEn = srcTitle;
    if (!updated.contentEn && srcContent) {
      updated.contentEn = srcContent;
      updated.textEn = srcContent;
    }
    extraFields.forEach((f, i) => {
      if (!updated[`${f}En`] && srcExtras[i]) updated[`${f}En`] = srcExtras[i];
    });
    if (trTitle) updated.title = trTitle;
    if (trContent) {
      updated.content = trContent;
      updated.text = trContent;
    }
    extraFields.forEach((f, i) => { if (trExtras[i]) updated[f] = trExtras[i]; });

    if (block.type === 'QUESTION') {
      if (!updated.optionsEn || (Array.isArray(updated.optionsEn) && updated.optionsEn.length === 0)) {
        updated.optionsEn = srcOpts;
      }
      if ((updated.correctAnswerEn === undefined || updated.correctAnswerEn === null || updated.correctAnswerEn === '') && srcAns !== undefined) {
        updated.correctAnswerEn = srcAns;
      }
      if ((!updated.correctAnswersEn || updated.correctAnswersEn.length === 0) && Array.isArray(srcMulti) && srcMulti.length > 0) {
        updated.correctAnswersEn = srcMulti;
      }
      updated.options = optsResult.options;
      if (optsResult.correctAnswer !== undefined) updated.correctAnswer = optsResult.correctAnswer;
      if (optsResult.correctAnswers !== undefined) updated.correctAnswers = optsResult.correctAnswers;
    }

    if (sectionsList.length > 0) {
      updated.sections = sectionsList.map((sec: any, i: number) => ({
        ...sec,
        content: trSections[i] || sec.content || '',
        contentEn: sec.contentEn || srcSections[i] || '',
      }));
    }
  }

  return { updated, targetLang: to, changed: anyChanged, hasTranslatableSource: true };
}

export async function translateSingleQuestionItem(
  question: any,
  activeLang: 'ar' | 'en',
): Promise<{ updated: any; targetLang: 'ar' | 'en'; changed: boolean; hasTranslatableSource: boolean }> {
  if (!question) return { updated: question, targetLang: activeLang, changed: false, hasTranslatableSource: false };

  const textAr = question.text || '';
  const textEn = question.textEn || '';
  const optsRaw = typeof question.options === 'string' ? question.options : JSON.stringify(question.options ?? '');
  const isActuallyEnglishInArTab =
    activeLang === 'ar'
    && !hasArabicLetters(textAr)
    && (isEnglishOnlyText(textAr) || isEnglishOnlyText(textEn) || isEnglishOnlyText(optsRaw));

  const from: 'ar' | 'en' = isActuallyEnglishInArTab ? 'en' : activeLang;
  const to: 'ar' | 'en' = from === 'ar' ? 'en' : 'ar';

  const srcText = from === 'ar' ? textAr : (textEn || (isEnglishOnlyText(textAr) ? textAr : ''));
  const extraFields = ['explanation', 'hint', 'tip', 'keyInsight'] as const;
  const srcExtras = extraFields.map((f) =>
    from === 'ar'
      ? (question[f] || '')
      : (question[`${f}En`] || (isEnglishOnlyText(question[f]) ? question[f] : '')),
  );
  const sectionsList = Array.isArray(question.sections) ? question.sections : [];
  const srcSections: string[] = sectionsList.map((sec: any) =>
    from === 'ar'
      ? String(sec?.content || sec?.text || '')
      : String(sec?.contentEn || sec?.textEn || (isEnglishOnlyText(sec?.content || sec?.text) ? (sec?.content || sec?.text) : '')),
  );

  const baseTexts = [srcText, ...srcExtras, ...srcSections];
  const hasAnyBaseSource = baseTexts.some((t) => cleanVisibleText(t).length > 0);
  const srcOpts = from === 'ar'
    ? question.options
    : (question.optionsEn !== undefined && question.optionsEn !== null && !(Array.isArray(question.optionsEn) && question.optionsEn.length === 0)
      ? question.optionsEn
      : question.options);
  const srcAns = from === 'ar'
    ? question.correctAnswer
    : (question.correctAnswerEn !== undefined && question.correctAnswerEn !== null && question.correctAnswerEn !== ''
      ? question.correctAnswerEn
      : question.correctAnswer);
  const srcMulti = from === 'ar'
    ? question.correctAnswers
    : (Array.isArray(question.correctAnswersEn) && question.correctAnswersEn.length > 0 ? question.correctAnswersEn : question.correctAnswers);
  const hasOptionsSource = question.type !== 'TEXT' && cleanVisibleText(typeof srcOpts === 'string' ? srcOpts : JSON.stringify(srcOpts ?? '')).length > 0;

  if (!hasAnyBaseSource && !hasOptionsSource) {
    return { updated: question, targetLang: to, changed: false, hasTranslatableSource: false };
  }

  const [baseTranslations, optsResult, metaPatch] = await Promise.all([
    hasAnyBaseSource ? translateBatch(baseTexts, from, to) : Promise.resolve(baseTexts),
    question.type !== 'TEXT'
      ? translateOptionsAndAnswersSingle(srcOpts, srcAns, srcMulti, from, to, String(question.type || question.label || ''))
      : Promise.resolve({ options: question.options, correctAnswer: question.correctAnswer, correctAnswers: question.correctAnswers, changed: false }),
    translateMetadataFields(question, to).catch(() => ({} as Record<string, string>)),
  ]);

  let cursor = 0;
  const trText = rescueMissingImages(srcText, baseTranslations[cursor++] || '');
  const trExtras = extraFields.map((_, idx) => rescueMissingImages(srcExtras[idx], baseTranslations[cursor++] || ''));
  const trSections = srcSections.map((s, idx) => rescueMissingImages(s, baseTranslations[cursor + idx] || ''));

  let anyChanged = optsResult.changed || Object.keys(metaPatch).length > 0;
  if (didTranslationSucceed(srcText, trText, to)) anyChanged = true;
  srcExtras.forEach((s, i) => { if (didTranslationSucceed(s, trExtras[i], to)) anyChanged = true; });
  srcSections.forEach((s, i) => { if (didTranslationSucceed(s, trSections[i], to)) anyChanged = true; });

  const updated: any = { ...question, ...metaPatch };
  if (to === 'en') {
    if (trText) updated.textEn = trText;
    extraFields.forEach((f, i) => { if (trExtras[i]) updated[`${f}En`] = trExtras[i]; });
    updated.optionsEn = optsResult.options;
    if (optsResult.correctAnswer !== undefined) updated.correctAnswerEn = optsResult.correctAnswer;
    if (optsResult.correctAnswers !== undefined) updated.correctAnswersEn = optsResult.correctAnswers;
    if (sectionsList.length > 0) {
      updated.sections = sectionsList.map((sec: any, i: number) => ({
        ...sec,
        contentEn: trSections[i] || sec.contentEn || sec.content || '',
      }));
    } else if (trExtras[0]) {
      updated.sections = [{ id: Date.now(), type: 'EXPLANATION', content: srcExtras[0] || '', contentEn: trExtras[0] }];
    }
  } else {
    if (!updated.textEn && srcText) updated.textEn = srcText;
    extraFields.forEach((f, i) => {
      if (!updated[`${f}En`] && srcExtras[i]) updated[`${f}En`] = srcExtras[i];
    });
    if (trText) updated.text = trText;
    extraFields.forEach((f, i) => { if (trExtras[i]) updated[f] = trExtras[i]; });

    if (!updated.optionsEn || (Array.isArray(updated.optionsEn) && updated.optionsEn.length === 0)) {
      updated.optionsEn = srcOpts;
    }
    if ((updated.correctAnswerEn === undefined || updated.correctAnswerEn === null || updated.correctAnswerEn === '') && srcAns !== undefined) {
      updated.correctAnswerEn = srcAns;
    }
    if ((!updated.correctAnswersEn || updated.correctAnswersEn.length === 0) && Array.isArray(srcMulti) && srcMulti.length > 0) {
      updated.correctAnswersEn = srcMulti;
    }

    updated.options = optsResult.options;
    if (optsResult.correctAnswer !== undefined) updated.correctAnswer = optsResult.correctAnswer;
    if (optsResult.correctAnswers !== undefined) updated.correctAnswers = optsResult.correctAnswers;

    if (sectionsList.length > 0) {
      updated.sections = sectionsList.map((sec: any, i: number) => ({
        ...sec,
        content: trSections[i] || sec.content || '',
        contentEn: sec.contentEn || srcSections[i] || '',
      }));
    } else if (trExtras[0]) {
      updated.sections = [{ id: Date.now(), type: 'EXPLANATION', content: trExtras[0], contentEn: srcExtras[0] || '' }];
    }
  }

  return { updated, targetLang: to, changed: anyChanged, hasTranslatableSource: true };
}

export async function translateSingleActivityItem(
  activity: any,
  activeLang: 'ar' | 'en',
): Promise<{ updated: any; targetLang: 'ar' | 'en'; changed: boolean; hasTranslatableSource: boolean }> {
  if (!activity) return { updated: activity, targetLang: activeLang, changed: false, hasTranslatableSource: false };

  const isActuallyEnglishInArTab =
    activeLang === 'ar'
    && !hasArabicLetters(activity.questionText || '')
    && !hasArabicLetters(activity.title || '')
    && (isEnglishOnlyText(activity.questionText) || isEnglishOnlyText(activity.questionTextEn) || isEnglishOnlyText(activity.title) || isEnglishOnlyText(activity.titleEn));

  const from: 'ar' | 'en' = isActuallyEnglishInArTab ? 'en' : activeLang;
  const to: 'ar' | 'en' = from === 'ar' ? 'en' : 'ar';

  const textFields = ['title', 'questionText', 'explanation', 'hint', 'tip', 'keyInsight'] as const;
  const srcTexts = textFields.map((f) =>
    from === 'ar'
      ? (activity[f] || '')
      : (activity[`${f}En`] || (isEnglishOnlyText(activity[f]) ? activity[f] : '')),
  );

  const hasBaseSource = srcTexts.some((t) => cleanVisibleText(t).length > 0);
  const srcOpts = from === 'ar' ? activity.options : (activity.optionsEn ?? activity.options);
  const srcAns = from === 'ar' ? activity.correctAnswer : (activity.correctAnswerEn ?? activity.correctAnswer);
  const hasOptsSource = cleanVisibleText(typeof srcOpts === 'string' ? srcOpts : JSON.stringify(srcOpts ?? '')).length > 0;

  if (!hasBaseSource && !hasOptsSource) {
    return { updated: activity, targetLang: to, changed: false, hasTranslatableSource: false };
  }

  const [trTexts, optsResult, metaPatch] = await Promise.all([
    hasBaseSource ? translateBatch(srcTexts, from, to) : Promise.resolve(srcTexts),
    translateOptionsAndAnswersSingle(srcOpts, srcAns, undefined, from, to, String(activity.type || '')),
    translateMetadataFields(activity, to, ['standard', 'indicator', 'learningOutcome', 'skill']).catch(() => ({} as Record<string, string>)),
  ]);

  const rescued = textFields.map((f, idx) =>
    f === 'questionText' ? rescueMissingImages(srcTexts[idx], trTexts[idx] || '') : (trTexts[idx] || ''),
  );

  let anyChanged = optsResult.changed || Object.keys(metaPatch).length > 0;
  srcTexts.forEach((s, i) => { if (didTranslationSucceed(s, rescued[i], to)) anyChanged = true; });

  const updated: any = { ...activity, ...metaPatch };
  if (to === 'en') {
    textFields.forEach((f, i) => { if (rescued[i]) updated[`${f}En`] = rescued[i]; });
    updated.optionsEn = typeof srcOpts === 'string' ? String(optsResult.options) : JSON.stringify(optsResult.options ?? {});
    if (optsResult.correctAnswer !== undefined) {
      updated.correctAnswerEn = typeof optsResult.correctAnswer === 'string' ? optsResult.correctAnswer : JSON.stringify(optsResult.correctAnswer);
    }
  } else {
    textFields.forEach((f, i) => {
      if (!updated[`${f}En`] && srcTexts[i]) updated[`${f}En`] = srcTexts[i];
      if (rescued[i]) updated[f] = rescued[i];
    });
    if (!updated.optionsEn && srcOpts !== undefined) {
      updated.optionsEn = typeof srcOpts === 'string' ? srcOpts : JSON.stringify(srcOpts);
    }
    if ((updated.correctAnswerEn === undefined || updated.correctAnswerEn === null || updated.correctAnswerEn === '') && srcAns !== undefined) {
      updated.correctAnswerEn = typeof srcAns === 'string' ? srcAns : JSON.stringify(srcAns);
    }
    updated.options = optsResult.options;
    if (optsResult.correctAnswer !== undefined) updated.correctAnswer = optsResult.correctAnswer;
  }

  return { updated, targetLang: to, changed: anyChanged, hasTranslatableSource: true };
}

function needsMissingArabicFill(arVal: unknown, enVal: unknown, mode: 'content' | 'metadata' = 'content'): boolean {
  const arStr = String(arVal ?? '');
  const enStr = String(enVal ?? '');
  const enClean = cleanVisibleText(enStr);
  const arClean = cleanVisibleText(arStr);
  const enSource = enClean ? enStr : (!hasArabicLetters(arStr) ? arStr : '');
  const enSourceClean = cleanVisibleText(enSource);

  if (!enSourceClean || !isEnglishWithoutArabic(enSource, mode)) {
    return false;
  }
  if (!arClean) {
    return true;
  }
  if (!hasArabicLetters(arStr) && arClean.toLowerCase() === enSourceClean.toLowerCase()) {
    return true;
  }
  return false;
}

function normalizeOptsForCompare(opts: unknown): string[] {
  const { parsed } = tryParseJson(opts);
  if (Array.isArray(parsed)) {
    return parsed.map((v) => String(v ?? ''));
  }
  return [];
}

function isTranslatedValueAcceptable(arCandidate: unknown, enVal: unknown, isTrueFalse = false): boolean {
  const str = String(arCandidate ?? '');
  if (!cleanVisibleText(str)) return false;
  if (hasArabicLetters(str)) return true;
  if (isTrueFalse && /^(true|false|صحيح|خطأ)$/i.test(cleanVisibleText(str))) return true;
  const enClean = cleanVisibleText(String(enVal ?? ''));
  return Boolean(enClean && cleanVisibleText(str).toLowerCase() !== enClean.toLowerCase() && !isEnglishOnlyText(str));
}

export function questionNeedsTabAutoTranslate(q: any): boolean {
  if (!q || typeof q !== 'object') return false;
  if (needsMissingArabicFill(q.text, q.textEn)) return true;

  for (const field of ['explanation', 'tip', 'keyInsight'] as const) {
    if (needsMissingArabicFill(q[field], q[`${field}En`])) return true;
  }

  if (Array.isArray(q.sections)) {
    for (const sec of q.sections) {
      if (needsMissingArabicFill(sec?.content ?? sec?.text, sec?.contentEn ?? sec?.textEn)) {
        return true;
      }
    }
  }

  const qType = String(q.type || q.label || '').toUpperCase();
  if (qType !== 'TRUE_FALSE' && qType !== 'TEXT') {
    const arOpts = normalizeOptsForCompare(q.options);
    const enOpts = normalizeOptsForCompare(q.optionsEn);
    if (arOpts.length > 0 || enOpts.length > 0) {
      const maxLen = Math.max(arOpts.length, enOpts.length);
      for (let i = 0; i < maxLen; i++) {
        if (needsMissingArabicFill(arOpts[i] ?? '', enOpts[i] ?? '')) return true;
      }
    } else {
      const optsStr = typeof q.options === 'string' ? q.options : JSON.stringify(q.options ?? '');
      const optsEnStr = typeof q.optionsEn === 'string' ? q.optionsEn : JSON.stringify(q.optionsEn ?? '');
      if (needsMissingArabicFill(optsStr, optsEnStr)) return true;
    }
  }

  return false;
}

export function mergeSafeArabicQuestionPatch(current: any, snapshot: any, translated: any): any {
  if (!current || !snapshot || !translated) return current;
  const next: any = { ...current };
  const qType = String(current.type || snapshot.type || current.label || '').toUpperCase();
  const isTrueFalse = qType === 'TRUE_FALSE';

  const copyIfSafe = (field: string, enField = `${field}En`, mode: 'content' | 'metadata' = 'content') => {
    const enSnap = snapshot[enField] || snapshot[field];
    if ((current[enField] === undefined || current[enField] === null || current[enField] === '') && translated[enField]) {
      next[enField] = translated[enField];
    }
    if (
      current[field] === snapshot[field]
      && needsMissingArabicFill(snapshot[field], enSnap, mode)
      && isTranslatedValueAcceptable(translated[field], enSnap, false)
    ) {
      next[field] = translated[field];
    }
  };

  for (const field of ['text', 'explanation', 'hint', 'tip', 'keyInsight']) {
    copyIfSafe(field);
  }
  for (const mf of ['course', 'section', 'domain', 'standard', 'learningOutcome', 'indicator', 'skill', 'subskill', 'microSkill', 'errorPattern']) {
    copyIfSafe(mf, `${mf}En`, 'metadata');
  }

  if (Array.isArray(current.sections) && Array.isArray(snapshot.sections) && Array.isArray(translated.sections)) {
    next.sections = current.sections.map((curSec: any, idx: number) => {
      const snapSec = snapshot.sections[idx];
      const trSec = translated.sections[idx];
      if (!snapSec || !trSec) return curSec;
      const curContent = curSec?.content ?? curSec?.text ?? '';
      const snapContent = snapSec?.content ?? snapSec?.text ?? '';
      const enSnapContent = snapSec?.contentEn ?? snapSec?.textEn ?? snapContent;
      const trContent = trSec?.content ?? trSec?.text ?? '';
      const updatedSec = { ...curSec };
      if (!updatedSec.contentEn && trSec.contentEn) updatedSec.contentEn = trSec.contentEn;
      if (
        curContent === snapContent
        && needsMissingArabicFill(snapContent, enSnapContent)
        && isTranslatedValueAcceptable(trContent, enSnapContent, false)
      ) {
        updatedSec.content = trContent;
        if ('text' in updatedSec) updatedSec.text = trContent;
      }
      return updatedSec;
    });
  }

  if ((!current.optionsEn || (Array.isArray(current.optionsEn) && current.optionsEn.length === 0)) && translated.optionsEn) {
    next.optionsEn = translated.optionsEn;
  }
  if ((current.correctAnswerEn === undefined || current.correctAnswerEn === null || current.correctAnswerEn === '') && translated.correctAnswerEn !== undefined) {
    next.correctAnswerEn = translated.correctAnswerEn;
  }
  if ((!current.correctAnswersEn || current.correctAnswersEn.length === 0) && Array.isArray(translated.correctAnswersEn) && translated.correctAnswersEn.length > 0) {
    next.correctAnswersEn = translated.correctAnswersEn;
  }

  if (qType !== 'TEXT' && JSON.stringify(current.options) === JSON.stringify(snapshot.options)) {
    const snapOptsArr = normalizeOptsForCompare(snapshot.options);
    const snapEnOptsArr = normalizeOptsForCompare(snapshot.optionsEn);
    const trOptsArr = normalizeOptsForCompare(translated.options);
    const hasUntranslatedOpts =
      snapOptsArr.some((o, i) => needsMissingArabicFill(o, snapEnOptsArr[i] ?? o))
      || (snapOptsArr.length === 0 && snapEnOptsArr.length > 0);
    const trHasArabicOpts = isTrueFalse
      ? trOptsArr.some((o) => o === 'صحيح' || o === 'خطأ')
      : trOptsArr.some((o, i) => isTranslatedValueAcceptable(o, snapEnOptsArr[i] ?? snapOptsArr[i], false));

    if (hasUntranslatedOpts && trHasArabicOpts) {
      next.options = translated.options;
      if (current.correctAnswer === snapshot.correctAnswer && translated.correctAnswer !== undefined) {
        if (isTrueFalse || hasArabicLetters(String(translated.correctAnswer ?? '')) || !hasArabicLetters(String(snapshot.correctAnswer ?? ''))) {
          next.correctAnswer = translated.correctAnswer;
        }
      }
      if (
        JSON.stringify(current.correctAnswers) === JSON.stringify(snapshot.correctAnswers)
        && Array.isArray(translated.correctAnswers)
      ) {
        next.correctAnswers = translated.correctAnswers;
      }
    }
  }

  return next;
}

export function slideNeedsTabAutoTranslate(slide: any): boolean {
  if (!slide || typeof slide !== 'object') return false;
  const arBody = slide.content ?? slide.text ?? '';
  const enBody = slide.contentEn ?? slide.textEn ?? '';
  if (needsMissingArabicFill(arBody, enBody)) return true;

  const arTitle = isDefaultSlideTitle(slide.title) ? '' : (slide.title || '');
  const enTitle = isDefaultSlideTitle(slide.titleEn) ? '' : (slide.titleEn || '');
  if (needsMissingArabicFill(arTitle, enTitle)) return true;

  for (const field of ['explanation', 'tip', 'keyInsight'] as const) {
    if (needsMissingArabicFill(slide[field], slide[`${field}En`])) return true;
  }

  if (Array.isArray(slide.sections)) {
    for (const sec of slide.sections) {
      if (needsMissingArabicFill(sec?.content ?? sec?.text, sec?.contentEn ?? sec?.textEn)) {
        return true;
      }
    }
  }

  const label = String(slide.label || slide.type || '').toUpperCase();
  if (slide.type === 'QUESTION' && label !== 'TRUE_FALSE') {
    const arOpts = normalizeOptsForCompare(slide.options);
    const enOpts = normalizeOptsForCompare(slide.optionsEn);
    if (arOpts.length > 0 || enOpts.length > 0) {
      const maxLen = Math.max(arOpts.length, enOpts.length);
      for (let i = 0; i < maxLen; i++) {
        if (needsMissingArabicFill(arOpts[i] ?? '', enOpts[i] ?? '')) return true;
      }
    } else {
      const optsStr = typeof slide.options === 'string' ? slide.options : JSON.stringify(slide.options ?? '');
      const optsEnStr = typeof slide.optionsEn === 'string' ? slide.optionsEn : JSON.stringify(slide.optionsEn ?? '');
      if (needsMissingArabicFill(optsStr, optsEnStr)) return true;
    }
  }

  return false;
}

export function mergeSafeArabicSlidePatch(current: any, snapshot: any, translated: any): any {
  if (!current || !snapshot || !translated) return current;
  const next: any = { ...current };

  const curBody = current.content ?? current.text ?? '';
  const snapBody = snapshot.content ?? snapshot.text ?? '';
  const snapEnBody = snapshot.contentEn ?? snapshot.textEn ?? snapBody;
  const trBody = translated.content ?? translated.text ?? '';
  if (!current.contentEn && translated.contentEn) next.contentEn = translated.contentEn;
  if (!current.textEn && translated.textEn) next.textEn = translated.textEn;
  if (
    curBody === snapBody
    && needsMissingArabicFill(snapBody, snapEnBody)
    && isTranslatedValueAcceptable(trBody, snapEnBody, false)
  ) {
    next.content = trBody;
    next.text = trBody;
  }

  const curTitle = current.title ?? '';
  const snapTitle = snapshot.title ?? '';
  const snapArTitleEff = isDefaultSlideTitle(snapTitle) ? '' : snapTitle;
  const snapEnTitle = isDefaultSlideTitle(snapshot.titleEn) ? '' : (snapshot.titleEn || snapArTitleEff);
  if (!current.titleEn && translated.titleEn) next.titleEn = translated.titleEn;
  if (
    curTitle === snapTitle
    && needsMissingArabicFill(snapArTitleEff, snapEnTitle)
    && isTranslatedValueAcceptable(translated.title, snapEnTitle, false)
  ) {
    next.title = translated.title;
  }

  for (const field of ['explanation', 'hint', 'tip', 'keyInsight']) {
    const enField = `${field}En`;
    const enSnap = snapshot[enField] || snapshot[field];
    if (!current[enField] && translated[enField]) next[enField] = translated[enField];
    if (
      current[field] === snapshot[field]
      && needsMissingArabicFill(snapshot[field], enSnap)
      && isTranslatedValueAcceptable(translated[field], enSnap, false)
    ) {
      next[field] = translated[field];
    }
  }

  for (const mf of ['domain', 'standard', 'learningOutcome', 'indicator', 'skill']) {
    const enField = `${mf}En`;
    const enSnap = snapshot[enField] || snapshot[mf];
    if (!current[enField] && translated[enField]) next[enField] = translated[enField];
    if (
      current[mf] === snapshot[mf]
      && needsMissingArabicFill(snapshot[mf], enSnap, 'metadata')
      && isTranslatedValueAcceptable(translated[mf], enSnap, false)
    ) {
      next[mf] = translated[mf];
    }
  }

  if (Array.isArray(current.sections) && Array.isArray(snapshot.sections) && Array.isArray(translated.sections)) {
    next.sections = current.sections.map((curSec: any, idx: number) => {
      const snapSec = snapshot.sections[idx];
      const trSec = translated.sections[idx];
      if (!snapSec || !trSec) return curSec;
      const curContent = curSec?.content ?? curSec?.text ?? '';
      const snapContent = snapSec?.content ?? snapSec?.text ?? '';
      const enSnapContent = snapSec?.contentEn ?? snapSec?.textEn ?? snapContent;
      const trContent = trSec?.content ?? trSec?.text ?? '';
      const updatedSec = { ...curSec };
      if (!updatedSec.contentEn && trSec.contentEn) updatedSec.contentEn = trSec.contentEn;
      if (
        curContent === snapContent
        && needsMissingArabicFill(snapContent, enSnapContent)
        && isTranslatedValueAcceptable(trContent, enSnapContent, false)
      ) {
        updatedSec.content = trContent;
        if ('text' in updatedSec) updatedSec.text = trContent;
      }
      return updatedSec;
    });
  }

  if (current.type === 'QUESTION' && JSON.stringify(current.options) === JSON.stringify(snapshot.options)) {
    const isTrueFalse = String(current.label || current.type || '').toUpperCase() === 'TRUE_FALSE';
    if (!current.optionsEn && translated.optionsEn) next.optionsEn = translated.optionsEn;
    if (!current.correctAnswerEn && translated.correctAnswerEn !== undefined) next.correctAnswerEn = translated.correctAnswerEn;
    if (!current.correctAnswersEn && Array.isArray(translated.correctAnswersEn)) next.correctAnswersEn = translated.correctAnswersEn;

    const snapOptsArr = normalizeOptsForCompare(snapshot.options);
    const snapEnOptsArr = normalizeOptsForCompare(snapshot.optionsEn);
    const trOptsArr = normalizeOptsForCompare(translated.options);
    const hasUntranslatedOpts =
      snapOptsArr.some((o, i) => needsMissingArabicFill(o, snapEnOptsArr[i] ?? o))
      || (snapOptsArr.length === 0 && snapEnOptsArr.length > 0);
    const trHasArabicOpts = isTrueFalse
      ? trOptsArr.some((o) => o === 'صحيح' || o === 'خطأ')
      : trOptsArr.some((o, i) => isTranslatedValueAcceptable(o, snapEnOptsArr[i] ?? snapOptsArr[i], false));

    if (hasUntranslatedOpts && trHasArabicOpts) {
      next.options = translated.options;
      if (current.correctAnswer === snapshot.correctAnswer && translated.correctAnswer !== undefined) {
        next.correctAnswer = translated.correctAnswer;
      }
      if (JSON.stringify(current.correctAnswers) === JSON.stringify(snapshot.correctAnswers) && Array.isArray(translated.correctAnswers)) {
        next.correctAnswers = translated.correctAnswers;
      }
    }
  }

  return next;
}
