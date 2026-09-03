"use client";

import { useEffect, useState } from "react";
import { apiFetch, STORE_API } from "@/lib/api";
import { decodeStoreProduct } from "@/lib/decode";
import type { StoreProduct } from "@/lib/types";

/**
 * The product as it is right now, not as it was when the site was built.
 *
 * Product pages are HTML files written at build time; the shop behind them
 * keeps changing. The buy box has always refetched for that reason, and
 * anything else that quotes a price has to do the same or the page contradicts
 * itself — a combo whose price rose showed the new figure at the top and the
 * old one, with an old saving and an old recipe, further down. Two prices on
 * one page is worse than a stale one.
 *
 * Returns the build-time value first so the page paints immediately and
 * crawlers still see real content, then swaps in the fetched one.
 */

const TTL_MS = 30_000;

type Entry = { at: number; promise: Promise<StoreProduct | null> };
const cache = new Map<number, Entry>();

/**
 * One request per product, however many components ask.
 *
 * Three things on this page want the live product. Left alone that is three
 * identical requests on every page load, against a shop that rate-limits.
 */
export function fetchLiveProduct(id: number): Promise<StoreProduct | null> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;

  const promise = apiFetch(`${STORE_API}/products/${id}`)
    .then((r) => (r.ok ? (r.json() as Promise<StoreProduct>) : null))
    // The build's copy goes through decodeStoreProduct (see lib/wp); this
    // fetch is the same encoded shape from the same API and was skipping it —
    // a page painted with a correct name would flip to "&amp;" the moment
    // this landed.
    .then((p) => (p ? decodeStoreProduct(p) : null))
    .catch(() => null);

  cache.set(id, { at: Date.now(), promise });
  return promise;
}

/**
 * The freshest product available: the build's copy until the shop answers.
 *
 * Passing null is allowed and means "nothing to keep fresh" — a caller that
 * only sometimes has a product should not have to branch around the hook.
 */
export function useLiveProduct<T extends StoreProduct | null>(initial: T): T {
  const productId = initial?.id;
  const [product, setProduct] = useState(initial);

  useEffect(() => {
    if (!productId) return;
    let live = true;
    void fetchLiveProduct(productId).then((fresh) => {
      // A failed fetch leaves the build's copy standing, which is the right
      // fallback: slightly old beats blank.
      if (live && fresh) setProduct(fresh as T);
    });
    return () => {
      live = false;
    };
  }, [productId]);

  return product;
}
