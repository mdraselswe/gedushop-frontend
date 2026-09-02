/**
 * Cloudflare Pages Function — the abandoned-cart beacon's signing hop.
 *
 * The checkout form posts here as the customer types. This function signs the
 * body with a shared secret and forwards it to GeduSuite, which verifies the
 * signature exactly as it verifies a WooCommerce webhook.
 *
 * The hop exists because the storefront is a static export: a secret shipped
 * to the browser is a secret published on the internet, and an unauthenticated
 * endpoint on GeduSuite would let anyone fill the shop's call list with
 * invented customers. The secret lives here, in Cloudflare's environment.
 *
 * Set in the Pages project (Settings → Environment variables):
 *   CART_BEACON_SECRET  — must match GeduSuite's copy
 *   SUITE_URL           — e.g. https://app.gedusuite.com
 */

/** Base64 HMAC-SHA256, the same shape WooCommerce signs its webhooks with. */
async function sign(body, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(mac)));
}

/** Bigger than any honest snapshot, small enough that nobody can post a book. */
const MAX_BODY = 8 * 1024;

export async function onRequestPost(context) {
  const { request, env } = context;

  // Missing configuration is not an error the shopper should ever feel. The
  // checkout is mid-keystroke behind this call; answering 204 keeps it quiet
  // and keeps the browser from retrying something that cannot succeed.
  if (!env.CART_BEACON_SECRET || !env.SUITE_URL) {
    return new Response(null, { status: 204 });
  }

  const body = await request.text();
  if (!body || body.length > MAX_BODY) {
    return new Response(null, { status: 204 });
  }

  const target = `${env.SUITE_URL.replace(/\/$/, "")}/api/cron/abandoned-cart`;

  try {
    await fetch(target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-gedu-signature": await sign(body, env.CART_BEACON_SECRET),
      },
      body,
    });
  } catch {
    // GeduSuite being down must never surface in the checkout. A lost snapshot
    // costs one phone call; a visible error costs the order itself.
  }

  // Nothing to say back, and nothing the page does with a reply.
  return new Response(null, { status: 204 });
}
