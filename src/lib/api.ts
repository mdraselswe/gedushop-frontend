/**
 * Client-side API bases. The site is static, so the browser talks to
 * WordPress directly (CORS is enabled by the GeduShop Headless Bridge plugin).
 * NEXT_PUBLIC_WP_URL is baked into the bundle at build time.
 */
// In production the browser talks to a SAME-ORIGIN Cloudflare Pages proxy
// (functions/wp/[[path]].js) → avoids Hostinger hCDN's cross-site 403s. In dev
// (next dev, no Pages Functions) we hit the WP subdomain directly.
const PROD = process.env.NODE_ENV === "production";
const DIRECT = process.env.NEXT_PUBLIC_WP_URL ?? "https://gedushop.com";

export const STORE_API = PROD ? "/wp/wc/store/v1" : `${DIRECT}/wp-json/wc/store/v1`;
export const GEDU_API = PROD ? "/wp/gedushop/v1" : `${DIRECT}/wp-json/gedushop/v1`;

/**
 * fetch with retry — Hostinger's hCDN intermittently 403s some edge nodes,
 * which would otherwise show "no products". Retries GET-style requests a few
 * times before giving up.
 */
export async function apiFetch(url: string, init?: RequestInit, attempts = 6): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  // Retrying an unknown POST outcome can create the same order, review, or cart
  // mutation twice. Only reads are safe to replay automatically. A shopper can
  // still retry a failed write explicitly; checkout carries an idempotency key
  // so that even that manual retry resolves to the original order.
  const safeToReplay = method === "GET" || method === "HEAD";
  // Production reads already pass through the edge proxy, which performs six
  // upstream attempts. Cap the browser at two edge attempts so a full backend
  // outage does not multiply into 36 requests and a very long loading state.
  const totalAttempts = safeToReplay
    ? PROD
      ? Math.min(2, Math.max(1, attempts))
      : Math.max(1, attempts)
    : 1;
  let last: Response | null = null;
  let lastError: unknown = null;
  for (let i = 0; i < totalAttempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      last = res;
      if (res.status !== 403 && res.status < 500) return res;
    } catch (error) {
      lastError = error;
      // network hiccup — retry
    }
    if (i + 1 < totalAttempts) {
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  if (last) return last;
  throw lastError ?? new Error(`Request failed: ${method} ${url}`);
}
