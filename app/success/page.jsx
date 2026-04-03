"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, CheckCircle2 } from "lucide-react";

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
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const addr = order.address;
    const items = order.items || [];
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    // ── Helpers ──────────────────────────────────────────────
    const rupee = (n) => `INR ${parseFloat(n || 0).toFixed(2)}`;
    const invoiceNo = `INV-${(order.orderNumber || "").replace("Creativekids-O-", "") || Date.now()}`;
    const orderDate = new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    // ── GST calculation ───────────────────────────────────────
    const subtotalBeforeDiscount = items.reduce((s, i) => s + parseFloat(i.price) * (i.quantity || 1), 0);
    const discountAmount = parseFloat(order.discountAmount || 0);
    const taxableAmount = subtotalBeforeDiscount - discountAmount;
    const gstRate = 0.05; // 5% GST on kids clothing HSN 6111
    const isIntraState = (addr.state || "").toLowerCase().includes("haryana");
    const gstAmount = parseFloat((taxableAmount * gstRate / (1 + gstRate)).toFixed(2)); // GST is inclusive
    const cgst = isIntraState ? parseFloat((gstAmount / 2).toFixed(2)) : 0;
    const sgst = isIntraState ? parseFloat((gstAmount / 2).toFixed(2)) : 0;
    const igst = isIntraState ? 0 : gstAmount;
    const grandTotal = taxableAmount; // prices are GST-inclusive

    // ── HEADER BAND ───────────────────────────────────────────
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageW, 36, "F");

    doc.setTextColor(200, 245, 62); // accent green
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CREATIVE IMPRESSION", margin, 13);

    doc.setTextColor(180, 180, 180);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Creative Impression  |  Plot No.-667, Pace City-II, Sector-37, Gurugram, Haryana - 122001", margin, 20);
    doc.text("creativekids.co.in  |  support@creativekids.co.in  |  GSTIN: 06AAJPM1384L1ZE  |  PAN: AAJPM1384L", margin, 26);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageW - margin, 13, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`Invoice No: ${invoiceNo}`, pageW - margin, 21, { align: "right" });
    doc.text(`Date: ${orderDate}`, pageW - margin, 27, { align: "right" });

    // ── ORDER + BILLING INFO ──────────────────────────────────
    let y = 46;
    doc.setTextColor(0, 0, 0);

    // Two-column info block
    // Left: Bill To
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("BILL TO", margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    y += 5;
    doc.text(addr.fullName || "", margin, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${addr.houseNo}, ${addr.roadName}`, margin, y); y += 4;
    if (addr.landmark) { doc.text(`Near ${addr.landmark}`, margin, y); y += 4; }
    doc.text(`${addr.city}, ${addr.state} - ${addr.pincode}`, margin, y); y += 4;
    doc.text(`Phone: ${addr.phone}`, margin, y);

    // Right: Order details
    const rx = pageW / 2 + 10;
    let ry = 46;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("ORDER DETAILS", rx, ry);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    ry += 5;
    const details = [
      ["Order Number", order.orderNumber || "—"],
      ["Payment Method", order.paymentMethod || "—"],
      ["Order Status", "Confirmed"],
    ];
    details.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold"); doc.text(`${k}:`, rx, ry);
      doc.setFont("helvetica", "normal"); doc.text(v, rx + 35, ry);
      ry += 5;
    });

    // Divider
    y = Math.max(y, ry) + 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    // ── ITEMS TABLE ───────────────────────────────────────────
    // Header
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, pageW - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text("ITEM DESCRIPTION", margin + 2, y + 5.5);
    doc.text("HSN", 105, y + 5.5);
    doc.text("SIZE", 118, y + 5.5);
    doc.text("COLOR", 133, y + 5.5);
    doc.text("QTY", 152, y + 5.5);
    doc.text("UNIT PRICE", 162, y + 5.5);
    doc.text("TOTAL", pageW - margin - 2, y + 5.5, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    items.forEach((item, idx) => {
      // Page break check
      if (y > pageH - 60) {
        doc.addPage();
        y = 20;
      }

      const rowBg = idx % 2 === 0;
      if (rowBg) { doc.setFillColor(252, 252, 252); doc.rect(margin, y - 2, pageW - margin * 2, 9, "F"); }

      const title = (item.title || "").length > 38 ? (item.title || "").slice(0, 36) + "…" : (item.title || "");
      const qty = item.quantity || 1;
      const unitPrice = parseFloat(item.price);
      const lineTotal = unitPrice * qty;

      doc.text(title, margin + 2, y + 4);
      doc.text("6111", 105, y + 4);
      doc.text(item.selectedSize || item.size || "—", 118, y + 4);
      doc.text(item.selectedColor || item.color || "—", 133, y + 4);
      doc.text(String(qty), 152, y + 4);
      doc.text(rupee(unitPrice), 162, y + 4);
      doc.text(rupee(lineTotal), pageW - margin - 2, y + 4, { align: "right" });

      doc.setDrawColor(235, 235, 235);
      doc.line(margin, y + 7, pageW - margin, y + 7);
      y += 9;
    });

    y += 4;

    // ── TOTALS BLOCK ─────────────────────────────────────────
    const totalsX = pageW - margin - 70;
    const valX = pageW - margin;

    const addTotalRow = (label, value, bold = false, color = null) => {
      if (color) doc.setTextColor(...color);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(bold ? 9 : 8);
      doc.text(label, totalsX, y);
      doc.text(value, valX, y, { align: "right" });
      if (color) doc.setTextColor(0, 0, 0);
      y += bold ? 7 : 5.5;
    };

    doc.setDrawColor(220, 220, 220);
    doc.line(totalsX - 4, y, valX, y);
    y += 4;

    addTotalRow("Subtotal:", rupee(subtotalBeforeDiscount));
    if (discountAmount > 0) addTotalRow(`Discount (${order.couponCode || "coupon"}):`, `- ${rupee(discountAmount)}`, false, [34, 139, 34]);
    addTotalRow("Taxable Amount:", rupee(taxableAmount));

    if (isIntraState) {
      addTotalRow("CGST @ 2.5% (incl.):", rupee(cgst));
      addTotalRow("SGST @ 2.5% (incl.):", rupee(sgst));
    } else {
      addTotalRow("IGST @ 5% (incl.):", rupee(igst));
    }

    doc.setDrawColor(10, 10, 10);
    doc.line(totalsX - 4, y, valX, y);
    y += 4;
    addTotalRow("GRAND TOTAL", rupee(grandTotal), true);

    // ── FOOTER ───────────────────────────────────────────────
    const footerY = pageH - 18;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated invoice and does not require a physical signature.", margin, footerY);
    doc.text("Goods once sold will not be taken back or exchanged unless defective. Subject to Gurugram jurisdiction.", margin, footerY + 4);
    doc.text("Thank you for shopping with Creative Kids!", pageW - margin, footerY, { align: "right" });

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
