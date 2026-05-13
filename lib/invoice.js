// Minimal, premium GST-compliant tax invoice.
// Used by both customer (Profile) and admin (Admin → Orders → Details).

// Load a public/ asset as a data URL so jsPDF can embed it. Returns null on failure
// — caller should gracefully skip drawing the image.
async function loadImageDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function generateInvoicePDF(inv) {
  const { jsPDF } = await import("jspdf");
  const QRCode = (await import("qrcode")).default || (await import("qrcode"));
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 18;
  const rupee = (n) => `${parseFloat(n || 0).toFixed(2)}`;

  // Load brand assets in parallel — invoice still renders if either is missing.
  const [logoDataUrl, signatureDataUrl] = await Promise.all([
    loadImageDataUrl("/images/logo.png"),
    loadImageDataUrl("/images/signature.jpeg"),
  ]);

  const COLOR_TEXT = [20, 20, 20];
  const COLOR_MUTED = [140, 140, 140];
  const COLOR_HAIRLINE = [220, 220, 220];

  const setText = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const hairline = (yPos, x1 = M, x2 = pageW - M) => {
    doc.setDrawColor(...COLOR_HAIRLINE);
    doc.setLineWidth(0.1);
    doc.line(x1, yPos, x2, yPos);
  };
  const label = (text, x, y, opts = {}) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setText(COLOR_MUTED);
    doc.text(String(text).toUpperCase(), x, y, { charSpace: 0.4, ...opts });
  };
  const value = (text, x, y, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 9);
    setText(COLOR_TEXT);
    doc.text(String(text), x, y, opts);
  };

  // ── Top row: logo + wordmark left | Tax Invoice + QR right ──
  // QR sits ABOVE the dividing hairline so it doesn't get crossed by it (Tally style).
  let y = M + 4;
  let brandX = M;
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, "PNG", M, y - 8, 18, 11); } catch {}
    brandX = M + 22;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(COLOR_TEXT);
  doc.text("CREATIVE IMPRESSION", brandX, y, { charSpace: 1.5 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  setText(COLOR_MUTED);
  doc.text("Tax Invoice", pageW - M, y, { align: "right" });

  // QR code linking to order tracking — anchored to the top, fully ABOVE the hairline.
  const qrSize = 22;
  const qrTop = M - 4; // pull it up so its bottom edge sits just above the hairline
  try {
    const trackUrl = `https://creativekids.co.in/track?order=${encodeURIComponent(inv.orderNumber || inv.invoiceNo)}`;
    const qr = await QRCode.toDataURL(trackUrl, { width: 220, margin: 0, color: { dark: "#141414", light: "#FFFFFF" } });
    doc.addImage(qr, "PNG", pageW - M - qrSize, qrTop, qrSize, qrSize);
  } catch {}

  // Hairline goes BELOW both the brand row AND the QR — whichever extends further down.
  y = Math.max(y + 8, qrTop + qrSize + 4);
  hairline(y);

  // ── Meta row: 4 columns, compact ──
  y += 6;
  const colW = (pageW - M * 2 - 28) / 4; // leave 28mm gutter for QR area
  const meta = [
    ["Invoice No.", inv.invoiceNo || "-"],
    ["Invoice Date", new Date(inv.deliveryDate || inv.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
    ["Order Date", new Date(inv.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
    ["Place of Supply", `${inv.placeOfSupply || "-"} · ${inv.natureOfTransaction || ""}`],
  ];
  meta.forEach(([l, v], i) => {
    const x = M + i * colW;
    label(l, x, y);
    value(v, x, y + 5, { size: 8.5 });
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
    inv.billTo?.landmark ? (/^near\s/i.test(inv.billTo.landmark) ? inv.billTo.landmark : `Near ${inv.billTo.landmark}`) : "",
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
  // Two-row pattern (Myntra/Amazon style): title on its own full-width row,
  // numeric columns underneath. Eliminates description-column overlap entirely.
  y += 6;
  const usableW = pageW - M * 2;
  // Numeric columns only — anchored to the right side so totals line up nicely.
  const numCols = [
    { label: "HSN",    w: 22, align: "left"  },
    { label: "Qty",    w: 14, align: "right" },
    { label: "Price",  w: 26, align: "right" },
    { label: "GST",    w: 22, align: "right" },
    { label: "Amount", w: 28, align: "right" },
  ];
  const numStart = M + (usableW - numCols.reduce((s, c) => s + c.w, 0));

  // Column headers
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setText(COLOR_MUTED);
  doc.text("DESCRIPTION", M, y, { charSpace: 0.4 });
  let hx = numStart;
  numCols.forEach(c => {
    if (c.align === "right") doc.text(c.label.toUpperCase(), hx + c.w, y, { align: "right", charSpace: 0.4 });
    else doc.text(c.label.toUpperCase(), hx, y, { charSpace: 0.4 });
    hx += c.w;
  });
  y += 3;
  hairline(y);
  y += 5;

  setText(COLOR_TEXT);
  inv.items.forEach(item => {
    if (y > pageH - 80) { doc.addPage(); y = M + 10; }

    // Title — set font FIRST so splitTextToSize wraps using actual render width.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(COLOR_TEXT);
    // Title gets the full page width minus a 4mm gutter before the numeric block.
    const titleMaxW = numStart - M - 4;
    const titleLines = doc.splitTextToSize(String(item.title || ""), titleMaxW).slice(0, 2);
    titleLines.forEach((t, i) => doc.text(t, M, y + i * 3.8));

    // Numeric row aligned to the FIRST title line so single-line items look tight,
    // and shifted down for two-line titles so it sits next to the last line.
    const numY = y + (titleLines.length - 1) * 3.8;
    let nx = numStart;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(COLOR_TEXT);
    doc.text(String(item.hsn || "-"), nx, numY); nx += numCols[0].w;
    doc.text(String(item.quantity), nx + numCols[1].w, numY, { align: "right" }); nx += numCols[1].w;

    // Price: selling price per unit (GST-inclusive). Show MRP strikethrough above when discounted.
    const pricePerUnit = item.total / (item.quantity || 1);
    const priceRightX = nx + numCols[2].w;
    if (item.discount > 0 && item.gross > 0) {
      const mrpPerUnit = item.gross / (item.quantity || 1);
      doc.setFontSize(7);
      setText(COLOR_MUTED);
      const mrpStr = rupee(mrpPerUnit);
      doc.text(mrpStr, priceRightX, numY - 3, { align: "right" });
      const mrpW = doc.getTextWidth(mrpStr);
      doc.setDrawColor(...COLOR_MUTED);
      doc.setLineWidth(0.2);
      doc.line(priceRightX - mrpW, numY - 4, priceRightX, numY - 4);
      doc.setFontSize(8.5);
      setText(COLOR_TEXT);
    }
    doc.text(rupee(pricePerUnit), priceRightX, numY, { align: "right" });
    nx += numCols[2].w;

    doc.text(rupee(item.cgst + item.sgst + item.igst), nx + numCols[3].w, numY, { align: "right" }); nx += numCols[3].w;
    doc.setFont("helvetica", "bold");
    doc.text(rupee(item.total), nx + numCols[4].w, numY, { align: "right" });
    doc.setFont("helvetica", "normal");

    // Variant detail in muted text below the title (visible on left, doesn't touch numeric column)
    let extraY = y + titleLines.length * 3.8;
    if (item.size && item.size !== "-") {
      doc.setFontSize(7.5);
      setText(COLOR_MUTED);
      doc.text(`Size ${item.size}${item.color && item.color !== "-" ? `  ·  ${item.color}` : ""}`, M, extraY + 0.5);
      extraY += 4;
    }

    const rowH = Math.max(extraY - y, (titleLines.length * 3.8));
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
  // Show rate only when the invoice has a single uniform GST rate; otherwise plain label
  // (mixed-rate invoices show the per-line breakdown for the rates).
  const rate = inv.uniformGstRate; // null when mixed
  const halfRate = rate != null ? (rate / 2) : null;
  if (inv.cgst > 0) sumRow(halfRate != null ? `CGST (${halfRate}%)` : "CGST", rupee(inv.cgst));
  if (inv.sgst > 0) sumRow(halfRate != null ? `SGST (${halfRate}%)` : "SGST", rupee(inv.sgst));
  if (inv.igst > 0) sumRow(rate != null ? `IGST (${rate}%)` : "IGST", rupee(inv.igst));
  if (inv.shippingFee > 0) sumRow("Shipping", rupee(inv.shippingFee));
  y += 4;
  hairline(y - 2, sumLabelX - 2, sumValX);
  sumRow("Total", `Rs ${rupee(inv.grandTotal)}`, { bold: true });

  // ── Footer ──
  const footerY = pageH - 36;
  hairline(footerY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(COLOR_MUTED);
  doc.text("Reverse charge: No  ·  Supply: Goods  ·  End-user consumption only.", M, footerY);
  doc.text("Returns subject to policy at creativekids.co.in/returns", M, footerY + 4);
  doc.text("Support  info@creativeimpression.in  ·  +91 124 4130381", M, footerY + 8);

  setText(COLOR_TEXT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("For Creative Impression", pageW - M, footerY, { align: "right" });
  if (signatureDataUrl) {
    // Signature is ~2.4:1. 28mm × 11mm sits nicely above the "Authorised Signatory" line.
    try { doc.addImage(signatureDataUrl, "JPEG", pageW - M - 28, footerY + 1, 28, 11); } catch {}
  }
  doc.setFontSize(7);
  setText(COLOR_MUTED);
  doc.text("Authorised Signatory", pageW - M, footerY + 15, { align: "right" });

  doc.save(`CreativeKids-Invoice-${inv.orderNumber}.pdf`);
}
