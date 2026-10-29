import { Marked } from 'marked';
import { escapeMathHtml } from './richTextMath';

export function safeAiHref(value: string): string | null {
  const href = value.trim().replace(/^#(?=\/)/, '');
  // Assistant replies may link to platform pages, never executable or remote URLs.
  if (!/^\/(?:lessons|courses|dashboard|reports|exams|notifications|assistant|login|calendar|profile|certificates)(?:[/?#]|$)/.test(href) || /[\\\u0000-\u0020]/u.test(href)) return null;
  try {
    const url = new URL(href, 'https://klevro.invalid');
    return url.origin === 'https://klevro.invalid' && /^\/(?:lessons|courses|dashboard|reports|exams|notifications|assistant|login|calendar|profile|certificates)(?:\/|$)/.test(url.pathname) ? `${url.pathname}${url.search}${url.hash}` : null;
  }
  catch { return null; }
}

export function normalizeAiMarkdown(content: string): string {
  return content.replace(/&#(?:x20|32);/gi, ' ').replace(/\]\s*\\\((#?\/lessons\/[^\s)]+)\)/g, ']($1)')
    .split('\n').map(line => {
      // Repair old replies whose entire GFM table was flattened into a paragraph.
      if (!/\|\s*:?-{3,}:?\s*\|/.test(line) || !/\|\s+\|/.test(line)) return line;
      const first = line.indexOf('|'), last = line.lastIndexOf('|');
      return `${line.slice(0, first).trim()}\n\n${line.slice(first, last + 1).replace(/\|[ \t]+\|/g, '|\n|')}\n\n${line.slice(last + 1).trim()}`;
    }).join('\n');
}

export function aiMarkdownHtml(content: string, ar = true): string {
  const pageLabel = (href: string) => {
    const page = href.split(/[/?#]/)[1];
    const labels: Record<string, [string, string]> = { login: ['تسجيل الدخول', 'Log in'], dashboard: ['لوحة التحكم', 'Dashboard'],
      courses: ['مقرراتي', 'Courses'], lessons: ['افتح الدرس', 'Open lesson'], reports: ['تقارير الأداء', 'Reports'],
      exams: ['الامتحانات', 'Exams'], notifications: ['الإشعارات', 'Notifications'], calendar: ['التقويم', 'Calendar'],
      assistant: ['مساعد Klevro', 'Klevro assistant'], profile: ['ملفي الشخصي', 'My profile'], certificates: ['شهاداتي', 'My certificates'] };
    return labels[page]?.[ar ? 0 : 1] || (ar ? 'افتح الصفحة' : 'Open page');
  };
  const actionLink = (href: string, label: string) => `<a class="ai-action-link" href="${escapeMathHtml(href)}"><span class="ai-action-label">${label}</span><span class="ai-action-arrow" aria-hidden="true">${ar ? '←' : '→'}</span></a>`;
  const math: string[] = [];
  const source = normalizeAiMarkdown(content).replace(/\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\$)\$[^$\n]+?\$(?!\$)/g, formula => {
    math.push(formula); return `\uE000KLEVROMATH${math.length - 1}\uE001`;
  });
  const markdown = new Marked({ gfm: true, breaks: true, async: false, renderer: {
    html({ text }) { return escapeMathHtml(text); },
    image({ text }) { return escapeMathHtml(text || ''); },
    codespan({ text }) {
      // Models sometimes wrap a whole navigation link in inline code. Repair
      // only a complete approved link/path; real code and unsafe URLs stay code.
      const link = text.match(/^\[([^\]\n]+)\]\((#?\/[^\s)]+)\)$/);
      const safe = safeAiHref(link?.[2] || text);
      if (!safe) return false;
      const label = link?.[1];
      return actionLink(safe, escapeMathHtml(label && !/^(?:#?\/|https?:\/\/)/.test(label) ? label : pageLabel(safe)));
    },
    link({ href, tokens, text }) {
      const safe = safeAiHref(href);
      if (!safe) return this.parser.parseInline(tokens);
      const label = /^(?:#?\/|https?:\/\/)/.test(text) ? escapeMathHtml(pageLabel(safe)) : this.parser.parseInline(tokens);
      return actionLink(safe, label);
    },
  } });
  // Table wrapping is applied after rendering so the default renderer stays intact.
  const html = (markdown.parse(source, { async: false }) as string)
    .replace(/<table>/g, '<div class="ai-table-scroll"><table>').replace(/<\/table>/g, '</table></div>')
    .replace(/\uE000KLEVROMATH(\d+)\uE001/g, (_, index) => escapeMathHtml(math[Number(index)] || ''));
  // Keep HtmlRenderer's legacy whole-document entity decoder from reactivating
  // a reply consisting solely of escaped HTML. The wrapper is trusted markup.
  return `<div>${html}</div>`;
}
