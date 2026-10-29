'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import styles from './AiAssistant.module.css';

// Analyse microphone samples locally. Nothing is recorded or sent by this meter.
export default function VoiceActivity({ ar, interim }: { ar: boolean; interim: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'connecting' | 'live' | 'unavailable'>('connecting');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let disposed = false, frame = 0;
    let stream: MediaStream | null = null, context: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    function release() {
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach(track => track.stop());
      source?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    }
    async function start() {
      try {
        const Engine = window.AudioContext || (window as any).webkitAudioContext;
        if (!Engine || !navigator.mediaDevices?.getUserMedia) throw new Error('Unavailable');
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
        // Permission can resolve after the user has already stopped dictation.
        if (disposed) { release(); return; }
        const audio = new Engine() as AudioContext;
        context = audio;
        const analyser = audio.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.65;
        source = audio.createMediaStreamSource(stream);
        source.connect(analyser); // Deliberately no connection to speakers.
        if (audio.state === 'suspended') await audio.resume();
        if (disposed) { release(); return; }
        const canvas = canvasRef.current, paint = canvas?.getContext('2d');
        if (!canvas || !paint) throw new Error('Canvas unavailable');
        const frequencies = new Uint8Array(analyser.frequencyBinCount);
        const samples = new Uint8Array(analyser.fftSize);
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const interval = 1000 / (reducedMotion ? 10 : 24);
        const bands = Array.from({ length: 40 }, (_, index) => {
          const first = Math.max(1, Math.floor(80 * Math.pow(75, index / 40) * analyser.fftSize / audio.sampleRate));
          const last = Math.min(frequencies.length, Math.max(first + 1, Math.ceil(80 * Math.pow(75, (index + 1) / 40) * analyser.fftSize / audio.sampleRate)));
          return [first, last];
        });
        let lastDraw = -Infinity, lastSpeaking = false;
        const gradient = paint.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#9f7aea'); gradient.addColorStop(0.5, '#6934d8'); gradient.addColorStop(1, '#cb73b2');
        setState('live');
        const draw = (time: number) => {
          if (disposed) return;
          frame = requestAnimationFrame(draw);
          if (time - lastDraw < interval) return;
          lastDraw = time;
          analyser.getByteFrequencyData(frequencies);
          analyser.getByteTimeDomainData(samples);
          let energy = 0;
          for (const sample of samples) energy += Math.pow((sample - 128) / 128, 2);
          const rms = Math.sqrt(energy / samples.length);
          const audible = rms > 0.012;
          if (audible !== lastSpeaking) { lastSpeaking = audible; setSpeaking(audible); }
          paint.clearRect(0, 0, canvas.width, canvas.height);
          bands.forEach(([first, last], index) => {
            let total = 0;
            for (let bin = first; bin < last; bin++) total += frequencies[bin];
            const amplitude = rms < 0.004 ? 0 : total / (last - first) / 255;
            const height = 4 + amplitude * (canvas.height - 12);
            paint.fillStyle = gradient;
            paint.globalAlpha = 0.35 + amplitude * 0.65;
            paint.beginPath();
            paint.roundRect(index * 16 + 3, (canvas.height - height) / 2, 10, height, 5);
            paint.fill();
          });
          paint.globalAlpha = 1;
        };
        frame = requestAnimationFrame(draw);
      } catch {
        release();
        if (!disposed) setState('unavailable');
      }
    }
    void start();
    return () => { disposed = true; release(); };
  }, []);

  return <div className={styles.voiceActivity} role="group" aria-label={ar ? 'ترددات صوت الميكروفون المباشرة' : 'Live microphone frequency spectrum'} data-state={state} data-level={speaking ? 'speaking' : 'quiet'}>
    <div className={styles.voiceActivityHeader}>
      <span className={styles.voiceActivityTitle}><Mic size={14}/>{ar ? 'الميكروفون يعمل' : 'Microphone on'}</span>
      <span className={styles.voiceActivityBadge}>{state === 'live' ? speaking ? (ar ? 'بسمع صوتك' : 'Sound detected') : (ar ? 'في انتظار صوتك' : 'Waiting for your voice') : state === 'connecting' ? (ar ? 'جاري توصيل الصوت…' : 'Connecting audio…') : (ar ? 'الإملاء مستمر' : 'Dictation active')}</span>
    </div>
    <canvas ref={canvasRef} width={640} height={96} className={styles.voiceSpectrum} aria-hidden="true" hidden={state !== 'live'}/>
    {state === 'unavailable' && <p className={styles.voiceActivityHint}>{ar ? 'عرض الترددات غير متاح في هذا المتصفح. يمكنك متابعة الإملاء الصوتي.' : 'The audio spectrum is unavailable in this browser. You can continue dictating.'}</p>}
    <p className={styles.voiceTranscript} dir="auto">{interim || (ar ? 'اتكلم براحتك، كلامك هيتحوّل لنص هنا…' : 'Speak naturally. Your words will appear here…')}</p>
  </div>;
}
