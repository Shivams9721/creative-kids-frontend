"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { safeFetch } from "./api";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, o] = await Promise.all([
          safeFetch("/api/admin/stats/full"),
          safeFetch("/api/admin/orders"),
        ]);
        setStats(s);
        setRecentOrders((Array.isArray(o) ? o : []).slice(0, 3));
      } catch {
        // keep nulls — UI shows dashes
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n) => n == null ? "—" : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      {/* KPI ROW */}
      <div className="g4 mb16">
        <div className="kpi">
          <div className="kpi-label">Total revenue</div>
          <div className="kpi-val" style={{ color: "var(--accent)" }}>{loading ? "…" : fmt(stats?.totalRevenue)}</div>
          <div className="kpi-sub">All time</div>
          <div className="kpi-glyph" style={{ background: "var(--accent2)" }}><span style={{ fontSize: 18 }}>₹</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Active orders</div>
          <div className="kpi-val">{loading ? "…" : stats?.activeOrders ?? "—"}</div>
          <div className="kpi-sub"><b style={{ color: "var(--text)" }}>{loading ? "" : stats?.todayOrders ?? 0} new</b> today</div>
          <div className="kpi-glyph" style={{ background: "var(--blue2)" }}>
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="var(--blue)" strokeWidth={1.5}><path d="M2 2H3.5L5 10H12L14 5H5"/><circle cx="6.5" cy="13" r="1"/><circle cx="11" cy="13" r="1"/></svg>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Products live</div>
          <div className="kpi-val">{loading ? "…" : stats?.totalProducts ?? "—"}</div>
          <div className="kpi-sub"><span style={{ color: "var(--amber)" }}>{loading ? "" : stats?.lowStockProducts ?? 0} low stock</span></div>
          <div className="kpi-glyph" style={{ background: "var(--purple2)" }}>
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="var(--purple)" strokeWidth={1.5}><rect x="2" y="2" width="12" height="12" rx="2"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="6" y1="6" x2="6" y2="14"/></svg>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Today revenue</div>
          <div className="kpi-val">{loading ? "…" : fmt(stats?.todayRevenue)}</div>
          <div className="kpi-sub">{loading ? "" : stats?.todayOrders ?? 0} orders today</div>
          <div className="kpi-glyph" style={{ background: "var(--pink2)" }}>
            <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="var(--pink)" strokeWidth={1.5}><polyline points="1,13 5,8 9,10 15,3"/></svg>
          </div>
        </div>
      </div>

      <div className="g2 mb16">
        {/* RECENT ORDERS */}
        <div className="card card-pad">
          <div className="card-title">Recent orders</div>
          {loading ? <div style={{ color: "var(--text3)", fontSize: 12 }}>Loading…</div> : recentOrders.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 12 }}>No orders yet</div>
          ) : recentOrders.map(o => (
            <div key={o.id} className="order-mini">
              <div style={{ flex: 1 }}>
                <div className="order-num">{o.order_number || `#${o.id}`}</div>
                <div className="order-customer">{o.customer_name} · ₹{o.total_amount}</div>
              </div>
              <span className={`tag ${o.status === "Shipped" ? "tag-purple" : o.status === "Delivered" ? "tag-green" : o.status === "Cancelled" ? "tag-red" : "tag-blue"}`}>
                <span className="tag-dot" />{o.status}
              </span>
            </div>
          ))}
          <Link href="/admin/orders" style={{ display: "block", marginTop: 10, textAlign: "center", fontSize: 12, color: "var(--text3)", textDecoration: "none" }}>View all orders →</Link>
        </div>

        {/* ORDER PIPELINE */}
        <div className="card card-pad">
          <div className="card-title">Order pipeline</div>
          <OrderPipeline />
        </div>
      </div>

      {/* ALERT */}
      {stats?.lowStockProducts > 0 && (
        <div className="alert alert-amber">
          <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0 }}><path d="M8 2L14 14H2Z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12.5" r="0.5" fill="currentColor"/></svg>
          <span className="alert-msg"><b>{stats.lowStockProducts} products</b> are low on stock · <b>{stats.activeOrders} orders</b> awaiting action</span>
        </div>
      )}
    </div>
  );
}

function OrderPipeline() {
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    safeFetch("/api/admin/analytics/order-funnel")
      .then(rows => {
        const map = {};
        (Array.isArray(rows) ? rows : []).forEach(r => { map[r.status] = parseInt(r.count); });
        setCounts(map);
      }).catch(() => {});
  }, []);

  const steps = [
    { label: "New", key: "Processing", color: "var(--amber)" },
    { label: "Processing", key: "Processing", color: "var(--blue)", active: true },
    { label: "Shipped", key: "Shipped", color: "var(--purple)" },
    { label: "Delivered", key: "Delivered", color: "var(--green)" },
    { label: "Cancelled", key: "Cancelled", color: "var(--red)" },
  ];

  return (
    <div className="pipeline">
      {steps.map((s, i) => (
        <div key={i} className={`pipe-step${s.active ? " active" : ""}`}>
          <div className="pipe-num" style={s.active ? {} : { color: s.color }}>{counts ? (counts[s.key] ?? 0) : "…"}</div>
          <div className="pipe-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
