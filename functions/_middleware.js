/**
 * Cloudflare Pages middleware for SEO rules that a static Next.js export
 * cannot express per incoming hostname or query string.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Keep one serving origin. The page-level canonicals already use the apex,
  // but an edge redirect also consolidates every path and asset request.
  if (url.hostname === "www.gedushop.com") {
    url.hostname = "gedushop.com";
    return Response.redirect(url.toString(), 301);
  }

  // This parameter belonged to an older storefront and has already appeared
  // in search. Remove it while retaining any meaningful search/filter values.
  if (url.pathname.replace(/\/$/, "") === "/shop" && url.searchParams.has("displayview")) {
    url.searchParams.delete("displayview");
    return Response.redirect(url.toString(), 301);
  }

  const response = await context.next();
  const next = new Response(response.body, response);

  // Static HTML metadata cannot vary by query string. Search/sort/filter result
  // pages remain usable, but should not compete with the canonical shop page.
  if (url.pathname.replace(/\/$/, "") === "/shop" && url.search) {
    next.headers.set("X-Robots-Tag", "noindex, follow");
  }

  return next;
}
