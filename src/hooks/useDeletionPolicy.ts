"use client";

import { useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';

const POLICY_EVENT = 'content-deletion-policy-changed';
let fetchPromise: Promise<boolean> | null = null;

export function notifyDeletionPolicyChanged() {
  window.dispatchEvent(new Event(POLICY_EVENT));
  localStorage.setItem(POLICY_EVENT, String(Date.now()));
}

// Deduplicate simultaneous readers without keeping stale permissions for a session.
async function loadPolicy() {
  if (!fetchPromise) {
    fetchPromise = apiFetch(`${API_URL}/system/settings/deletion-policy`, { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) throw new Error('Unable to load deletion policy');
        return (await res.json()).allowContentDeletion === true;
      })
      .finally(() => { fetchPromise = null; });
  }
  return fetchPromise;
}

export const useDeletionPolicy = (role: string) => {
  const [allowDeletion, setAllowDeletion] = useState(role === 'SUPER_ADMIN');
  useEffect(() => {
    if (role === 'SUPER_ADMIN') {
      setAllowDeletion(true);
      return;
    }
    setAllowDeletion(false);
    if (!['SCHOOL_ADMIN', 'TEACHER'].includes(role)) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      void loadPolicy().then(policy => { if (active) setAllowDeletion(policy); })
        .catch(() => { if (active) setAllowDeletion(false); });
    };
    const onStorage = (event: StorageEvent) => { if (event.key === POLICY_EVENT) refresh(); };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener(POLICY_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener(POLICY_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [role]);
  return role === 'SUPER_ADMIN' || allowDeletion;
};
