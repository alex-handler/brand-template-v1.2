# brand-template-v1.2

Astro static brand-template for iGaming-adjacent brand query sites.

This version is designed for Cloudflare Pages preview deployments:

```text
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Production branch: main
```

## GOAT Operating Model

```text
Goal   -> define brand, geo, main key, pages, and source limits.
Observe -> load facts, keyword clusters, competitor patterns, and assets.
Act    -> generate pages one at a time from the approved rules.
Test   -> build, audit, preview, and only then connect production domains.
```

## Normal Input

```text
domain
geo and language
brand name
main key
keyword export
affiliate URL
official or approved source URLs
allowed pages
assets or permission to generate visuals
notes on forbidden claims
```

Production copy must distinguish verified facts, user-provided assumptions, and unresolved items.

## Image Performance

`npm run build`, `npm run dev`, `npm run preview` and `npm run audit:brand` run `scripts/optimize-images.mjs` before Astro starts. Hero PNG/JPEG files in `public/assets/hero/` are source assets only; the page must load generated WebP/AVIF variants for LCP. The first-viewport hero image must be present as HTML, not as a CSS background, and must use a high-priority loading signal.

## Auto Brand Icon

`npm run build`, `npm run dev`, `npm run preview` and `npm run audit:brand` run `scripts/generate-brand-icon.mjs` first. The script derives the site icon from `data/site.json`:

- first visible letter or number from `brandName`
- normalized `geo` / `locale` country code as a flag backdrop and badge
- `visualStyle.primaryColor`, `secondaryColor`, `accentColor`, `surfaceColor`
- `visualStyle.iconSafeArea` for the maskable app icon

Generated files live in `public/`: `favicon.svg`, `apple-touch-icon.svg`, `maskable-icon.svg`, `safari-pinned-tab.svg` and `site.webmanifest`. Do not copy favicons from prior brands or protected official brand assets unless explicitly approved. The same brand launched for different GEOs must produce visibly different icons through the configured country flag signal.
