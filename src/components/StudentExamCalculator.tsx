"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./StudentExamCalculator.module.css";
import {
  Calculator,
  Delete,
  Divide,
  Minus,
  Plus,
  RotateCcw,
  Sigma,
  X,
} from "lucide-react";
import {
  evaluateCalculatorExpression,
  formatCalculatorValue,
  type CalculatorAngleMode,
} from "@/lib/studentCalculator";

const BASIC_BUTTON_ROWS = [
  ["7", "8", "9", "/"],
  ["4", "5", "6", "*"],
  ["1", "2", "3", "-"],
  ["0", ".", "(", "+"],
];

const SCIENTIFIC_BUTTON_ROWS = [
  ["sin(", "cos(", "tan(", "^"],
  ["sqrt(", "log(", "ln(", "%"],
  ["abs(", "pi", "e", ")"],
];

const formatDisplayValue = (value: string) => value || "0";

export default function StudentExamCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [angleMode, setAngleMode] = useState<CalculatorAngleMode>("DEG");
  const panelId = useId(), launcherRef = useRef<HTMLButtonElement>(null), panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 100, left: 12, width: 360, maxHeight: 600 });
  const close = useCallback(() => { setIsOpen(false); launcherRef.current?.focus({ preventScroll: true }); }, []);
  const positionPanel = useCallback(() => {
    const anchor = launcherRef.current?.getBoundingClientRect();
    if (!anchor) return;
    const width = Math.max(0, Math.min(360, window.innerWidth - 24));
    const top = Math.max(12, Math.min(anchor.bottom + 10, window.innerHeight - 100));
    const left = Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12));
    const next = { top, left, width, maxHeight: Math.max(0, window.innerHeight - top - 12) };
    setPosition(previous => Object.keys(next).every(key => next[key as keyof typeof next] === previous[key as keyof typeof previous]) ? previous : next);
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    positionPanel(); panelRef.current?.focus({ preventScroll: true });
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !(event.target instanceof Element && event.target.closest('[aria-modal="true"]'))) { event.preventDefault(); close(); }
    };
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);
    window.addEventListener('keydown', keyboard);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(positionPanel);
    const header = launcherRef.current?.closest('header');
    if (header) observer?.observe(header);
    return () => { window.removeEventListener('resize', positionPanel); window.removeEventListener('scroll', positionPanel, true); window.removeEventListener('keydown', keyboard); observer?.disconnect(); };
  }, [isOpen, close, positionPanel]);

  const operatorLabels = useMemo(
    () => ({
      "/": <Divide className="w-4 h-4" />,
      "*": <X className="w-4 h-4" />,
      "-": <Minus className="w-4 h-4" />,
      "+": <Plus className="w-4 h-4" />,
      "^": <span className="text-sm font-black">x^y</span>,
      "%": <span className="text-sm font-black">%</span>,
      pi: <span className="text-sm font-black">π</span>,
      e: <span className="text-sm font-black">e</span>,
    }),
    []
  );

  const appendValue = (value: string) => {
    setExpression((current) => `${current}${value}`);
  };

  const clearAll = () => {
    setExpression("");
    setResult("");
  };

  const removeLast = () => {
    setExpression((current) => current.slice(0, -1));
  };

  const applyQuickOperation = (operation: "square" | "inverse" | "negate") => {
    try {
      const baseValue = expression.trim()
        ? evaluateCalculatorExpression(expression, { angleMode })
        : Number(result || "0");

      const nextValue =
        operation === "square"
          ? baseValue ** 2
          : operation === "inverse"
            ? 1 / baseValue
            : -baseValue;

      const formattedValue = formatCalculatorValue(nextValue);
      setExpression(formattedValue);
      setResult(formattedValue);
    } catch {
      setResult("Error");
    }
  };

  const handleEvaluate = () => {
    try {
      if (!expression.trim()) {
        setResult("");
        return;
      }

      const evaluated = evaluateCalculatorExpression(expression, { angleMode });
      setResult(formatCalculatorValue(evaluated));
    } catch {
      setResult("Error");
    }
  };

  const renderButton = (buttonValue: string) => (
    <button
      key={buttonValue}
      type="button"
      aria-label={buttonValue}
      onClick={() => appendValue(buttonValue)}
      className={`h-11 rounded-xl font-black transition-colors flex items-center justify-center text-xs ${
        ["+", "-", "*", "/", "^", "%"].includes(buttonValue)
          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
          : ["sin(", "cos(", "tan(", "sqrt(", "log(", "ln(", "abs(", "pi", "e"].includes(buttonValue)
            ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {operatorLabels[buttonValue as keyof typeof operatorLabels] || buttonValue}
    </button>
  );

  return (
    <>
      <button
        type="button"
        ref={launcherRef}
        onClick={() => { if (isOpen) close(); else { positionPanel(); setIsOpen(true); } }}
        className={styles.launcher}
        aria-label="Open calculator"
        title="Calculator / الآلة الحاسبة"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <Calculator className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {isOpen && createPortal(
        <div ref={panelRef} id={panelId} role="dialog" aria-modal={false} aria-label="Scientific Calculator" tabIndex={-1} data-exam-calculator-open dir="ltr" className={styles.panel} style={position}>
          <div className={styles.header}>
            <div className="flex items-center gap-2 font-black text-sm">
              <Calculator className="w-4 h-4" />
              <span>Scientific Calculator</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAngleMode((current) => (current === "DEG" ? "RAD" : "DEG"))}
                className="rounded-lg bg-white/10 px-3 py-1 text-[11px] font-black hover:bg-white/20 transition-colors"
              >
                {angleMode}
              </button>
              <button
                type="button"
                onClick={close}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Close calculator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={styles.body}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 min-h-[110px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Input
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500">
                  {angleMode}
                </span>
              </div>
              <div className="text-right break-all text-slate-700 font-mono text-lg min-h-[32px]">
                {formatDisplayValue(expression)}
              </div>
              <output aria-label="Calculation result" className="block text-right break-all text-indigo-600 font-black text-2xl min-h-[32px] mt-2">
                {result || " "}
              </output>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="col-span-2 h-11 rounded-xl bg-rose-50 text-rose-600 font-black hover:bg-rose-100 transition-colors"
              >
                AC
              </button>
              <button
                type="button"
                onClick={removeLast}
                aria-label="Delete last character"
                className="h-11 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center"
              >
                <Delete className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setExpression((current) => `${current})`)}
                className="h-11 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-black"
              >
                )
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyQuickOperation("square")}
                className="h-11 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-xs font-black"
              >
                x²
              </button>
              <button
                type="button"
                onClick={() => applyQuickOperation("inverse")}
                className="h-11 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-xs font-black"
              >
                1/x
              </button>
              <button
                type="button"
                onClick={() => applyQuickOperation("negate")}
                className="h-11 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-xs font-black"
              >
                ±
              </button>
              <button
                type="button"
                onClick={() => appendValue("(")}
                className="h-11 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-black"
              >
                (
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {SCIENTIFIC_BUTTON_ROWS.flat().map(renderButton)}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {BASIC_BUTTON_ROWS.flat().map(renderButton)}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (result && result !== "Error") {
                    setExpression(result);
                  }
                }}
                className="h-12 rounded-xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Ans
              </button>
              <button
                type="button"
                onClick={handleEvaluate}
                className="h-12 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sigma className="w-4 h-4" />
                =
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
