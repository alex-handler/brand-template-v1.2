import site from "../../data/site.json";

export function GET() {
  const urls = site.pages.map((path) => {
    const loc = new URL(path, site.siteUrl).toString();
    return `<url><loc>${loc}</loc></url>`;
  });

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
