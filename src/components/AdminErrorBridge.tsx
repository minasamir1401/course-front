"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "admin_frontend_errors";
const MAX_ERRORS = 100;

type FrontendErrorEntry = {
  id: string;
  kind: "error" | "unhandledrejection" | "console.error";
  message: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: string;
};

const readErrors = (): FrontendErrorEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeErrors = (entries: FrontendErrorEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ERRORS)));
  } catch {}
};

const serialize = (value: any) => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const pushError = (entry: Omit<FrontendErrorEntry, "id" | "timestamp">) => {
  const current = readErrors();
  current.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    ...entry
  });
  writeErrors(current);
};

export default function AdminErrorBridge() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdminArea = pathname?.startsWith("/super-admin") || pathname?.startsWith("/school-admin");
    if (!isAdminArea || typeof window === "undefined") return;

    const onError = (event: ErrorEvent) => {
      pushError({
        kind: "error",
        message: event.message || "Unknown frontend error",
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      pushError({
        kind: "unhandledrejection",
        message: serialize(event.reason)
      });
    };

    const originalConsoleError = console.error.bind(console);
    console.error = (...args: any[]) => {
      pushError({
        kind: "console.error",
        message: args.map(serialize).join(" ")
      });
      originalConsoleError(...args);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, [pathname]);

  return null;
}
