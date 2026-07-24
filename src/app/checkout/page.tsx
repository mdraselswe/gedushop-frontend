import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
