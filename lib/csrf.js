const API = process.env.NEXT_PUBLIC_API_URL;

let _csrfToken = null;

export async function getCsrfToken() {
  if (_csrfToken) return _csrfToken;
  const res = await fetch(`${API}/api/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  _csrfToken = data.csrfToken;
  return _csrfToken;
}

// Returns headers object with CSRF token + any extras you pass in
export async function csrfHeaders(extra = {}) {
  const token = await getCsrfToken();
  return { 'x-csrf-token': token, ...extra };
}
