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
    processedHtml = processedHtml.replace(/(?<!\$)\$([^$]+)\$(?!\$)/g, (match, inner) => {
      return '$' + inner.replace(/ /g, '\\text{ }') + '$';
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .katex { white-space: normal !important; word-break: break-word; }
        .katex-html { flex-wrap: wrap !important; }
        .katex-display { overflow-x: auto; overflow-y: hidden; }
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

