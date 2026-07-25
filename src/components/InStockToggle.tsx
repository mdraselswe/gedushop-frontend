"use client";

import { Check } from "lucide-react";
import { useInStock } from "@/context/InStockContext";

/** Global "In stock only" filter chip — drops out-of-stock products from listings. */
export default function InStockToggle({ className = "" }: { className?: string }) {
  const { inStockOnly, setInStockOnly } = useInStock();

  return (
    <button
      onClick={() => setInStockOnly(!inStockOnly)}
      aria-pressed={inStockOnly}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
        inStockOnly
          ? "bg-coral-500 text-white shadow-[var(--shadow-coral)]"
          : "bg-white text-plum-600 ring-1 ring-plum-200 hover:ring-coral-300"
      } ${className}`}
    >
      <span
        className={`flex size-4 items-center justify-center rounded-full ${
          inStockOnly ? "bg-white/25" : "ring-1 ring-plum-300"
        }`}
      >
        {inStockOnly && <Check className="size-3" strokeWidth={3} />}
      </span>
      In stock only
    </button>
  );
}
