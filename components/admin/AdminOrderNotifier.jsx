"use client";
import { useEffect, useState } from "react";
import { safeFetch } from "@/app/admin/api";

export default function AdminOrderNotifier() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    if (!apiBase) return;

    let es = null;
    let cancelled = false;

    // Use the same token mechanism as safeFetch (reads httpOnly cookie via /api/admin/token).
    // Pass as ?token= — EventSource can't send Authorization headers.
    fetch("/api/admin/token", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ token }) => {
        if (!token || cancelled) return;
        es = new EventSource(
          `${apiBase}/api/admin/orders/stream?token=${encodeURIComponent(token)}`
        );
        es.addEventListener("order:new", (e) => {
          try {
            const data = JSON.parse(e.data);
            const id = data.id || Date.now();
            setToasts((t) => [...t, { id, ...data }]);
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g); g.connect(ctx.destination);
              o.frequency.value = 880; g.gain.value = 0.05;
              o.start(); o.stop(ctx.currentTime + 0.15);
            } catch {}
            setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
          } catch {}
        });
        es.onerror = () => {};
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (es) { es.close(); es = null; }
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
