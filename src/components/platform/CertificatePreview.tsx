'use client';
/* eslint-disable @next/next/no-img-element -- The preview uses a private blob URL. */
import { useEffect, useRef, useState } from 'react';
import { Award } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { certificateSize, drawCertificate, type CertificateArtwork } from './certificateArtwork';
import styles from './Platform.module.css';

export default function CertificatePreview({ artwork }: { artwork: CertificateArtwork }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    const target = canvas.current;
    if (!target) return;
    void drawCertificate(target, artwork).then(() => { if (live) setFailed(false); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [artwork]);
  return <>
    <canvas ref={canvas} className={styles.proofCanvas} width={certificateSize.width} height={certificateSize.height} role="img" aria-label={`${artwork.title} · ${artwork.studentName}`} hidden={failed} />
    {failed && <p role="status">{artwork.ar ? 'تعذر عرض المعاينة. أعد تحميل الصفحة للمحاولة مجددًا.' : 'The preview could not be displayed. Reload the page to try again.'}</p>}
  </>;
}

export function CertificateThumbnail({ certificateId, title, showImage }: { certificateId: string; title: string; showImage: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<{ id: string; url: string }>();
  useEffect(() => {
    if (!showImage || !container.current) return;
    const controller = new AbortController();
    let url: string | undefined;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void apiFetch(`/api/certificates/${certificateId}/file`, { cache: 'no-store', signal: controller.signal })
        .then(response => response.ok ? response.blob() : null)
        .then(blob => {
          if (!blob || controller.signal.aborted) return;
          url = URL.createObjectURL(blob);
          setImage({ id: certificateId, url });
        }).catch(() => {});
    }, { rootMargin: '150px' });
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [certificateId, showImage]);
  return <div ref={container} className={`${styles.preview} ${showImage ? styles.studentPreview : ''}`}>
    {showImage && image?.id === certificateId
      ? <img src={image.url} alt={title} onError={() => setImage(undefined)} />
      : <Award size={54} strokeWidth={1.5} aria-hidden="true" />}
  </div>;
}
