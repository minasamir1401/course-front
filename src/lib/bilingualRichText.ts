/** Share presentation between translated documents without copying their text/media. */
export function syncRichTextFormatting(before: string, after: string, target: string): string {
  if (!before || !target || before === after || typeof document === 'undefined') return target;

  const DANGEROUS_SYNC_CSS_VALUE_RE = /(?:url|expression|image-set)\s*\(|javascript:|@import/i;
  const FORBIDDEN_SYNC_CSS_PROPS = new Set(['position', 'z-index', 'top', 'left', 'right', 'bottom', 'behavior', '-moz-binding', 'direction', 'unicode-bidi']);
  const FORBIDDEN_SYNC_ATTR_NAMES = new Set(['srcdoc', 'formaction', 'action', 'href', 'xlink:href']);
  const isSafeSyncCss = (prop: string, value: string): boolean => {
    const normProp = prop.trim().toLowerCase();
    if (!normProp || FORBIDDEN_SYNC_CSS_PROPS.has(normProp)) return false;
    return !DANGEROUS_SYNC_CSS_VALUE_RE.test(value);
  };

  const parse = (html: string) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
  };
  const serialize = (fragment: DocumentFragment) => {
    const div = document.createElement('div');
    div.append(fragment);
    return div.innerHTML;
  };

  const atomSelector = '.math-tex, .katex, math, [contenteditable="false"], img, video, audio, iframe';
  const atoms = (root: ParentNode) => Array.from(root.querySelectorAll(atomSelector))
    .filter(node => !node.parentElement?.closest(atomSelector));
  const textNodes = (root: ParentNode) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.data.trim() && !node.parentElement?.closest(`${atomSelector}, script, style`)) nodes.push(node);
    }
    return nodes;
  };
  const plainText = (root: ParentNode) =>
    textNodes(root).map(node => node.data.replace(/\u00a0/g, ' ')).join(' ').replace(/\s+/g, ' ').trim();

  const atomIdentity = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'img' || tag === 'video' || tag === 'audio' || tag === 'iframe') {
      return `${tag}:${el.getAttribute('src') || ''}`;
    }
    if (tag === 'math' || el.classList.contains('math-tex') || el.classList.contains('katex')) {
      return `math:${el.getAttribute('data-latex') || el.textContent?.trim() || ''}`;
    }
    return `${tag}:${el.textContent?.trim() || ''}`;
  };

  const syncAtomAttributes = (srcList: Element[], nxtList: Element[], tgtList: Element[]) => {
    const count = Math.min(srcList.length, nxtList.length, tgtList.length);
    const attrs = ['data-align', 'data-size', 'data-display', 'width', 'height'];
    for (let i = 0; i < count; i++) {
      const srcEl = srcList[i];
      const nxtEl = nxtList[i];
      const tgtEl = tgtList[i];
      if (atomIdentity(srcEl) !== atomIdentity(nxtEl)) continue;
      for (const attr of attrs) {
        const prevVal = srcEl.getAttribute(attr);
        const nextVal = nxtEl.getAttribute(attr);
        if (prevVal !== nextVal) {
          if (nextVal === null) tgtEl.removeAttribute(attr);
          else tgtEl.setAttribute(attr, nextVal);
        }
      }
      if (srcEl.getAttribute('style') !== nxtEl.getAttribute('style') && nxtEl instanceof HTMLElement && srcEl instanceof HTMLElement && tgtEl instanceof HTMLElement) {
        const propNames = new Set<string>([
          ...Array.from(srcEl.style),
          ...Array.from(nxtEl.style),
        ]);
        for (const prop of propNames) {
          const oldVal = srcEl.style.getPropertyValue(prop);
          const newVal = nxtEl.style.getPropertyValue(prop);
          if (oldVal !== newVal) {
            if (!newVal || !isSafeSyncCss(prop, newVal)) tgtEl.style.removeProperty(prop);
            else tgtEl.style.setProperty(prop, newVal);
          }
        }
      }
    }
  };

  const original = parse(before), formatted = parse(after), translated = parse(target);
  const sourceAtoms = atoms(original), nextAtoms = atoms(formatted), targetAtoms = atoms(translated);

  // Never overwrite a wording edit onto translated text.
  if (plainText(original) !== plainText(formatted)) return target;

  if (sourceAtoms.length !== nextAtoms.length || sourceAtoms.some((node, i) => atomIdentity(node) !== atomIdentity(nextAtoms[i]))) {
    return target;
  }

  const sourceText = textNodes(original), nextText = textNodes(formatted), targetText = textNodes(translated);

  // Image/math-only slides with no prose: sync atom presentation attributes directly.
  if (!sourceText.length && !nextText.length) {
    if (!sourceAtoms.length) return target;
    syncAtomAttributes(sourceAtoms, nextAtoms, targetAtoms);
    return serialize(translated);
  }

  // Case A: exact text node correspondence (fast path).
  if (sourceText.length > 0 && sourceText.length === nextText.length && sourceText.length === targetText.length
    && !sourceText.some((node, i) => node.data.replace(/\u00a0/g, ' ') !== nextText[i].data.replace(/\u00a0/g, ' '))) {
    const syncedAtoms = targetAtoms.map(node => node.cloneNode(true) as Element);
    syncAtomAttributes(sourceAtoms, nextAtoms, syncedAtoms);
    nextText.forEach((node, i) => { node.data = targetText[i].data; });
    nextAtoms.forEach(node => node.remove());
    let tail: Node = nextText[nextText.length - 1];
    syncedAtoms.forEach(copy => {
      const targetIndex = syncedAtoms.indexOf(copy);
      const refNode = targetAtoms[targetIndex];
      const following = targetText.findIndex(text => Boolean(refNode.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING));
      if (following >= 0) nextText[following].before(copy);
      else { tail.parentNode!.insertBefore(copy, tail.nextSibling); tail = copy; }
    });
    formatted.querySelectorAll('[dir]').forEach(node => {
      if (!node.closest(atomSelector)) node.setAttribute('dir', 'auto');
    });
    formatted.querySelectorAll('*').forEach(node => {
      if (node.closest(atomSelector)) return;
      for (const attr of Array.from(node.attributes)) {
        const lowerName = attr.name.toLowerCase();
        if (lowerName.startsWith('on') || FORBIDDEN_SYNC_ATTR_NAMES.has(lowerName)) {
          node.removeAttribute(attr.name);
        }
      }
      if (node instanceof HTMLElement && node.hasAttribute('style')) {
        const rawStyle = node.getAttribute('style') || '';
        let removed = DANGEROUS_SYNC_CSS_VALUE_RE.test(rawStyle);
        for (const prop of Array.from(node.style)) {
          const val = node.style.getPropertyValue(prop);
          if (!isSafeSyncCss(prop, val)) {
            node.style.removeProperty(prop);
            removed = true;
          }
        }
        if (removed) {
          const normalizedStyle = node.style.cssText.trim();
          if (normalizedStyle && !DANGEROUS_SYNC_CSS_VALUE_RE.test(normalizedStyle)) {
            node.setAttribute('style', normalizedStyle);
          } else {
            node.removeAttribute('style');
          }
        }
      }
    });
    return serialize(formatted);
  }

  // Case B: block-level & partial inline formatting sync when text node splits differ.
  const blockTagNames = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'TD', 'TH']);
  const inlineFormatTags = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'MARK', 'FONT', 'SPAN']);

  const collectBlocks = (root: DocumentFragment): { el: Element | DocumentFragment; isFragment: boolean }[] => {
    const all = Array.from(root.querySelectorAll('*')).filter(el =>
      blockTagNames.has(el.tagName)
      && !el.closest(atomSelector)
      && !Array.from(el.children).some(ch => blockTagNames.has(ch.tagName) && !ch.matches(atomSelector))
    );
    if (all.length > 0) return all.map(el => ({ el, isFragment: false }));
    return [{ el: root, isFragment: true }];
  };

  type FormatDesc = {
    key: string;
    tag: string;
    attrs: [string, string][];
    styles: [string, string][];
  };

  const inlineAncestorsOf = (textNode: Text, boundary: Node): FormatDesc[] => {
    const descs: FormatDesc[] = [];
    let cur: Node | null = textNode.parentNode;
    while (cur && cur !== boundary && cur instanceof Element) {
      const tag = cur.tagName.toUpperCase();
      if (inlineFormatTags.has(tag)) {
        const canonicalTag = tag === 'STRONG' ? 'B' : tag === 'EM' ? 'I' : tag;
        const attrs: [string, string][] = [];
        for (const a of ['color', 'size', 'face']) {
          const val = cur.getAttribute(a);
          if (val) attrs.push([a, val]);
        }
        const styles: [string, string][] = [];
        if (cur instanceof HTMLElement && cur.getAttribute('style')) {
          for (const prop of Array.from(cur.style)) {
            const val = cur.style.getPropertyValue(prop);
            if (val && isSafeSyncCss(prop, val)) styles.push([prop, val]);
          }
          styles.sort((a, b) => a[0].localeCompare(b[0]));
        }
        if (canonicalTag !== 'SPAN' || attrs.length > 0 || styles.length > 0) {
          const key = `${canonicalTag}|${attrs.map(a => a.join('=')).join(';')}|${styles.map(s => s.join(':')).join(';')}`;
          descs.push({ key, tag: cur.tagName.toLowerCase(), attrs, styles });
        }
      }
      cur = cur.parentNode;
    }
    return descs;
  };

  const extractCharFormats = (boundary: Node) => {
    const walker = document.createTreeWalker(boundary, NodeFilter.SHOW_TEXT);
    let len = 0;
    const perChar: Map<string, FormatDesc>[] = [];
    const registry = new Map<string, FormatDesc>();
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.parentElement?.closest(`${atomSelector}, script, style`)) continue;
      const descs = inlineAncestorsOf(node, boundary);
      const map = new Map<string, FormatDesc>();
      for (const d of descs) {
        map.set(d.key, d);
        if (!registry.has(d.key)) registry.set(d.key, d);
      }
      for (let i = 0; i < node.data.length; i++) {
        perChar.push(map);
        len++;
      }
    }
    return { len, perChar, registry };
  };

  const snapWordRange = (text: string, rawStart: number, rawEnd: number): [number, number] => {
    if (rawStart === 0 && rawEnd === text.length) return [0, text.length];
    let s = Math.max(0, Math.min(text.length, rawStart));
    let e = Math.max(s, Math.min(text.length, rawEnd));
    while (s > 0 && !/\s/.test(text[s - 1])) s--;
    while (e < text.length && !/\s/.test(text[e])) e++;
    if (e <= s) return [0, text.length];
    return [s, e];
  };

  const resolveCharRange = (boundary: Node, startOffset: number, endOffset: number): Range | null => {
    const walker = document.createTreeWalker(boundary, NodeFilter.SHOW_TEXT);
    let pos = 0;
    let startNode: Text | null = null, startPos = 0, endNode: Text | null = null, endPos = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.parentElement?.closest(`${atomSelector}, script, style`)) continue;
      const nLen = node.data.length;
      if (!startNode && pos + nLen > startOffset) {
        startNode = node;
        startPos = Math.max(0, startOffset - pos);
      }
      if (startNode && pos + nLen >= endOffset) {
        endNode = node;
        endPos = Math.max(0, endOffset - pos);
        break;
      }
      pos += nLen;
    }
    if (!startNode || !endNode) return null;
    const range = document.createRange();
    range.setStart(startNode, startPos);
    range.setEnd(endNode, endPos);
    return range;
  };

  const applyFormatToBlock = (boundary: Node, startOffset: number, endOffset: number, desc: FormatDesc) => {
    const range = resolveCharRange(boundary, startOffset, endOffset);
    if (!range || range.collapsed) return;
    const wrapper = document.createElement(desc.tag);
    for (const [k, v] of desc.attrs) wrapper.setAttribute(k, v);
    if (desc.styles.length > 0 && wrapper instanceof HTMLElement) {
      for (const [k, v] of desc.styles) wrapper.style.setProperty(k, v);
    }
    const extracted = range.extractContents();
    wrapper.appendChild(extracted);
    range.insertNode(wrapper);
  };

  const removeFormatFromBlock = (boundary: Element | DocumentFragment, desc: FormatDesc) => {
    const matchesTag = (el: Element) => {
      const cTag = el.tagName.toUpperCase() === 'STRONG' ? 'B' : el.tagName.toUpperCase() === 'EM' ? 'I' : el.tagName.toUpperCase();
      const targetCTag = desc.tag.toUpperCase() === 'STRONG' ? 'B' : desc.tag.toUpperCase() === 'EM' ? 'I' : desc.tag.toUpperCase();
      if (cTag !== targetCTag) return false;
      for (const [k, v] of desc.attrs) {
        if (el.getAttribute(k) !== v) return false;
      }
      if (desc.styles.length > 0 && el instanceof HTMLElement) {
        for (const [k, v] of desc.styles) {
          if (el.style.getPropertyValue(k) !== v) return false;
        }
      }
      return true;
    };
    const candidates = Array.from(boundary.querySelectorAll('*')).filter(matchesTag);
    for (const el of candidates) {
      if (el.closest(atomSelector)) continue;
      el.replaceWith(...Array.from(el.childNodes));
    }
  };

  const origBlocks = collectBlocks(original);
  const nextBlocks = collectBlocks(formatted);
  const targetBlocks = collectBlocks(translated);

  if (origBlocks.length === nextBlocks.length && origBlocks.length === targetBlocks.length) {
    for (let b = 0; b < origBlocks.length; b++) {
      let oEl = origBlocks[b].el;
      let nEl = nextBlocks[b].el;
      let tEl = targetBlocks[b].el;

      if (!origBlocks[b].isFragment && !nextBlocks[b].isFragment && !targetBlocks[b].isFragment
        && oEl instanceof HTMLElement && nEl instanceof HTMLElement && tEl instanceof HTMLElement) {
        let tHtmlEl: HTMLElement = tEl;
        // 1. Block tag switch (e.g. p -> h2)
        if (oEl.tagName !== nEl.tagName && !tHtmlEl.closest(atomSelector)) {
          const replacement = document.createElement(nEl.tagName.toLowerCase());
          for (const attr of Array.from(tHtmlEl.attributes)) {
            const lowerName = attr.name.toLowerCase();
            if (lowerName.startsWith('on') || FORBIDDEN_SYNC_ATTR_NAMES.has(lowerName)) continue;
            if (lowerName === 'style') {
              for (const prop of Array.from(tHtmlEl.style)) {
                const val = tHtmlEl.style.getPropertyValue(prop);
                if (val && isSafeSyncCss(prop, val)) replacement.style.setProperty(prop, val);
              }
              continue;
            }
            replacement.setAttribute(attr.name, attr.value);
          }
          replacement.append(...Array.from(tHtmlEl.childNodes));
          tHtmlEl.replaceWith(replacement);
          tEl = replacement;
          tHtmlEl = replacement;
        }
        // 2. Block style diff
        const styleProps = new Set<string>([...Array.from(oEl.style), ...Array.from(nEl.style)]);
        for (const prop of styleProps) {
          if (prop === 'direction' || prop === 'unicode-bidi') continue;
          const oldVal = oEl.style.getPropertyValue(prop);
          const newVal = nEl.style.getPropertyValue(prop);
          if (oldVal !== newVal) {
            if (!newVal || !isSafeSyncCss(prop, newVal)) tHtmlEl.style.removeProperty(prop);
            else tHtmlEl.style.setProperty(prop, newVal);
          }
        }
      }

      // 3. Inline formatting additions/removals inside the block
      const origFmt = extractCharFormats(oEl);
      const nextFmt = extractCharFormats(nEl);
      if (origFmt.len === nextFmt.len && nextFmt.len > 0) {
        const targetPlain = extractCharFormats(tEl);
        const tWalk = document.createTreeWalker(tEl, NodeFilter.SHOW_TEXT);
        let tPlainStr = '';
        while (tWalk.nextNode()) {
          const tn = tWalk.currentNode as Text;
          if (!tn.parentElement?.closest(`${atomSelector}, script, style`)) tPlainStr += tn.data;
        }
        if (targetPlain.len > 0 && tPlainStr.length === targetPlain.len) {
          const allKeys = new Set<string>([...origFmt.registry.keys(), ...nextFmt.registry.keys()]);
          for (const key of allKeys) {
            const addedSpans: [number, number][] = [];
            let curStart = -1;
            let removedCount = 0;
            for (let i = 0; i < nextFmt.len; i++) {
              const had = origFmt.perChar[i]?.has(key) ?? false;
              const has = nextFmt.perChar[i]?.has(key) ?? false;
              if (!had && has) {
                if (curStart < 0) curStart = i;
              } else {
                if (curStart >= 0) {
                  addedSpans.push([curStart, i]);
                  curStart = -1;
                }
                if (had && !has) removedCount++;
              }
            }
            if (curStart >= 0) addedSpans.push([curStart, nextFmt.len]);

            if (removedCount > 0 && addedSpans.length === 0) {
              const desc = origFmt.registry.get(key);
              if (desc) removeFormatFromBlock(tEl, desc);
            }
            const desc = nextFmt.registry.get(key);
            if (desc && addedSpans.length > 0) {
              for (const [s, e] of addedSpans) {
                const rawStart = Math.round((s / nextFmt.len) * targetPlain.len);
                const rawEnd = Math.round((e / nextFmt.len) * targetPlain.len);
                const [snapS, snapE] = snapWordRange(tPlainStr, rawStart, rawEnd);
                applyFormatToBlock(tEl, snapS, snapE, desc);
              }
            }
          }
        }
      }
    }
  }

  syncAtomAttributes(sourceAtoms, nextAtoms, atoms(translated));
  return serialize(translated);
}

export function updateBilingualRichText<T extends Record<string, any>>(
  question: T, field: string, value: string, language: 'ar' | 'en',
): T {
  const sourceKey = field + (language === 'en' ? 'En' : '');
  const targetKey = field + (language === 'en' ? '' : 'En');
  const legacyEnglish = language === 'en' && (field === 'text' || field === 'content' || field === 'questionText') && !/[\u0600-\u06ff]/.test(question[field] || '');
  const before = String(question[sourceKey] ?? (legacyEnglish ? question[field] : '') ?? '');
  const next: Record<string, any> = {
    ...question,
    [sourceKey]: value,
    [targetKey]: syncRichTextFormatting(before, value, String(question[targetKey] || '')),
  };
  if (field === 'content') {
    next[language === 'en' ? 'textEn' : 'text'] = value;
  } else if (field === 'text' && 'content' in question) {
    next[language === 'en' ? 'contentEn' : 'content'] = value;
  }
  // Older English-only items use base field when no Arabic translation exists yet.
  if (legacyEnglish && (!question[field] || question[field] === before)) next[field] = value;
  return next as T;
}
