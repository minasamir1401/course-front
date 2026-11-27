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
    restored = restored.replace(regex, () => original);
  });
  return restored;
}

async function postTranslateJson(payload: Record<string, unknown>): Promise<any> {
  const maxAttempts = 2;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await res.json();
      }

      const shouldRetry = attempt + 1 < maxAttempts && (res.status === 429 || res.status >= 500);
      if (shouldRetry) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Translation request failed');
    } catch (err) {
      if (attempt + 1 < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Translation request failed');
}

export async function translateText(
  text: string,
  from: 'ar' | 'en' = 'ar',
  to: 'ar' | 'en' = 'en'
): Promise<string> {
  if (!text || !text.trim()) return text;

  const stats = measureMaskedStats(text);
  if (stats.runs > 120 || stats.effectiveLen > 3600 || stats.maskedLen > 90_000) {
    const chunks = splitOversizedTranslationText(text);
    if (chunks.length > 1) {
      const translatedChunks = await translateBatch(chunks, from, to);
      return translatedChunks.join('');
    }
  }

  const { masked, mediaTokens } = maskClientMedia(text);
  const data = await postTranslateJson({ text: masked, from, to });
  const translated = data.translatedText || masked;
  return restoreClientMedia(translated, mediaTokens);
}

const SAFE_PROTECTED_TOKEN_RE = /(<img\b[^>]*>|<[^>]+>|\$\$[\s\S]+?\$\$|\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?:\\.|[^$\n])+\$|__[A-Z_]+_\d+__)/g;
const HTML_SPLIT_BOUNDARY_RE = /(<\/tr>|<\/p>|<\/div>|<\/li>|<\/h[1-6]>|<\/section>|<\/article>|<br\s*\/?>|\n)/i;

function measureMaskedStats(text: string): { runs: number; effectiveLen: number; maskedLen: number } {
  const { masked } = maskClientMedia(String(text || ''));
  let runs = 0;
  let effectiveLen = 0;
  let lastIdx = 0;
  SAFE_PROTECTED_TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SAFE_PROTECTED_TOKEN_RE.exec(masked)) !== null) {
    const gap = masked.slice(lastIdx, match.index).trim();
    if (gap && /[A-Za-z0-9\u0600-\u06FF]/.test(gap)) {
      runs += 1;
      effectiveLen += gap.length;
    }
    lastIdx = match.index + match[0].length;
  }
  const tail = masked.slice(lastIdx).trim();
  if (tail && /[A-Za-z0-9\u0600-\u06FF]/.test(tail)) {
    runs += 1;
    effectiveLen += tail.length;
  }
  return { runs: Math.max(runs, masked.trim() ? 1 : 0), effectiveLen, maskedLen: masked.length };
}

function splitProtectedAtomicTokens(text: string): string[] {
  const atoms: string[] = [];
  let lastIdx = 0;
  SAFE_PROTECTED_TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SAFE_PROTECTED_TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIdx) {
      const plain = text.slice(lastIdx, match.index);
      const sentences = plain.split(/((?<=[.!?\u061F\n])\s+)/);
      for (const s of sentences) {
        if (!s) continue;
        if (s.length <= 2800) {
          atoms.push(s);
        } else {
          atoms.push(...(s.match(/[\s\S]{1,2800}(?:\s+|$)|[\s\S]{1,2800}/g) || [s]));
        }
      }
    }
    atoms.push(match[0]);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    const plain = text.slice(lastIdx);
    const sentences = plain.split(/((?<=[.!?\u061F\n])\s+)/);
    for (const s of sentences) {
      if (!s) continue;
      if (s.length <= 2800) {
        atoms.push(s);
      } else {
        atoms.push(...(s.match(/[\s\S]{1,2800}(?:\s+|$)|[\s\S]{1,2800}/g) || [s]));
      }
    }
  }
  return atoms.filter(Boolean);
}

function splitOversizedTranslationText(text: string, maxRuns = 120, maxEffective = 3600): string[] {
  const initial = measureMaskedStats(text);
  if (initial.runs <= maxRuns && initial.effectiveLen <= maxEffective) {
    return [text];
  }

  // Prefer splitting large HTML/table strings at row or block boundaries so tags stay intact.
  const rawParts = text.split(HTML_SPLIT_BOUNDARY_RE);
  const blockSegments: string[] = [];
  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (!part) continue;
    if (i + 1 < rawParts.length && HTML_SPLIT_BOUNDARY_RE.test(rawParts[i + 1])) {
      blockSegments.push(part + rawParts[i + 1]);
      i += 1;
    } else {
      blockSegments.push(part);
    }
  }

  const atomicSegments: string[] = [];
  for (const seg of blockSegments) {
    const segStats = measureMaskedStats(seg);
    if (segStats.runs <= maxRuns && segStats.effectiveLen <= maxEffective) {
      atomicSegments.push(seg);
    } else {
      atomicSegments.push(...splitProtectedAtomicTokens(seg));
    }
  }

  const chunks: string[] = [];
  let current = '';
  for (const seg of atomicSegments) {
    const candidate = current + seg;
    const stats = measureMaskedStats(candidate);
    if (current && (stats.runs > maxRuns || stats.effectiveLen > maxEffective)) {
      chunks.push(current);
      current = seg;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
}

export async function translateBatch(
  texts: string[],
  from: 'ar' | 'en' = 'ar',
  to: 'ar' | 'en' = 'en',
  metadata?: 'all' | number[]
): Promise<string[]> {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const stats = texts.map((t) => measureMaskedStats(t));
  const totalRuns = stats.reduce((sum, s) => sum + s.runs, 0);
  const totalMaskedLen = stats.reduce((sum, s) => sum + s.maskedLen, 0);
  const hasOversizedItem = stats.some((s) => s.runs > 120 || s.effectiveLen > 3600 || s.maskedLen > 90_000);

  if (texts.length <= 45 && !hasOversizedItem && totalRuns <= 300 && totalMaskedLen <= 140_000) {
    return executeSingleTranslateBatch(texts, from, to, metadata);
  }

  const metaSet = metadata === 'all' ? null : new Set(Array.isArray(metadata) ? metadata : []);
  const itemEntries: Array<{ key: string; raw: string; isMeta: boolean; parts: string[] }> = [];
  const uniqueSourceParts = new Map<string, { partKey: string; text: string; isMeta: boolean; stats: { runs: number; effectiveLen: number; maskedLen: number } }>();

  for (let i = 0; i < texts.length; i++) {
    const raw = String(texts[i] ?? '');
    const isMeta = metadata === 'all' || Boolean(metaSet?.has(i));
    const kindPrefix = isMeta ? 'M' : 'C';
    if (!raw.trim()) {
      itemEntries.push({ key: `${kindPrefix}\0${raw}`, raw, isMeta, parts: [] });
      continue;
    }
    const parts = splitOversizedTranslationText(raw);
    itemEntries.push({ key: `${kindPrefix}\0${raw}`, raw, isMeta, parts });
    for (const part of parts) {
      if (!part.trim()) continue;
      const partKey = `${kindPrefix}\0${part}`;
      if (!uniqueSourceParts.has(partKey)) {
        uniqueSourceParts.set(partKey, { partKey, text: part, isMeta, stats: measureMaskedStats(part) });
      }
    }
  }

  const translatedPartMap = new Map<string, string>();
  const queue = Array.from(uniqueSourceParts.values());
  let cursor = 0;
  while (cursor < queue.length) {
    const batch: typeof queue = [];
    let batchRuns = 0;
    let batchChars = 0;
    while (cursor < queue.length && batch.length < 45) {
      const next = queue[cursor];
      if (batch.length > 0 && (batchRuns + next.stats.runs > 300 || batchChars + next.stats.maskedLen > 140_000)) {
        break;
      }
      batch.push(next);
      batchRuns += next.stats.runs;
      batchChars += next.stats.maskedLen;
      cursor += 1;
    }

    const batchMetaIndices = batch
      .map((entry, idx) => (entry.isMeta ? idx : -1))
      .filter((idx) => idx >= 0);
    const batchMetadata: 'all' | number[] | undefined =
      batchMetaIndices.length === 0
        ? undefined
        : batchMetaIndices.length === batch.length
          ? 'all'
          : batchMetaIndices;

    const translated = await executeSingleTranslateBatch(
      batch.map((entry) => entry.text),
      from,
      to,
      batchMetadata
    );
    batch.forEach((entry, idx) => {
      translatedPartMap.set(entry.partKey, translated[idx] ?? entry.text);
    });
  }

  return itemEntries.map((entry) => {
    if (entry.parts.length === 0) return entry.raw;
    const kindPrefix = entry.isMeta ? 'M' : 'C';
    return entry.parts
      .map((part) => (part.trim() ? (translatedPartMap.get(`${kindPrefix}\0${part}`) ?? part) : part))
      .join('');
  });
}

async function executeSingleTranslateBatch(
  texts: string[],
  from: 'ar' | 'en' = 'ar',
  to: 'ar' | 'en' = 'en',
  metadata?: 'all' | number[]
): Promise<string[]> {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const clientMasked = texts.map((t) => maskClientMedia(t));
  const payloadTexts = clientMasked.map((m) => m.masked);

  const data = await postTranslateJson({
    texts: payloadTexts,
    from,
    to,
    ...(metadata === 'all' ? { kind: 'metadata' } : metadata ? { metadataIndices: metadata } : {}),
  });
  const translations: string[] = data.translations || payloadTexts;
  return translations.map((translated, idx) =>
    restoreClientMedia(translated, clientMasked[idx]?.mediaTokens || [])
  );
}
