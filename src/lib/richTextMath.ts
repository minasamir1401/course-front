export function escapeMathHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function buildRichTextMathHtml(
  formula: string,
  size: string,
  fontSize: string,
  displayMode: boolean,
  renderedMath?: string,
): string {
  const escaped = escapeMathHtml(formula);
  const displayClass = displayMode ? 'block my-3 text-center' : 'inline-block mx-1 align-middle';
  const fallbackStyle = renderedMath === undefined
    ? " font-family: 'Times New Roman', serif; font-style: italic; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;"
    : '';
  const content = renderedMath ?? `\\( ${escaped} \\)`;
  return `<span class="math-tex ${displayClass} cursor-pointer hover:ring-2 hover:ring-indigo-400 rounded px-1 transition-all" contenteditable="false" data-latex="${escaped}" data-size="${escapeMathHtml(size)}" data-display="${displayMode}" style="font-size: ${escapeMathHtml(fontSize)};${fallbackStyle}">${content}</span>${displayMode ? '' : '&nbsp;'}`;
}
