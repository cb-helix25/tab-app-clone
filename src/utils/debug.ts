/**
 * Lightweight debug logger gated by REACT_APP_DEBUG_LOGS.
 * Set REACT_APP_DEBUG_LOGS=true to enable verbose logs locally.
 */
export const isDebugLogs = (): boolean => process.env.REACT_APP_DEBUG_LOGS === 'true';

export const debugLog = (...args: unknown[]): void => {
  if (isDebugLogs()) console.log(...args);
};

export const debugWarn = (...args: unknown[]): void => {
  if (isDebugLogs()) console.warn(...args);
};
