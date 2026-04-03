"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", expires_at: "" });

  useEffect(() => {
    safeFetch("/api/admin/coupons")
      .then(d => setCoupons(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCoupon = async (id) => {
    try {
      const updated = await safeFetch(`/api/admin/coupons/${id}`, { method: "PUT" });
      setCoupons(prev => prev.map(c => c.id === id ? updated : c));
    } catch { alert("Failed to update coupon"); }
  };

  const createCoupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await safeFetch("/api/admin/coupons", { method: "POST", body: JSON.stringify(form) });
      setCoupons(prev => [created, ...prev]);
      setShowForm(false);
      setForm({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", expires_at: "" });
    } catch { alert("Failed to create coupon"); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="flex-center mb16" style={{ justifyContent: "space-between" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Coupon codes</div>
        <button className="btn btn-accent btn-sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? "Cancel" : "+ Create coupon"}
        </button>
      </div>

      {showForm && (
        <div className="card card-pad mb16">
          <div className="card-title">New coupon</div>
          <form onSubmit={createCoupon}>
            <div className="g2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                <div className="field-label">Code</div>
                <input className="field-input" placeholder="WELCOME20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
              </div>
              <div>
                <div className="field-label">Discount type</div>
                <select className="field-input" value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat amount (₹)</option>
                </select>
              </div>
              <div>
                <div className="field-label">Discount value</div>
                <input className="field-input" type="number" placeholder={form.discount_type === "percent" ? "20" : "100"} value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} required />
              </div>
              <div>
                <div className="field-label">Min order amount (₹)</div>
                <input className="field-input" type="number" placeholder="500" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} />
              </div>
              <div>
                <div className="field-label">Max uses (blank = unlimited)</div>
                <input className="field-input" type="number" placeholder="100" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
              </div>
              <div>
                <div className="field-label">Expires at (optional)</div>
                <input className="field-input" type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-accent btn-sm" disabled={saving}>{saving ? "Saving…" : "Create coupon"}</button>
          </form>
        </div>
      )}

      {loading ? <div style={{ color: "var(--text3)" }}>Loading…</div> : coupons.length === 0 ? (
        <div style={{ color: "var(--text3)", fontSize: 12 }}>No coupons yet</div>
      ) : coupons.map(c => {
        const usePct = c.max_uses ? Math.min(100, Math.round((c.uses / c.max_uses) * 100)) : null;
        const expired = c.expires_at && new Date(c.expires_at) < new Date();
        return (
          <div key={c.id} className="coupon-row" style={expired ? { opacity: 0.5 } : {}}>
            <div className="coupon-code">{c.code}</div>
            <span className={`tag ${c.discount_type === "percent" ? "tag-purple" : "tag-green"}`}>
              {c.discount_type === "percent" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
            </span>
            <div style={{ flex: 1, marginLeft: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                Min ₹{c.min_order_amount || 0} · {c.uses}/{c.max_uses ?? "∞"} uses
                {c.expires_at && ` · Expires ${new Date(c.expires_at).toLocaleDateString("en-IN")}`}
              </div>
              {usePct !== null && (
                <div style={{ marginTop: 4, height: 3, background: "var(--bg4)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${usePct}%`, height: "100%", background: "var(--purple)", borderRadius: 2 }} />
                </div>
              )}
            </div>
            <label className="toggle">
              <input type="checkbox" checked={c.is_active} onChange={() => toggleCoupon(c.id)} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
        );
      })}
    </div>
  );
}
