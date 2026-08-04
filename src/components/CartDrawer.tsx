"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { decodeEntities } from "@/lib/decode";
import { formatPrice } from "@/lib/format";
import { cartItemsTotal } from "@/lib/cart-total";
import { CartIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./Icons";
import FreeShippingBar from "./FreeShippingBar";
import CouponField from "./CouponField";

function productSlug(permalink?: string): string | null {
  if (!permalink) return null;
  try {
    const parts = new URL(permalink).pathname.replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

/** Right-side cart drawer (Chaldal-style). Slides in on add-to-cart, lg+ only. */
export default function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, setQuantity, removeItem, pendingIds } = useCart();
  const count = cart?.items_count ?? 0;

  return (
    <div
      className={`fixed right-0 top-0 z-50 hidden h-dvh w-[21rem] flex-col bg-white shadow-2xl shadow-plum-900/20 transition-transform duration-300 lg:flex ${
        drawerOpen ? "translate-x-0" : "translate-x-full"
      }`}
      role="dialog"
      aria-label="Shopping cart"
      aria-hidden={!drawerOpen}
    >
      <div className="flex items-center justify-between border-b border-plum-100 bg-plum-600 px-4 py-3 text-white">
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <CartIcon className="size-5" />
          {count} item{count === 1 ? "" : "s"}
        </span>
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Close cart"
          className="rounded-full p-1.5 transition-colors hover:bg-plum-700"
        >
          <CloseIcon className="size-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!cart || cart.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-plum-50">
              <CartIcon className="size-8 text-plum-300" strokeWidth={1.75} />
            </span>
            <p className="text-sm font-semibold text-plum-400">Cart is empty</p>
          </div>
        ) : (
          <ul className="divide-y divide-plum-50">
            {cart.items.map((item) => {
              const busy = pendingIds.has(item.id);
              const slug = productSlug(item.permalink);
              return (
                <li key={item.key} className="flex items-center gap-3 px-4 py-3">
                  <Link
                    href={slug ? `/product/${slug}` : "#"}
                    onClick={() => setDrawerOpen(false)}
                    className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-plum-50"
                  >
                    {item.images[0] ? (
                      <Image
                        src={item.images[0].thumbnail || item.images[0].src}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center">
                        <CartIcon className="size-5 text-plum-200" strokeWidth={1.75} />
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={slug ? `/product/${slug}` : "#"}
                      onClick={() => setDrawerOpen(false)}
                      className="line-clamp-2 text-xs font-semibold leading-snug text-plum-800 transition-colors hover:text-coral-500"
                    >
                      {decodeEntities(item.name)}
                    </Link>
                    {item.variation && item.variation.length > 0 && (
                      <p className="mt-0.5 text-[11px] font-semibold text-plum-400">
                        {item.variation.map((v) => `${v.attribute}: ${v.value}`).join(" · ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs font-extrabold text-plum-600 tabular-nums">
                      {formatPrice(item.totals.line_subtotal, item.totals)}
                      {Number(item.prices.regular_price) > Number(item.prices.price) && (
                        <span className="ml-1.5 font-semibold text-plum-300 line-through">
                          {formatPrice(String(Number(item.prices.regular_price) * item.quantity), item.prices)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => removeItem(item.key)}
                      disabled={busy}
                      aria-label="Remove item"
                      className="text-plum-300 transition-colors hover:text-coral-500 disabled:opacity-50"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                    <div className="flex items-center rounded-full border border-plum-200">
                      <button
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                        disabled={busy}
                        aria-label="Decrease quantity"
                        className="flex size-6 items-center justify-center text-plum-600 disabled:opacity-50"
                      >
                        <MinusIcon className="size-3" />
                      </button>
                      <span className="min-w-5 text-center text-xs font-extrabold text-plum-700">
                        {busy ? "…" : item.quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                        disabled={busy}
                        aria-label="Increase quantity"
                        className="flex size-6 items-center justify-center text-plum-600 disabled:opacity-50"
                      >
                        <PlusIcon className="size-3" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {cart && cart.items.length > 0 && (
        <div className="border-t border-plum-100 p-3">
          <div className="mb-3">
            <FreeShippingBar totals={cart.totals} />
          </div>
          <div className="mb-3">
            <CouponField />
          </div>
          <Link
            href="/checkout"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-between rounded-full bg-coral-500 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-coral-500/30 transition-colors hover:bg-coral-600"
          >
            <span>Checkout</span>
            <span className="rounded-full bg-white/20 px-3 py-0.5">
              {formatPrice(cartItemsTotal(cart.totals), cart.totals)}
            </span>
          </Link>
          <Link
            href="/cart"
            onClick={() => setDrawerOpen(false)}
            className="mt-2 block text-center text-xs font-bold text-plum-400 hover:text-plum-600"
          >
            View full cart
          </Link>
        </div>
      )}
    </div>
  );
}
