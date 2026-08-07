/**
 * Cloudflare Pages Function — Meta (and Google) product feed at /feed.xml.
 *
 * Commerce Manager pulls this on a schedule to build the catalogue that
 * Advantage+ catalogue ads sell from. Generated at the edge rather than at
 * build time so price and stock stay current between deploys — a catalogue
 * advertising an out-of-stock item pays for clicks it cannot convert.
 *
 * Why not the Meta for WooCommerce plugin: it emits wp.gedushop.com permalinks.
 * That is the headless backend — no pixel, no cart, no checkout. Shoppers would
 * land nowhere and every conversion would go untracked. The link field here
 * points at the storefront instead.
 *
 * g:id is the parent Woo product id, which is exactly what the pixel reports as
 * content_ids (ViewContent, AddToCart, Purchase). The two must agree or Meta
 * cannot join a sale to a catalogue item.
 */
const WP = "https://wp.gedushop.com/wp-json/wc/store/v1";
const SITE = "https://gedushop.com";
const BRAND = "GeduShop";
/** Google taxonomy: Toys & Games. Meta accepts the numeric id. */
const CATEGORY = "1239";

/** Woo's Store API returns HTML-encoded text; undo it before re-escaping for XML. */
function decode(input) {
  return String(input ?? "")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function esc(input) {
  return decode(input).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Strip markup and collapse whitespace — feed descriptions must be plain text. */
function plain(html, max = 900) {
  const text = decode(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function item(p) {
  const minor = p.prices?.currency_minor_unit ?? 2;
  const money = (v) => `${(Number(v) / 10 ** minor).toFixed(2)} BDT`;
  // Meta wants the list price in g:price and the discount in g:sale_price, which
  // is what renders the struck-through original in the carousel card.
  const regular = p.prices?.regular_price || p.prices?.price || "0";
  const current = p.prices?.price || regular;
  const onSale = Number(current) < Number(regular);

  const extra = (p.images ?? [])
    .slice(1, 10)
    .map((i) => `    <g:additional_image_link>${esc(i.src)}</g:additional_image_link>`)
    .join("\n");

  return [
    "  <item>",
    `    <g:id>${p.id}</g:id>`,
    `    <g:title>${esc(p.name)}</g:title>`,
    `    <g:description>${plain(p.short_description || p.description || p.name)}</g:description>`,
    `    <g:link>${SITE}/product/${esc(p.slug)}/</g:link>`,
    `    <g:image_link>${esc(p.images?.[0]?.src ?? "")}</g:image_link>`,
    extra,
    `    <g:availability>${p.is_in_stock ? "in stock" : "out of stock"}</g:availability>`,
    "    <g:condition>new</g:condition>",
    `    <g:price>${money(regular)}</g:price>`,
    onSale ? `    <g:sale_price>${money(current)}</g:sale_price>` : "",
    `    <g:brand>${BRAND}</g:brand>`,
    `    <g:google_product_category>${CATEGORY}</g:google_product_category>`,
    "  </item>",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function onRequest() {
  let products;
  try {
    // Store API caps per_page at 100; the catalogue is far smaller than that.
    const res = await fetch(`${WP}/products?per_page=100&status=publish`);
    if (!res.ok) throw new Error(`Store API ${res.status}`);
    products = await res.json();
  } catch {
    // Never serve a truncated feed: Meta would read missing items as deletions
    // and pull those products out of every live ad. Fail loudly instead.
    return new Response("upstream unavailable", { status: 502 });
  }

  const sellable = (products ?? []).filter((p) => p.is_purchasable && p.images?.length);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${BRAND}</title>
  <link>${SITE}</link>
  <description>${BRAND} product feed for Meta and Google catalogues</description>
${sellable.map(item).join("\n")}
</channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Meta fetches on a schedule; half an hour of edge cache keeps the
      // WooCommerce backend out of the loop without letting stock go stale.
      "cache-control": "public, max-age=1800",
    },
  });
}
