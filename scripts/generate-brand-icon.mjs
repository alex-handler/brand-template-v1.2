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
const letter = firstBrandLetter(brand);
const title = `${brand} site icon`;
const safeInset = Math.max(56, Math.min(116, Math.round(512 * safeArea)));
const safeSize = 512 - safeInset * 2;

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

function faviconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc" data-brand-letter="${escapeXml(letter)}">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">Automatically generated favicon from the first brand letter and the configured visual palette.</desc>
  <defs>
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
  <rect width="512" height="512" rx="126" fill="url(#bg)"/>
  <path d="M73 397 391 79c18 13 35 29 49 47L123 443a221 221 0 0 1-50-46Z" fill="url(#shine)"/>
  <circle cx="398" cy="126" r="54" fill="${escapeXml(accent)}" opacity=".95"/>
  <circle cx="398" cy="126" r="29" fill="${escapeXml(primary)}" opacity=".15"/>
  <text x="256" y="321" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-size="250" font-weight="900" letter-spacing="0" fill="${escapeXml(surface)}">${escapeXml(letter)}</text>
  <path d="M136 381h240" stroke="${escapeXml(accent)}" stroke-width="24" stroke-linecap="round"/>
</svg>
`;
}

function maskableSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc" data-brand-letter="${escapeXml(letter)}" data-mask-safe-zone="${safeArea}">
  <title id="title">${escapeXml(title)} maskable</title>
  <desc id="desc">Mask-safe app icon with the brand mark kept inside the central safe area.</desc>
  <defs>
    <linearGradient id="bg" x1="${safeInset}" y1="${safeInset}" x2="${512 - safeInset}" y2="${512 - safeInset}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${escapeXml(secondary)}"/>
      <stop offset=".72" stop-color="${escapeXml(primary)}"/>
      <stop offset="1" stop-color="${escapeXml(primary)}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="${escapeXml(primary)}"/>
  <rect x="${safeInset}" y="${safeInset}" width="${safeSize}" height="${safeSize}" rx="${Math.round(safeSize * 0.28)}" fill="url(#bg)"/>
  <circle cx="${512 - safeInset - 38}" cy="${safeInset + 50}" r="35" fill="${escapeXml(accent)}"/>
  <text x="256" y="311" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-size="214" font-weight="900" letter-spacing="0" fill="${escapeXml(surface)}">${escapeXml(letter)}</text>
  <path d="M159 365h194" stroke="${escapeXml(accent)}" stroke-width="20" stroke-linecap="round"/>
</svg>
`;
}

function pinnedTabSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" data-brand-letter="${escapeXml(letter)}">
  <title>${escapeXml(title)} pinned tab</title>
  <rect x="38" y="38" width="436" height="436" rx="118" fill="#000"/>
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

console.log(`Generated brand icons for ${brand} (${letter}).`);
