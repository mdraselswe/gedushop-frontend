/**
 * Cloudflare Pages Function — a customer's order list, without an account.
 *
 * The shop has no login. What a customer does have is their mobile number and,
 * on the confirmation call, an order number. Knowing both is the proof of
 * ownership: the phone alone is guessable, and an order number alone belongs to
 * whoever is looking at a screen. Together they unlock that phone's orders.
 *
 * Why here and not WordPress: the storefront is a static export, so the
 * WooCommerce keys cannot go in the bundle — the same reasoning abandoned.js
 * spells out. This runs at the edge with the read-only key held in Cloudflare's
 * environment.
 *
 * Set in the Pages project (Settings → Environment variables):
 *   WC_CONSUMER_KEY / WC_CONSUMER_SECRET  — the READ-ONLY WooCommerce pair
 *
 * NOT YET RATE LIMITED. Woo order ids run in sequence, so somebody holding a
 * phone number can walk the id space until a pair lands. Before this sees real
 * traffic it needs a per-IP WAF rule and, better, a per-phone counter in KV.
 */

const WP = "https://wp.gedushop.com/wp-json/wc/v3";

/** Matches the checkout's own rule (CheckoutForm), so a valid order can always be found. */
const PHONE_RE = /^01[3-9]\d{8}$/;

/** Newer than this many orders is more history than any page wants to show. */
const MAX_ORDERS = 20;

/**
 * Last ten digits, which is what two Bangladeshi numbers have in common however
 * they were typed: 01712345678, 8801712345678 and +880 1712-345678 all reduce
 * to 1712345678. New orders are validated at checkout, but older ones and
 * anything keyed in by hand in wp-admin are not.
 */
function phoneKey(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.slice(-10);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      // Customer data must never sit in a shared cache.
      "cache-control": "no-store",
    },
  });
}

/**
 * One answer for every kind of miss.
 *
 * Whether the order does not exist, belongs to a different number, or was
 * deleted, the reply is identical — a distinct message for each would turn this
 * endpoint into a way to test whether an order id is real.
 */
function notFound() {
  return json({ error: "We couldn't find an order with that number and mobile number." }, 404);
}

/**
 * WooCommerce over HTTPS, authenticated in the query string.
 *
 * Basic auth is the tidier form, but Hostinger's Apache does not reliably pass
 * the Authorization header through to PHP, and a silently unauthenticated call
 * looks exactly like a missing order. Retries mirror the wp proxy: hCDN 403s
 * some edge nodes intermittently.
 */
async function wc(path, env) {
  const url = new URL(`${WP}${path}`);
  url.searchParams.set("consumer_key", env.WC_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", env.WC_CONSUMER_SECRET);

  let res;
  for (let i = 0; i < 4; i++) {
    res = await fetch(url.toString(), { headers: { accept: "application/json" } });
    if (res.ok || (res.status !== 403 && res.status < 500)) break;
    await new Promise((r) => setTimeout(r, 200 * (i + 1)));
  }
  return res;
}

/**
 * The shape the list renders — and nothing else.
 *
 * No address, no email, no customer note. If this endpoint is ever walked
 * successfully, what leaks should be an order number and a total, not somebody's
 * home address.
 */
function publicOrder(o) {
  return {
    id: o.id,
    status: o.status,
    dateCreated: o.date_created,
    total: o.total,
    currencySymbol: o.currency_symbol ?? "৳",
    items: (o.line_items ?? []).map((i) => ({ name: i.name, quantity: i.quantity })),
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.WC_CONSUMER_KEY || !env.WC_CONSUMER_SECRET) {
    return json({ error: "Order lookup is unavailable right now." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const phone = String(body.phone ?? "").trim();
  const orderId = String(body.order_id ?? "").trim();

  if (!PHONE_RE.test(phone)) {
    return json({ error: "Enter a valid mobile number (01XXXXXXXXX)." }, 400);
  }
  if (!/^\d{1,10}$/.test(orderId)) {
    return json({ error: "Enter a valid order number." }, 400);
  }

  const wanted = phoneKey(phone);

  // 1. The pair has to check out before anything is returned.
  const one = await wc(`/orders/${orderId}`, env);
  if (!one.ok) return notFound();

  let order;
  try {
    order = await one.json();
  } catch {
    return notFound();
  }
  if (phoneKey(order?.billing?.phone) !== wanted) return notFound();

  // 2. Now the rest of that number's orders. Woo's `search` is a broad LIKE —
  //    it will happily match a phone number that appears in someone else's
  //    order note — so every row is re-checked against billing.phone below.
  const many = await wc(
    `/orders?search=${encodeURIComponent(phone)}&per_page=${MAX_ORDERS}&orderby=date&order=desc`,
    env,
  );

  let list = [];
  if (many.ok) {
    try {
      const parsed = await many.json();
      if (Array.isArray(parsed)) {
        list = parsed.filter((o) => phoneKey(o?.billing?.phone) === wanted);
      }
    } catch {
      // fall through to the single verified order
    }
  }

  // The search can come back empty or unusable while the order we already
  // verified is plainly real — never answer with less than that one.
  if (!list.some((o) => String(o.id) === String(order.id))) list.unshift(order);

  return json({ orders: list.map(publicOrder) });
}
