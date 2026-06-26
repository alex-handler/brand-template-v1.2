import fs from "node:fs";
import path from "node:path";

const site = JSON.parse(fs.readFileSync(new URL("../data/site.json", import.meta.url), "utf8"));
const slots = JSON.parse(fs.readFileSync(new URL("../data/drueckglueck-slots.json", import.meta.url), "utf8"));

const root = process.cwd();
const dist = path.join(root, "dist");

const pages = [
  { path: "/", file: "index.html", commercial: true, minChars: 10000, minWords: 1100, minH2: 8, minH3: 8, minTables: 4, minLists: 2, minReverseBlocks: 5, minGameSections: 4, minSlotImgs: 66, minPaymentImgs: 7 },
  { path: "/app/", file: "app/index.html", commercial: true, minChars: 10000, minWords: 850, minH2: 6, minH3: 7, minTables: 3, minLists: 3, minReverseBlocks: 4, minGameSections: 2, minSlotImgs: 12 },
  { path: "/bonus/", file: "bonus/index.html", commercial: true, minChars: 10000, minWords: 850, minH2: 6, minH3: 6, minTables: 4, minLists: 3, minReverseBlocks: 4, minGameSections: 3, minSlotImgs: 18, minPaymentImgs: 7 },
  { path: "/registrierung/", file: "registrierung/index.html", commercial: true, minChars: 10000, minWords: 850, minH2: 6, minH3: 7, minTables: 3, minLists: 3, minReverseBlocks: 4, minGameSections: 2, minSlotImgs: 12 },
  { path: "/zahlungen/", file: "zahlungen/index.html", commercial: true, minChars: 10000, minWords: 850, minH2: 6, minH3: 7, minTables: 4, minLists: 3, minReverseBlocks: 4, minGameSections: 2, minSlotImgs: 12, minPaymentImgs: 7 },
  { path: "/sportwetten/", file: "sportwetten/index.html", commercial: true, minChars: 10000, minWords: 820, minH2: 6, minH3: 7, minTables: 3, minLists: 3, minReverseBlocks: 4, minGameSections: 2, minSlotImgs: 12 },
  { path: "/verantwortungsvolles-spielen/", file: "verantwortungsvolles-spielen/index.html", commercial: false, minChars: 10000, minWords: 520, minH2: 5, minH3: 4, minTables: 2, minLists: 2, minReverseBlocks: 5, minGameSections: 0 },
  { path: "/datenschutz/", file: "datenschutz/index.html", commercial: false, minChars: 10000, minWords: 520, minH2: 5, minH3: 4, minTables: 2, minLists: 2, minReverseBlocks: 5, minGameSections: 0 },
  { path: "/cookies/", file: "cookies/index.html", commercial: false, minChars: 10000, minWords: 520, minH2: 5, minH3: 4, minTables: 2, minLists: 2, minReverseBlocks: 5, minGameSections: 0 }
];

const forbiddenVisibleTerms = [
  "Bonus Intent",
  "Payment Intent",
  "Payment Link",
  "Account Intent",
  "Mobile Intent",
  "Betting Intent",
  "Brand Hub",
  "No Deposit",
  "No-Deposit",
  "Redirect placeholder",
  "Platzhalter",
  "Textkachel",
  "section-label",
  "lokale Icons",
  "lokale Slot-Icons",
  "Icons extrahiert",
  "Info-Seite DE",
  "Bonus-Keywords",
  "Main Key",
  "2. Key",
  "areaServed",
  "incentiveAmount",
  "incentiveType",
  "incentivizedItem",
  "applicationCategory",
  "operatingSystem",
  "downloadUrl",
  "countriesSupported",
  "Mobile-App-Entity",
  "Schema-Nutzung",
  "Payment-Asset-Gate",
  "Ratgeber-Entity",
  "BreadcrumbList"
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

function headingLevels(html) {
  return [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
}

function headingTexts(html, selector = "h[23]") {
  return [...html.matchAll(new RegExp(`<${selector}\\b[^>]*>([\\s\\S]*?)<\\/${selector}>`, "gi"))]
    .map((match) => stripTags(match[1]));
}

function longestKeyedHeadingRun(headings) {
  let longest = 0;
  let current = 0;
  for (const heading of headings) {
    if (/Revolut Slots|Revolut casino/i.test(heading)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function hasSkippedHeadingLevel(levels) {
  let previous = 0;
  for (const level of levels) {
    if (previous && level > previous + 1) return true;
    previous = level;
  }
  return false;
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

function normalizeGeo(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return "GLOBAL";
  if (raw.includes("-")) return raw.split("-").pop();
  return raw === "UK" ? "GB" : raw;
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
  const chars = text.length;
  const title = extractTitle(html);
  const description = extractDescription(html);
  const normalizedText = normalize(text);
  const normalizedTitle = normalize(title);
  const headingText = headingTexts(html);
  const keyedHeadings = headingText.filter((item) => /Revolut Slots|Revolut casino/i.test(item)).length;
  const minKeyedHeadings = Math.max(3, Math.floor(headingText.length * 0.28));
  const maxKeyedHeadings = Math.ceil(headingText.length * 0.7);
  const types = schemaTypes(html);
  const failures = [];

  if (count(/<h1\b/gi, html) !== 1) failures.push("expected exactly one H1");
  if (count(/<h2\b/gi, html) < page.minH2) failures.push(`too few H2 headings`);
  if (count(/<h3\b/gi, html) < page.minH3) failures.push(`too few H3 headings`);
  if (chars < page.minChars) failures.push(`chars ${chars} < ${page.minChars}`);
  if (words < page.minWords) failures.push(`words ${words} < ${page.minWords}`);
  if (count(/<table\b/gi, html) < page.minTables) failures.push(`tables ${count(/<table\b/gi, html)} < ${page.minTables}`);
  if (count(/<(ul|ol)\b/gi, html) < page.minLists) failures.push(`lists ${count(/<(ul|ol)\b/gi, html)} < ${page.minLists}`);
  if (count(/class="[^"]*\breverse-block\b/gi, html) < page.minReverseBlocks) failures.push("too few reverse content blocks");
  if (count(/class="[^"]*\bgame-section\b/gi, html) < page.minGameSections) failures.push("too few game/category sections");
  if (hasSkippedHeadingLevel(headingLevels(html))) failures.push("heading level skipped");
  if (!html.includes(`<link rel="canonical" href="${new URL(page.path, site.siteUrl).toString()}"`)) failures.push("canonical mismatch");
  if (!normalizedText.includes(normalize(site.independentDisclosure))) failures.push("missing independent disclosure");
  if (!normalizedText.includes("glucksspiel kann riskant sein")) failures.push("missing risk note");
  if (!html.includes('href="/"')) failures.push("missing internal homepage link");
  if (page.commercial && !normalizedTitle.startsWith(normalize(site.mainKey))) failures.push("commercial title does not start with main key");
  if (page.commercial && !normalizedText.includes(normalize(site.secondaryKey))) failures.push("missing secondary key");
  if (page.commercial && !html.includes("Suchfokus")) failures.push("hero table missing user-facing search focus");
  if (page.commercial && !html.includes("Slot-Intent")) failures.push("hero table missing slot intent");
  if (page.commercial && !html.includes("Zahlungs-Intent")) failures.push("hero table missing payment intent");
  if (page.minSlotImgs && count(/<amp-img[^>]+\/assets\/slots\//gi, html) < page.minSlotImgs) failures.push("too few local slot images");
  if (page.minSlotImgs && count(/class="[^"]*\bslot-card\b" href="\/flash\.play\/"/gi, html) < page.minSlotImgs) failures.push("slot cards do not route through /flash.play/");
  if (/class="[^"]*\bslot-card\b" href="\/(bonus|go)\//i.test(html)) failures.push("slot card uses old CTA path");
  if (page.minPaymentImgs && count(/class="[^"]*\bpay-logo\b/gi, html) < page.minPaymentImgs) failures.push("too few local payment SVG images");
  if (keyedHeadings < minKeyedHeadings) failures.push(`keyed headings ${keyedHeadings} < ${minKeyedHeadings}`);
  if (keyedHeadings > maxKeyedHeadings) failures.push(`keyed headings ${keyedHeadings} > ${maxKeyedHeadings}`);
  if (longestKeyedHeadingRun(headingText) > 2) failures.push("too many consecutive brand-key headings");
  if (page.commercial) {
    if (!html.includes('class="sticky-cta"')) failures.push("missing mobile sticky CTA");
    if (html.includes("sticky-menu")) failures.push("sticky CTA still contains menu control");
    if (!html.includes("250 Freispiele")) failures.push("sticky/hero bonus copy missing 250 Freispiele");
    if (!html.includes('class="bonus-highlight"')) failures.push("sticky bonus amount is not highlighted");
    if (!html.includes("Bonus abholen")) failures.push("commercial CTA missing Bonus abholen");
  }
  for (const pagePath of site.pages) {
    if (!html.includes(`href="${pagePath}"`)) failures.push(`missing internal link to ${pagePath}`);
  }
  for (const term of forbiddenVisibleTerms) {
    if (normalize(text).includes(normalize(term)) || normalize(title).includes(normalize(term)) || normalize(description).includes(normalize(term))) failures.push(`visible forbidden term: ${term}`);
  }
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
    chars,
    words,
    title,
    h1: count(/<h1\b/gi, html),
    h2: count(/<h2\b/gi, html),
    h3: count(/<h3\b/gi, html),
    tables: count(/<table\b/gi, html),
    lists: count(/<(ul|ol)\b/gi, html),
    reverseBlocks: count(/class="[^"]*\breverse-block\b/gi, html),
    gameSections: count(/class="[^"]*\bgame-section\b/gi, html),
    slotImages: count(/<amp-img[^>]+\/assets\/slots\//gi, html),
    paymentImages: count(/class="[^"]*\bpay-logo\b/gi, html),
    keyedHeadings,
    totalH2H3: headingText.length,
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

const paymentDir = path.join(root, "public", "assets", "payments");
const paymentFiles = fs.existsSync(paymentDir) ? fs.readdirSync(paymentDir).filter((name) => name.endsWith(".svg")) : [];
if (paymentFiles.length < 7) globalFailures.push(`payment SVG database too small: ${paymentFiles.length}`);

const heroDir = path.join(root, "public", "assets", "hero");
const heroWebp = path.join(heroDir, "revolut-slots-hero-1600.webp");
const heroMobileWebp = path.join(heroDir, "revolut-slots-hero-860.webp");
if (!fs.existsSync(heroWebp)) globalFailures.push("missing optimized hero WebP asset");
if (!fs.existsSync(heroMobileWebp)) globalFailures.push("missing mobile optimized hero WebP asset");
if (fs.existsSync(heroWebp) && fs.statSync(heroWebp).size > 320 * 1024) globalFailures.push("optimized hero WebP is too large for LCP");

const iconFiles = ["favicon.svg", "apple-touch-icon.svg", "maskable-icon.svg", "safari-pinned-tab.svg", "site.webmanifest"];
for (const file of iconFiles) {
  if (!fs.existsSync(path.join(root, "public", file))) globalFailures.push(`missing generated brand icon asset: ${file}`);
}
const brandLetter = (site.brandName || site.mainKey || "Brand").trim().match(/\p{L}|\p{N}/u)?.[0]?.toLocaleUpperCase(site.locale || "en") || "B";
const configuredGeo = normalizeGeo(site.geo || site.locale || "GLOBAL");
const faviconPath = path.join(root, "public", "favicon.svg");
if (fs.existsSync(faviconPath)) {
  const favicon = fs.readFileSync(faviconPath, "utf8");
  if (!favicon.includes(`data-brand-letter="${brandLetter}"`)) globalFailures.push("favicon does not use the configured brand initial");
  if (!favicon.includes(`data-geo="${configuredGeo}"`)) globalFailures.push("favicon does not use the configured geo");
  if (!favicon.includes(`data-geo-flag="${configuredGeo}"`)) globalFailures.push("favicon does not include the configured geo flag");
}
const appleTouchPath = path.join(root, "public", "apple-touch-icon.svg");
if (fs.existsSync(appleTouchPath)) {
  const appleTouch = fs.readFileSync(appleTouchPath, "utf8");
  if (!appleTouch.includes(`data-brand-letter="${brandLetter}"`)) globalFailures.push("apple touch icon does not use the configured brand initial");
  if (!appleTouch.includes(`data-geo="${configuredGeo}"`)) globalFailures.push("apple touch icon does not use the configured geo");
  if (!appleTouch.includes(`data-geo-flag="${configuredGeo}"`)) globalFailures.push("apple touch icon does not include the configured geo flag");
}
const maskablePath = path.join(root, "public", "maskable-icon.svg");
if (fs.existsSync(maskablePath)) {
  const maskable = fs.readFileSync(maskablePath, "utf8");
  if (!maskable.includes(`data-brand-letter="${brandLetter}"`)) globalFailures.push("maskable icon does not use the configured brand initial");
  if (!maskable.includes(`data-geo="${configuredGeo}"`)) globalFailures.push("maskable icon does not use the configured geo");
  if (!maskable.includes(`data-geo-flag="${configuredGeo}"`)) globalFailures.push("maskable icon does not include the configured geo flag");
}
const pinnedTabPath = path.join(root, "public", "safari-pinned-tab.svg");
if (fs.existsSync(pinnedTabPath)) {
  const pinnedTab = fs.readFileSync(pinnedTabPath, "utf8");
  if (!pinnedTab.includes(`data-brand-letter="${brandLetter}"`)) globalFailures.push("pinned tab icon does not use the configured brand initial");
  if (!pinnedTab.includes(`data-geo="${configuredGeo}"`)) globalFailures.push("pinned tab icon does not use the configured geo");
}
const manifestPath = path.join(root, "public", "site.webmanifest");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  if (!icons.some((icon) => icon.src === "/favicon.svg" && icon.purpose === "any")) globalFailures.push("manifest missing regular any-purpose favicon");
  if (!icons.some((icon) => icon.src === "/maskable-icon.svg" && icon.purpose === "maskable")) globalFailures.push("manifest missing maskable icon");
  if (manifest.theme_color !== (site.visualStyle?.primaryColor || "#071d38")) globalFailures.push("manifest theme_color does not match visual style");
  if (!String(manifest.description || "").includes(configuredGeo)) globalFailures.push("manifest description does not include configured geo");
}

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
const distHomeHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (/mostbet/i.test(distText)) globalFailures.push("Mostbet footprint found");
if (!distHomeHtml.includes("overflow-x:hidden")) globalFailures.push("layout missing overflow-x guard");
if (!distHomeHtml.includes("logo-flag")) globalFailures.push("header missing DE flag signal");
if (distHomeHtml.includes("Revolut<br")) globalFailures.push("logo text breaks Revolut Slots onto multiple lines");
if (!distHomeHtml.includes('<link rel="icon" href="/favicon.svg" type="image/svg+xml"')) globalFailures.push("head missing generated favicon link");
if (!distHomeHtml.includes('<link rel="apple-touch-icon" href="/apple-touch-icon.svg"')) globalFailures.push("head missing apple touch icon link");
if (!distHomeHtml.includes('<link rel="mask-icon" href="/safari-pinned-tab.svg"')) globalFailures.push("head missing pinned tab mask icon link");
if (!distHomeHtml.includes('<link rel="manifest" href="/site.webmanifest"')) globalFailures.push("head missing webmanifest link");
if (distHomeHtml.includes("url('/assets/hero/revolut-slots-hero.png')") || distHomeHtml.includes('url("/assets/hero/revolut-slots-hero.png")')) globalFailures.push("LCP hero still uses PNG CSS background");
if (!distHomeHtml.includes('class="hero-bg"')) globalFailures.push("hero LCP image is not discoverable from HTML");
if (!distHomeHtml.includes('src="/assets/hero/revolut-slots-hero-1600.webp"')) globalFailures.push("hero LCP image does not use optimized WebP");
if (!distHomeHtml.includes('rel="preload" as="image" href="/assets/hero/revolut-slots-hero-1600.webp"')) globalFailures.push("hero LCP image missing preload");
if (!distHomeHtml.includes('imagesrcset="/assets/hero/revolut-slots-hero-860.webp 860w, /assets/hero/revolut-slots-hero-1600.webp 1600w"')) globalFailures.push("hero LCP preload missing responsive imagesrcset");
if (!distHomeHtml.includes('fetchpriority="high"')) globalFailures.push("hero LCP image missing high-priority preload");
if (!distHomeHtml.includes("data-hero")) globalFailures.push("AMP hero image missing data-hero marker");
if (/class="hero-bg"[^>]*loading="lazy"/i.test(distHomeHtml)) globalFailures.push("hero LCP image uses lazy loading");

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "brand-audit.json"), JSON.stringify({ generatedAt: new Date().toISOString(), slotCount: slots.length, results, globalFailures }, null, 2));

const lines = [
  "# Brand Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Slots: ${slots.length}`,
  "",
  "| Path | Chars | Words | H1 | H2 | H3 | Key H2/H3 | Tables | Lists | Blocks | Games | Slots | Payments | Status |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ...results.map((item) => `| ${item.path} | ${item.chars} | ${item.words} | ${item.h1} | ${item.h2} | ${item.h3} | ${item.keyedHeadings}/${item.totalH2H3} | ${item.tables} | ${item.lists} | ${item.reverseBlocks} | ${item.gameSections} | ${item.slotImages} | ${item.paymentImages} | ${item.failures.length ? `FAIL: ${item.failures.join("; ")}` : "PASS"} |`),
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
