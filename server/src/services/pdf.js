import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(currentDirectory, "../assets/yeros-auto-logo.png");
const zelleQrPath = path.resolve(currentDirectory, "../assets/zelle-qr.jpeg");
const zelleRecipient = "yerosautoservicesllc@gmail.com";

function compactText(value, limit) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function formatDate(value, fallback = "-") {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-US");
}

function drawZelleQr(doc, x, y, size) {
  doc.save().roundedRect(x, y, size, size, 3).fill("#ffffff");
  if (fs.existsSync(zelleQrPath)) doc.image(zelleQrPath, x + 6, y + 6, { fit: [size - 12, size - 12] });
  doc.restore().roundedRect(x, y, size, size, 3).lineWidth(0.7).strokeColor("#d7e0ea").stroke();
}

function paymentOption(doc, label, selected, x, y) {
  doc.rect(x, y, 9, 9).lineWidth(0.8).strokeColor("#64748b").stroke();
  if (selected) {
    doc.moveTo(x + 2, y + 4.5).lineTo(x + 4, y + 7).lineTo(x + 8, y + 2)
      .lineWidth(1.3).strokeColor("#1d4ed8").stroke();
  }
  doc.font(selected ? "Helvetica-Bold" : "Helvetica").fontSize(7.5).fillColor("#334155")
    .text(label, x + 14, y - 0.2, { lineBreak: false });
}

function addBusinessHeader(doc, title, number, date) {
  doc.rect(0, 0, 612, 110).fill("#0b1324");
  doc.rect(0, 106, 612, 4).fill("#1d4ed8");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 38, 17, { fit: [265, 54], align: "left", valign: "center" });
  } else {
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("YEROS AUTO SERVICES", 38, 25);
  }
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff").text("MOBILE AUTO REPAIR", 39, 74);
  doc.font("Helvetica").fontSize(7.3).fillColor("#cbd5e1")
    .text("(239) 460-4992  |  yerosautoservicesllc@gmail.com", 39, 88, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff").text(title, 388, 25, { width: 180, align: "right" });
  doc.font("Helvetica").fontSize(7.5).fillColor("#cbd5e1")
    .text(number || "-", 368, 58, { width: 200, align: "right" })
    .text(formatDate(date), 368, 72, { width: 200, align: "right" })
    .text("Lehigh Acres, FL", 368, 86, { width: 200, align: "right" });
}

function addInvoice(doc, record, options) {
  const navy = "#0b1324";
  const blue = "#1d4ed8";
  const muted = "#64748b";
  const line = "#d7e0ea";
  const services = Array.isArray(record.services) ? record.services : [];
  const serviceTotal = services.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
  const laborTotal = Number(record.labor || 0);
  const subtotal = Number(record.subtotal ?? serviceTotal + laborTotal);
  const total = Number(record.total ?? subtotal);
  const tax = Math.max(0, total - subtotal);
  const payment = String(record.paymentMethod || "").toLowerCase();

  addBusinessHeader(doc, "INVOICE", options.number, options.date);
  doc.font("Helvetica-Bold").fontSize(7).fillColor(muted).text("INVOICE #", 44, 126);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(navy).text(options.number || "-", 44, 139);
  doc.font("Helvetica-Bold").fontSize(7).fillColor(muted).text("DATE", 230, 126);
  doc.font("Helvetica").fontSize(9).fillColor(navy).text(formatDate(options.date), 230, 139);
  doc.font("Helvetica-Bold").fontSize(7).fillColor(muted).text("DUE DATE", 360, 126);
  doc.font("Helvetica").fontSize(9).fillColor(navy).text(formatDate(record.promisedAt, "Due upon receipt"), 360, 139, { width: 125 });
  doc.roundedRect(500, 124, 68, 28, 4).fill(blue);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff").text(options.status || "OPEN", 504, 134, { width: 60, align: "center", lineBreak: false });

  doc.roundedRect(44, 168, 250, 88, 5).lineWidth(0.7).strokeColor(line).stroke();
  doc.roundedRect(306, 168, 262, 88, 5).lineWidth(0.7).strokeColor(line).stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(blue).text("CUSTOMER INFORMATION", 56, 180);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(navy).text(record.customer?.name || "-", 56, 197, { width: 225 });
  doc.font("Helvetica").fontSize(8).fillColor(muted).text(`Phone: ${record.customer?.phone || "-"}`, 56, 216);
  doc.text(`Email: ${record.customer?.email || "-"}`, 56, 232, { width: 225, lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(blue).text("VEHICLE", 318, 180);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(navy)
    .text(`${record.vehicle?.year || ""} ${record.vehicle?.make || ""} ${record.vehicle?.model || ""}`.trim() || "-", 318, 197, { width: 238 });
  doc.font("Helvetica").fontSize(7.5).fillColor(muted).text(`Engine: ${record.vehicle?.engine || "-"}`, 318, 216, { width: 115, lineBreak: false });
  doc.text(`Mileage: ${record.vehicle?.mileage ? Number(record.vehicle.mileage).toLocaleString() : "-"}`, 438, 216, { width: 118, lineBreak: false });
  doc.text(`VIN: ${record.vehicle?.vin || "-"}`, 318, 232, { width: 238, lineBreak: false });

  const tableY = 274;
  const tableBottom = 470;
  const rows = Math.max(1, services.length + (laborTotal > 0 ? 1 : 0));
  const rowHeight = Math.max(12, Math.min(23, Math.floor((tableBottom - tableY - 27) / rows)));
  const fontSize = rowHeight < 16 ? 6.5 : 7.6;
  doc.roundedRect(44, tableY, 524, 24, 3).fill(navy);
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#ffffff");
  doc.text("QTY", 52, tableY + 8, { width: 30, align: "center" });
  doc.text("SERVICES PERFORMED", 90, tableY + 8, { width: 250 });
  doc.text("LABOR", 350, tableY + 8, { width: 62, align: "right" });
  doc.text("PARTS", 422, tableY + 8, { width: 62, align: "right" });
  doc.text("TOTAL", 494, tableY + 8, { width: 62, align: "right" });
  let y = tableY + 31;
  if (!services.length && !laborTotal) doc.font("Helvetica").fontSize(8).fillColor(muted).text("No services recorded", 90, y);
  services.forEach((item) => {
    const amount = Number(item.quantity || 0) * Number(item.price || 0);
    doc.font("Helvetica").fontSize(fontSize).fillColor(navy);
    doc.text(String(item.quantity ?? 1), 52, y, { width: 30, align: "center", lineBreak: false });
    doc.text(compactText(item.description, rowHeight < 16 ? 54 : 78), 90, y, { width: 250, lineBreak: false });
    doc.text(currency.format(0), 350, y, { width: 62, align: "right", lineBreak: false });
    doc.text(currency.format(amount), 422, y, { width: 62, align: "right", lineBreak: false });
    doc.text(currency.format(amount), 494, y, { width: 62, align: "right", lineBreak: false });
    doc.moveTo(52, y + rowHeight - 5).lineTo(556, y + rowHeight - 5).lineWidth(0.5).strokeColor("#e7edf3").stroke();
    y += rowHeight;
  });
  if (laborTotal > 0) {
    doc.font("Helvetica-Bold").fontSize(fontSize).fillColor(navy).text("1", 52, y, { width: 30, align: "center" });
    doc.text("Labor / Mobile service", 90, y, { width: 250, lineBreak: false });
    doc.text(currency.format(laborTotal), 350, y, { width: 62, align: "right", lineBreak: false });
    doc.text(currency.format(0), 422, y, { width: 62, align: "right", lineBreak: false });
    doc.text(currency.format(laborTotal), 494, y, { width: 62, align: "right", lineBreak: false });
  }

  doc.font("Helvetica-Bold").fontSize(8).fillColor(navy).text("PAYMENT METHOD", 44, 492);
  paymentOption(doc, "Cash", payment.includes("cash") && !payment.includes("app"), 44, 511);
  paymentOption(doc, "Zelle", payment.includes("zelle"), 112, 511);
  paymentOption(doc, "Credit Card", payment.includes("credit") || payment.includes("card"), 174, 511);
  paymentOption(doc, "Cash App", payment.includes("cash app"), 44, 531);
  paymentOption(doc, "Other", Boolean(payment) && !["cash", "zelle", "credit", "card", "cash app", "pending"].some((item) => payment.includes(item)), 112, 531);
  drawZelleQr(doc, 236, 490, 76);
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#6d28d9").text("ZELLE", 236, 570, { width: 76, align: "center" });
  doc.font("Helvetica").fontSize(5.8).fillColor(muted).text(zelleRecipient, 205, 581, { width: 138, align: "center", lineBreak: false });

  const summaryX = 360;
  const summaryValueX = 494;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(navy).text("SUMMARY", summaryX, 492);
  [["Labor", laborTotal], ["Parts / Services", serviceTotal], ["Shop Supplies", 0], [`Tax (${Number(record.taxRate || 0)}%)`, tax]].forEach(([label, amount], index) => {
    const rowY = 511 + index * 17;
    doc.font("Helvetica").fontSize(8).fillColor(muted).text(label, summaryX, rowY, { width: 120 });
    doc.font("Helvetica").fillColor(navy).text(currency.format(amount), summaryValueX, rowY, { width: 74, align: "right" });
  });
  doc.roundedRect(summaryX, 579, 208, 34, 4).fill(blue);
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff").text("TOTAL", summaryX + 12, 591);
  doc.text(currency.format(total), summaryValueX, 591, { width: 62, align: "right" });

  doc.moveTo(44, 628).lineTo(568, 628).lineWidth(0.7).strokeColor(line).stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(navy).text("WARRANTY", 44, 642);
  doc.font("Helvetica").fontSize(7.5).fillColor(muted).text("Labor Warranty: ______ Days", 44, 658);
  doc.text("Parts Warranty: Manufacturer Warranty Only", 230, 658);

  const signatureY = 700;
  doc.moveTo(44, signatureY).lineTo(258, signatureY).strokeColor("#94a3b8").stroke();
  doc.moveTo(306, signatureY).lineTo(478, signatureY).strokeColor("#94a3b8").stroke();
  doc.moveTo(496, signatureY).lineTo(568, signatureY).strokeColor("#94a3b8").stroke();
  doc.font("Helvetica-Bold").fontSize(7).fillColor(navy).text("CUSTOMER SIGNATURE", 44, signatureY + 7);
  doc.text("TECHNICIAN", 306, signatureY + 7);
  doc.text("DATE", 496, signatureY + 7);

  doc.rect(0, 739, 612, 53).fill(navy);
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff")
    .text("Thank you for choosing Yeros Auto Services!", 44, 752, { width: 524, align: "center" });
  doc.font("Helvetica-Oblique").fontSize(7.5).fillColor("#cbd5e1")
    .text('"Honest, Reliable & Professional Mobile Auto Repair."', 44, 769, { width: 524, align: "center" });
}

function addStandardDocument(doc, record, options) {
  addBusinessHeader(doc, options.title, options.number, options.date);
  const services = Array.isArray(record.services) ? record.services : [];
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#1d4ed8").text("CUSTOMER", 44, 138);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0b1324").text(record.customer?.name || "-", 44, 155);
  doc.font("Helvetica").fontSize(8).fillColor("#64748b").text([record.customer?.phone, record.customer?.email].filter(Boolean).join(" | ") || "-", 44, 174, { width: 240 });
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#1d4ed8").text("VEHICLE", 320, 138);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0b1324").text(`${record.vehicle?.year || ""} ${record.vehicle?.make || ""} ${record.vehicle?.model || ""}`.trim() || "-", 320, 155, { width: 248 });
  doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(`VIN: ${record.vehicle?.vin || "-"}`, 320, 174, { width: 248 });
  const tableY = 215;
  doc.rect(44, tableY, 524, 26).fill("#0b1324");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff").text("DESCRIPTION", 54, tableY + 9, { width: 340 });
  doc.text("QTY", 404, tableY + 9, { width: 45, align: "right" });
  doc.text("AMOUNT", 468, tableY + 9, { width: 90, align: "right" });
  let y = tableY + 34;
  services.forEach((item) => {
    const amount = Number(item.quantity || 0) * Number(item.price || 0);
    doc.font("Helvetica").fontSize(8.5).fillColor("#0b1324").text(compactText(item.description, 90), 54, y, { width: 340, lineBreak: false });
    doc.text(String(item.quantity ?? 1), 404, y, { width: 45, align: "right" });
    doc.text(currency.format(amount), 468, y, { width: 90, align: "right" });
    y += 24;
  });
  if (Number(record.labor || 0) > 0) {
    doc.font("Helvetica-Bold").text("Labor", 54, y, { width: 340 });
    doc.text(currency.format(record.labor), 468, y, { width: 90, align: "right" });
  }
  const subtotal = Number(record.subtotal || 0);
  const total = Number(record.total || subtotal);
  const totalsY = Math.max(480, y + 42);
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Subtotal", 390, totalsY, { width: 90, align: "right" });
  doc.fillColor("#0b1324").text(currency.format(subtotal), 490, totalsY, { width: 68, align: "right" });
  doc.fillColor("#64748b").text(`Tax (${record.taxRate || 0}%)`, 390, totalsY + 20, { width: 90, align: "right" });
  doc.fillColor("#0b1324").text(currency.format(total - subtotal), 490, totalsY + 20, { width: 68, align: "right" });
  doc.roundedRect(385, totalsY + 43, 183, 38, 4).fill("#1d4ed8");
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff").text("TOTAL", 398, totalsY + 56);
  doc.text(currency.format(total), 480, totalsY + 56, { width: 75, align: "right" });
  doc.font("Helvetica").fontSize(7).fillColor("#64748b").text("Estimate valid for 30 days unless otherwise noted.", 44, 735, { width: 524, align: "center" });
}

export function streamDocument(res, record, options) {
  const doc = new PDFDocument({ size: "LETTER", margin: 0, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${options.filename}"`);
  doc.pipe(res);
  if (options.includeInvoiceDetails) addInvoice(doc, record, options);
  else addStandardDocument(doc, record, options);
  doc.end();
}
