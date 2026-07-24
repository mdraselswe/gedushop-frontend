"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import { useWishlist } from "@/context/WishlistContext";
import type { StoreProduct } from "@/lib/types";
import { apiFetch, STORE_API } from "@/lib/api";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch(`${STORE_API}/products?include=${ids.join(",")}&per_page=100`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: StoreProduct[]) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ids]);

  return (
    <div className="px-4 pt-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-plum-800">My Wishlist</h1>

      {loading ? (
        <div className="mt-4">
          <ProductGridSkeleton count={6} />
        </div>
      ) : products.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-plum-50">
            <Heart className="size-9 text-plum-300" strokeWidth={1.75} />
          </span>
          <p className="font-semibold text-plum-500">Your wishlist is empty</p>
          <Link href="/shop" className="rounded-full bg-coral-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-coral-600">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <ProductGrid products={products} />
        </div>
      )}
    </div>
  );
}
