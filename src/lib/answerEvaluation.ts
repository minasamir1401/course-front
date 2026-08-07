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

export const isAnswerCorrect = (question: any, selectedAnswer: any) => {
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
