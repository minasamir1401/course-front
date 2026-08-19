"use client";

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { sanitizeHtml } from '../lib/sanitize';
import { resolveMediaUrl } from '../lib/utils';

interface HtmlRendererProps {
  html: string;
  className?: string;
  tag?: React.ElementType;
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
    // Wrap rendered KaTeX in a ltr span to prevent RTL context from reversing < > signs
    const rendered = katex.renderToString(inner, { throwOnError: false, displayMode: display });
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


function processHtml(html: string): string {
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
    const hasLazy = _match.includes('loading=');
    return `<img ${before}src="${resolvedSrc}" ${after} ${hasLazy ? '' : 'loading="lazy" decoding="async"'} />`;
  });

  return result;
}

function HtmlRenderer({ html, className = "", tag: Tag = "div" }: HtmlRendererProps) {
  const combinedClassName = className.includes("prose") ? className : `prose ${className}`.trim();
  
  // Memoize the expensive KaTeX processing so it only runs when the HTML string actually changes,
  // preventing massive lag when only the className changes (e.g. selecting an option).
  const processedHtml = React.useMemo(() => {
    const clean = sanitizeHtml(html || "");
    return processHtml(clean);
  }, [html]);

  // Check if the processed HTML contains KaTeX-rendered math (to avoid dir=auto reversing < > signs)
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
