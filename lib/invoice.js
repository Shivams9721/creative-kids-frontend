// Minimal, premium GST-compliant tax invoice. Whitespace-driven layout,
// hairline dividers, light typography. Used by both customer (Profile) and
// admin (Admin → Orders → Details → Download Invoice).

export async function generateInvoicePDF(inv) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 18; // generous margin
  const rupee = (n) => `${parseFloat(n || 0).toFixed(2)}`;

  // Soft palette
  const COLOR_TEXT = [20, 20, 20];
  const COLOR_MUTED = [140, 140, 140];
  const COLOR_HAIRLINE = [220, 220, 220];

  const setText = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const hairline = (yPos, x1 = M, x2 = pageW - M) => {
    doc.setDrawColor(...COLOR_HAIRLINE);
    doc.setLineWidth(0.1);
    doc.line(x1, yPos, x2, yPos);
  };
  const label = (text, x, y) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setText(COLOR_MUTED);
    doc.text(String(text).toUpperCase(), x, y, { charSpace: 0.4 });
  };
  const value = (text, x, y, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 9);
    setText(COLOR_TEXT);
    doc.text(String(text), x, y, opts);
  };

  // ── Top: brand left, doc-type right ──
  let y = M + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(COLOR_TEXT);
  doc.text("CREATIVE IMPRESSION", M, y, { charSpace: 1.5 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(COLOR_MUTED);
  doc.text("Tax Invoice", pageW - M, y, { align: "right" });
  y += 8;
  hairline(y);

  // ── Meta row: invoice no, date, place of supply, nature ──
  y += 6;
  const colW = (pageW - M * 2) / 4;
  const meta = [
    ["Invoice No.", inv.invoiceNo || "-"],
    ["Invoice Date", new Date(inv.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
    ["Place of Supply", inv.placeOfSupply || "-"],
    ["Transaction", inv.natureOfTransaction || "-"],
  ];
  meta.forEach(([l, v], i) => {
    const x = M + i * colW;
    label(l, x, y);
    value(v, x, y + 5);
  });
  y += 14;
  hairline(y);

  // ── Bill To / Bill From ──
  y += 6;
  const halfW = (pageW - M * 2) / 2 - 6;
  label("Bill To", M, y);
  label("Bill From", M + halfW + 12, y);
  y += 5;

  value(inv.billTo?.fullName || "-", M, y, { bold: true });
  value("Creative Impression", M + halfW + 12, y, { bold: true });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(COLOR_MUTED);
  const billToLines = [
    [inv.billTo?.houseNo, inv.billTo?.roadName].filter(Boolean).join(", "),
    inv.billTo?.landmark ? `Near ${inv.billTo.landmark}` : "",
    `${inv.billTo?.city || ""}, ${inv.billTo?.state || ""} ${inv.billTo?.pincode || ""}`.trim(),
    inv.billTo?.phone ? `+91 ${inv.billTo.phone}` : "",
    `${inv.customerType || "Unregistered"}`,
  ].filter(s => s && s.trim());
  const billFromLines = [
    "Plot No. 550A, Pace City-II",
    "Sector 37, Gurugram",
    "Haryana 122001",
    "GSTIN  06AAJPM1384L1ZE",
    "PAN  AAJPM1384L",
  ];
  let yL = y, yR = y;
  billToLines.forEach(l => { doc.text(l, M, yL); yL += 4.2; });
  billFromLines.forEach(l => { doc.text(l, M + halfW + 12, yR); yR += 4.2; });
  y = Math.max(yL, yR) + 4;
  hairline(y);

  // ── Items table ──
  y += 6;
  const usableW = pageW - M * 2;
  // Compact, premium: Description | HSN | Qty | Rate | GST | Amount
  // (Per-tax columns CGST/SGST are merged into a single 'GST' summary column,
  // mirroring premium D2C invoice templates — the per-tax split is shown in the
  // right-aligned summary block below.)
  const cols = [
    { label: "Description", key: "title", w: 70, align: "left"  },
    { label: "HSN",         key: "hsn",   w: 16, align: "left"  },
    { label: "Qty",         key: "qty",   w: 12, align: "right" },
    { label: "Rate",        key: "rate",  w: 22, align: "right" },
    { label: "GST",         key: "gst",   w: 22, align: "right" },
    { label: "Amount",      key: "amt",   w: 0,  align: "right" },
  ];
  cols[cols.length - 1].w = usableW - cols.reduce((s, c) => s + c.w, 0);

  // Header
  label("", M, y); // baseline marker, unused
  let x = M;
  cols.forEach(c => {
    const tx = c.align === "right" ? x + c.w : x;
    label(c.label, tx, y, c.align === "right" ? { align: "right" } : undefined);
    // jspdf doesn't pass options to label helper; do manual right-align
    x += c.w;
  });
  // re-render right-aligned headers correctly
  x = M;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setText(COLOR_MUTED);
  cols.forEach(c => {
    if (c.align === "right") {
      doc.text(c.label.toUpperCase(), x + c.w, y, { align: "right", charSpace: 0.4 });
    } else {
      doc.text(c.label.toUpperCase(), x, y, { charSpace: 0.4 });
    }
    x += c.w;
  });
  y += 4;
  hairline(y);
  y += 5;

  // Body
  setText(COLOR_TEXT);
  inv.items.forEach(item => {
    if (y > pageH - 70) { doc.addPage(); y = M + 10; }
    x = M;
    const titleLines = doc.splitTextToSize(String(item.title || ""), cols[0].w - 2).slice(0, 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    titleLines.forEach((t, i) => doc.text(t, x, y + i * 3.8));
    // Variant detail in muted below title
    if (item.size && item.size !== "-") {
      doc.setFontSize(7.5);
      setText(COLOR_MUTED);
      doc.text(`Size ${item.size}${item.color && item.color !== "-" ? `  ·  ${item.color}` : ""}`, x, y + titleLines.length * 3.8 + 0.5);
      setText(COLOR_TEXT);
    }
    const rowH = Math.max(5.5, titleLines.length * 3.8 + (item.size && item.size !== "-" ? 4 : 0));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    x += cols[0].w;
    doc.text(item.hsn || "-", x, y); x += cols[1].w;
    doc.text(String(item.quantity), x + cols[2].w, y, { align: "right" }); x += cols[2].w;
    doc.text(rupee(item.taxable), x + cols[3].w, y, { align: "right" }); x += cols[3].w;
    doc.text(rupee(item.cgst + item.sgst + item.igst), x + cols[4].w, y, { align: "right" }); x += cols[4].w;
    doc.text(rupee(item.total), x + cols[5].w, y, { align: "right" });
    y += rowH + 4;
  });

  hairline(y - 2);

  // ── Right-aligned totals ──
  y += 6;
  const sumLabelX = pageW - M - 60;
  const sumValX = pageW - M;
  const sumRow = (l, v, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.bold ? 10 : 9);
    setText(opts.bold ? COLOR_TEXT : COLOR_MUTED);
    doc.text(l, sumLabelX, y);
    setText(COLOR_TEXT);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.text(v, sumValX, y, { align: "right" });
    y += opts.bold ? 7 : 5.2;
  };
  sumRow("Sub-total", rupee(inv.subtotal));
  if (inv.discount > 0) sumRow("Discount", `– ${rupee(inv.discount)}`);
  sumRow("Taxable Value", rupee(inv.taxableAmount));
  if (inv.cgst > 0) sumRow("CGST (2.5%)", rupee(inv.cgst));
  if (inv.sgst > 0) sumRow("SGST (2.5%)", rupee(inv.sgst));
  if (inv.igst > 0) sumRow("IGST (5%)", rupee(inv.igst));
  if (inv.shippingFee > 0) sumRow("Shipping", rupee(inv.shippingFee));
  y += 1;
  hairline(y - 2, sumLabelX - 2, sumValX);
  sumRow("Total", `₹ ${rupee(inv.grandTotal)}`, { bold: true });

  // ── Footer: declarations, signature, support ──
  // Place near bottom — premium templates breathe.
  const footerY = pageH - 36;
  hairline(footerY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(COLOR_MUTED);
  doc.text("Reverse charge: No  ·  Supply: Goods  ·  End-user consumption only.", M, footerY);
  doc.text("Returns subject to policy at creativekids.co.in/returns", M, footerY + 4);
  doc.text("support@creativekids.co.in", M, footerY + 8);

  // Signatory
  setText(COLOR_TEXT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("For Creative Impression", pageW - M, footerY, { align: "right" });
  doc.setFontSize(7);
  setText(COLOR_MUTED);
  doc.text("Authorised Signatory", pageW - M, footerY + 12, { align: "right" });

  doc.save(`CreativeKids-Invoice-${inv.orderNumber}.pdf`);
}
