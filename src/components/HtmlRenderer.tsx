"use client";

import React from 'react';
import { getImageProps } from 'next/image';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { sanitizeHtml } from '../lib/sanitize';
import { resolveMediaUrl } from '../lib/utils';

interface HtmlRendererProps {
  html: string;
  className?: string;
  tag?: React.ElementType;
  imageLoading?: "lazy" | "eager";
}

const KNOWN_LATEX_COMMANDS = new Set([
  'frac', 'sqrt', 'left', 'right', 'cdot', 'times', 'div', 'pm', 'mp',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'sigma', 'omega', 'pi', 'phi', 'tau', 'mu',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh', 'coth', 'ln', 'log', 'exp', 'lim', 'limsup', 'liminf',
  'max', 'min', 'sup', 'inf', 'det', 'dim', 'ker', 'deg', 'gcd', 'hom', 'sum', 'prod', 'int', 'oint',
  'partial', 'infty', 'text', 'mathrm', 'mathbf', 'mathit', 'mathbb', 'mathcal',
  'displaystyle', 'textstyle', 'quad', 'qquad', 'space', 'newline', 'approx', 'sim', 'equiv', 'le', 'ge', 'neq'
]);

function sanitizeMathInner(math: string): string {
  if (!math || typeof math !== 'string') return '';

  // 1. Remove leaked or nested math delimiters from within math mode
  let clean = math
    .replace(/\\([()])/g, '')
    .replace(/\\\[|\\\]/g, '')
    .replace(/\$\$|\$/g, '');

  // 2. Format units attached to digits (e.g. 1399mg -> 1399\text{ mg})
  clean = clean.replace(/(\d+)\s*(mg|kg|cm|km|mm|ml|hrs?|sec|min)(?![a-zA-Z])/gi, '$1\\text{ $2}');

  // 3. Protect existing \text{...} blocks from re-wrapping
  const textBlocks: string[] = [];
  clean = clean.replace(/\\text\{[\s\S]*?\}/g, (m) => {
    textBlocks.push(m);
    return `\x00TXT${textBlocks.length - 1}\x00`;
  });

  // 4. Wrap plain English words (length >= 4 or 'approx') in \text{} unless they are known LaTeX commands
  clean = clean.replace(/\\?([a-zA-Z]{4,}|approx)(?![a-zA-Z])/g, (fullMatch, word) => {
    if (fullMatch.startsWith('\\')) {
      return fullMatch;
    }
    const lower = word.toLowerCase();
    if (KNOWN_LATEX_COMMANDS.has(lower)) {
      return '\\' + word;
    }
    return `\\text{ ${word} }`;
  });

  // Restore protected \text{...} blocks
  clean = clean.replace(/\x00TXT(\d+)\x00/g, (_, idx) => textBlocks[Number(idx)]);

  return clean;
}

/**
 * Returns true if the content is likely real math.
 * Checks for LaTeX commands (\frac, \sum) or math operators (^ _ { } = + * / < >).
 */
function isActualMath(inner: string): boolean {
  return /\\[a-zA-Z]+/.test(inner) || /[_^{}=+*/<>]/.test(inner) || /[0-9]+\s*[-+*/]\s*[0-9]+/.test(inner);
}

function renderKatex(inner: string, display: boolean): string {
  try {
    const sanitized = sanitizeMathInner(inner);
    const rendered = katex.renderToString(sanitized, { throwOnError: false, displayMode: display });
    if (rendered.includes('katex-error')) {
      const cleanFallback = inner.replace(/\\([()[\]{}])/g, '$1').replace(/\\[a-zA-Z]+/g, ' ').trim();
      return `<span dir="ltr" style="unicode-bidi:isolate;display:inline-block">${cleanFallback}</span>`;
    }
    // Wrap rendered KaTeX in a ltr span to prevent RTL context from reversing < > signs
    return `<span dir="ltr" style="unicode-bidi:isolate;display:inline-block">${rendered}</span>`;
  } catch {
    return inner;
  }
}

/**
 * Converts math delimiters in an HTML string to rendered KaTeX HTML.
 * Strips delimiters from plain text that isn't actually math, preventing KaTeX 
 * from incorrectly formatting regular sentences.
 */


export function processHtml(html: string, imageLoading: "lazy" | "eager" = "lazy"): string {
  if (!html || typeof html !== 'string') return html || '';

  let result = html;

  // 0-pre. Rescue images from Word <!--[if !vml]-->...<![endif]--> blocks
  // (handles already-saved questions that contain raw Word HTML in the database)
  result = result.replace(/<!--\[if !vml\]-->([\s\S]*?)<!--\[endif\]-->/gi, (_match: string, inner: string) => {
    const imgMatches = inner.match(/<img[^>]+>/gi);
    if (imgMatches) {
      return imgMatches
        .map((img: string) => img.replace(/\s+v:shapes="[^"]*"/gi, '').replace(/\s+o:title="[^"]*"/gi, ''))
        .join(' ');
    }
    return '';
  });

  // 0-pre.2 Remove any remaining MSO conditional comment wrappers
  result = result.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');
  result = result.replace(/<!--\[if[^\]]*\]-->/gi, '');
  result = result.replace(/<!--\[endif\]-->/gi, '');

  // (Removed brittle cleanWordHtml call - DOMPurify handles sanitization)

  // Protect HTML tags by replacing them with placeholders before applying math regexes.
  // This prevents regexes from matching content inside HTML tag attributes (e.g. data-start="273").
  const tags: string[] = [];
  result = result.replace(/<[^>]+>/g, (tag) => {
    const idx = tags.length;
    tags.push(tag);
    return `\x00TAG${idx}\x00`;
  });

  // Explicit math must stay intact while plain-text shorthand is converted.
  const math: string[] = [];
  result = result.replace(/\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\$)\$[^$\n\r]+?\$(?!\$)/g, expression => {
    math.push(expression);
    return `\x00MATH${math.length - 1}\x00`;
  });

  // 0.1 Auto-convert simple fractions typed from keyboard (e.g., 4/5) to KaTeX \(\frac{4}{5}\)
  result = result.replace(/(^|[^\d/])(\d+)\s*\/\s*(\d+)(?=[^\d/]|$)/g, '$1\\(\\frac{$2}{$3}\\)');

  // 0.2 Auto-convert standalone comparison operators (<, >, <=, >=, &lt;, &gt;) outside HTML tags into KaTeX math
  // This ensures KaTeX renders them inside an LTR span so browser RTL bidi mirroring never flips them.
  result = result.replace(/(^|\s|\x00TAG\d+\x00)([0-9a-zA-Z\u0600-\u06FF\s]*?)\s*(<=>|>=|&lt;|&gt;|<|>)\s*([0-9a-zA-Z\u0600-\u06FF\s]*?)(?=\s|\x00TAG|$)/g, (match, p1, p2, p3, p4) => {
    let sign = p3;
    if (sign === '&lt;') sign = '<';
    if (sign === '&gt;') sign = '>';
    if (p2.trim() || p4.trim()) {
      return `${p1}\\(${p2.trim()} ${sign} ${p4.trim()}\\)`;
    }
    return `${p1}\\(${sign}\\)`;
  });

  result = result.replace(/\x00MATH(\d+)\x00/g, (_, idx) => math[Number(idx)]);

  // Restore HTML tags from placeholders
  result = result.replace(/\x00TAG(\d+)\x00/g, (_, idx) => tags[parseInt(idx, 10)]);

  const processMatch = (inner: string, isDisplay: boolean) => {
    if (isActualMath(inner)) {
      return renderKatex(inner, isDisplay);
    }
    return inner;
  };

  // 1. $$...$$ → display math
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_: string, inner: string) => processMatch(inner, true));

  // 2. \[...\] → display math
  result = result.replace(/\\\[([\s\S]+?)\\\]/g, (_: string, inner: string) => processMatch(inner, true));

  // 3. \(...\) → inline math
  result = result.replace(/\\\(([\s\S]+?)\\\)/g, (_: string, inner: string) => processMatch(inner, false));

  // 4. $...$ → inline math
  result = result.replace(/(?<!\$)\$([^$\n\r]+?)\$(?!\$)/g, (_: string, inner: string) => processMatch(inner, false));

  // 5. Resolve image URLs & inject loading="lazy" into img tags
  result = result.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (_match, before, src, after) => {
    const resolvedSrc = resolveMediaUrl(src);
    let attributes = (before + ' ' + after).replace(/\s*(loading|decoding|srcset|sizes)=["'][^"']*["']/gi, '');
    let imageSrc = resolvedSrc;
    if (imageLoading === 'eager' && (resolvedSrc.startsWith('/uploads/') || resolvedSrc.startsWith('https://'))) {
      try {
        const props = getImageProps({src:resolvedSrc,alt:'',width:700,height:400,sizes:'(max-width: 768px) 100vw, 700px'}).props;
        imageSrc = props.src;
        attributes += ` srcset="${props.srcSet || ''}" sizes="${props.sizes || ''}"`;
      } catch { /* Keep unsupported imported image sources usable. */ }
    }
    return `<img ${attributes} src="${imageSrc}" loading="${imageLoading}" decoding="async" />`;
  });

  return result;
}

const htmlProcessCache = new Map<string, string>();
const MAX_HTML_CACHE_SIZE = 2000;

function getCachedProcessedHtml(rawHtml: string, imageLoading: "lazy" | "eager"): string {
  const cacheKey = imageLoading + rawHtml;
  if (!rawHtml || typeof rawHtml !== "string") return "";
  const cached = htmlProcessCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const clean = sanitizeHtml(rawHtml);
  const processed = processHtml(clean, imageLoading);

  if (htmlProcessCache.size >= MAX_HTML_CACHE_SIZE) {
    const firstKey = htmlProcessCache.keys().next().value;
    if (firstKey) htmlProcessCache.delete(firstKey);
  }
  htmlProcessCache.set(cacheKey, processed);
  return processed;
}

function HtmlRenderer({ html, className = "", tag: Tag = "div", imageLoading = "lazy" }: HtmlRendererProps) {
  const combinedClassName = className.includes("prose") ? className : `prose ${className}`.trim();
  
  const processedHtml = React.useMemo(() => {
    return getCachedProcessedHtml(html || "", imageLoading);
  }, [html, imageLoading]);

  const hasMath = processedHtml.includes('katex') || processedHtml.includes('\\(') || processedHtml.includes('\\[');

  return (
    <Tag
      className={combinedClassName}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      dir={hasMath ? undefined : "auto"}
    />
  );
}

export default React.memo(HtmlRenderer);
