import { slideArrowDelta } from './slideKeyboard';

export function examArrowDelta(event: KeyboardEvent, language: string): number {
  if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return 0;
  const delta = slideArrowDelta(event.key, language);
  if (!delta) return 0;
  const interactive = 'input,textarea,select,math-field,[contenteditable]:not([contenteditable="false"]),video,audio,[role="slider"],[role="radio"],[role="listbox"],[role="combobox"],[role="tablist"],summary,[data-exam-keyboard-ignore]';
  if (event.composedPath().some(target => target instanceof Element && target.closest(interactive))) return 0;
  return delta;
}
