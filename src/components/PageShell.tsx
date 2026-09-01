"use client";

import { useCart } from "@/context/CartContext";

/**
 * Everything the cart drawer must not cover.
 *
 * The drawer is fixed to the right edge, so left alone it lies on top of the
 * page — and on a product grid that means the last column vanishes underneath
 * it. Padding the page by the drawer's width instead makes the content reflow
 * into what is left, so nothing is ever hidden behind it. lg+ only, which is
 * where the drawer exists at all; below that it never opens.
 *
 * The 21rem and the 300ms both mirror CartDrawer, so the page and the drawer
 * move as one.
 */
export default function PageShell({ children }: { children: React.ReactNode }) {
  const { drawerOpen } = useCart();

  return (
    <div
      className={`flex flex-1 flex-col transition-[padding] duration-300 ${
        drawerOpen ? "lg:pr-[21rem]" : ""
      }`}
    >
      {children}
    </div>
  );
}
