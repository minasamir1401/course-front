import { translateBatch } from './translationService';
import { questionMetadataFields } from './bilingualMetadata';
export async function translateMetadataFields(value: any, to: 'ar' | 'en', fields: readonly string[] = questionMetadataFields) {
  const patch: Record<string, string> = {};
  const translate: {field: string; source: string}[] = [];
  for (const field of fields) {
    const source = String(to === 'en' ? value[field] || value[field + 'En'] || '' : value[field + 'En'] || value[field] || '').trim();
    if (!source) continue;
    const arabic = /[\u0600-\u06ff]/.test(source);
    if (to === 'ar' && !value[field + 'En'] && !arabic) patch[field + 'En'] = source;
    if (arabic === (to === 'ar')) patch[field + (to === 'en' ? 'En' : '')] = source;
    else translate.push({field, source});
  }
  const result = await translateBatch(translate.map(item => item.source), to === 'ar' ? 'en' : 'ar', to, 'all');
  translate.forEach(({field, source}, index) => { if (result[index] && (/[\u0600-\u06ff]/.test(result[index]) === (to === 'ar'))) patch[field + (to === 'en' ? 'En' : '')] = result[index]; });
  return patch;
}
