const API = process.env.NEXT_PUBLIC_API_URL;

export async function getCsrfToken() {
  const res = await fetch(`${API}/api/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}

// Returns headers object with CSRF token + any extras you pass in
export async function csrfHeaders(extra = {}) {
  const token = await getCsrfToken();
  return { 'x-csrf-token': token, ...extra };
}
