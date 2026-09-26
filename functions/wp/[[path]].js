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
  const idempotencyKey = request.headers.get("x-gedu-idempotency-key");
  if (idempotencyKey) headers.set("x-gedu-idempotency-key", idempotencyKey);

  // Forward client identity and content negotiation headers so Hostinger's
  // LiteSpeed firewall does not challenge Cloudflare Workers as bot traffic.
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const acceptLang = request.headers.get("accept-language");
  if (acceptLang) headers.set("accept-language", acceptLang);
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) headers.set("cf-connecting-ip", cfConnectingIp);
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) headers.set("x-forwarded-for", xForwardedFor);
  else if (cfConnectingIp) headers.set("x-forwarded-for", cfConnectingIp);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const safeToReplay = request.method === "GET" || request.method === "HEAD";
  const attempts = safeToReplay ? 3 : 1;
  let res;
  for (let i = 0; i < attempts; i++) {
    try {
      const timeoutSignal = AbortSignal.timeout(8000);
      const signal = request.signal ? AbortSignal.any([request.signal, timeoutSignal]) : timeoutSignal;
      res = await fetch(target, { method: request.method, headers, body, signal });
    } catch {
      if (i + 1 < attempts) {
        await new Promise((r) => setTimeout(r, 200 * (i + 1)));
      }
      continue;
    }
    // Only retry transient edge issues (hCDN 403 or 502/503/504 gateway errors).
    // Application errors (such as 500) fail fast so the UI does not hang for 80s.
    const shouldRetry = safeToReplay && (res.status === 403 || res.status === 502 || res.status === 503 || res.status === 504);
    if (!shouldRetry) break;
    if (i + 1 < attempts) {
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }

  if (!res) {
    return new Response(JSON.stringify({ error: "Upstream temporarily unavailable." }), {
      status: 502,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
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
