"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Download, CheckCircle2 } from "lucide-react";

export default function OrderSuccess() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastOrder");
      if (saved) setOrder(JSON.parse(saved));
    } catch {}
  }, []);

  const downloadInvoice = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const addr = order.address;
    const items = order.items || [];
    const subtotal = parseFloat(order.total);
    // Indian GST: 5% for kids clothing (HSN 6111/6209)
    const gstRate = 0.05;
    const isIntraState = addr.state?.toLowerCase().includes("haryana");
    const gstAmount = subtotal * gstRate;
    const cgst = isIntraState ? gstAmount / 2 : 0;
    const sgst = isIntraState ? gstAmount / 2 : 0;
    const igst = isIntraState ? 0 : gstAmount;
    const grandTotal = subtotal; // price is inclusive, so we just break it down

    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 33, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CREATIVE KIDS", 14, 11);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Creative Impression | Plot No.-667, Pace City - II, Sector - 37, Gurugram, Haryana - 122001", 14, 17);
    doc.text("creativekids.co.in  |  GSTIN: 06AAJPM1384L1ZE  |  PAN: AAJPM1384L", 14, 22);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageW - 14, 13, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`, pageW - 14, 20, { align: "right" });

    y = 43;
    doc.setTextColor(0, 0, 0);

    // Order number
    if (order.orderNumber) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Order: ${order.orderNumber}`, 14, y);
      y += 8;
    }

    // Bill to
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.text(addr.fullName || "", 14, y); y += 4;
    doc.text(`${addr.houseNo}, ${addr.roadName}`, 14, y); y += 4;
    if (addr.landmark) { doc.text(`Landmark: ${addr.landmark}`, 14, y); y += 4; }
    doc.text(`${addr.city}, ${addr.state} - ${addr.pincode}`, 14, y); y += 4;
    doc.text(`Phone: ${addr.phone}`, 14, y); y += 4;
    doc.text(`Payment: ${order.paymentMethod}`, 14, y); y += 10;

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageW - 28, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Item", 16, y + 5.5);
    doc.text("Size", 110, y + 5.5);
    doc.text("Color", 130, y + 5.5);
    doc.text("Qty", 155, y + 5.5);
    doc.text("Price", pageW - 16, y + 5.5, { align: "right" });
    y += 10;

    // Table rows
    doc.setFont("helvetica", "normal");
    items.forEach((item) => {
      const title = item.title?.length > 40 ? item.title.slice(0, 38) + "…" : item.title;
      doc.text(title || "", 16, y);
      doc.text(item.selectedSize || item.size || "—", 110, y);
      doc.text(item.selectedColor || item.color || "—", 130, y);
      doc.text(String(item.quantity || 1), 155, y);
      doc.text(`Rs.${parseFloat(item.price).toFixed(2)}`, pageW - 16, y, { align: "right" });
      y += 7;
      doc.setDrawColor(230, 230, 230);
      doc.line(14, y - 1, pageW - 14, y - 1);
    });

    y += 6;

    // GST breakdown
    const taxX = pageW - 80;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Subtotal (incl. GST):", taxX, y);
    doc.text(`Rs.${subtotal.toFixed(2)}`, pageW - 16, y, { align: "right" }); y += 6;

    if (isIntraState) {
      doc.text(`CGST (2.5%):`, taxX, y);
      doc.text(`Rs.${cgst.toFixed(2)}`, pageW - 16, y, { align: "right" }); y += 6;
      doc.text(`SGST (2.5%):`, taxX, y);
      doc.text(`Rs.${sgst.toFixed(2)}`, pageW - 16, y, { align: "right" }); y += 6;
    } else {
      doc.text(`IGST (5%):`, taxX, y);
      doc.text(`Rs.${igst.toFixed(2)}`, pageW - 16, y, { align: "right" }); y += 6;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Grand Total:", taxX, y);
    doc.text(`Rs.${grandTotal.toFixed(2)}`, pageW - 16, y, { align: "right" }); y += 12;

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated invoice and does not require a signature.", 14, y);
    doc.text("Thank you for shopping with Creative Kids!", 14, y + 4);

    doc.save(`CreativeKids-Invoice-${order.orderNumber || "order"}.pdf`);
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
            {order && (
              <button
                onClick={downloadInvoice}
                className="flex items-center justify-center gap-2 border border-black px-8 py-4 text-xs tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors"
              >
                <Download size={14} /> Download Invoice
              </button>
            )}
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
