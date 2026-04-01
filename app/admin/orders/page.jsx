"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCcw, Search, ChevronDown, ChevronUp, MessageCircle, Printer } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_COLORS = {
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
  Shipped: "bg-purple-50 text-purple-700 border-purple-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [shippingModal, setShippingModal] = useState(null);
  const LIMIT = 50;

  const fetchOrders = useCallback(async (p = 1) => {
    setRefreshing(true);
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API}/api/admin/orders?page=${p}&limit=${LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const updateStatus = async (orderId, status, courier = "", awb = "") => {
    if (status === "Shipped" && !courier) {
      setShippingModal({ orderId, status, courier, awb });
      return;
    }
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: await csrfHeaders({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
      credentials: "include",
      body: JSON.stringify({ status, courier_name: courier, awb_number: awb })
    });
    if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, courier_name: courier, awb_number: awb } : o));
  };

  const submitShipping = async () => {
    const { orderId, status, courier, awb } = shippingModal;
    await updateStatus(orderId, status, courier, awb);
    setShippingModal(null);
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !search || (o.order_number || "").toLowerCase().includes(q) || (o.customer_name || "").toLowerCase().includes(q) || (o.phone || "").includes(q);
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = { All: orders.length, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
  orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Order Management</h1>
        <button onClick={() => fetchOrders(page)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
          <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search by order #, customer, or phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-[13px] rounded-xl pl-11 pr-4 py-3.5 outline-none border border-slate-200 bg-white focus:border-blue-500" />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold tracking-wider whitespace-nowrap border transition-all ${statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
            {s} <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusFilter === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 border-slate-200">
                {["Order ID", "Date", "Customer", "Amount", "Status", ""].map((h, i) => (
                  <th key={h} className={`p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500 ${i === 5 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-12 text-center text-[13px] text-slate-400">Loading orders...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-12 text-center text-[13px] text-slate-400">No orders found.</td></tr>
              ) : filtered.map(order => (
                <>
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-5 text-[13px] font-bold text-slate-800">{order.order_number}</td>
                    <td className="p-5 text-[13px] text-slate-500">{new Date(order.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="p-5 text-[13px] font-medium text-slate-700">
                      {order.customer_name}
                      <span className="block text-[11px] font-normal text-slate-400">{order.phone}</span>
                    </td>
                    <td className="p-5 text-[13px] font-bold text-slate-800">
                      ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                      <span className="text-[11px] font-normal text-slate-400 ml-1">({order.items_count} items)</span>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5">
                        <select value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value, order.courier_name, order.awb_number)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border outline-none cursor-pointer appearance-none ${STATUS_COLORS[order.status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                          {["Processing", "Shipped", "Delivered", "Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {order.awb_number && <span className="text-[9px] text-slate-400">AWB: {order.awb_number}</span>}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <button onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="text-[11px] font-bold tracking-widest uppercase text-blue-500 hover:text-blue-400 flex items-center gap-1 ml-auto">
                        {expanded === order.id ? <><ChevronUp size={14} /> Close</> : <><ChevronDown size={14} /> View</>}
                      </button>
                    </td>
                  </tr>

                  {expanded === order.id && (() => {
                    const addr = (() => { try { return typeof order.shipping_address === "string" ? JSON.parse(order.shipping_address) : order.shipping_address; } catch { return null; } })();
                    const items = (() => { try { return typeof order.items === "string" ? JSON.parse(order.items) : (order.items || []); } catch { return []; } })();
                    return (
                      <tr key={`${order.id}-detail`} className="border-b border-slate-200 bg-slate-50">
                        <td colSpan="6" className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Address */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200">
                              <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3 border-b border-slate-100 pb-2">Shipping Address</h4>
                              {addr ? (
                                <div className="text-[13px] text-slate-700 leading-relaxed">
                                  <p className="font-bold text-slate-900 mb-1">{addr.fullName || order.customer_name}</p>
                                  <p>{addr.houseNo}, {addr.roadName}</p>
                                  {addr.landmark && <p>Near {addr.landmark}</p>}
                                  <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                                  <p className="mt-2 pt-2 border-t border-slate-100 text-[12px]">Payment: <span className="font-bold text-blue-600 uppercase">{order.payment_method}</span></p>
                                </div>
                              ) : <p className="text-[12px] text-slate-400">No address data.</p>}
                            </div>

                            {/* Items */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Packing List</h4>
                                <div className="flex gap-2">
                                  <button onClick={() => window.print()} className="flex items-center gap-1 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">
                                    <Printer size={12} /> Print
                                  </button>
                                  <a href={`https://wa.me/91${(order.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${order.customer_name}, your Creative Kids order ${order.order_number} is confirmed! 🎉`)}`}
                                    target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">
                                    <MessageCircle size={12} /> WhatsApp
                                  </a>
                                </div>
                              </div>
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {items.map((item, i) => (
                                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl border border-slate-100 bg-slate-50">
                                    {item.image && <img src={item.image} alt={item.title} className="w-12 h-14 object-cover rounded-lg flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-bold text-slate-800 truncate">{item.title}</p>
                                      <p className="text-[11px] text-slate-500 mt-0.5">
                                        {[item.selectedSize || item.size, item.selectedColor || item.color].filter(Boolean).join(" · ")}
                                        {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                                      </p>
                                    </div>
                                    <p className="text-[13px] font-bold text-slate-800 flex-shrink-0">₹{parseFloat(item.price).toFixed(2)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })()}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-[12px] text-slate-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => fetchOrders(page - 1)}
                className="px-4 py-2 rounded-lg text-[11px] font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-50">← Prev</button>
              <button disabled={page * LIMIT >= total} onClick={() => fetchOrders(page + 1)}
                className="px-4 py-2 rounded-lg text-[11px] font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Shipping modal */}
      {shippingModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
            <h3 className="text-[14px] font-bold mb-1 text-slate-800">Mark as Shipped</h3>
            <p className="text-[12px] text-slate-500 mb-5">Enter courier details for this order.</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 block mb-1.5">Courier Name</label>
                <input type="text" placeholder="e.g. Delhivery, BlueDart" value={shippingModal.courier}
                  onChange={e => setShippingModal(p => ({ ...p, courier: e.target.value }))}
                  className="w-full border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 block mb-1.5">AWB / Tracking Number</label>
                <input type="text" placeholder="e.g. 1234567890" value={shippingModal.awb}
                  onChange={e => setShippingModal(p => ({ ...p, awb: e.target.value }))}
                  className="w-full border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShippingModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={submitShipping} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-[12px] font-bold hover:bg-purple-700">Confirm Shipped</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
