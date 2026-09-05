"use client";

import Link from "next/link";
import { ImageOff, PackageCheck, Truck } from "lucide-react";
import type { StoreProduct } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useLiveProduct } from "@/lib/liveProduct";

/**
 * What is actually in a combo, on the combo's own page.
 *
 * A combo is an ordinary product here — one price, one line in the cart — so
 * without this the page is a photograph and a number, and the shopper has no
 * way to know whether the set contains the thing they came for. The saving is
 * the other half: a combo that doesn't say what it saves is just a product
 * with a confusing name.
 *
 * Reads the live product rather than the build's copy, for the same reason the
 * buy box does. A combo whose price or recipe changed used to show the new
 * price at the top of the page and the old price, old saving and old contents
 * in this box — a shopper being quoted two different prices for one thing.
 */
export default function ComboContents({ product: initial }: { product: StoreProduct }) {
  const product = useLiveProduct(initial);
  const combo = product.extensions?.gedushop?.combo;
  const prices = product.prices;
  // The recipe was taken off the product between the build and now.
  if (!combo) return null;

  const price = Number(prices.price);
  const saving = Math.max(0, combo.components_total - price);
  const percent = combo.components_total > 0 ? Math.round((saving / combo.components_total) * 100) : 0;

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight text-plum-800">
          <PackageCheck className="size-5 text-coral-500" strokeWidth={2.25} />
          What&rsquo;s in this combo
        </h2>
        {/* Singular matters here now that a set can be one product taken
            twice — a buy-one-get-one would have read "1 products". */}
        <span className="text-xs font-bold text-plum-400">
          {combo.items.length} {combo.items.length === 1 ? "product" : "products"}
        </span>
      </div>

      {combo.flexible_variants && (
        <p className="mt-3 rounded-xl bg-plum-50 px-3 py-2 text-sm text-plum-700">
          স্টক অনুযায়ী মিশ্র রং/ভ্যারিয়েন্ট দেওয়া হবে। মোট পণ্যের সংখ্যা একই থাকবে।
        </p>
      )}
      <ul className="mt-4 divide-y divide-plum-100/70">
        {combo.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <Link
              href={`/product/${item.slug}`}
              className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-plum-50 to-coral-50/40"
            >
              {item.image ? (
                // Plain <img> for the same reason the cards use one — the static
                // export cannot run the Next optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center">
                  <ImageOff className="size-5 text-plum-200" strokeWidth={1.5} />
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.slug}`}
                className="line-clamp-2 text-sm font-semibold leading-snug text-plum-800 hover:text-coral-600"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-xs font-bold text-plum-400">
                {formatPrice(String(item.price), prices)} each
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-plum-50 px-2.5 py-1 text-xs font-extrabold text-plum-600 tabular-nums">
              ×{item.qty}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1.5 border-t border-plum-100 pt-3.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-plum-400">Bought separately</span>
          <span className="font-bold text-plum-400 line-through tabular-nums">
            {formatPrice(String(combo.components_total), prices)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-plum-700">Combo price</span>
          <span className="text-lg font-extrabold tracking-tight text-plum-800 tabular-nums">
            {formatPrice(prices.price, prices)}
          </span>
        </div>
        {saving > 0 && (
          <p className="flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-700">
            <span>You save</span>
            <span className="tabular-nums">
              {formatPrice(String(saving), prices)}
              {percent > 0 && ` (${percent}%)`}
            </span>
          </p>
        )}
        {combo.free_shipping && (
          <p className="flex items-center gap-1.5 pt-1 text-sm font-extrabold text-emerald-700">
            <Truck className="size-4 shrink-0" strokeWidth={2.25} />
            FREE delivery with this combo
          </p>
        )}
      </div>
    </section>
  );
}
