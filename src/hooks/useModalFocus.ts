"use client";
import { RefObject, useEffect, useRef } from 'react';
export function useModalFocus(open: boolean, container: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open || !container.current) return;
    const root = container.current, previous = document.activeElement as HTMLElement | null;
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';
    const focusable = () => Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(element => element.getClientRects().length > 0);
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    (focusable()[0] || root).focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const nodes = focusable(), first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { event.preventDefault(); root.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = previousOverflow; if (previous?.isConnected) previous.focus(); };
  }, [open, container]);
}
