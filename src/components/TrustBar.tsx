import { Banknote, RotateCcw, Truck } from "lucide-react";

const ITEMS = [
  { Icon: Banknote, title: "Cash on Delivery", sub: "Pay when it arrives" },
  { Icon: Truck, title: "Nationwide", sub: "Delivery all over Bangladesh" },
  { Icon: RotateCcw, title: "Easy Returns", sub: "Hassle-free" },
];

export default function TrustBar() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/70 p-2 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 sm:gap-3 sm:p-3">
      {ITEMS.map(({ Icon, title, sub }) => (
        <div key={title} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 sm:px-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-500 sm:size-10">
            <Icon className="size-4.5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-extrabold text-plum-700 sm:text-sm">{title}</span>
            <span className="hidden truncate text-[11px] text-plum-400 sm:block">{sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
