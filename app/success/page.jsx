"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, CheckCircle2, Package } from "lucide-react";

export default function OrderSuccess() {
  const [order, setOrder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastOrder");
      if (!saved) { router.replace("/"); return; }
      setOrder(JSON.parse(saved));
    } catch { router.replace("/"); }
  }, [router]);

  const downloadInvoice = async () => {
    // Invoices are now generated on-demand from the profile page after delivery
    alert("Your invoice will be available in My Orders after your package is delivered. You'll receive a notification then.");
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full"
        >
          <CheckCircle2 size={48} className="mx-auto mb-6 text-black" strokeWidth={1} />

          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-black mb-4">
            Order Confirmed
          </h1>

          {order?.orderNumber && (
            <p className="text-[11px] font-bold tracking-widest uppercase text-black/50 mb-2">
              {order.orderNumber}
            </p>
          )}

          <p className="text-xs text-black/60 tracking-widest uppercase mb-8 leading-relaxed">
            Thank you for your purchase. Your items are being prepared for shipment.
          </p>

          <div className="w-12 h-[1px] bg-black/20 mx-auto mb-8" />

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/profile?tab=orders"
              className="flex items-center justify-center gap-2 border border-black px-8 py-4 text-xs tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors"
            >
              <Package size={14} /> Track Order
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center border border-black/30 px-8 py-4 text-xs tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors"
            >
              Return to Boutique
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
