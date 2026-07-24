"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { CartIcon } from "./Icons";

/** Chaldal-style sticky order bar — appears once the cart has items. Mobile only. */
export default function FloatingCartBar() {
  const { cart } = useCart();
  const pathname = usePathname();

  const count = cart?.items_count ?? 0;
  if (!cart || count === 0) return null;
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-40 px-4 md:hidden">
      <Link
        href="/cart"
        className="mx-auto flex max-w-md items-center justify-between rounded-full bg-plum-600 px-5 py-3 text-white shadow-lg shadow-plum-600/30 active:scale-[0.98] transition-transform"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <CartIcon className="size-5" />
          {count} item{count > 1 ? "s" : ""}
        </span>
        <span className="text-sm font-extrabold">
          {formatPrice(cart.totals.total_price, cart.totals)} · View Cart →
        </span>
      </Link>
    </div>
  );
}
