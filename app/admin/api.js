import { csrfHeaders } from "@/lib/csrf";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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

  // Support both full URLs and relative paths
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const response = await fetch(url, { ...options, headers, credentials: "include" });

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== "undefined") {
      document.cookie = "adminToken=; path=/; max-age=0";
      window.location.href = "/admin/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}