"use client";

import { useEffect, useState } from "react";
import { apiFetch, STORE_API } from "@/lib/api";
import { discountPercent, formatPrice } from "@/lib/format";
import type { StoreProduct } from "@/lib/types";
import AddToCartButton from "./AddToCartButton";

/**
 * Price + stock + add-to-cart as a live client island. Paints instantly with
 * the build-time snapshot, then refetches the product on mount so stock/price
 * reflect real-time state (e.g. after other customers order) — no rebuild needed.
 */
export default function ProductBuyBox({ product: initial }: { product: StoreProduct }) {
  const [product, setProduct] = useState(initial);

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

      <div className="mt-6 flex items-center gap-3">
        <AddToCartButton productId={product.id} disabled={!product.is_purchasable || !product.is_in_stock} />
        <span className={`text-sm font-bold ${product.is_in_stock ? "text-emerald-600" : "text-coral-600"}`}>
          {product.is_in_stock ? "In stock — order now" : "Out of stock"}
        </span>
      </div>
    </>
  );
}
