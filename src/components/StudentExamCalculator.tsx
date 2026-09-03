"use client";

import React, { useMemo, useState } from "react";
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
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-30 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-900 text-white shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all flex items-center justify-center"
        aria-label="Open calculator"
      >
        <Calculator className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-x-2 bottom-20 md:inset-x-auto md:bottom-24 md:right-6 z-30 w-auto md:w-[360px] md:max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-6rem)] md:max-h-[min(760px,calc(100vh-7rem))] rounded-[24px] md:rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-300 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 bg-slate-900 text-white">
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
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                aria-label="Close calculator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] md:max-h-[min(660px,calc(100vh-11rem))]">
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
              <div className="text-right break-all text-indigo-600 font-black text-2xl min-h-[32px] mt-2">
                {result || " "}
              </div>
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
      )}
    </>
  );
}
