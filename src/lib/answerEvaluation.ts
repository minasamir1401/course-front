// Shared answer evaluation logic for frontend previews

export const parseStringArray = (val: any): string[] => {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
      } catch { }
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return [String(val).trim()].filter(Boolean);
};

export const arraysMatch = (arr1: string[], arr2: string[]) => {
  if (arr1.length === 0 && arr2.length === 0) return true;
  if (arr1.length !== arr2.length) return false;

  const cleanStr = (s: any) => String(s ?? '').trim().toLowerCase().replace(/"/g, '');
  const sorted1 = arr1.map(cleanStr).sort();
  const sorted2 = arr2.map(cleanStr).sort();
  return sorted1.every((val, index) => val === sorted2[index]);
};

const normalizeTrueFalse = (v: string) => {
  const t = String(v).trim().toLowerCase();
  if (["صح", "صحيح", "صواب", "true", "1"].includes(t)) return "true";
  if (["خطأ", "false", "0", "غير صحيح", "خاطئ"].includes(t)) return "false";
  return t;
};

export const normalizeAnswerGlobal = (value: any) => {
  const norm = String(value ?? '').trim().toLowerCase();
  if (['true', 'صح', 'صحيح', 'صواب', '1'].includes(norm)) return 'true';
  if (['false', 'خطأ', 'خاطئ', 'غير صحيح', '0'].includes(norm)) return 'false';
  return norm;
};

export const stripHtmlAndNormalize = (str: any): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\s\u00A0]+/g, ' ')
    .trim()
    .toLowerCase();
};

export const normalizeArabicLetters = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u0640\u064B-\u065F\u0670]/g, '');
};

export const stripOptionPrefix = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/^\((?:[a-hA-H\u0621-\u064A]|[1-9])\)\s+/, '')
    .replace(/^(?:[a-hA-H\u0621-\u064A]|[1-9])\s*[.):]\s+/, '')
    .replace(/^(?:[a-hA-H\u0623\u0627\u0628\u062C\u062F\u0647]|[1-9])-\s+/, '')
    .replace(/^(?:[a-hA-H\u0623\u0627\u0628\u062C\u062F\u0647])\s+-\s+(?=[\u0600-\u06FF]|[a-zA-Z]{2,})/, '')
    .trim();
};

export const isOptionMatch = (targetVal: any, optText: string, optIndex: number = -1): boolean => {
  if (targetVal === null || targetVal === undefined || optText === null || optText === undefined) return false;
  const rawTarget = String(targetVal).trim();
  const cleanTarget = stripHtmlAndNormalize(rawTarget);
  const cleanOpt = stripHtmlAndNormalize(optText);

  if (!cleanTarget || !cleanOpt) return false;

  // 1. Direct exact normalized string match
  if (cleanTarget === cleanOpt) return true;

  // 1b. Arabic letter normalization match
  const arTarget = normalizeArabicLetters(cleanTarget);
  const arOpt = normalizeArabicLetters(cleanOpt);
  if (arTarget === arOpt) return true;

  // 1c. Match after stripping option label prefix
  const strippedTarget = stripOptionPrefix(cleanTarget);
  const strippedOpt = stripOptionPrefix(cleanOpt);
  if (strippedTarget && strippedOpt && strippedTarget === strippedOpt) return true;

  const strippedArTarget = stripOptionPrefix(arTarget);
  const strippedArOpt = stripOptionPrefix(arOpt);
  if (strippedArTarget && strippedArOpt && strippedArTarget === strippedArOpt) return true;

  // 2. True / False normalization
  const tfTarget = normalizeAnswerGlobal(rawTarget);
  const tfOpt = normalizeAnswerGlobal(optText);
  const isTfKeywords = ['true', 'false', 'صح', 'صحيح', 'صواب', 'خطأ', 'خطا', 'خاطئ', 'غير صحيح', 'correct', 'incorrect'];
  if (isTfKeywords.includes(cleanTarget) || isTfKeywords.includes(cleanOpt)) {
    return tfTarget === tfOpt;
  }

  // 3. Option letter/index check ONLY for pure option tokens
  if (optIndex >= 0) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const arLetters = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح'];
    const tokenMatch = rawTarget.match(
      /^(?:(?:option|choice|الخيار|خيار)\s*)?\(?\s*([a-hA-H\u0623\u0625\u0622\u0627\u0628\u062C\u062F\u0647\u0629\u0648\u0632\u062D]|هـ|[0-7])\s*\)?[.:-]?\s*$/i
    );
    if (tokenMatch) {
      const token = normalizeArabicLetters(tokenMatch[1].toLowerCase());
      if (token === letters[optIndex] || token === arLetters[optIndex] || token === String(optIndex)) {
        return true;
      }
    }
  }

  return false;
};

function parseOptionList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item ?? ''));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? ''));
    } catch {
      return [];
    }
  }
  return [];
}

function extractPositiveExplanationText(question: any): string {
  const rawPieces: string[] = [];
  if (typeof question?.explanationEn === 'string' && question.explanationEn.trim()) {
    rawPieces.push(question.explanationEn);
  }
  if (Array.isArray(question?.sections)) {
    for (const sec of question.sections) {
      if (sec?.contentEn) rawPieces.push(String(sec.contentEn));
      if (sec?.textEn) rawPieces.push(String(sec.textEn));
      if (sec?.content) rawPieces.push(String(sec.content));
      if (sec?.text) rawPieces.push(String(sec.text));
    }
  }
  if (typeof question?.explanation === 'string' && question.explanation.trim()) {
    try {
      const parsed = JSON.parse(question.explanation);
      if (Array.isArray(parsed)) {
        for (const sec of parsed) {
          if (sec?.contentEn) rawPieces.push(String(sec.contentEn));
          if (sec?.textEn) rawPieces.push(String(sec.textEn));
          if (sec?.content) rawPieces.push(String(sec.content));
          if (sec?.text) rawPieces.push(String(sec.text));
        }
      } else {
        rawPieces.push(question.explanation);
      }
    } catch {
      rawPieces.push(question.explanation);
    }
  }

  return rawPieces
    .map((piece) => {
      const plain = stripHtmlAndNormalize(piece);
      const cut = plain.split(
        /(?:why\s+(?:the\s+)?other\s+options?\s+(?:are|is)\s+(?:wrong|incorrect)|incorrect\s+options?|لماذا\s+(?:باقي|بقية|الخيارات)\s+الأخرى\s+(?:خاطئة|غير\s+صحيحة))/i
      )[0] || '';
      return cut
        .split(/(?<=[.!?؟\n])\s+/)
        .filter((sentence) => !/\b(?:incorrect|wrong|not\s+correct|غير\s+صحيح|خاطئ|خاطئة)\b/i.test(sentence))
        .join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

function findDirectOptionIndices(target: unknown, opts: string[]): number[] {
  if (target === null || target === undefined || String(target).trim() === '') return [];
  const exact: number[] = [];
  const fuzzy: number[] = [];
  const normTarget = stripHtmlAndNormalize(target);
  for (let i = 0; i < opts.length; i++) {
    const opt = opts[i];
    if (opt === null || opt === undefined || String(opt).trim() === '') continue;
    if (stripHtmlAndNormalize(opt) === normTarget) exact.push(i);
    else if (isOptionMatch(target, opt, -1)) fuzzy.push(i);
  }
  return exact.length > 0 ? exact : fuzzy;
}

function resolveCollidingAnswerIndex(question: any, candidates: number[], optsAr: string[], optsEn: string[]): number {
  if (candidates.length <= 1) return candidates[0] ?? -1;
  if (question?.correctAnswerEn) {
    const enDirect = findDirectOptionIndices(question.correctAnswerEn, optsEn).filter((i) => candidates.includes(i));
    if (enDirect.length === 1) return enDirect[0];
  }
  const positiveText = extractPositiveExplanationText(question);
  if (positiveText) {
    const mentioned = candidates.filter((idx) => {
      const enVal = stripHtmlAndNormalize(optsEn[idx]);
      if (enVal && enVal.length >= 2) {
        const escaped = enVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(positiveText);
      }
      return false;
    });
    if (mentioned.length === 1) return mentioned[0];
  }
  return candidates[0];
}

export function resolveSingleOptionIndexForValue(target: unknown, optsAr: string[], optsEn: string[] = [], preferEn: boolean = false): number {
  if (target === null || target === undefined || String(target).trim() === '') return -1;
  const len = Math.max(optsAr.length, optsEn.length);
  if (len === 0) return -1;
  const primary = preferEn ? optsEn : optsAr;
  const secondary = preferEn ? optsAr : optsEn;

  const pMatches = findDirectOptionIndices(target, primary);
  if (pMatches.length === 1) return pMatches[0];
  const sMatches = findDirectOptionIndices(target, secondary);
  if (sMatches.length === 1) return sMatches[0];
  if (pMatches.length > 0) return pMatches[0];
  if (sMatches.length > 0) return sMatches[0];

  for (let i = 0; i < len; i++) {
    if ((optsAr[i] && isOptionMatch(target, optsAr[i], i)) || (optsEn[i] && isOptionMatch(target, optsEn[i], i))) {
      return i;
    }
  }
  return -1;
}

export function resolveSingleCorrectOptionIndex(question: any, preferEn: boolean = false): number {
  if (!question || typeof question !== 'object') return -1;
  const optsAr = parseOptionList(question.options);
  const optsEn = parseOptionList(question.optionsEn);
  const len = Math.max(optsAr.length, optsEn.length);
  if (len === 0) return -1;

  if (typeof question.correctAnswerIndex === 'number' && Number.isInteger(question.correctAnswerIndex) && question.correctAnswerIndex >= 0 && question.correctAnswerIndex < len) {
    const idx = question.correctAnswerIndex;
    const arOpt = optsAr[idx];
    const enOpt = optsEn[idx];
    const hasNoStringAnswer = !String(question.correctAnswer ?? '').trim() && !String(question.correctAnswerEn ?? '').trim();
    const matchesIndex =
      hasNoStringAnswer ||
      (question.correctAnswer && ((arOpt && isOptionMatch(question.correctAnswer, arOpt, -1)) || (enOpt && isOptionMatch(question.correctAnswer, enOpt, -1)))) ||
      (question.correctAnswerEn && ((arOpt && isOptionMatch(question.correctAnswerEn, arOpt, -1)) || (enOpt && isOptionMatch(question.correctAnswerEn, enOpt, -1))));
    if (matchesIndex) return idx;
  }

  if (question.correctAnswerEn && String(question.correctAnswerEn).trim() !== '') {
    const enMatches = findDirectOptionIndices(question.correctAnswerEn, optsEn);
    if (enMatches.length === 1) return enMatches[0];
    if (enMatches.length > 1) return resolveCollidingAnswerIndex(question, enMatches, optsAr, optsEn);
    const enOnAr = findDirectOptionIndices(question.correctAnswerEn, optsAr);
    if (enOnAr.length === 1) return enOnAr[0];
  }

  if (question.correctAnswer !== null && question.correctAnswer !== undefined && String(question.correctAnswer).trim() !== '') {
    const arMatches = findDirectOptionIndices(question.correctAnswer, optsAr);
    const enMatches = findDirectOptionIndices(question.correctAnswer, optsEn);
    if (preferEn && enMatches.length === 1 && arMatches.length !== 1) return enMatches[0];
    if (arMatches.length === 1) return arMatches[0];
    if (arMatches.length > 1) return resolveCollidingAnswerIndex(question, arMatches, optsAr, optsEn);
    if (enMatches.length === 1) return enMatches[0];
    if (enMatches.length > 1) return resolveCollidingAnswerIndex(question, enMatches, optsAr, optsEn);
  }

  const ordered = preferEn ? [question.correctAnswerEn, question.correctAnswer] : [question.correctAnswer, question.correctAnswerEn];
  for (const raw of ordered) {
    if (raw === null || raw === undefined || String(raw).trim() === '') continue;
    for (let i = 0; i < len; i++) {
      if ((optsAr[i] && isOptionMatch(raw, optsAr[i], i)) || (optsEn[i] && isOptionMatch(raw, optsEn[i], i))) {
        return i;
      }
    }
  }

  return -1;
}

export const isAnswerCorrect = (question: any, selectedAnswer: any): boolean => {
  if (!selectedAnswer && selectedAnswer !== 0) return false;

  if (['TEXT', 'EXPLANATION', 'VIDEO', 'IMAGE', 'CONTENT'].includes(question.type) || ['TEXT', 'EXPLANATION', 'VIDEO', 'IMAGE', 'CONTENT'].includes(question.label)) {
    return true;
  }

  const cleanStr = (s: any) => String(s ?? '').trim().toLowerCase().replace(/"/g, '');

  const parseVal = (v: any) => {
    if (typeof v !== 'string') return v;
    const t = v.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try { return JSON.parse(t); } catch { return v; }
    }
    return v;
  };

  const correctParsed = parseVal(question.correctAnswer);
  const studentParsed = parseVal(selectedAnswer);

  if (question.type === 'TRUE_FALSE') {
    return normalizeTrueFalse(String(studentParsed)) === normalizeTrueFalse(String(correctParsed));
  }

  if (question.type === 'MULTI_SELECT') {
    return arraysMatch(parseStringArray(question.correctAnswer), parseStringArray(selectedAnswer));
  }

  if (question.type === 'MEMORY_GAME') {
    try {
      const opts = typeof question.options === 'string' ? JSON.parse(question.options) : (question.options || {});
      const correct = typeof question.correctAnswer === 'string' ? JSON.parse(question.correctAnswer) : (question.correctAnswer || []);
      const pairsArr = Array.isArray(opts.pairs) ? opts.pairs : (Array.isArray(opts) ? opts : (Array.isArray(correct) ? correct : []));
      const totalPairs = pairsArr.length;
      if (totalPairs === 0) return true;
      const matchedArr = Array.isArray(studentParsed) ? studentParsed : parseStringArray(selectedAnswer);
      return matchedArr.length >= totalPairs;
    } catch { return false; }
  }

  if (['CROSSWORD', 'COLOR_MATCH', 'IMAGE_LABEL'].includes(question.type)) {
    if (typeof correctParsed === 'object' && !Array.isArray(correctParsed) && correctParsed !== null &&
        typeof studentParsed === 'object' && !Array.isArray(studentParsed) && studentParsed !== null) {
      const correctKeys = Object.keys(correctParsed);
      if (correctKeys.length === 0) return false;
      return correctKeys.every(k => cleanStr(correctParsed[k]) === cleanStr(studentParsed[k]));
    }
    return false;
  }

  if (question.type === 'VIDEO_CHECKPOINT') {
    try {
      const correctMap = typeof correctParsed === 'object' ? correctParsed : {};
      const studentCheckpoints = (typeof studentParsed === 'object' && studentParsed?.answeredCheckpoints)
        ? studentParsed.answeredCheckpoints
        : studentParsed;
      const timeKeys = Object.keys(correctMap);
      if (timeKeys.length === 0) return false;
      return timeKeys.every(k => cleanStr(correctMap[k]) === cleanStr(studentCheckpoints?.[k]));
    } catch { return false; }
  }

  if (question.type === 'FLASH_CARD') {
    return cleanStr(studentParsed) === cleanStr(correctParsed);
  }

  if (question.type === 'WORD_SEARCH') {
    return arraysMatch(parseStringArray(question.correctAnswer), parseStringArray(selectedAnswer));
  }

  // Handle MCQ or options-based questions
  const optionsArr = parseOptionList(question.options);
  const optionsEnArr = parseOptionList(question.optionsEn);
  const maxOpts = Math.max(optionsArr.length, optionsEnArr.length);

  if (maxOpts > 0) {
    const correctIdx = resolveSingleCorrectOptionIndex(question);
    if (correctIdx >= 0) {
      const directMatches: number[] = [];
      for (let i = 0; i < maxOpts; i++) {
        const arOpt = optionsArr[i];
        const enOpt = optionsEnArr[i];
        if ((arOpt && isOptionMatch(selectedAnswer, arOpt, -1)) || (enOpt && isOptionMatch(selectedAnswer, enOpt, -1))) {
          directMatches.push(i);
        }
      }
      if (directMatches.length > 0) return directMatches.includes(correctIdx);
      for (let i = 0; i < maxOpts; i++) {
        const arOpt = optionsArr[i];
        const enOpt = optionsEnArr[i];
        if ((arOpt && isOptionMatch(selectedAnswer, arOpt, i)) || (enOpt && isOptionMatch(selectedAnswer, enOpt, i))) {
          return i === correctIdx;
        }
      }
      return false;
    }
  }

  if (Array.isArray(correctParsed) && Array.isArray(studentParsed)) {
    return correctParsed.length === studentParsed.length &&
      correctParsed.every((val: any, i: number) => cleanStr(val) === cleanStr(studentParsed[i]));
  }

  if (typeof correctParsed === 'object' && !Array.isArray(correctParsed) && correctParsed !== null &&
      typeof studentParsed === 'object' && !Array.isArray(studentParsed) && studentParsed !== null) {
    const correctKeys = Object.keys(correctParsed);
    const studentKeys = Object.keys(studentParsed);
    if (correctKeys.length !== studentKeys.length) return false;
    return correctKeys.every(k => cleanStr(correctParsed[k]) === cleanStr(studentParsed[k]));
  }

  return cleanStr(selectedAnswer) === cleanStr(question.correctAnswer);
};
