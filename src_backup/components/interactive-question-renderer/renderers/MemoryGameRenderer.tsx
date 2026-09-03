"use client";

import React, { useState, useEffect } from "react";
import HtmlRenderer from "../../HtmlRenderer";
import { parseJson, translateText } from "../utils";
import { MemoryCard } from "../types";

export default function MemoryGameRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { pairs: [] });
  const rawPairs = Array.isArray(opts?.pairs) ? opts.pairs : [];
  
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);

  useEffect(() => {
    const generated: MemoryCard[] = [];
    rawPairs.forEach((p: any, idx: number) => {
      // Note: We use "text" internally to map to "content" in types for MemoryCard
      // but to match the previous code exactly we'll structure it like so:
      generated.push({ id: idx * 2, content: p.left, type: "term", pairId: idx, isFlipped: false, isMatched: false });
      generated.push({ id: idx * 2 + 1, content: p.right, type: "definition", pairId: idx, isFlipped: false, isMatched: false });
    });
    const shuffled = [...generated].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [question.options]);

  const handleCardClick = (cardId: number, pairIndex: number) => {
    if (flippedIds.includes(cardId) || matchedPairs.includes(pairIndex)) return;
    if (flippedIds.length >= 2) return;

    const nextFlipped = [...flippedIds, cardId];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      const firstCard = cards.find((c) => c.id === nextFlipped[0]);
      const secondCard = cards.find((c) => c.id === nextFlipped[1]);
      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        const nextMatched = [...matchedPairs, firstCard.pairId];
        setMatchedPairs(nextMatched);
        setFlippedIds([]);
        onChange(JSON.stringify(nextMatched));
      } else {
        setTimeout(() => setFlippedIds([]), 1000);
      }
    }
  };

  const CARD_COLORS = [
    "bg-indigo-600 border-indigo-600",
    "bg-rose-600 border-rose-600",
    "bg-emerald-600 border-emerald-600",
    "bg-amber-500 border-amber-500",
    "bg-purple-600 border-purple-600",
    "bg-blue-600 border-blue-600",
    "bg-teal-600 border-teal-600",
    "bg-fuchsia-600 border-fuchsia-600"
  ];

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <span className="text-xs font-bold text-slate-500">
        {language === "ar" ? "لعبة الذاكرة (اعثر على الكروت المتطابقة):" : "Memory Game (Match the cards):"}
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-center">
        {cards.map((c) => {
          const isOpen = flippedIds.includes(c.id) || matchedPairs.includes(c.pairId);
          const colorClass = CARD_COLORS[c.pairId % CARD_COLORS.length];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCardClick(c.id, c.pairId)}
              className={`w-full aspect-[4/3] rounded-2xl border-2 flex items-center justify-center font-black text-xs p-3 transition-all ${isOpen ? `${colorClass} text-white animate-pop-in` : "bg-white border-slate-200 hover:border-slate-450"}`}
            >
              {isOpen ? <HtmlRenderer html={translateText(c.content, language)} tag="span" /> : "🌟"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
