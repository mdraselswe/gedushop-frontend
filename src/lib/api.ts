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
  let last: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      last = res;
      if (res.status !== 403 && res.status < 500) return res;
    } catch {
      // network hiccup — retry
    }
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  if (last) return last;
  return fetch(url, init);
}
