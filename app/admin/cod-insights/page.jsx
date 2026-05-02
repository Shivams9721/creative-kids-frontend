"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

const fmtINR = (n) => {
  const v = Number(n) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toFixed(0)}`;
};
const pct = (num, den) => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "—");

export default function CodInsightsPage() {
  const [days, setDays] = useState(90);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    safeFetch(`/api/admin/analytics/cod-insights?days=${days}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  const cod = (data?.byPayment || []).find(r => r.payment_method === "COD") || {};
  const prepaid = (data?.byPayment || []).filter(r => r.payment_method !== "COD" && r.payment_method !== "Unknown");
  const prepaidAgg = prepaid.reduce((acc, r) => {
    acc.total += Number(r.total || 0);
    acc.delivered += Number(r.delivered || 0);
    acc.cancelled += Number(r.cancelled || 0);
    acc.revenue += Number(r.revenue || 0);
    return acc;
  }, { total: 0, delivered: 0, cancelled: 0, revenue: 0 });

  const codTotal = Number(cod.total || 0);
  const codCancelled = Number(cod.cancelled || 0);
  const codFeeCollected = Number(cod.cod_fee_collected || 0);

  const allTotal = (data?.byPayment || []).reduce((s, r) => s + Number(r.total || 0), 0);
  const codShare = pct(codTotal, allTotal);

  const firstBucket = (data?.codByCustomerType || []).find(r => r.bucket === "first") || {};
  const repeatBucket = (data?.codByCustomerType || []).find(r => r.bucket === "repeat") || {};

  return (
    <div className="page-anim" style={{ padding: 24 }}>

      {/* Header + range selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>COD Insights</h1>
          <p style={{ color: "var(--text3)", fontSize: 12, margin: "4px 0 0 0" }}>
            Cancellations include both customer cancellations and RTO returns.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[30, 60, 90, 180, 365].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`btn btn-sm ${days === d ? "btn-accent" : ""}`}
              style={days !== d ? { background: "var(--card)", border: "1px solid var(--border)" } : {}}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="g4 mb16">
        <div className="kpi">
          <div className="kpi-label">COD orders</div>
          <div className="kpi-val">{loading ? "…" : codTotal}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{codShare} of all orders</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">COD cancel rate</div>
          <div className="kpi-val" style={{ color: codCancelled / Math.max(codTotal, 1) > 0.25 ? "var(--red)" : "var(--text)" }}>
            {loading ? "…" : pct(codCancelled, codTotal)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>vs prepaid {pct(prepaidAgg.cancelled, prepaidAgg.total)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">COD fees collected</div>
          <div className="kpi-val" style={{ color: "var(--accent)" }}>{loading ? "…" : fmtINR(codFeeCollected)}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>excludes cancelled orders</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">COD revenue</div>
          <div className="kpi-val">{loading ? "…" : fmtINR(cod.revenue)}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>delivered + open</div>
        </div>
      </div>

      <div className="g2 mb16">

        {/* Payment-method breakdown */}
        <div className="card card-pad">
          <div className="card-title">By payment method</div>
          {loading ? (
            <div style={{ color: "var(--text3)", fontSize: 12 }}>Loading…</div>
          ) : !data?.byPayment?.length ? (
            <div style={{ color: "var(--text3)", fontSize: 12 }}>No orders in this window.</div>
          ) : (
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>Method</th>
                  <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>Orders</th>
                  <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>Delivered</th>
                  <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>Cancel %</th>
                  <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.byPayment.map(r => (
                  <tr key={r.payment_method} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 6px", fontWeight: 500 }}>{r.payment_method}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right" }}>{r.total}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right" }}>{r.delivered}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: r.cancelled / Math.max(r.total, 1) > 0.25 ? "var(--red)" : "inherit" }}>
                      {pct(r.cancelled, r.total)}
                    </td>
                    <td style={{ padding: "8px 6px", textAlign: "right" }}>{fmtINR(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* First-order vs repeat */}
        <div className="card card-pad">
          <div className="card-title">COD: first-order vs repeat</div>
          {loading ? (
            <div style={{ color: "var(--text3)", fontSize: 12 }}>Loading…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "First-order COD", row: firstBucket, hint: "Highest RTO risk — current ceiling: ₹999" },
                { label: "Repeat-customer COD", row: repeatBucket, hint: "Lower risk — current ceiling: ₹1999" },
              ].map(({ label, row, hint }) => {
                const total = Number(row.total || 0);
                const cancelled = Number(row.cancelled || 0);
                const rate = total > 0 ? cancelled / total : 0;
                return (
                  <div key={label} style={{ padding: 12, background: "var(--bg2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: rate > 0.3 ? "var(--red)" : rate > 0.15 ? "var(--amber)" : "var(--text)" }}>
                        {pct(cancelled, total)}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                      {total} orders · {row.delivered || 0} delivered · {cancelled} cancelled
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, fontStyle: "italic" }}>{hint}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top problem pincodes */}
      <div className="card card-pad mb16">
        <div className="card-title">Pincodes with highest COD cancel rate</div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: -6, marginBottom: 12 }}>
          Pincodes with at least 3 COD orders in the window. Consider blocking COD on the worst offenders via the pincode check toggle.
        </div>
        {loading ? (
          <div style={{ color: "var(--text3)", fontSize: 12 }}>Loading…</div>
        ) : !data?.topProblemPincodes?.length ? (
          <div style={{ color: "var(--text3)", fontSize: 12 }}>Not enough COD data yet.</div>
        ) : (
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>Pincode</th>
                <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>COD orders</th>
                <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>Cancelled</th>
                <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--text3)", fontWeight: 500 }}>Cancel %</th>
              </tr>
            </thead>
            <tbody>
              {data.topProblemPincodes.map(r => (
                <tr key={r.pincode} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px", fontFamily: "monospace" }}>{r.pincode}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>{r.total}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>{r.cancelled}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: r.cancelled / Math.max(r.total, 1) > 0.5 ? "var(--red)" : "var(--amber)" }}>
                    {pct(r.cancelled, r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Daily share trend */}
      <div className="card card-pad">
        <div className="card-title">COD share — daily</div>
        {loading ? (
          <div style={{ color: "var(--text3)", fontSize: 12 }}>Loading…</div>
        ) : !data?.dailyShare?.length ? (
          <div style={{ color: "var(--text3)", fontSize: 12 }}>No order activity yet.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120, marginTop: 12, overflowX: "auto" }}>
            {data.dailyShare.map(d => {
              const total = Number(d.total || 0);
              const cod = Number(d.cod || 0);
              const share = total > 0 ? cod / total : 0;
              const height = Math.max(4, share * 100);
              return (
                <div key={d.day} title={`${d.day}: ${cod}/${total} (${pct(cod, total)})`}
                  style={{ width: 8, minWidth: 8, height: `${height}%`, background: "var(--accent)", borderRadius: 2, opacity: 0.6 + share * 0.4 }}
                />
              );
            })}
          </div>
        )}
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
          Each bar = 1 day. Bar height = share of orders that chose COD that day.
        </div>
      </div>
    </div>
  );
}
