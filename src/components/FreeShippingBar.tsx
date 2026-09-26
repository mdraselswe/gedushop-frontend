"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Check, Sparkles, Truck } from "lucide-react";
import type { CartItem, CartTotals } from "@/lib/types";
import { useStoreSettings } from "@/context/StoreSettingsContext";

const CONFETTI = [
  { x: -54, y: -30, delay: 0, color: "#E96D65" },
  { x: -34, y: -45, delay: 40, color: "#6B5CA8" },
  { x: -14, y: -36, delay: 80, color: "#F2B84B" },
  { x: 10, y: -44, delay: 20, color: "#35A873" },
  { x: 30, y: -34, delay: 70, color: "#EE8881" },
  { x: 50, y: -24, delay: 110, color: "#806FC0" },
  { x: -44, y: -12, delay: 120, color: "#35A873" },
  { x: 42, y: -8, delay: 150, color: "#F2B84B" },
] as const;

/**
 * Progress nudge: how much more to spend for free delivery. Boosts basket size.
 *
 * A free-delivery item replaces the bar rather than filling it in — a combo's
 * own promotion, or a plain product's. The spend threshold is one route to
 * free delivery and this flag is another, and telling somebody who already
 * has it to "add ৳800 more" would be both wrong and discouraging — the offer
 * they took would look as though it hadn't counted.
 */
export default function FreeShippingBar({
  totals,
  items = [],
}: {
  totals: CartTotals;
  items?: CartItem[];
}) {
  const { freeDeliveryMinimum: freeThreshold } = useStoreSettings();
  const hasFreeItem = items.some((i) => i.extensions?.gedushop?.free_shipping);
  const minor = totals.currency_minor_unit ?? 2;
  const subtotal = Number(totals.total_items) / 10 ** minor;
  const remaining = freeThreshold - subtotal;
  const pct = freeThreshold > 0 ? Math.min(100, Math.max(0, (subtotal / freeThreshold) * 100)) : 100;
  const unlocked = remaining <= 0;
  const achieved = hasFreeItem || unlocked;
  const previousAchieved = useRef(achieved);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (achieved && !previousAchieved.current) {
      setCelebrate(true);
      const timer = window.setTimeout(() => setCelebrate(false), 1100);
      previousAchieved.current = achieved;
      return () => window.clearTimeout(timer);
    }
    previousAchieved.current = achieved;
  }, [achieved]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3.5 shadow-[var(--shadow-soft)] ring-1 transition-[background-color,box-shadow] duration-500 ${
        achieved ? "bg-emerald-50 ring-emerald-200/80" : "bg-white ring-plum-100/60"
      }`}
    >
      {celebrate && (
        <span className="pointer-events-none absolute inset-0" aria-hidden>
          {CONFETTI.map((particle, index) => (
            <span
              key={index}
              className="shipping-confetti absolute left-1/2 top-1/2 size-1.5 rounded-sm"
              style={{
                "--confetti-x": `${particle.x}px`,
                "--confetti-y": `${particle.y}px`,
                "--confetti-delay": `${particle.delay}ms`,
                backgroundColor: particle.color,
              } as CSSProperties}
            />
          ))}
        </span>
      )}

      <div className="relative flex items-start gap-2.5">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${achieved ? "bg-emerald-100 text-emerald-700" : "bg-coral-50 text-coral-500"}`}>
          {achieved ? <Check className="size-4" strokeWidth={3} /> : <Truck className="size-4" strokeWidth={2.25} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`flex items-center gap-1.5 text-xs font-extrabold ${achieved ? "text-emerald-800" : "text-plum-700"}`}>
            {achieved ? (
              <><Sparkles className="size-3.5" /> Free delivery unlocked</>
            ) : (
              <><span className="text-coral-600">৳{Math.ceil(remaining)} away</span> from FREE delivery</>
            )}
          </span>
          <span className={`mt-0.5 block text-[11px] font-semibold leading-relaxed ${achieved ? "text-emerald-600" : "text-plum-400"}`}>
            {achieved
              ? hasFreeItem
                ? "An eligible item includes delivery with this order."
                : "Your cart reached the free-delivery goal."
              : "Add one more favourite to unlock delivery savings."}
          </span>
        </span>
        {!achieved && <span className="rounded-full bg-plum-50 px-2 py-1 text-[10px] font-extrabold text-plum-500">{Math.round(pct)}%</span>}
      </div>

      <div className={`relative mt-2.5 h-1.5 overflow-hidden rounded-full ${achieved ? "bg-emerald-100" : "bg-plum-100"}`}>
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${achieved ? "bg-emerald-500" : "bg-gradient-to-r from-coral-400 to-coral-500"}`}
          style={{ width: `${achieved ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}
