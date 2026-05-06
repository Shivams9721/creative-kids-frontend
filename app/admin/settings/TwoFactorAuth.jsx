"use client";
// Admin Two-Factor Authentication card. Drops into the Settings page.
//
// Backend endpoints used:
//   GET  /api/admin/2fa/status             — { enabled }
//   POST /api/admin/2fa/setup              — { secret, otpauth_url, qr_data_url }
//   POST /api/admin/2fa/verify-setup       — body { code }, returns { backup_codes }
//   POST /api/admin/2fa/disable            — body { currentPassword, code }
import { useEffect, useState } from "react";
import { safeFetch } from "../api";

export default function TwoFactorAuth() {
  const [enabled, setEnabled] = useState(null);  // null = loading
  const [mode, setMode] = useState("idle");      // idle | enrolling | confirming | showCodes | disabling
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    safeFetch("/api/admin/2fa/status")
      .then((d) => setEnabled(!!d?.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const reset = () => {
    setMode("idle");
    setQrDataUrl(""); setSecret(""); setCode("");
    setBackupCodes([]); setCurrentPassword(""); setError("");
  };

  const startEnroll = async () => {
    setError(""); setBusy(true);
    try {
      const res = await safeFetch("/api/admin/2fa/setup", { method: "POST", body: JSON.stringify({}) });
      setQrDataUrl(res.qr_data_url || "");
      setSecret(res.secret || "");
      setMode("confirming");
    } catch (e) {
      const msg = (e?.message || "").includes("{") ? JSON.parse(e.message).error : e?.message;
      setError(msg || "Could not start enrolment");
    } finally { setBusy(false); }
  };

  const confirmEnroll = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const d = await safeFetch("/api/admin/2fa/verify-setup", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      setBackupCodes(d.backup_codes || []);
      setMode("showCodes");
      setEnabled(true);
    } catch (e) {
      const raw = e?.message || "";
      let msg = raw;
      try { msg = JSON.parse(raw).error || raw; } catch {}
      setError(msg || "Could not verify code");
    } finally { setBusy(false); }
  };

  const startDisable = () => { reset(); setMode("disabling"); };

  const confirmDisable = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await safeFetch("/api/admin/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ currentPassword, code: code.trim() }),
      });
      setEnabled(false);
      reset();
    } catch (e) {
      const raw = e?.message || "";
      let msg = raw;
      try { msg = JSON.parse(raw).error || raw; } catch {}
      setError(msg || "Could not disable 2FA");
    } finally { setBusy(false); }
  };

  if (enabled === null) {
    return <div className="card card-pad"><div className="card-title">Two-factor auth</div><div style={{ color: "var(--text3)", fontSize: 12 }}>Loading…</div></div>;
  }

  return (
    <div className="card card-pad">
      <div className="card-title">Two-factor auth</div>

      {/* idle: enabled OR disabled status with action button */}
      {mode === "idle" && (
        <div className="setting-row">
          <div>
            <div className="setting-label">{enabled ? "2FA is enabled" : "2FA is disabled"}</div>
            <div className="setting-sub">
              {enabled
                ? "An authenticator code is required after password on every login."
                : "Add a second factor (Google Authenticator / Authy) to your admin login."}
            </div>
          </div>
          {enabled ? (
            <button className="btn btn-sm" onClick={startDisable}>Disable</button>
          ) : (
            <button className="btn btn-accent btn-sm" disabled={busy} onClick={startEnroll}>
              {busy ? "…" : "Enable 2FA"}
            </button>
          )}
        </div>
      )}

      {/* confirming: QR code + first-code input */}
      {mode === "confirming" && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: 0 }}>
            Scan this QR code with Google Authenticator, Authy, or 1Password, then enter the 6-digit code shown in your app.
          </p>
          {qrDataUrl && <img src={qrDataUrl} alt="2FA QR code" style={{ width: 200, height: 200, alignSelf: "center", border: "1px solid var(--border)", borderRadius: 8 }} />}
          {secret && (
            <details style={{ fontSize: 11, color: "var(--text3)" }}>
              <summary style={{ cursor: "pointer" }}>Can't scan? Enter manually</summary>
              <code style={{ display: "block", marginTop: 6, padding: 8, background: "var(--bg2)", borderRadius: 4, wordBreak: "break-all" }}>{secret}</code>
            </details>
          )}
          <form onSubmit={confirmEnroll} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              className="field-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={{ fontFamily: "monospace", letterSpacing: "0.3em", textAlign: "center", fontSize: 16 }}
            />
            {error && <p style={{ fontSize: 11, color: "var(--red)" }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-sm" onClick={reset}>Cancel</button>
              <button type="submit" className="btn btn-accent btn-sm" disabled={busy || code.length !== 6}>
                {busy ? "Verifying…" : "Verify & enable"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* showCodes: one-time view of backup codes */}
      {mode === "showCodes" && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, color: "var(--green)", margin: 0, fontWeight: 600 }}>
            ✓ 2FA enabled. Save these backup codes somewhere safe.
          </p>
          <p style={{ fontSize: 11, color: "var(--text3)", margin: 0 }}>
            Each code works once if you lose access to your authenticator app. <b>You will not see them again.</b>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, padding: 12, background: "var(--bg2)", borderRadius: 6 }}>
            {backupCodes.map((c) => (
              <code key={c} style={{ fontFamily: "monospace", fontSize: 13, textAlign: "center" }}>{c}</code>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => navigator.clipboard?.writeText(backupCodes.join("\n"))}
            >
              Copy all
            </button>
            <button type="button" className="btn btn-accent btn-sm" onClick={reset}>I've saved them</button>
          </div>
        </div>
      )}

      {/* disabling: password + code prompt */}
      {mode === "disabling" && (
        <form onSubmit={confirmDisable} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, color: "var(--text3)", margin: 0 }}>
            Confirm your password and a current 2FA code (or backup code) to turn off two-factor auth.
          </p>
          <div>
            <div className="field-label">Current password</div>
            <input
              className="field-input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <div className="field-label">2FA code or backup code</div>
            <input
              className="field-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, "").slice(0, 12))}
              placeholder="123456 or backup"
              required
            />
          </div>
          {error && <p style={{ fontSize: 11, color: "var(--red)" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={reset}>Cancel</button>
            <button type="submit" className="btn btn-accent btn-sm" disabled={busy || !currentPassword || !code}>
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
