"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Star, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnimatedFeedbackProps {
  isCorrect: boolean;
  xp?: number;
  streak?: number;
  onComplete?: () => void;
}

export default function AnimatedFeedback({ isCorrect, xp, streak, onComplete }: AnimatedFeedbackProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = isCorrect ? 2500 : 1500;
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration); 

    return () => clearTimeout(timer);
  }, [isCorrect]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center justify-center" style={{ perspective: '1200px' }}>
        
        <div 
          className="flex flex-col items-center justify-center animate-[pop3d_0.5s_ease-out_forwards]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {isCorrect ? (
            <div className="relative flex flex-col items-center">
              <div className="absolute inset-0 bg-emerald-400 rounded-[3rem] blur-xl opacity-50 animate-pulse"></div>
              <div 
                className="relative bg-gradient-to-br from-emerald-300 via-emerald-500 to-emerald-700 rounded-[3rem] p-8 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.7),inset_0_4px_10px_rgba(255,255,255,0.6),inset_0_-4px_10px_rgba(0,0,0,0.2)] border-b-8 border-emerald-800 animate-[float3d_3s_ease-in-out_infinite]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <CheckCircle className="w-32 h-32 text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" strokeWidth={3} style={{ transform: 'translateZ(30px)' }} />
              </div>
              <div className="mt-8 text-2xl font-black text-emerald-600 uppercase tracking-widest bg-gradient-to-b from-white to-emerald-50 px-10 py-4 rounded-3xl border-4 border-emerald-200 shadow-[0_20px_40px_rgba(16,185,129,0.3),inset_0_-4px_10px_rgba(0,0,0,0.1)] animate-[pop3d_0.4s_0.1s_both]" style={{ transformStyle: 'preserve-3d' }}>
                <span style={{ display: 'inline-block', transform: 'translateZ(20px)' }}>CORRECT</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-rose-400 rounded-[3rem] blur-xl opacity-50 animate-pulse"></div>
              <div 
                className="relative bg-gradient-to-br from-rose-400 via-rose-500 to-rose-700 rounded-[3rem] p-8 shadow-[0_30px_60px_-15px_rgba(244,63,94,0.7),inset_0_4px_10px_rgba(255,255,255,0.6),inset_0_-4px_10px_rgba(0,0,0,0.2)] border-b-8 border-rose-800 animate-[shake3d_0.6s_ease-in-out]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <XCircle className="w-32 h-32 text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" strokeWidth={3} style={{ transform: 'translateZ(30px)' }} />
              </div>
            </div>
          )}
          
          {!isCorrect && (
            <div className="mt-8 text-2xl font-black text-rose-600 uppercase tracking-widest bg-gradient-to-b from-white to-rose-100 px-10 py-4 rounded-3xl border-4 border-rose-200 shadow-[0_20px_40px_rgba(244,63,94,0.3),inset_0_-4px_10px_rgba(0,0,0,0.1)] animate-[pop3d_0.4s_0.1s_both]" style={{ transformStyle: 'preserve-3d' }}>
              <span style={{ display: 'inline-block', transform: 'translateZ(20px)' }}>INCORRECT</span>
            </div>
          )}
        </div>

        {isCorrect && (
          <div className="absolute top-0 right-0 -mr-32 -mt-32 flex flex-col gap-4" style={{ perspective: '1000px' }}>
            {xp && xp > 0 ? (
              <div 
                className="animate-[popAndFloat_2s_ease-out_forwards]"
                style={{ animationDelay: '50ms', transformStyle: 'preserve-3d' }}
              >
                <div 
                  className="relative bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 text-white font-black text-3xl px-8 py-4 rounded-3xl shadow-[0_20px_40px_rgba(245,158,11,0.5),inset_0_4px_10px_rgba(255,255,255,0.6),inset_0_-4px_10px_rgba(0,0,0,0.2)] border-b-8 border-orange-700 flex items-center gap-3"
                  style={{ transform: 'rotateZ(10deg) rotateY(-15deg)', transformStyle: 'preserve-3d' }}
                >
                  <Zap className="w-8 h-8 fill-current text-yellow-200 animate-pulse" style={{ transform: 'translateZ(20px)' }} />
                  <span style={{ transform: 'translateZ(20px)' }}>+{xp} XP</span>
                </div>
              </div>
            ) : null}
            
            {streak && streak > 1 ? (
              <div 
                className="animate-[popAndFloat_2s_ease-out_forwards]"
                style={{ animationDelay: '150ms', transformStyle: 'preserve-3d' }}
              >
                <div 
                  className="relative bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 text-white font-black text-2xl px-6 py-3 rounded-3xl shadow-[0_20px_40px_rgba(139,92,246,0.5),inset_0_4px_10px_rgba(255,255,255,0.6),inset_0_-4px_10px_rgba(0,0,0,0.2)] border-b-8 border-purple-800 flex items-center gap-3"
                  style={{ transform: 'rotateZ(-5deg) rotateY(15deg)', transformStyle: 'preserve-3d' }}
                >
                  <Star className="w-7 h-7 fill-current text-yellow-300 animate-[spin_3s_linear_infinite]" style={{ transform: 'translateZ(20px)' }} />
                  <span style={{ transform: 'translateZ(20px)' }}>{streak} Streak!</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pop3d {
          0% { transform: scale3d(0, 0, 0) rotateX(45deg) rotateY(-45deg); opacity: 0; }
          60% { transform: scale3d(1.2, 1.2, 1.2) rotateX(-15deg) rotateY(15deg); opacity: 1; }
          100% { transform: scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg); opacity: 1; }
        }
        @keyframes float3d {
          0%, 100% { transform: translateY(0) rotateX(10deg) rotateY(-10deg); }
          50% { transform: translateY(-20px) rotateX(-5deg) rotateY(15deg); }
        }
        @keyframes shake3d {
          0%, 100% { transform: translateX(0) rotateY(0); }
          20% { transform: translateX(-20px) rotateY(-20deg); }
          40% { transform: translateX(20px) rotateY(20deg); }
          60% { transform: translateX(-10px) rotateY(-10deg); }
          80% { transform: translateX(10px) rotateY(10deg); }
        }
        @keyframes popAndFloat {
          0% { transform: scale3d(0, 0, 0) translate3d(0, 50px, -50px); opacity: 0; }
          10% { transform: scale3d(1.2, 1.2, 1.2) translate3d(0, -20px, 50px); opacity: 1; }
          20% { transform: scale3d(1, 1, 1) translate3d(0, 0, 0); opacity: 1; }
          100% { transform: scale3d(1.1, 1.1, 1.1) translate3d(0, -30px, 0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
