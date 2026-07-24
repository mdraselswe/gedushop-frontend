"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";

export default function HeaderWishlistButton() {
  const { count } = useWishlist();
  return (
    <Link
      href="/wishlist"
      aria-label="Wishlist"
      className="relative flex size-10 items-center justify-center rounded-full text-plum-600 transition-colors hover:bg-plum-50"
    >
      <Heart className="size-5" strokeWidth={2.25} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-extrabold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
