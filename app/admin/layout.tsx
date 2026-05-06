// Server-side admin layout that forces dynamic rendering on every request.
// Without this, Next.js statically prerenders /admin/* pages at build time and
// Amplify's CloudFront serves them from cache, bypassing the middleware gate.
import AdminLayoutClient from "./AdminLayoutClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
