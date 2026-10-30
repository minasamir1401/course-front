'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { KeyRound, Plus, ShieldCheck, Trash2, Power, RotateCw, Network, Settings2, Radio, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { aiRequest } from '@/lib/aiClient';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './AiAdminSettings.module.css';

const presets: Record<string, { baseUrl: string; model: string }> = {
  GROQ: { baseUrl: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b' },
  OPENROUTER: { baseUrl: 'https://openrouter.ai/api/v1', model: '' },
  GEMINI: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: '' },
  OPENAI: { baseUrl: 'https://api.openai.com/v1', model: '' }, CUSTOM: { baseUrl: '', model: '' },
};
export default function AiAdminSettings() {
  const { language } = useLanguage(); const ar = language === 'ar'; const txt = useCallback((a: string, b: string) => ar ? a : b, [ar]);
  const [settings, setSettings] = useState({ enabled: false, publicEnabled: false, instructions: '', publicInfo: '' }), [providers, setProviders] = useState<any[]>([]), [keyReady, setKeyReady] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', kind: 'GROQ', ...presets.GROQ, apiKey: '', allowPublic: false, allowStudent: true });
  const [copying, setCopying] = useState<{ name: string; model: string; enabled: boolean } | null>(null);
  const [modelError, setModelError] = useState('');
  const [models, setModels] = useState<Array<{ id: string; name: string; free: boolean | null }>>([]), [modelSearch, setModelSearch] = useState(''), [loadingModels, setLoadingModels] = useState(false);
  const [revealedKey, setRevealedKey] = useState(''), [revealingKey, setRevealingKey] = useState(false), [replacingKey, setReplacingKey] = useState(false);
  const credentialEpoch = useRef(0), credentialInputId = useId();
  const modelEpoch = useRef(0);
  const modelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invalidateModelRequest = useCallback(() => { modelEpoch.current++; }, []);
  const editorRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(false), [savedSettings, setSavedSettings] = useState(''), [updatedAt, setUpdatedAt] = useState('');
  const [testing, setTesting] = useState<string | null>(null), [checks, setChecks] = useState<Record<string, any>>({});
  const changed = available && JSON.stringify(settings) !== savedSettings;
  const locked = busy || !!testing;
  const savedBaseUrl = providers.find(provider => provider.id === editing)?.baseUrl;
  const usingSavedKey = !!editing && !replacingKey && savedBaseUrl === form.baseUrl;
  const detectedProvider = form.apiKey.trim().startsWith('AIza') ? 'GEMINI'
    : form.apiKey.trim().startsWith('gsk_') ? 'GROQ'
    : form.apiKey.trim().startsWith('sk-or-') ? 'OPENROUTER'
    : /^sk-(proj-|svcacct-)/.test(form.apiKey.trim()) ? 'OPENAI' : null;
  const keyMismatch = !!detectedProvider && form.kind !== 'CUSTOM' && detectedProvider !== form.kind;
  const canFetchModels = !keyMismatch && (!!form.apiKey.trim() || usingSavedKey);
  const validSelection = models.some(model => model.id === form.model);
  const audienceValue = (provider: { allowPublic: boolean; allowStudent?: boolean }) => provider.allowStudent === false ? 'public' : provider.allowPublic ? 'both' : 'student';
  const audiencePatch = (value: string) => ({ allowPublic: value !== 'student', allowStudent: value !== 'public' });
  const audiences = [{ value: 'student', label: txt('مساعد الطالب فقط', 'Student assistant only') }, { value: 'public', label: txt('شات الرئيسية فقط', 'Homepage chat only') }, { value: 'both', label: txt('الرئيسية والطالب', 'Homepage and student') }];
  const audienceText = (provider: { allowPublic: boolean; allowStudent?: boolean }) => audiences.find(item => item.value === audienceValue(provider))!.label;
  function health(provider: any) {
    if (provider.cooldownUntil && new Date(provider.cooldownUntil) > new Date()) return txt('في فترة انتظار', 'Cooling down');
    if (provider.lastStatus >= 200 && provider.lastStatus < 300) return txt('آخر طلب نجح', 'Last request succeeded');
    if (provider.lastStatus === 429) return txt('آخر طلب تجاوز الحصة', 'Last request rate limited');
    if (provider.lastStatus === 413) return txt('آخر طلب تجاوز الحجم', 'Last request too large');
    if (provider.lastStatus === 401 || provider.lastStatus === 403) return txt('مشكلة في صلاحية المفتاح', 'Credential access issue');
    return provider.lastStatus ? txt('آخر طلب لم ينجح', 'Last request failed') : txt('لم يُختبر بعد', 'Not tested yet');
  }
  function forgetRevealedKey() { credentialEpoch.current++; setRevealedKey(''); setRevealingKey(false); }
  function clearModels() { forgetRevealedKey(); modelEpoch.current++; if (modelTimer.current) clearTimeout(modelTimer.current); setModels([]); setModelSearch(''); setLoadingModels(false); setModelError(''); setError(''); }
  function addAnotherKey(source: typeof form & { enabled?: boolean }) {
    clearModels(); setEditing(null); setReplacingKey(false); setError(''); setNotice('');
    let number = 2;
    const name = () => {
      const suffix = ` — ${txt('مفتاح', 'key')} ${number}`;
      return source.name.slice(0, 120 - suffix.length) + suffix;
    };
    while (providers.some(provider => provider.name === name())) number++;
    setCopying({ name: source.name, model: source.model, enabled: source.enabled !== false });
    setForm({ name: name(), kind: source.kind, baseUrl: source.baseUrl, model: source.model, apiKey: '', allowPublic: source.allowPublic, allowStudent: source.allowStudent !== false });
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestAnimationFrame(() => {
      const input = editorRef.current?.querySelector<HTMLInputElement>('input[autocomplete="new-password"]');
      input?.focus({ preventScroll: true });
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  useEffect(() => () => { credentialEpoch.current++; }, []);
  async function revealStoredKey() {
    if (revealedKey) { forgetRevealedKey(); return; }
    if (!usingSavedKey || revealingKey) return;
    const epoch = ++credentialEpoch.current; setRevealingKey(true); setError('');
    try {
      const data = await aiRequest(`/admin/providers/${encodeURIComponent(editing!)}/credential`);
      if (epoch !== credentialEpoch.current) return;
      if (typeof data.apiKey !== 'string' || !data.apiKey) throw new Error(txt('تعذر إظهار المفتاح المحفوظ.', 'Could not reveal the saved key.'));
      setRevealedKey(data.apiKey);
    } catch (cause: any) { if (epoch === credentialEpoch.current) setError(cause.message); }
    finally { if (epoch === credentialEpoch.current) setRevealingKey(false); }
  }
  const fetchModels = useCallback(async () => {
    if (modelTimer.current) clearTimeout(modelTimer.current);
    if (keyMismatch) return;
    if (!form.apiKey.trim() && (!editing || replacingKey)) return;
    if (editing && !form.apiKey && savedBaseUrl !== form.baseUrl) {
      setError(txt('لاختبار رابط API مختلف، أعد إدخال المفتاح بدل إرسال المفتاح المحفوظ إلى عنوان جديد.', 'To check a different API URL, re-enter the credential rather than forwarding the stored key to a new address.')); return;
    }
    const epoch = ++modelEpoch.current; setLoadingModels(true); setError(''); setModelError(''); setNotice('');
    try {
      const data = editing && !form.apiKey
        ? await aiRequest(`/admin/providers/${encodeURIComponent(editing)}/models`)
        : await aiRequest('/admin/models', { kind: form.kind, baseUrl: form.baseUrl, apiKey: form.apiKey });
      if (epoch !== modelEpoch.current) return;
      const choices = data.models || [];
      setModels(choices);
      setForm(current => {
        const preferred = current.model || copying?.model || '';
        return { ...current, model: choices.some((model: { id: string }) => model.id === preferred) ? preferred : '' };
      });
      if (choices.length && copying && !choices.some((model: { id: string }) => model.id === copying.model)) setNotice(txt('النموذج المنسوخ غير متاح للمفتاح الجديد. اختر نموذجًا متاحًا قبل الحفظ.', 'The copied model is unavailable for this key. Choose an available model before saving.'));
      if (!choices.length) setNotice(txt('المزوّد لم يُرجع قائمة نماذج لهذا المفتاح. راجع صلاحياته ثم أعد جلب القائمة.', 'The provider returned no models for this credential. Check its permissions and refresh the list.'));
    } catch (cause: any) { if (epoch === modelEpoch.current) setModelError(cause.message); }
    finally { if (epoch === modelEpoch.current) setLoadingModels(false); }
  }, [editing, replacingKey, copying, keyMismatch, form.apiKey, form.baseUrl, form.kind, savedBaseUrl, txt]);
  useEffect(() => {
    if (!available || keyMismatch || ((!editing || replacingKey) && !form.apiKey.trim()) || (editing && !form.apiKey.trim() && savedBaseUrl !== form.baseUrl)) return;
    try { if (new URL(form.baseUrl).protocol !== 'https:') return; } catch { return; }
    modelTimer.current = setTimeout(() => { modelTimer.current = null; void fetchModels(); }, 800);
    return () => { if (modelTimer.current) clearTimeout(modelTimer.current); invalidateModelRequest(); };
  }, [available, keyMismatch, editing, replacingKey, form.apiKey, form.baseUrl, savedBaseUrl, fetchModels, invalidateModelRequest]);
  async function load(includeSettings = false) { const data = await aiRequest('/admin/settings'); if (includeSettings) { setSettings(data.settings); setSavedSettings(JSON.stringify(data.settings)); } setProviders(data.providers || []); setKeyReady(data.encryptionConfigured); setAvailable(true); setUpdatedAt(new Date().toISOString()); }
  useEffect(() => { void load(true).catch(cause => setError(cause.message)).finally(() => setLoading(false)); }, []);
  async function run(operation: () => Promise<any>, success: string) { setBusy(true); setError(''); setNotice(''); try { await operation(); await load(); setNotice(success); } catch (cause: any) { setError(cause.message); } finally { setBusy(false); } }
  async function testConnection(id: string) {
    setTesting(id); setError(''); setNotice('');
    try { const data = await aiRequest(`/admin/providers/${encodeURIComponent(id)}/test`, {}); setChecks(current => ({ ...current, [id]: data.test })); await load(); }
    catch (cause: any) { setError(cause.message); }
    finally { setTesting(null); }
  }
  return <section className={styles.workspace} dir={ar ? 'rtl' : 'ltr'} aria-label={txt('إعدادات المساعد الذكي', 'AI assistant settings')}>
    <header className={styles.hero}><div className={styles.heroIcon}><Network size={27}/></div><div><span>{txt('مركز المساعد التعليمي', 'LEARNING ASSISTANT CONTROL')}</span><h2>{txt('مفاتيح متعددة. تجربة واحدة.', 'Multiple providers. One learning experience.')}</h2><p>{txt('تحكم في النماذج والتوجيهات وظهور المساعد من مكان واحد.', 'Manage models, guidance and assistant availability in one place.')}</p></div><span className={styles.pill}>{txt('إدارة المدير العام', 'Super admin only')}</span></header>
    {loading ? <p role="status">{txt('جارٍ تحميل الإعدادات…', 'Loading settings…')}</p> : !available ? <div role="alert" className={styles.error}><p>{error || txt('تعذر تحميل إعدادات المساعد.', 'Could not load assistant settings.')}</p><button type="button" className={styles.secondary} onClick={() => { setLoading(true); void load(true).catch(cause => setError(cause.message)).finally(() => setLoading(false)); }}>{txt('إعادة تحميل الإعدادات', 'Retry loading settings')}</button></div> : <>
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.success}>{notice}</p>}
    {!keyReady && <p className={styles.error}>{txt('حفظ المفاتيح يحتاج AI_ENCRYPTION_KEY على الخادم. راجع دليل إعداد المساعد قبل التفعيل.', 'Saving credentials requires AI_ENCRYPTION_KEY on the server. Check the assistant setup guide before enabling.')}</p>}
    <div className={styles.metrics}><div><b>{providers.length}</b><span>{txt('اتصال API', 'API connections')}</span></div><div><b>{providers.filter(p => p.enabled).length}</b><span>{txt('مسموح بالتوزيع', 'Allowed for routing')}</span></div><div><b>{providers.reduce((n, p) => n + p.requestCount, 0)}</b><span>{txt('محاولة إرسال واختبار', 'Dispatches and probes')}</span></div><div><b>{keyReady ? <ShieldCheck size={24}/> : '—'}</b><span>{txt('تشفير AES-256-GCM', 'AES-256-GCM encryption')}</span></div></div>
    <div className={styles.statusBar}><span>{txt('آخر تحديث', 'Last refreshed')}: {updatedAt && new Date(updatedAt).toLocaleTimeString(ar ? 'ar-EG' : 'en-GB')}</span><button type="button" disabled={locked} className={styles.secondary} onClick={() => void run(() => Promise.resolve(), txt('تم تحديث حالة الاتصالات من الخادم.', 'Connection status refreshed from the server.'))}><RotateCw size={14}/>{txt('تحديث حالة الاتصالات', 'Refresh connection status')}</button></div>
    <fieldset disabled={locked} className={styles.controls}>
    <div className={styles.grid}>
      <div ref={editorRef} className={styles.panel}><h3><KeyRound size={19}/>{editing ? txt('تعديل الاتصال', 'Edit connection') : copying ? txt('إضافة مفتاح آخر بنفس الإعدادات', 'Add another key with these settings') : txt('إضافة مفتاح API', 'Add an API credential')}</h3><p className={styles.hint}>{editing ? txt('المفتاح الحالي محفوظ. يمكنك إظهاره أو تغييره، وتعديل النموذج دون إدخاله مجددًا.', 'Your current key is saved. Reveal or replace it, or change the model without entering the key again.') : txt('اختر الشركة وأدخل مفتاح API. سنجلب نماذجها تلقائيًا لتختار النموذج وتحفظ الاتصال.', 'Choose a provider and enter your API key. Its model list loads automatically so you can choose a model and save.')}</p>
        {copying && <div role="status" className={styles.saved}><b>{txt('نسخ إعدادات: ', 'Settings copied from: ')}{copying.name}</b><p>{txt('أدخل المفتاح الجديد فقط. الشركة والنموذج ومكان الاستخدام منسوخة؛ سيُضاف اتصال مستقل بالتبديل مع الاتصالات المفعّلة لنفس المكان.', 'Enter only the new key. Provider, model and audience are copied; a separate connection will join rotation for that audience.')}</p><bdi>{copying.model}</bdi>{!copying.enabled && <p>{txt('الاتصال الأصلي متوقف؛ سيُحفظ الاتصال الجديد متوقفًا أيضًا حتى تفعّله.', 'The original is disabled; the new connection will also be disabled until enabled.')}</p>}</div>}
        {editing && <button type="button" className={styles.secondary} disabled={!form.model} onClick={() => addAnotherKey({ ...form, enabled: providers.find(provider => provider.id === editing)?.enabled })}><Plus size={14}/>{txt('إضافة مفتاح آخر بنفس الإعدادات', 'Add another key with these settings')}</button>}
        <form onSubmit={event => { event.preventDefault(); if (!validSelection || loadingModels || keyMismatch) return; void run(async () => { await aiRequest(editing ? `/admin/providers/${editing}` : '/admin/providers', { ...form, ...(copying ? { enabled: copying.enabled } : {}) }, editing ? 'PATCH' : 'POST'); if (editing) setChecks(current => { const next = { ...current }; delete next[editing]; return next; }); clearModels(); setCopying(null); setReplacingKey(false); setForm({ name: '', kind: 'GROQ', ...presets.GROQ, apiKey: '', allowPublic: false, allowStudent: true }); setEditing(null); }, txt('تم حفظ الاتصال بأمان.', 'Connection saved securely.')); }}>
          <label>{txt('اسم الاتصال', 'Connection name')}<input required value={form.name} maxLength={120} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={txt('Groq — الاتصال الأول', 'Groq — primary connection')}/></label>
          <label>{txt('المزوّد', 'Provider')}<select aria-label={txt('المزوّد', 'Provider')} disabled={!!editing} value={form.kind} onChange={e => { clearModels(); setCopying(null); setForm({ ...form, kind: e.target.value, ...presets[e.target.value], apiKey: '' }); }}>{Object.keys(presets).map(kind => <option key={kind}>{kind}</option>)}</select></label>
          <label>{txt('رابط API المتوافق مع OpenAI', 'OpenAI-compatible base URL')}<input dir="ltr" required type="url" value={form.baseUrl} onChange={e => { clearModels(); setForm({ ...form, baseUrl: e.target.value, apiKey: '', model: '' }); }}/></label>
          {usingSavedKey ? <div className={styles.credential}>
            <label htmlFor={credentialInputId}>{txt('المفتاح المحفوظ', 'Saved API key')}<span className={styles.keyBadge} aria-hidden="true"><ShieldCheck size={12}/>{txt('محفوظ ومشفّر', 'Saved and encrypted')}</span></label>
            <div className={styles.credentialRow}><input id={credentialInputId} aria-label={txt('المفتاح المحفوظ', 'Saved API key')} type={revealedKey ? 'text' : 'password'} dir="ltr" autoComplete="off" readOnly value={revealedKey || '••••••••••••••••'} aria-describedby={credentialInputId + '-help'}/>
              <button type="button" className={styles.secondary} disabled={revealingKey} aria-pressed={!!revealedKey} onClick={() => void revealStoredKey()}>{revealedKey ? <EyeOff size={16}/> : <Eye size={16}/>} {revealingKey ? txt('جارٍ الإظهار…', 'Revealing…') : revealedKey ? txt('إخفاء المفتاح', 'Hide key') : txt('إظهار المفتاح', 'Show key')}</button></div>
            <p id={credentialInputId + '-help'} className={styles.hint}>{txt('سيتم استخدام هذا المفتاح والاحتفاظ به عند حفظ التعديل.', 'This key will be used and retained when you save your changes.')}</p>
            <button type="button" className={styles.secondary} onClick={() => { clearModels(); setReplacingKey(true); }}>{txt('تغيير المفتاح', 'Replace key')}</button>
          </div> : <div className={styles.credential}><label>{txt('المفتاح السري', 'Secret API key')}<input type="password" dir="ltr" autoComplete="new-password" aria-invalid={keyMismatch || !!modelError} aria-describedby={credentialInputId + '-entry-help'} required value={form.apiKey} onChange={e => { clearModels(); setForm({ ...form, apiKey: e.target.value, model: copying ? form.model : '' }); }} placeholder={editing ? txt('أدخل مفتاح API البديل', 'Enter the replacement API key') : 'API key'}/></label>
            {editing && savedBaseUrl === form.baseUrl && <button type="button" className={styles.secondary} onClick={() => { clearModels(); setReplacingKey(false); setForm(current => ({ ...current, apiKey: '', model: providers.find(provider => provider.id === editing)?.model || '' })); }}>{txt('الاحتفاظ بالمفتاح الحالي', 'Keep existing key')}</button>}
          </div>}
          <div id={credentialInputId + '-entry-help'}>
            {keyMismatch && <div role="alert" className={styles.error}><p>{txt('المفتاح يبدو تابعًا لـ ' + detectedProvider + ' لكن الشركة المختارة هي ' + form.kind + '. اختر الشركة الصحيحة أو أدخل مفتاحًا تابعًا لها.', 'This key appears to belong to ' + detectedProvider + ', but the selected provider is ' + form.kind + '. Select the matching provider or enter its key.')}</p>{!editing && !copying && <button type="button" className={styles.secondary} onClick={() => { clearModels(); setForm(current => ({ ...current, kind: detectedProvider!, ...presets[detectedProvider!] })); }}>{txt('استخدام ' + detectedProvider, 'Use ' + detectedProvider)}</button>}</div>}
            {modelError && <div role="alert" className={styles.error}><p>{modelError}</p><p>{txt('لم يُحفظ الاتصال. راجع الشركة والمفتاح، ثم اضغط «جلب النماذج المتاحة» لإعادة المحاولة.', 'The connection has not been saved. Check the provider and key, then use Load available models to retry.')}</p></div>}
          </div>
          <button type="button" className={styles.secondary} disabled={loadingModels || !canFetchModels} onClick={() => void fetchModels()}><RotateCw size={14}/>{loadingModels ? txt('جارٍ جلب النماذج…', 'Loading models…') : txt('جلب النماذج المتاحة', 'Load available models')}</button>
          <div className={styles.modelPicker} aria-busy={loadingModels}>
            <p className={styles.hint} role="status">{loadingModels ? txt('جارٍ تحميل النماذج من المزوّد…', 'Loading models from the provider…') : models.length ? txt('اختر من النماذج التي أعادها مفتاحك. لا تحتاج لكتابة اسم النموذج.', 'Choose a model returned for your credential. No model ID typing needed.') : usingSavedKey ? txt('تُجلب قائمة النماذج باستخدام المفتاح المحفوظ. يمكنك إعادة جلبها من الزر أعلاه.', 'Models use your saved key. You can reload them using the button above.') : txt('أدخل المفتاح السري وستظهر نماذج المزوّد تلقائيًا هنا.', 'Enter your secret key to load provider models automatically.')}</p>
            {!!models.length && <label>{txt('ابحث في النماذج', 'Search models')}<input dir="ltr" value={modelSearch} onChange={e => setModelSearch(e.target.value)} placeholder="gpt-oss, llama, gemini…"/></label>}
            <label>{txt('اختر نموذجًا من قائمة المزوّد', 'Choose a provider model')}<select dir="ltr" required disabled={loadingModels || !models.length} value={validSelection ? form.model : ''} onChange={e => setForm({ ...form, model: e.target.value })}><option value="" disabled>{loadingModels ? txt('جارٍ التحميل…', 'Loading…') : models.length ? txt('اختر نموذجًا', 'Choose a model') : txt('النماذج تظهر بعد إدخال المفتاح', 'Models appear after entering a key')}</option>{models.filter(model => (model.id + ' ' + model.name).toLowerCase().includes(modelSearch.toLowerCase()) || model.id === form.model).sort((a, b) => Number(b.id === form.model) - Number(a.id === form.model)).slice(0, 500).map(model => <option key={model.id} value={model.id}>{model.id}{model.free === true ? txt(' — مجاني حسب تسعير المزوّد', ' — provider lists as free') : ''}</option>)}</select></label>
            {!!models.length && <p className={styles.hint}>{txt(models.length + ' نموذجًا من المزوّد. الظهور في القائمة لا يضمن مجانية الاستخدام أو توفر الحصة.', models.length + ' models returned. Listing does not guarantee free use or remaining quota.')}</p>}
          </div>
          <label>{txt('مكان استخدام هذا النموذج', 'Use this model for')}<select aria-label={txt('مكان استخدام هذا النموذج', 'Use this model for')} value={audienceValue(form)} onChange={e => setForm({ ...form, ...audiencePatch(e.target.value) })}>{audiences.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <p className={styles.hint}>{txt('الطلبات والبدائل تستخدم فقط الاتصالات المخصّصة لنفس المكان. يشمل اختيار الطالب الدروس وتحليل النتائج.', 'Requests and fallback stay within the selected audience. Student use includes lessons and learning analysis.')}</p>
          <button disabled={busy || !keyReady || loadingModels || !validSelection || keyMismatch} className={styles.primary} type="submit"><Plus size={16}/>{txt('حفظ الاتصال المشفّر', 'Save encrypted connection')}</button>{(editing || copying) && <button type="button" className={styles.secondary} onClick={() => { clearModels(); setCopying(null); setEditing(null); setReplacingKey(false); setForm({ name: '', kind: 'GROQ', ...presets.GROQ, apiKey: '', allowPublic: false, allowStudent: true }); }}>{copying ? txt('إلغاء إضافة المفتاح', 'Cancel adding key') : txt('إلغاء التعديل', 'Cancel editing')}</button>}
        </form>
      </div>
      <div className={styles.panel}><h3><RotateCw size={19}/>{txt('اتصالاتك وتوزيع الطلبات', 'Connections and request routing')}</h3><p className={styles.hint}>{txt('عند فشل اتصال أو وصوله لحد المزوّد، يتم إراحته مؤقتًا وتجربة اتصال آخر. مفاتيح نفس الحساب تشارك حصته.', 'An unavailable or rate-limited connection cools down while another is tried. Keys from the same account share its quota.')}</p>
        {!providers.length ? <div className={styles.empty}><KeyRound size={30}/><p>{txt('أضف أول اتصال لتجهيز المساعد.', 'Add your first connection to prepare the assistant.')}</p></div> : providers.map(provider => <article key={provider.id} className={styles.provider}><div className={styles.providerTitle}><div><h4>{provider.name}</h4><p dir="ltr">{provider.model}</p></div><span className={styles.pill}>{provider.enabled ? txt('التوزيع مفعّل', 'Routing enabled') : txt('التوزيع متوقف', 'Routing disabled')}</span></div><p className={styles.hint}>{provider.kind} · {provider.requestCount} {txt('محاولة', 'attempts')} · {provider.failureCount} {txt('تعذر اتصال', 'failed attempts')}</p>{provider.cooldownUntil && new Date(provider.cooldownUntil) > new Date() && <p className={styles.hint}>{txt('إراحة مؤقتة حتى', 'Cooling down until')} {new Date(provider.cooldownUntil).toLocaleTimeString(ar ? 'ar-EG' : 'en-GB')}</p>}
          <div className={styles.connectionHealth} data-ok={provider.lastStatus >= 200 && provider.lastStatus < 300}><span>{health(provider)}</span>{provider.lastStatus && <code>HTTP {provider.lastStatus}</code>}<span>{audienceText(provider)}</span></div>
          <label className={styles.audienceControl}>{txt('مكان الاستخدام — ', 'Usage — ')}{provider.name}<select value={audienceValue(provider)} onChange={e => void run(() => aiRequest('/admin/providers/' + encodeURIComponent(provider.id), audiencePatch(e.target.value), 'PATCH'), txt('تم حفظ مكان استخدام النموذج.', 'Model audience saved.'))}>{audiences.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          {checks[provider.id] && <div role="status" className={checks[provider.id].ok ? styles.testSuccess : styles.testFailure}><strong>{checks[provider.id].ok ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {checks[provider.id].ok ? txt('الاختبار نجح', 'Test passed') : txt('الاختبار لم ينجح', 'Test did not pass')}</strong><p>{ar ? checks[provider.id].message : checks[provider.id].code}</p><span>HTTP {checks[provider.id].status} · {new Date(checks[provider.id].checkedAt).toLocaleTimeString(ar ? 'ar-EG' : 'en-GB')}{checks[provider.id].latencyMs != null && ' · ' + checks[provider.id].latencyMs + ' ms'}</span>{checks[provider.id].retryAfterSeconds && <p>{txt('أعد المحاولة بعد', 'Retry after')} {checks[provider.id].retryAfterSeconds} {txt('ثانية', 'seconds')}</p>}{checks[provider.id].ok && <p>{txt('رد النموذج:', 'Model reply:')} <bdi>{checks[provider.id].reply}</bdi></p>}</div>}
          <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => void testConnection(provider.id)}><Radio size={14}/>{testing === provider.id ? txt('جارٍ الاختبار…', 'Testing…') : txt('اختبار الاتصال', 'Test connection')}</button><button disabled={busy} type="button" className={styles.secondary} onClick={() => void run(() => aiRequest(`/admin/providers/${provider.id}`, { enabled: !provider.enabled }, 'PATCH'), txt('تم تحديث الاتصال.', 'Connection updated.'))}><Power size={13}/>{provider.enabled ? txt('إيقاف', 'Disable') : txt('تفعيل', 'Enable')}</button><button className={styles.secondary} type="button" onClick={() => { clearModels(); setCopying(null); setReplacingKey(false); setEditing(provider.id); editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setNotice(''); setError(''); setForm({ name: provider.name, kind: provider.kind, baseUrl: provider.baseUrl, model: provider.model, apiKey: '', allowPublic: provider.allowPublic, allowStudent: provider.allowStudent !== false }); }}>{txt('تعديل', 'Edit')}</button><button className={styles.secondary} type="button" onClick={() => addAnotherKey(provider)}><Plus size={14}/>{txt('إضافة مفتاح آخر', 'Add another key')}</button><button disabled={busy} type="button" className={styles.secondary} aria-label={`${txt('حذف الاتصال', 'Delete connection')} ${provider.name}`} onClick={() => void run(() => aiRequest(`/admin/providers/${provider.id}`, undefined, 'DELETE'), txt('تم حذف الاتصال.', 'Connection deleted.'))}><Trash2 size={14}/></button></div>
        </article>)}
      </div>
    </div>
    <div className={styles.panel}><h3><Settings2 size={19}/>{txt('ظهور المساعد ومعلوماته', 'Assistant availability and knowledge')}</h3><p className={styles.hint}>{txt('التغييرات التالية لا تُطبّق إلا بعد الضغط على حفظ إعدادات المساعد.', 'Changes below take effect only after Save assistant settings.')}</p><p role="status" className={changed ? styles.pending : styles.saved}>{changed ? txt('تغييرات لم تُحفظ بعد', 'Unsaved changes') : txt('الإعدادات المعروضة محفوظة على الخادم', 'These settings are saved on the server')}</p><div className={styles.grid}><div><label className={styles.check}><input type="checkbox" checked={settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })}/>{txt('تفعيل مساعد الطلاب', 'Enable student assistant')}</label><label className={styles.check}><input type="checkbox" checked={settings.publicEnabled} onChange={e => setSettings({ ...settings, publicEnabled: e.target.checked })}/>{txt('تفعيل الشات العام بالصفحة الرئيسية', 'Enable public chat on the home page')}</label><p className={styles.hint}>{txt('لا نفرض رصيد توكنات على الطالب. حدود المزوّد وحماية كثافة الطلبات تظل سارية. لا يظهر المساعد في الامتحانات والتقييمات والمهارات والألعاب.', 'Students have no application token allowance. Provider quotas and request-abuse protection still apply. The assistant is hidden in exams, assessments, skills and games.')}</p></div><div><label>{txt('معلومات المنصة للمساعد العام والطلاب', 'Approved platform knowledge for public and student assistants')}<textarea rows={5} value={settings.publicInfo} onChange={e => setSettings({ ...settings, publicInfo: e.target.value })}/></label></div></div><label>{txt('توجيهات عامة للمساعد', 'General assistant instructions')}<textarea rows={4} value={settings.instructions} onChange={e => setSettings({ ...settings, instructions: e.target.value })} placeholder={txt('أسلوب الشرح، اللغة، قواعد الاستشهاد بمحتوى الدرس…', 'Teaching style, language, how to use lesson sources…')}/></label><button type="button" className={styles.primary} disabled={busy} onClick={() => void run(async () => { const data = await aiRequest('/admin/settings', settings, 'PUT'); setSettings(data.settings); setSavedSettings(JSON.stringify(data.settings)); }, txt('تم حفظ إعدادات المساعد.', 'Assistant settings saved.'))}>{busy ? txt('جارٍ الحفظ…', 'Saving…') : txt('حفظ إعدادات المساعد', 'Save assistant settings')}</button></div>
    </fieldset>
    </>}
  </section>;
}
