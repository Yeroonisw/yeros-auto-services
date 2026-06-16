import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.resolve(currentDirectory, "../assets/yeros-auto-logo.png");

function field(doc, label, value, x, y) {
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#6b7280").text(label.toUpperCase(), x, y);
  doc.font("Helvetica").fontSize(10).fillColor("#111827").text(value || "-", x, y + 12, { width: 220 });
}

function addHeader(doc, title, number, date) {
  doc.rect(0, 0, 612, 118).fill("#111827");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 44, 25, { fit: [285, 64], align: "left", valign: "center" });
  } else {
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("YEROS AUTO SERVICES LLC", 44, 36);
  }
  doc.font("Helvetica").fontSize(8).fillColor("#cbd5e1").text("Mobile automotive service · (239) 460-4992", 44, 94);
  doc.font("Helvetica-Bold").fontSize(20).fillColor("#ffffff").text(title, 400, 34, { width: 168, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor("#cbd5e1").text(number, 400, 62, { width: 168, align: "right" });
  doc.text(new Date(date).toLocaleDateString("en-US"), 400, 80, { width: 168, align: "right" });
}

function addLines(doc, record) {
  let y = 270;
  doc.rect(44, y, 524, 26).fill("#e5e7eb");
  doc.fillColor("#374151").font("Helvetica-Bold").fontSize(9);
  doc.text("DESCRIPTION", 54, y + 9, { width: 310 });
  doc.text("QTY", 370, y + 9, { width: 45, align: "right" });
  doc.text("PRICE", 425, y + 9, { width: 60, align: "right" });
  doc.text("AMOUNT", 495, y + 9, { width: 63, align: "right" });
  y += 32;

  for (const item of record.services || []) {
    if (y > 680) {
      doc.addPage();
      y = 55;
    }
    const amount = item.quantity * item.price;
    doc.fillColor("#111827").font("Helvetica").fontSize(9);
    doc.text(item.description, 54, y, { width: 310 });
    doc.text(String(item.quantity), 370, y, { width: 45, align: "right" });
    doc.text(currency.format(item.price), 425, y, { width: 60, align: "right" });
    doc.text(currency.format(amount), 495, y, { width: 63, align: "right" });
    y += Math.max(22, doc.heightOfString(item.description, { width: 310 }) + 9);
    doc.moveTo(54, y - 5).lineTo(558, y - 5).strokeColor("#e5e7eb").stroke();
  }

  if (record.labor > 0) {
    doc.text("Labor", 54, y, { width: 310 });
    doc.text(currency.format(record.labor), 495, y, { width: 63, align: "right" });
    y += 24;
  }

  const totalsY = Math.max(y + 10, 480);
  doc.font("Helvetica").fontSize(10).fillColor("#4b5563");
  doc.text("Subtotal", 390, totalsY, { width: 95, align: "right" });
  doc.text(currency.format(record.subtotal), 495, totalsY, { width: 63, align: "right" });
  doc.text(`Tax (${record.taxRate || 0}%)`, 390, totalsY + 22, { width: 95, align: "right" });
  doc.text(currency.format(record.total - record.subtotal), 495, totalsY + 22, { width: 63, align: "right" });
  doc.rect(385, totalsY + 49, 183, 38).fill("#d62828");
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#ffffff").text("TOTAL", 400, totalsY + 62);
  doc.text(currency.format(record.total), 480, totalsY + 62, { width: 75, align: "right" });
  return totalsY + 105;
}

function addInvoiceDetails(doc, record, y) {
  if (y > 620) {
    doc.addPage();
    y = 70;
  }

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("PAYMENT METHOD", 44, y);
  doc.font("Helvetica").fontSize(10).fillColor("#4b5563").text(record.paymentMethod || "Pending", 44, y + 17);

  const signatureY = y + 82;
  doc.moveTo(44, signatureY).lineTo(268, signatureY).strokeColor("#9ca3af").stroke();
  doc.moveTo(344, signatureY).lineTo(568, signatureY).strokeColor("#9ca3af").stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#374151").text("CUSTOMER SIGNATURE", 44, signatureY + 8, { width: 224 });
  doc.text("AUTHORIZED SIGNATURE · YEROS AUTO SERVICES LLC", 344, signatureY + 8, { width: 224 });
  doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text("Date: ____________________", 44, signatureY + 25);
  doc.text("Date: ____________________", 344, signatureY + 25);
}

function compactText(value, limit) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function addCompactInvoice(doc, record, options) {
  addHeader(doc, options.title, options.number, options.date);

  field(doc, "Bill to", record.customer?.name, 44, 126);
  field(doc, "Phone / Email", [record.customer?.phone, record.customer?.email].filter(Boolean).join(" · "), 44, 158);
  field(doc, "Vehicle", `${record.vehicle?.year || ""} ${record.vehicle?.make || ""} ${record.vehicle?.model || ""}`.trim(), 320, 126);
  field(doc, "License / VIN", `${record.vehicle?.plate || "-"} / ${record.vehicle?.vin || "-"}`, 320, 158);

  const services = Array.isArray(record.services) ? record.services : [];
  const tableY = 205;
  const tableBottom = 440;
  const rowHeight = Math.max(10, Math.min(19, Math.floor((tableBottom - tableY - 28) / Math.max(services.length + (record.labor > 0 ? 1 : 0), 1))));
  const rowFontSize = rowHeight < 14 ? 6.5 : rowHeight < 17 ? 7.5 : 8.5;

  doc.rect(44, tableY, 524, 24).fill("#e5e7eb");
  doc.fillColor("#374151").font("Helvetica-Bold").fontSize(8);
  doc.text("DESCRIPTION", 52, tableY + 8, { width: 312 });
  doc.text("QTY", 370, tableY + 8, { width: 45, align: "right" });
  doc.text("PRICE", 425, tableY + 8, { width: 60, align: "right" });
  doc.text("AMOUNT", 495, tableY + 8, { width: 63, align: "right" });

  let y = tableY + 29;
  for (const item of services) {
    const amount = Number(item.quantity || 0) * Number(item.price || 0);
    doc.fillColor("#111827").font("Helvetica").fontSize(rowFontSize);
    doc.text(compactText(item.description, rowHeight < 14 ? 58 : 78), 52, y, { width: 312, lineBreak: false });
    doc.text(String(item.quantity ?? 0), 370, y, { width: 45, align: "right", lineBreak: false });
    doc.text(currency.format(Number(item.price || 0)), 425, y, { width: 60, align: "right", lineBreak: false });
    doc.text(currency.format(amount), 495, y, { width: 63, align: "right", lineBreak: false });
    y += rowHeight;
  }
  if (record.labor > 0) {
    doc.font("Helvetica-Bold").fontSize(rowFontSize).text("Labor", 52, y, { width: 312 });
    doc.text(currency.format(record.labor), 495, y, { width: 63, align: "right" });
  }

  const totalsY = 452;
  doc.font("Helvetica").fontSize(9).fillColor("#4b5563");
  doc.text("Subtotal", 390, totalsY, { width: 95, align: "right" });
  doc.text(currency.format(record.subtotal), 495, totalsY, { width: 63, align: "right" });
  doc.text(`Tax (${record.taxRate || 0}%)`, 390, totalsY + 18, { width: 95, align: "right" });
  doc.text(currency.format(record.total - record.subtotal), 495, totalsY + 18, { width: 63, align: "right" });
  doc.rect(385, totalsY + 38, 183, 32).fill("#d62828");
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff").text("TOTAL", 398, totalsY + 49);
  doc.text(currency.format(record.total), 480, totalsY + 49, { width: 75, align: "right" });

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827").text("STATUS", 44, 452);
  doc.font("Helvetica").fontSize(9).fillColor("#4b5563").text(options.status, 44, 466);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827").text("PAYMENT METHOD", 170, 452);
  doc.font("Helvetica").fontSize(9).fillColor("#4b5563").text(record.paymentMethod || "Pending", 170, 466, { width: 175 });

  const detailsY = 540;
  if (record.dtcCodes?.length) {
    const codes = record.dtcCodes.map((dtc) => `${dtc.code}: ${dtc.description || dtc.status}`).join(" · ");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827").text("DTC CODES", 44, detailsY);
    doc.font("Helvetica").fontSize(7.5).fillColor("#4b5563").text(compactText(codes, 210), 44, detailsY + 14, { width: 524, height: 30 });
  }
  if (record.notes) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827").text("NOTES", 44, detailsY + 47);
    doc.font("Helvetica").fontSize(7.5).fillColor("#4b5563").text(compactText(record.notes, 260), 44, detailsY + 61, { width: 524, height: 34 });
  }

  const signatureY = 674;
  doc.moveTo(44, signatureY).lineTo(268, signatureY).strokeColor("#9ca3af").stroke();
  doc.moveTo(344, signatureY).lineTo(568, signatureY).strokeColor("#9ca3af").stroke();
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#374151").text("CUSTOMER SIGNATURE", 44, signatureY + 7, { width: 224 });
  doc.text("AUTHORIZED SIGNATURE · YEROS AUTO SERVICES LLC", 344, signatureY + 7, { width: 224 });
  doc.font("Helvetica").fontSize(7.5).fillColor("#6b7280").text("Date: ____________________", 44, signatureY + 22);
  doc.text("Date: ____________________", 344, signatureY + 22);
}

export function streamDocument(res, record, options) {
  const doc = new PDFDocument({ size: "LETTER", margin: 44, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${options.filename}"`);
  doc.pipe(res);

  if (options.includeInvoiceDetails) {
    addCompactInvoice(doc, record, options);
    doc.font("Helvetica").fontSize(7).fillColor("#6b7280").text(
      "Invoice total includes parts, labor and applicable taxes. It represents the customer charge, not business profit.",
      44,
      730,
      { width: 524, align: "center", lineBreak: false },
    );
    doc.end();
    return;
  }

  addHeader(doc, options.title, options.number, options.date);
  field(doc, "Bill to", record.customer?.name, 44, 145);
  field(doc, "Phone", record.customer?.phone, 44, 181);
  field(doc, "Email", record.customer?.email, 44, 217);
  field(doc, "Vehicle", `${record.vehicle?.year || ""} ${record.vehicle?.make || ""} ${record.vehicle?.model || ""}`.trim(), 320, 145);
  field(doc, "License / VIN", `${record.vehicle?.plate || "-"} / ${record.vehicle?.vin || "-"}`, 320, 181);
  field(doc, "Status", options.status, 320, 217);

  let footerY = addLines(doc, record);
  if (record.dtcCodes?.length) {
    if (footerY > 675) {
      doc.addPage();
      footerY = 55;
    }
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Diagnostic trouble codes", 44, footerY);
    footerY += 20;
    for (const dtc of record.dtcCodes) {
      doc.font("Helvetica-Bold").fontSize(9).text(dtc.code, 44, footerY, { width: 55 });
      doc.font("Helvetica").text(`${dtc.description || "No description"} (${dtc.status})`, 105, footerY, { width: 450 });
      footerY += 18;
    }
  }
  if (record.notes) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Notes", 44, footerY + 12);
    const notesY = footerY + 29;
    doc.font("Helvetica").fontSize(9).fillColor("#4b5563").text(record.notes, 44, notesY, { width: 500 });
    footerY = notesY + doc.heightOfString(record.notes, { width: 500 }) + 18;
  }
  const pages = doc.bufferedPageRange();
  for (let index = pages.start; index < pages.start + pages.count; index += 1) {
    doc.switchToPage(index);
    doc.font("Helvetica").fontSize(7).fillColor("#6b7280").text(
      "Invoice total includes parts, labor and applicable taxes. It represents the customer charge, not business profit.",
      44,
      752,
      { width: 524, align: "center" },
    );
  }
  doc.end();
}
