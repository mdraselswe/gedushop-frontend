"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";
import type { StoreProduct } from "@/lib/types";
import { comboSaving } from "@/lib/wp";
import { formatPrice } from "@/lib/format";
import { fetchLiveProduct } from "@/lib/liveProduct";

/**
 * "There is a cheaper way to buy this" — on the product's own page.
 *
 * The one place a combo actually gets sold. Nobody browses a combo listing;
 * they arrive at the aeroplane they came for, and this is what tells them the
 * aeroplane plus its batteries costs less as a set.
 *
 * The saving is refetched rather than taken from the build. This panel quotes
 * a price for a product the shopper is about to click through to, and a stale
 * one sends them to a page showing something else — the worst version of which
 * is advertising a saving on a combo whose price has since gone up.
 */
export default function ComboCrossSell({
  combos: initial,
  currency,
}: {
  combos: StoreProduct[];
  /** Any product's prices — only the minor-unit scale is read from it. */
  currency: StoreProduct["prices"];
}) {
  const [combos, setCombos] = useState(initial);

  useEffect(() => {
    let live = true;
    void Promise.all(initial.map((c) => fetchLiveProduct(c.id))).then((fresh) => {
      // Each combo keeps its build copy if its own fetch failed.
      if (live) setCombos(initial.map((c, i) => fresh[i] ?? c));
    });
    return () => {
      live = false;
    };
  }, [initial]);

  const offers = combos
    .map((c) => ({ combo: c, saving: comboSaving(c) }))
    // A "combo" that saves nothing is not an offer, and dressing it up as one
    // is the fastest way to make every badge on the site worth ignoring.
    .filter((o) => o.saving > 0 && o.combo.is_in_stock && o.combo.is_purchasable)
    .sort((a, b) => b.saving - a.saving);

  if (offers.length === 0) return null;

  return (
    <section className="mt-5 rounded-3xl bg-gradient-to-br from-coral-50 to-plum-50 p-4 ring-1 ring-coral-100">
      <h2 className="flex items-center gap-1.5 font-heading text-sm font-semibold tracking-tight text-plum-800">
        <Sparkles className="size-4 text-coral-500" strokeWidth={2.25} />
        Buy it as a set and save
      </h2>

      <ul className="mt-3 space-y-2">
        {offers.map(({ combo, saving }) => {
          const image = combo.images[0];
          return (
            <li key={combo.id}>
              <Link
                href={`/product/${combo.slug}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-plum-50">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.thumbnail || image.src}
                      alt={image.alt || combo.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <ImageOff className="size-4 text-plum-200" strokeWidth={1.5} />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm font-semibold leading-snug text-plum-800">
                    {combo.name}
                  </span>
                  <span className="mt-0.5 block text-xs font-extrabold text-emerald-600">
                    Save {formatPrice(String(saving), currency)}
                    {combo.extensions?.gedushop?.combo?.free_shipping && " · FREE delivery"}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-extrabold tracking-tight text-plum-700 tabular-nums">
                  {formatPrice(combo.prices.price, combo.prices)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
