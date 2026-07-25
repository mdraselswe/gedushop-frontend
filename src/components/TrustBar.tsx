import { Banknote, RotateCcw, Truck } from "lucide-react";

const ITEMS = [
  { Icon: Banknote, title: "Cash on Delivery", sub: "Pay when it arrives" },
  { Icon: Truck, title: "Nationwide", sub: "Delivery all over Bangladesh" },
  { Icon: RotateCcw, title: "Easy Returns", sub: "Hassle-free" },
];

export default function TrustBar() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/70 p-2 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-12 sm:gap-y-3 sm:p-4 lg:gap-x-20">
      {ITEMS.map(({ Icon, title, sub }) => (
        <div
          key={title}
          className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-1.5 text-center sm:flex-row sm:gap-2.5 sm:px-3 sm:text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-500 sm:size-10">
            <Icon className="size-4.5" strokeWidth={2.25} />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-extrabold leading-tight text-plum-700 sm:truncate sm:text-sm">
              {title}
            </span>
            <span className="hidden text-[11px] text-plum-400 sm:block sm:truncate">{sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
