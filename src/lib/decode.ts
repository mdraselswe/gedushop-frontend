import type { StoreProduct } from "./types";

/**
 * WooCommerce Store API returns names HTML-encoded ("Feeding &amp; Nursing").
 * React escapes strings again on render, so entities show up literally unless
 * we decode them once. Server- and client-safe (no DOM needed).
 */
export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

/**
 * Every name on a product that the Store API sends HTML-encoded: its own,
 * each category's, and — for a combo — each item it's made of. Four
 * independent fields, so decoding the product's own name doesn't fix the
 * other three; a combo page's "What's in this combo" list was still showing
 * "&amp;" in an item's name after the product's own title was already fixed.
 *
 * Shared by lib/wp's build-time fetch and lib/liveProduct's client-side one —
 * the Store API sends the same encoded shape to both, and only one of them
 * used to decode anything.
 */
export function decodeStoreProduct(p: StoreProduct): StoreProduct {
  const base = {
    ...p,
    name: decodeEntities(p.name),
    categories: p.categories?.map((c) => ({ ...c, name: decodeEntities(c.name) })) ?? p.categories,
  };
  // Narrowed through a local, not the inline `p.extensions?.gedushop?.combo`
  // chain again below — TypeScript can't carry an optional-chain result's
  // non-null proof into a second, separate chain off the same path.
  const gedushop = p.extensions?.gedushop;
  const combo = gedushop?.combo;
  if (!gedushop || !combo) return base;
  return {
    ...base,
    extensions: {
      ...p.extensions,
      gedushop: {
        ...gedushop,
        combo: { ...combo, items: combo.items.map((i) => ({ ...i, name: decodeEntities(i.name) })) },
      },
    },
  };
}
