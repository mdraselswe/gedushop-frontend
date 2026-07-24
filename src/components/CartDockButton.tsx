"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { CartIcon } from "./Icons";

/** Chaldal-style docked tab on the right edge — opens the cart drawer. lg+ only. */
export default function CartDockButton() {
  const { cart, drawerOpen, setDrawerOpen } = useCart();
  const count = cart?.items_count ?? 0;

  if (drawerOpen) return null;

  return (
    <button
      onClick={() => setDrawerOpen(true)}
      aria-label="Open cart"
      className="fixed right-[max(0px,calc((100vw-120rem)/2))] top-1/3 z-40 hidden flex-col items-center overflow-hidden rounded-l-2xl shadow-lg shadow-plum-900/20 transition-transform hover:-translate-x-0.5 lg:flex"
    >
      <span className="flex flex-col items-center gap-1 bg-plum-600 px-4 pb-2.5 pt-3 text-white">
        <CartIcon className="size-6" />
        <span className="text-xs font-extrabold whitespace-nowrap">
          {count} item{count === 1 ? "" : "s"}
        </span>
      </span>
      <span className="w-full bg-coral-500 px-3 py-1.5 text-center text-xs font-extrabold text-white">
        {cart && count > 0 ? formatPrice(cart.totals.total_price, cart.totals) : "৳0"}
      </span>
    </button>
  );
}
