"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import "./admin.css";

const NAV = [
  { group: "Overview", items: [
    { id: "dashboard", label: "Dashboard", href: "/admin", badge: null },
    { id: "analytics", label: "Analytics", href: "/admin/analytics", badge: null },
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
    { id: "coupons", label: "Coupons", href: "/admin/coupons", badge: null },
    { id: "customers", label: "Customers", href: "/admin/customers", badge: null },
  ]},
  { group: "System", items: [
    { id: "settings", label: "Settings", href: "/admin/settings", badge: null },
  ]},
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  // Don't apply auth guard or shell to the login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return; // login page handles itself
    const token = localStorage.getItem("adminToken");
    if (!token) { router.replace("/admin/login"); return; }
    setAuthed(true);
  }, [router, isLoginPage]);

  // Login page renders without the admin shell
  if (isLoginPage) return <>{children}</>;

  // Other admin pages wait for auth check
  if (!authed) return null;

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    document.cookie = "adminToken=; path=/; max-age=0";
    router.replace("/admin/login");
  };

  const isActive = (href) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="admin-root" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* SIDEBAR */}
      <aside style={{ width: 224, flexShrink: 0, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><path d="M8 2C5.2 2 3 4.2 3 7c0 2.4 1.6 4.4 3.8 5.1V13h2.4v-0.9C11.4 11.4 13 9.4 13 7c0-2.8-2.2-5-5-5z" fill="#0d0d0d"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Creative Kids</div>
            <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Admin Console</div>
          </div>
        </div>

        {NAV.map(group => (
          <div key={group.group} style={{ padding: "10px 0 4px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 18px 6px" }}>{group.group}</div>
            {group.items.map(item => (
              <Link key={item.id} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "9px 18px",
                borderLeft: `2px solid ${isActive(item.href) ? "var(--accent)" : "transparent"}`,
                background: isActive(item.href) ? "var(--accent3)" : "transparent",
                color: isActive(item.href) ? "var(--text)" : "var(--text2)",
                textDecoration: "none", fontSize: 12.5, transition: "all 0.15s",
              }}>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 20, background: "var(--accent2)", color: "var(--accent)", letterSpacing: "0.04em" }}>{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}

        <div style={{ marginTop: "auto", padding: "14px 18px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent) 0%, #8ee000 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#0d0d0d", flexShrink: 0 }}>CK</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Admin</div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>Super admin</div>
          </div>
          <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4 }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3"/><polyline points="11,11 14,8 11,5"/><line x1="14" y1="8" x2="6" y2="8"/></svg>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOPBAR */}
        <div style={{ height: 52, flexShrink: 0, background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {NAV.flatMap(g => g.items).find(i => isActive(i.href))?.label || "Admin"}
          </div>
          <Link href="/admin/list-product" style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "var(--accent)", color: "#0d0d0d", border: "1px solid var(--accent)", textDecoration: "none" }}>
            + List product
          </Link>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
