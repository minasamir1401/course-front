import { API_URL } from './api';

export const resolveMediaUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  // Intercept any uploads URLs and force them to use the local proxy path /uploads/...
  if (trimmed.includes('/uploads/')) {
    const parts = trimmed.split('/uploads/');
    return `/uploads/${parts[1]}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
};

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
