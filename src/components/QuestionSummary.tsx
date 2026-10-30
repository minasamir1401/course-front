'use client';
import HtmlRenderer from './HtmlRenderer';

/** Clamp rendered content; slicing HTML can cut a math tag in half. */
export default function QuestionSummary({ html, className = '' }: { html: string; className?: string }) {
  return <HtmlRenderer html={html} className={`text-sm font-bold min-w-0 max-w-full line-clamp-2 overflow-hidden [&_img]:hidden [&_iframe]:hidden [&_p]:my-0 [&_h1]:text-sm [&_h2]:text-sm ${className}`}/>;
}
