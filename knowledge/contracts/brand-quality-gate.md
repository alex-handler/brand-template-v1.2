# Brand Quality Gate

Every commercial page must pass before preview approval.

## Structure

- Exactly one H1.
- Title starts with the configured main key on commercial pages.
- H1 includes the main key or a close localized intent variant.
- H2/H3 hierarchy is logical.
- At least one table or list exists on every commercial page.
- Internal links point to relevant sibling pages.

## Brand Safety

- Disclosure states the site is independent.
- No official-site claim unless a verified ownership source exists.
- No invented license, payout, payment, app-store, support, or bonus claims.
- No false partnership or endorsement language.
- Responsible gambling warning is visible.

## SEO

- Meta descriptions are unique.
- Main keyword appears in title, H1/first viewport, intro, and one later section.
- Keyword clusters are covered naturally, not dumped.
- Brand-key headings must be present but not mechanical: avoid long consecutive runs and keep intent headings mixed in.
- JSON-LD is valid and does not include unsupported claims.

## Anti-Footprint

- Avoid reusable generic headings across launches.
- Avoid duplicated title/meta patterns between page types.
- Avoid identical alt/title text for multiple images.
- Keep visual palette and section rhythm configurable per brand.
- Generate the site icon from the first brand letter, target GEO flag signal, and the current visual palette, with separate normal and maskable assets so browser tabs and search snippets do not receive an accidental clipped mask. Same-brand launches for different GEOs must have visibly different icons.
- The first-viewport hero/LCP image must be an optimized WebP or AVIF discovered from HTML immediately, not a PNG CSS background. It must not lazy-load; on AMP pages use `data-hero` on `amp-img` plus a high-priority preload in the document head.
- Highlight the numeric bonus or free-spin count in the sticky CTA.
- Remove technical source labels from visible blocks; users should see categories, games and actions, not extraction/database wording.

## Internal Linking

- Every page links to homepage, app, bonus, registration, payments, sports, responsible gambling, privacy and cookies.
- The internal-link block must be visible and styled as navigation, not hidden metadata.

## Hero Intent Table

- The hero table must answer what the user is searching for: main slot key, secondary casino key, slot intent, payment/bank intent, and GEO.
- Do not expose planning labels, schema fields, extraction notes, or internal status labels in the first viewport.
