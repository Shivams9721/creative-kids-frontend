"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "@/lib/safeFetch";

const STATUS_COLORS = {
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Completed: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = () => localStorage.getItem("adminToken");

  useEffect(() => {
    safeFetch("/api/admin/returns", { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => setReturns(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await safeFetch(`/api/admin/returns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status: data.status } : r));
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Return Requests</h1>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-[13px] min-w-[700px]">
          <thead>
            <tr className="border-b bg-slate-50 border-slate-200">
              {["Order", "Customer", "Reason", "Date", "Status", "Action"].map(h => (
                <th key={h} className="p-4 text-[11px] font-bold tracking-widest uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">No return requests yet.</td></tr>
            ) : returns.map(r => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{r.order_number}</td>
                <td className="p-4">
                  <p className="font-medium text-slate-700">{r.user_name}</p>
                  <p className="text-[11px] text-slate-400">{r.user_email}</p>
                </td>
                <td className="p-4 text-slate-600 max-w-[200px]">
                  <p className="truncate">{r.reason}</p>
                  {r.comments && <p className="text-[11px] text-slate-400 truncate">{r.comments}</p>}
                </td>
                <td className="p-4 text-slate-500">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${STATUS_COLORS[r.status] || STATUS_COLORS.Pending}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4">
                  <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-blue-500 bg-white">
                    {["Pending", "Approved", "Rejected", "Completed"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
