"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, PackageSearch } from "lucide-react";
import type { StoreCategory } from "@/lib/types";
import { HomeIcon, ShopIcon } from "./Icons";
import CategorySheet from "./CategorySheet";

export default function BottomNav({ categories }: { categories: StoreCategory[] }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const [sheetOpen, setSheetOpen] = useState(false);

  const itemCls = (active: boolean) =>
    `relative flex flex-col items-center gap-1 py-2 text-[11px] font-bold transition-colors ${
      active ? "text-coral-500" : "text-plum-400"
    }`;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-plum-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-4">
          {/* Home */}
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={itemCls(pathname === "/")}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${pathname === "/" ? "bg-coral-50" : ""}`}>
              <HomeIcon className="size-5.5" />
            </span>
            Home
          </Link>

          {/* Shop */}
          <Link href="/shop" aria-current={pathname === "/shop" ? "page" : undefined} className={itemCls(pathname === "/shop")}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${pathname === "/shop" ? "bg-coral-50" : ""}`}>
              <ShopIcon className="size-5.5" />
            </span>
            Shop
          </Link>

          {/* Categories — opens bottom sheet */}
          <button onClick={() => setSheetOpen(true)} className={itemCls(sheetOpen)} aria-label="Browse categories">
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${sheetOpen ? "bg-coral-50" : ""}`}>
              <LayoutGrid className="size-5.5" strokeWidth={2} />
            </span>
            Categories
          </button>

          {/* Track Order */}
          <Link href="/track" aria-current={pathname === "/track" ? "page" : undefined} className={itemCls(pathname === "/track")}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full ${pathname === "/track" ? "bg-coral-50" : ""}`}>
              <PackageSearch className="size-5.5" strokeWidth={2} />
            </span>
            Track
          </Link>
        </div>
      </nav>

      <CategorySheet open={sheetOpen} onClose={() => setSheetOpen(false)} categories={categories} />
    </>
  );
}
