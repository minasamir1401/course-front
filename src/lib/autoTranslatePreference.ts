export const AUTO_TRANSLATE_STORAGE_KEY = 'klevro_auto_translate_manual';
export const AUTO_TRANSLATE_EVENT = 'klevro:auto-translate-change';

export function getAutoTranslateEnabled(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    const raw = window.localStorage.getItem(AUTO_TRANSLATE_STORAGE_KEY);
    if (raw === null || raw === '') return true;
    return raw !== 'false' && raw !== '0';
  } catch {
    return true;
  }
}

export function setAutoTranslateEnabled(enabled: boolean): void {
  const next = Boolean(enabled);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTO_TRANSLATE_STORAGE_KEY, next ? 'true' : 'false');
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(AUTO_TRANSLATE_EVENT, { detail: next }));
    }
  } catch {
    // Ignore storage quota or sandbox restrictions.
  }
}
