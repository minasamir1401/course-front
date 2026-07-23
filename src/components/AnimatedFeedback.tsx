"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface AnimatedFeedbackProps {
  isCorrect: boolean;
  xp?: number;
  streak?: number;
  onComplete?: () => void;
}

export default function AnimatedFeedback({ isCorrect, xp, streak, onComplete }: AnimatedFeedbackProps) {
  const [visible, setVisible] = useState(true);
  const [animPhase, setAnimPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    setVisible(true);
    setAnimPhase('enter');

    const enterTimer = setTimeout(() => setAnimPhase('show'), 80);
    const exitTimer = setTimeout(() => {
      setAnimPhase('exit');
    }, 900);
    const doneTimer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1150);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [isCorrect]);

  if (!visible) return null;

  const isEnter = animPhase === 'enter';
  const isExit = animPhase === 'exit';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        opacity: isEnter ? 0 : isExit ? 0 : 1,
        transition: isEnter ? 'opacity 0.08s' : 'opacity 0.25s ease-out',
      }}
    >
      <div
        style={{
          transform: isEnter ? 'scale(0.5) translateY(30px)' : isExit ? 'scale(0.8) translateY(-20px)' : 'scale(1) translateY(0)',
          transition: isEnter ? 'transform 0.08s' : isExit ? 'transform 0.25s ease-in' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className="relative flex flex-col items-center justify-center"
      >
        {/* Main feedback circle */}
        <div className="relative">
          {isCorrect ? (
            <div
              className="relative rounded-[40px] w-44 h-44 flex items-center justify-center shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 0 60px rgba(16,185,129,0.6), 0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              {/* Pulse rings */}
              {!isExit && (
                <>
                  <div className="absolute inset-0 rounded-[40px] animate-ping" style={{ background: 'rgba(16,185,129,0.2)', animationDuration: '0.8s' }} />
                  <div className="absolute inset-[-8px] rounded-[48px] animate-ping" style={{ background: 'rgba(16,185,129,0.1)', animationDuration: '0.8s', animationDelay: '0.1s' }} />
                </>
              )}
              <CheckCircle className="w-24 h-24 text-white drop-shadow-lg" strokeWidth={2.5} />

              {/* XP badge */}
              {(xp !== undefined && xp > 0) && (
                <div
                  className="absolute -top-5 -right-5 px-4 py-2 rounded-2xl font-black text-lg shadow-xl border-2 border-white flex items-center gap-1 z-20"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#1a1a1a',
                    boxShadow: '0 4px 20px rgba(245,158,11,0.5)',
                    animation: 'xp-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) 0.15s both',
                  }}
                >
                  <span>⭐</span>
                  <span>+{xp} XP</span>
                </div>
              )}

              {/* Streak badge */}
              {(streak !== undefined && streak > 1) && (
                <div
                  className="absolute -bottom-5 -left-5 px-4 py-2 rounded-2xl font-black text-lg shadow-xl border-2 border-white flex items-center gap-1 z-20"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(249,115,22,0.5)',
                    animation: 'xp-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) 0.25s both',
                  }}
                >
                  <span>🔥</span>
                  <span>{streak}×</span>
                </div>
              )}
            </div>
          ) : (
            <div
              className="relative rounded-[40px] w-44 h-44 flex items-center justify-center shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 0 60px rgba(239,68,68,0.5), 0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              {!isExit && (
                <div className="absolute inset-0 rounded-[40px] animate-ping" style={{ background: 'rgba(239,68,68,0.2)', animationDuration: '0.8s' }} />
              )}
              <XCircle className="w-24 h-24 text-white drop-shadow-lg" strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Label */}
        <div
          className="mt-5 px-6 py-2.5 rounded-2xl font-black text-base shadow-lg backdrop-blur-sm"
          style={{
            background: isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
            color: isCorrect ? '#065f46' : '#991b1b',
            border: `2px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
            animation: 'xp-pop 0.35s cubic-bezier(0.175,0.885,0.32,1.275) 0.05s both',
          }}
        >
          {isCorrect ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة'}
        </div>
      </div>

      <style>{`
        @keyframes xp-pop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          70% { transform: scale(1.15) rotate(3deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
