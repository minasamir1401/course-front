/** Share presentation between translated documents without copying their text/media. */
export function syncRichTextFormatting(before: string, after: string, target: string): string {
  if (!before || !target || before === after || typeof document === 'undefined') return target;
  const parse = (html: string) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
  };
  const original = parse(before), formatted = parse(after), translated = parse(target);
  const atomSelector = '.math-tex, .katex, math, [contenteditable="false"], img, video, audio, iframe';
  const atoms = (root: DocumentFragment) => Array.from(root.querySelectorAll(atomSelector))
    .filter(node => !node.parentElement?.closest(atomSelector));
  const textNodes = (root: DocumentFragment) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.data.trim() && !node.parentElement?.closest(`${atomSelector}, script, style`)) nodes.push(node);
    }
    return nodes;
  };
  const sourceText = textNodes(original), nextText = textNodes(formatted), targetText = textNodes(translated);
  // A text edit or an ambiguous correspondence must never overwrite a translation.
  if (!sourceText.length || sourceText.length !== nextText.length || sourceText.length !== targetText.length
    || sourceText.some((node, i) => node.data.replace(/\u00a0/g, ' ') !== nextText[i].data.replace(/\u00a0/g, ' '))) return target;
  const sourceAtoms = atoms(original), nextAtoms = atoms(formatted), targetAtoms = atoms(translated);
  if (sourceAtoms.length !== nextAtoms.length
    || sourceAtoms.some((node, i) => node.outerHTML !== nextAtoms[i].outerHTML)) return target;
  nextText.forEach((node, i) => { node.data = targetText[i].data; });
  // Assets can differ between languages. Preserve the target assets in their
  // order relative to translated text instead of importing the English images.
  nextAtoms.forEach(node => node.remove());
  let tail: Node = nextText[nextText.length - 1];
  targetAtoms.forEach(node => {
    const following = targetText.findIndex(text => Boolean(node.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING));
    const copy = node.cloneNode(true);
    if (following >= 0) nextText[following].before(copy);
    else { tail.parentNode!.insertBefore(copy, tail.nextSibling); tail = copy; }
  });
  // Keep the target language's explicit direction, including when English is LTR.
  formatted.querySelectorAll('[dir]').forEach(node => {
    if (!node.closest(atomSelector)) node.setAttribute('dir', 'auto');
  });
  const result = document.createElement('div');
  result.append(formatted);
  return result.innerHTML;
}

export function updateBilingualRichText<T extends Record<string, any>>(
  question: T, field: string, value: string, language: 'ar' | 'en',
): T {
  const sourceKey = field + (language === 'en' ? 'En' : '');
  const targetKey = field + (language === 'en' ? '' : 'En');
  const legacyEnglish = language === 'en' && field === 'text' && !/[\u0600-\u06ff]/.test(question.text || '');
  const before = String(question[sourceKey] ?? (legacyEnglish ? question.text : '') ?? '');
  const next: Record<string, any> = { ...question, [sourceKey]: value,
    [targetKey]: syncRichTextFormatting(before, value, String(question[targetKey] || '')) };
  // Older English-only questions use text as their primary persistence field.
  if (legacyEnglish && (!question.text || question.text === before)) next.text = value;
  return next as T;
}
