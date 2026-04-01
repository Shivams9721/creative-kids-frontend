const ALLOWED_BASE = 'https://vbaumdstnz.ap-south-1.awsapprunner.com';

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
export const safeFetch = (path, options = {}) => {
  if (!path.startsWith('/api/')) throw new Error('Invalid API path');
  // Strip any attempt to break out of the path
  const safePath = path.replace(/\.\./g, '');
  return fetch(`${ALLOWED_BASE}${safePath}`, options);
};
