'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { scheduleGameCue, type GameCue } from './gameAudio';
export function useGameFeedback(sound: boolean, motion: boolean) {
  const context = useRef<AudioContext | null>(null);
  const enabled = useRef({ sound, motion }), voices = useRef(new Set<OscillatorNode>()), mounted = useRef(true);
  const stop = useCallback(() => { for (const voice of voices.current) { try { voice.stop(); } catch {} } voices.current.clear(); }, []);
  useEffect(() => { enabled.current = { sound, motion }; if (!sound) stop(); }, [sound, motion, stop]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stop(); void context.current?.close().catch(() => {}); context.current = null; }; }, [stop]);
  // Run synchronously inside the user's click, including when enabling a muted session.
  const unlock = useCallback((force = false) => {
    if (!enabled.current.sound && !force) return;
    try {
      const Audio = window.AudioContext || (window as any).webkitAudioContext;
      if (!Audio) return;
      if (!context.current || context.current.state === 'closed') context.current = new Audio();
      void context.current?.resume().catch(() => {});
    } catch {}
  }, []);
  const play = useCallback(async (value: boolean | GameCue, delay = 0) => {
    const cue: GameCue = typeof value === 'boolean' ? value ? 'correct' : 'incorrect' : value;
    const audio = context.current;
    if (enabled.current.sound && audio && audio.state !== 'closed') {
      try {
        if (audio.state === 'suspended') await audio.resume();
        if (mounted.current && enabled.current.sound && audio.state === 'running') scheduleGameCue(audio, cue, delay, node => {
          voices.current.add(node);
          node.addEventListener('ended', () => voices.current.delete(node), { once: true });
        });
      } catch {}
    }
    if (mounted.current && ['correct', 'victory', 'complete'].includes(cue) && enabled.current.motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try {
        const { default: confetti } = await import('canvas-confetti');
        if (!mounted.current || !enabled.current.motion) return;
        confetti({ particleCount: cue === 'victory' ? 110 : cue === 'complete' ? 55 : 30, spread: cue === 'victory' ? 95 : 65, origin: { y: .65 }, colors: ['#7045ff', '#33d4bd', '#ffc65c', '#ff8cba'], disableForReducedMotion: true });
      } catch {}
    }
  }, []);
  return useMemo(() => ({ unlock, play }), [unlock, play]);
}
