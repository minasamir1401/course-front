// Browser-native voice: no model download, remote SDK, or audio upload to Klevro.
// Online recognition is an explicit user choice when on-device recognition is unavailable.
export type VoiceLanguage = 'ar-EG' | 'en-US' | 'fr-FR' | 'de-DE' | 'es-ES';
export const voiceLanguages: Array<{ value: VoiceLanguage; label: string }> = [
  { value: 'ar-EG', label: 'العربية' }, { value: 'en-US', label: 'English' },
  { value: 'fr-FR', label: 'Français' }, { value: 'de-DE', label: 'Deutsch' }, { value: 'es-ES', label: 'Español' },
];
const BROWSER_VOICE_CONSENT_KEY = 'klevro:browser-voice-consent:v1';
const BROWSER_VOICE_CONSENT_EVENT = 'klevro:browser-voice-consent';
let sessionVoiceConsent = false;
export function hasBrowserVoiceConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(BROWSER_VOICE_CONSENT_KEY) === 'granted'; }
  catch { return sessionVoiceConsent; }
}
export function setBrowserVoiceConsent(allowed: boolean): void {
  if (typeof window === 'undefined') return;
  sessionVoiceConsent = allowed;
  try {
    if (allowed) window.localStorage.setItem(BROWSER_VOICE_CONSENT_KEY, 'granted');
    else window.localStorage.removeItem(BROWSER_VOICE_CONSENT_KEY);
  } catch { /* Retain the choice for this page when persistent storage is blocked. */ }
  window.dispatchEvent(new Event(BROWSER_VOICE_CONSENT_EVENT));
}
export function subscribeBrowserVoiceConsent(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === BROWSER_VOICE_CONSENT_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(BROWSER_VOICE_CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(BROWSER_VOICE_CONSENT_EVENT, onChange);
  };
}
export function recognitionConstructor(): any {
  if (typeof window === 'undefined') return null;
  const browser = window as any;
  return browser.SpeechRecognition || browser.webkitSpeechRecognition || null;
}
export async function hasLocalRecognition(language: string): Promise<boolean> {
  const Engine = recognitionConstructor();
  if (!Engine?.available) return false;
  try { return await Engine.available({ langs: [language], processLocally: true }) === 'available'; }
  catch { return false; }
}
export function microphoneAccessIssue(): string | null {
  if (typeof window === 'undefined') return 'unsupported';
  if (!window.isSecureContext) return 'insecure-context';
  const policy = (document as any).permissionsPolicy || (document as any).featurePolicy;
  if (policy?.allowsFeature && !policy.allowsFeature('microphone')) return 'policy-blocked';
  return null;
}
export function recognitionErrorMessage(code: string, language: 'ar' | 'en'): string {
  const messages: Record<string, [string, string]> = {
    'policy-blocked': ['إعدادات الصفحة أو المتصفح المدمج تمنع الميكروفون. حدّث الصفحة، أو افتح نفس الرابط في Chrome في نافذة مستقلة واسمح بالميكروفون.', 'This page or embedded browser blocks the microphone. Reload, or open the same link in a standalone Chrome window and allow microphone access.'],
    'insecure-context': ['الميكروفون يحتاج اتصال HTTPS أو عنوان localhost عند التشغيل المحلي.', 'The microphone requires HTTPS or a localhost address for local development.'],
    'not-allowed': ['إذن الميكروفون مرفوض. اسمح به من إعدادات الموقع بجوار شريط العنوان، وتأكد من إذن الميكروفون للمتصفح في إعدادات الجهاز، ثم أعد المحاولة.', 'Microphone permission was denied. Allow it in the site settings beside the address bar and in your device privacy settings, then try again.'],
    'service-not-allowed': ['المتصفح لا يسمح بخدمة تحويل الصوت لنص. افتح نفس الرابط في Chrome في نافذة مستقلة واسمح بالميكروفون، أو استخدم الإملاء الصوتي في لوحة المفاتيح.', 'This browser does not allow its speech recognition service. Open the same link in a standalone Chrome window and allow the microphone, or use keyboard dictation.'],
    network: ['تعذر الاتصال بخدمة تحويل الصوت لنص الخاصة بالمتصفح. قد يحدث ذلك داخل المتصفح المدمج حتى مع وجود إنترنت. جرّب نفس الرابط في Chrome في نافذة مستقلة، أو استخدم الإملاء الصوتي في لوحة المفاتيح.', 'The browser could not reach its speech recognition service. This can happen in embedded browsers even when the internet works. Try the same link in a standalone Chrome window, or use keyboard dictation.'],
    'audio-capture': ['تعذر الوصول للميكروفون. تأكد من توصيله واختياره في إعدادات الصوت ومن أن تطبيقًا آخر لا يحتكره.', 'The microphone could not be accessed. Check that it is connected and selected in sound settings and is not exclusively used by another app.'],
    'no-speech': ['لم أسمع كلامًا واضحًا. اضغط الميكروفون مرة أخرى وتكلم بالقرب منه.', 'No speech was detected. Press the microphone again and speak close to it.'],
    'language-not-supported': ['خدمة الصوت في المتصفح لا تدعم اللغة المختارة. جرّب لغة أخرى أو الإملاء الصوتي في لوحة المفاتيح.', 'The browser speech service does not support this language. Try another language or keyboard dictation.'],
    unsupported: ['المتصفح لا يدعم الإملاء الصوتي. افتح الرابط في Chrome في نافذة مستقلة أو استخدم ميكروفون لوحة مفاتيح الجهاز.', 'This browser does not support dictation. Open the link in a standalone Chrome window or use your device keyboard microphone.'],
  };
  const message = messages[code] || ['تعذر بدء تحويل الصوت لنص. أعد المحاولة أو استخدم الإملاء الصوتي في لوحة المفاتيح.', 'Speech recognition could not start. Try again or use keyboard dictation.'];
  return `${message[language === 'ar' ? 0 : 1]} (${code})`;
}
export function plainSpeechText(value: string): string {
  return value.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]*>/g, ' ').replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*#`]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
}
export function speechSegments(text: string, limit = 180): string[] {
  const segments: string[] = [];
  let remaining = plainSpeechText(text);
  while (remaining.length > limit) {
    const window = remaining.slice(0, limit);
    const sentence = [...window.matchAll(/[.!?؟؛،,]\s+/gu)].pop();
    let cut = sentence && sentence.index! > limit / 3 ? sentence.index! + sentence[0].length : window.lastIndexOf(' ');
    if (cut < limit / 3) cut = limit;
    if (/[\uD800-\uDBFF]/u.test(remaining[cut - 1])) cut--;
    segments.push(remaining.slice(0, cut).trim()); remaining = remaining.slice(cut).trim();
  }
  if (remaining) segments.push(remaining);
  return segments;
}
// Keep a strong reference to the active utterance; some engines stop reading after GC.
let localPlayback: { utterance: SpeechSynthesisUtterance | null; cancelled: boolean } | null = null;
export function stopAiSpeech(): void {
  if (localPlayback) localPlayback.cancelled = true;
  localPlayback = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
export function speakAiReply(text: string, language: string, onEnd?: () => void, onError?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const prefix = language.split('-')[0];
  const voices = speechSynthesis.getVoices().filter(item => item.localService && item.lang.toLowerCase().startsWith(prefix));
  const voice = voices.sort((a, b) => {
    const score = (v: SpeechSynthesisVoice) => (/natural|neural|premium|enhanced/i.test(v.name) ? 10 : 0) + (v.lang.toLowerCase() === language.toLowerCase() ? 2 : 0);
    return score(b) - score(a);
  })[0];
  const segments = speechSegments(text);
  if (!voice || !segments.length) return false;
  stopAiSpeech();
  const playback = { utterance: null as SpeechSynthesisUtterance | null, cancelled: false };
  localPlayback = playback;
  let index = 0;
  const next = () => {
    if (playback.cancelled || localPlayback !== playback) return;
    if (index >= segments.length) { localPlayback = null; playback.utterance = null; onEnd?.(); return; }
    const utterance = new SpeechSynthesisUtterance(segments[index++]);
    playback.utterance = utterance;
    utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = 1;
    utterance.onend = next;
    utterance.onerror = () => { if (!playback.cancelled && localPlayback === playback) { localPlayback = null; playback.utterance = null; onError?.(); } };
    try { speechSynthesis.speak(utterance); }
    catch { localPlayback = null; playback.utterance = null; onError?.(); }
  };
  next(); return true;
}
