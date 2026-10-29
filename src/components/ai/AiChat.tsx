'use client';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Sparkles, Send, Mic, Square, Volume2, Plus, X, History, Copy, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import AiReply from './AiReply';
import AiPractice from './AiPractice';
import type { AiPracticeData } from '@/lib/aiPractice';
import VoiceActivity from './VoiceActivity';
import { aiRequest } from '@/lib/aiClient';
import { apiFetch } from '@/lib/api';
import { recognitionConstructor, hasLocalRecognition, hasBrowserVoiceConsent, setBrowserVoiceConsent, subscribeBrowserVoiceConsent, microphoneAccessIssue, recognitionErrorMessage, plainSpeechText, speakAiReply, stopAiSpeech, voiceLanguages, type VoiceLanguage } from '@/lib/aiVoice';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './AiAssistant.module.css';
import typography from './AiTypography.module.css';

type ChatMessage = { id?: string; role: 'user' | 'assistant'; content: string; model?: string; practice?: AiPracticeData; sources?: Array<{ href?: string; label?: string }> };
export default function AiChat({ mode = 'student', lessonId, onClose, expanded = false, onToggleExpand, initialPrompt = '' }: { mode?: 'public' | 'student'; lessonId?: string; onClose?: () => void; expanded?: boolean; onToggleExpand?: () => void; initialPrompt?: string }) {
  const { language } = useLanguage(); const ar = language === 'ar'; const txt = (a: string, b: string) => ar ? a : b;
  const [messages, setMessages] = useState<ChatMessage[]>([]), [draft, setDraft] = useState(initialPrompt), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null), [prompts, setPrompts] = useState<string[]>([]);
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>(ar ? 'ar-EG' : 'en-US'), [recording, setRecording] = useState(false), [interim, setInterim] = useState(''), [voiceConsent, setVoiceConsent] = useState(false), [speaking, setSpeaking] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false), [threads, setThreads] = useState<any[]>([]);
  const [outputVoice, setOutputVoice] = useState<'cloud' | 'device'>('cloud'), [preparingVoice, setPreparingVoice] = useState(false);
  const browserVoiceAllowed = useSyncExternalStore(subscribeBrowserVoiceConsent, hasBrowserVoiceConsent, () => false);
  const bodyRef = useRef<HTMLDivElement>(null), recognitionRef = useRef<any>(null), activeRef = useRef(true), busyRef = useRef(false), requestEpoch = useRef(0), textareaRef = useRef<HTMLTextAreaElement>(null);
  const readEpoch = useRef(0), audioRef = useRef<{ controller?: AbortController; audio?: HTMLAudioElement; url?: string }>({});
  const audioCacheRef = useRef<{ key: string; blob: Blob } | null>(null);
  const stopReading = useCallback(() => {
    readEpoch.current++; audioRef.current.controller?.abort();
    if (audioRef.current.audio) { audioRef.current.audio.onended = null; audioRef.current.audio.onerror = null; audioRef.current.audio.pause(); audioRef.current.audio.removeAttribute('src'); audioRef.current.audio.load(); }
    if (audioRef.current.url) URL.revokeObjectURL(audioRef.current.url);
    audioRef.current = {}; stopAiSpeech();
    if (activeRef.current) { setSpeaking(null); setPreparingVoice(false); }
  }, []);
  useEffect(() => { activeRef.current = true; if ('speechSynthesis' in window) speechSynthesis.getVoices(); try { if (localStorage.getItem('klevro:reply-voice:v1') === 'device') setOutputVoice('device'); } catch {} return () => { activeRef.current = false; recognitionRef.current?.abort(); stopReading(); audioCacheRef.current = null; }; }, [stopReading]);
  useEffect(() => {
    document.documentElement.dataset.aiChatOpen = 'true'; window.dispatchEvent(new Event('klevro:assistant-open'));
    return () => { delete document.documentElement.dataset.aiChatOpen; window.dispatchEvent(new Event('klevro:assistant-open')); };
  }, []);
  const latestPracticeId = messages[messages.length - 1]?.practice?.messageId || null;
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const card = !busy && latestPracticeId ? body.lastElementChild?.querySelector('[data-practice-message]') : null;
    body.scrollTo({ top: card ? card.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop : body.scrollHeight, behavior: 'smooth' });
  }, [messages.length, busy, latestPracticeId]);
  useEffect(() => {
    stopReading(); audioCacheRef.current = null;
    requestEpoch.current++; setConversationId(null); setMessages([]); setPrompts([]); setError('');
    if (mode === 'student' && lessonId) aiRequest(`/student/config?lessonId=${encodeURIComponent(lessonId)}`).then(data => setPrompts(data.starterPrompts || [])).catch(() => {});
  }, [mode, lessonId, stopReading]);

  async function send() {
    if (!draft.trim() || busyRef.current) return;
    stopReading();
    busyRef.current = true; const currentEpoch = requestEpoch.current; const content = draft.trim();
    recognitionRef.current?.stop(); setError(''); setBusy(true); setDraft('');
    const next: ChatMessage[] = [...messages, { role: 'user', content }]; setMessages(next);
    try {
      const data = await aiRequest(mode === 'public' ? '/public/chat' : '/chat', { message: content, ...(mode === 'public' ? { history: messages.slice(-8).map(({ role, content }) => ({ role, content })) } : { conversationId, lessonId }) });
      if (!activeRef.current || currentEpoch !== requestEpoch.current) return;
      setConversationId(data.conversationId || null);
      setMessages([...next, { id: data.messageId, role: 'assistant', content: data.content, model: data.model, practice: data.practice, sources: data.sources }]);
    } catch (cause: any) { if (activeRef.current && currentEpoch === requestEpoch.current) { setMessages(messages); setDraft(content); setError(cause.message); } }
    finally { busyRef.current = false; if (activeRef.current) setBusy(false); }
  }
  async function startVoice(onlineAllowed = false) {
    if (recording) { recognitionRef.current?.stop(); return; }
    stopReading();
    const issue = microphoneAccessIssue();
    if (issue) { setError(recognitionErrorMessage(issue, ar ? 'ar' : 'en')); return; }
    const Engine = recognitionConstructor();
    if (!Engine) { setError(recognitionErrorMessage('unsupported', ar ? 'ar' : 'en')); return; }
    const local = await hasLocalRecognition(voiceLanguage);
    if (!activeRef.current) return;
    if (!local && !onlineAllowed && !hasBrowserVoiceConsent()) { setVoiceConsent(true); return; }
    setVoiceConsent(false); setError(''); const engine = new Engine(); recognitionRef.current = engine;
    if ('processLocally' in engine) engine.processLocally = local;
    engine.lang = voiceLanguage; engine.continuous = false; engine.interimResults = true;
    engine.onstart = () => { if (activeRef.current) setRecording(true); };
    engine.onend = () => { if (activeRef.current) { setRecording(false); setInterim(''); } };
    engine.onresult = (event: any) => {
      if (!activeRef.current) return;
      let pending = '', final = '';
      for (let index = event.resultIndex; index < event.results.length; index++) {
        if (event.results[index].isFinal) final += event.results[index][0].transcript;
        else pending += event.results[index][0].transcript;
      }
      if (final) setDraft(value => `${value}${value ? ' ' : ''}${final}`); setInterim(pending);
    };
    const fail = (code: string) => {
      if (!activeRef.current) return;
      setRecording(false); setInterim('');
      if (code !== 'aborted') setError(recognitionErrorMessage(code, ar ? 'ar' : 'en'));
    };
    engine.onerror = (event: any) => fail(event.error || 'unknown');
    try { engine.start(); } catch (cause: any) {
      fail(cause?.name === 'NotAllowedError' ? 'not-allowed' : cause?.name === 'SecurityError' ? 'policy-blocked' : 'start-failed');
    }
  }
  async function read(message: string, index: number) {
    if (speaking === index) { stopReading(); return; }
    stopReading(); recognitionRef.current?.stop(); setRecording(false); setError('');
    const epoch = readEpoch.current;
    const target = /[\u0600-\u06ff]/.test(message) ? 'ar-EG' : voiceLanguage;
    const text = plainSpeechText(message);
    setSpeaking(index);
    const local = (notice = '') => {
      if (!activeRef.current || readEpoch.current !== epoch) return;
      setPreparingVoice(false);
      if (!speakAiReply(text, target, () => { if (readEpoch.current === epoch) stopReading(); }, () => { if (readEpoch.current === epoch) { stopReading(); setError(txt('تعذر إكمال صوت الجهاز. جرّب الصوت الاحترافي أو صوتًا آخر من إعدادات جهازك.', 'Device speech failed. Try AI voice or another installed voice.')); } })) {
        stopReading(); setError(txt('لا يوجد صوت محلي لهذه اللغة. جرّب الصوت الاحترافي للعربي والإنجليزي، أو ثبّت صوت اللغة من إعدادات الجهاز.', 'No local voice is installed for this language. Try AI voice for Arabic or English, or install a device voice.'));
      } else if (notice) setError(notice);
    };
    if (outputVoice === 'device') { local(); return; }
    if (!/^(ar|en)(-|$)/.test(target) || text.length > 1400) {
      local(txt('تم استخدام صوت الجهاز لأن الرد طويل أو لغته غير مدعومة بالصوت الاحترافي.', 'Using device speech because this reply is long or its language is not supported by AI voice.')); return;
    }
    const controller = new AbortController(); audioRef.current = { controller }; setPreparingVoice(true);
    try {
      const cacheKey = `${target}\0${text}`;
      let blob = audioCacheRef.current?.key === cacheKey ? audioCacheRef.current.blob : null;
      if (!blob) {
        const response = await apiFetch(`/api/ai${mode === 'public' ? '/public' : ''}/speech`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language: target }), signal: controller.signal });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw Object.assign(new Error('Speech unavailable'), { code: data.code });
        }
        blob = await response.blob();
      }
      if (!activeRef.current || readEpoch.current !== epoch) return;
      audioCacheRef.current = { key: cacheKey, blob };
      const url = URL.createObjectURL(blob), audio = new Audio(url);
      audioRef.current = { controller, audio, url };
      audio.onended = () => { if (readEpoch.current === epoch) stopReading(); };
      audio.onerror = () => { if (readEpoch.current === epoch) { stopReading(); setError(txt('تعذر تشغيل الملف الصوتي. أعد المحاولة أو اختر صوت الجهاز.', 'Audio playback failed. Try again or choose device speech.')); } };
      await audio.play();
      if (readEpoch.current === epoch) setPreparingVoice(false);
    } catch (cause: any) {
      if (controller.signal.aborted || !activeRef.current || readEpoch.current !== epoch) return;
      if (audioRef.current.audio) { audioRef.current.audio.onended = null; audioRef.current.audio.onerror = null; audioRef.current.audio.pause(); audioRef.current.audio.removeAttribute('src'); audioRef.current.audio.load(); }
      if (audioRef.current.url) URL.revokeObjectURL(audioRef.current.url);
      audioRef.current = {};
      local(cause?.code === 'SPEECH_TERMS_REQUIRED'
        ? txt('الصوت الاحترافي يحتاج قبول شروط نموذج الصوت في حساب Groq أولًا؛ تم استخدام صوت الجهاز مؤقتًا.', 'AI voice needs the Groq model terms accepted first; temporarily using device speech.')
        : txt('الصوت الاحترافي غير متاح أو حصته انتهت مؤقتًا؛ تم استخدام صوت الجهاز.', 'AI voice is unavailable or its quota is exhausted; using device speech.'));
    }
  }
  async function history() {
    setShowHistory(value => !value);
    try { const data = await aiRequest('/conversations'); setThreads(data.conversations || []); } catch (cause: any) { setError(cause.message); }
  }
  async function loadThread(id: string) {
    if (busy) return;
    stopReading();
    try { const data = await aiRequest(`/conversations/${encodeURIComponent(id)}`); requestEpoch.current++; setConversationId(id); setMessages(data.messages || []); setShowHistory(false); setError(''); }
    catch (cause: any) { setError(cause.message); }
  }
  const defaults = mode === 'public' ? [txt('إزاي أبدأ استخدام المنصة؟', 'How do I get started?'), txt('إيه اللي يقدر الطالب يعمله هنا؟', 'What can students do here?'), txt('فين ألاقي دروسي وتقارير تقدّمي؟', 'Where are my lessons and reports?')]
    : [txt('أبدأ أذاكر إيه النهارده؟', 'What should I study today?'), txt('حلّل نقاط قوتي واللي محتاج أراجعه', 'Show my strengths and what to practise'), lessonId ? txt('اشرح لي الدرس بخطوات بسيطة', 'Explain this lesson step by step') : txt('رشّح لي درس أراجعه معاك', 'Suggest a lesson to practise together'), txt('اعملي 5 أسئلة تدريب تفاعلية', 'Create 5 interactive practice questions')];
  return <section className={`${styles.chat} ${typography.chat}`} dir={ar ? 'rtl' : 'ltr'} aria-label={txt('محادثة مع مساعد Klevro', 'Chat with Klevro assistant')}>
    <header className={styles.header}><span className={styles.mark}><Sparkles size={22}/></span><div className={`${styles.heading} ${typography.heading}`}><h2>{txt('مساعدك في Klevro', 'Your Klevro assistant')}</h2><p>{mode === 'public' ? txt('كل ما تحتاج تعرفه عن المنصة', 'Get to know your learning platform') : lessonId ? txt('شرح مرتبط بالدرس وتقدّمك', 'Help grounded in this lesson and your progress') : txt('خطوة أوضح في رحلتك التعليمية', 'A clearer next step in your learning')}</p></div>
      {mode === 'student' && <button type="button" className={styles.icon} onClick={() => void history()} aria-label={txt('سجل المحادثات', 'Conversation history')}><History size={17}/></button>}
      <button type="button" disabled={busy} className={styles.icon} aria-label={txt('محادثة جديدة', 'New conversation')} onClick={() => { stopReading(); requestEpoch.current++; setConversationId(null); setMessages([]); setError(''); setDraft(''); }}><Plus size={19}/></button>
      {onToggleExpand && <button type="button" className={styles.icon} onClick={onToggleExpand} aria-expanded={expanded} aria-label={expanded ? txt('تصغير المحادثة', 'Minimize chat') : txt('تكبير المحادثة', 'Expand chat')} title={expanded ? txt('تصغير المحادثة', 'Minimize chat') : txt('تكبير المحادثة', 'Expand chat')}>{expanded ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button>}
      {onClose && <button type="button" className={styles.icon} onClick={onClose} aria-label={txt('إغلاق المساعد', 'Close assistant')}><X size={19}/></button>}
    </header>
    {showHistory && <div className={styles.history}>{threads.length ? threads.map(thread => <div key={thread.id} className="flex items-center"><button disabled={busy} onClick={() => void loadThread(thread.id)}>{thread.title}</button><button className={styles.icon} aria-label={txt('حذف المحادثة', 'Delete conversation')} onClick={async () => { try { await aiRequest(`/conversations/${thread.id}`, undefined, 'DELETE'); setThreads(items => items.filter(item => item.id !== thread.id)); if (conversationId === thread.id) { setConversationId(null); setMessages([]); } } catch (cause: any) { setError(cause.message); } }}><Trash2 size={14}/></button></div>) : <p className={styles.muted}>{txt('ابدأ أول محادثة، وستجدها هنا.', 'Your conversations will appear here.')}</p>}</div>}
    <div className={styles.body} ref={bodyRef} aria-live="polite">
      {!messages.length && <div className={`${styles.intro} ${typography.intro}`}><span className={styles.eyebrow}>{txt('مساحة للسؤال والفهم', 'A LITTLE HELP TO GO FURTHER')}</span><h3>{mode === 'public' ? txt('أهلًا بك. خلّينا نعرّفك على Klevro.', 'Welcome. Let’s explore Klevro.') : txt('اسأل براحتك، ونتعلّم خطوة بخطوة.', 'Ask freely. We’ll take it step by step.')}</h3><p>{mode === 'public' ? txt('اسأل عن الدروس والتقييمات وطريقة متابعة التقدم. تفاصيل حسابك متاحة بعد تسجيل الدخول.', 'Ask about lessons, assessments and progress. Personal help is available after signing in.') : txt('أقدر أساعدك تفهم دروسك وتختار أولويات المذاكرة اعتمادًا على نتائجك المسجّلة.', 'I can help you understand lessons and plan your study using your recorded progress.')}</p><div className={`${styles.prompts} ${typography.prompts}`}>{(prompts.length ? prompts : defaults).map(prompt => <button type="button" key={prompt} onClick={() => { setDraft(prompt); textareaRef.current?.focus(); }}>{prompt} <span aria-hidden="true">↗</span></button>)}</div></div>}
      {messages.map((message, index) => <article key={message.id || index} className={`${styles.message} ${typography.message}`} data-role={message.role}><div className={`${styles.author} ${typography.author}`}>{message.role === 'assistant' && <Sparkles size={12}/>} {message.role === 'user' ? txt('أنت', 'You') : 'Klevro AI'}</div><>{message.practice && mode === 'student' ? <AiPractice initial={message.practice} onChange={practice => setMessages(items => items.map(item => item.id === message.id ? { ...item, practice } : item))} onNewPractice={() => { setDraft(txt(`اعملي تدريب جديد مشابه عن ${message.practice?.title} بأسئلة مختلفة`, `Create new interactive practice about ${message.practice?.title} with different questions`)); textareaRef.current?.focus(); }}/> : <AiReply content={message.content}/>}</>{message.role === 'assistant' && <><div className={styles.messageTools}><button type="button" className={styles.icon} onClick={() => read(message.content, index)} aria-label={speaking === index ? txt('إيقاف القراءة', 'Stop reading') : txt('قراءة الرد بصوت', 'Read reply aloud')}>{speaking === index ? <Square size={14}/> : <Volume2 size={15}/>}</button><button type="button" className={styles.icon} aria-label={txt('نسخ الرد', 'Copy reply')} onClick={() => void navigator.clipboard?.writeText(message.content)}><Copy size={13}/></button><span>{message.model}</span></div>{message.sources?.length ? <div className={`${styles.sources} ${typography.sources}`}>{message.sources.map((source, key) => source.href?.startsWith('/lessons/') ? <Link key={key} href={source.href}>{txt('المصدر: الدرس', 'Source: lesson')}</Link> : <span key={key} className={styles.muted}>{source.label}</span>)}</div> : null}</>}</article>)}
      {busy && <div className={styles.status} role="status"><span className={styles.dot}/>{txt('براجع المعلومات وبحضّر الإجابة…', 'Checking the context and preparing your reply…')}</div>}
    </div>
    <footer className={styles.composer}>
      {preparingVoice && <p className={styles.readingStatus} role="status">{txt('بجهز الصوت الاحترافي…', 'Preparing AI voice…')}</p>}
      {error && <div className={`${styles.error} ${typography.error}`} role="alert">{error}</div>}
      {voiceConsent && <div className={styles.consent} role="dialog" aria-label={txt('إذن استخدام التعرف الصوتي عبر المتصفح', 'Browser speech recognition consent')}><p>{txt('التعرف المحلي غير متاح للغة المختارة على جهازك. المتصفح قد يرسل الصوت لخدمة التعرف الخاصة به. Klevro يرسل النص فقط للـAI. سنتذكر موافقتك على هذا المتصفح، ويمكنك إلغاءها من إعدادات الصوت. هل ترغب في المتابعة؟', 'On-device recognition is unavailable for this language. Your browser may send audio to its speech service. Klevro sends only the text to AI. We will remember your choice in this browser. You can revoke it in voice settings. Continue?')}</p><button type="button" onClick={() => { setBrowserVoiceConsent(true); void startVoice(true); }}>{txt('متابعة عبر المتصفح', 'Continue with browser')}</button><button type="button" onClick={() => setVoiceConsent(false)}>{txt('إلغاء', 'Cancel')}</button></div>}
      {recording && <VoiceActivity ar={ar} interim={interim}/>}
      <div className={`${styles.inputWrap} ${typography.inputWrap}`}><textarea ref={textareaRef} value={draft} maxLength={mode === 'public' ? 6000 : 30000} onChange={event => setDraft(event.target.value)} placeholder={txt('اكتب سؤالك، أو استخدم الميكروفون…', 'Type a question, or use the microphone…')} aria-label={txt('رسالتك للمساعد', 'Your message')} dir="auto" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}/>
        <div className={`${styles.inputActions} ${typography.inputActions}`}><button type="button" disabled={busy} className={`${styles.icon} ${recording ? styles.listening : ''}`} aria-label={recording ? txt('إيقاف الميكروفون', 'Stop microphone') : txt('التحدث للمساعد', 'Speak to assistant')} onClick={() => void startVoice()}>{recording ? <Square size={18}/> : <Mic size={19}/>}</button><select aria-label={txt('لغة الصوت', 'Voice language')} value={voiceLanguage} onChange={event => { recognitionRef.current?.stop(); setVoiceLanguage(event.target.value as VoiceLanguage); }}>{voiceLanguages.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select><button type="button" className={`${styles.send} ${typography.send}`} disabled={busy || !draft.trim()} onClick={() => void send()}>{txt('إرسال', 'Send')}<Send size={15}/></button></div>
      </div><details className={styles.voiceSettings}><summary>{txt('إعدادات الصوت', 'Voice settings')}</summary><label>{txt('صوت قراءة الرد', 'Reply voice')}<select aria-label={txt('صوت قراءة الرد', 'Reply voice')} value={outputVoice} onChange={event => { stopReading(); const value = event.target.value as 'cloud' | 'device'; setOutputVoice(value); try { localStorage.setItem('klevro:reply-voice:v1', value); } catch {} }}><option value="cloud">{txt('صوت AI — عربي / English', 'AI voice — Arabic / English')}</option><option value="device">{txt('صوت الجهاز — بدون طلبات API', 'Device voice — no API requests')}</option></select></label><p>{txt('الصوت الاحترافي يرسل نص الرد إلى Groq، بدون تنزيل نموذج. العربي بلهجة سعودية، والخدمة لها حصة مجانية محدودة. الردود الطويلة واللغات الأخرى تُقرأ بصوت الجهاز.', 'AI voice sends the reply text to Groq without downloading a model. Arabic uses a Saudi voice. Free usage is limited; long replies and other languages use device speech.')}</p><label><input type="checkbox" checked={browserVoiceAllowed} onChange={event => {
        const allowed = event.target.checked;
        setBrowserVoiceConsent(allowed); setVoiceConsent(false);
        if (!allowed) { recognitionRef.current?.abort(); setRecording(false); setInterim(''); }
      }}/>{txt('السماح بخدمة تحويل الصوت لنص الخاصة بالمتصفح', 'Allow the browser speech recognition service')}</label><p>{txt('قد يرسل المتصفح الصوت إلى خدمته. يتم حفظ اختيارك على هذا المتصفح فقط، ويظل تشغيل الميكروفون بضغطتك.', 'The browser may send audio to its speech service. Your choice is saved only in this browser. The microphone still starts only when you press it.')}</p></details><p className={`${styles.footnote} ${typography.footnote}`}>{txt('قد يخطئ المساعد. راجع المعلومات المهمة. الصوت لا يحتاج تنزيل نموذج من الموقع.', 'AI can make mistakes. Check important information. Voice needs no model download from this site.')}</p>
    </footer>
  </section>;
}
