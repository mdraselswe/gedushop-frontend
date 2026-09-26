import type { Metadata } from "next";
import { Radar } from "lucide-react";
import OrderTracker from "@/components/OrderTracker";

export const metadata: Metadata = {
  title: "Track Your Order",
  robots: { index: false, follow: false },
};

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <div className="grain flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-plum-700 via-plum-600 to-coral-500 p-5 text-white shadow-[var(--shadow-lift)] sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Radar className="size-6" /></span>
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">Live progress</p><h1 className="font-heading text-2xl font-semibold tracking-tight">Track Your Order</h1><p className="mt-1 text-sm text-white/75">Enter your order number and mobile number — no login needed.</p></div>
      </div>
      <OrderTracker />
    </div>
  );
}
