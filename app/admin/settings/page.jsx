"use client";
import { useState } from "react";

export default function AdminSettings() {
  const [codEnabled, setCodEnabled] = useState(true);
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="g2">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card card-pad">
            <div className="card-title">Store details</div>
            <div className="field-label">Store name</div>
            <input className="field-input mb12" defaultValue="Creative Kids" style={{ marginBottom: 12 }} />
            <div className="field-label">GSTIN</div>
            <input className="field-input mb12" defaultValue="06AAJPM1384L1ZE" style={{ marginBottom: 12, fontFamily: "'DM Mono', monospace" }} />
            <div className="field-label">Address</div>
            <textarea className="field-input" style={{ marginBottom: 12, minHeight: 64 }} defaultValue="Plot No. 667, Pace City-II, Sector 37, Gurugram, Haryana – 122001" />
            <div className="field-label">Support email</div>
            <input className="field-input" placeholder="support@creativekids.co.in" />
          </div>

          <div className="card card-pad">
            <div className="card-title">Admin account</div>
            <div className="setting-row">
              <div><div className="setting-label">Change password</div><div className="setting-sub">Update admin password</div></div>
              <button className="btn btn-sm">Change</button>
            </div>
            <div className="setting-row" style={{ border: "none" }}>
              <div><div className="setting-label">Session timeout</div><div className="setting-sub">Auto-logout after inactivity</div></div>
              <select className="field-input" style={{ width: "auto", padding: "5px 10px" }}>
                <option>12 hours</option><option>24 hours</option><option>7 days</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card card-pad">
            <div className="card-title">Integrations</div>
            {[
              { logo: "RP", name: "Razorpay", sub: "Payment gateway", color: "var(--blue)", connected: true },
              { logo: "S3", name: "AWS S3", sub: "Image storage · ap-south-1", color: "var(--amber)", connected: true },
              { logo: "SES", name: "AWS SES", sub: "Email delivery · SMTP configured", color: "var(--purple)", connected: true },
              { logo: "SR", name: "Shiprocket", sub: "Shipping & auto-tracking", color: "var(--text3)", connected: false },
            ].map(i => (
              <div key={i.name} className="int-card">
                <div className="int-logo" style={{ color: i.color }}>{i.logo}</div>
                <div style={{ flex: 1 }}>
                  <div className="int-name">{i.name}</div>
                  <div className="int-sub">{i.sub}</div>
                </div>
                {i.connected ? <span className="tag tag-green">Connected</span> : <button className="btn btn-sm btn-accent">Connect</button>}
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div className="card-title">Store toggles</div>
            {[
              { label: "Maintenance mode", sub: "Show maintenance page to visitors", val: maintenance, set: setMaintenance },
              { label: "COD availability", sub: "Allow cash on delivery orders", val: codEnabled, set: setCodEnabled },
              { label: "Review system", sub: "Allow verified buyers to review", val: reviewsEnabled, set: setReviewsEnabled },
            ].map((row, i, arr) => (
              <div key={row.label} className="setting-row" style={i === arr.length - 1 ? { border: "none" } : {}}>
                <div><div className="setting-label">{row.label}</div><div className="setting-sub">{row.sub}</div></div>
                <label className="toggle">
                  <input type="checkbox" checked={row.val} onChange={e => row.set(e.target.checked)} />
                  <div className="toggle-track" /><div className="toggle-thumb" />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
