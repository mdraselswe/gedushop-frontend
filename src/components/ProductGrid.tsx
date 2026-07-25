import { PackageOpen } from "lucide-react";
import type { StoreProduct } from "@/lib/types";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";

export default function ProductGrid({
  products,
  reveal = false,
}: {
  products: StoreProduct[];
  reveal?: boolean;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl bg-white p-12 text-center text-sm font-semibold text-plum-400 shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50">
        <PackageOpen className="size-10 text-plum-200" strokeWidth={1.5} />
        No products found
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 min-[381px]:grid-cols-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((p, i) =>
        reveal ? (
          <Reveal key={p.id} index={i}>
            <ProductCard product={p} />
          </Reveal>
        ) : (
          <ProductCard key={p.id} product={p} />
        ),
      )}
    </div>
  );
}
