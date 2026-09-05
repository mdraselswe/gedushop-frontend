import type { Metadata } from "next";
import OrderTracker from "@/components/OrderTracker";

export const metadata: Metadata = {
  title: "Track Your Order",
  robots: { index: false, follow: false },
};

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">Track Your Order</h1>
      <p className="mt-1 text-sm text-plum-500">
        Enter your order number and the mobile number you ordered with — no login needed.
      </p>
      <OrderTracker />
    </div>
  );
}
