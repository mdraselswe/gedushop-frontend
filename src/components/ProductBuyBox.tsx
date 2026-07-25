"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { apiFetch, STORE_API } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { fbTrack } from "@/lib/pixel";
import { discountPercent, formatPrice } from "@/lib/format";
import { addRecent } from "@/lib/recentlyViewed";
import type { StoreProduct } from "@/lib/types";

/**
 * Price + quantity + Add-to-cart / Buy-now as a live client island. Paints with
 * the build snapshot, then refetches on mount so stock/price stay real-time
 * (e.g. after other customers order) — no rebuild needed.
 */
export default function ProductBuyBox({ product: initial }: { product: StoreProduct }) {
  const [product, setProduct] = useState(initial);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const router = useRouter();
  const { addItem, pendingIds } = useCart();

  // Variable products: track the selected value (slug) per variation attribute.
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    (initial.attributes ?? []).forEach((a) => {
      if (!a.has_variations) return;
      const def = a.terms.find((t) => t.default) ?? (a.terms.length === 1 ? a.terms[0] : undefined);
      if (def) init[a.name] = def.slug;
    });
    return init;
  });

  useEffect(() => {
    const minor = initial.prices.currency_minor_unit ?? 2;
    fbTrack("ViewContent", {
      content_ids: [initial.id],
      content_name: initial.name,
      content_type: "product",
      value: Number(initial.prices.price) / 10 ** minor,
      currency: "BDT",
    });
    addRecent({
      slug: initial.slug,
      name: initial.name,
      image: initial.images[0]?.thumbnail || initial.images[0]?.src,
      price: formatPrice(initial.prices.price, initial.prices),
    });
  }, [initial.id, initial.name, initial.prices, initial.slug, initial.images]);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${STORE_API}/products?slug=${encodeURIComponent(initial.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((list: StoreProduct[] | null) => {
        if (!cancelled && list && list[0]) setProduct(list[0]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initial.slug]);

  const discount = discountPercent(product.prices);
  const available = product.is_purchasable && product.is_in_stock;
  const busy = pendingIds.has(product.id) || buying;

  const variationAttrs = (product.attributes ?? []).filter((a) => a.has_variations);
  const isVariable = product.type === "variable" && variationAttrs.length > 0;
  const needsSelection = isVariable && !variationAttrs.every((a) => selected[a.name]);
  const variation = isVariable
    ? variationAttrs.map((a) => ({ attribute: a.name, value: selected[a.name] }))
    : undefined;

  async function buyNow() {
    if (!available || needsSelection) return;
    setBuying(true);
    try {
      const ok = await addItem(product.id, qty, variation);
      if (ok) router.push("/checkout");
    } finally {
      setBuying(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex items-baseline gap-2.5">
        <span className="text-3xl font-extrabold tracking-tight text-plum-700 tabular-nums">
          {formatPrice(product.prices.price, product.prices)}
        </span>
        {product.on_sale && (
          <>
            <span className="text-base text-plum-300 line-through tabular-nums">
              {formatPrice(product.prices.regular_price, product.prices)}
            </span>
            {discount && (
              <span className="rounded-full bg-coral-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-[var(--shadow-coral)]">
                -{discount}%
              </span>
            )}
          </>
        )}
      </div>

      <p className={`mt-2 text-sm font-bold ${available ? "text-emerald-600" : "text-coral-600"}`}>
        {available ? "In stock — ready to ship" : "Out of stock"}
      </p>

      {available && (
        <div className="mt-5 space-y-3">
          {/* Variation selectors (variable products) */}
          {isVariable &&
            variationAttrs.map((a) => (
              <div key={a.id}>
                <span className="text-sm font-bold capitalize text-plum-500">{a.name}</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {a.terms.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected((s) => ({ ...s, [a.name]: t.slug }))}
                      className={`rounded-full px-4 py-1.5 text-sm font-bold ring-1 transition-colors ${
                        selected[a.name] === t.slug
                          ? "bg-plum-600 text-white ring-plum-600"
                          : "bg-white text-plum-700 ring-plum-200 hover:ring-plum-400"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-plum-500">Quantity</span>
            <div className="flex items-center rounded-full ring-1 ring-plum-200">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                className="flex size-10 items-center justify-center rounded-full text-plum-600 transition-colors hover:text-coral-500 disabled:opacity-40"
              >
                <Minus className="size-4" strokeWidth={2.5} />
              </button>
              <span className="min-w-8 text-center text-base font-extrabold text-plum-800 tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex size-10 items-center justify-center rounded-full text-plum-600 transition-colors hover:text-coral-500"
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={() => addItem(product.id, qty, variation)}
              disabled={busy || needsSelection}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-plum-600 bg-white py-3 text-sm font-extrabold text-plum-700 transition-all hover:bg-plum-50 active:scale-[0.98] disabled:opacity-60"
            >
              <ShoppingCart className="size-4.5" strokeWidth={2.25} />
              {needsSelection ? "Select options" : "Add to Cart"}
            </button>
            <button
              onClick={buyNow}
              disabled={busy || needsSelection}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-coral-500 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-600 active:scale-[0.98] disabled:opacity-60"
            >
              {buying ? <Loader2 className="size-4.5 animate-spin" /> : <Zap className="size-4.5" strokeWidth={2.25} />}
              Buy Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
