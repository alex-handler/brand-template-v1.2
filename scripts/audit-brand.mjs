import fs from "node:fs";
import path from "node:path";

const site = JSON.parse(fs.readFileSync(new URL("../data/site.json", import.meta.url), "utf8"));
const slots = JSON.parse(fs.readFileSync(new URL("../data/drueckglueck-slots.json", import.meta.url), "utf8"));

const root = process.cwd();
const dist = path.join(root, "dist");

const pages = [
  { path: "/", file: "index.html", commercial: true, minWords: 620, minH2: 4, minSlotImgs: 42 },
  { path: "/app/", file: "app/index.html", commercial: true, minWords: 300, minH2: 2, allowsMobileAppSchema: true, minSlotImgs: 18 },
  { path: "/bonus/", file: "bonus/index.html", commercial: true, minWords: 330, minH2: 3, minSlotImgs: 24 },
  { path: "/registrierung/", file: "registrierung/index.html", commercial: true, minWords: 380, minH2: 4, minSlotImgs: 18 },
  { path: "/zahlungen/", file: "zahlungen/index.html", commercial: true, minWords: 360, minH2: 3, minSlotImgs: 18 },
  { path: "/sportwetten/", file: "sportwetten/index.html", commercial: true, minWords: 330, minH2: 3, minSlotImgs: 15 },
  { path: "/verantwortungsvolles-spielen/", file: "verantwortungsvolles-spielen/index.html", commercial: false, minWords: 230, minH2: 3 },
  { path: "/datenschutz/", file: "datenschutz/index.html", commercial: false, minWords: 190, minH2: 3 },
  { path: "/cookies/", file: "cookies/index.html", commercial: false, minWords: 180, minH2: 3 }
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

function jpegSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buffer.readUInt16BE(offset);
    const segment = offset + 2;
    if (sof.has(marker)) {
      return {
        height: buffer.readUInt16BE(segment + 1),
        width: buffer.readUInt16BE(segment + 3)
      };
    }
    offset += length;
  }
  return null;
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
  const types = schemaTypes(html);
  const failures = [];

  if (count(/<h1\b/gi, html) !== 1) failures.push("expected exactly one H1");
  if (count(/<h2\b/gi, html) < page.minH2) failures.push(`too few H2 headings`);
  if (words < page.minWords) failures.push(`words ${words} < ${page.minWords}`);
  if (!html.includes(`<link rel="canonical" href="${new URL(page.path, site.siteUrl).toString()}"`)) failures.push("canonical mismatch");
  if (!normalizedText.includes(normalize(site.independentDisclosure))) failures.push("missing independent disclosure");
  if (!normalizedText.includes("glucksspiel kann riskant sein")) failures.push("missing risk note");
  if (!html.includes('href="/"')) failures.push("missing internal homepage link");
  if (page.commercial && !normalizedTitle.startsWith(normalize(site.mainKey))) failures.push("commercial title does not start with main key");
  if (page.commercial && !normalizedText.includes(normalize(site.secondaryKey))) failures.push("missing secondary key");
  if (page.commercial && count(/<table\b/gi, html) + count(/<(ul|ol)\b/gi, html) < 2) failures.push("commercial page lacks table/list structure");
  if (page.minSlotImgs && count(/<amp-img[^>]+\/assets\/slots\//gi, html) < page.minSlotImgs) failures.push("too few local slot images");
  if (/garantierte?\s+(gewinn|auszahlung|bonus)/i.test(text)) failures.push("guaranteed win/payout/bonus wording");
  if (/offizielle\s+(revolut|casino|zahlungs|regulator)/i.test(text) && !/keine\s+offizielle/i.test(text)) failures.push("possible official-claim wording");
  for (const requiredType of ["WebSite", "Organization", "WebPage", "BreadcrumbList"]) {
    if (!types.includes(requiredType)) failures.push(`missing ${requiredType} schema`);
  }
  if (!types.includes("Article") && !types.includes("MobileApplication")) failures.push("missing Article/MobileApplication schema");
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
    slotImages: count(/<amp-img[^>]+\/assets\/slots\//gi, html),
    schemaTypes: types,
    failures
  });
}

const llms = fs.readFileSync(path.join(dist, "llms.txt"), "utf8");
const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const globalFailures = [];

if (!llms.includes("independent") && !normalize(llms).includes("unabhangig")) globalFailures.push("llms.txt missing independence posture");
if (!robots.includes("llms.txt")) globalFailures.push("robots.txt missing llms reference");
for (const pagePath of site.pages) {
  if (!sitemap.includes(new URL(pagePath, site.siteUrl).toString())) globalFailures.push(`sitemap missing ${pagePath}`);
}
if (sitemap.includes("/ueber-uns/")) globalFailures.push("sitemap contains removed ueber-uns page");
if (slots.length < 42) globalFailures.push(`slot database too small: ${slots.length}`);

const slotDir = path.join(root, "public", "assets", "slots");
const slotFiles = fs.readdirSync(slotDir).filter((name) => name.endsWith(".jpg"));
if (slotFiles.length !== slots.length) globalFailures.push(`slot file count ${slotFiles.length} != data count ${slots.length}`);
for (const file of slotFiles) {
  const size = jpegSize(path.join(slotDir, file));
  if (!size || size.width !== 200 || size.height !== 200) globalFailures.push(`slot image not 200x200: ${file}`);
}

for (const assetDir of ["payments", "providers", "footer"]) {
  const dirPath = path.join(root, "public", "assets", assetDir);
  if (fs.existsSync(dirPath)) {
    const badFiles = fs.readdirSync(dirPath).filter((name) => /\.(html?|txt)$/i.test(name));
    if (badFiles.length) globalFailures.push(`${assetDir} contains downloaded login/html placeholders`);
  }
}

const distText = stripTags(fs.readFileSync(path.join(dist, "index.html"), "utf8"));
if (/mostbet/i.test(distText)) globalFailures.push("Mostbet footprint found");
if (!fs.readFileSync(path.join(dist, "index.html"), "utf8").includes("overflow-x:hidden")) globalFailures.push("layout missing overflow-x guard");

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "brand-audit.json"), JSON.stringify({ generatedAt: new Date().toISOString(), slotCount: slots.length, results, globalFailures }, null, 2));

const lines = [
  "# Brand Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Slots: ${slots.length}`,
  "",
  "| Path | Words | H1 | H2 | Tables | Lists | Slots | Status |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ...results.map((item) => `| ${item.path} | ${item.words} | ${item.h1} | ${item.h2} | ${item.tables} | ${item.lists} | ${item.slotImages} | ${item.failures.length ? `FAIL: ${item.failures.join("; ")}` : "PASS"} |`),
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
