import { useEffect, useRef, useState } from 'react';

export interface ApiCallLog {
  id: string;
  ts: Date;
  url: string;
  method: string;
  status?: number;
  durationMs: number;
  data?: string;
  snippet?: string;
  error?: string;
}

/**
 * Intercepts window.fetch locally (localhost only) and records metadata + a small response snippet.
 * Restores original fetch when disabled/unmounted.
 */
export function useLocalFetchLogger(enabled: boolean) {
  const [apiCalls, setApiCalls] = useState<ApiCallLog[]>([]);
  const originalFetchRef = useRef<typeof window.fetch | null>(null);

  const clear = () => setApiCalls([]);

  useEffect(() => {
    if (!enabled) {
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
        originalFetchRef.current = null;
      }
      return;
    }
    if (originalFetchRef.current) return; // already patched

    originalFetchRef.current = window.fetch;
    const makeId = () => Math.random().toString(36).slice(2, 11);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const start = performance.now();
      const url = typeof input === 'string' ? input : (input as Request).url;
      const method = (init && init.method) || (typeof input !== 'string' && (input as Request).method) || 'GET';
      try {
        const res = await (originalFetchRef.current as any)(input, init);
        const durationMs = performance.now() - start;
        let data = '';
        try {
          const clone = res.clone();
          data = await clone.text();
        } catch {/* ignore */}
        setApiCalls(prev => [...prev, { id: makeId(), ts: new Date(), url, method, status: res.status, durationMs, data }]);
        return res;
      } catch (err) {
        const durationMs = performance.now() - start;
        setApiCalls(prev => [...prev, { id: makeId(), ts: new Date(), url, method, status: -1, durationMs, error: (err as Error).message }]);
        throw err;
      }
    };

    return () => {
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
        originalFetchRef.current = null;
      }
    };
  }, [enabled]);

  return { apiCalls, clear } as const;
}
