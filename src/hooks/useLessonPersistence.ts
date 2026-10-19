"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';

export function useLessonPersistence(lessonId: string, enabled: boolean) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const position = useRef(0), lastInteraction = useRef(0), inFlight = useRef(false), lastSave = useRef(0), activeSeconds = useRef(0), generation = useRef(0);
  const save = useCallback(async (seconds = 0) => {
    if (!enabled || inFlight.current) return;
    const owner = generation.current;
    inFlight.current = true; setStatus('saving');
    try {
      const res = await apiFetch(`${API_URL}/progress/lesson/${lessonId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Offline-Queue-Managed': '1' },
        body: JSON.stringify({ watchedSeconds: position.current, activeSeconds: Math.min(30, seconds) }) });
      if (!res.ok) throw new Error('Progress save failed');
      if (generation.current === owner) { activeSeconds.current = 0; lastSave.current = Date.now(); setSavedAt(new Date().toISOString()); setStatus('saved'); }
    } catch { if (generation.current === owner) setStatus('error'); }
    finally { if (generation.current === owner) inFlight.current = false; }
  }, [enabled, lessonId]);
  useEffect(() => {
    generation.current++; position.current = 0; inFlight.current = false; activeSeconds.current = 0; lastSave.current = 0;
    if (!enabled) return;
    lastInteraction.current = Date.now();
    const interact = () => { lastInteraction.current = Date.now(); };
    for (const event of ['pointerdown', 'keydown', 'scroll']) window.addEventListener(event, interact, { passive: true });
    // Start a server timestamp; the server credits only elapsed, bounded heartbeat time.
    void save();
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible' || !document.hasFocus() || Date.now() - lastInteraction.current > 90000) return;
      activeSeconds.current += 5;
      if (activeSeconds.current >= 20) void save(activeSeconds.current);
    }, 5000);
    return () => { generation.current++; clearInterval(timer); for (const event of ['pointerdown', 'keydown', 'scroll']) window.removeEventListener(event, interact); };
  }, [enabled, lessonId, save]);
  const updatePosition = useCallback((seconds: number) => {
    position.current = Math.max(position.current, Math.max(0, Math.floor(seconds)));
    lastInteraction.current = Date.now();
    if (Date.now() - lastSave.current >= 15000) void save(activeSeconds.current);
  }, [save]);
  return { saveStatus: status, lastSavedAt: savedAt, updatePosition, retrySave: () => save(activeSeconds.current) };
}
