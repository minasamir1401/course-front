export type CertificateArtwork = {
  ar: boolean;
  title: string;
  studentName: string;
  schoolName: string;
  course: string;
  message: string;
  date: string;
  issuer: string;
  duration: string;
  score: string;
};

export const certificateTitle = (ar: boolean) => ar ? 'شهادة إتمام' : 'Certificate of Completion';
export const certificatePlaceholder = (ar: boolean) => ar ? 'اسم الطالب' : 'Student Name Here';
export const certificateSize = { width: 1500, height: 1000 };
let paper: Promise<HTMLImageElement> | undefined;

function loadPaper() {
  paper ??= new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { paper = undefined; reject(new Error('Certificate artwork could not be loaded')); };
    image.src = '/klevro/illustrations/ui/certificate-paper.svg';
  });
  return paper;
}

const sans = 'Tahoma, "Segoe UI", Arial, sans-serif';
const script = '"Segoe Script", "URW Chancery L", "Palatino Linotype", Georgia, serif';

export async function drawCertificate(canvas: HTMLCanvasElement, data: CertificateArtwork) {
  const image = await loadPaper();
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  const { width, height } = certificateSize;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const ink = '#160f3a';
  const purple = '#4c1f9e';
  const soft = '#58496f';
  const lang = (ar: string, en: string) => data.ar ? ar : en;
  const setFont = (size: number, weight: string, face: string) => { ctx.font = `${weight} ${size}px ${face}`; };
  function wrap(value: string, maxWidth: number) {
    const lines: string[] = [];
    for (const paragraph of value.split(/\r?\n/)) {
      let line = '';
      for (const word of paragraph.trim().split(/\s+/u)) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx!.measureText(next).width > maxWidth) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      if (line) lines.push(line);
    }
    return lines;
  }
  function text(value: string, x: number, y: number, options: { size: number; width: number; color?: string; weight?: string; face?: string; rows?: number; min?: number; lineHeight?: number; height?: number }) {
    const { width: maxWidth, weight = '400', color = ink, face = sans, rows = 1, min = 12, lineHeight = 1.16 } = options;
    const content = value.trim();
    if (!content) return;
    ctx!.direction = /^[^\p{L}]*\p{Script=Arabic}/u.test(content) ? 'rtl' : 'ltr';
    ctx!.fillStyle = color;
    let size = options.size;
    let lines: string[];
    do {
      setFont(size, weight, face);
      lines = rows === 1 ? [content.replace(/\s+/g, ' ')] : wrap(content, maxWidth);
      if (lines.length <= rows && (!options.height || lines.length * size * lineHeight <= options.height) && lines.every(line => ctx!.measureText(line).width <= maxWidth)) break;
      if (size === min) break;
      size = Math.max(min, size - 2);
    } while (true);
    const visible = lines.slice(0, rows);
    if (lines.length > rows) visible[rows - 1] += '…';
    visible.forEach((line, index) => ctx!.fillText(line, x, y + (index - (visible.length - 1) / 2) * size * lineHeight, maxWidth));
  }
  const rule = (x: number, y: number, right: number, bottom = y, color = '#c8b4ef') => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(x, y);
    ctx.lineTo(right, bottom);
    ctx.stroke();
  };

  text('klevro', 744, 104, { size: 66, width: 243, weight: '900' });
  text(lang('تعلّم · تدرّب · تقدّم', 'Learn · Practice · Grow'), 756, 147, { size: 21, width: 270, color: purple, weight: '600' });
  text(lang('تقديرٌ يستحق الاحتفاء', 'CELEBRATING YOUR ACHIEVEMENT'), 1253, 112, { size: 19, width: 333, color: purple, weight: '700' });
  rule(1186, 135, 1320);
  text(data.schoolName, 750, 200, { size: 23, width: 720, color: soft, weight: '700' });
  text(data.title || certificateTitle(data.ar), 750, 271, { size: 62, width: 975, weight: '800', rows: 2, min: 24, lineHeight: 1.1 });
  rule(312, 355, 535);
  rule(965, 355, 1188);
  const completion = !data.title || data.title === certificateTitle(data.ar);
  text(lang('تُمنح هذه الشهادة إلى', completion && data.course ? 'This is to certify that' : 'This certificate is awarded to'), 750, 353, { size: 30, width: 392, color: soft, weight: '500' });

  const name = data.studentName || certificatePlaceholder(data.ar);
  const arabicName = /\p{Script=Arabic}/u.test(name);
  text(name, 750, 452, { size: 95, width: 845, height: 126, color: ink, weight: arabicName ? '700' : 'italic 600', face: arabicName ? sans : script, rows: 2, min: 30 });
  rule(367, 522, 1133, 522, '#8455ce');
  text(lang('إنجاز متميز', 'ACHIEVEMENT'), 1322, 378, { size: 14, width: 96, color: '#ffdf88', weight: '800' });

  if (data.course) {
    text(completion ? lang('لإتمام المقرر بنجاح', 'has successfully completed the course') : lang('تقديرًا للإنجاز في', 'In recognition of achievement in'), 750, 567, { size: 24, width: 760, color: soft });
    text(data.course, 750, 622, { size: 37, width: 925, color: purple, weight: '800', rows: 2, min: 23 });
  }
  const message = data.message || lang(
    'تقديرًا لجهودك وتقدّمك المتميز في رحلة التعلّم مع كليفرو.',
    'Celebrating your dedication and outstanding progress on your learning journey with Klevro.',
  );
  text(message, 750, data.course ? 709 : 639, { size: 24, width: 910, height: data.course ? 104 : 200, color: soft, rows: 8, min: 11, lineHeight: 1.18 });

  const validDate = data.date && new Date(`${data.date}T12:00:00Z`);
  const date = validDate && Number.isFinite(validDate.getTime()) ? new Intl.DateTimeFormat(lang('ar-EG', 'en-US'), { dateStyle: 'medium', timeZone: 'UTC' }).format(validDate) : '—';
  const details = [
    { label: lang('تاريخ الإصدار', 'Issue date'), value: date, icon: 'date' },
    ...(data.duration ? [{ label: lang('المدة', 'Total duration'), value: data.duration, icon: 'clock' }] : []),
    ...(data.score ? [{ label: lang('النتيجة', 'Final score'), value: data.score, icon: 'score' }] : []),
  ];
  if (data.ar) details.reverse();
  details.forEach(({ label, value, icon }, index) => {
    const x = 750 + (index - (details.length - 1) / 2) * 236;
    if (index) rule(x - 118, 790, x - 118, 856);
    ctx.save();
    ctx.translate(x, 787);
    ctx.lineWidth = 2.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#6e34cc';
    ctx.beginPath();
    if (icon === 'date') {
      ctx.roundRect(-11, -9, 22, 20, 3);
      ctx.moveTo(-11, -3); ctx.lineTo(11, -3);
      ctx.moveTo(-5, -12); ctx.lineTo(-5, -6); ctx.moveTo(5, -12); ctx.lineTo(5, -6);
      ctx.moveTo(-5, 3); ctx.lineTo(5, 3);
    } else if (icon === 'clock') {
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.moveTo(0, -5); ctx.lineTo(0, 0); ctx.lineTo(5, 3);
    } else {
      ctx.moveTo(-11, 10); ctx.lineTo(11, 10);
      ctx.moveTo(-7, 6); ctx.lineTo(-7, 1); ctx.moveTo(0, 6); ctx.lineTo(0, -4); ctx.moveTo(7, 6); ctx.lineTo(7, -10);
    }
    ctx.stroke();
    ctx.restore();
    text(label, x, 819, { size: 18, width: 219, color: soft });
    text(value, x, 847, { size: 24, width: 219, weight: '800' });
  });

  const issuer = data.issuer || 'Klevro';
  const arIssuer = /\p{Script=Arabic}/u.test(issuer);
  text(issuer, 266, 860, { size: 38, width: 270, weight: arIssuer ? '700' : 'italic 600', face: arIssuer ? sans : script });
  rule(134, 892, 398, 892, '#9f82d0');
  text(lang('التوقيع المعتمد', 'Authorized signature'), 266, 913, { size: 17, width: 270, color: soft });
  text(lang('واصل التعلّم والتقدّم', 'Keep learning. Keep growing.'), 1238, 891, { size: 23, width: 329, color: purple, weight: 'italic 700' });
}

export async function certificateFile(data: CertificateArtwork, print = false) {
  const canvas = document.createElement('canvas');
  await drawCertificate(canvas, data);
  const type = print ? 'image/png' : 'image/webp';
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.96));
  if (!blob || (!print && blob.size > 512 * 1024)) throw new Error('Certificate image could not be exported');
  return new File([blob], `klevro-certificate.${blob.type === 'image/webp' ? 'webp' : 'png'}`, { type: blob.type });
}

async function printImages(images: { title: string; getSource: () => Promise<string> }[]) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  Object.assign(frame.style, { position: 'fixed', width: '1px', height: '1px', border: '0', opacity: '0', pointerEvents: 'none' });
  document.body.append(frame);
  const urls: string[] = [];
  const clean = () => { frame.remove(); urls.forEach(url => URL.revokeObjectURL(url)); };
  try {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) throw new Error('Print document is unavailable');
    doc.title = 'Klevro · Certificates';
    const style = doc.createElement('style');
    style.textContent = '@page{size:A4 landscape;margin:8mm}body{margin:0}img{display:block;width:100%;height:192mm;object-fit:contain;break-after:page;break-inside:avoid}img:last-child{break-after:auto}';
    doc.head.append(style);
    for (const data of images) {
      const url = await data.getSource();
      urls.push(url);
      const image = doc.createElement('img');
      image.src = url;
      image.alt = data.title;
      doc.body.append(image);
      await image.decode();
    }
    win.addEventListener('afterprint', clean, { once: true });
    win.focus();
    win.print();
  } catch (error) {
    clean();
    throw error;
  }
}

export function printCertificates(certificates: CertificateArtwork[]) {
  return printImages(certificates.map(data => ({
    title: data.studentName,
    getSource: async () => URL.createObjectURL(await certificateFile(data, true)),
  })));
}

export function printCertificateImage(url: string, title: string) {
  return printImages([{ title, getSource: async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Certificate image is unavailable');
    return URL.createObjectURL(await response.blob());
  } }]);
}
