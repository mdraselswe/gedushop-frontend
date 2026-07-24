/**
 * Cloudflare Pages Function — same-origin proxy to the WooCommerce backend.
 *
 * The browser calls gedushop.com/wp/<...> (same origin, no CORS, no cross-site
 * request that Hostinger's hCDN intermittently 403s). This function fetches
 * wp.gedushop.com/wp-json/<...> server-side from Cloudflare's edge, with retry
 * to smooth over the occasional hCDN 403.
 */
const WP = "https://wp.gedushop.com/wp-json";

export async function onRequest(context) {
  const { request, params } = context;
  const sub = Array.isArray(params.path) ? params.path.join("/") : params.path || "";
  const search = new URL(request.url).search;
  const target = `${WP}/${sub}${search}`;

  const headers = new Headers();
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const cartToken = request.headers.get("cart-token");
  if (cartToken) headers.set("cart-token", cartToken);
  const nonce = request.headers.get("nonce");
  if (nonce) headers.set("nonce", nonce);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let res;
  for (let i = 0; i < 6; i++) {
    res = await fetch(target, { method: request.method, headers, body });
    if (res.ok || (res.status !== 403 && res.status < 500)) break;
    await new Promise((r) => setTimeout(r, 200 * (i + 1)));
  }

  const out = new Response(res.body, { status: res.status });
  const outCt = res.headers.get("content-type");
  if (outCt) out.headers.set("content-type", outCt);
  for (const h of ["cart-token", "nonce", "x-wp-total", "x-wp-totalpages", "link"]) {
    const v = res.headers.get(h);
    if (v) out.headers.set(h, v);
  }
  out.headers.set("cache-control", "no-store");
  return out;
}
