import site from "../../data/site.json";

export function GET() {
  return new Response([
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${new URL("/sitemap.xml", site.siteUrl).toString()}`,
    "# llms.txt is available for AI-agent context.",
    `# ${new URL("/llms.txt", site.siteUrl).toString()}`
  ].join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
