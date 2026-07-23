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
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      style={{
        opacity: isEnter ? 0 : isExit ? 0 : 1,
        transition: isEnter ? 'opacity 0.08s' : 'opacity 0.25s ease-out',
      }}
    >
      {/* --- Main Center Icon (✅ / ❌) --- */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            transform: isEnter ? 'scale(0.5) translateY(30px)' : isExit ? 'scale(0.8) translateY(-20px)' : 'scale(1) translateY(0)',
            transition: isEnter ? 'transform 0.08s' : isExit ? 'transform 0.25s ease-in' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          className="relative"
        >
          {isCorrect ? (
            <div
              className="relative rounded-[40px] w-44 h-44 flex items-center justify-center shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 0 60px rgba(16,185,129,0.6), 0 20px 40px rgba(0,0,0,0.2)',
              }}
            >
              {!isExit && (
                <>
                  <div className="absolute inset-0 rounded-[40px] animate-ping" style={{ background: 'rgba(16,185,129,0.2)', animationDuration: '0.8s' }} />
                  <div className="absolute inset-[-8px] rounded-[48px] animate-ping" style={{ background: 'rgba(16,185,129,0.1)', animationDuration: '0.8s', animationDelay: '0.1s' }} />
                </>
              )}
              <CheckCircle className="w-24 h-24 text-white drop-shadow-lg" strokeWidth={2.5} />
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
      </div>

      {/* --- Separate XP Icon (Floats up on the right) --- */}
      {isCorrect && xp !== undefined && xp > 0 && (
        <div 
          className="absolute right-4 md:right-20 bottom-1/4 flex flex-col items-center justify-center"
          style={{ animation: 'float-up-icon 1s cubic-bezier(0.175,0.885,0.32,1.275) forwards' }}
        >
          <div
            className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-white"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              boxShadow: '0 10px 40px rgba(245,158,11,0.5)',
            }}
          >
            <span className="text-4xl md:text-5xl drop-shadow-md">⭐</span>
            <span className="font-black text-lg md:text-xl mt-1">+{xp} XP</span>
          </div>
        </div>
      )}

      {/* --- Separate Streak Icon (Floats up on the left) --- */}
      {isCorrect && streak !== undefined && streak > 1 && (
        <div 
          className="absolute left-4 md:left-20 bottom-1/4 flex flex-col items-center justify-center"
          style={{ animation: 'float-up-icon 1s cubic-bezier(0.175,0.885,0.32,1.275) 0.15s forwards' }}
        >
          <div
            className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-white"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#fff',
              boxShadow: '0 10px 40px rgba(239,68,68,0.5)',
            }}
          >
            <span className="text-4xl md:text-5xl drop-shadow-md">🔥</span>
            <span className="font-black text-lg md:text-xl mt-1">{streak} Streak</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-up-icon {
          0% { transform: translateY(100px) scale(0.5) rotate(-15deg); opacity: 0; }
          60% { transform: translateY(-20px) scale(1.1) rotate(5deg); opacity: 1; }
          80% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-50px) scale(1.05); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
