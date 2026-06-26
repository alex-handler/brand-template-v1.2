import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sitePath = path.join(root, "data", "site.json");
const publicDir = path.join(root, "public");
const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));

const visual = site.visualStyle || {};
const primary = visual.primaryColor || "#071d38";
const secondary = visual.secondaryColor || "#1467c9";
const accent = visual.accentColor || "#ffd425";
const surface = visual.surfaceColor || "#ffffff";
const safeArea = Number.isFinite(visual.iconSafeArea) ? visual.iconSafeArea : 0.18;
const brand = site.brandName || site.mainKey || "Brand";
const geo = normalizeGeo(site.geo || site.locale || "GLOBAL");
const letter = firstBrandLetter(brand);
const title = `${brand} ${geo} site icon`;
const safeInset = Math.max(56, Math.min(116, Math.round(512 * safeArea)));
const safeSize = 512 - safeInset * 2;

function normalizeGeo(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return "GLOBAL";
  if (raw.includes("-")) return raw.split("-").pop();
  return raw === "UK" ? "GB" : raw;
}

function firstBrandLetter(value) {
  const match = String(value).trim().match(/\p{L}|\p{N}/u);
  return (match ? match[0] : "B").toLocaleUpperCase(site.locale || "en");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function geoFlag(geoCode) {
  const flags = {
    AT: { type: "horizontal", colors: ["#ed2939", "#ffffff", "#ed2939"] },
    BE: { type: "vertical", colors: ["#000000", "#ffd90c", "#ef3340"] },
    BR: { type: "brazil", colors: ["#009b3a", "#ffdf00", "#002776"] },
    CA: { type: "vertical", colors: ["#d80621", "#ffffff", "#d80621"] },
    CH: { type: "swiss", colors: ["#d52b1e", "#ffffff"] },
    DE: { type: "horizontal", colors: ["#000000", "#dd0000", "#ffce00"] },
    ES: { type: "horizontal", colors: ["#aa151b", "#f1bf00", "#aa151b"], weights: [1, 2, 1] },
    FR: { type: "vertical", colors: ["#0055a4", "#ffffff", "#ef4135"] },
    GB: { type: "vertical", colors: ["#012169", "#ffffff", "#c8102e"] },
    IE: { type: "vertical", colors: ["#169b62", "#ffffff", "#ff883e"] },
    IN: { type: "india", colors: ["#ff9933", "#ffffff", "#138808", "#000080"] },
    IT: { type: "vertical", colors: ["#009246", "#ffffff", "#ce2b37"] },
    JP: { type: "circle", colors: ["#ffffff", "#bc002d"] },
    NL: { type: "horizontal", colors: ["#ae1c28", "#ffffff", "#21468b"] },
    PL: { type: "horizontal", colors: ["#ffffff", "#dc143c"] },
    PT: { type: "vertical", colors: ["#006600", "#ff0000"], weights: [2, 3] },
    US: { type: "us", colors: ["#b22234", "#ffffff", "#3c3b6e"] }
  };
  return flags[geoCode] || { type: "horizontal", colors: [secondary, accent, primary] };
}

function weightedSegments(weights, total) {
  const sum = weights.reduce((acc, item) => acc + item, 0);
  let cursor = 0;
  return weights.map((weight, index) => {
    const size = index === weights.length - 1 ? total - cursor : (total * weight) / sum;
    const segment = { start: cursor, size };
    cursor += size;
    return segment;
  });
}

function flagShapes(x, y, width, height) {
  const flag = geoFlag(geo);
  const colors = flag.colors.map(escapeXml);
  if (flag.type === "vertical") {
    const segments = weightedSegments(flag.weights || colors.map(() => 1), width);
    return segments.map((segment, index) => `<rect x="${x + segment.start}" y="${y}" width="${segment.size}" height="${height}" fill="${colors[index]}"/>`).join("");
  }
  if (flag.type === "swiss") {
    const bar = width * 0.18;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${colors[0]}"/><rect x="${x + width * 0.41}" y="${y + height * 0.22}" width="${bar}" height="${height * 0.56}" fill="${colors[1]}"/><rect x="${x + width * 0.22}" y="${y + height * 0.41}" width="${width * 0.56}" height="${bar}" fill="${colors[1]}"/>`;
  }
  if (flag.type === "circle") {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${colors[0]}"/><circle cx="${x + width / 2}" cy="${y + height / 2}" r="${Math.min(width, height) * 0.28}" fill="${colors[1]}"/>`;
  }
  if (flag.type === "brazil") {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${colors[0]}"/><path d="M${x + width / 2} ${y + height * 0.12} ${x + width * 0.9} ${y + height / 2} ${x + width / 2} ${y + height * 0.88} ${x + width * 0.1} ${y + height / 2}Z" fill="${colors[1]}"/><circle cx="${x + width / 2}" cy="${y + height / 2}" r="${Math.min(width, height) * 0.18}" fill="${colors[2]}"/>`;
  }
  if (flag.type === "india") {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height / 3}" fill="${colors[0]}"/><rect x="${x}" y="${y + height / 3}" width="${width}" height="${height / 3}" fill="${colors[1]}"/><rect x="${x}" y="${y + height * 2 / 3}" width="${width}" height="${height / 3}" fill="${colors[2]}"/><circle cx="${x + width / 2}" cy="${y + height / 2}" r="${Math.min(width, height) * 0.1}" fill="none" stroke="${colors[3]}" stroke-width="${Math.max(3, width * 0.035)}"/>`;
  }
  if (flag.type === "us") {
    const stripe = height / 7;
    return Array.from({ length: 7 }, (_, index) => `<rect x="${x}" y="${y + stripe * index}" width="${width}" height="${stripe}" fill="${colors[index % 2]}"/>`).join("") + `<rect x="${x}" y="${y}" width="${width * 0.48}" height="${stripe * 4}" fill="${colors[2]}"/>`;
  }
  const segments = weightedSegments(flag.weights || colors.map(() => 1), height);
  return segments.map((segment, index) => `<rect x="${x}" y="${y + segment.start}" width="${width}" height="${segment.size}" fill="${colors[index]}"/>`).join("");
}

function geoBackdrop(opacity = 0.55) {
  return `<g data-geo-flag="${escapeXml(geo)}" opacity="${opacity}">${flagShapes(0, 0, 512, 512)}</g>`;
}

function geoBadge(cx, cy, r) {
  const x = cx - r;
  const y = cy - r;
  const size = r * 2;
  return `<circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="${escapeXml(surface)}" opacity=".96"/><g clip-path="url(#geoBadgeClip)">${flagShapes(x, y, size, size)}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${escapeXml(surface)}" stroke-width="8"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${escapeXml(primary)}" stroke-opacity=".22" stroke-width="3"/>`;
}

function faviconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc" data-brand-letter="${escapeXml(letter)}" data-geo="${escapeXml(geo)}">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">Automatically generated favicon from the first brand letter, target geo flag and configured visual palette.</desc>
  <defs>
    <clipPath id="geoBadgeClip"><circle cx="398" cy="126" r="54"/></clipPath>
    <linearGradient id="bg" x1="70" y1="36" x2="436" y2="478" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${escapeXml(secondary)}"/>
      <stop offset="0.62" stop-color="${escapeXml(primary)}"/>
      <stop offset="1" stop-color="${escapeXml(primary)}"/>
    </linearGradient>
    <linearGradient id="shine" x1="80" y1="32" x2="412" y2="416" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${escapeXml(surface)}" stop-opacity=".34"/>
      <stop offset=".52" stop-color="${escapeXml(surface)}" stop-opacity=".05"/>
      <stop offset="1" stop-color="${escapeXml(surface)}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${geoBackdrop()}
  <rect width="512" height="512" rx="126" fill="url(#bg)"/>
  <path d="M0 388h512v124H0z" fill="${escapeXml(primary)}" opacity=".58"/>
  <g opacity=".86">${flagShapes(0, 388, 512, 124)}</g>
  <path d="M73 397 391 79c18 13 35 29 49 47L123 443a221 221 0 0 1-50-46Z" fill="url(#shine)"/>
  ${geoBadge(398, 126, 54)}
  <text x="256" y="321" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-size="250" font-weight="900" letter-spacing="0" fill="${escapeXml(surface)}">${escapeXml(letter)}</text>
  <path d="M136 381h240" stroke="${escapeXml(accent)}" stroke-width="24" stroke-linecap="round"/>
</svg>
`;
}

function maskableSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc" data-brand-letter="${escapeXml(letter)}" data-geo="${escapeXml(geo)}" data-mask-safe-zone="${safeArea}">
  <title id="title">${escapeXml(title)} maskable</title>
  <desc id="desc">Mask-safe app icon with the brand mark and geo flag signal kept inside the central safe area.</desc>
  <defs>
    <clipPath id="geoBadgeClip"><circle cx="${512 - safeInset - 38}" cy="${safeInset + 50}" r="35"/></clipPath>
    <linearGradient id="bg" x1="${safeInset}" y1="${safeInset}" x2="${512 - safeInset}" y2="${512 - safeInset}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${escapeXml(secondary)}"/>
      <stop offset=".72" stop-color="${escapeXml(primary)}"/>
      <stop offset="1" stop-color="${escapeXml(primary)}"/>
    </linearGradient>
  </defs>
  ${geoBackdrop(0.82)}
  <rect width="512" height="512" fill="${escapeXml(primary)}"/>
  <g opacity=".72">${flagShapes(0, 0, 512, 512)}</g>
  <rect x="${safeInset}" y="${safeInset}" width="${safeSize}" height="${safeSize}" rx="${Math.round(safeSize * 0.28)}" fill="url(#bg)"/>
  ${geoBadge(512 - safeInset - 38, safeInset + 50, 35)}
  <text x="256" y="311" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-size="214" font-weight="900" letter-spacing="0" fill="${escapeXml(surface)}">${escapeXml(letter)}</text>
  <path d="M159 365h194" stroke="${escapeXml(accent)}" stroke-width="20" stroke-linecap="round"/>
</svg>
`;
}

function pinnedTabSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" data-brand-letter="${escapeXml(letter)}" data-geo="${escapeXml(geo)}">
  <title>${escapeXml(title)} pinned tab</title>
  <rect x="38" y="38" width="436" height="436" rx="118" fill="#000"/>
  <rect x="92" y="374" width="328" height="28" rx="14" fill="#000"/>
  <rect x="92" y="414" width="328" height="28" rx="14" fill="#000"/>
  <text x="256" y="318" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-size="238" font-weight="900" letter-spacing="0" fill="#fff">${escapeXml(letter)}</text>
</svg>
`;
}

function manifest() {
  return {
    name: site.mainKey || brand,
    short_name: brand,
    start_url: "/",
    display: "standalone",
    background_color: surface,
    theme_color: primary,
    description: `${brand} ${geo} icon generated from brand initial and geo flag`,
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/maskable-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "favicon.svg"), faviconSvg());
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.svg"), faviconSvg());
fs.writeFileSync(path.join(publicDir, "maskable-icon.svg"), maskableSvg());
fs.writeFileSync(path.join(publicDir, "safari-pinned-tab.svg"), pinnedTabSvg());
fs.writeFileSync(path.join(publicDir, "site.webmanifest"), `${JSON.stringify(manifest(), null, 2)}\n`);

console.log(`Generated brand icons for ${brand} (${letter}, ${geo}).`);
