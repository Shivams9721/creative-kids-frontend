"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [settings, setSettings] = useState({
    store_name: "Creative Kid's",
    gstin: "06AAJPM1384L1ZE",
    address: "Plot No. 667, Pace City-II, Sector 37, Gurugram, Haryana – 122001",
    support_email: "support@creativekids.co.in",
    maintenance_mode: false,
    cod_enabled: true,
    reviews_enabled: true,
    cod_max_value: 1999,
    cod_first_order_max: 999,
    cod_fee: 29,
    cod_phone_verify_required: false,
    cod_pincode_check_enabled: true,
    auto_promo_enabled: true,
    auto_promo_prepaid_tier1_min: 499,
    auto_promo_prepaid_tier1_max: 999,
    auto_promo_prepaid_tier1_pct: 5,
    auto_promo_prepaid_tier2_min: 999,
    auto_promo_prepaid_tier2_pct: 10,
    auto_promo_cod_first_min: 499,
    auto_promo_cod_first_pct: 5,
  });

  useEffect(() => {
    safeFetch("/api/settings")
      .then(data => setSettings(prev => ({ ...prev, ...data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await safeFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const saveToggle = async (key, value) => {
    set(key, value);
    try {
      await safeFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      });
    } catch { alert("Failed to save"); set(key, !value); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.current) { setPwError("Enter your current password"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords don't match"); return; }
    if (pwForm.next.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    if (!/[A-Za-z]/.test(pwForm.next) || !/\d/.test(pwForm.next)) {
      setPwError("Password must include letters and numbers");
      return;
    }
    if (pwForm.current === pwForm.next) { setPwError("New password must be different from current"); return; }
    setPwError("");
    try {
      const res = await safeFetch(`/api/admin/change-password`, {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPwError(data.error || "Failed to change password");
        return;
      }
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch { setPwError("Failed to change password"); }
  };

  if (loading) return <div style={{ padding: 24, color: "var(--text3)" }}>Loading settings…</div>;

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="g2">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* STORE DETAILS */}
          <div className="card card-pad">
            <div className="card-title">Store details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Store name", key: "store_name", placeholder: "Creative Kid's" },
                { label: "GSTIN", key: "gstin", placeholder: "06AAJPM1384L1ZE", mono: true },
                { label: "Support email", key: "support_email", placeholder: "support@creativekids.co.in" },
              ].map(f => (
                <div key={f.key}>
                  <div className="field-label">{f.label}</div>
                  <input
                    className="field-input"
                    value={settings[f.key] || ""}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    style={f.mono ? { fontFamily: "'DM Mono', monospace" } : {}}
                  />
                </div>
              ))}
              <div>
                <div className="field-label">Address</div>
                <textarea
                  className="field-input"
                  value={settings.address || ""}
                  onChange={e => set("address", e.target.value)}
                  style={{ minHeight: 64 }}
                />
              </div>
              <button
                className="btn btn-accent btn-sm"
                disabled={saving}
                onClick={saveSettings}
                style={{ alignSelf: "flex-start" }}
              >
                {saving ? "Saving…" : saved ? "✓ Saved" : "Save Details"}
              </button>
            </div>
          </div>

          {/* ADMIN ACCOUNT */}
          <div className="card card-pad">
            <div className="card-title">Admin account</div>
            <div className="setting-row">
              <div>
                <div className="setting-label">Change password</div>
                <div className="setting-sub">Update admin login password</div>
              </div>
              <button className="btn btn-sm" onClick={() => { setChangingPw(v => !v); setPwError(""); setPwSuccess(false); }}>
                {changingPw ? "Cancel" : "Change"}
              </button>
            </div>
            {changingPw && (
              <form onSubmit={changePassword} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Current password", key: "current", type: "password", placeholder: "Enter current password" },
                  { label: "New password", key: "next", type: "password", placeholder: "8+ chars, letters and numbers" },
                  { label: "Confirm new password", key: "confirm", type: "password", placeholder: "Re-enter new password" },
                ].map(f => (
                  <div key={f.key}>
                    <div className="field-label">{f.label}</div>
                    <input
                      type={f.type}
                      className="field-input"
                      value={pwForm[f.key]}
                      onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      autoComplete={f.key === "current" ? "current-password" : "new-password"}
                      required
                    />
                  </div>
                ))}
                {pwError && <p style={{ fontSize: 11, color: "var(--red)" }}>{pwError}</p>}
                {pwSuccess && <p style={{ fontSize: 11, color: "var(--green)" }}>✓ Password updated</p>}
                <button type="submit" className="btn btn-accent btn-sm" disabled={changingPw} style={{ alignSelf: "flex-start" }}>
                  Update Password
                </button>
              </form>
            )}
          </div>

        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* INTEGRATIONS */}
          <div className="card card-pad">
            <div className="card-title">Integrations</div>
            {[
              { logo: "RP", name: "Razorpay", sub: "Payment gateway · live", color: "var(--blue)", connected: true },
              { logo: "S3", name: "AWS S3", sub: "Image storage · ap-south-1", color: "var(--amber)", connected: true },
              { logo: "SES", name: "AWS SES", sub: "Email delivery · SMTP configured", color: "var(--purple)", connected: true },
              { logo: "EE", name: "EasyEcom", sub: "Inventory management", color: "var(--green)", connected: false, action: "easyecom" },
              { logo: "SR", name: "Shiprocket", sub: "Shipping & auto-tracking", color: "var(--text3)", connected: false },
            ].map(i => (
              <div key={i.name} className="int-card">
                <div className="int-logo" style={{ color: i.color }}>{i.logo}</div>
                <div style={{ flex: 1 }}>
                  <div className="int-name">{i.name}</div>
                  <div className="int-sub">{i.sub}</div>
                </div>
                {i.connected
                  ? <span className="tag tag-green">Connected</span>
                  : i.action === "easyecom"
                    ? <button className="btn btn-sm btn-accent" onClick={async () => {
                        const email = prompt("EasyEcom email:", "shrawan@creativeimpression.in");
                        if (!email) return;
                        const password = prompt("EasyEcom password:");
                        if (!password) return;
                        const location_key = prompt("EasyEcom location key:", "");
                        const api_key = prompt("X-API-Key:");
                        if (!api_key) return;
                        try {
                          await safeFetch("/api/admin/easyecom/connect", {
                            method: "POST",
                            body: JSON.stringify({ email, password, location_key, api_key }),
                          });
                          alert("EasyEcom connected! Go to SKU Reconciliation to sync inventory.");
                        } catch (e) { alert(e.message || "Connection failed"); }
                      }}>Connect</button>
                    : <button className="btn btn-sm btn-accent">Connect</button>}
              </div>
            ))}
          </div>

          {/* STORE TOGGLES */}
          <div className="card card-pad">
            <div className="card-title">Store toggles</div>
            {[
              {
                key: "maintenance_mode",
                label: "Maintenance mode",
                sub: "Customers see a maintenance page — admin still works",
                danger: true,
              },
              {
                key: "cod_enabled",
                label: "COD availability",
                sub: "Allow cash on delivery at checkout",
              },
              {
                key: "reviews_enabled",
                label: "Review system",
                sub: "Allow verified buyers to submit reviews",
              },
            ].map((row, i, arr) => (
              <div key={row.key} className="setting-row" style={i === arr.length - 1 ? { border: "none" } : {}}>
                <div>
                  <div className="setting-label" style={row.danger && settings[row.key] ? { color: "var(--red)" } : {}}>
                    {row.label}
                    {row.danger && settings[row.key] && (
                      <span className="tag tag-red" style={{ marginLeft: 8, fontSize: 9 }}>ACTIVE</span>
                    )}
                  </div>
                  <div className="setting-sub">{row.sub}</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={!!settings[row.key]}
                    onChange={e => saveToggle(row.key, e.target.checked)}
                  />
                  <div className="toggle-track" /><div className="toggle-thumb" />
                </label>
              </div>
            ))}
          </div>

          {/* AUTO PROMOTIONS */}
          <div className="card card-pad">
            <div className="card-title">Welcome promotions</div>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: -6, marginBottom: 12 }}>
              Discounts applied automatically at checkout — no coupon code needed. Coupon codes always
              take priority when present.
            </p>

            <div className="setting-row">
              <div>
                <div className="setting-label">Auto-promotions enabled</div>
                <div className="setting-sub">Master toggle for the rules below.</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={!!settings.auto_promo_enabled}
                  onChange={e => saveToggle("auto_promo_enabled", e.target.checked)} />
                <div className="toggle-track" /><div className="toggle-thumb" />
              </label>
            </div>

            <div style={{ padding: 12, background: "var(--bg2)", borderRadius: 8, border: "1px solid var(--border)", marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Prepaid tier 1</div>
              <div className="g3" style={{ gap: 10 }}>
                <div>
                  <div className="field-label">Min order (₹)</div>
                  <input type="number" className="field-input" value={settings.auto_promo_prepaid_tier1_min ?? 499}
                    onChange={e => set("auto_promo_prepaid_tier1_min", Number(e.target.value) || 0)}
                    onBlur={() => saveSettings()} />
                </div>
                <div>
                  <div className="field-label">Max order (₹)</div>
                  <input type="number" className="field-input" value={settings.auto_promo_prepaid_tier1_max ?? 999}
                    onChange={e => set("auto_promo_prepaid_tier1_max", Number(e.target.value) || 0)}
                    onBlur={() => saveSettings()} />
                </div>
                <div>
                  <div className="field-label">Discount %</div>
                  <input type="number" className="field-input" value={settings.auto_promo_prepaid_tier1_pct ?? 5}
                    onChange={e => set("auto_promo_prepaid_tier1_pct", Number(e.target.value) || 0)}
                    onBlur={() => saveSettings()} />
                </div>
              </div>
            </div>

            <div style={{ padding: 12, background: "var(--bg2)", borderRadius: 8, border: "1px solid var(--border)", marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Prepaid tier 2 (above)</div>
              <div className="g2" style={{ gap: 10 }}>
                <div>
                  <div className="field-label">Min order (₹)</div>
                  <input type="number" className="field-input" value={settings.auto_promo_prepaid_tier2_min ?? 999}
                    onChange={e => set("auto_promo_prepaid_tier2_min", Number(e.target.value) || 0)}
                    onBlur={() => saveSettings()} />
                </div>
                <div>
                  <div className="field-label">Discount %</div>
                  <input type="number" className="field-input" value={settings.auto_promo_prepaid_tier2_pct ?? 10}
                    onChange={e => set("auto_promo_prepaid_tier2_pct", Number(e.target.value) || 0)}
                    onBlur={() => saveSettings()} />
                </div>
              </div>
            </div>

            <div style={{ padding: 12, background: "var(--bg2)", borderRadius: 8, border: "1px solid var(--border)", marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>First-order COD welcome</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>
                Applies only to a customer's very first COD order over the minimum.
              </div>
              <div className="g2" style={{ gap: 10 }}>
                <div>
                  <div className="field-label">Min order (₹)</div>
                  <input type="number" className="field-input" value={settings.auto_promo_cod_first_min ?? 499}
                    onChange={e => set("auto_promo_cod_first_min", Number(e.target.value) || 0)}
                    onBlur={() => saveSettings()} />
                </div>
                <div>
                  <div className="field-label">Discount %</div>
                  <input type="number" className="field-input" value={settings.auto_promo_cod_first_pct ?? 5}
                    onChange={e => set("auto_promo_cod_first_pct", Number(e.target.value) || 0)}
                    onBlur={() => saveSettings()} />
                </div>
              </div>
            </div>
          </div>

          {/* COD CONFIGURATION */}
          <div className="card card-pad">
            <div className="card-title">Cash on delivery rules</div>

            <div className="setting-row">
              <div>
                <div className="setting-label">COD ceiling (₹)</div>
                <div className="setting-sub">Block COD when order total reaches this amount.</div>
              </div>
              <input
                type="number" min={0} step={50}
                className="field-input"
                style={{ width: 110, padding: "8px 12px", fontSize: 13 }}
                value={settings.cod_max_value ?? 1999}
                onChange={e => set("cod_max_value", Number(e.target.value) || 0)}
                onBlur={() => saveSettings()}
              />
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">First-order COD ceiling (₹)</div>
                <div className="setting-sub">Lower limit applied when the customer has no prior orders.</div>
              </div>
              <input
                type="number" min={0} step={50}
                className="field-input"
                style={{ width: 110, padding: "8px 12px", fontSize: 13 }}
                value={settings.cod_first_order_max ?? 999}
                onChange={e => set("cod_first_order_max", Number(e.target.value) || 0)}
                onBlur={() => saveSettings()}
              />
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">COD convenience fee (₹)</div>
                <div className="setting-sub">Added to the order total when the customer chooses COD. Set to 0 to disable.</div>
              </div>
              <input
                type="number" min={0} step={5}
                className="field-input"
                style={{ width: 110, padding: "8px 12px", fontSize: 13 }}
                value={settings.cod_fee ?? 0}
                onChange={e => set("cod_fee", Number(e.target.value) || 0)}
                onBlur={() => saveSettings()}
              />
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Pincode COD check</div>
                <div className="setting-sub">Use Delhivery serviceability to block COD on non-supported pincodes.</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={!!settings.cod_pincode_check_enabled}
                  onChange={e => saveToggle("cod_pincode_check_enabled", e.target.checked)}
                />
                <div className="toggle-track" /><div className="toggle-thumb" />
              </label>
            </div>

            <div className="setting-row" style={{ border: "none" }}>
              <div>
                <div className="setting-label">Phone OTP for COD</div>
                <div className="setting-sub">Require buyer to verify the delivery number via SMS OTP before placing a COD order.</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={!!settings.cod_phone_verify_required}
                  onChange={e => saveToggle("cod_phone_verify_required", e.target.checked)}
                />
                <div className="toggle-track" /><div className="toggle-thumb" />
              </label>
            </div>
          </div>

          {/* LIVE STATUS */}
          <div className="card card-pad">
            <div className="card-title">Live status</div>
            <div className="setting-row">
              <div><div className="setting-label">Storefront</div><div className="setting-sub">Customer-facing website</div></div>
              <span className={`tag ${settings.maintenance_mode ? "tag-red" : "tag-green"}`}>
                <span className="tag-dot" />
                {settings.maintenance_mode ? "Maintenance" : "Live"}
              </span>
            </div>
            <div className="setting-row">
              <div><div className="setting-label">COD</div><div className="setting-sub">Cash on delivery</div></div>
              <span className={`tag ${settings.cod_enabled ? "tag-green" : "tag-gray"}`}>
                <span className="tag-dot" />
                {settings.cod_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="setting-row" style={{ border: "none" }}>
              <div><div className="setting-label">Reviews</div><div className="setting-sub">Product reviews</div></div>
              <span className={`tag ${settings.reviews_enabled ? "tag-green" : "tag-gray"}`}>
                <span className="tag-dot" />
                {settings.reviews_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
