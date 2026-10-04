import { API_URL } from './api';

function maskClientMedia(text: string): { masked: string; mediaTokens: string[] } {
  const mediaTokens: string[] = [];
  if (!text || typeof text !== 'string') return { masked: text || '', mediaTokens };

  const masked = text.replace(/data:image\/[a-zA-Z0-9+.-]+;base64,[a-zA-Z0-9+/=]+/gi, (match) => {
    const placeholder = `__CLIENT_MEDIA_${mediaTokens.length}__`;
    mediaTokens.push(match);
    return placeholder;
  });

  return { masked, mediaTokens };
}

function restoreClientMedia(text: string, mediaTokens: string[]): string {
  if (!text || mediaTokens.length === 0) return text;
  let restored = text;
  mediaTokens.forEach((original, idx) => {
    const regex = new RegExp(`\\s*__\\s*CLIENT_MEDIA_${idx}\\s*__\\s*`, 'gi');
    restored = restored.replace(regex, original);
  });
  return restored;
}

export async function translateText(
  text: string,
  from: 'ar' | 'en' = 'ar',
  to: 'ar' | 'en' = 'en'
): Promise<string> {
  if (!text || !text.trim()) return text;

  const { masked, mediaTokens } = maskClientMedia(text);
  const res = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text: masked, from, to }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Translation request failed');
  }

  const data = await res.json();
  const translated = data.translatedText || masked;
  return restoreClientMedia(translated, mediaTokens);
}

export async function translateBatch(
  texts: string[],
  from: 'ar' | 'en' = 'ar',
  to: 'ar' | 'en' = 'en'
): Promise<string[]> {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const clientMasked = texts.map((t) => maskClientMedia(t));
  const payloadTexts = clientMasked.map((m) => m.masked);

  const res = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ texts: payloadTexts, from, to }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Translation request failed');
  }

  const data = await res.json();
  const translations: string[] = data.translations || payloadTexts;
  return translations.map((translated, idx) =>
    restoreClientMedia(translated, clientMasked[idx]?.mediaTokens || [])
  );
}
