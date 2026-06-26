const PRIMARY_HOST = "revolut-slots-de.de";
const REDIRECT_HOSTS = new Set([
  "www.revolut-slots-de.de",
  "brand-template-v1-2.pages.dev"
]);
const AFFILIATE_URL = "https://example.com/affiliate-placeholder";

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (REDIRECT_HOSTS.has(url.hostname)) {
    url.hostname = PRIMARY_HOST;
    return Response.redirect(url.toString(), 301);
  }

  if (url.pathname === "/go" || url.pathname === "/go/") {
    return Response.redirect(AFFILIATE_URL, 302);
  }

  return context.next();
}
