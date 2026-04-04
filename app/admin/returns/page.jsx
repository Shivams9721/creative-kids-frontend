"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

const STATUS_FLOW = ["Pending", "Approved", "Verified", "Refund Initiated", "Completed", "Rejected"];
const STATUS_COLORS = {
  Pending: "tag-amber", Approved: "tag-green", Verified: "tag-blue",
  "Refund Initiated": "tag-purple", Completed: "tag-green", Rejected: "tag-red"
};

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [pickupAwb, setPickupAwb] = useState({});

  useEffect(() => {
    safeFetch("/api/admin/returns")
      .then(d => setReturns(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const updated = await safeFetch(`/api/admin/returns/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, pickup_awb: pickupAwb[id] || undefined }),
      });
      setReturns(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      if (updated.refund_details?.type === 'manual_bank_transfer') {
        alert(`⚠️ COD Refund — Please transfer ₹${updated.refund_details.amount} manually:\n\n${
          updated.refund_details.preference === 'upi'
            ? `UPI: ${updated.refund_details.upi}`
            : `Account: ${updated.refund_details.account_number}\nIFSC: ${updated.refund_details.ifsc}\nName: ${updated.refund_details.account_name}`
        }`);
      }
    } catch (e) { alert(e.message || "Failed to update return"); }
    finally { setUpdating(null); }
  };

  const pending = returns.filter(r => r.status === "Pending").length;
  const needsRefund = returns.filter(r => r.status === "Verified").length;

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="g3 mb16">
        <div className="kpi"><div className="kpi-label">Pending review</div><div className="kpi-val" style={{ color: "var(--amber)" }}>{loading ? "…" : pending}</div></div>
        <div className="kpi"><div className="kpi-label">Awaiting refund</div><div className="kpi-val" style={{ color: "var(--blue)" }}>{loading ? "…" : needsRefund}</div></div>
        <div className="kpi"><div className="kpi-label">Total requests</div><div className="kpi-val">{loading ? "…" : returns.length}</div></div>
      </div>

      {loading ? <div style={{ color: "var(--text3)" }}>Loading…</div> : returns.length === 0 ? (
        <div style={{ color: "var(--text3)", fontSize: 12 }}>No return requests</div>
      ) : returns.map(r => (
        <div key={r.id} className="return-card" style={{ marginBottom: 10 }}>
          {/* Header */}
          <div className="flex-center gap12 mb8" style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>RET-{String(r.id).padStart(3, "0")}</span>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>·</span>
            <span style={{ fontSize: 11 }}>{r.order_number || `Order #${r.order_id}`}</span>
            {r.payment_method === 'COD' && <span className="tag tag-amber" style={{ fontSize: 9 }}>COD</span>}
            <span className={`tag ${STATUS_COLORS[r.status] || "tag-gray"}`} style={{ marginLeft: "auto" }}>{r.status}</span>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>{expanded === r.id ? "▲" : "▼"}</span>
          </div>

          <div className="flex-center gap12" style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.user_name || "Customer"}</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.user_email}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginLeft: "auto" }}>₹{r.refund_amount || "—"}</div>
          </div>

          <div style={{ background: "var(--bg4)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
            <b>Reason:</b> {r.reason}{r.comments ? ` — ${r.comments}` : ""}
          </div>

          {/* Expanded details */}
          {expanded === r.id && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>

              {/* Bank details for COD */}
              {r.payment_method === 'COD' && (
                <div style={{ background: "var(--amber2)", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: "var(--amber)", marginBottom: 6 }}>💳 Refund Details (COD)</div>
                  {r.refund_preference === 'upi' ? (
                    <div>UPI: <b>{r.bank_upi}</b></div>
                  ) : (
                    <div style={{ lineHeight: 1.8 }}>
                      <div>Name: <b>{r.bank_account_name}</b></div>
                      <div>Account: <b>{r.bank_account_number}</b></div>
                      <div>IFSC: <b>{r.bank_ifsc}</b></div>
                    </div>
                  )}
                </div>
              )}

              {/* Pickup AWB input */}
              {(r.status === "Approved" || r.status === "Verified") && (
                <div style={{ marginBottom: 12 }}>
                  <div className="field-label">Reverse Pickup AWB (optional)</div>
                  <input className="field-input" placeholder="Enter Delhivery reverse pickup AWB"
                    value={pickupAwb[r.id] || r.pickup_awb || ""}
                    onChange={e => setPickupAwb(p => ({ ...p, [r.id]: e.target.value }))} />
                </div>
              )}

              {/* Status timeline */}
              <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 12 }}>
                {["Pending","Approved","Verified","Refund Initiated","Completed"].map((s, i, arr) => {
                  const statuses = ["Pending","Approved","Verified","Refund Initiated","Completed"];
                  const done = statuses.indexOf(s) <= statuses.indexOf(r.status);
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "var(--accent)" : "var(--border2)", flexShrink: 0 }} />
                      {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: done && statuses.indexOf(s) < statuses.indexOf(r.status) ? "var(--accent)" : "var(--border2)" }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons based on current status */}
          <div className="flex-center gap8" style={{ flexWrap: "wrap" }}>
            {r.status === "Pending" && (
              <>
                <button className="btn btn-sm" style={{ background: "var(--green2)", color: "var(--green)", border: "none" }}
                  disabled={updating === r.id} onClick={() => updateStatus(r.id, "Approved")}>
                  {updating === r.id ? "…" : "✓ Approve & Schedule Pickup"}
                </button>
                <button className="btn btn-sm btn-danger" disabled={updating === r.id} onClick={() => updateStatus(r.id, "Rejected")}>
                  {updating === r.id ? "…" : "✗ Reject"}
                </button>
              </>
            )}
            {r.status === "Approved" && (
              <button className="btn btn-sm btn-accent" disabled={updating === r.id} onClick={() => updateStatus(r.id, "Verified")}>
                {updating === r.id ? "…" : "✓ Product Received & Verified"}
              </button>
            )}
            {r.status === "Verified" && (
              <button className="btn btn-sm" style={{ background: "var(--blue2)", color: "var(--blue)", border: "none" }}
                disabled={updating === r.id} onClick={() => updateStatus(r.id, "Refund Initiated")}>
                {updating === r.id ? "…" : `💸 Initiate Refund ₹${r.refund_amount}`}
              </button>
            )}
            {r.status === "Refund Initiated" && (
              <button className="btn btn-sm" style={{ background: "var(--green2)", color: "var(--green)", border: "none" }}
                disabled={updating === r.id} onClick={() => updateStatus(r.id, "Completed")}>
                {updating === r.id ? "…" : "✓ Mark Completed"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
