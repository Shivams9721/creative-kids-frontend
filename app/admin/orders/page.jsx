"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

const STATUS_COLORS = { Processing: "tag-blue", Shipped: "tag-purple", Delivered: "tag-green", Cancelled: "tag-red", New: "tag-amber" };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updating, setUpdating] = useState(null);
  const [pipeline, setPipeline] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const [o, funnel] = await Promise.all([
          safeFetch("/api/admin/orders"),
          safeFetch("/api/admin/analytics/order-funnel"),
        ]);
        const list = Array.isArray(o) ? o : [];
        setOrders(list);
        setFiltered(list);
        const map = {};
        (Array.isArray(funnel) ? funnel : []).forEach(r => { map[r.status] = parseInt(r.count); });
        setPipeline(map);
      } catch { setOrders([]); setFiltered([]); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    let list = orders;
    if (statusFilter !== "All") list = list.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.order_number || "").toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.user_email || "").toLowerCase().includes(q) ||
        (o.phone || "").includes(q)
      );
    }
    setFiltered(list);
  }, [search, statusFilter, orders]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await safeFetch(`/api/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch { alert("Failed to update status"); }
    finally { setUpdating(null); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      {/* PIPELINE */}
      <div className="pipeline mb16">
        {[["New","var(--amber)"],["Processing","var(--blue)"],["Shipped","var(--purple)"],["Delivered","var(--green)"],["Cancelled","var(--red)"]].map(([s, c]) => (
          <div key={s} className={`pipe-step${statusFilter === s ? " active" : ""}`} style={{ cursor: "pointer" }} onClick={() => setStatusFilter(prev => prev === s ? "All" : s)}>
            <div className="pipe-num" style={{ color: c }}>{pipeline[s] ?? 0}</div>
            <div className="pipe-label">{s}</div>
          </div>
        ))}
      </div>

      <div className="filter-bar">
        <input className="filter-input" placeholder="Search order, name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All status</option>
          {["New","Processing","Shipped","Delivered","Cancelled"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? <div style={{ padding: 24, color: "var(--text3)" }}>Loading orders…</div> : (
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>No orders found</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{o.order_number || `#${o.id}`}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{o.customer_name || "—"}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)" }}>{o.user_email}</div>
                  </td>
                  <td>{o.items_count ?? "—"}</td>
                  <td>₹{o.total_amount}</td>
                  <td><span className={`tag ${o.payment_method === "COD" ? "tag-amber" : "tag-green"}`}>{o.payment_method || "—"}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text3)" }}>{fmtDate(o.created_at)}</td>
                  <td><span className={`tag ${STATUS_COLORS[o.status] || "tag-gray"}`}><span className="tag-dot" />{o.status}</span></td>
                  <td>
                    <div className="flex-center gap6">
                      {o.status === "Processing" && (
                        <button className="btn btn-sm btn-accent" disabled={updating === o.id} onClick={() => updateStatus(o.id, "Shipped")}>
                          {updating === o.id ? "…" : "Ship"}
                        </button>
                      )}
                      {o.status === "New" && (
                        <button className="btn btn-sm btn-accent" disabled={updating === o.id} onClick={() => updateStatus(o.id, "Processing")}>
                          {updating === o.id ? "…" : "Process"}
                        </button>
                      )}
                      <button className="btn btn-sm">Details</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
