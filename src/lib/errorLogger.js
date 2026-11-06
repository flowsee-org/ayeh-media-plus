/**
 * Front-end Client Error Interceptor & Telemetry Reporter
 * Logs unhandled errors, promise rejections, and component crashes
 * to the centralized /api/logs/client-error endpoint and persistent storage.
 */

const RECENT_ERRORS_KEY = 'ayeh_recent_client_errors';
const seenErrors = new Map(); // message -> timestamp (throttling)

/**
 * Report an error to the backend error logging pipeline
 */
export async function reportClientError({
  message,
  stack = '',
  type = 'windowError',
  route = null,
  meta = {},
}) {
  const currentRoute = route || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '');
  const key = `${type}:${message}:${currentRoute}`;
  const now = Date.now();

  // Throttle: don't send the exact same error within 5 seconds
  if (seenErrors.has(key) && now - seenErrors.get(key) < 5000) {
    return;
  }
  seenErrors.set(key, now);

  const payload = {
    message: String(message || 'Unknown client error'),
    stack: String(stack || ''),
    type,
    route: currentRoute,
    clientInfo: typeof window !== 'undefined' ? {
      userAgent: navigator.userAgent,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      url: window.location.href,
    } : null,
    meta,
  };

  // 1. Save in local cache for immediate diagnostic access
  try {
    const raw = sessionStorage.getItem(RECENT_ERRORS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ ...payload, timestamp: new Date().toISOString() });
    sessionStorage.setItem(RECENT_ERRORS_KEY, JSON.stringify(list.slice(0, 25)));
  } catch {}

  // 2. Dispatch to backend
  try {
    if (typeof fetch !== 'undefined') {
      fetch('/api/logs/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Initialize global browser listeners
 */
export function initClientErrorLogger() {
  if (typeof window === 'undefined') return;

  // Catch uncaught runtime JS errors
  window.addEventListener('error', (event) => {
    // Ignore cross-origin script error noise with no details
    if (event.message === 'Script error.' && !event.filename) return;

    reportClientError({
      type: 'windowError',
      message: event.message || 'Window runtime error',
      stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      meta: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Catch unhandled Promise rejections (e.g. failed async/await)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason || 'Unhandled Promise Rejection');
    const stack = reason?.stack || '';

    reportClientError({
      type: 'unhandledRejection',
      message,
      stack,
      meta: {
        status: reason?.status,
        data: reason?.data,
      },
    });
  });

  console.log('🛡️ Ayeh Client Error Telemetry initialized.');
}

/**
 * Get locally stored client errors
 */
export function getLocalRecentErrors() {
  try {
    const raw = sessionStorage.getItem(RECENT_ERRORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
