"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import "./admin.css";
import AdminOrderNotifier from "@/components/admin/AdminOrderNotifier";

const NAV = [
  { group: "Overview", items: [
    { id: "dashboard", label: "Dashboard", href: "/admin", badge: null },
    { id: "analytics", label: "Analytics", href: "/admin/analytics", badge: null },
    { id: "homepage", label: "Homepage Editor", href: "/admin/homepage", badge: "LIVE" },
  ]},
  { group: "Catalogue", items: [
    { id: "list-product", label: "List product", href: "/admin/list-product", badge: "NEW" },
    { id: "products", label: "All products", href: "/admin/products", badge: null },
    { id: "inventory", label: "Inventory", href: "/admin/inventory", badge: null },
    { id: "sku-reconciliation", label: "SKU Reconciliation", href: "/admin/sku-reconciliation", badge: null },
  ]},
  { group: "Commerce", items: [
    { id: "orders", label: "Orders", href: "/admin/orders", badge: null },
    { id: "returns", label: "Returns", href: "/admin/returns", badge: null },
    { id: "cod-insights", label: "COD Insights", href: "/admin/cod-insights", badge: null },
    { id: "coupons", label: "Coupons", href: "/admin/coupons", badge: null },
    { id: "customers", label: "Customers", href: "/admin/customers", badge: null },
    { id: "contacts", label: "Contact Requests", href: "/admin/contacts", badge: null },
  ]},
  { group: "System", items: [
    { id: "settings", label: "Settings", href: "/admin/settings", badge: null },
  ]},
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Don't apply auth guard or shell to the login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    // Hit our own route handler — it reads the frontend-domain cookie and proxies to the backend.
    fetch(`/api/admin/verify`)
      .then((res) => {
        if (!res.ok) {
          setAuthed(false);
          router.replace("/admin/login");
          return;
        }
        setAuthed(true);
      })
      .catch(() => {
        // Security: never grant admin access on network/API failures.
        setAuthed(false);
        router.replace("/admin/login");
      });
  }, [router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#555", fontSize: 11, fontFamily: "sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Starting...
      </div>
    </div>
  );

  const handleLogout = () => {
    document.cookie = "adminToken=; path=/; max-age=0";
    router.replace("/admin/login");
  };

  const isActive = (href) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="admin-root" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <AdminOrderNotifier />
      
      {/* MOBILE OVERLAY */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* SIDEBAR */}
      <aside className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`} style={{ width: 224, flexShrink: 0, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--text)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><path d="M8 2C5.2 2 3 4.2 3 7c0 2.4 1.6 4.4 3.8 5.1V13h2.4v-0.9C11.4 11.4 13 9.4 13 7c0-2.8-2.2-5-5-5z" fill="#000"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Creative Kid's</div>
            <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Admin Console</div>
          </div>
        </div>

        {NAV.map(group => (
          <div key={group.group} style={{ padding: "10px 0 4px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 18px 6px" }}>{group.group}</div>
            {group.items.map(item => (
              <Link key={item.id} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "9px 18px",
                borderLeft: `2px solid ${isActive(item.href) ? "var(--accent)" : "transparent"}`,
                background: isActive(item.href) ? "var(--bg3)" : "transparent",
                color: isActive(item.href) ? "var(--text)" : "var(--text2)",
                textDecoration: "none", fontSize: 13, transition: "all 0.15s",
              }}>
                <span style={{ flex: 1, fontWeight: isActive(item.href) ? 500 : 400 }}>{item.label}</span>
                {item.badge && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 20, background: "var(--accent2)", color: "var(--text)", letterSpacing: "0.04em" }}>{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}

        <div style={{ marginTop: "auto", padding: "14px 18px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #111 0%, #333 100%)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0, border: "1px solid var(--border)" }}>CK</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Admin</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>Super admin</div>
          </div>
          <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 6, display: "flex", alignItems: "center" }}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3"/><polyline points="11,11 14,8 11,5"/><line x1="14" y1="8" x2="6" y2="8"/></svg>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        
        {/* TOPBAR */}
        <div className="topbar-content" style={{ height: 56, flexShrink: 0, background: "rgba(21,21,22,0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 16 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="md:hidden" style={{ background: "none", border: "none", color: "var(--text)", padding: 4, display: "block", cursor: "pointer" }} onClick={() => setSidebarOpen(true)}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {NAV.flatMap(g => g.items).find(i => isActive(i.href))?.label || "Admin"}
            </div>
          </div>

          <Link href="/admin/list-product" className="btn btn-accent btn-sm" style={{ textDecoration: "none" }}>
            + Product
          </Link>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "var(--bg)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
