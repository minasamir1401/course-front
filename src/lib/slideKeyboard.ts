export function slideArrowDelta(key: string, language: string): number {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return 0;
  return key === (language === 'ar' ? 'ArrowLeft' : 'ArrowRight') ? 1 : -1;
}
export function ignoresSlideKeyboard(event: KeyboardEvent | React.KeyboardEvent): boolean {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || ('nativeEvent' in event ? event.nativeEvent.isComposing : event.isComposing)) return true;
  const target = event.target;
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), math-field, video, audio, [role="slider"], [role="radio"], [role="listbox"], [role="combobox"], button:not([data-slide-nav])'));
}
