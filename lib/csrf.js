import { safeFetch } from './safeFetch';

export async function getCsrfToken() {
  try {
    const res = await safeFetch('/api/csrf-token', { credentials: 'include' });
    const data = await res.json();
    return data.csrfToken || 'none';
  } catch {
    return 'none';
  }
}

// Returns headers object with CSRF token + any extras you pass in
export async function csrfHeaders(extra = {}) {
  const token = await getCsrfToken();
  return { 'x-csrf-token': token, ...extra };
}
