"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X, WifiOff, ServerCrash } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface NotificationContextType {
  showToast: (message: string, type?: ToastType) => void;
  confirm: (title: string, message: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  const [isOnline, setIsOnline] = useState(true);
  const [isBackendDown, setIsBackendDown] = useState(false);
  const backendDownRef = useRef(false);
  const consecutive502Ref = useRef(0);
  // Deduplication: track active toast messages to prevent spam
  const activeToastMessages = useRef<Set<string>>(new Set());

  const removeToast = useCallback((id: string, message: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    activeToastMessages.current.delete(message);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    // Deduplicate: don't show the same message twice at the same time
    if (activeToastMessages.current.has(message)) return;
    activeToastMessages.current.add(message);

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 5 seconds
    const timeoutId = setTimeout(() => {
      removeToast(id, message);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [removeToast]);

  const confirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ isOpen: true, title, message, resolve });
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    if (confirmState) {
      confirmState.resolve(value);
      setConfirmState(null);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      showToast(
        localStorage.getItem('language') === 'en'
          ? 'Back online. Connection restored.'
          : 'تم استعادة الاتصال بالإنترنت بنجاح.',
        'success'
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        localStorage.getItem('language') === 'en'
          ? 'You are offline. Please check your network.'
          : 'تنبيه: أنت غير متصل بالإنترنت حالياً.',
        'error'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      showToast(
        localStorage.getItem('language') === 'en'
          ? 'Warning: You are currently offline. Edits may not be saved.'
          : 'تنبيه: أنت غير متصل بالإنترنت حالياً. قد لا يتم حفظ تعديلاتك.',
        'error'
      );
    }

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
      const method = init?.method?.toUpperCase() || 'GET';
      const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
      const isApiCall = urlStr.includes('/api/');

      if (!navigator.onLine && isApiCall) {
        showToast(
          localStorage.getItem('language') === 'en'
            ? 'Offline mode: Cannot save or upload data.'
            : 'وضع عدم الاتصال: لا يمكن حفظ أو رفع البيانات حالياً.',
          'error'
        );
        throw new TypeError('Failed to fetch (offline)');
      }

      try {
        const response = await originalFetch(input, init);

        if (response.status === 502 || response.status === 503 || response.status === 504) {
          consecutive502Ref.current++;
          if (consecutive502Ref.current >= 2 && !backendDownRef.current) {
            // Backend persistently down → show sticky banner
            backendDownRef.current = true;
            setIsBackendDown(true);
          } else if (consecutive502Ref.current === 1) {
            // First failure → toast only
            showToast(
              localStorage.getItem('language') === 'en'
                ? 'Server unreachable. Retrying...'
                : 'تعذّر الوصول للخادم، جارٍ إعادة المحاولة...',
              'error'
            );
          }
        } else if (isApiCall) {
          // Successful API call → reset backend-down state
          if (consecutive502Ref.current > 0) {
            consecutive502Ref.current = 0;
            if (backendDownRef.current) {
              backendDownRef.current = false;
              setIsBackendDown(false);
              showToast(
                localStorage.getItem('language') === 'en'
                  ? 'Server connection restored ✅'
                  : 'تم استعادة الاتصال بالخادم بنجاح ✅',
                'success'
              );
            }
          }
        }

        // Show server error messages for 4xx errors (not 502+)
        if (!response.ok && response.status >= 400 && response.status < 502 && isApiCall) {
          const cloned = response.clone();
          try {
            const errorJson = await cloned.json();
            const serverErrorMessage = errorJson?.error || errorJson?.message || errorJson?.details;
            if (serverErrorMessage) {
              showToast(
                localStorage.getItem('language') === 'ar' || !localStorage.getItem('language')
                  ? `خطأ: ${serverErrorMessage}`
                  : `Error: ${serverErrorMessage}`,
                'error'
              );
            }
          } catch (_) {}
        }

        return response;
      } catch (error: any) {
        const errMessage = error?.message || '';
        if (
          errMessage.includes('Failed to fetch') ||
          errMessage.includes('NetworkError') ||
          errMessage.includes('Failed to reach backend')
        ) {
          consecutive502Ref.current++;
          if (consecutive502Ref.current >= 2 && !backendDownRef.current) {
            backendDownRef.current = true;
            setIsBackendDown(true);
          } else {
            showToast(
              localStorage.getItem('language') === 'en'
                ? 'Connection lost. Check your network.'
                : 'فشل الاتصال: تعذّر الوصول للخادم.',
              'error'
            );
          }
        }
        throw error;
      }
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.fetch = originalFetch;
    };
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{ showToast, confirm }}>
      {/* 🔴 Backend Down Banner */}
      {isBackendDown && (
        <div className="fixed top-0 left-0 right-0 z-[10002] bg-gradient-to-r from-red-700/98 via-rose-700/98 to-red-700/98 backdrop-blur-md text-white shadow-2xl border-b border-red-400/20 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4" dir="rtl">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-200"></span>
              </span>
              <ServerCrash className="w-5 h-5 flex-shrink-0" />
              <p className="font-bold text-sm md:text-base leading-relaxed">
                {typeof window !== 'undefined' && localStorage.getItem('language') === 'en'
                  ? '🔴 Backend server is down or unreachable. Some features may not work. Please wait or contact support.'
                  : '🔴 خادم المنصة لا يستجيب حالياً. بعض الميزات قد لا تعمل. يرجى الانتظار أو التواصل مع الدعم.'}
              </p>
            </div>
            <button
              onClick={() => {
                setIsBackendDown(false);
                backendDownRef.current = false;
                consecutive502Ref.current = 0;
              }}
              className="px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-black transition-all border border-white/10 flex-shrink-0"
            >
              {typeof window !== 'undefined' && localStorage.getItem('language') === 'en' ? 'Dismiss' : 'إغلاق'}
            </button>
          </div>
        </div>
      )}

      {/* 🟠 Offline Banner */}
      {!isOnline && (
        <div className={`fixed top-0 left-0 right-0 z-[10001] bg-gradient-to-r from-amber-600/95 via-rose-600/95 to-amber-600/95 backdrop-blur-md text-white shadow-lg border-b border-white/10 animate-in slide-in-from-top duration-300 ${isBackendDown ? 'mt-12' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 text-right" dir="rtl">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <WifiOff className="w-5 h-5 flex-shrink-0" />
              <p className="font-bold text-sm md:text-base leading-relaxed">
                {typeof window !== 'undefined' && localStorage.getItem('language') === 'en'
                  ? 'Offline Mode: You are not connected to the internet. Please check connection to prevent losing your progress.'
                  : 'وضع عدم الاتصال: أنت غير متصل بالإنترنت حالياً. يرجى التأكد من الاتصال لتفادي فقدان التعديلات.'}
              </p>
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  setIsOnline(navigator.onLine);
                }
              }}
              className="px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-black transition-all border border-white/10"
            >
              {typeof window !== 'undefined' && localStorage.getItem('language') === 'en' ? 'Retry Connection' : 'إعادة محاولة الاتصال'}
            </button>
          </div>
        </div>
      )}

      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              flex items-center justify-between gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-left duration-300
              ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ''}
              ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}
              ${toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0" />}
              {toast.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <p className="font-bold text-sm leading-tight">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id, toast.message)}
              className="p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 rtl" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => handleConfirm(false)}></div>
          <div className="relative bg-[#0f0f1d] border border-white/10 w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">{confirmState.title}</h3>
            <p className="text-slate-400 font-medium leading-relaxed mb-8">
              {confirmState.message}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleConfirm(false)}
                className="py-4 rounded-2xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-xl shadow-red-900/20"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
