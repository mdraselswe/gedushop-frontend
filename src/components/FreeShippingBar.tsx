import { Truck } from "lucide-react";
import type { CartItem, CartTotals } from "@/lib/types";

const FREE_THRESHOLD = 2000; // ৳ — matches the free-delivery-over-৳2000 policy

/**
 * Progress nudge: how much more to spend for free delivery. Boosts basket size.
 *
 * A free-delivery combo replaces the bar rather than filling it in. The spend
 * threshold is one route to free delivery and a combo is another, and telling
 * somebody who already has it to "add ৳800 more" would be both wrong and
 * discouraging — the offer they took would look as though it hadn't counted.
 */
export default function FreeShippingBar({
  totals,
  items = [],
}: {
  totals: CartTotals;
  items?: CartItem[];
}) {
  const fromCombo = items.some((i) => i.extensions?.gedushop?.combo?.free_shipping);
  const minor = totals.currency_minor_unit ?? 2;
  const subtotal = Number(totals.total_items) / 10 ** minor;
  const remaining = FREE_THRESHOLD - subtotal;
  const pct = Math.min(100, Math.max(0, (subtotal / FREE_THRESHOLD) * 100));
  const unlocked = remaining <= 0;

  if (fromCombo) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-3.5 ring-1 ring-emerald-200/70">
        <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
          <Truck className="size-4 shrink-0" strokeWidth={2.25} />
          <span>🎉 FREE delivery is included with your combo</span>
        </p>
      </div>
    );
  }

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
