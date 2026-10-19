"use client";
import React from 'react';
import { ignoresSlideKeyboard, slideArrowDelta } from '@/lib/slideKeyboard';
export default function SlideKeyboardRegion({ children, language, onNavigate }: { children: React.ReactNode; language: string; onNavigate?: (index: number) => void }) {
  return <div className="space-y-8" role="region" aria-label={language === 'ar' ? 'الشرائح — استخدم السهمين للتنقل' : 'Slides — use left and right arrows'} tabIndex={0} onKeyDown={event => {
    if (ignoresSlideKeyboard(event)) return;
    const delta = slideArrowDelta(event.key, language);
    if (!delta) return;
    const cards = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-slide-card]'));
    const current = (event.target as Element).closest('[data-slide-card]');
    const index = current ? cards.indexOf(current as HTMLElement) : -1;
    const nextIndex = index < 0 ? 0 : index + delta;
    const card = cards[nextIndex];
    if (!card) return;
    event.preventDefault(); event.stopPropagation();
    onNavigate?.(nextIndex);
    card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }}>{children}</div>;
}
