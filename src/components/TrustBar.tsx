import { Banknote, RotateCcw, Truck } from "lucide-react";

const ITEMS = [
  { Icon: Banknote, title: "Cash on Delivery", sub: "Pay when it arrives" },
  { Icon: Truck, title: "Nationwide", sub: "Delivery all over Bangladesh" },
  { Icon: RotateCcw, title: "Easy Returns", sub: "Hassle-free" },
];

export default function TrustBar() {
  return (
    <div className="fancy-surface grid grid-cols-3 gap-2 rounded-3xl p-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-12 sm:gap-y-3 sm:p-4 lg:gap-x-20">
      {ITEMS.map(({ Icon, title, sub }) => (
        <div
          key={title}
          className="flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center transition-colors hover:bg-white sm:flex-row sm:gap-2.5 sm:px-4 sm:text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-coral-50 to-plum-50 text-coral-500 ring-1 ring-coral-100/60 sm:size-10">
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
