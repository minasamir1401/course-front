"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-center text-slate-800">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">حدث خطأ مؤقت</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">قد تكون تعديلاتك محفوظة محلياً. أعد المحاولة، أو حدّث الصفحة إذا استمر الخطأ.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            إعادة المحاولة
          </button>
          <button type="button" onClick={() => window.location.reload()} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            تحديث الصفحة
          </button>
        </div>
      </div>
    </main>
  );
}
