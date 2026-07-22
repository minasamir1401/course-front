"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Star, Zap } from 'lucide-react';

interface AnimatedFeedbackProps {
  isCorrect: boolean;
  xp?: number;
  streak?: number;
  onComplete?: () => void;
}

export default function AnimatedFeedback({ isCorrect, xp, streak, onComplete }: AnimatedFeedbackProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide after 1.5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1500); 

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center justify-center perspective-[1000px]">
        {/* Main Icon Pop */}
        <div 
          className="flex flex-col items-center justify-center animate-in zoom-in-50 slide-in-from-bottom-8 duration-500"
          style={{ animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {isCorrect ? (
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(16,185,129,0.5)] transform rotate-12 animate-[float_3s_ease-in-out_infinite] border-4 border-emerald-300/50">
              <CheckCircle className="w-24 h-24 text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(244,63,94,0.5)] flex flex-col items-center transform -rotate-12 animate-[shake_0.5s_ease-in-out] border-4 border-rose-300/50">
              <XCircle className="w-24 h-24 text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
          )}
          
          {/* Incorrect text if wrong */}
          {!isCorrect && (
            <div className="mt-6 text-2xl font-black text-rose-500 uppercase tracking-widest shadow-xl bg-white px-8 py-3 rounded-2xl border-2 border-rose-200 transform translate-y-4 animate-in slide-in-from-top-4 duration-300">
              Incorrect
            </div>
          )}
        </div>

        {/* Floating XP and Streak if correct */}
        {isCorrect && (
          <div className="absolute top-0 right-0 -mr-24 -mt-24 flex flex-col gap-3">
            {xp && xp > 0 ? (
              <div 
                className="animate-in slide-in-from-bottom-10 fade-in duration-700 ease-out fill-mode-forwards"
                style={{ animationDelay: '100ms' }}
              >
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-2xl px-6 py-3 rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.5)] border-2 border-amber-200/50 rotate-6 transform hover:scale-110 transition-transform flex items-center gap-2">
                  <Zap className="w-6 h-6 fill-current text-yellow-200 animate-pulse" />
                  +{xp} XP
                </div>
              </div>
            ) : null}
            
            {streak && streak > 1 ? (
              <div 
                className="animate-in slide-in-from-bottom-10 fade-in duration-700 ease-out fill-mode-forwards"
                style={{ animationDelay: '300ms' }}
              >
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-xl px-5 py-2.5 rounded-2xl shadow-[0_10px_25px_rgba(99,102,241,0.5)] border-2 border-indigo-300/50 -rotate-3 transform hover:scale-110 transition-transform flex items-center gap-2">
                  <Star className="w-5 h-5 fill-current text-yellow-300 animate-[spin_4s_linear_infinite]" />
                  {streak} Streak!
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-15px) rotate(8deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(-12deg); }
          25% { transform: translateX(-10px) rotate(-12deg); }
          75% { transform: translateX(10px) rotate(-12deg); }
        }
      `}} />
    </div>
  );
}
