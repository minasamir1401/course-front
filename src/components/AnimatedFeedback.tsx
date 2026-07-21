"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface AnimatedFeedbackProps {
  isCorrect: boolean;
  xp?: number;
  onComplete?: () => void;
}

export default function AnimatedFeedback({ isCorrect, xp, onComplete }: AnimatedFeedbackProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide after 1 second
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1200); // 1.2s to allow animation to play

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-black/20 animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center justify-center">
        {/* Main Icon Pop */}
        <div 
          className="flex flex-col items-center justify-center animate-in zoom-in-50 duration-300 spring"
          style={{ animationTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
        >
          {isCorrect ? (
            <div className="bg-green-500 rounded-full p-4 shadow-2xl shadow-green-500/50">
              <CheckCircle className="w-24 h-24 text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="bg-red-500 rounded-full p-4 shadow-2xl shadow-red-500/50 flex flex-col items-center">
              <XCircle className="w-24 h-24 text-white" strokeWidth={3} />
            </div>
          )}
          
          {/* Try Again text if wrong */}
          {!isCorrect && (
            <div className="mt-4 text-3xl font-black text-red-500 uppercase tracking-widest drop-shadow-md bg-white px-6 py-2 rounded-full border-4 border-red-500">
              Try Again
            </div>
          )}
        </div>

        {/* Floating XP if correct */}
        {isCorrect && xp && (
          <div 
            className="absolute top-0 right-0 -mr-16 -mt-16 animate-in slide-in-from-bottom-10 fade-in duration-700 ease-out"
            style={{ animationFillMode: 'forwards' }}
          >
            <div className="bg-yellow-400 text-yellow-900 font-black text-2xl px-4 py-2 rounded-full shadow-lg border-4 border-yellow-200 rotate-12">
              +{xp} XP
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
