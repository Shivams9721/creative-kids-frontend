"use client";
import { useState, useEffect, useCallback } from "react";
import { safeFetch } from "../api";

const STATUS_COLORS = { Processing: "tag-blue", Shipped: "tag-purple", Delivered: "tag-green", Cancelled: "tag-red", New: "tag-amber" };

// ── Ship Modal ────────────────────────────────────────────────────────────────
function ShipModal({ order, onClose, onShipped }) {
  const [form, setForm] = useState({ weight: 500, length: 20, breadth: 15, height: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleShip = async () => {
    setLoading(true); setError("");
    try {
      const data = await safeFetch(`/api/admin/orders/${order.id}/ship`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      onShipped(order.id, data.awb, data.tracking_url);
      onClose();
    } catch (e) { setError(e.message || "Failed to create shipment"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }} onClick={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, width: 380, zIndex: 101 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Ship via Delhivery</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 18 }}>×</button>
        </div>

        <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>{order.order_number}</div>
          <div style={{ color: "var(--text3)", marginTop: 2 }}>{order.customer_name} · ₹{order.total_amount} · {order.payment_method}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Weight (grams)", key: "weight", placeholder: "500" },
            { label: "Length (cm)", key: "length", placeholder: "20" },
            { label: "Breadth (cm)", key: "breadth", placeholder: "15" },
            { label: "Height (cm)", key: "height", placeholder: "10" },
          ].map(f => (
            <div key={f.key}>
              <div className="field-label">{f.label}</div>
              <input
                type="number"
                className="field-input"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        {error && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 12, padding: "8px 10px", background: "var(--red2)", borderRadius: 6 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-accent" style={{ flex: 1 }} disabled={loading} onClick={handleShip}>
            {loading ? "Creating shipment…" : "Create Shipment"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }) {
  const [tracking, setTracking] = useState(null);
  const [loadingTrack, setLoadingTrack] = useState(false);

  useEffect(() => {
    if (!order.awb_number) return;
    setLoadingTrack(true);
    safeFetch(`/api/tracking/${order.awb_number}`)
      .then(d => setTracking(d))
      .catch(() => {})
      .finally(() => setLoadingTrack(false));
  }, [order.awb_number]);

  let items = [];
  try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch {}
  let address = {};
  try { address = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {}); } catch {}

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }} onClick={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, width: 480, maxHeight: "80vh", overflowY: "auto", zIndex: 101 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{order.order_number}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 18 }}>×</button>
        </div>

        {/* Customer + Address */}
        <div style={{ marginBottom: 14 }}>
          <div className="card-title">Delivery Address</div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 600 }}>{address.fullName || order.customer_name}</div>
            <div style={{ color: "var(--text2)" }}>{address.houseNo}, {address.roadName}</div>
            <div style={{ color: "var(--text2)" }}>{address.city}, {address.state} — {address.pincode}</div>
            <div style={{ color: "var(--text2)" }}>📞 {address.phone || order.phone}</div>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="card-title">Items</div>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                <span>{item.title} — {item.selectedSize} / {item.selectedColor}</span>
                <span style={{ color: "var(--text3)" }}>×{item.quantity || 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tracking */}
        {order.awb_number && (
          <div>
            <div className="card-title">
              Tracking — {order.awb_number}
              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: 8, fontSize: 10, color: "var(--accent)", textDecoration: "none" }}>
                  Open on Delhivery ↗
                </a>
              )}
            </div>
            {loadingTrack ? (
              <div style={{ color: "var(--text3)", fontSize: 12 }}>Loading tracking…</div>
            ) : tracking ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span className="tag tag-blue">{tracking.status}</span>
                  {tracking.expected_delivery && (
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>
                      Expected: {new Date(tracking.expected_delivery).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </div>
                <div className="timeline">
                  {(tracking.events || []).slice(0, 6).map((e, i) => (
                    <div key={i} className="tl-item">
                      <div className="tl-dot" style={{ background: i === 0 ? "var(--accent)" : "var(--border2)" }} />
                      <div className="tl-content">
                        <div className="tl-event">{e.status}</div>
                        <div className="tl-time">{e.location} · {e.time ? new Date(e.time).toLocaleString("en-IN") : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text3)" }}>No tracking data yet</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Orders Page ──────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updating, setUpdating] = useState(null);
  const [pipeline, setPipeline] = useState({});
  const [shipOrder, setShipOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [o, funnel] = await Promise.all([
        safeFetch("/api/admin/orders"),
        safeFetch("/api/admin/analytics/order-funnel"),
      ]);
      const list = Array.isArray(o) ? o : [];
      setOrders(list);
      const map = {};
      (Array.isArray(funnel) ? funnel : []).forEach(r => { map[r.status] = parseInt(r.count); });
      setPipeline(map);
      setLastRefresh(new Date());
    } catch { setOrders([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [load]);

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

  const onShipped = (id, awb, trackingUrl) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "Shipped", awb_number: awb, tracking_url: trackingUrl } : o));
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      {shipOrder && <ShipModal order={shipOrder} onClose={() => setShipOrder(null)} onShipped={onShipped} />}
      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

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
        <button className="btn btn-sm" onClick={() => load(true)} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
            <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round"/><polyline points="14,2 14,8 8,8"/>
          </svg>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
        {lastRefresh && <span style={{ fontSize: 10, color: "var(--text3)", flexShrink: 0 }}>Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
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
                  <td>
                    <div>
                      <span className={`tag ${STATUS_COLORS[o.status] || "tag-gray"}`}><span className="tag-dot" />{o.status}</span>
                      {o.awb_number && <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{o.awb_number}</div>}
                    </div>
                  </td>
                  <td>
                    <div className="flex-center gap6">
                      {o.status === "Processing" && !o.awb_number && (
                        <button className="btn btn-sm btn-accent" disabled={updating === o.id} onClick={() => setShipOrder(o)}>
                          Ship
                        </button>
                      )}
                      {o.status === "New" && (
                        <button className="btn btn-sm btn-accent" disabled={updating === o.id} onClick={() => updateStatus(o.id, "Processing")}>
                          {updating === o.id ? "…" : "Process"}
                        </button>
                      )}
                      {o.status === "Shipped" && o.awb_number && (
                        <>
                          <a href={o.tracking_url || `https://www.delhivery.com/track/package/${o.awb_number}`}
                            target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ textDecoration: "none" }}>
                            Track
                          </a>
                          <button className="btn btn-sm btn-danger" disabled={updating === o.id}
                            onClick={async () => {
                              if (!window.confirm(`Cancel Delhivery shipment for ${o.order_number}? This will cancel the AWB on Delhivery and mark the order as Cancelled.`)) return;
                              setUpdating(o.id);
                              try {
                                await safeFetch(`/api/admin/orders/${o.id}/cancel-shipment`, { method: "POST" });
                                setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: "Cancelled", awb_number: null, tracking_url: null } : x));
                              } catch (e) { alert(e.message || "Failed to cancel shipment"); }
                              finally { setUpdating(null); }
                            }}>
                            {updating === o.id ? "…" : "Cancel"}
                          </button>
                        </>
                      )}
                      {o.status === "Shipped" && o.awb_number && (
                        <button className="btn btn-sm btn-danger" disabled={updating === o.id}
                          onClick={async () => {
                            if (!window.confirm(`Cancel Delhivery shipment for ${o.order_number}?\n\nThis only works before pickup. If already picked up, contact Delhivery support.`)) return;
                            setUpdating(o.id);
                            try {
                              await safeFetch(`/api/admin/orders/${o.id}/cancel-shipment`, { method: "POST" });
                              setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: "Processing", awb_number: null, tracking_url: null } : x));
                            } catch (e) { alert(e.message || "Could not cancel shipment"); }
                            finally { setUpdating(null); }
                          }}>
                          {updating === o.id ? "…" : "Cancel Ship"}
                        </button>
                      )}
                      <button className="btn btn-sm" onClick={() => setDetailOrder(o)}>Details</button>
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
