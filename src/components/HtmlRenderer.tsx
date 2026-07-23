"use client";

import React, { useLayoutEffect, useEffect, useRef } from 'react';
// @ts-expect-error katex auto-render does not ship TypeScript declarations.
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

interface HtmlRendererProps {
  html: string;
  className?: string;
  tag?: React.ElementType;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function HtmlRenderer({ html, className = "", tag: Tag = "div" }: HtmlRendererProps) {
  const containerRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (containerRef.current) {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }, [html, className, Tag]);

  const combinedClassName = className.includes("prose") ? className : `prose ${className}`.trim();

  let processedHtml = html || "";
  if (typeof processedHtml === 'string') {
    const mathRegex = /(\$\$)([\s\S]+?)\1|(?<!\$)\$([^$]+)\$(?!\$)|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;
    
    processedHtml = processedHtml.replace(mathRegex, (match, d1, i1, i2, i3, i4) => {
      const inner = i1 || i2 || i3 || i4;
      if (!inner) return match;
      
      // Wrap English/Arabic words in \text{} to preserve normal font, skip LaTeX commands
      let newInner = inner.replace(/\\?[\p{L}\p{M}]+/gu, (word: string) => {
        if (word.startsWith('\\')) return word; // Skip LaTeX commands like \frac, \text
        // Wrap words (2+ letters), specific 1-letter words (a, A, I), or any Arabic letter in \text{}
        if (word.length >= 2 || /^[aAI]$/.test(word) || /[\u0600-\u06FF]/.test(word)) {
          return `\\text{${word}}`;
        }
        return word; // Keep single letters (x, y, z) as math italic
      });
      // Replace spaces with ~ to preserve them in KaTeX
      newInner = newInner.replace(/ /g, '~');
      
      if (i1) return `$$${newInner}$$`;
      if (i2) return `$${newInner}$`;
      if (i3) return `\\(${newInner}\\)`;
      if (i4) return `\\[${newInner}\\]`;
      return match;
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .katex { white-space: normal !important; word-break: break-word; }
        .katex-html { flex-wrap: wrap !important; }
        .katex-display { overflow-x: auto; overflow-y: hidden; }
        .katex .text { font-family: inherit !important; }
      `}} />
      <Tag 
        ref={containerRef as any} 
        className={combinedClassName} 
        dangerouslySetInnerHTML={{ __html: processedHtml }} 
        dir="auto" 
      />
    </>
  );
}

export default React.memo(HtmlRenderer);

