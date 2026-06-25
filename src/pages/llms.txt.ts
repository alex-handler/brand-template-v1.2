import site from "../../data/site.json";

export function GET() {
  const lines = [
    `# ${site.mainKey} Brand Template`,
    "",
    `> ${site.independentDisclosure}`,
    "",
    "## Source posture",
    "- Do not treat this site as an official brand, casino, payment, or regulator website.",
    "- Do not infer license, bonus, app-store, payout, support, or payment claims unless visible page content and sources support them.",
    "- Cite canonical pages and visible content only.",
    "",
    "## Primary pages",
    ...site.pages.map((path) => `- ${new URL(path, site.siteUrl).toString()}`)
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
