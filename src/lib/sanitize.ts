import DOMPurify from "dompurify";

const HTML_ELEMENT_NAMES = new Set(`
  a abbr address area article aside audio b base bdi bdo blockquote body br button
  canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt
  em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html
  i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript
  object ol optgroup option output p picture pre progress q rp rt ruby s samp script search
  section select slot small source span strong style sub summary sup table tbody td template
  textarea tfoot th thead time title tr track u ul var video wbr
  math semantics annotation annotation-xml mrow mi mn mo mtext mspace ms mfrac msqrt mroot
  mstyle merror mpadded mphantom mfenced menclose msub msup msubsup munder mover munderover
  mmultiscripts mprescripts mtable mtr mtd
  svg g path circle ellipse line polyline polygon rect text tspan defs use symbol clippath
  mask pattern lineargradient radialgradient stop filter foreignobject
  font mark center strike
`.trim().split(/\s+/));

/** Escape text comparisons before an HTML parser can mistake x<y for a tag.
 * Explicit LaTeX is text, including any HTML-looking characters inside it.
 */
export function escapeMathComparisons(input: string): string {
  return input.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|(?<!\$)\$[^$\r\n]+?\$(?!\$)|<!--[\s\S]*?-->|<\/?[a-z][\w:-]*(?=\s|\/?>)(?:[^<>"']|"[^"]*"|'[^']*')*>|[<>]/gi, part => {
    if (/^(?:\\[([]|\$)/.test(part)) return part.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (part.startsWith('<!--')) return part;
    // Operands such as <y> or <bound ... > must not become unknown elements.
    const tagName = part.match(/^<\/?([a-z][\w:-]*)/i)?.[1].toLowerCase();
    if (tagName && !HTML_ELEMENT_NAMES.has(tagName) && !tagName.includes('-')) {
      return part.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    return part === '<' ? '&lt;' : part === '>' ? '&gt;' : part;
  });
}


export const decodeHtmlEntities = (input: string): string => {
  if (!input || typeof input !== 'string') return input || '';
  // Entities inside real HTML are escaped text/attributes (including data-latex).
  // Only decode legacy content whose entire markup was stored entity-encoded.
  if (/<\/?[a-z][^>]*>/i.test(input)) return input;
  if (input.includes('&lt;') || input.includes('&gt;')) {
    return input
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, '&');
  }
  return input;
};

export const sanitizeHtml = (input: string): string => {
  if (!input) return "";

  const decoded = escapeMathComparisons(decodeHtmlEntities(String(input)));

  // Bounded safe fallback for Next.js Server-Side Rendering (SSR)
  if (typeof window === "undefined") {
    let sanitized = decoded;
    sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    sanitized = sanitized.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
    sanitized = sanitized.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/data:text\/html/gi, "");
    return sanitized;
  }

  return DOMPurify.sanitize(decoded, {
    ADD_TAGS: ["font", "mark"],
    ADD_ATTR: ["color", "size", "face", "style"],
    ALLOW_DATA_ATTR: true
  });
};
