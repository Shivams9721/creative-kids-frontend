const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://vbaumdstnz.ap-south-1.awsapprunner.com';

export async function safeFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Support both full URLs and relative paths
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}