"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import type { StoreProduct } from "@/lib/types";

/**
 * Mobile-only sticky add-to-cart bar. Slides up once the main buy box scrolls
 * out of view so the CTA is always reachable on long product pages. Sits above
 * the bottom nav (bottom-16).
 */
export default function StickyBuyBar({ product }: { product: StoreProduct }) {
  const [show, setShow] = useState(false);
  const { addItem, pendingIds } = useCart();
  const available = product.is_purchasable && product.is_in_stock;

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!available) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-40 border-t border-plum-100 bg-white/95 px-4 py-2.5 backdrop-blur transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "pointer-events-none translate-y-[250%]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-plum-500">{product.name}</div>
          <div className="text-lg font-extrabold leading-tight text-plum-700 tabular-nums">
            {formatPrice(product.prices.price, product.prices)}
          </div>
        </div>
        <button
          onClick={() => addItem(product.id)}
          disabled={pendingIds.has(product.id)}
          className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-coral-500 px-6 py-2.5 text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition-transform active:scale-95 disabled:opacity-60"
        >
          <ShoppingCart className="size-4.5" strokeWidth={2.25} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
