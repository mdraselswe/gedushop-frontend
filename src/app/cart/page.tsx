import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">Your Cart</h1>
      <CartView />
    </div>
  );
}
