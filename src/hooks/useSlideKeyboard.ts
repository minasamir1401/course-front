"use client";
import { useEffect } from 'react';
import { ignoresSlideKeyboard, slideArrowDelta } from '@/lib/slideKeyboard';
interface SlideKeyboardOptions {
  enabled: boolean; language: string; index: number; count: number;
  previous: () => void; next: () => void; allowDialog?: boolean;
}
export function useSlideKeyboard({ enabled, language, index, count, previous, next, allowDialog = false }: SlideKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (event: KeyboardEvent) => {
      const dialogs = Array.from(document.querySelectorAll('[aria-modal="true"], [role="dialog"]'));
      if (ignoresSlideKeyboard(event) || dialogs.some(dialog => !allowDialog || !dialog.hasAttribute('data-slide-preview'))) return;
      const delta = slideArrowDelta(event.key, language);
      if (!delta || index + delta < 0 || index + delta >= count) return;
      event.preventDefault();
      (delta > 0 ? next : previous)();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [enabled, language, index, count, previous, next, allowDialog]);
}
