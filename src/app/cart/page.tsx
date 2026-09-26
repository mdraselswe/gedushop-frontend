import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <div className="grain flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-plum-700 to-plum-500 p-5 text-white shadow-[var(--shadow-lift)]">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><ShoppingBag className="size-6" /></span>
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">Almost yours</p><h1 className="font-heading text-2xl font-semibold tracking-tight">Your Cart</h1></div>
      </div>
      <CartView />
    </div>
  );
}
