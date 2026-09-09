'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { remainingExamSeconds } from '@/lib/examTimer';

type Props = { initialSeconds: number; storageKey: string | null; onTick: (seconds: number) => void; onExpire: () => void };
// The one-second state belongs here, so it never rerenders the question workspace.
export default function ExamCountdown({ initialSeconds, storageKey, onTick, onExpire }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const callbacks = useRef({ onTick, onExpire });
  callbacks.current = { onTick, onExpire };
  useEffect(() => {
    const deadline = Date.now() + Math.max(0, initialSeconds) * 1000;
    let expired = false;
    const tick = () => {
      const remaining = remainingExamSeconds(deadline, Date.now());
      setSeconds(remaining);
      callbacks.current.onTick(remaining);
      if (storageKey) {
        try { localStorage.setItem(storageKey, String(remaining)); } catch { /* Storage may be full or unavailable. */ }
      }
      if (!remaining && !expired) { expired = true; callbacks.current.onExpire(); }
    };
    tick();
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [initialSeconds, storageKey]);
  return <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${seconds < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
    <Clock className="w-5 h-5" />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
  </div>;
}
