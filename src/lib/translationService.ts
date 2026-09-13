import { API_URL } from './api';

export async function translateText(
  text: string,
  from: 'ar' | 'en' = 'ar',
  to: 'ar' | 'en' = 'en'
): Promise<string> {
  if (!text || !text.trim()) return text;
  const res = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text, from, to }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Translation request failed');
  }

  const data = await res.json();
  return data.translatedText || text;
}

export async function translateBatch(
  texts: string[],
  from: 'ar' | 'en' = 'ar',
  to: 'ar' | 'en' = 'en'
): Promise<string[]> {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  
  const res = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ texts, from, to }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Translation request failed');
  }

  const data = await res.json();
  return data.translations || texts;
}
