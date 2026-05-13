// GST-compliant invoice PDF generator. Same output used by customer (Profile)
// and admin (Admin → Orders → Details → Download Invoice).
//
// Layout follows the standard Indian Tax Invoice format (per CGST Rule 46):
// - Seller GSTIN / address / signatory
// - Buyer name + GSTIN (if any) + Place of Supply
// - Nature of Transaction (Intra/Inter-State) & Nature of Supply
// - Per-line: HSN, Qty, Gross, Discount, Taxable, CGST, SGST, IGST, Total
// - Reverse charge declaration + signatory + declaration footer

export async function generateInvoicePDF(inv) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const rupee = (n) => `Rs ${parseFloat(n || 0).toFixed(2)}`;

  // ── Header ──
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(200, 245, 62);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text("CREATIVE IMPRESSION", margin, 12);
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Plot No. 550A, Pace City-II, Sector-37, Gurugram, Haryana - 122001", margin, 18);
  doc.text("GSTIN: 06AAJPM1384L1ZE | PAN: AAJPM1384L | creativekids.co.in", margin, 23);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", pageW - margin, 12, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(`Invoice No: ${inv.invoiceNo}`, pageW - margin, 19, { align: "right" });
  doc.text(`Order: ${inv.orderNumber}`, pageW - margin, 24, { align: "right" });

  // ── Meta row ──
  let y = 38;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  const colW = (pageW - margin * 2) / 4;
  const metaRow = [
    ["Invoice Date", new Date(inv.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
    ["Place of Supply", inv.placeOfSupply || "-"],
    ["Nature of Transaction", inv.natureOfTransaction || "-"],
    ["Nature of Supply", inv.natureOfSupply || "Goods"],
  ];
  metaRow.forEach((cell, i) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text(cell[0].toUpperCase(), margin + i * colW, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(String(cell[1]), margin + i * colW, y + 4);
  });
  y += 11;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);

  // ── Bill To / Bill From ──
  y += 6;
  const halfW = (pageW - margin * 2) / 2 - 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("BILL TO / SHIP TO", margin, y);
  doc.text("BILL FROM / SHIP FROM", margin + halfW + 8, y);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(inv.billTo?.fullName || "-", margin, y);
  doc.text("Creative Impression", margin + halfW + 8, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  y += 4;
  const billToLines = [
    [inv.billTo?.houseNo, inv.billTo?.roadName].filter(Boolean).join(", "),
    inv.billTo?.landmark ? `Near ${inv.billTo.landmark}` : "",
    `${inv.billTo?.city || ""}, ${inv.billTo?.state || ""} - ${inv.billTo?.pincode || ""}`,
    `Phone: ${inv.billTo?.phone || "-"}`,
    `Customer Type: ${inv.customerType || "Unregistered"}`,
  ].filter(Boolean);
  const billFromLines = [
    "Plot No. 550A, Pace City-II, Sector-37",
    "Gurugram, Haryana - 122001",
    "GSTIN: 06AAJPM1384L1ZE",
    "PAN: AAJPM1384L",
  ];
  billToLines.forEach(line => { doc.text(line, margin, y); y += 4; });
  let y2 = y - (billToLines.length * 4);
  billFromLines.forEach(line => { doc.text(line, margin + halfW + 8, y2); y2 += 4; });
  y = Math.max(y, y2) + 4;

  // ── Items table — GST-compliant breakdown ──
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  // Column layout (mm). Total = pageW - margin*2.
  const usableW = pageW - margin * 2;
  // [Item, HSN, Qty, Gross, Disc, Taxable, CGST, SGST, IGST, Total]
  const cols = [
    { key: "title",    label: "ITEM",    w: 45, align: "left"  },
    { key: "hsn",      label: "HSN",     w: 14, align: "left"  },
    { key: "qty",      label: "QTY",     w: 8,  align: "right" },
    { key: "gross",    label: "GROSS",   w: 18, align: "right" },
    { key: "discount", label: "DISC",    w: 16, align: "right" },
    { key: "taxable",  label: "TAXABLE", w: 18, align: "right" },
    { key: "cgst",     label: "CGST",    w: 14, align: "right" },
    { key: "sgst",     label: "SGST",    w: 14, align: "right" },
    { key: "igst",     label: "IGST",    w: 14, align: "right" },
    { key: "total",    label: "TOTAL",   w: 0,  align: "right" }, // fills remainder
  ];
  const fixedW = cols.reduce((s, c) => s + c.w, 0);
  cols[cols.length - 1].w = usableW - fixedW;

  // Header row
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, usableW, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  let x = margin;
  cols.forEach(c => {
    const tx = c.align === "right" ? x + c.w - 1.5 : x + 1.5;
    doc.text(c.label, tx, y + 4.7, { align: c.align });
    x += c.w;
  });
  y += 9;

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  inv.items.forEach(item => {
    if (y > pageH - 70) { doc.addPage(); y = 20; }
    x = margin;
    // Wrap long titles to 2 lines max
    const titleStr = doc.splitTextToSize(String(item.title || ""), cols[0].w - 3).slice(0, 2);
    titleStr.forEach((t, i) => doc.text(t, margin + 1.5, y + i * 3.5));
    const lineH = Math.max(4, titleStr.length * 3.5);
    x += cols[0].w;
    const cellAt = (col, val) => {
      const tx = col.align === "right" ? x + col.w - 1.5 : x + 1.5;
      doc.text(String(val), tx, y, { align: col.align });
      x += col.w;
    };
    cellAt(cols[1], item.hsn || "-");
    cellAt(cols[2], item.quantity);
    cellAt(cols[3], rupee(item.gross));
    cellAt(cols[4], rupee(item.discount));
    cellAt(cols[5], rupee(item.taxable));
    cellAt(cols[6], rupee(item.cgst));
    cellAt(cols[7], rupee(item.sgst));
    cellAt(cols[8], rupee(item.igst));
    cellAt(cols[9], rupee(item.total));
    doc.setDrawColor(235, 235, 235);
    doc.line(margin, y + lineH + 1, pageW - margin, y + lineH + 1);
    y += lineH + 3;
  });

  // ── Totals row ──
  y += 2;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, usableW, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  x = margin;
  doc.text("TOTAL", margin + 1.5, y + 4.7);
  // Skip Item, HSN, Qty cells
  x = margin + cols[0].w + cols[1].w + cols[2].w;
  const totalCells = [
    rupee(inv.subtotal),
    rupee(inv.discount),
    rupee(inv.taxableAmount),
    rupee(inv.cgst),
    rupee(inv.sgst),
    rupee(inv.igst),
    rupee(inv.subtotal - inv.discount),
  ];
  const totalsCols = cols.slice(3);
  totalCells.forEach((val, i) => {
    const c = totalsCols[i];
    const tx = x + c.w - 1.5;
    doc.text(val, tx, y + 4.7, { align: "right" });
    x += c.w;
  });
  y += 11;

  // ── Right-aligned summary ──
  const sumX = pageW - margin - 60;
  const sumVx = pageW - margin;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const sumRow = (label, val, bold = false, divider = false) => {
    if (divider) {
      doc.setDrawColor(220, 220, 220);
      doc.line(sumX - 2, y - 1, sumVx, y - 1);
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 8);
    doc.text(label, sumX, y);
    doc.text(val, sumVx, y, { align: "right" });
    y += bold ? 7 : 5;
  };
  sumRow("Sub-total (Taxable):", rupee(inv.taxableAmount));
  if (inv.cgst > 0) sumRow("CGST:", rupee(inv.cgst));
  if (inv.sgst > 0) sumRow("SGST:", rupee(inv.sgst));
  if (inv.igst > 0) sumRow("IGST:", rupee(inv.igst));
  if (inv.shippingFee > 0) sumRow("Shipping:", rupee(inv.shippingFee));
  sumRow("GRAND TOTAL", rupee(inv.grandTotal), true, true);

  // ── Declarations / footer ──
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("DECLARATIONS", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  y += 4;
  const declarations = [
    "Is the supply subject to reverse charge: No",
    "The goods sold as part of this shipment are intended for end-user consumption and are not for retail sale.",
    "Goods once sold cannot be taken back. Returns are subject to our Return Policy at creativekids.co.in/returns.",
  ];
  declarations.forEach(d => {
    const lines = doc.splitTextToSize(d, pageW - margin * 2);
    lines.forEach(l => { doc.text(l, margin, y); y += 3.5; });
    y += 0.5;
  });

  // Authorised signatory
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("For Creative Impression", pageW - margin, y, { align: "right" });
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Authorised Signatory", pageW - margin, y, { align: "right" });

  // Customer care footer (bottom of page)
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Customer Support: support@creativekids.co.in  |  Returns: creativekids.co.in/returns", margin, pageH - 8);
  doc.text("E. & O.E.", pageW - margin, pageH - 8, { align: "right" });

  doc.save(`CreativeKids-Invoice-${inv.orderNumber}.pdf`);
}
