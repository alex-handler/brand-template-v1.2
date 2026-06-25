import fs from "node:fs";
import path from "node:path";
const site = JSON.parse(fs.readFileSync(new URL("../data/site.json", import.meta.url), "utf8"));

const root = process.cwd();
const dist = path.join(root, "dist");

const pages = [
  { path: "/", file: "index.html", commercial: true, minWords: 650, minH2: 4 },
  { path: "/bonus/", file: "bonus/index.html", commercial: true, minWords: 320, minH2: 3 },
  { path: "/app/", file: "app/index.html", commercial: true, minWords: 320, minH2: 3 },
  { path: "/zahlungen/", file: "zahlungen/index.html", commercial: true, minWords: 320, minH2: 3 },
  { path: "/registrierung/", file: "registrierung/index.html", commercial: true, minWords: 320, minH2: 3 },
  { path: "/verantwortungsvolles-spielen/", file: "verantwortungsvolles-spielen/index.html", commercial: false, minWords: 120, minH2: 2 },
  { path: "/ueber-uns/", file: "ueber-uns/index.html", commercial: false, minWords: 120, minH2: 2 },
  { path: "/datenschutz/", file: "datenschutz/index.html", commercial: false, minWords: 80, minH2: 2 },
  { path: "/cookies/", file: "cookies/index.html", commercial: false, minWords: 60, minH2: 2 }
];

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function count(regex, html) {
  return (html.match(regex) || []).length;
}

function extractTitle(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
}

function extractDescription(html) {
  return html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]?.trim() || "";
}

function schemaTypes(html) {
  const scripts = [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const types = new Set();
  for (const script of scripts) {
    const parsed = JSON.parse(script[1]);
    const nodes = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    for (const node of nodes) {
      const type = node?.["@type"];
      if (Array.isArray(type)) type.forEach((item) => types.add(item));
      else if (type) types.add(type);
    }
  }
  return [...types];
}

const descriptions = new Map();
const results = [];

for (const page of pages) {
  const filePath = path.join(dist, page.file);
  const html = fs.readFileSync(filePath, "utf8");
  const text = stripTags(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  const title = extractTitle(html);
  const description = extractDescription(html);
  const normalizedText = normalize(text);
  const normalizedTitle = normalize(title);
  const failures = [];

  if (count(/<h1\b/gi, html) !== 1) failures.push("expected exactly one H1");
  if (count(/<h2\b/gi, html) < page.minH2) failures.push(`too few H2 headings`);
  if (words < page.minWords) failures.push(`words ${words} < ${page.minWords}`);
  if (!html.includes(`<link rel="canonical" href="${new URL(page.path, site.siteUrl).toString()}"`)) {
    failures.push("canonical mismatch");
  }
  if (!normalizedText.includes(normalize(site.independentDisclosure))) failures.push("missing independent disclosure");
  if (!normalizedText.includes("glucksspiel kann riskant sein")) failures.push("missing risk note");
  if (page.commercial && !normalizedTitle.startsWith(normalize(site.mainKey))) failures.push("commercial title does not start with main key");
  if (page.commercial && count(/<table\b/gi, html) + count(/<(ul|ol)\b/gi, html) < 1) {
    failures.push("commercial page lacks table/list structure");
  }
  if (/garantierte?\s+(gewinn|auszahlung|bonus)/i.test(text)) failures.push("guaranteed win/payout/bonus wording");
  if (/offizielle\s+(revolut|casino|zahlungs|regulator)/i.test(text) && !/keine\s+offizielle/i.test(text)) {
    failures.push("possible official-claim wording");
  }
  for (const requiredType of ["WebSite", "WebPage", "Article", "BreadcrumbList"]) {
    if (!schemaTypes(html).includes(requiredType)) failures.push(`missing ${requiredType} schema`);
  }
  if (descriptions.has(description)) failures.push(`duplicate meta description with ${descriptions.get(description)}`);
  descriptions.set(description, page.path);

  results.push({
    path: page.path,
    words,
    title,
    h1: count(/<h1\b/gi, html),
    h2: count(/<h2\b/gi, html),
    tables: count(/<table\b/gi, html),
    lists: count(/<(ul|ol)\b/gi, html),
    failures
  });
}

const llms = fs.readFileSync(path.join(dist, "llms.txt"), "utf8");
const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const globalFailures = [];
if (!llms.includes("independent") && !llms.includes("unabhangig")) globalFailures.push("llms.txt missing independence posture");
if (!robots.includes("llms.txt")) globalFailures.push("robots.txt missing llms reference");
if (!sitemap.includes("/bonus/")) globalFailures.push("sitemap missing commercial pages");

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "brand-audit.json"), JSON.stringify({ generatedAt: new Date().toISOString(), results, globalFailures }, null, 2));

const lines = [
  "# Brand Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "| Path | Words | H1 | H2 | Tables | Lists | Status |",
  "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
  ...results.map((item) => `| ${item.path} | ${item.words} | ${item.h1} | ${item.h2} | ${item.tables} | ${item.lists} | ${item.failures.length ? `FAIL: ${item.failures.join("; ")}` : "PASS"} |`),
  "",
  "## Global",
  "",
  ...(globalFailures.length ? globalFailures.map((item) => `- FAIL: ${item}`) : ["- PASS"])
];
fs.writeFileSync(path.join(root, "reports", "brand-audit.md"), `${lines.join("\n")}\n`);

const failed = results.filter((item) => item.failures.length);
if (failed.length || globalFailures.length) {
  console.error(`Brand audit failed for ${failed.length} page(s), ${globalFailures.length} global issue(s).`);
  for (const item of failed) console.error(`${item.path}: ${item.failures.join("; ")}`);
  for (const item of globalFailures) console.error(`global: ${item}`);
  process.exit(1);
}

console.log("Brand audit passed.");
