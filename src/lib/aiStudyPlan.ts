import { marked } from 'marked';
import { normalizeAiMarkdown } from './aiMarkdown';

export function studyPlanParts(narrative: string) {
  const source = normalizeAiMarkdown(narrative.trim().replace(/^```(?:md|markdown)\s*\n([\s\S]*?)\n```$/i, '$1'));
  const sections: Array<{ title: string; content: string }> = [];
  let intro = '', current: { title: string; content: string } | null = null;
  for (const token of marked.lexer(source)) {
    const boldHeading = token.type === 'paragraph' && token.tokens?.length === 1 && token.tokens[0].type === 'strong' ? token.tokens[0].text : null;
    const heading = token.type === 'heading' ? token.text : boldHeading;
    if (heading) {
      if (current?.content.trim()) sections.push({ ...current, content: current.content.trim() });
      current = { title: heading.replace(/\*\*/g, '').replace(/[:：]$/, '').trim(), content: '' };
    } else if (current) current.content += token.raw;
    else intro += token.raw;
  }
  if (current?.content.trim()) sections.push({ ...current, content: current.content.trim() });
  return { intro: intro.trim(), sections };
}

export function studyPlanTone(title: string): 'summary' | 'strength' | 'practice' | 'steps' {
  if (/قو[ةت]|قوت|كويس|strength|doing well/i.test(title)) return 'strength';
  if (/راجع|مراجعة|نرك|تحسين|ضعف|practice|focus|improv/i.test(title)) return 'practice';
  if (/خطة|خطو|تبدأ|plan|step|next/i.test(title)) return 'steps';
  return 'summary';
}
