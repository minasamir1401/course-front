/** Canonicalize before passing a relative destination to the Next router. */
export function safeLoginNext(value: string | null, origin: string): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\:\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin || url.pathname.startsWith('//') || url.username || url.password) return null;
    return url.pathname + url.search + url.hash;
  } catch { return null; }
}
