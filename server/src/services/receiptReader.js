import OpenAI from "openai";
import { PDFParse } from "pdf-parse";

const supportedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const moneyPattern = /\$?\s*([0-9]{1,4}(?:[, ][0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})\b/;
const skipLinePattern = /\b(subtotal|total|tax|shipping|savings|checkout|paypal|promo|reward|questions|recommended|viewed|top sellers|delivery|pickup|remove|save for later|apply)\b/i;

function decodeUpload({ receiptFileData, receiptFileName } = {}) {
  const match = String(receiptFileData || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    const error = new Error("Upload a PDF or image receipt");
    error.status = 400;
    throw error;
  }
  const contentType = match[1].toLowerCase();
  if (!supportedTypes.has(contentType)) {
    const error = new Error("Receipt must be a PDF, PNG, JPG or WebP file");
    error.status = 400;
    throw error;
  }
  const data = Buffer.from(match[2], "base64");
  if (data.length > 8 * 1024 * 1024) {
    const error = new Error("Receipt file must be 8 MB or smaller");
    error.status = 400;
    throw error;
  }
  return {
    fileName: receiptFileName || "receipt",
    contentType,
    data,
    dataUrl: `data:${contentType};base64,${data.toString("base64")}`,
  };
}

function cleanDescription(value = "") {
  return String(value)
    .replace(/\bpart\s*#?\s*[A-Z0-9-]+\b/gi, "")
    .replace(/\b(?:qty|quantity)\s*[:x-]?\s*[0-9]+(?:\.[0-9]+)?\b/gi, "")
    .replace(/\bdeal applied\b/gi, "")
    .replace(/\s*\$?\s*[0-9,]+\.[0-9]{2}\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseQuantity(line = "") {
  const qtyMatch = line.match(/\b(?:qty|quantity)\s*[:x-]?\s*([0-9]+(?:\.[0-9]+)?)\b/i) || line.match(/\b([0-9]+)\s*x\s*\$?[0-9]+\.[0-9]{2}\b/i);
  return Number(qtyMatch?.[1] || 1) || 1;
}

function normalizeItem(item = {}) {
  const description = cleanDescription(item.description || item.name || "");
  const quantity = Math.max(Number(item.quantity || 1) || 1, 0);
  const unitPrice = Math.max(Number(item.unitPrice ?? item.price ?? 0) || 0, 0);
  const lineTotal = Math.max(Number(item.lineTotal ?? unitPrice * quantity) || 0, 0);
  if (!description || (!unitPrice && !lineTotal)) return null;
  return {
    description,
    quantity,
    unitPrice: unitPrice || (quantity ? lineTotal / quantity : lineTotal),
    lineTotal: lineTotal || unitPrice * quantity,
  };
}

export function parseReceiptText(rawText = "") {
  const lines = String(rawText).replace(/\r/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
  const items = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (skipLinePattern.test(line)) continue;
    const priceMatch = line.match(moneyPattern);
    if (!priceMatch) continue;
    const price = Number(priceMatch[1].replace(/[,\s]/g, ""));
    if (!Number.isFinite(price) || price <= 0) continue;

    let description = cleanDescription(line.slice(0, priceMatch.index));
    if (description.length < 4 && index > 0 && !skipLinePattern.test(lines[index - 1])) {
      description = cleanDescription(lines[index - 1]);
    }
    const quantity = parseQuantity(line);
    const item = normalizeItem({
      description,
      quantity,
      unitPrice: quantity > 1 ? price / quantity : price,
      lineTotal: price,
    });
    if (item) items.push(item);
  }

  const unique = new Map();
  for (const item of items) {
    const key = `${item.description.toLowerCase()}|${item.unitPrice}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  const parsedItems = Array.from(unique.values());
  return {
    vendor: /autozone/i.test(rawText) ? "AutoZone" : "",
    items: parsedItems,
    subtotal: parsedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    rawText: String(rawText).trim(),
  };
}

async function extractPdfReceipt(upload) {
  const parser = new PDFParse({ data: upload.data });
  const result = await parser.getText();
  await parser.destroy();
  return parseReceiptText(result.text);
}

function parseJsonFromModel(text = "") {
  const cleaned = String(text).trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    vendor: parsed.vendor || "",
    receiptDate: parsed.receiptDate || "",
    subtotal: Number(parsed.subtotal || 0) || 0,
    total: Number(parsed.total || 0) || 0,
    items: (Array.isArray(parsed.items) ? parsed.items : []).map(normalizeItem).filter(Boolean),
    rawText: parsed.rawText || "",
  };
}

async function extractImageReceipt(upload) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Image receipt reading needs OPENAI_API_KEY in server/.env. PDFs with selectable text can still be read without it.");
    error.status = 503;
    throw error;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_RECEIPT_MODEL || process.env.OPENAI_MODEL || "gpt-5.5",
    reasoning: { effort: "low" },
    text: { verbosity: "low" },
    instructions: [
      "Read the automotive parts receipt or cart screenshot.",
      "Return only JSON with vendor, receiptDate, subtotal, total, rawText and items.",
      "Each item must include description, quantity, unitPrice and lineTotal.",
      "Ignore ads, recommendations, savings, totals, delivery choices and checkout buttons.",
      "If a price is unclear, omit that item instead of guessing.",
    ].join(" "),
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: "Extract the purchased receipt/cart line items from this image." },
        { type: "input_image", image_url: upload.dataUrl },
      ],
    }],
  });

  return parseJsonFromModel(response.output_text);
}

export async function extractReceipt(payload) {
  const upload = decodeUpload(payload);
  const extracted = upload.contentType === "application/pdf"
    ? await extractPdfReceipt(upload)
    : await extractImageReceipt(upload);
  return {
    ...extracted,
    sourceFileName: upload.fileName,
    contentType: upload.contentType,
  };
}
