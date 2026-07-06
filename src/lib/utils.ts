export const getOptionLetter = (index: number, language: string = 'ar'): string => {
  const arLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن'];
  const enLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  if (language === 'ar' || language === 'arabic') {
    return arLetters[index] || `${index + 1}`;
  }
  return enLetters[index] || String.fromCharCode(65 + index);
};

export const cleanOptionText = (text: string): string => {
  if (!text || typeof text !== 'string') return text || "";
  // Remove leading manual numbering/lettering like "A. ", "B- ", "C) ", "أ. ", "1. ", "أ - ", "A - ", etc.
  return text.replace(/^(?:(?:[A-Za-zأ-ي]|\d+)\s*[.)-]\s+)/, '').trim();
};
