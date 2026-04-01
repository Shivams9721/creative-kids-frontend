"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "@/lib/safeFetch";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", expires_at: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = () => localStorage.getItem("adminToken");

  useEffect(() => {
    safeFetch("/api/admin/coupons", { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => setCoupons(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const res = await safeFetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create coupon"); return; }
      setCoupons(prev => [data, ...prev]);
      setForm({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", expires_at: "" });
      setSuccess("Coupon created!");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Network error"); }
  };

  const toggleCoupon = async (id) => {
    try {
      const res = await safeFetch(`/api/admin/coupons/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setCoupons(prev => prev.map(c => c.id === id ? data : c));
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Coupons</h1>

      {/* Create Form */}
      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-[13px] font-bold tracking-widest uppercase text-slate-500">Create Coupon</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input required placeholder="Code (e.g. SAVE20)" value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} className="border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-blue-500 uppercase" />
          <select value={form.discount_type} onChange={e => setForm(f => ({...f, discount_type: e.target.value}))} className="border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-blue-500">
            <option value="percent">Percent (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>
          <input required type="number" placeholder="Discount Value" value={form.discount_value} onChange={e => setForm(f => ({...f, discount_value: e.target.value}))} className="border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-blue-500" />
          <input type="number" placeholder="Min Order Amount" value={form.min_order_amount} onChange={e => setForm(f => ({...f, min_order_amount: e.target.value}))} className="border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-blue-500" />
          <input type="number" placeholder="Max Uses (optional)" value={form.max_uses} onChange={e => setForm(f => ({...f, max_uses: e.target.value}))} className="border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-blue-500" />
          <input type="date" placeholder="Expires At (optional)" value={form.expires_at} onChange={e => setForm(f => ({...f, expires_at: e.target.value}))} className="border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-blue-500" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[12px] font-bold tracking-widest uppercase hover:bg-blue-700">Create Coupon</button>
      </form>

      {/* Coupons List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead><tr className="border-b bg-slate-50 border-slate-200">{["Code","Type","Value","Min Order","Uses","Expires","Status"].map(h => <th key={h} className="p-4 text-[11px] font-bold tracking-widest uppercase text-slate-500">{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading...</td></tr>
            : coupons.length === 0 ? <tr><td colSpan="7" className="p-8 text-center text-slate-400">No coupons yet.</td></tr>
            : coupons.map(c => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{c.code}</td>
                <td className="p-4 text-slate-600 capitalize">{c.discount_type}</td>
                <td className="p-4 text-slate-800">{c.discount_type === "percent" ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                <td className="p-4 text-slate-600">₹{c.min_order_amount || 0}</td>
                <td className="p-4 text-slate-600">{c.uses || 0}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td className="p-4 text-slate-600">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-IN") : "—"}</td>
                <td className="p-4">
                  <button onClick={() => toggleCoupon(c.id)} className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${c.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
