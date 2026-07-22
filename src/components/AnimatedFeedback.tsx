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
    // 1 second duration as requested
    const duration = 1000;
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration); 

    // Play confetti for correct
    if (isCorrect) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#FCD34D']
      });
    }

    return () => clearTimeout(timer);
  }, [isCorrect]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in zoom-in duration-200">
      {/* Simple Icon Box */}
      <div className={`relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl border-b-4 ${
        isCorrect 
          ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-600 shadow-emerald-500/40' 
          : 'bg-gradient-to-br from-rose-400 to-rose-500 border-rose-600 shadow-rose-500/40'
      }`}>
        {isCorrect ? (
          <CheckCircle className="w-14 h-14 text-white" strokeWidth={3} />
        ) : (
          <XCircle className="w-14 h-14 text-white" strokeWidth={3} />
        )}

        {/* Floating XP Badge */}
        {isCorrect && xp && xp > 0 ? (
          <div className="absolute -top-6 -right-6 animate-bounce">
            <div className="bg-amber-500 text-white font-black text-lg px-4 py-2 rounded-2xl shadow-lg border-b-4 border-amber-600 flex items-center gap-2">
              <Zap className="w-5 h-5 fill-current text-yellow-200" />
              <span>+{xp} XP</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
