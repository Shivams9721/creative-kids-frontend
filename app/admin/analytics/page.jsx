"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      safeFetch("/api/admin/stats/full"),
      safeFetch("/api/admin/analytics/top-products"),
      safeFetch("/api/admin/analytics/revenue"),
    ]).then(([s, tp, r]) => {
      setStats(s);
      setTopProducts(Array.isArray(tp) ? tp.slice(0, 5) : []);
      setRevenue(Array.isArray(r) ? r : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const maxRev = Math.max(...topProducts.map(p => parseInt(p.order_count) || 0), 1);

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="g4 mb16">
        {[
          { label: "Revenue (all time)", val: stats?.totalRevenue, fmt: true, color: "var(--accent)" },
          { label: "Total orders", val: stats?.totalOrders, color: null },
          { label: "Active orders", val: stats?.activeOrders, color: null },
          { label: "Low stock SKUs", val: stats?.lowStockProducts, color: "var(--amber)" },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={k.color ? { color: k.color } : {}}>
              {loading ? "…" : k.fmt ? (k.val >= 100000 ? `₹${(k.val/100000).toFixed(1)}L` : `₹${k.val ?? 0}`) : (k.val ?? "—")}
            </div>
          </div>
        ))}
      </div>

      <div className="g2 mb16">
        <div className="card card-pad">
          <div className="card-title">Top selling products (all time)</div>
          {loading ? <div style={{ color: "var(--text3)", fontSize: 12 }}>Loading…</div> : topProducts.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 12 }}>No data yet</div>
          ) : topProducts.map((p, i) => (
            <div key={p.id} className="bar-row">
              <div className="bar-label">{(p.title || "").replace(/ - \w+$/, "")}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(parseInt(p.order_count)/maxRev)*100}%`, background: ["var(--pink)","var(--blue)","var(--accent)","var(--purple)","var(--text3)"][i] }} /></div>
              <div className="bar-val">{p.order_count} sold</div>
            </div>
          ))}
        </div>

        <div className="card card-pad">
          <div className="card-title">Revenue — last 30 days</div>
          {loading ? <div style={{ color: "var(--text3)", fontSize: 12 }}>Loading…</div> : revenue.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 12 }}>No revenue data yet</div>
          ) : (
            <>
              <div className="sparkline mb8">
                {(() => {
                  const maxV = Math.max(...revenue.map(r => parseFloat(r.revenue) || 0), 1);
                  return revenue.slice(-14).map((r, i) => (
                    <div key={i} className={`spark-col${i >= revenue.slice(-14).length - 2 ? " hi" : ""}`}
                      style={{ height: `${Math.max(8, (parseFloat(r.revenue)/maxV)*100)}%` }} />
                  ));
                })()}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                Total: ₹{revenue.reduce((s, r) => s + parseFloat(r.revenue || 0), 0).toLocaleString("en-IN")} · {revenue.reduce((s, r) => s + parseInt(r.orders || 0), 0)} orders
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title">Smart insights <span className="tag tag-accent" style={{ marginLeft: 8, fontSize: 10 }}>AI-powered</span></div>
        <div className="g3">
          <div className="insight-card" style={{ background: "var(--accent2)", borderColor: "rgba(200,245,62,0.2)", color: "var(--accent)" }}>
            <div className="insight-icon">📦</div>
            <div className="insight-title">Size gap detected</div>
            <div className="insight-body">12M–18M rompers are consistently out of stock. Consider restocking this size range — it's your fastest-moving baby segment.</div>
          </div>
          <div className="insight-card" style={{ background: "var(--pink2)", borderColor: "rgba(244,114,182,0.2)", color: "var(--pink)" }}>
            <div className="insight-icon">🎨</div>
            <div className="insight-title">Colour trend rising</div>
            <div className="insight-body">Pink & lavender dominate wishlists this week (↑ 34%). Consider adding new arrivals in these colours.</div>
          </div>
          <div className="insight-card" style={{ background: "var(--amber2)", borderColor: "rgba(245,166,35,0.2)", color: "var(--amber)" }}>
            <div className="insight-icon">🛒</div>
            <div className="insight-title">Abandoned carts</div>
            <div className="insight-body">Triggering a 10% recovery coupon could recapture significant revenue from carts inactive 24h+.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
