"use client";
// A2: connects to the admin SSE stream and surfaces a toast on new orders.
// Requires admin cookie (httpOnly adminToken) to authenticate — uses credentials:'include' on EventSource.
import { useEffect, useState } from "react";

export default function AdminOrderNotifier() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    if (!apiBase) return;
    let es;
    try {
      es = new EventSource(`${apiBase}/api/admin/orders/stream`, { withCredentials: true });
    } catch {
      return;
    }
    const onNew = (e) => {
      try {
        const data = JSON.parse(e.data);
        const id = data.id || Date.now();
        setToasts((t) => [...t, { id, ...data }]);
        try {
          // small audible cue — silent if browser blocks
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; g.gain.value = 0.05;
          o.start(); o.stop(ctx.currentTime + 0.15);
        } catch {}
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
      } catch {}
    };
    es.addEventListener("order:new", onNew);
    es.onerror = () => { /* browser auto-reconnects */ };
    return () => {
      es?.removeEventListener("order:new", onNew);
      es?.close();
    };
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className="bg-black text-white rounded-lg shadow-lg px-4 py-3 text-sm">
          <p className="font-bold mb-0.5">New Order · {t.order_number || `#${t.id}`}</p>
          <p className="text-white/80 text-xs">
            {t.customer_name} · ₹{Number(t.total_amount || 0).toFixed(2)} · {t.items_count} item(s)
          </p>
        </div>
      ))}
    </div>
  );
}
