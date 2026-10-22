import { translateBatch } from '@/lib/translationService';
import { translateMetadataFields } from '@/lib/questionMetadataTranslation';
import { questionForSave, type CompetitionQuestion } from './authoring';

export async function translateCompetitionQuestion(question: CompetitionQuestion, from: 'ar' | 'en', to: 'ar' | 'en') {
  const source = questionForSave(question);
  const suffix = from === 'en' ? 'En' : '';
  const target = to === 'en' ? 'En' : '';
  const machineKey = /^(?:id|type|src|url|imageUrl|videoUrl|color|backgroundColor|latex|formula|equation|expression|command|geogebra|appletId)$/i;
  const texts: string[] = [];
  const collect = (value: any, key = ''): void => {
    if (machineKey.test(key)) return;
    if (typeof value === 'string') {
      if (value.trim() && !/^(?:https?:|data:|blob:|\/uploads\/)/.test(value) && !texts.includes(value)) texts.push(value);
    } else if (Array.isArray(value)) value.forEach(item => collect(item));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([name, item]) => collect(item, name));
  };
  const fields = ['text', 'explanation', 'hint', 'tip', 'keyInsight', 'options', 'correctAnswer'];
  const values = Object.fromEntries(fields.map(field => [field, source[field + suffix] ?? source[field]]));
  fields.forEach(field => collect(values[field]));
  const sections = Array.isArray(source.sections) ? source.sections : [];
  sections.forEach((section: any) => collect(section['content' + suffix] ?? section.content));
  const translated = await translateBatch(texts, from, to);
  const replacements = new Map(texts.map((text, index) => [text, translated[index] ?? text]));
  const replace = (value: any, key = ''): any => {
    if (machineKey.test(key)) return value;
    if (typeof value === 'string') return replacements.get(value) ?? value;
    if (Array.isArray(value)) return value.map(item => replace(item));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, replace(item, name)]));
    return value;
  };
  const next = { ...question, ...await translateMetadataFields(question, to) };
  fields.forEach(field => { if (values[field] !== undefined) next[field + target] = replace(values[field]); });
  next.sections = sections.map((section: any) => ({ ...section, ['content' + target]: replace(section['content' + suffix] ?? section.content) }));
  if (source.type === 'TRUE_FALSE') next['correctAnswer' + target] = source.correctAnswer;
  if (source.type === 'MULTI_SELECT') next['correctAnswers' + target] = next['correctAnswer' + target];
  return next;
}
