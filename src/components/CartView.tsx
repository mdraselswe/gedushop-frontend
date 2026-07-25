"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { decodeEntities } from "@/lib/decode";
import { formatPrice } from "@/lib/format";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon } from "./Icons";
import CouponField from "./CouponField";
import FreeShippingBar from "./FreeShippingBar";

/** Store API cart items carry the WP permalink; grab the last path segment as our route slug. */
function productSlug(permalink?: string): string | null {
  if (!permalink) return null;
  try {
    const parts = new URL(permalink).pathname.replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

export default function CartView() {
  const { cart, loading, setQuantity, removeItem, pendingIds } = useCart();

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-plum-50">
          <CartIcon className="size-9 text-plum-300" strokeWidth={1.75} />
        </span>
        <p className="font-semibold text-plum-500">Your cart is empty</p>
        <Link
          href="/"
          className="rounded-full bg-coral-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-coral-600"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 pb-6">
      <FreeShippingBar totals={cart.totals} />
      {cart.items.map((item) => {
        const busy = pendingIds.has(item.id);
        const slug = productSlug(item.permalink);
        return (
          <div key={item.key} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
            <Link
              href={slug ? `/product/${slug}` : "#"}
              className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-plum-50 to-coral-50/40"
            >
              {item.images[0] && (
                <Image src={item.images[0].thumbnail || item.images[0].src} alt={item.name} fill sizes="64px" className="object-cover" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={slug ? `/product/${slug}` : "#"}
                className="line-clamp-2 text-sm font-semibold text-plum-800 transition-colors hover:text-coral-500"
              >
                {decodeEntities(item.name)}
              </Link>
              <p className="mt-0.5 text-sm font-extrabold text-plum-600 tabular-nums">
                {formatPrice(item.totals.line_total, item.totals)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => removeItem(item.key)}
                disabled={busy}
                aria-label="Remove item"
                className="text-plum-300 transition-colors hover:text-coral-500 disabled:opacity-50"
              >
                <TrashIcon className="size-4" />
              </button>
              <div className="flex items-center gap-1 rounded-full border border-plum-200">
                <button
                  onClick={() => setQuantity(item.key, item.quantity - 1)}
                  disabled={busy}
                  aria-label="Decrease quantity"
                  className="flex size-8 items-center justify-center text-plum-600 disabled:opacity-50"
                >
                  <MinusIcon className="size-3.5" />
                </button>
                <span className="min-w-5 text-center text-sm font-extrabold text-plum-700">
                  {busy ? "…" : item.quantity}
                </span>
                <button
                  onClick={() => setQuantity(item.key, item.quantity + 1)}
                  disabled={busy}
                  aria-label="Increase quantity"
                  className="flex size-8 items-center justify-center text-plum-600 disabled:opacity-50"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
        <div className="flex justify-between text-sm font-semibold text-plum-500">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPrice(cart.totals.total_items, cart.totals)}</span>
        </div>
        {Number(cart.totals.total_discount) > 0 && (
          <div className="mt-1 flex justify-between text-sm font-semibold text-emerald-600">
            <span>Discount</span>
            <span className="tabular-nums">−{formatPrice(cart.totals.total_discount, cart.totals)}</span>
          </div>
        )}
        <CouponField />
        <div className="mt-3 flex items-center justify-between border-t border-plum-100 pt-3 text-lg font-extrabold text-plum-800">
          <span>Total</span>
          <span className="tabular-nums">
            {formatPrice(String(Number(cart.totals.total_items) - Number(cart.totals.total_discount)), cart.totals)}
          </span>
        </div>
        <p className="mt-1 text-right text-xs font-semibold text-plum-400">+ delivery calculated at checkout</p>
        <Link
          href="/checkout"
          className="mt-4 block rounded-full bg-coral-500 py-3.5 text-center text-sm font-extrabold text-white shadow-[var(--shadow-coral)] transition-all hover:bg-coral-600 active:scale-[0.98]"
        >
          Checkout — Cash on Delivery
        </Link>
      </div>
    </div>
  );
}
