// Shared invoice PDF generator. Same output used by customer (Profile → My Orders)
// and admin (Admin → Orders → Details → Download Invoice).

export async function generateInvoicePDF(inv) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const rupee = (n) => `INR ${parseFloat(n || 0).toFixed(2)}`;

  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setTextColor(200, 245, 62);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CREATIVE IMPRESSION", margin, 13);
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Plot No.-550A, Pace City-II, Sector-37, Gurugram, Haryana - 122001", margin, 20);
  doc.text("creativekids.co.in | GSTIN: 06AAJPM1384L1ZE | PAN: AAJPM1384L", margin, 26);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", pageW - margin, 13, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(`Invoice No: ${inv.invoiceNo}`, pageW - margin, 21, { align: "right" });
  doc.text(`Date: ${new Date(inv.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, pageW - margin, 27, { align: "right" });

  let y = 46;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("BILL TO", margin, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  y += 5;
  doc.text(inv.billTo.fullName || "", margin, y); y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (inv.billTo.houseNo) doc.text(`${inv.billTo.houseNo}, ${inv.billTo.roadName}`, margin, y); y += 4;
  if (inv.billTo.landmark) { doc.text(`Near ${inv.billTo.landmark}`, margin, y); y += 4; }
  doc.text(`${inv.billTo.city}, ${inv.billTo.state} - ${inv.billTo.pincode}`, margin, y);

  y = 70;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageW - margin * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text("ITEM", margin + 2, y + 5.5);
  doc.text("QTY", 120, y + 5.5);
  doc.text("PRICE", 140, y + 5.5);
  doc.text("TOTAL", pageW - margin - 2, y + 5.5, { align: "right" });
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  inv.items.forEach((item) => {
    if (y > pageH - 60) { doc.addPage(); y = 20; }
    const title = (item.title || "").slice(0, 40);
    doc.text(title, margin + 2, y);
    doc.text(String(item.quantity || 1), 120, y);
    doc.text(rupee(item.price), 140, y);
    doc.text(rupee(item.price * (item.quantity || 1)), pageW - margin - 2, y, { align: "right" });
    doc.setDrawColor(235, 235, 235);
    doc.line(margin, y + 3, pageW - margin, y + 3);
    y += 6;
  });

  y += 4;
  const totalsX = pageW - margin - 70;
  const valX = pageW - margin;
  const addTotalRow = (label, value, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9 : 8);
    doc.text(label, totalsX, y);
    doc.text(value, valX, y, { align: "right" });
    y += bold ? 7 : 5.5;
  };
  doc.setDrawColor(220, 220, 220);
  doc.line(totalsX - 4, y, valX, y);
  y += 4;
  addTotalRow("Subtotal:", rupee(inv.subtotal));
  if (inv.discount > 0) addTotalRow(`Discount:`, `- ${rupee(inv.discount)}`);
  addTotalRow("Taxable Amount:", rupee(inv.taxableAmount));
  if (inv.isIntraState) {
    addTotalRow("CGST @ 2.5%:", rupee(inv.cgst));
    addTotalRow("SGST @ 2.5%:", rupee(inv.sgst));
  } else {
    addTotalRow("IGST @ 5%:", rupee(inv.igst));
  }
  doc.setDrawColor(10, 10, 10);
  doc.line(totalsX - 4, y, valX, y);
  y += 4;
  addTotalRow("GRAND TOTAL", rupee(inv.grandTotal), true);

  doc.save(`CreativeKids-Invoice-${inv.orderNumber}.pdf`);
}
