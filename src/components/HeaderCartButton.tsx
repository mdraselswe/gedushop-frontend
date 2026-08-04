"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { cartItemsTotal } from "@/lib/cart-total";
import { CartIcon } from "./Icons";

export default function HeaderCartButton() {
  const { cart, drawerOpen, setDrawerOpen } = useCart();
  const count = cart?.items_count ?? 0;

  return (
    <Link
      href="/cart"
      onClick={(e) => {
        // Desktop: toggle the side drawer instead of leaving the page.
        if (window.innerWidth >= 1024) {
          e.preventDefault();
          setDrawerOpen(!drawerOpen);
        }
      }}
      className="relative flex items-center gap-2 rounded-full bg-coral-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-coral-600"
    >
      <CartIcon className="size-5" />
      <span className="hidden sm:inline">
        {cart && count > 0 ? formatPrice(cartItemsTotal(cart.totals), cart.totals) : "Cart"}
      </span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-plum-600 text-[11px] font-extrabold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
