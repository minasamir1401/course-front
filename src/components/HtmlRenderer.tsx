"use client";

import React from 'react';
import { getImageProps } from 'next/image';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { escapeMathComparisons, sanitizeHtml } from '../lib/sanitize';
import { resolveMediaUrl } from '../lib/utils';

import { escapeMathHtml, isolateRichTextMath, protectRenderedMath } from "../lib/richTextMath";

interface HtmlRendererProps {
  html: string;
  className?: string;
  tag?: React.ElementType;
  imageLoading?: "lazy" | "eager";
}

function renderKatex(inner: string, display: boolean): string {
  // Decode text entities once. Never rewrite commands, environment names or
  // alignment markers: MathLive emits canonical LaTeX, including matrix rows.
  const formula = inner.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&amp;/gi, '&');
  try {
    let rendered: string;
    try {
      rendered = katex.renderToString(formula, { throwOnError: true, displayMode: display });
    } catch (error) {
      // Support older saved formulas containing accidental nested delimiters.
      const repaired = formula.replace(/\\[()[\]]/g, '').replace(/\$\$/g, '');
      if (repaired === formula) throw error;
      rendered = katex.renderToString(repaired, { throwOnError: true, displayMode: display });
    }
    return `<span dir="ltr" style="unicode-bidi:isolate;display:inline-block">${rendered}</span>`;
  } catch {
    // Preserve the complete source when a formula is invalid or unsupported.
    return `<span dir="ltr" style="unicode-bidi:isolate;display:inline-block">${escapeMathHtml(formula)}</span>`;
  }
}

/**
 * Converts math delimiters in an HTML string to rendered KaTeX HTML.
 * Explicit delimiters always represent math, including a single variable.
 */


export function processHtml(html: string, imageLoading: "lazy" | "eager" = "lazy"): string {
  if (!html || typeof html !== 'string') return html || '';

  const protectedMath = protectRenderedMath(isolateRichTextMath(escapeMathComparisons(html), false));
  let result = protectedMath.html;

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

  // Plain comparisons are isolated as complete LTR text at the end. Parsing
  // individual signs here splits chained inequalities and loses negative bounds.

  result = result.replace(/\x00MATH(\d+)\x00/g, (_, idx) => math[Number(idx)]);

  // Restore HTML tags from placeholders
  result = result.replace(/\x00TAG(\d+)\x00/g, (_, idx) => tags[parseInt(idx, 10)]);

  const processMatch = (inner: string, isDisplay: boolean) => renderKatex(inner, isDisplay);

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
    if (resolvedSrc.startsWith('/uploads/') || resolvedSrc.startsWith('https://')) {
      try {
        const props = getImageProps({src:resolvedSrc,alt:'',width:700,height:400,sizes:'(max-width: 768px) 100vw, 700px'}).props;
        imageSrc = props.src;
        attributes += ` srcset="${props.srcSet || ''}" sizes="${props.sizes || ''}"`;
      } catch { /* Keep unsupported imported image sources usable. */ }
    }
    return `<img ${attributes} src="${imageSrc}" loading="${imageLoading}" decoding="async" />`;
  });

  return isolateRichTextMath(result.replace(/\x00RENDERED(\d+)\x00/g, (_, i) => {
    const block = protectedMath.blocks[Number(i)];
    // Older editor fallbacks retain canonical LaTeX even when KaTeX was unavailable.
    const formula = block.match(/\bdata-latex=(["'])(.*?)\1/i);
    if (!formula || /class=["'][^"']*\bkatex(?:[\s"'])/i.test(block)) return block;
    const latex = formula[2].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return block.replace(/^(<span\b[^>]*>)[\s\S]*<\/span>$/i, (_block, opening) => `${opening}${renderKatex(latex, /data-display=["']true["']/i.test(block))}</span>`);
  }));
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

  return (
    <Tag
      className={combinedClassName}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      dir="auto"
    />
  );
}

export default React.memo(HtmlRenderer);
