'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL, apiFetch } from '@/lib/api';

export default function StudentActivityReporter() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === '/' || pathname.includes('login')) return;
    const controller = new AbortController(); let student = false, lastInteraction = Date.now();
    const interact = () => { lastInteraction = Date.now(); };
    const record = () => {
      if (student && !document.hidden && Date.now() - lastInteraction < 120000) void apiFetch(`${API_URL}/learning/activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: controller.signal }).catch(() => {});
    };
    void apiFetch(`${API_URL}/auth/me`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) return; const data = await response.json(); student = data.user?.role === 'STUDENT'; record();
    }).catch(() => {});
    for (const event of ['pointerdown', 'keydown', 'scroll']) window.addEventListener(event, interact, { passive: true });
    const timer = setInterval(record, 60000);
    return () => { controller.abort(); clearInterval(timer); for (const event of ['pointerdown', 'keydown', 'scroll']) window.removeEventListener(event, interact); };
  }, [pathname]);
  return null;
}
