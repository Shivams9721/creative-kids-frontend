"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

const STATUS_COLORS = { confirmed: "tag-green", pending: "tag-amber", rejected: "tag-red", unmatched: "tag-gray" };

export default function SkuReconciliation() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [editSku, setEditSku] = useState("");

  useEffect(() => {
    load();
    safeFetch("/api/admin/easyecom/status").then(setStatus).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    safeFetch("/api/admin/sku-mappings")
      .then(d => setMappings(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const sync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const result = await safeFetch("/api/admin/easyecom/sync", { method: "POST" });
      setSyncResult(result);
      load();
      safeFetch("/api/admin/easyecom/status").then(setStatus).catch(() => {});
    } catch (e) { setSyncResult({ error: e.message }); }
    finally { setSyncing(false); }
  };

  const updateMapping = async (id, status, easyecom_sku) => {
    try {
      const updated = await safeFetch(`/api/admin/sku-mappings/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, easyecom_sku }),
      });
      setMappings(prev => prev.map(m => m.id === id ? updated : m));
      setEditing(null);
    } catch { alert("Failed to update mapping"); }
  };

  const filtered = mappings.filter(m => filter === "all" || m.status === filter);
  const counts = { all: mappings.length };
  mappings.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1; });

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>SKU Reconciliation</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>
            Match your product SKUs with EasyEcom inventory
            {status?.last_sync && ` · Last sync: ${new Date(status.last_sync).toLocaleString("en-IN")}`}
          </div>
        </div>
        <button className="btn btn-accent btn-sm" disabled={syncing} onClick={sync}
          style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}
            style={{ animation: syncing ? "spin 1s linear infinite" : "none" }}>
            <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round"/><polyline points="14,2 14,8 8,8"/>
          </svg>
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className={`alert ${syncResult.error ? "alert-red" : "alert-green"} mb16`}>
          {syncResult.error
            ? `Sync failed: ${syncResult.error}`
            : `✓ Synced ${syncResult.synced} SKUs · ${syncResult.products_updated} products updated · ${syncResult.unmatched} need review · ${syncResult.easyecom_skus} EasyEcom SKUs found`
          }
        </div>
      )}

      {/* Stats */}
      <div className="g4 mb16">
        {[
          { label: "Total SKUs", val: counts.all || 0, color: null },
          { label: "Confirmed", val: counts.confirmed || 0, color: "var(--green)" },
          { label: "Needs Review", val: counts.pending || 0, color: "var(--amber)" },
          { label: "Unmatched", val: counts.unmatched || 0, color: "var(--red)" },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={k.color ? { color: k.color } : {}}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {[["all","All"],["pending","Needs Review"],["unmatched","Unmatched"],["confirmed","Confirmed"],["rejected","Rejected"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ flex: 1, padding: "8px 4px", fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none",
              borderRight: "1px solid var(--border)", background: filter === val ? "var(--accent)" : "var(--bg2)",
              color: filter === val ? "#0d0d0d" : "var(--text2)" }}>
            {label} {counts[val] ? `(${counts[val]})` : ""}
          </button>
        ))}
      </div>

      {/* Mappings table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? <div style={{ padding: 24, color: "var(--text3)" }}>Loading…</div> : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
            {filter === "all" ? "No SKU mappings yet. Click Sync Now to start." : `No ${filter} mappings`}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Your SKU</th>
                <th>EasyEcom SKU</th>
                <th>Match Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td className="mono" style={{ fontSize: 11 }}>{m.internal_sku}</td>
                  <td>
                    {editing === m.id ? (
                      <input className="field-input" style={{ padding: "4px 8px", fontSize: 12 }}
                        value={editSku} onChange={e => setEditSku(e.target.value)}
                        placeholder="Enter EasyEcom SKU" />
                    ) : (
                      <span className="mono" style={{ fontSize: 11, color: m.easyecom_sku ? "var(--text)" : "var(--text3)" }}>
                        {m.easyecom_sku || "—"}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 40, height: 4, background: "var(--bg4)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${m.match_score}%`, height: "100%", borderRadius: 2,
                          background: m.match_score >= 85 ? "var(--green)" : m.match_score >= 50 ? "var(--amber)" : "var(--red)" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>{m.match_score}%</span>
                    </div>
                  </td>
                  <td><span className={`tag ${STATUS_COLORS[m.status] || "tag-gray"}`}><span className="tag-dot" />{m.status}</span></td>
                  <td>
                    <div className="flex-center gap6">
                      {editing === m.id ? (
                        <>
                          <button className="btn btn-sm btn-accent" onClick={() => updateMapping(m.id, "confirmed", editSku)}>Save</button>
                          <button className="btn btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {m.status === "pending" && (
                            <>
                              <button className="btn btn-sm" style={{ background: "var(--green2)", color: "var(--green)", border: "none" }}
                                onClick={() => updateMapping(m.id, "confirmed", m.easyecom_sku)}>
                                ✓ Confirm
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => updateMapping(m.id, "rejected", null)}>
                                ✗ Reject
                              </button>
                            </>
                          )}
                          <button className="btn btn-sm" onClick={() => { setEditing(m.id); setEditSku(m.easyecom_sku || ""); }}>
                            Edit
                          </button>
                        </>
                      )}
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
