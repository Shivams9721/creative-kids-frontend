import { csrfHeaders } from "@/lib/csrf";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Token is fetched once from the frontend's httpOnly cookie via /api/admin/token.
// Held in memory only — never written to localStorage. Cleared on 401/403.
let cachedToken = null;
let inflight = null;

async function getAdminToken() {
  if (cachedToken) return cachedToken;
  if (inflight) return inflight;
  inflight = fetch("/api/admin/token", { cache: "no-store" })
    .then(async (r) => {
      if (!r.ok) throw new Error("Unauthorized");
      const { token } = await r.json();
      cachedToken = token;
      return token;
    })
    .finally(() => { inflight = null; });
  return inflight;
}

function clearAdminToken() {
  cachedToken = null;
}

export async function safeFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  const method = String(options.method || "GET").toUpperCase();
  const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(method);

  // For multipart uploads (FormData), do not force JSON content-type.
  const body = options.body;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData && !headers["Content-Type"] && body && typeof body === "object" && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  if (isStateChanging) {
    Object.assign(headers, await csrfHeaders());
  }

  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");

  // Attach Bearer token from in-memory cache (sourced from httpOnly cookie via /api/admin/token).
  if (!headers["Authorization"]) {
    try {
      const token = await getAdminToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch {
      if (typeof window !== "undefined") window.location.href = "/admin/login";
      throw new Error("Unauthorized");
    }
  }

  // Support both full URLs and relative paths
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const response = await fetch(url, { ...options, headers, credentials: "include" });

  if (response.status === 401 || response.status === 403) {
    clearAdminToken();
    if (typeof window !== "undefined") {
      // Clear the frontend cookie via logout route, then redirect.
      fetch("/api/admin/logout", { method: "POST" }).finally(() => {
        window.location.href = "/admin/login";
      });
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
