import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-4">
      <p className="section-kicker">Final step</p>
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-plum-800">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
