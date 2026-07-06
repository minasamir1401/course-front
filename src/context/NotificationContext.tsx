"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

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
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [sessionErrorType, setSessionErrorType] = useState<'expired' | 'missing' | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    const timeoutId = setTimeout(() => {
      removeToast(id);
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

  const checkSession = useCallback((pathname: string) => {
    if (typeof window === 'undefined') return { valid: true, type: null };
    
    if (pathname.endsWith('/login') || pathname === '/login') {
      return { valid: true, type: null };
    }
    
    if (pathname.startsWith('/super-admin')) {
      const token = localStorage.getItem('super_admin_token');
      if (!token) {
        return { valid: false, type: 'missing' as const };
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return { valid: false, type: 'expired' as const };
        }
      } catch (_) {
        return { valid: false, type: 'expired' as const };
      }
    } else if (pathname.startsWith('/school-admin')) {
      const token = localStorage.getItem('school_admin_token');
      if (!token) {
        return { valid: false, type: 'missing' as const };
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return { valid: false, type: 'expired' as const };
        }
      } catch (_) {
        return { valid: false, type: 'expired' as const };
      }
    } else {
      const authenticatedRoutes = ['/courses', '/exams', '/profile', '/assignments', '/calendar', '/lessons', '/activities'];
      const isAuthRoute = authenticatedRoutes.some(route => pathname.startsWith(route));
      if (isAuthRoute) {
        const token = localStorage.getItem('lms_token');
        if (!token) {
          return { valid: false, type: 'missing' as const };
        }
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            return { valid: false, type: 'expired' as const };
          }
        } catch (_) {
          return { valid: false, type: 'expired' as const };
        }
      }
    }
    return { valid: true, type: null };
  }, []);

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

    const path = window.location.pathname;
    if (!navigator.onLine) {
      showToast(
        localStorage.getItem('language') === 'en'
          ? 'Warning: You are currently offline. Edits may not be saved.'
          : 'تنبيه: أنت غير متصل بالإنترنت حالياً. قد لا يتم حفظ تعديلاتك.',
        'error'
      );
    } else {
      const session = checkSession(path);
      setIsSessionValid(session.valid);
      setSessionErrorType(session.type);
      if (!session.valid) {
        showToast(
          localStorage.getItem('language') === 'en'
            ? 'Warning: Your session has expired or is invalid. Please log in.'
            : 'تنبيه: الجلسة منتهية الصلاحية أو غير صالحة. يرجى تسجيل الدخول.',
          'error'
        );
      }
    }

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
      const method = init?.method?.toUpperCase() || 'GET';
      const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
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

      if (isMutation && isApiCall && !urlStr.includes('/login')) {
        const currentSession = checkSession(window.location.pathname);
        if (!currentSession.valid) {
          setIsSessionValid(false);
          setSessionErrorType(currentSession.type);
          showToast(
            localStorage.getItem('language') === 'en'
              ? 'Blocked: Session expired or invalid. Please login.'
              : 'تم حظر الإرسال: الجلسة منتهية أو غير صالحة. يرجى تسجيل الدخول.',
            'error'
          );
          throw new TypeError('Failed to fetch (session expired)');
        }
      }

      try {
        const response = await originalFetch(input, init);

        if (response.status === 502) {
          showToast(
            localStorage.getItem('language') === 'en'
              ? 'Backend server unreachable. Connection failed.'
              : 'فشل الاتصال بخادم المنصة (Backend Unreachable).',
            'error'
          );
        }

        if (!response.ok && response.status >= 400 && isApiCall) {
          const cloned = response.clone();
          try {
            const errorJson = await cloned.json();
            const serverErrorMessage = errorJson?.error || errorJson?.message || errorJson?.details;
            if (serverErrorMessage) {
              showToast(
                localStorage.getItem('language') === 'ar' || !localStorage.getItem('language')
                  ? `خطأ من الخادم: ${serverErrorMessage}`
                  : `Server Error: ${serverErrorMessage}`,
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
          showToast(
            localStorage.getItem('language') === 'en'
              ? 'Failed to fetch: Connection to the server was lost.'
              : 'فشل الاتصال: تم فقدان الاتصال بخادم المنصة.',
            'error'
          );
        }
        throw error;
      }
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.fetch = originalFetch;
    };
  }, [checkSession, showToast]);

  return (
    <NotificationContext.Provider value={{ showToast, confirm }}>
      {/* Sticky Top Warning Banner (يافطة) */}
      {(!isOnline || !isSessionValid) && (
        <div className="fixed top-0 left-0 right-0 z-[10001] bg-gradient-to-r from-amber-600/95 via-rose-600/95 to-amber-600/95 backdrop-blur-md text-white shadow-lg border-b border-white/10 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 text-right" dir="rtl">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <AlertCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
              <p className="font-bold text-sm md:text-base leading-relaxed">
                {!isOnline ? (
                  localStorage.getItem('language') === 'en'
                    ? 'Offline Mode: You are not connected to the internet. Please check connection to prevent losing your progress.'
                    : 'وضع عدم الاتصال: أنت غير متصل بالإنترنت حالياً. يرجى التأكد من الاتصال لتفادي فقدان التعديلات.'
                ) : (
                  localStorage.getItem('language') === 'en'
                    ? 'Session Expired: Your session is invalid or has expired. Please log in in another tab to keep your progress.'
                    : 'انتهت الجلسة: الجلسة غير صالحة أو انتهت صلاحيتها. يرجى تسجيل الدخول في نافذة أخرى لحفظ عملك الحالي.'
                )}
              </p>
            </div>
            {!isOnline && (
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    setIsOnline(navigator.onLine);
                  }
                }}
                className="px-4 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-black transition-all border border-white/10"
              >
                {localStorage.getItem('language') === 'en' ? 'Retry Connection' : 'إعادة محاولة الاتصال'}
              </button>
            )}
            {isOnline && !isSessionValid && (
              <a 
                href={typeof window !== 'undefined' && window.location.pathname.startsWith('/super-admin') ? '/super-admin/login' : (typeof window !== 'undefined' && window.location.pathname.startsWith('/school-admin') ? '/school-admin/login' : '/login')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-white text-rose-600 hover:bg-white/95 rounded-xl text-xs font-black transition-all shadow-md"
              >
                {localStorage.getItem('language') === 'en' ? 'Login Now' : 'تسجيل الدخول الآن'}
              </a>
            )}
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
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0" />}
              {toast.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <p className="font-bold text-sm leading-tight">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
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
