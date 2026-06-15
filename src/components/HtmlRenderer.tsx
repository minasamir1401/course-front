"use client";

import React, { useEffect, useRef } from 'react';
// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

interface HtmlRendererProps {
  html: string;
  className?: string;
  tag?: React.ElementType;
}

export default function HtmlRenderer({ html, className = "", tag: Tag = "div" }: HtmlRendererProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }, [html]);

  return (
    <Tag 
      ref={containerRef as any} 
      className={className} 
      dangerouslySetInnerHTML={{ __html: html }} 
      dir="auto" 
    />
  );
}
