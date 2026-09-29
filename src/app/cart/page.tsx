import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-4 lg:px-3 pt-3 sm:pt-4 lg:pt-3">
      <div className="grain relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#5a4884] via-[#7d4880] to-[#d65f57] p-5 text-white shadow-md shadow-plum-950/10">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-coral-400/20 blur-2xl" />
        <span aria-hidden className="pointer-events-none absolute -left-10 -bottom-16 size-48 rounded-full bg-violet-400/15 blur-2xl" />
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25 backdrop-blur-xs"><ShoppingBag className="size-6" /></span>
        <div className="relative"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70">Almost yours</p><h1 className="font-heading text-2xl font-semibold tracking-tight">Your Cart</h1></div>
      </div>
      <CartView />
    </div>
  );
}
