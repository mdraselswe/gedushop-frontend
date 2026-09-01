"use client";

import { Banknote, Gift, RotateCcw, Truck } from "lucide-react";
import { useLiveProduct } from "@/lib/liveProduct";
import type { StoreProduct } from "@/lib/types";

const DELIVERY = [
  { Icon: Truck, title: "Delivery charge", sub: "Dhaka ৳80 · Outside ৳120" },
  { Icon: Gift, title: "Free delivery", sub: "On orders over ৳2000" },
] as const;

/**
 * The same two rows for a set that carries its own free delivery.
 *
 * The shop's general rates are still true, but on this page they answer the
 * wrong question. A customer reading "Dhaka ৳80" and "on orders over ৳2000"
 * above a ৳520 set concludes they will pay for delivery — and they will not.
 * Saying it once, plainly, beats leaving the offer to be discovered in the
 * cart, or contradicted here and confirmed further down the page.
 */
const DELIVERY_FREE = [
  { Icon: Truck, title: "Free delivery", sub: "Included with this combo" },
] as const;

const REST = [
  { Icon: Banknote, title: "Cash on Delivery", sub: "Pay when it arrives" },
  { Icon: RotateCcw, title: "Easy returns", sub: "Damaged or wrong item" },
] as const;

/**
 * Delivery + trust reassurance block shown under the buy box.
 *
 * Refetches like everything else on this page that makes a promise. The page
 * is HTML written at build time; whether a combo carries free delivery is a
 * setting somebody can change this afternoon, and the combo panel further down
 * already asks the shop. Reading a stale flag here would put the two in
 * disagreement about the same offer, on the same screen.
 */
export default function ProductAssurance({ product }: { product?: StoreProduct }) {
  const live = useLiveProduct(product ?? null);
  const freeDelivery = live?.extensions?.gedushop?.combo?.free_shipping === true;
  const rows = [...(freeDelivery ? DELIVERY_FREE : DELIVERY), ...REST];
  return (
    <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 sm:grid-cols-2">
      {rows.map(({ Icon, title, sub }, i) => {
        // Only the delivery row changes colour, and only when it is the offer
        // rather than the price list: a block where everything is highlighted
        // highlights nothing.
        const highlight = freeDelivery && i === 0;
        return (
          <div key={title} className="flex items-center gap-3">
            <span
              className={
                highlight
                  ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                  : "flex size-9 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-500"
              }
            >
              <Icon className="size-4.5" strokeWidth={2.25} />
            </span>
            <span className="min-w-0">
              <span
                className={
                  highlight
                    ? "block text-sm font-extrabold leading-tight text-emerald-700"
                    : "block text-sm font-extrabold leading-tight text-plum-700"
                }
              >
                {title}
              </span>
              <span className={highlight ? "block text-xs text-emerald-600" : "block text-xs text-plum-400"}>
                {sub}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
