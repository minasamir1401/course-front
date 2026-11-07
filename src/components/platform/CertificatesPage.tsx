'use client';
/* eslint-disable @next/next/no-img-element -- Authenticated blob previews must stay in this browser and bypass the image optimizer. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Award, Download, FileImage, FileText, UploadCloud, X, ShieldCheck, Printer } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/lib/api';
import { checkAuthSession } from '@/lib/auth';
import { useModalFocus } from '@/hooks/useModalFocus';
import styles from './Platform.module.css';
import LearningBackdrop from '@/components/student/LearningBackdrop';
import CertificateRecipients, { type CertificateAudience } from './CertificateRecipients';

type Certificate = {
  id: string;
  title: string;
  message: string | null;
  fileName: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
  revokedAt: string | null;
  student: { name: string; username: string };
  school: { name: string };
  issuer: { name: string };
};

async function renderCertificateTemplateBlob(opts: {
  ar: boolean;
  schoolName: string;
  title: string;
  studentName: string;
  courseName: string;
  message: string;
  issueDate: string;
  issuerName: string;
}): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 990;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'certificate.png', { type: 'image/png' });
  }

  const grad = ctx.createLinearGradient(0, 0, 1400, 990);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#f8f7ff');
  grad.addColorStop(1, '#eef2ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1400, 990);

  ctx.strokeStyle = '#3730a3';
  ctx.lineWidth = 8;
  ctx.strokeRect(42, 42, 1316, 906);
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, 1284, 874);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4338ca';
  ctx.font = 'bold 26px Cairo, Segoe UI, Arial, sans-serif';
  ctx.fillText(opts.schoolName || 'Klevro Learning Platform', 700, 150);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 54px Cairo, Segoe UI, Arial, sans-serif';
  ctx.fillText(opts.title || (opts.ar ? 'شهادة تقدير وتميز' : 'Certificate of Achievement'), 700, 260);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 26px Cairo, Segoe UI, Arial, sans-serif';
  ctx.fillText(opts.ar ? 'تُمنح هذه الشهادة بكل فخر واعتزاز إلى الطالب / الطالبة:' : 'This certificate is proudly presented to:', 700, 355);

  ctx.fillStyle = '#3730a3';
  ctx.font = '900 60px Cairo, Segoe UI, Arial, sans-serif';
  ctx.fillText(opts.studentName || (opts.ar ? 'الطالب المتميز' : 'Distinguished Student'), 700, 455);

  ctx.strokeStyle = '#c7d2fe';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 485);
  ctx.lineTo(1050, 485);
  ctx.stroke();

  if (opts.courseName) {
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 30px Cairo, Segoe UI, Arial, sans-serif';
    ctx.fillText(`${opts.ar ? 'المادة / المقرر:' : 'Course / Subject:'} ${opts.courseName}`, 700, 565);
  }

  ctx.fillStyle = '#334155';
  ctx.font = '600 26px Cairo, Segoe UI, Arial, sans-serif';
  const bodyText = opts.message || (opts.ar ? 'تقديرًا للالتزام والتفوق الدراسي والأداء المتميز خلال الفترة الدراسية.' : 'In recognition of outstanding academic dedication, progress, and achievement.');
  ctx.fillText(bodyText.slice(0, 110), 700, 645);
  if (bodyText.length > 110) {
    ctx.fillText(bodyText.slice(110, 220), 700, 690);
  }

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 24px Cairo, Segoe UI, Arial, sans-serif';
  ctx.fillText(`${opts.ar ? 'التاريخ:' : 'Date:'} ${opts.issueDate}`, 340, 845);
  ctx.fillText(`${opts.ar ? 'إشراف واعتماد:' : 'Authorized by:'} ${opts.issuerName}`, 1060, 845);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    return new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'certificate.png', { type: 'image/png' });
  }
  return new File([blob], 'certificate-template.png', { type: 'image/png' });
}

export default function CertificatesPage() {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const router = useRouter();
  const pathname = usePathname();
  const admin = pathname.startsWith('/school-admin') || pathname.startsWith('/super-admin');

  const [authorized, setAuthorized] = useState(false);
  const [items, setItems] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [superAdmin, setSuperAdmin] = useState(false);
  const [issuerDefault, setIssuerDefault] = useState('');
  const [audience, setAudience] = useState<CertificateAudience>({ schoolId: '', grade: '', studentIds: [] });
  const [selectedStudents, setSelectedStudents] = useState<{ id: string; name: string; username: string }[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [progress, setProgress] = useState('');
  const [revokeId, setRevokeId] = useState('');
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const modal = useRef<HTMLDivElement>(null);

  const [certTitle, setCertTitle] = useState('');
  const [certCourse, setCertCourse] = useState('');
  const [certMessage, setCertMessage] = useState('');
  const [certCustomStudent, setCertCustomStudent] = useState('');
  const [certDate, setCertDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [certIssuer, setCertIssuer] = useState('');

  const closePreview = useCallback(() => {
    setPreview(old => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
  }, []);
  useModalFocus(!!preview, modal, closePreview);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch(`/api/certificates?offset=${offset}`, { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(old => (offset ? [...old, ...data.items] : data.items));
      setTotal(data.total);
    } catch {
      setError(ar ? 'تعذر تحميل الشهادات. حاول مرة أخرى.' : 'Could not load certificates. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    let active = true;
    checkAuthSession().then(session => {
      if (!active) return;
      if (!session.authenticated) {
        router.replace(admin ? (pathname.startsWith('/super-admin') ? '/super-admin/login' : '/school-admin/login') : '/login');
        return;
      }
      if (admin ? !['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(session.user.role) : session.user.role !== 'STUDENT') {
        setLoading(false);
        setError(ar ? 'هذه الصفحة غير متاحة لهذا الحساب.' : 'This page is not available for this account.');
        return;
      }
      setSuperAdmin(session.user.role === 'SUPER_ADMIN');
      setIssuerDefault(session.user.name || '');
      setCertIssuer(prev => prev || session.user.name || '');
      setAuthorized(true);
      void load();
    });
    return () => { active = false; };
  }, [admin, ar, load, pathname, router]);

  const handleSelectedStudentsChange = useCallback((students: { id: string; name: string; username: string }[], sName: string) => {
    setSelectedStudents(students);
    if (sName) setSchoolName(sName);
  }, []);

  const issue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!audience.schoolId || !audience.grade || !audience.studentIds.length) {
      setError(ar ? 'اختر الصف وحدد الطلاب أولًا.' : 'Choose a grade and select students first.');
      return;
    }
    const form = event.currentTarget;
    const original = new FormData(form);
    const uploadedFile = original.get('file') as File | null;
    const titleVal = String(original.get('title') || certTitle || '').trim();
    const msgVal = String(original.get('message') || certMessage || '').trim();

    let fileToSend: File | null = uploadedFile && uploadedFile.size > 0 ? uploadedFile : null;
    if (fileToSend && fileToSend.size > 8 * 1024 * 1024) {
      setError(ar ? 'اختر ملف شهادة بحجم لا يزيد عن 8 ميجابايت.' : 'Choose a certificate file up to 8 MB.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    const processed = new Set<string>();
    let created = 0;
    let duplicates = 0;
    try {
      if (!fileToSend) {
        const displayStudentName =
          selectedStudents.length === 1
            ? selectedStudents[0].name
            : certCustomStudent.trim() || (ar ? 'طالب متفوق' : 'Honored Student');
        fileToSend = await renderCertificateTemplateBlob({
          ar,
          schoolName: schoolName || 'Klevro',
          title: titleVal,
          studentName: displayStudentName,
          courseName: certCourse.trim(),
          message: msgVal,
          issueDate: certDate,
          issuerName: certIssuer.trim() || issuerDefault || 'Klevro',
        });
      }

      for (let offset = 0; offset < audience.studentIds.length; offset += 100) {
        const ids = audience.studentIds.slice(offset, offset + 100);
        setProgress(ar ? 'جارٍ الإرسال: ' + offset + ' من ' + audience.studentIds.length : 'Sending: ' + offset + ' of ' + audience.studentIds.length);
        const data = new FormData();
        data.set('file', fileToSend);
        data.set('title', titleVal);
        data.set('message', msgVal);
        data.set('schoolId', audience.schoolId);
        data.set('grade', audience.grade);
        data.set('studentIds', JSON.stringify(ids));
        const response = await apiFetch('/api/certificates', { method: 'POST', body: data });
        if (!response.ok) throw new Error(response.status === 400 ? 'file' : response.status === 409 ? 'audience' : 'save');
        const saved: { created: number; duplicates: number } = await response.json();
        created += saved.created;
        duplicates += saved.duplicates;
        ids.forEach(id => processed.add(id));
      }
      form.reset();
      setCertTitle('');
      setCertMessage('');
      setAudience(old => ({ ...old, studentIds: [] }));
      await load();
      setMessage(
        ar
          ? 'تم إرسال ' + created + ' شهادة وإشعار للطلاب. الشهادات المحفوظة مسبقًا: ' + duplicates + '؛ لم تُكرر.'
          : 'Sent ' + created + ' certificates and notified the students. Already saved: ' + duplicates + '; no duplicates created.'
      );
    } catch (err) {
      setAudience(old => ({ ...old, studentIds: old.studentIds.filter(id => !processed.has(id)) }));
      await load();
      const reason =
        err instanceof Error && err.message === 'file'
          ? ar
            ? 'راجع الملف والبيانات: PDF ثابت أو صورة PNG أو JPG أو WebP، حتى 8 ميجابايت.'
            : 'Check the file and details: static PDF or PNG, JPG, WebP, up to 8 MB.'
          : err instanceof Error && err.message === 'audience'
            ? ar
              ? 'تغيرت بيانات بعض الطلاب. أعد اختيار الصف لتحميل القائمة المحدثة.'
              : 'Some students changed school or grade. Select the grade again to refresh its roster.'
            : ar
              ? 'تعذر إكمال الإرسال. راجع الاتصال وأعد المحاولة للطلاب المتبقين.'
              : 'Could not complete sending. Check the connection and retry for the remaining students.';
      setError((ar ? 'اكتمل حفظ ' + processed.size + ' من ' + audience.studentIds.length + '. ' : 'Saved for ' + processed.size + ' of ' + audience.studentIds.length + ' students. ') + reason);
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const openFile = async (item: Certificate, showImage = false) => {
    setBusy(true);
    setError('');
    try {
      const response = await apiFetch(`/api/certificates/${item.id}/file`, { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (showImage && ['image/png', 'image/webp'].includes(item.mimeType)) {
        closePreview();
        setPreview({ url, title: item.title });
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = item.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch {
      setError(ar ? 'تعذر فتح الشهادة. قد تكون المدرسة قد ألغتها.' : 'Could not open the certificate. It may have been revoked.');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      const response = await apiFetch(`/api/certificates/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setRevokeId('');
      await load();
      setMessage(ar ? 'تم إلغاء الشهادة. النسخة والسجل محفوظان للإدارة والنسخ الاحتياطي.' : 'Certificate revoked. The file and record remain stored for administration and backups.');
    } catch {
      setError(ar ? 'تعذر إلغاء الشهادة.' : 'Could not revoke the certificate.');
    } finally {
      setBusy(false);
    }
  };

  const previewStudentList =
    selectedStudents.length > 0
      ? selectedStudents.map(s => s.name)
      : [certCustomStudent.trim() || (ar ? 'اسم الطالب يظهر هنا' : 'Student Name Here')];

  return (
    <DashboardLayout mainClassName={styles.main}>
      <div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
        <LearningBackdrop />
        <section className={styles.hero}>
          <div>
            <span className={styles.muted}>Klevro · {ar ? 'إنجاز يستحق التقدير' : 'Achievements worth celebrating'}</span>
            <h1>{admin ? (ar ? 'شهادات الطلاب' : 'Student certificates') : (ar ? 'شهاداتي وإنجازاتي' : 'My certificates & achievements')}</h1>
            <p>
              {admin
                ? (ar ? 'املأ بيانات القالب الجاهز واطبع الشهادات فورًا أو أرسلها لسجل كل طالب بضغطة واحدة.' : 'Fill in the fixed certificate template to print immediately or send directly to each student’s record.')
                : (ar ? 'كل شهادة من مدرستك، محفوظة لك في مكان واحد.' : 'Every certificate from your school, saved for you in one place.')}
            </p>
          </div>
          <Award size={48} className={styles.heroIcon} />
        </section>

        {error && <p role="alert" className={`${styles.status} ${styles.error}`}>{error}</p>}
        {message && <p role="status" className={styles.status}>{message}</p>}

        {authorized && admin && (
          <>
            <section className={styles.card}>
              <h2>{ar ? 'إصدار وطباعة شهادة (قالب جاهز ثابت)' : 'Issue & print certificate (Fixed template)'}</h2>
              <p className={styles.muted}>
                <ShieldCheck size={17} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                {ar
                  ? 'اختر الطلاب واملأ بيانات القالب بالأسفل لطباعة الشهادات مباشرة أو إرسالها لحساب كل طالب تلقائيًا بدون الحاجة لتصميم ملف خارجي.'
                  : 'Select students and fill in the template fields below to print immediately or send directly without needing an external file.'}
              </p>

              <form className={styles.form} onSubmit={issue}>
                <CertificateRecipients
                  ar={ar}
                  superAdmin={superAdmin}
                  value={audience}
                  onChange={setAudience}
                  onSelectedStudentsChange={handleSelectedStudentsChange}
                  disabled={busy}
                />

                <div className={styles.presetBar} role="group" aria-label={ar ? 'قوالب سريعة للعنوان' : 'Quick title presets'}>
                  {[
                    ar ? 'شهادة تقدير للتميز الدراسي' : 'Certificate of Academic Excellence',
                    ar ? 'شهادة إتمام المقرر بنجاح' : 'Course Completion Certificate',
                    ar ? 'شهادة التزام وتفوق' : 'Dedication & Achievement Award',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={styles.presetBtn}
                      onClick={() => setCertTitle(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label>
                  {ar ? 'عنوان الشهادة' : 'Certificate title'}
                  <input
                    className={styles.input}
                    name="title"
                    required
                    maxLength={160}
                    value={certTitle}
                    onChange={e => setCertTitle(e.target.value)}
                    placeholder={ar ? 'مثال: شهادة تقدير للتميز الدراسي' : 'e.g. Certificate of academic achievement'}
                    disabled={busy}
                  />
                </label>

                <div className={styles.formRow}>
                  <label>
                    {ar ? 'المادة أو الإنجاز (في القالب)' : 'Course or achievement'}
                    <input
                      className={styles.input}
                      value={certCourse}
                      onChange={e => setCertCourse(e.target.value)}
                      maxLength={120}
                      placeholder={ar ? 'مثال: الرياضيات — الوحدة الأولى' : 'e.g. Mathematics — Unit 1'}
                      disabled={busy}
                    />
                  </label>
                  <label>
                    {ar ? 'تاريخ الإصدار' : 'Issue date'}
                    <input
                      type="date"
                      className={styles.input}
                      value={certDate}
                      onChange={e => setCertDate(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <label>
                    {ar ? 'اسم المعتمد / التوقيع' : 'Authorized signature'}
                    <input
                      className={styles.input}
                      value={certIssuer}
                      onChange={e => setCertIssuer(e.target.value)}
                      maxLength={120}
                      placeholder={ar ? 'اسم المعلم أو إدارة المدرسة' : 'Teacher or school administration'}
                      disabled={busy}
                    />
                  </label>
                </div>

                {!selectedStudents.length && (
                  <label>
                    {ar ? 'اسم الطالب للمعاينة أو الطباعة السريعة (اختياري عند تحديد الطلاب أعلاه)' : 'Student name for quick print preview (optional when students are selected above)'}
                    <input
                      className={styles.input}
                      value={certCustomStudent}
                      onChange={e => setCertCustomStudent(e.target.value)}
                      maxLength={120}
                      placeholder={ar ? 'اكتب اسم الطالب للطباعة الفورية أو حدد الطلاب من القائمة أعلاه' : 'Type student name for instant print or select students above'}
                      disabled={busy}
                    />
                  </label>
                )}

                <label>
                  {ar ? 'رسالة للطالب (اختياري)' : 'Message to the student (optional)'}
                  <textarea
                    className={styles.input}
                    name="message"
                    maxLength={1000}
                    rows={2}
                    value={certMessage}
                    onChange={e => setCertMessage(e.target.value)}
                    placeholder={ar ? 'تقديرًا لجهودك المتميزة وتفوقك المستمر...' : 'In recognition of your dedication and outstanding progress...'}
                  />
                </label>

                {/* Live Fixed Certificate Template Preview */}
                <div className={styles.templateSheet} aria-label={ar ? 'معاينة قالب الشهادة الجاهز' : 'Certificate template preview'}>
                  <div className={styles.templateHeader}>{schoolName || 'Klevro Learning Platform'}</div>
                  <div className={styles.templateTitle}>{certTitle || (ar ? 'شهادة تقدير للتميز الدراسي' : 'Certificate of Academic Achievement')}</div>
                  <div className={styles.templateSubtitle}>
                    {ar ? 'تُمنح هذه الشهادة بكل فخر واعتزاز إلى الطالب / الطالبة:' : 'This certificate is proudly presented to:'}
                  </div>
                  <div className={styles.templateStudent}>
                    {previewStudentList[0]}
                    {previewStudentList.length > 1 ? ` (+${previewStudentList.length - 1})` : ''}
                  </div>
                  {certCourse && (
                    <div className={styles.templateSubtitle} style={{ fontWeight: 800, color: '#1e293b' }}>
                      {ar ? 'المادة / المقرر: ' : 'Course / Subject: '}
                      {certCourse}
                    </div>
                  )}
                  <p className={styles.templateBody}>
                    {certMessage || (ar ? 'تقديرًا للالتزام والتفوق الدراسي والأداء المتميز خلال الفترة الدراسية.' : 'In recognition of outstanding academic dedication, progress, and achievement.')}
                  </p>
                  <div className={styles.templateFooter}>
                    <span>{ar ? 'التاريخ: ' : 'Date: '}{certDate}</span>
                    <span>{ar ? 'إشراف واعتماد: ' : 'Authorized by: '}{certIssuer || issuerDefault || 'Klevro'}</span>
                  </div>
                </div>

                <label className={styles.file}>
                  <span>
                    <UploadCloud size={21} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                    {ar ? 'ملف الشهادة (اختياري — يُحفظ القالب الثابت أعلاه تلقائيًا عند تركه فارغًا)' : 'Certificate file (optional — fixed template above is used automatically if left blank)'}
                  </span>
                  <input type="file" name="file" accept="application/pdf,image/png,image/jpeg,image/webp" />
                  <span className={styles.muted}>PDF · PNG · JPG · WebP — {ar ? 'حتى 8 ميجابايت، أو اتركه فارغًا لاستخدام القالب الجاهز' : 'up to 8 MB, or leave blank to use the built-in template'}</span>
                </label>

                <div className={styles.actions}>
                  <button type="submit" className={styles.primary} disabled={busy || !audience.studentIds.length}>
                    <Award size={18} />
                    {busy ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : (ar ? `حفظ وإرسال إلى ${audience.studentIds.length} طالب` : `Save & send to ${audience.studentIds.length} students`)}
                  </button>
                  <button type="button" className={styles.secondary} onClick={() => window.print()}>
                    <Printer size={18} />
                    {ar ? `طباعة القالب الآن (${previewStudentList.length})` : `Print certificate template (${previewStudentList.length})`}
                  </button>
                  {progress && <p role="status" aria-live="polite">{progress}</p>}
                </div>
              </form>
            </section>

            {/* Printable pages for each selected student when printing */}
            <div className={styles.printOnlyCertificates} aria-hidden="true">
              {previewStudentList.map((stName, idx) => (
                <div key={`${stName}-${idx}`} className={styles.printCertPage}>
                  <div className={styles.templateSheet}>
                    <div className={styles.templateHeader}>{schoolName || 'Klevro Learning Platform'}</div>
                    <div className={styles.templateTitle}>{certTitle || (ar ? 'شهادة تقدير للتميز الدراسي' : 'Certificate of Academic Achievement')}</div>
                    <div className={styles.templateSubtitle}>
                      {ar ? 'تُمنح هذه الشهادة بكل فخر واعتزاز إلى الطالب / الطالبة:' : 'This certificate is proudly presented to:'}
                    </div>
                    <div className={styles.templateStudent}>{stName}</div>
                    {certCourse && (
                      <div className={styles.templateSubtitle} style={{ fontWeight: 800, color: '#1e293b' }}>
                        {ar ? 'المادة / المقرر: ' : 'Course / Subject: '}
                        {certCourse}
                      </div>
                    )}
                    <p className={styles.templateBody}>
                      {certMessage || (ar ? 'تقديرًا للالتزام والتفوق الدراسي والأداء المتميز خلال الفترة الدراسية.' : 'In recognition of outstanding academic dedication, progress, and achievement.')}
                    </p>
                    <div className={styles.templateFooter}>
                      <span>{ar ? 'التاريخ: ' : 'Date: '}{certDate}</span>
                      <span>{ar ? 'إشراف واعتماد: ' : 'Authorized by: '}{certIssuer || issuerDefault || 'Klevro'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.toolbar}>
          <h2>{admin ? (ar ? 'سجل الشهادات' : 'Certificate register') : (ar ? 'شهاداتك المحفوظة' : 'Your saved certificates')}</h2>
          {authorized && (
            <button className={styles.secondary} onClick={() => load()} disabled={loading}>
              {ar ? 'تحديث' : 'Refresh'}
            </button>
          )}
        </div>

        {loading && !items.length ? (
          <p role="status">{ar ? 'جارٍ تحميل الشهادات…' : 'Loading certificates…'}</p>
        ) : !items.length && !error ? (
          <div className={styles.empty}>
            <Award size={45} />
            <h2>{ar ? 'شهادات الإنجاز تبدأ من هنا' : 'Achievements start here'}</h2>
            <p>{admin ? (ar ? 'أرسل أول شهادة من النموذج بالأعلى.' : 'Send the first certificate using the form above.') : (ar ? 'ستظهر هنا الشهادات التي ترسلها لك مدرستك.' : 'Certificates sent by your school will appear here.')}</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map(item => (
              <article key={item.id} className={`${styles.card} ${styles.certificate}`}>
                <div className={styles.preview}><Award size={72} strokeWidth={1.4} /></div>
                <small>{item.school.name}</small>
                <h2>{item.title}</h2>
                {admin && <p>{item.student.name} · <bdi>{item.student.username}</bdi></p>}
                {item.message && <p>{item.message}</p>}
                <time className={styles.date} dateTime={item.createdAt}>
                  {new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeZone: 'Africa/Cairo' }).format(new Date(item.createdAt))}
                </time>
                <p className={styles.muted}>
                  {item.mimeType === 'application/pdf' ? <FileText size={17} style={{ display: 'inline' }} /> : <FileImage size={17} style={{ display: 'inline' }} />}{' '}
                  <bdi>{item.fileName}</bdi> · {(item.byteSize / 1024 / 1024).toFixed(2)} MB
                </p>
                {item.revokedAt ? (
                  <p className={styles.status}>{ar ? 'شهادة ملغاة — محفوظة في السجل' : 'Revoked — retained in the register'}</p>
                ) : (
                  <div className={styles.actions}>
                    <button className={styles.primary} disabled={busy} onClick={() => openFile(item)}>
                      <Download size={17} />{ar ? 'تحميل الشهادة' : 'Download certificate'}
                    </button>
                    {['image/png', 'image/webp'].includes(item.mimeType) && (
                      <button className={styles.secondary} disabled={busy} onClick={() => openFile(item, true)}>
                        {ar ? 'معاينة' : 'Preview'}
                      </button>
                    )}
                    {admin && (
                      <button className={styles.secondary} disabled={busy} onClick={() => setRevokeId(item.id)}>
                        {ar ? 'إلغاء الشهادة' : 'Revoke certificate'}
                      </button>
                    )}
                  </div>
                )}
                {revokeId === item.id && (
                  <div className={styles.status}>
                    <p>{ar ? 'ستختفي الشهادة من حساب الطالب ويتوقف تنزيلها. يظل ملفها محفوظًا في سجل الإدارة. تأكيد الإلغاء؟' : 'The student will no longer see or download this certificate. The file stays in the admin register. Revoke it?'}</p>
                    <div className={styles.actions}>
                      <button className={styles.primary} disabled={busy} onClick={() => revoke(item.id)}>{ar ? 'تأكيد الإلغاء' : 'Confirm revocation'}</button>
                      <button className={styles.secondary} onClick={() => setRevokeId('')}>{ar ? 'تراجع' : 'Cancel'}</button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {items.length < total && (
          <button className={styles.secondary} disabled={loading} onClick={() => load(items.length)}>
            {ar ? 'عرض المزيد' : 'Load more'}
          </button>
        )}

        {preview && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 180, background: '#15152baa', display: 'grid', placeItems: 'center', padding: 18 }} onClick={closePreview}>
            <div ref={modal} role="dialog" aria-modal="true" aria-labelledby="certificate-preview-title" tabIndex={-1} className={styles.card} style={{ width: 'min(900px,100%)', maxHeight: '90dvh', overflow: 'auto' }} onClick={event => event.stopPropagation()}>
              <div className={styles.row}>
                <h2 id="certificate-preview-title">{preview.title}</h2>
                <button className={styles.close} onClick={closePreview} aria-label={ar ? 'إغلاق المعاينة' : 'Close preview'}>
                  <X size={20} />
                </button>
              </div>
              <img src={preview.url} alt={preview.title} style={{ width: '100%', height: 'auto', marginTop: 16 }} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
