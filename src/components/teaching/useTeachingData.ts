'use client';
import { useEffect, useState } from 'react';
import { teachingRequest } from '@/lib/teachingClient';
export function useTeachingData(path: string, reload = 0) {
  const [result, setResult] = useState<{ key: string; data?: any; error?: string }>({ key: '' });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    teachingRequest(path, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setResult({ key: path + reload, data }); })
      .catch(error => { if (!controller.signal.aborted) setResult({ key: path + reload, error: error.message }); });
    return () => controller.abort();
  }, [path, reload]);
  return { data: result.key === path + reload ? result.data : undefined, error: result.key === path + reload ? result.error : '', loading: !!path && (result.key !== path + reload || !result.data && !result.error) };
}
