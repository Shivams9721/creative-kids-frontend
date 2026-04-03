const ALLOWED_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://vbaumdstnz.ap-south-1.awsapprunner.com';

// Validates a path segment is a safe positive integer (for IDs)
// Returns null instead of throwing so callers can handle gracefully
export const safeId = (val) => {
  const n = parseInt(val, 10);
  if (!n || n <= 0 || !isFinite(n)) return null;
  return n;
};

// Validates a page number
export const safePage = (val) => Math.max(1, parseInt(val, 10) || 1);

/**
 * Drop-in replacement for fetch() that enforces the API base URL
 * is always the hardcoded allowed origin — never from user input.
 * @param {string} path  - Must start with /api/
 * @param {object} options - Standard fetch options
 */
export const safeFetch = async (path, options = {}) => {
  if (!path.startsWith('/api/')) throw new Error('Invalid API path');
  const safePath = path.replace(/\.\./g, '');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
  const fetchOptions = { ...options, signal: controller.signal };

  try {
    const res = await fetch(`${ALLOWED_BASE}${safePath}`, fetchOptions);
    // Auto-clear stale token and redirect to login on 401/403
    if ((res.status === 401 || res.status === 403) && typeof window !== 'undefined') {
      const data = await res.clone().json().catch(() => ({}));
      const isAuthError = data.message?.includes('token') || data.message?.includes('Access Denied');
      if (isAuthError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
};
