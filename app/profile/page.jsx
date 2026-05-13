"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, RefreshCcw, Settings, MapPin, LogOut, CheckCircle2, Circle, X, Heart
} from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";
import { safeFetch, safeId } from "@/lib/safeFetch";
import AddressBook from "@/components/checkout/AddressBook";

const TRACKING_STEPS = ["Processing", "Shipped", "Delivered"];

// Live Delhivery tracking component
function LiveTracking({ awb, trackingUrl }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeFetch(`/api/tracking/${awb}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [awb]);

  if (loading) return <p className="text-[12px] text-black/40 animate-pulse">Loading live tracking…</p>;
  if (!data || !data.events) return (
    <div className="text-center py-4">
      <p className="text-[12px] text-black/50 mb-3">Tracking data not available yet.</p>
      {trackingUrl && (
        <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-bold tracking-widest uppercase text-black border-b border-black pb-0.5">
          Track on Delhivery ↗
        </a>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-purple-100 text-purple-700">{data.status}</span>
        {data.expected_delivery && (
          <span className="text-[11px] text-black/50 flex items-center">
            Expected: {new Date(data.expected_delivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        )}
        {trackingUrl && (
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-bold tracking-widest uppercase text-black/40 hover:text-black ml-auto">
            Delhivery ↗
          </a>
        )}
      </div>
      <div className="space-y-4 relative pl-4">
        <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-gray-100" />
        {data.events.slice(0, 8).map((e, i) => (
          <div key={i} className="relative flex gap-4 items-start">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 border-2 border-white ${i === 0 ? 'bg-black' : 'bg-gray-300'}`} style={{ marginLeft: -1 }} />
            <div>
              <p className={`text-[12px] font-medium ${i === 0 ? 'text-black' : 'text-black/60'}`}>{e.status}</p>
              <p className="text-[10px] text-black/40 mt-0.5">
                {e.location}{e.location && e.time ? ' · ' : ''}{e.time ? new Date(e.time).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [authChecked, setAuthChecked] = useState(false);

  // Real data states
  const [user, setUser] = useState({ name: "Loading...", email: "...", phone: "", address: "", points: 0 });
  const [savedAddress, setSavedAddress] = useState({ houseNo: "", roadName: "", city: "", state: "", pincode: "", landmark: "" });
  const [savingAddress, setSavingAddress] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  // Tracking Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Returns state
  const [returns, setReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [returnForm, setReturnForm] = useState({ order_id: '', order_number: '', reason: '', comments: '', refund_preference: 'bank', bank_account_name: '', bank_account_number: '', bank_ifsc: '', bank_upi: '', _payment_method: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // ==========================================
  // 1. DATA FETCHING (ALL HOOKS INSIDE THE COMPONENT)
  // ==========================================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!savedUser || !token) {
      window.location.href = "/login";
      return;
    }
    setAuthChecked(true);
    // Load saved address from DB
    const fetchAddress = async () => {
      try {
        const res = await safeFetch('/api/user/address', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        // Backend returns an array of addresses
        const list = Array.isArray(data) ? data : [];
        const defaultAddr = list.find(a => a.is_default) || list[0];
        if (defaultAddr) {
          setSavedAddress({
            houseNo: defaultAddr.house_no || "",
            roadName: defaultAddr.road_name || "",
            city: defaultAddr.city || "",
            state: defaultAddr.state || "",
            pincode: defaultAddr.pincode || "",
            landmark: defaultAddr.landmark || "",
          });
        } else {
          try { const a = localStorage.getItem('ck_address'); if (a) setSavedAddress(JSON.parse(a)); } catch {}
        }
      } catch {
        try { const a = localStorage.getItem('ck_address'); if (a) setSavedAddress(JSON.parse(a)); } catch {}
      }
    };
    fetchAddress();

    const parsedUser = JSON.parse(savedUser);
    setUser(prev => ({ ...prev, name: parsedUser.name, email: parsedUser.email }));

    // Fetch My Orders — JWT-authenticated, server resolves user from token
    const fetchMyOrders = async () => {
      try {
        const response = await safeFetch(`/api/user/orders`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.status === 401) { window.location.href = "/login"; return; }
        if (response.ok) setOrders(await response.json());
      } catch {
        // silently fail — orders will show empty state
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchMyOrders();

    // Fetch My Wishlist
    const fetchMyWishlist = async () => {
      try {
        const response = await safeFetch(`/api/wishlist`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.status === 401) { window.location.href = "/login"; return; }
        if (response.ok) setWishlist(await response.json());
      } catch {
        // silently fail — wishlist is non-critical
      } finally {
        setLoadingWishlist(false);
      }
    };
    fetchMyWishlist();

    // Fetch My Returns
    const fetchMyReturns = async () => {
      try {
        const res = await safeFetch(`/api/returns`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) { window.location.href = "/login"; return; }
        if (res.ok) setReturns(await res.json());
      } catch {}
      finally { setLoadingReturns(false); }
    };
    fetchMyReturns();

  }, []);

  // ==========================================
  // 2. HELPER FUNCTIONS
  // ==========================================
  const getInitials = (name) => {
    if (!name || name === "Loading...") return "";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getStepStatus = (currentStatus, stepName) => {
    // If it's cancelled, treat differently
    if (currentStatus === "Cancelled") return "pending";

    const currentIndex = TRACKING_STEPS.indexOf(currentStatus);
    const stepIndex = TRACKING_STEPS.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  // ==========================================
  // 3. RENDER UI
  // ==========================================
  if (!authChecked) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <span className="text-[11px] tracking-widest uppercase text-black/40 animate-pulse">Loading...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f5f3] flex flex-col md:flex-row pt-[64px] md:pt-[72px]">

      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-white border-r border-black/10 flex-shrink-0 md:min-h-[calc(100vh-72px)] flex flex-col overflow-y-auto z-10">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-black/10">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-medium text-black">
              {getInitials(user.name)}
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-black capitalize">{user.name}</h2>
              <p className="text-[11px] text-black/50 tracking-wider">{user.points} Reward Points</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <button onClick={() => setActiveTab("dashboard")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'dashboard' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <User size={16} strokeWidth={1.5} /> Personal Info
            </button>
            <button onClick={() => setActiveTab("orders")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'orders' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <Package size={16} strokeWidth={1.5} /> My Orders
            </button>
            <button onClick={() => setActiveTab("wishlist")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'wishlist' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <Heart size={16} strokeWidth={1.5} /> My Wishlist
            </button>
            <button onClick={() => setActiveTab("returns")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'returns' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <RefreshCcw size={16} strokeWidth={1.5} /> Returns
            </button>
            <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'settings' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <Settings size={16} strokeWidth={1.5} /> Settings
            </button>

            <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-red-500 hover:bg-red-50 transition-colors rounded-md mt-8 border border-red-100">
              <LogOut size={16} strokeWidth={1.5} /> Sign Out
            </button>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative">

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">My Profile</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-xl border border-black/10 shadow-sm relative">
                <button onClick={() => setActiveTab("settings")} className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:underline">Edit</button>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black/50 mb-6 flex items-center gap-2"><User size={16} /> Contact Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">Name</p>
                    <p className="text-[14px] text-black font-medium capitalize">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-[14px] text-black font-medium">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-black/10 shadow-sm relative">
                <button onClick={() => setActiveTab("settings")} className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:underline">Edit</button>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black/50 mb-6 flex items-center gap-2"><MapPin size={16} /> Default Shipping Address</h3>
                {savedAddress.houseNo ? (
                  <div className="text-[13px] text-black/70 leading-relaxed space-y-1">
                    <p>{savedAddress.houseNo}, {savedAddress.roadName}</p>
                    {savedAddress.landmark && <p>Near {savedAddress.landmark}</p>}
                    <p>{savedAddress.city}, {savedAddress.state} — {savedAddress.pincode}</p>
                  </div>
                ) : (
                  <p className="text-[13px] text-black/50 leading-relaxed italic">No address saved yet. Update in settings.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: MY ORDERS */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">Order History</h1>
            <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-black/10">
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Order ID</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Date</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Total</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Status</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-[12px] text-black/50">Loading your orders...</td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-[13px] text-black/50">You haven't placed any orders yet.</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-[13px] font-bold text-black">{order.order_number}</td>
                          <td className="p-4 text-[13px] text-black/70">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-[13px] text-black font-bold">₹{parseFloat(order.total_amount).toFixed(2)}</td>
                          <td className="p-4">
                            <div>
                              <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {order.status}
                              </span>
                              {order.status === 'Cancelled' && order.refund_status && (
                                <div className={`text-[9px] font-bold tracking-widest uppercase mt-1 ${order.refund_status === 'Initiated' ? 'text-green-600' : 'text-amber-600'}`}>
                                  Refund {order.refund_status}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="text-[11px] font-bold tracking-widest uppercase text-black hover:text-black/50 transition-colors border-b border-black pb-0.5"
                              >
                                View
                              </button>
                              {order.status === 'Delivered' && (
                                <button
                                  onClick={async () => {
                                    const token = localStorage.getItem('token');
                                    try {
                                      const res = await fetch(`/api/orders/${order.id}/invoice`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      if (!res.ok) {
                                        const err = await res.json();
                                        return alert(err.error || 'Could not generate invoice.');
                                      }
                                      const invoiceData = await res.json();
                                      if (invoiceData.success && invoiceData.invoice) {
                                        const { generateInvoicePDF } = await import("@/lib/invoice");
                                        await generateInvoicePDF(invoiceData.invoice);
                                      }
                                    } catch (e) { console.error(e); alert('Error generating invoice.'); }
                                  }}
                                  className="text-[11px] font-bold tracking-widest uppercase text-green-600 hover:text-green-700 transition-colors border-b border-green-300 pb-0.5"
                                >
                                  Invoice
                                </button>
                              )}
                              {order.status === 'Processing' && (
                                <button
                                  onClick={async () => {
                                    const reason = window.prompt('Reason for cancellation (optional):', 'Wrong size / changed my mind');
                                    if (reason === null) return;
                                    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
                                    const token = localStorage.getItem('token');
                                    try {
                                      const res = await safeFetch(`/api/orders/${safeId(order.id)}/cancel`, {
                                        method: 'POST',
                                        headers: await csrfHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
                                        credentials: 'include',
                                        body: JSON.stringify({ reason: reason || 'Customer requested cancellation' })
                                      });
                                      const data = await res.json();
                                      if (res.ok) {
                                        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o));
                                        alert(data.message || 'Order cancelled successfully.');
                                      } else {
                                        alert(data.error || 'Could not cancel order.');
                                      }
                                    } catch { alert('Network error. Please try again.'); }
                                  }}
                                  className="text-[11px] font-bold tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors border-b border-red-300 pb-0.5"
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: MY WISHLIST */}
        {activeTab === "wishlist" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">My Wishlist</h1>

            {loadingWishlist ? (
              <p className="text-[12px] text-black/50">Loading your favorites...</p>
            ) : wishlist.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-black/10 text-center flex flex-col items-center">
                <Heart size={40} strokeWidth={1} className="text-black/20 mb-4" />
                <p className="text-[13px] text-black/60 mb-6">You haven't saved any items yet.</p>
                <button onClick={() => window.location.href = '/shop'} className="bg-black text-white px-8 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase">Explore Shop</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {wishlist.map((product) => (
                  <div key={product.id} className="flex flex-col group">
                    <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-4">
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem("token");
                          await safeFetch(`/api/wishlist/toggle`, {
                            method: "POST",
                            headers: await csrfHeaders({ "Content-Type": "application/json", "Authorization": `Bearer ${token}` }),
                            credentials: 'include',
                            body: JSON.stringify({ productId: product.id })
                          });
                          setWishlist(wishlist.filter(p => p.id !== product.id));
                        }}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:scale-110 transition-transform shadow-sm"
                      >
                        <Heart strokeWidth={1.5} size={18} className="fill-red-500 text-red-500" />
                      </button>
                      <img
                        src={(() => { try { const u = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls; return Array.isArray(u) ? u[0] : '/images/logo.png'; } catch { return '/images/logo.png'; } })()}
                        alt={product.title}                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out cursor-pointer"
                        onClick={() => window.location.href = `/product/${product.id}`}
                      />
                    </div>
                    <div className="flex flex-col px-1">
                      <h3 className="text-[13px] text-black mb-1 truncate">{product.title}</h3>
                      <p className="text-[12px] text-black font-medium">₹{parseFloat(product.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: RETURNS */}
        {activeTab === "returns" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">Returns & Refunds</h1>

            {/* Submit Return Form */}
            <form className="bg-white p-8 border border-black/10 rounded-xl shadow-sm space-y-5 mb-8"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!returnForm.order_id) return alert('Please select an order.');
                setSubmittingReturn(true);
                const token = localStorage.getItem('token');
                try {
                  const res = await safeFetch(`/api/returns`, {
                    method: 'POST',
                    headers: await csrfHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
                    credentials: 'include',
                    body: JSON.stringify(returnForm)
                  });
                  const data = await res.json();
                  if (!res.ok) return alert(data.error || 'Failed to submit.');
                  setReturns(prev => [data, ...prev]);
                  setReturnForm({ order_id: '', order_number: '', reason: '', comments: '', refund_preference: 'bank', bank_account_name: '', bank_account_number: '', bank_ifsc: '', bank_upi: '' });
                  alert('Return request submitted. We will arrange a pickup within 2-3 business days.');
                } catch { alert('Network error.'); }
                finally { setSubmittingReturn(false); }
              }}
            >
              <h3 className="text-[12px] font-bold tracking-widest uppercase text-black border-b border-black/10 pb-2">Request a Return</h3>
              <p className="text-[11px] text-black/50">Only delivered orders are eligible. Returns must be requested within 7 days of delivery.</p>

              {/* Order select */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Select Order</label>
                <select
                  value={returnForm.order_id}
                  onChange={(e) => {
                    const order = orders.find(o => String(o.id) === e.target.value);
                    setReturnForm(f => ({ ...f, order_id: e.target.value, order_number: order?.order_number || '', _payment_method: order?.payment_method || '' }));
                  }}
                  className="border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black"
                  required
                >
                  <option value="">-- Select a delivered order --</option>
                  {orders.filter(o => o.status === 'Delivered').map(o => (
                    <option key={o.id} value={o.id}>{o.order_number} — ₹{parseFloat(o.total_amount).toFixed(2)} ({o.payment_method})</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Reason for Return</label>
                <select value={returnForm.reason} onChange={(e) => setReturnForm(f => ({ ...f, reason: e.target.value }))}
                  className="border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black" required>
                  <option value="">-- Select a reason --</option>
                  <option>Wrong size received</option>
                  <option>Damaged / defective product</option>
                  <option>Wrong item received</option>
                  <option>Product not as described</option>
                  <option>Changed my mind</option>
                </select>
              </div>

              {/* Comments */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Additional Comments (Optional)</label>
                <textarea value={returnForm.comments} onChange={(e) => setReturnForm(f => ({ ...f, comments: e.target.value }))}
                  rows={2} placeholder="Describe the issue..." className="border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black resize-none" />
              </div>

              {/* REFUND DETAILS — shown for COD orders */}
              {returnForm._payment_method === 'COD' && (
                <div className="border border-black/10 rounded-xl p-5 bg-[#fafafa] space-y-4">
                  <div>
                    <p className="text-[12px] font-bold text-black mb-1">Refund Details</p>
                    <p className="text-[11px] text-black/50">Since this was a Cash on Delivery order, we'll transfer the refund to your bank account or UPI after we verify the returned product.</p>
                  </div>

                  {/* Refund preference */}
                  <div className="flex gap-4">
                    {['bank', 'upi'].map(pref => (
                      <label key={pref} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="refund_pref" value={pref}
                          checked={returnForm.refund_preference === pref}
                          onChange={() => setReturnForm(f => ({ ...f, refund_preference: pref }))}
                          className="accent-black" />
                        <span className="text-[12px] font-medium capitalize">{pref === 'bank' ? 'Bank Transfer (NEFT)' : 'UPI'}</span>
                      </label>
                    ))}
                  </div>

                  {returnForm.refund_preference === 'bank' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'Account Holder Name', key: 'bank_account_name', placeholder: 'As per bank records' },
                        { label: 'Account Number', key: 'bank_account_number', placeholder: '1234567890' },
                        { label: 'IFSC Code', key: 'bank_ifsc', placeholder: 'SBIN0001234' },
                      ].map(f => (
                        <div key={f.key} className={f.key === 'bank_account_name' ? 'md:col-span-2' : ''}>
                          <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">{f.label} *</label>
                          <input type="text" value={returnForm[f.key] || ''} onChange={e => setReturnForm(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder} required
                            className="w-full border border-black/20 p-2.5 rounded-lg text-[13px] outline-none focus:border-black" />
                        </div>
                      ))}
                    </div>
                  )}

                  {returnForm.refund_preference === 'upi' && (
                    <div>
                      <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">UPI ID *</label>
                      <input type="text" value={returnForm.bank_upi || ''} onChange={e => setReturnForm(p => ({ ...p, bank_upi: e.target.value }))}
                        placeholder="yourname@upi" required
                        className="w-full border border-black/20 p-2.5 rounded-lg text-[13px] outline-none focus:border-black" />
                    </div>
                  )}

                  <p className="text-[10px] text-black/40">Refund will be processed within 5-7 business days after product verification.</p>
                </div>
              )}

              {/* Online payment info */}
              {returnForm._payment_method && returnForm._payment_method !== 'COD' && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-[12px] text-green-700 font-medium">✓ Refund will be credited back to your original payment method within 5-7 business days after product verification.</p>
                </div>
              )}

              <div className="flex justify-end">
                <button type="submit" disabled={submittingReturn}
                  className="bg-black text-white px-8 py-3.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors disabled:opacity-50">
                  {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>

            {/* Existing Return Requests */}
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black/60 mb-4">Your Return Requests</h3>
            {loadingReturns ? (
              <p className="text-[12px] text-black/50">Loading...</p>
            ) : returns.length === 0 ? (
              <p className="text-[13px] text-black/40 italic">No return requests yet.</p>
            ) : (
              <div className="space-y-3">
                {returns.map(r => (
                  <div key={r.id} className="bg-white border border-black/10 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-[13px] font-bold text-black">{r.order_number}</p>
                        <p className="text-[12px] text-black/60 mt-0.5">{r.reason}</p>
                        {r.comments && <p className="text-[11px] text-black/40 mt-0.5">{r.comments}</p>}
                        <p className="text-[10px] text-black/30 mt-1">{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full flex-shrink-0 ${
                        r.status === 'Approved' || r.status === 'Verified' ? 'bg-green-100 text-green-700' :
                        r.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        r.status === 'Refund Initiated' ? 'bg-blue-100 text-blue-700' :
                        r.status === 'Completed' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{r.status}</span>
                    </div>

                    {/* Status timeline */}
                    <div className="flex gap-0 text-[9px] font-bold tracking-widest uppercase">
                      {['Pending','Approved','Verified','Refund Initiated','Completed'].map((s, i, arr) => {
                        const statuses = ['Pending','Approved','Verified','Refund Initiated','Completed'];
                        const currentIdx = statuses.indexOf(r.status);
                        const stepIdx = statuses.indexOf(s);
                        const done = stepIdx <= currentIdx;
                        return (
                          <div key={s} className="flex items-center flex-1">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? 'bg-black' : 'bg-black/15'}`} />
                            {i < arr.length - 1 && <div className={`flex-1 h-[1px] ${done && stepIdx < currentIdx ? 'bg-black' : 'bg-black/15'}`} />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] text-black/30 mt-1 tracking-widest uppercase">
                      <span>Requested</span><span>Approved</span><span>Verified</span><span>Refund</span><span>Done</span>
                    </div>

                    {/* Refund info */}
                    {r.status === 'Refund Initiated' && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-[11px] text-blue-700 font-medium">
                          {r.payment_method === 'COD'
                            ? `Refund of ₹${r.refund_amount} initiated to your ${r.refund_preference === 'upi' ? `UPI (${r.bank_upi})` : `bank account (${r.bank_account_number?.slice(-4).padStart(r.bank_account_number?.length, '*')})`}. Expected in 5-7 business days.`
                            : `Refund of ₹${r.refund_amount} initiated to your original payment method. Expected in 5-7 business days.`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">Account Settings</h1>
            <form className="bg-white p-8 border border-black/10 rounded-xl shadow-sm space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const token = localStorage.getItem('token');
              const name = e.target.name.value;
              const phone = e.target.phone.value;
              try {
                const res = await safeFetch(`/api/user/profile`, {
                  method: 'PUT',
                  headers: await csrfHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }),
                  credentials: 'include',
                  body: JSON.stringify({ name, phone })
                });
                if (res.ok) {
                  const saved = JSON.parse(localStorage.getItem('user') || '{}');
                  localStorage.setItem('user', JSON.stringify({ ...saved, name }));
                  setUser(prev => ({ ...prev, name }));
                  alert('Settings saved!');
                } else { alert('Failed to save. Try again.'); }
              } catch { alert('Network error.'); }
            }}>
              <h3 className="text-[12px] font-bold tracking-widest uppercase text-black border-b border-black/10 pb-2">Edit Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Full Name</label>
                  <input type="text" name="name" defaultValue={user.name} className="border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black transition-colors capitalize" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Phone Number</label>
                  <input type="tel" name="phone" defaultValue={user.phone || ''} placeholder="10-digit mobile number" className="border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Email Address (Cannot be changed)</label>
                  <input type="email" defaultValue={user.email} disabled className="border border-black/10 bg-gray-50 text-black/50 p-3 rounded-lg text-[13px] cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-6 border-t border-black/10 flex justify-end">
                <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-lg">
                  Save Changes
                </button>
              </div>
            </form>

            {/* Saved Address Form */}
            <div className="bg-white p-8 border border-black/10 rounded-xl shadow-sm mt-6">
              <h3 className="text-[12px] font-bold tracking-widest uppercase text-black border-b border-black/10 pb-2 mb-6">Saved Addresses</h3>
              <AddressBook />
            </div>
          </motion.div>
        )}

        {/* ── LIVE TRACKING MODAL ── */}
        <AnimatePresence>
          {selectedOrder && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedOrder(null)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-50 border border-black/10 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-light text-black">Track Package</h2>
                    <p className="text-[12px] text-black/50 mt-1">{selectedOrder.order_number}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X size={20} className="text-black/60" />
                  </button>
                </div>

                {/* Status bar */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${
                    selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                    selectedOrder.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{selectedOrder.status}</span>
                  {selectedOrder.awb_number && !selectedOrder.self_delivery && (
                    <span className="px-3 py-1 text-[10px] font-mono bg-gray-100 text-gray-600 rounded-full">
                      AWB: {selectedOrder.awb_number}
                    </span>
                  )}
                  {selectedOrder.self_delivery && (
                    <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-amber-50 text-amber-700 rounded-full">
                      Hand-delivered by Creative Kids
                    </span>
                  )}
                </div>

                {/* Live Delhivery tracking — hidden for self-delivery */}
                {selectedOrder.awb_number && !selectedOrder.self_delivery ? (
                  <LiveTracking awb={selectedOrder.awb_number} trackingUrl={selectedOrder.tracking_url} />
                ) : (
                  <div className="space-y-6 relative pl-4">
                    <div className="absolute left-[27px] top-4 bottom-8 w-[2px] bg-gray-100" />
                    {TRACKING_STEPS.map(stepName => {
                      const status = getStepStatus(selectedOrder.status, stepName);
                      return (
                        <div key={stepName} className="relative z-10 flex gap-6 items-start">
                          <div className="bg-white py-1">
                            {status === "completed" && <CheckCircle2 size={24} className="text-green-500 fill-green-50" />}
                            {status === "current" && <div className="relative flex items-center justify-center w-6 h-6"><span className="absolute w-full h-full bg-blue-400 rounded-full animate-ping opacity-30" /><Circle size={20} className="text-blue-600 fill-blue-600" /></div>}
                            {status === "pending" && <Circle size={24} className="text-gray-300" />}
                          </div>
                          <div className="pt-1">
                            <h4 className={`text-[13px] font-bold tracking-widest uppercase ${status === 'pending' ? 'text-gray-400' : 'text-black'}`}>{stepName}</h4>
                            <p className="text-[11px] text-gray-500 mt-1">
                              {status === "completed" && "Completed."}{status === "current" && "In progress."}{status === "pending" && "Pending."}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Items */}
                {(() => {
                  let items = [];
                  try { items = typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : (selectedOrder.items || []); } catch {}
                  return items.length > 0 ? (
                    <div className="mt-6 pt-6 border-t border-black/10">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-3">Items</p>
                      <div className="space-y-3">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            {item.image && <img src={item.image} alt={item.title} className="w-12 h-14 object-cover rounded-lg flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-black truncate">{item.title}</p>
                              <p className="text-[10px] text-black/50">{[item.selectedSize || item.size, item.selectedColor || item.color].filter(Boolean).join(' · ')}</p>
                            </div>
                            <p className="text-[12px] font-bold text-black">₹{parseFloat(item.price).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-black/10 flex justify-between">
                        <span className="text-[11px] font-bold tracking-widest uppercase text-black/60">Total</span>
                        <span className="text-[13px] font-bold text-black">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
