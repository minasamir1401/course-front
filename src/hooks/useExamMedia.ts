'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { getImageProps } from 'next/image';
import { resolveMediaUrl } from '@/lib/utils';
import { waitForDecodedImage } from '@/lib/imageReadiness';

/** Wait for full decode, rather than letting progressive image scans appear in the exam. */
export function useExamMedia(root: RefObject<HTMLDivElement | null>, key: string, enabled: boolean, nextQuestion: any) {
  const [status, setStatus] = useState({key:'',ready:false,failed:false});
  const [retryCount, setRetryCount] = useState(0);
  const retryRef = useRef(false);
  useEffect(() => {
    if (!enabled || !root.current) return;
    const container = root.current;
    let cancelled = false;
    const images = Array.from(container.querySelectorAll('img'));
    const controller = new AbortController();
    const waits = images.map(img => {
      img.loading = 'eager';
      if (retryRef.current && !img.hasAttribute('data-decoded')) img.src = img.currentSrc || img.src;
      return waitForDecodedImage(img, controller.signal).then(ok => { if (ok && !cancelled) img.setAttribute('data-decoded','true'); return ok; });
    });
    retryRef.current = false;
    setStatus({key,ready:false,failed:false});
    void Promise.all(waits).then(results => { if (!cancelled) setStatus({key,ready:results.every(Boolean),failed:results.some(ok => !ok)}); });
    return () => { cancelled = true; controller.abort(); };
  }, [root, key, enabled, retryCount]);
  useEffect(() => {
    if (!enabled || !nextQuestion) return;
    const urls = new Set<string>();
    for (const content of [nextQuestion.text,nextQuestion.textEn,...(Array.isArray(nextQuestion.options) ? nextQuestion.options : []),...(Array.isArray(nextQuestion.optionsEn) ? nextQuestion.optionsEn : [])]) {
      if (typeof content !== 'string') continue;
      const document = new DOMParser().parseFromString(content,'text/html');
      document.querySelectorAll('img[src]').forEach(img => { const src = img.getAttribute('src'); if (src) urls.add(resolveMediaUrl(src)); });
    }
    const pending: HTMLImageElement[] = [];
    for (const src of urls) {
      const img = new window.Image();
      try {
        if (src.startsWith('/uploads/') || src.startsWith('https://')) {
          const props = getImageProps({src,alt:'',width:700,height:400,sizes:'(max-width: 768px) 100vw, 700px'}).props;
          if (props.sizes) img.sizes = props.sizes; if (props.srcSet) img.srcset = props.srcSet; img.src = props.src;
        } else img.src = src;
        pending.push(img);
      } catch { img.src = src; pending.push(img); }
    }
    if (nextQuestion.imageUrl) {
      try {
      const props = getImageProps({src:resolveMediaUrl(nextQuestion.imageUrl),alt:'',width:700,height:400,sizes:'(max-width: 768px) 100vw, 700px',unoptimized:nextQuestion.imageUrl.startsWith('data:')}).props;
      const img = new window.Image(); if (props.sizes) img.sizes = props.sizes; if (props.srcSet) img.srcset = props.srcSet; img.src = props.src; pending.push(img);
      } catch { /* Unsupported imported media is still loaded by its question. */ }
    }
    // Retain pending images until the next question or unmount; browser cache serves navigation.
    return () => { pending.length = 0; };
  }, [enabled, nextQuestion]);
  return {ready:!enabled || (status.key === key && status.ready), failed:status.key === key && status.failed, retry:() => {retryRef.current = true; setRetryCount(count => count + 1);} };
}
