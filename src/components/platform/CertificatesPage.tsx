'use client';
/* eslint-disable @next/next/no-img-element -- Authenticated blob previews must stay in this browser and bypass the image optimizer. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Award, Download, FileImage, FileText, UploadCloud, X, ShieldCheck } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/lib/api';
import { checkAuthSession } from '@/lib/auth';
import { useModalFocus } from '@/hooks/useModalFocus';
import styles from './Platform.module.css';
import LearningBackdrop from '@/components/student/LearningBackdrop';
import CertificateRecipients, { type CertificateAudience } from './CertificateRecipients';
type Certificate = { id: string; title: string; message: string | null; fileName: string; mimeType: string; byteSize: number; createdAt: string; revokedAt: string | null; student: { name: string; username: string }; school: { name: string }; issuer: { name: string } };
export default function CertificatesPage() {
  const { language } = useLanguage(); const ar = language === 'ar'; const router = useRouter(); const pathname = usePathname();
  const admin = pathname.startsWith('/school-admin') || pathname.startsWith('/super-admin');
  const [authorized, setAuthorized] = useState(false); const [items, setItems] = useState<Certificate[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [superAdmin, setSuperAdmin] = useState(false);
  const [audience, setAudience] = useState<CertificateAudience>({ schoolId: '', grade: '', studentIds: [] });
  const [progress, setProgress] = useState('');
  const [revokeId, setRevokeId] = useState(''); const [preview, setPreview] = useState<{ url: string; title: string } | null>(null); const modal = useRef<HTMLDivElement>(null);
  const closePreview = useCallback(() => { setPreview(old => { if (old) URL.revokeObjectURL(old.url); return null; }); }, []);
  useModalFocus(!!preview, modal, closePreview);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const load = useCallback(async (offset = 0) => {
    setLoading(true); setError('');
    try { const response = await apiFetch(`/api/certificates?offset=${offset}`, { cache: 'no-store' }); if (!response.ok) throw new Error(); const data = await response.json(); setItems(old => offset ? [...old, ...data.items] : data.items); setTotal(data.total); }
    catch { setError(ar ? 'تعذر تحميل الشهادات. حاول مرة أخرى.' : 'Could not load certificates. Please retry.'); }
    finally { setLoading(false); }
  }, [ar]);
  useEffect(() => {
    let active = true;
    checkAuthSession().then(session => {
      if (!active) return;
      if (!session.authenticated) { router.replace(admin ? (pathname.startsWith('/super-admin') ? '/super-admin/login' : '/school-admin/login') : '/login'); return; }
      if (admin ? !['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role) : session.user.role !== 'STUDENT') { setLoading(false); setError(ar ? 'هذه الصفحة غير متاحة لهذا الحساب.' : 'This page is not available for this account.'); return; }
      setSuperAdmin(session.user.role === 'SUPER_ADMIN'); setAuthorized(true); void load();
    }); return () => { active = false; };
  }, [admin, ar, load, pathname, router]);
  const issue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!audience.schoolId || !audience.grade || !audience.studentIds.length) { setError(ar ? 'اختر الصف وحدد الطلاب أولًا.' : 'Choose a grade and select students first.'); return; }
    const form = event.currentTarget; const original = new FormData(form); const file = original.get('file') as File;
    if (!file || !file.size || file.size > 8 * 1024 * 1024) { setError(ar ? 'اختر ملف شهادة بحجم لا يزيد عن 8 ميجابايت.' : 'Choose a certificate file up to 8 MB.'); return; }
    setBusy(true); setError(''); setMessage('');
    const processed = new Set<string>(); let created = 0; let duplicates = 0;
    try {
      // Bounded transactions keep large grade sends manageable. Completed batches stay visible on a later failure.
      for (let offset = 0; offset < audience.studentIds.length; offset += 100) {
        const ids = audience.studentIds.slice(offset, offset + 100);
        setProgress(ar ? 'جارٍ الإرسال: ' + offset + ' من ' + audience.studentIds.length : 'Sending: ' + offset + ' of ' + audience.studentIds.length);
        const data = new FormData(); data.set('file', file); data.set('title', String(original.get('title') || '')); data.set('message', String(original.get('message') || ''));
        data.set('schoolId', audience.schoolId); data.set('grade', audience.grade); data.set('studentIds', JSON.stringify(ids));
        const response = await apiFetch('/api/certificates', { method: 'POST', body: data });
        if (!response.ok) throw new Error(response.status === 400 ? 'file' : response.status === 409 ? 'audience' : 'save');
        const saved: { created: number; duplicates: number } = await response.json();
        created += saved.created; duplicates += saved.duplicates; ids.forEach(id => processed.add(id));
      }
      form.reset(); setAudience(old => ({ ...old, studentIds: [] })); await load();
      setMessage(ar ? 'تم إرسال ' + created + ' شهادة وإشعار للطلاب. الشهادات المحفوظة مسبقًا: ' + duplicates + '؛ لم تُكرر.' : 'Sent ' + created + ' certificates and notified the students. Already saved: ' + duplicates + '; no duplicates created.');
    } catch (err) {
      setAudience(old => ({ ...old, studentIds: old.studentIds.filter(id => !processed.has(id)) }));
      await load();
      const reason = err instanceof Error && err.message === 'file' ? (ar ? 'راجع الملف والبيانات: PDF ثابت أو صورة PNG أو JPG أو WebP، حتى 8 ميجابايت.' : 'Check the file and details: static PDF or PNG, JPG, WebP, up to 8 MB.') : err instanceof Error && err.message === 'audience' ? (ar ? 'تغيرت بيانات بعض الطلاب. أعد اختيار الصف لتحميل القائمة المحدثة.' : 'Some students changed school or grade. Select the grade again to refresh its roster.') : (ar ? 'تعذر إكمال الإرسال. راجع الاتصال وأعد المحاولة للطلاب المتبقين.' : 'Could not complete sending. Check the connection and retry for the remaining students.');
      setError((ar ? 'اكتمل حفظ ' + processed.size + ' من ' + audience.studentIds.length + '. ' : 'Saved for ' + processed.size + ' of ' + audience.studentIds.length + ' students. ') + reason);
    } finally { setBusy(false); setProgress(''); }
  };
  const openFile = async (item: Certificate, showImage = false) => {
    setBusy(true); setError('');
    try {
      const response = await apiFetch(`/api/certificates/${item.id}/file`, { cache: 'no-store' }); if (!response.ok) throw new Error();
      const blob = await response.blob(); const url = URL.createObjectURL(blob);
      if (showImage && ['image/png', 'image/webp'].includes(item.mimeType)) { closePreview(); setPreview({ url, title: item.title }); }
      else { const link = document.createElement('a'); link.href = url; link.download = item.fileName; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
    } catch { setError(ar ? 'تعذر فتح الشهادة. قد تكون المدرسة قد ألغتها.' : 'Could not open the certificate. It may have been revoked.'); }
    finally { setBusy(false); }
  };
  const revoke = async (id: string) => {
    setBusy(true); setError('');
    try { const response = await apiFetch(`/api/certificates/${id}`, { method: 'DELETE' }); if (!response.ok) throw new Error(); setRevokeId(''); await load(); setMessage(ar ? 'تم إلغاء الشهادة. النسخة والسجل محفوظان للإدارة والنسخ الاحتياطي.' : 'Certificate revoked. The file and record remain stored for administration and backups.'); }
    catch { setError(ar ? 'تعذر إلغاء الشهادة.' : 'Could not revoke the certificate.'); }
    finally { setBusy(false); }
  };
  return <DashboardLayout mainClassName={styles.main}><div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
    <LearningBackdrop/>
    <section className={styles.hero}><div><span className={styles.muted}>Klevro · {ar ? 'إنجاز يستحق التقدير' : 'Achievements worth celebrating'}</span><h1>{admin ? (ar ? 'شهادات الطلاب' : 'Student certificates') : (ar ? 'شهاداتي وإنجازاتي' : 'My certificates & achievements')}</h1><p>{admin ? (ar ? 'أرسل شهادة تقدير أو إتمام للطالب، واحفظها بأمان في سجله الدراسي.' : 'Send recognition or completion certificates and keep them securely in each student’s record.') : (ar ? 'كل شهادة من مدرستك، محفوظة لك في مكان واحد.' : 'Every certificate from your school, saved for you in one place.')}</p></div><Award size={48} className={styles.heroIcon}/></section>
    {error && <p role="alert" className={`${styles.status} ${styles.error}`}>{error}</p>}{message && <p role="status" className={styles.status}>{message}</p>}
    {authorized && admin && <section className={styles.card}><h2>{ar ? 'إرسال شهادة جديدة' : 'Send a new certificate'}</h2><p className={styles.muted}><ShieldCheck size={17} style={{ display: 'inline', verticalAlign: 'middle' }}/> {ar ? 'كل طالب محدد يستطيع الوصول لشهادته فقط. تحفظ الملفات في قاعدة البيانات وتشملها النسخ الاحتياطية الكاملة.' : 'Each selected student can access only their own certificate. Files are stored in the database and included in full backups.'}</p>
      <form className={styles.form} onSubmit={issue}><CertificateRecipients ar={ar} superAdmin={superAdmin} value={audience} onChange={setAudience} disabled={busy}/>
      <label>{ar ? 'عنوان الشهادة' : 'Certificate title'}<input className={styles.input} name="title" required maxLength={160} placeholder={ar ? 'مثال: شهادة تقدير للتميز الدراسي' : 'e.g. Certificate of academic achievement'} disabled={busy}/></label>
      <label>{ar ? 'رسالة للطالب (اختياري)' : 'Message to the student (optional)'}<textarea className={styles.input} name="message" maxLength={1000} rows={2}/></label><label className={styles.file}><span><UploadCloud size={21} style={{ display: 'inline', verticalAlign: 'middle' }}/> {ar ? 'ملف الشهادة' : 'Certificate file'}</span><input type="file" name="file" accept="application/pdf,image/png,image/jpeg,image/webp" required/><span className={styles.muted}>PDF · PNG · JPG · WebP — {ar ? 'حتى 8 ميجابايت، ملف واحد' : 'up to 8 MB, one file'}</span></label><div><button type="submit" className={styles.primary} disabled={busy || !audience.studentIds.length}><Award size={18}/>{busy ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : (ar ? `حفظ وإرسال إلى ${audience.studentIds.length} طالب` : `Save & send to ${audience.studentIds.length} students`)}</button>{progress && <p role="status" aria-live="polite">{progress}</p>}</div></form>
    </section>}
    <div className={styles.toolbar}><h2>{admin ? (ar ? 'سجل الشهادات' : 'Certificate register') : (ar ? 'شهاداتك المحفوظة' : 'Your saved certificates')}</h2>{authorized && <button className={styles.secondary} onClick={() => load()} disabled={loading}>{ar ? 'تحديث' : 'Refresh'}</button>}</div>
    {loading && !items.length ? <p role="status">{ar ? 'جارٍ تحميل الشهادات…' : 'Loading certificates…'}</p> : !items.length && !error ? <div className={styles.empty}><Award size={45}/><h2>{ar ? 'شهادات الإنجاز تبدأ من هنا' : 'Achievements start here'}</h2><p>{admin ? (ar ? 'أرسل أول شهادة من النموذج بالأعلى.' : 'Send the first certificate using the form above.') : (ar ? 'ستظهر هنا الشهادات التي ترسلها لك مدرستك.' : 'Certificates sent by your school will appear here.')}</p></div> : <div className={styles.grid}>{items.map(item => <article key={item.id} className={`${styles.card} ${styles.certificate}`}><div className={styles.preview}><Award size={72} strokeWidth={1.4}/></div><small>{item.school.name}</small><h2>{item.title}</h2>{admin && <p>{item.student.name} · <bdi>{item.student.username}</bdi></p>}{item.message && <p>{item.message}</p>}<time className={styles.date} dateTime={item.createdAt}>{new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeZone: 'Africa/Cairo' }).format(new Date(item.createdAt))}</time><p className={styles.muted}>{item.mimeType === 'application/pdf' ? <FileText size={17} style={{ display: 'inline' }}/> : <FileImage size={17} style={{ display: 'inline' }}/>} <bdi>{item.fileName}</bdi> · {(item.byteSize / 1024 / 1024).toFixed(2)} MB</p>
      {item.revokedAt ? <p className={styles.status}>{ar ? 'شهادة ملغاة — محفوظة في السجل' : 'Revoked — retained in the register'}</p> : <div className={styles.actions}><button className={styles.primary} disabled={busy} onClick={() => openFile(item)}><Download size={17}/>{ar ? 'تحميل الشهادة' : 'Download certificate'}</button>{['image/png', 'image/webp'].includes(item.mimeType) && <button className={styles.secondary} disabled={busy} onClick={() => openFile(item, true)}>{ar ? 'معاينة' : 'Preview'}</button>}{admin && <button className={styles.secondary} disabled={busy} onClick={() => setRevokeId(item.id)}>{ar ? 'إلغاء الشهادة' : 'Revoke certificate'}</button>}</div>}
      {revokeId === item.id && <div className={styles.status}><p>{ar ? 'ستختفي الشهادة من حساب الطالب ويتوقف تنزيلها. يظل ملفها محفوظًا في سجل الإدارة. تأكيد الإلغاء؟' : 'The student will no longer see or download this certificate. The file stays in the admin register. Revoke it?'}</p><div className={styles.actions}><button className={styles.primary} disabled={busy} onClick={() => revoke(item.id)}>{ar ? 'تأكيد الإلغاء' : 'Confirm revocation'}</button><button className={styles.secondary} onClick={() => setRevokeId('')}>{ar ? 'تراجع' : 'Cancel'}</button></div></div>}</article>)}</div>}
    {items.length < total && <button className={styles.secondary} disabled={loading} onClick={() => load(items.length)}>{ar ? 'عرض المزيد' : 'Load more'}</button>}
    {preview && <div style={{ position: 'fixed', inset: 0, zIndex: 180, background: '#15152baa', display: 'grid', placeItems: 'center', padding: 18 }} onClick={closePreview}><div ref={modal} role="dialog" aria-modal="true" aria-labelledby="certificate-preview-title" tabIndex={-1} className={styles.card} style={{ width: 'min(900px,100%)', maxHeight: '90dvh', overflow: 'auto' }} onClick={event => event.stopPropagation()}><div className={styles.row}><h2 id="certificate-preview-title">{preview.title}</h2><button className={styles.close} onClick={closePreview} aria-label={ar ? 'إغلاق المعاينة' : 'Close preview'}><X size={20}/></button></div>{/* Private image is decoded from an authenticated response, never a public URL. */}<img src={preview.url} alt={preview.title} style={{ width: '100%', height: 'auto', marginTop: 16 }}/></div></div>}
  </div></DashboardLayout>;
}
