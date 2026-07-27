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

  const variationAttrs = (product.attributes ?? []).filter((a) => a.has_variations);
  const isVariable = product.type === "variable" && variationAttrs.length > 0;
  const needsSelection = isVariable && !variationAttrs.every((a) => selected[a.name]);
  const variation = isVariable
    ? variationAttrs.map((a) => ({ attribute: a.name, value: selected[a.name] }))
    : undefined;

  // Per-variation data (price, stock, image) — the Store API lists variations as
  // products of type "variation" under a parent.
  const [varList, setVarList] = useState<StoreProduct[] | null>(null);
  useEffect(() => {
    if (initial.type !== "variable") return;
    let cancelled = false;
    apiFetch(`${STORE_API}/products?type=variation&parent=${initial.id}&per_page=100`)
      .then((r) => (r.ok ? r.json() : null))
      .then((list: StoreProduct[] | null) => {
        if (!cancelled && Array.isArray(list)) setVarList(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initial.id, initial.type]);

  // The variation matching the current (complete) selection. Empty attribute
  // value on a variation means "any".
  const matched =
    isVariable && !needsSelection
      ? (product.variations ?? []).find((v) =>
          v.attributes.every((at) => {
            const key = Object.keys(selected).find((k) => k.toLowerCase() === at.name.toLowerCase());
            return !at.value || (key && selected[key] === at.value);
          }),
        )
      : undefined;
  const varData = matched ? varList?.find((p) => p.id === matched.id) : undefined;

  /** A term is offered if some variation with it (compatible with the other
   *  selections) exists and isn't known to be out of stock. */
  function termAvailable(attrName: string, slug: string): boolean {
    if (!isVariable) return true;
    return (product.variations ?? []).some((v) => {
      const own = v.attributes.find((at) => at.name.toLowerCase() === attrName.toLowerCase());
      if (own && own.value && own.value !== slug) return false;
      for (const [k, val] of Object.entries(selected)) {
        if (k.toLowerCase() === attrName.toLowerCase() || !val) continue;
        const at = v.attributes.find((a) => a.name.toLowerCase() === k.toLowerCase());
        if (at && at.value && at.value !== val) return false;
      }
      const d = varList?.find((p) => p.id === v.id);
      return d ? d.is_in_stock && d.is_purchasable : true;
    });
  }

  // Live values: once a variation is selected, its price/stock win.
  const shownPrices = varData?.prices ?? product.prices;
  const shownOnSale = varData ? varData.on_sale : product.on_sale;
  const discount = discountPercent(shownPrices);
  const available = varData
    ? varData.is_purchasable && varData.is_in_stock
    : product.is_purchasable && product.is_in_stock;
  const busy = pendingIds.has(product.id) || buying;

  // Tell the gallery to show the selected variation's own photo (if any).
  const varImage = varData?.images?.[0];
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("gedu:variation-image", { detail: varImage ?? null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varImage?.id]);

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
          {formatPrice(shownPrices.price, shownPrices)}
        </span>
        {shownOnSale && (
          <>
            <span className="text-base text-plum-300 line-through tabular-nums">
              {formatPrice(shownPrices.regular_price, shownPrices)}
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
        {isVariable && needsSelection
          ? available
            ? "Select an option to see availability"
            : "Out of stock"
          : available
            ? "In stock — ready to ship"
            : "Out of stock"}
      </p>

      {(available || isVariable) && (
        <div className="mt-5 space-y-3">
          {/* Variation selectors: color swatches when WP provides a hex, pills otherwise */}
          {isVariable &&
            variationAttrs.map((a) => {
              const colorMap = product.extensions?.gedushop?.attribute_colors?.[a.taxonomy ?? ""] ?? {};
              const chosen = a.terms.find((t) => t.slug === selected[a.name]);
              return (
                <div key={a.id}>
                  <span className="text-sm font-bold capitalize text-plum-500">
                    {a.name}
                    {chosen && <span className="text-plum-800">: {chosen.name}</span>}
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {a.terms.map((t) => {
                      const hex = colorMap[t.slug];
                      const active = selected[a.name] === t.slug;
                      const enabled = termAvailable(a.name, t.slug);
                      if (hex) {
                        return (
                          <button
                            key={t.id}
                            onClick={() => enabled && setSelected((s) => ({ ...s, [a.name]: t.slug }))}
                            disabled={!enabled}
                            title={enabled ? t.name : `${t.name} — out of stock`}
                            aria-label={`${a.name}: ${t.name}${enabled ? "" : " (out of stock)"}`}
                            className={`relative size-9 rounded-full ring-2 ring-offset-2 transition-all ${
                              active ? "ring-plum-600" : "ring-plum-100 hover:ring-plum-300"
                            } ${enabled ? "" : "cursor-not-allowed opacity-35"}`}
                            style={{ backgroundColor: hex }}
                          >
                            {!enabled && (
                              <span className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,transparent_46%,white_46%,white_54%,transparent_54%)]" />
                            )}
                          </button>
                        );
                      }
                      return (
                        <button
                          key={t.id}
                          onClick={() => enabled && setSelected((s) => ({ ...s, [a.name]: t.slug }))}
                          disabled={!enabled}
                          className={`rounded-full px-4 py-1.5 text-sm font-bold ring-1 transition-colors ${
                            active
                              ? "bg-plum-600 text-white ring-plum-600"
                              : "bg-white text-plum-700 ring-plum-200 hover:ring-plum-400"
                          } ${enabled ? "" : "cursor-not-allowed opacity-40 line-through"}`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

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
              disabled={busy || needsSelection || !available}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-plum-600 bg-white py-3 text-sm font-extrabold text-plum-700 transition-all hover:bg-plum-50 active:scale-[0.98] disabled:opacity-60"
            >
              <ShoppingCart className="size-4.5" strokeWidth={2.25} />
              {needsSelection ? "Select options" : !available ? "Out of stock" : "Add to Cart"}
            </button>
            <button
              onClick={buyNow}
              disabled={busy || needsSelection || !available}
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
