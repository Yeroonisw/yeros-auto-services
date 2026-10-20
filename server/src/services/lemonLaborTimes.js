const BASE = "https://lemon-manuals.la/";

function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ")
    .replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function textOf(html = "") {
  return decodeHtml(String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

function anchors(html, base) {
  return [...String(html).matchAll(/<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      try { return { label: textOf(match[4]), url: new URL(decodeHtml(match[2]), base).href }; }
      catch { return null; }
    }).filter(Boolean);
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value) {
  return normalize(value).split(/\s+/).filter((token) => token.length > 1 && !["the","and","for","with","replace","replacement","remove","install","change","repair","labor","hours"].includes(token));
}

async function fetchPage(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(18000),
    headers: { "user-agent": "YerosAutoServices/1.0 (labor-time lookup)", accept: "text/html" },
  });
  if (!response.ok) throw new Error(`LEMON Manuals returned HTTP ${response.status}`);
  return response.text();
}

function parseLaborRows(html, service) {
  const terms = tokens(service);
  const results = [];
  const tableMatches = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)];
  for (const tableMatch of tableMatches) {
    const table = tableMatch[0];
    const rowMatches = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
    let standardIndex = -1;
    for (const rowMatch of rowMatches) {
      const cells = [...rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => textOf(cell[1]));
      if (!cells.length) continue;
      if (cells.some((cell) => /standard\s+hours?/i.test(cell))) {
        standardIndex = cells.findIndex((cell) => /standard\s+hours?/i.test(cell));
        continue;
      }
      const hoursText = standardIndex >= 0 ? cells[standardIndex] : cells.find((cell) => /^\d+(?:\.\d+)?$/.test(cell));
      const hours = Number(hoursText);
      if (!Number.isFinite(hours) || hours <= 0 || hours > 100) continue;
      const label = cells[0] || "";
      const contextStart = Math.max(0, tableMatch.index - 2500);
      const context = textOf(html.slice(contextStart, tableMatch.index));
      const searchable = normalize(`${context} ${label} ${cells.join(" ")}`);
      const score = terms.reduce((sum, term) => sum + (searchable.includes(term) ? 1 : 0), 0);
      if (score > 0) results.push({ operation: label, hours, score });
    }
  }
  const unique = new Map();
  for (const item of results) {
    const key = `${normalize(item.operation)}:${item.hours}`;
    if (!unique.has(key) || unique.get(key).score < item.score) unique.set(key, item);
  }
  return [...unique.values()].sort((a, b) => b.score - a.score || a.operation.localeCompare(b.operation)).slice(0, 12);
}

export async function findLaborTimes({ year, make, model, engine, service }) {
  const rootHtml = await fetchPage(BASE);
  const requestedMake = normalize(make);
  const brand = anchors(rootHtml, BASE).find((item) => {
    const listedMake = normalize(item.label);
    return listedMake === requestedMake || listedMake.startsWith(`${requestedMake} `) || requestedMake.startsWith(`${listedMake} `);
  });
  if (!brand) throw new Error(`No encontré la marca ${make} en Lemon Manuals.`);

  const yearUrl = new URL(`${Number(year)}/`, brand.url.endsWith("/") ? brand.url : `${brand.url}/`).href;
  const yearHtml = await fetchPage(yearUrl);
  const modelTerms = tokens(model);
  const engineTerms = tokens(engine || "");
  const variants = anchors(yearHtml, yearUrl).filter((item) => {
    const label = normalize(item.label);
    return modelTerms.length && modelTerms.every((term) => label.includes(term));
  });
  if (!variants.length) throw new Error(`No encontré ${year} ${make} ${model} en Lemon Manuals.`);

  const rankedVariants = variants.map((item) => ({
    ...item,
    score: engineTerms.reduce((sum, term) => sum + (normalize(item.label).includes(term) ? 2 : 0), 0),
  })).sort((a, b) => b.score - a.score || a.label.length - b.label.length);
  const vehiclePage = rankedVariants[0];
  const vehicleHtml = await fetchPage(vehiclePage.url);
  const laborLink = anchors(vehicleHtml, vehiclePage.url).find((item) => normalize(item.label) === "labor times");
  if (!laborLink) throw new Error("Este manual no publica una sección Labor Times para la versión encontrada.");

  let laborUrl = laborLink.url;
  let laborHtml = await fetchPage(laborUrl);
  if (/labor times are only available for a different vehicle variant/i.test(textOf(laborHtml))) {
    const alternative = anchors(laborHtml, laborUrl).find((item) => /other variant|view labor times/i.test(item.label));
    if (alternative) {
      laborUrl = alternative.url;
      laborHtml = await fetchPage(laborUrl);
    }
  }

  const matches = parseLaborRows(laborHtml, service);
  return {
    vehicle: vehiclePage.label,
    manualUrl: laborUrl,
    matches,
    message: matches.length ? "" : "No encontré una coincidencia clara en las horas publicadas para este manual.",
  };
}
