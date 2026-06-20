import api from "./api.js";

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function previewReceipt(file) {
  const receiptFileData = await fileToDataUrl(file);
  const { data } = await api.post("/receipt-reader/preview", {
    receiptFileName: file.name,
    receiptFileData,
  });
  return data;
}

export function appendReceiptLines(existingLines, receiptItems, { includeCost = false } = {}) {
  const imported = receiptItems.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity || 1),
    price: Number(item.unitPrice || 0),
    ...(includeCost ? { cost: Number(item.unitPrice || 0) } : {}),
  }));
  const current = Array.isArray(existingLines) ? existingLines : [];
  const hasOnlyBlankLine = current.length === 1 && !String(current[0]?.description || "").trim();
  return hasOnlyBlankLine ? imported : [...current, ...imported];
}
