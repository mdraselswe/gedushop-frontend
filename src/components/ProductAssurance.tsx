import { Banknote, Gift, RotateCcw, Truck } from "lucide-react";

const ROWS = [
  { Icon: Truck, title: "Delivery charge", sub: "Dhaka ৳80 · Outside ৳120" },
  { Icon: Gift, title: "Free delivery", sub: "On orders over ৳2000" },
  { Icon: Banknote, title: "Cash on Delivery", sub: "Pay when it arrives" },
  { Icon: RotateCcw, title: "Easy returns", sub: "Damaged or wrong item" },
] as const;

/** Delivery + trust reassurance block shown under the buy box. */
export default function ProductAssurance() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 sm:grid-cols-2">
      {ROWS.map(({ Icon, title, sub }) => (
        <div key={title} className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-500">
            <Icon className="size-4.5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold leading-tight text-plum-700">{title}</span>
            <span className="block text-xs text-plum-400">{sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
