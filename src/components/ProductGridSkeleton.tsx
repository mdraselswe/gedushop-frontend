"use client";

import { useCart } from "@/context/CartContext";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

/** Card-shaped skeletons matching ProductGrid layout — shown while products load. */
export default function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  const { drawerOpen } = useCart();

  return (
    <div
      className={`grid grid-cols-1 gap-3 min-[381px]:grid-cols-2 sm:grid-cols-3 md:gap-4 ${
        drawerOpen
          ? "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          : "lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      }`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
