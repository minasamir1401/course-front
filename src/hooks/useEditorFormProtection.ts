'use client';
import { useEffect, useRef } from 'react';

/** Editing controls must never trigger a surrounding form's default submit. */
export function useEditorFormProtection() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || !/^\/(?:super-admin|school-admin)(?:\/|$)/.test(window.location.pathname)) return;
    const preventImplicitSubmit = (event: SubmitEvent) => {
      const form = element.closest('form');
      if (!form || event.target !== form) return;
      const submitter = event.submitter;
      const type = submitter?.getAttribute('type')?.toLowerCase();
      // Explicit save buttons retain their normal submit and validation behavior.
      if (submitter && (type === 'submit' || type === 'image')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const preventInputSubmit = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.isComposing || !element.closest('form')) return;
      const input = event.target;
      if (input instanceof HTMLInputElement && !['submit', 'button', 'image', 'checkbox', 'radio', 'file'].includes(input.type)) event.preventDefault();
    };
    // Capture before React invokes the form's save handler or the browser navigates.
    document.addEventListener('submit', preventImplicitSubmit, true);
    element.addEventListener('keydown', preventInputSubmit);
    return () => {
      document.removeEventListener('submit', preventImplicitSubmit, true);
      element.removeEventListener('keydown', preventInputSubmit);
    };
  }, []);
  return root;
}
