# GOAT System

Use GOAT for every brand-template launch.

## Goal

- Identify domain, geo, language, brand name, main key, and allowed pages.
- Decide whether the launch is preview-only or production-ready.
- Record forbidden claims before writing copy.

## Observe

- Load keyword clusters.
- Load official or user-approved sources.
- Load competitor structure patterns when available.
- Mark facts as verified, user-provided, or unresolved.
- Inspect available assets and document missing files.

## Act

- Generate one page at a time.
- Keep the main key at the start of title tags where natural.
- Use cautious brand language.
- Do not impersonate operators, banks, payment brands, casinos, or regulators.
- Use local redirects for affiliate links.
- Generate the site icon automatically from `brandName`, `geo`, and `visualStyle` before build; never carry over a previous brand favicon or reuse the same icon across different GEO launches.
- Generate optimized WebP/AVIF hero variants before build and expose the LCP image directly in HTML. On AMP pages mark it with `data-hero` and add a high-priority preload in the head.

## Test

- Run build.
- Run brand audit.
- Confirm favicon, apple touch icon, pinned tab icon and maskable webmanifest icon are present and include the configured GEO signal.
- Confirm the hero LCP image is WebP/AVIF, discoverable from HTML, not lazy-loaded, preloaded with high priority, and below the configured size ceiling.
- Inspect preview URL before connecting a custom domain.
- Do not approve production if official, license, payment, bonus, or payout claims are unsupported.
