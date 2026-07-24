"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";

export default function WishlistButton({ productId }: { productId: number }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggle(productId);
      }}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-transform hover:bg-white active:scale-90"
    >
      <Heart
        className={`size-4 transition-all duration-200 ${saved ? "scale-110 fill-coral-500 text-coral-500" : "text-plum-400"}`}
        strokeWidth={2.25}
      />
    </button>
  );
}
