"use client";
import { useState, useEffect } from "react";
import { TrendingUp, Package, ShoppingBag, AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    fetch(`${API}/api/admin/stats/full`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "Total Revenue", value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, sub: `Today: ₹${(stats.todayRevenue || 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Active Orders", value: stats.activeOrders, sub: `Today: ${stats.todayOrders || 0} new`, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Total Products", value: stats.totalProducts, sub: stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : "All stocked", icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-50" },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-slate-800 tracking-tight">Business Overview</h1>

      {stats?.lowStockProducts > 0 && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle size={18} className="flex-shrink-0 animate-pulse" />
          <p className="text-[13px] font-bold">
            {stats.lowStockProducts} product{stats.lowStockProducts > 1 ? "s are" : " is"} running low on stock.{" "}
            <Link href="/admin/products" className="underline">View Inventory →</Link>
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500">{label}</span>
                <div className={`p-2.5 rounded-xl ${bg}`}><Icon size={20} className={color} /></div>
              </div>
              <p className="text-3xl font-bold text-slate-800">{value}</p>
              <p className={`text-[11px] font-bold mt-2 ${color}`}>{sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/orders" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
          <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-700 mb-1 group-hover:text-blue-600">Manage Orders →</h3>
          <p className="text-[12px] text-slate-400">View, update status, print packing slips</p>
        </Link>
        <Link href="/admin/products/new" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
          <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-700 mb-1 group-hover:text-blue-600">List New Product →</h3>
          <p className="text-[12px] text-slate-400">Add product with variants, images, and pricing</p>
        </Link>
      </div>
    </div>
  );
}
