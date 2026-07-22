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

    return () => clearTimeout(timer);
  }, [isCorrect]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          {isCorrect ? (
            <div className="relative bg-emerald-500 rounded-3xl w-40 h-40 flex items-center justify-center shadow-2xl border-4 border-emerald-400">
              <CheckCircle className="w-24 h-24 text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="relative bg-rose-500 rounded-3xl w-40 h-40 flex items-center justify-center shadow-2xl border-4 border-rose-400">
              <XCircle className="w-24 h-24 text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
