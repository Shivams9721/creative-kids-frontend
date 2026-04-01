"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "@/lib/safeFetch";

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      safeFetch("/api/admin/analytics/revenue", { headers: h }).then(r => r.json()),
      safeFetch("/api/admin/analytics/top-products", { headers: h }).then(r => r.json()),
      safeFetch("/api/admin/analytics/order-funnel", { headers: h }).then(r => r.json()),
    ]).then(([rev, top, fun]) => {
      setRevenue(Array.isArray(rev) ? rev : []);
      setTopProducts(Array.isArray(top) ? top : []);
      setFunnel(Array.isArray(fun) ? fun : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics</h1>

      {/* Order Funnel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-[13px] font-bold tracking-widest uppercase text-slate-500 mb-4">Order Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {funnel.map(f => (
            <div key={f.status} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{f.status}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{f.count}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">₹{parseFloat(f.value || 0).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-[13px] font-bold tracking-widest uppercase text-slate-500 mb-4">Revenue — Last 30 Days</h2>
        {revenue.length === 0 ? <p className="text-slate-400 text-sm">No data yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead><tr className="border-b border-slate-100">{["Date","Orders","Revenue"].map(h => <th key={h} className="pb-3 font-bold text-slate-500 text-[11px] tracking-widest uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {revenue.map(r => (
                  <tr key={r.date} className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-700">{new Date(r.date).toLocaleDateString("en-IN")}</td>
                    <td className="py-2.5 text-slate-700">{r.orders}</td>
                    <td className="py-2.5 font-bold text-slate-800">₹{parseFloat(r.revenue).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-[13px] font-bold tracking-widest uppercase text-slate-500 mb-4">Top Selling Products</h2>
        {topProducts.length === 0 ? <p className="text-slate-400 text-sm">No data yet.</p> : (
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100">
                <span className="text-[13px] font-bold text-slate-400 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800 truncate">{p.title}</p>
                  <p className="text-[11px] text-slate-400">{p.order_count} orders</p>
                </div>
                <p className="text-[13px] font-bold text-slate-800">₹{parseFloat(p.total_revenue || 0).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
