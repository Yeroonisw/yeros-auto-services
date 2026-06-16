import { PDFParse } from "pdf-parse";

const dtcPattern = /\b([PCBU][0-9A-F]{4})\b/gi;
const vinPattern = /\b(?=[A-HJ-NPR-Z0-9]{17}\b)(?=.*[0-9])[A-HJ-NPR-Z0-9]{17}\b/i;
const mileagePattern = /\b(?:mileage|odometer(?:\s+reading)?|odometro|odómetro|millaje)\s*[:#-]?\s*([0-9][0-9,.\s]{1,12})\s*(?:mi|miles|km)?\b/i;
const modulePattern = /\b(?:ECM|PCM|TCM|ABS|SRS|BCM|HVAC|IPC|TPMS|ECU|ENGINE|TRANSMISSION|AIRBAG)\b/i;
const modulePriority = new Map([
  ["PCM", 0],
  ["BCM", 1],
]);

function cleanText(value = "") {
  return String(value).replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function parseMileage(text) {
  const match = text.match(mileagePattern);
  if (!match) return 0;
  const value = match[1].replace(/[^\d]/g, "");
  return Number(value) || 0;
}

function lineAround(text, index) {
  const start = Math.max(0, text.lastIndexOf("\n", index - 1) + 1);
  const endIndex = text.indexOf("\n", index);
  const end = endIndex === -1 ? text.length : endIndex;
  return text.slice(start, end).trim();
}

export function sortDtcCodes(codes = []) {
  return [...codes].sort((left, right) => {
    const leftPriority = modulePriority.get(String(left.module || "").toUpperCase()) ?? 50;
    const rightPriority = modulePriority.get(String(right.module || "").toUpperCase()) ?? 50;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return String(left.module || "").localeCompare(String(right.module || "")) || String(left.code || "").localeCompare(String(right.code || ""));
  });
}

function parseDtcCodes(text) {
  const found = new Map();
  for (const match of text.matchAll(dtcPattern)) {
    const code = match[1].toUpperCase();
    const line = lineAround(text, match.index || 0);
    const moduleMatch = line.match(modulePattern);
    const description = line
      .replace(new RegExp(code, "i"), "")
      .replace(modulePattern, "")
      .replace(/[-:|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!found.has(code)) {
      found.set(code, {
        code,
        module: moduleMatch?.[0]?.toUpperCase() || "",
        description,
        status: /history|stored|past/i.test(line) ? "history" : /pending/i.test(line) ? "pending" : "active",
      });
    }
  }
  return sortDtcCodes(Array.from(found.values()));
}

export async function extractScannerReportFromPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = cleanText(result.text);
  await parser.destroy();

  const vin = text.match(vinPattern)?.[0]?.toUpperCase() || "";
  const mileage = parseMileage(text);
  const dtcCodes = parseDtcCodes(text);
  const summaryParts = [];
  if (vin) summaryParts.push(`VIN ${vin}`);
  if (mileage) summaryParts.push(`Mileage ${mileage.toLocaleString()} mi`);
  if (dtcCodes.length) summaryParts.push(`${dtcCodes.length} DTC code${dtcCodes.length === 1 ? "" : "s"} found`);

  return {
    vin,
    mileage,
    dtcCodes,
    rawText: text,
    summary: summaryParts.join(" - "),
  };
}
