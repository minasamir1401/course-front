import { useEffect, useRef } from 'react';
import { translateText } from '@/lib/translationService';

/** Hints can be added after translating the prompt; fill only a missing Arabic hint. */
export function useQuestionHintTranslation(
  question: any, setQuestion: (update: (previous: any) => any) => void,
  activeLanguage: 'ar' | 'en', translatingQuestion: boolean,
) {
  const id = question?.id;
  const hint = question?.hint;
  const hintEn = question?.hintEn;
  const previousContext = useRef<{ id: any; language: string; translating: boolean } | null>(null);
  useEffect(() => {
    const previous = previousContext.current;
    const enteringArabic = !previous || previous.id !== id || previous.language !== activeLanguage
      || (previous.translating && !translatingQuestion);
    previousContext.current = { id, language: activeLanguage, translating: translatingQuestion };
    const visibleText = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    const sourceText = visibleText(hintEn || '').trim();
    const targetText = visibleText(hint || '').trim();
    if (!enteringArabic || activeLanguage !== 'ar' || translatingQuestion || !hintEn
      || /[\u0600-\u06ff]/.test(targetText) || !/[a-z]/i.test(sourceText)
      || (targetText && !sourceText.toLowerCase().startsWith(targetText.toLowerCase()))) return;
    let cancelled = false;
    void translateText(hintEn, 'en', 'ar').then(translated => {
      if (cancelled || !/[\u0600-\u06ff]/.test(visibleText(translated))) return;
      setQuestion(previous => previous?.id === id && previous.hintEn === hintEn && previous.hint === hint
        ? { ...previous, hint: translated } : previous);
    }).catch(error => console.error('Hint translation failed:', error));
    return () => { cancelled = true; };
  }, [id, hint, hintEn, activeLanguage, translatingQuestion, setQuestion]);
}
