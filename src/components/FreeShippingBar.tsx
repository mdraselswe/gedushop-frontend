import { Truck } from "lucide-react";
import type { CartTotals } from "@/lib/types";

const FREE_THRESHOLD = 2000; // ৳ — matches the free-delivery-over-৳2000 policy

/** Progress nudge: how much more to spend for free delivery. Boosts basket size. */
export default function FreeShippingBar({ totals }: { totals: CartTotals }) {
  const minor = totals.currency_minor_unit ?? 2;
  const subtotal = Number(totals.total_items) / 10 ** minor;
  const remaining = FREE_THRESHOLD - subtotal;
  const pct = Math.min(100, Math.max(0, (subtotal / FREE_THRESHOLD) * 100));
  const unlocked = remaining <= 0;

  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
      <p className="flex items-center gap-1.5 text-xs font-bold text-plum-700">
        <Truck className="size-4 shrink-0 text-coral-500" strokeWidth={2.25} />
        {unlocked ? (
          <span>🎉 You’ve unlocked FREE delivery!</span>
        ) : (
          <span>
            Add <span className="text-coral-600">৳{Math.ceil(remaining)}</span> more for FREE delivery
          </span>
        )}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-plum-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-coral-400 to-coral-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
