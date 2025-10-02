/**
 * Data loading utilities with timeout protection and progressive loading
 * Optimized for Teams embedded environment
 */

export interface LoadResult<T> {
  data: T | null;
  error?: Error;
  timedOut?: boolean;
  fromCache?: boolean;
}

/**
 * Fetch with timeout protection
 */
export async function fetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  timeoutMs: number = 10000,
  fallbackValue: T | null = null
): Promise<LoadResult<T>> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  );

  try {
    const data = await Promise.race([fetchFn(), timeoutPromise]);
    return { data, fromCache: false };
  } catch (error) {
    const err = error as Error;
    const timedOut = err.message === 'Request timeout';
    
    if (timedOut) {
      console.warn('⏱️ Request timed out, using fallback');
    } else {
      console.warn('❌ Request failed:', err.message);
    }
    
    return {
      data: fallbackValue,
      error: err,
      timedOut,
      fromCache: false
    };
  }
}

/**
 * Staggered data loading for better UX and reliability
 * Returns data as it becomes available rather than waiting for all
 */
export interface StaggeredLoadCallbacks<T> {
  onDataLoaded: (key: string, result: LoadResult<T>) => void;
  onAllComplete: () => void;
}

export async function loadDataStaggered<T>(
  loads: Array<{ key: string; fetchFn: () => Promise<T>; timeout?: number; fallback?: T | null }>,
  callbacks: StaggeredLoadCallbacks<T>
): Promise<void> {
  const promises = loads.map(async ({ key, fetchFn, timeout = 10000, fallback = null }) => {
    const result = await fetchWithTimeout(fetchFn, timeout, fallback);
    callbacks.onDataLoaded(key, result);
    return result;
  });

  await Promise.allSettled(promises);
  callbacks.onAllComplete();
}

/**
 * Progressive loading with priority
 * Load critical data first, then secondary data
 */
export interface ProgressiveLoadConfig<T> {
  critical: Array<{ key: string; fetchFn: () => Promise<T>; timeout?: number }>;
  secondary: Array<{ key: string; fetchFn: () => Promise<T>; timeout?: number }>;
  onCriticalLoaded: (results: Map<string, LoadResult<T>>) => void;
  onSecondaryLoaded: (results: Map<string, LoadResult<T>>) => void;
}

export async function loadDataProgressive<T>(
  config: ProgressiveLoadConfig<T>
): Promise<void> {
  // Load critical data first with shorter timeout
  const criticalResults = new Map<string, LoadResult<T>>();
  
  await Promise.allSettled(
    config.critical.map(async ({ key, fetchFn, timeout = 5000 }) => {
      const result = await fetchWithTimeout(fetchFn, timeout);
      criticalResults.set(key, result);
    })
  );
  
  // Notify critical data loaded (UI can render)
  config.onCriticalLoaded(criticalResults);
  
  // Load secondary data with longer timeout
  const secondaryResults = new Map<string, LoadResult<T>>();
  
  await Promise.allSettled(
    config.secondary.map(async ({ key, fetchFn, timeout = 15000 }) => {
      const result = await fetchWithTimeout(fetchFn, timeout);
      secondaryResults.set(key, result);
    })
  );
  
  // Notify secondary data loaded
  config.onSecondaryLoaded(secondaryResults);
}

/**
 * Retry failed fetch with exponential backoff
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Check if we're in Teams embedded environment
 */
export function isTeamsEmbed(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if we're in an iframe (Teams embeds in iframe)
  const inIframe = window !== window.top;
  
  // Check for Teams-specific user agent or query params
  const userAgent = navigator.userAgent.toLowerCase();
  const hasTeamsAgent = userAgent.includes('teams');
  const hasTeamsParam = window.location.search.includes('teams');
  
  return inIframe || hasTeamsAgent || hasTeamsParam;
}

/**
 * Get optimal timeout based on environment
 */
export function getOptimalTimeout(baseTimeout: number = 10000): number {
  if (isTeamsEmbed()) {
    // Teams has more restrictive timeouts
    return Math.min(baseTimeout, 8000);
  }
  return baseTimeout;
}
