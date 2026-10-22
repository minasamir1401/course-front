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
  return `<span class="math-tex ${displayClass} cursor-pointer hover:ring-2 hover:ring-indigo-400 rounded px-1 transition-all" dir="ltr" contenteditable="false" data-latex="${escaped}" data-size="${escapeMathHtml(size)}" data-display="${displayMode}" style="direction:ltr;unicode-bidi:isolate; font-size: ${escapeMathHtml(fontSize)};${fallbackStyle}">${content}</span>${displayMode ? '' : '&nbsp;'}`;
}

/** Isolate legacy editor/KaTeX nodes too; never reverse formula characters. */
export function isolateRichTextMath(html: string, includePlainText = true): string {
  const protectedMath = protectRenderedMath(html);
  const legacy = protectedMath.html.replace(/(?:[A-Za-z0-9()[\].,+\-=/ \t]|&(?:minus|times|divide|lt|gt);|<(?:sup|sub)\b[^>]*>[A-Za-z0-9+\-]+<\/(?:sup|sub)>)+/g, formula => /<(?:sup|sub)\b/i.test(formula) && /[A-Za-z0-9]/.test(formula) ? `<span class="math-tex" dir="ltr" style="direction:ltr;unicode-bidi:isolate;display:inline-block">${formula}</span>` : formula);
  const plain = includePlainText ? isolatePlainTextMath(legacy) : legacy;
  const restored = plain.replace(/\x00RENDERED(\d+)\x00/g, (_, i) => protectedMath.blocks[Number(i)]);
  return restored.replace(/<(span|math)\b([^>]*)>/gi, (tag, name, attributes) => {
    if (name.toLowerCase() !== 'math' && !/\bdata-latex\s*=|\bclass=["'][^"']*\b(?:math-tex|katex)(?:[\s"'])/i.test(attributes)) return tag;
    let attrs = attributes.replace(/\sdir\s*=\s*(["']).*?\1/gi, '');
    const direction = 'direction:ltr;unicode-bidi:isolate;';
    if (/\bstyle\s*=/i.test(attrs)) attrs = attrs.replace(/style=(["'])(.*?)\1/i, (_: string, quote: string, style: string) => `style=${quote}${[style.replace(/(?:direction|unicode-bidi)\s*:[^;]+;?/gi, '').replace(/^;+|;+$/g, '').trim(), direction].filter(Boolean).join(';')}${quote}`);
    else attrs += ` style="${direction}"`;
    return `<${name} dir="ltr"${attrs}>`;
  });
}

// Keep the stored character order. Bidi isolation only changes presentation.
// Tags, attributes and explicit LaTeX are never part of a plain-text match.
export function isolatePlainTextMath(html: string): string {
  return html.replace(/<!--[\s\S]*?-->|<[^>"']*(?:"[^"]*"[^>"']*|'[^']*'[^>"']*)*>|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\r\n]+\$|[^<]+/g, part => {
    if (part.startsWith('<') || /^(?:\$|\\[([])/.test(part)) return part;
    // Delimited expressions can occur in the middle of a text node too.
    return part.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\r\n]+\$)/g).map(text => {
      if (/^(?:\$|\\[([])/.test(text)) return text;
      return text.replace(/(?:&(?:minus|times|divide|lt|gt|le|ge|infin);|[A-Za-z0-9\u0370-\u03ff\u0660-\u0669\u06f0-\u06f9\u00b2\u00b3\u2070-\u209f()[\]{},.\u060c+\-−–=<>≤≥≠×÷±∓≈∼∑√∫∈∉∪∩→←↔*/^∞% \t])+/g, run => {
        const expression = run.trim();
        const hasOperand = /[A-Za-z0-9\u0370-\u03ff\u0660-\u0669\u06f0-\u06f9∞]|&infin;/.test(expression);
        const hasOperator = /[+\-−–=<>≤≥≠×÷±∓≈∼∑√∫∈∉∪∩→←↔*/^]|&(?:minus|times|divide|lt|gt|le|ge);/.test(expression);
        const isInterval = /[([][^()[\]]*[,\u060c][^()[\]]*[)\]]/.test(expression);
        const isSymbol = /^(?:&(?:times|divide|lt|gt|le|ge|infin);|[=<>≤≥≠×÷±∓≈∼∑√∫∈∉∪∩→←↔∞])+$/.test(expression);
        if (!isSymbol && (!hasOperand || (!hasOperator && !isInterval))) return run;
        return run.replace(expression, `<span class="math-ltr" dir="ltr" style="direction:ltr;unicode-bidi:isolate;display:inline-block">${expression}</span>`);
      });
    }).join('');
  });
}

/** Wrap live text nodes without replacing the editor or moving its caret. */
export function isolateEditorMath(root: HTMLElement): void {
  const selection = root.ownerDocument.getSelection();
  const offsets = root.ownerDocument.activeElement === root && selection?.anchorNode && selection.focusNode && root.contains(selection.anchorNode) && root.contains(selection.focusNode)
    ? [selection.anchorNode, selection.focusNode].map((node, index) => {
      const range = root.ownerDocument.createRange();
      range.selectNodeContents(root);
      range.setEnd(node, index === 0 ? selection.anchorOffset : selection.focusOffset);
      return range.toString().length;
    }) : null;
  // Typing after a formula can put new Arabic prose inside its editable span.
  // Re-evaluate those runs so only the mathematical part keeps LTR direction.
  let changed = false;
  for (const span of root.querySelectorAll('.math-ltr')) {
    if (span.parentElement?.closest('.math-tex, .katex, math, [contenteditable="false"]')) continue;
    span.replaceWith(...Array.from(span.childNodes));
    changed = true;
  }
  if (changed) root.normalize();
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentElement?.closest('.math-tex, .math-ltr, .katex, math, code, pre, script, style, [contenteditable="false"]')) nodes.push(node);
  }
  for (const node of nodes) {
    const original = escapeMathHtml(node.data);
    const isolated = isolatePlainTextMath(original);
    if (isolated === original) continue;
    const template = root.ownerDocument.createElement('template');
    template.innerHTML = isolated;
    node.replaceWith(template.content);
    changed = true;
  }
  if (!changed || !offsets || !selection) return;
  const resolve = (offset: number): [Node, number] => {
    const texts = root.ownerDocument.createTreeWalker(root, 4);
    while (texts.nextNode()) {
      const node = texts.currentNode as Text;
      if (offset <= node.length) return [node, offset];
      offset -= node.length;
    }
    return [root, root.childNodes.length];
  };
  selection.setBaseAndExtent(...resolve(offsets[0]), ...resolve(offsets[1]));
}

/** Keep existing rendered trees out of delimiter processing, including data-latex. */
export function protectRenderedMath(html: string): { html: string; blocks: string[] } {
  const blocks: string[] = [];
  const start = /<(span|math)\b[^>]*>/gi;
  let output = '', end = 0, match: RegExpExecArray | null;
  while ((match = start.exec(html))) {
    if (match[1].toLowerCase() !== 'math' && !/\bdata-latex\s*=|\bclass=["'][^"']*\b(?:math-tex|math-ltr|katex)(?:[\s"'])/i.test(match[0])) continue;
    const tags = new RegExp(`<\\/?${match[1]}\\b[^>]*>`, 'gi');
    tags.lastIndex = start.lastIndex;
    let depth = 1, close: RegExpExecArray | null;
    while ((close = tags.exec(html))) {
      depth += /^<\//.test(close[0]) ? -1 : /\/>$/.test(close[0]) ? 0 : 1;
      if (!depth) break;
    }
    if (depth) continue;
    output += html.slice(end, match.index) + `\x00RENDERED${blocks.length}\x00`;
    blocks.push(html.slice(match.index, tags.lastIndex));
    end = tags.lastIndex;
    start.lastIndex = end;
  }
  return { html: output + html.slice(end), blocks };
}
