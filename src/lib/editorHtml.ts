import DOMPurify from 'dompurify';
import { decodeHtmlEntities, escapeMathComparisons } from './sanitize';

/** A pasted document is content, never another page or an interactive form. */
export function sanitizeEditorHtml(html: string): string {
  const safe = DOMPurify.sanitize(escapeMathComparisons(decodeHtmlEntities(html)), {
    ADD_TAGS: ['font', 'mark'], ADD_ATTR: ['color', 'size', 'face', 'style'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'textarea', 'select', 'option', 'object', 'embed', 'meta', 'link', 'base', 'title', 'noscript', 'foreignObject'],
    FORBID_ATTR: ['id', 'name', 'autofocus', 'tabindex', 'contenteditable', 'form', 'action', 'formaction', 'srcdoc'],
  });
  const template = document.createElement('template'); template.innerHTML = safe;
  for (const element of template.content.querySelectorAll('[class]')) {
    if (element.closest('.katex')) continue;
    if (element.classList.contains('math-tex')) element.setAttribute('class', 'math-tex inline-block align-middle');
    else if (element.classList.contains('math-ltr')) element.setAttribute('class', 'math-ltr');
    else element.removeAttribute('class');
  }
  for (const element of template.content.querySelectorAll('*')) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.startsWith('data-') && !['data-latex', 'data-size', 'data-display', 'data-align'].includes(attribute.name)) element.removeAttribute(attribute.name);
    }
  }
  for (const link of template.content.querySelectorAll('a')) {
    const span = document.createElement('span');
    for (const attr of ['style', 'dir']) if (link.hasAttribute(attr)) span.setAttribute(attr, link.getAttribute(attr)!);
    span.append(...Array.from(link.childNodes)); link.replaceWith(span);
  }
  const allowed = /^(?:color|background(?:-color)?|font-(?:size|family|weight|style)|text-(?:decoration|align|indent)|list-style-type|direction|unicode-bidi|vertical-align|line-height|(?:max-|min-)?(?:width|height)|border(?:-(?:color|width|style|collapse|radius|(?:top|bottom)-(?:left|right)-radius))?|(?:padding|margin)(?:-(?:top|bottom|left|right))?)$/;
  for (const element of template.content.querySelectorAll<HTMLElement>('[style]')) {
    for (const property of Array.from(element.style)) {
      const value = element.style.getPropertyValue(property);
      const mathLayout = !!element.closest('.katex, math') && ['position', 'top', 'left', 'right', 'bottom', 'display'].includes(property);
      const safeImageDisplay = element.tagName === 'IMG' && property === 'display' && /^(?:block|inline-block)$/i.test(value.trim());
      if (/(?:url|expression|image-set)\s*\(|javascript:|@import/i.test(value)) {
        element.style.removeProperty(property);
        continue;
      }
      if (!allowed.test(property) && !mathLayout && !safeImageDisplay) element.style.removeProperty(property);
    }
    const normalizedStyle = element.style.cssText.trim();
    if (normalizedStyle && !/(?:url|expression|image-set)\s*\(|javascript:|@import/i.test(normalizedStyle)) {
      element.setAttribute('style', normalizedStyle);
    } else {
      element.removeAttribute('style');
    }
  }
  for (const math of template.content.querySelectorAll('.math-tex[data-latex], .katex, math')) math.setAttribute('contenteditable', 'false');
  return template.innerHTML;
}
