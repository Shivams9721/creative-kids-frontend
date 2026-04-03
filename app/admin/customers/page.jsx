"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Derive customers from orders — group by user_email
    safeFetch("/api/admin/orders")
      .then(orders => {
        if (!Array.isArray(orders)) return;
        const map = {};
        orders.forEach(o => {
          const email = o.user_email;
          if (!email) return;
          if (!map[email]) map[email] = { email, name: o.customer_name, orders: 0, ltv: 0, lastOrder: o.created_at };
          map[email].orders += 1;
          map[email].ltv += parseFloat(o.total_amount) || 0;
          if (new Date(o.created_at) > new Date(map[email].lastOrder)) map[email].lastOrder = o.created_at;
        });
        setCustomers(Object.values(map).sort((a, b) => b.ltv - a.ltv));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const initials = (name) => (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";
  const COLORS = ["var(--pink2)","var(--blue2)","var(--purple2)","var(--green2)","var(--amber2)"];
  const TEXT_COLORS = ["var(--pink)","var(--blue)","var(--purple)","var(--green)","var(--amber)"];

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="alert alert-accent mb16">
        <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
        <span>Customer data is derived from order history. {customers.length} unique customers found.</span>
      </div>

      <div className="filter-bar mb16">
        <input className="filter-input" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? <div style={{ padding: 24, color: "var(--text3)" }}>Loading…</div> : (
          <table className="tbl">
            <thead><tr><th>Customer</th><th>Orders</th><th>LTV</th><th>Avg order</th><th>Last order</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>No customers found</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.email}>
                  <td>
                    <div className="flex-center gap12">
                      <div className="customer-avatar" style={{ background: COLORS[i % 5], color: TEXT_COLORS[i % 5] }}>{initials(c.name)}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name || "—"}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)" }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.orders}</td>
                  <td style={{ fontWeight: 500, color: c.ltv >= 5000 ? "var(--accent)" : "var(--text)" }}>₹{c.ltv.toLocaleString("en-IN")}</td>
                  <td>₹{Math.round(c.ltv / c.orders).toLocaleString("en-IN")}</td>
                  <td style={{ fontSize: 11, color: "var(--text3)" }}>{fmtDate(c.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
