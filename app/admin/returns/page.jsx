"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    safeFetch("/api/admin/returns")
      .then(d => setReturns(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const updated = await safeFetch(`/api/admin/returns/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status: updated.status } : r));
    } catch { alert("Failed to update return"); }
    finally { setUpdating(null); }
  };

  const pending = returns.filter(r => r.status === "Pending");
  const approved = returns.filter(r => r.status === "Approved");

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="g3 mb16">
        <div className="kpi"><div className="kpi-label">Pending review</div><div className="kpi-val" style={{ color: "var(--amber)" }}>{loading ? "…" : pending.length}</div></div>
        <div className="kpi"><div className="kpi-label">Approved</div><div className="kpi-val">{loading ? "…" : approved.length}</div></div>
        <div className="kpi"><div className="kpi-label">Total requests</div><div className="kpi-val">{loading ? "…" : returns.length}</div></div>
      </div>

      {loading ? <div style={{ color: "var(--text3)" }}>Loading…</div> : returns.length === 0 ? (
        <div style={{ color: "var(--text3)", fontSize: 12 }}>No return requests</div>
      ) : returns.map(r => (
        <div key={r.id} className="return-card">
          <div className="flex-center gap12 mb8">
            <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>RET-{String(r.id).padStart(3, "0")}</span>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>·</span>
            <span style={{ fontSize: 11 }}>Order #{r.order_number || r.order_id}</span>
            <span className={`tag ${r.status === "Pending" ? "tag-amber" : r.status === "Approved" ? "tag-green" : "tag-red"}`} style={{ marginLeft: "auto" }}>{r.status}</span>
          </div>
          <div className="flex-center gap12" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.user_name || "Customer"}</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.user_email}</div>
          </div>
          <div style={{ background: "var(--bg4)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
            <b>Reason:</b> {r.reason}{r.comments ? ` — ${r.comments}` : ""}
          </div>
          {r.status === "Pending" && (
            <div className="flex-center gap8">
              <button className="btn btn-sm" style={{ background: "var(--green2)", color: "var(--green)", border: "none" }}
                disabled={updating === r.id} onClick={() => updateStatus(r.id, "Approved")}>
                {updating === r.id ? "…" : "Approve refund"}
              </button>
              <button className="btn btn-sm btn-danger" disabled={updating === r.id} onClick={() => updateStatus(r.id, "Rejected")}>
                {updating === r.id ? "…" : "Reject"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
