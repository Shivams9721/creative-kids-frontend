"use client";

import { useState } from "react";
import { Package, Loader2, Truck, CheckCircle2, Clock, Search } from "lucide-react";
import { safeFetch } from "@/lib/safeFetch";

const STATUS_STEPS = [
  { key: "Pending", label: "Order Placed", icon: Package },
  { key: "Processing", label: "Processing", icon: Clock },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) { setError("Please enter your order number"); return; }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await safeFetch(`/api/track-order?order_number=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Order not found. Check your order number and try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <main className="min-h-screen bg-white pt-[80px] md:pt-[90px] pb-24 px-4 md:px-8">
      <div className="max-w-[600px] mx-auto">

        <div className="text-center mb-10">
          <Package size={32} className="mx-auto text-black/20 mb-4" />
          <h1 className="text-2xl md:text-3xl font-light tracking-wide text-black mb-2">Track Your Order</h1>
          <p className="text-[12px] text-black/50 tracking-wider uppercase">Enter your order number to see the latest status</p>
        </div>

        <form onSubmit={handleTrack} className="space-y-4 mb-10">
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">Order Number</label>
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="e.g. CK-20260407-XXXXX"
              className="w-full border border-black/20 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">Email (optional — for verification)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full border border-black/20 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3.5 rounded-full text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {error && (
          <div className="text-center py-6 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-[13px] text-red-500">{error}</p>
          </div>
        )}

        {order && (
          <div className="border border-black/10 rounded-xl p-6 md:p-8">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-black/10">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-black/40 mb-1">Order Number</p>
                <p className="text-[16px] font-bold text-black">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-widest uppercase text-black/40 mb-1">Order Date</p>
                <p className="text-[13px] text-black">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            </div>

            {/* Status tracker */}
            <div className="mb-8">
              <div className="flex justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const currentIdx = getStepIndex(order.status);
                  const Icon = step.icon;
                  const isActive = i <= currentIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1 relative">
                      {i > 0 && (
                        <div className={`absolute top-4 right-1/2 w-full h-[2px] -translate-y-1/2 ${i <= currentIdx ? 'bg-black' : 'bg-black/10'}`} />
                      )}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isActive ? 'bg-black text-white' : 'bg-black/5 text-black/30'}`}>
                        <Icon size={14} />
                      </div>
                      <span className={`text-[9px] tracking-widest uppercase font-bold ${isActive ? 'text-black' : 'text-black/30'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-4">Items</p>
              <div className="space-y-3">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-[#fafafa] rounded-lg">
                    {item.image && (
                      <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-black font-medium truncate">{item.title}</p>
                      <p className="text-[11px] text-black/50">
                        {item.selectedSize && item.selectedSize !== 'Default' ? `Size: ${item.selectedSize}` : ''}
                        {item.selectedColor && item.selectedColor !== 'Default' ? ` · ${item.selectedColor}` : ''}
                        {item.quantity > 1 ? ` · Qty: ${item.quantity}` : ''}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold text-black">₹{parseFloat(item.price || 0).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/10 flex justify-between items-center">
              <span className="text-[11px] font-bold tracking-widest uppercase text-black/50">Total</span>
              <span className="text-[18px] font-bold text-black">₹{parseFloat(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
